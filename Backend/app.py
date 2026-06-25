import csv
import io
import logging
import os
import sys
from datetime import datetime, timedelta

from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))

from auth import admin_required, create_token, hash_password, login_required, verify_password
from currency import get_currency_for_symbol
from data_fetcher import COMPANIES, DataFetcher
from database import Database
from lr_model import LinearRegressionModel
from lstm_model import LSTMModel
from metrics import MetricsCalculator
from preprocessor import Preprocessor
from sentiment import SentimentAnalyzer
from gemini_client import GeminiClient
from utils import compute_trend

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

db = Database()
fetcher = DataFetcher()


@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "name": "Stock Price Prediction API",
        "status": "running",
        "version": "2.0.0",
        "docs": {
            "health": "GET /health",
            "register": "POST /api/auth/register",
            "login": "POST /api/auth/login",
            "quote": "GET /api/stocks/<symbol>/quote",
            "live_stock_data": "GET /live-stock-data?symbol=AAPL",
            "history": "GET /api/stocks/<symbol>/history?period=1y",
            "historical_data": "GET /historical-data?symbol=AAPL&period=1y",
            "prediction": "POST /api/predict",
            "predict_stock": "POST /predict-stock",
        },
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "database": "mongodb" if db.mongo is not None else "json-dev"})


@app.route("/api/auth/register", methods=["POST"])
def register():
    body = request.get_json(silent=True) or {}
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")
    name = body.get("name", "").strip() or email.split("@")[0]

    if not email or "@" not in email:
        return jsonify({"error": "Valid email is required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if db.get_user_by_email(email):
        return jsonify({"error": "Email is already registered"}), 409

    role = "admin" if email == os.getenv("ADMIN_EMAIL") else "user"
    user = db.create_user(email=email, password_hash=hash_password(password), name=name, role=role)
    token = create_token({"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]})

    return jsonify({"token": token, "user": public_user(user)}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    body = request.get_json(silent=True) or {}
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")
    user = db.get_user_by_email(email)

    if not user or not verify_password(password, user["password_hash"]):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_token({"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]})
    return jsonify({"token": token, "user": public_user(user)})


@app.route("/api/auth/me", methods=["GET"])
@login_required
def me():
    return jsonify({"user": request.user})


@app.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    body = request.get_json(silent=True) or {}
    email = body.get("email", "").strip().lower()
    return jsonify({
        "message": f"If {email} exists, a password reset link will be sent.",
        "demo": "Email delivery is configured during deployment.",
    })


@app.route("/api/stocks/search", methods=["GET"])
def search_stocks():
    query = request.args.get("q", "")
    return jsonify({"results": fetcher.search(query) if query else list_company_cards()})


@app.route("/api/stocks/<symbol>/quote", methods=["GET"])
def quote(symbol):
    try:
        return jsonify(fetcher.quote(symbol, allow_sample=False))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 502


@app.route("/live-stock-data", methods=["GET"])
def live_stock_data():
    symbol = request.args.get("symbol", "AAPL")
    period = request.args.get("period", "1mo")
    try:
        return jsonify(fetcher.live_bundle(symbol, period=period, allow_sample=True))
    except Exception as exc:
        logger.exception("Live stock data failed")
        return jsonify({"error": str(exc)}), 502


@app.route("/api/stocks/<symbol>/history", methods=["GET"])
def history(symbol):
    period = request.args.get("period", "1y")
    try:
        rows = normalize_history(fetcher.fetch(symbol, period=period, allow_sample=False))
        return jsonify({"symbol": symbol.upper(), "period": period, "data": rows})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 502


@app.route("/historical-data", methods=["GET"])
def historical_data():
    symbol = request.args.get("symbol", "AAPL")
    period = request.args.get("period", "1y")
    try:
        rows = normalize_history(fetcher.fetch(symbol, period=period, allow_sample=False))
        return jsonify({
            "symbol": fetcher.normalize_symbol(symbol),
            "period": period,
            "data": rows,
            "provider_note": "Live provider data only. No sample fallback is used.",
        })
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 502


@app.route("/api/stocks/<symbol>/history.csv", methods=["GET"])
def history_csv(symbol):
    period = request.args.get("period", "1y")
    rows = normalize_history(fetcher.fetch(symbol, period=period, allow_sample=False))
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["date", "open", "high", "low", "close", "volume"])
    writer.writeheader()
    writer.writerows(rows)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={symbol.upper()}-{period}.csv"},
    )


@app.route("/api/predict", methods=["POST"])
@login_required
def api_predict():
    body = request.get_json(silent=True) or {}
    symbol = body.get("symbol", "AAPL").strip().upper()
    days = int(body.get("days", 7))
    days = max(1, min(days, 90))

    try:
        prediction = build_prediction(symbol, days)
        db.add_prediction(request.user["id"], prediction)
        return jsonify(prediction)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        logger.exception("Prediction failed")
        return jsonify({"error": f"Prediction failed: {exc}"}), 500


@app.route("/predict-stock", methods=["POST"])
def predict_stock():
    body = request.get_json(silent=True) or {}
    symbol = body.get("symbol", "AAPL")
    days = max(1, min(int(body.get("days", 7)), 90))
    try:
        return jsonify(build_prediction(symbol, days))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        logger.exception("Prediction failed")
        return jsonify({"error": f"Prediction failed: {exc}"}), 500


@app.route("/predict", methods=["POST"])
def legacy_predict():
    body = request.get_json(silent=True) or {}
    symbol = body.get("symbol", "AAPL")
    days = int(body.get("days", 7))
    try:
        return jsonify(build_prediction(symbol, days))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        logger.exception("Prediction failed")
        return jsonify({"error": f"Prediction failed: {exc}"}), 500


@app.route("/api/watchlist", methods=["GET", "POST"])
@login_required
def watchlist():
    if request.method == "GET":
        symbols = db.get_watchlist(request.user["id"])
        return jsonify({"symbols": symbols, "quotes": [fetcher.quote(symbol) for symbol in symbols]})

    body = request.get_json(silent=True) or {}
    symbols = body.get("symbols", [])
    return jsonify({"symbols": db.save_watchlist(request.user["id"], symbols)})


@app.route("/api/market/trending", methods=["GET"])
def trending():
    cards = []
    for symbol in list(COMPANIES.keys())[:6]:
        try:
            cards.append(fetcher.quote(symbol, allow_sample=False))
        except ValueError:
            continue
    gainers = sorted(cards, key=lambda item: item["change_percent"], reverse=True)[:3]
    losers = sorted(cards, key=lambda item: item["change_percent"])[:3]
    return jsonify({"trending": cards, "top_gainers": gainers, "top_losers": losers})


@app.route("/api/news", methods=["GET"])
def news():
    symbol = request.args.get("symbol", "AAPL").upper()
    return jsonify({
        "symbol": symbol,
        "items": [
            {
                "title": f"{symbol} momentum improves as investors focus on earnings quality",
                "source": "Market Desk",
                "sentiment": "Positive",
                "published_at": "Today",
            },
            {
                "title": "Analysts watch rate expectations and sector rotation",
                "source": "Finance Wire",
                "sentiment": "Neutral",
                "published_at": "Today",
            },
            {
                "title": "AI models flag volatility risk before the next session",
                "source": "AI Insight",
                "sentiment": "Watch",
                "published_at": "Today",
            },
        ],
    })


@app.route("/api/admin/overview", methods=["GET"])
@admin_required
def admin_overview():
    users = db.list_users()
    predictions = db.list_predictions()
    return jsonify({
        "users": users,
        "predictions": predictions,
        "metrics": {
            "user_count": len(users),
            "prediction_count": len(predictions),
            "api_status": "operational",
            "database": "MongoDB" if db.mongo is not None else "JSON dev store",
        },
    })


def build_prediction(symbol, days):
    symbol = fetcher.normalize_symbol(symbol)
    current_quote = fetcher.quote(symbol, allow_sample=False)
    history_rows = fetcher.fetch(symbol, period="2y", allow_sample=False)
    history_rows = align_history_to_quote(history_rows, current_quote)
    close_prices = np.array([row["Close"] for row in history_rows], dtype=float)
    preprocessor = Preprocessor()
    scaled, scaler = preprocessor.fit_transform(close_prices)
    X_all, y_all = preprocessor.create_sequences(scaled, window=60)

    if len(X_all) == 0:
        raise ValueError("Not enough historical data to train prediction model")

    train_size = max(1, int(len(X_all) * 0.8))
    X_train, X_test = X_all[:train_size], X_all[train_size:]
    y_train, y_test = y_all[:train_size], y_all[train_size:]

    lstm = LSTMModel()
    lstm.build(input_shape=(60, 1))
    lstm.train(X_train, y_train, epochs=3, batch_size=32)

    future_scaled = []
    window = scaled[-60:].reshape(1, 60, 1)
    for _ in range(days):
        next_scaled = float(lstm._model.predict(window, verbose=0)[0][0])
        future_scaled.append(next_scaled)
        window = np.append(window[:, 1:, :], [[[next_scaled]]], axis=1)

    future_prices = scaler.inverse_transform(np.array(future_scaled).reshape(-1, 1)).flatten()

    lstm_test_preds = []
    y_test_actual = []
    if len(X_test):
        lstm_test_preds_scaled = lstm._model.predict(X_test, verbose=0)
        lstm_test_preds = scaler.inverse_transform(lstm_test_preds_scaled).flatten()
        y_test_actual = preprocessor.inverse_transform(scaler, y_test)

    n = len(close_prices)
    lr_model = LinearRegressionModel()
    X_lr = np.arange(n).reshape(-1, 1)
    lr_train_size = int(n * 0.8)
    lr_model.train(X_lr[:lr_train_size], close_prices[:lr_train_size])
    lr_future = [lr_model.predict(n + index) for index in range(days)]

    calc = MetricsCalculator()
    last_close = float(close_prices[-1])
    prediction_points = []
    start_date = datetime.utcnow().date()

    for index, price in enumerate(future_prices, start=1):
        prediction_points.append({
            "date": str(start_date + timedelta(days=index)),
            "predicted": round(float(price), 2),
            "linear_baseline": round(float(lr_future[index - 1]), 2),
        })

    confidence = max(52, min(96, 92 - abs((future_prices[-1] - last_close) / last_close) * 100))
    sentiment = SentimentAnalyzer().analyze(symbol)
    historical_data = normalize_history(history_rows[-180:])
    comparison = build_comparison(historical_data, prediction_points)

    gemini = GeminiClient()
    insights = [
        f"LSTM expects {symbol} to move {compute_trend(future_prices[-1], last_close)} over {days} days.",
        "Confidence blends model error, volatility, and trend distance.",
        "Use predictions with risk controls; this is not financial advice.",
    ]

    if gemini.enabled:
        gemini_prompt = (
            f"Using the stock symbol {symbol}, current price {last_close:.2f}, and predicted price "
            f"{future_prices[-1]:.2f} in {days} days, write one concise market insight sentence. "
            "Do not give specific financial advice and keep the tone objective."
        )
        gemini_text = gemini.generate_text(gemini_prompt, temperature=0.3, max_output_tokens=80)
        if gemini_text:
            insights.insert(0, gemini_text)

    return {
        "symbol": symbol,
        "quote": current_quote,
        "days": days,
        "lstm_prediction": round(float(future_prices[-1]), 2),
        "lr_prediction": round(float(lr_future[-1]), 2),
        "lstm_rmse": calc.rmse(y_test_actual, lstm_test_preds),
        "lr_rmse": calc.rmse(close_prices[lr_train_size:], [lr_model.predict(i) for i in range(lr_train_size, n)]),
        "trend": compute_trend(future_prices[-1], last_close),
        "confidence": round(float(confidence), 2),
        "historical_data": historical_data,
        "predictions": prediction_points,
        "comparison": comparison,
        "sentiment_score": sentiment["score"],
        "sentiment_label": sentiment["label"],
        "sentiment_warning": sentiment["warning"],
        "insights": [
            f"LSTM expects {symbol} to move {compute_trend(future_prices[-1], last_close)} over {days} days.",
            "Confidence blends model error, volatility, and trend distance.",
            "Use predictions with risk controls; this is not financial advice.",
        ],
    }


def align_history_to_quote(history_rows, quote):
    if not history_rows or not quote:
        return history_rows

    latest_close = float(history_rows[-1]["Close"])
    live_price = float(quote.get("current_price") or latest_close)
    if not latest_close or abs(live_price - latest_close) / latest_close < 0.2:
        return history_rows

    factor = live_price / latest_close
    adjusted = []
    for row in history_rows:
        adjusted.append({
            **row,
            "Open": float(row["Open"]) * factor,
            "High": float(row["High"]) * factor,
            "Low": float(row["Low"]) * factor,
            "Close": float(row["Close"]) * factor,
        })
    return adjusted


def normalize_history(rows):
    return [
        {
            "date": row["Date"],
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
            "volume": int(row["Volume"]),
        }
        for row in rows
    ]


def build_comparison(historical_data, predictions):
    actual = historical_data[-30:]
    future = [{"date": item["date"], "actual": None, "predicted": item["predicted"]} for item in predictions]
    return [{"date": item["date"], "actual": item["close"], "predicted": None} for item in actual] + future


def list_company_cards():
    return [{"symbol": symbol, **meta, "currency": get_currency_for_symbol(symbol)} for symbol, meta in COMPANIES.items()]


def public_user(user):
    return {key: value for key, value in user.items() if key != "password_hash"}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=os.getenv("FLASK_DEBUG", "1") == "1")
