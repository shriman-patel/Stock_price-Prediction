import numpy as np
import pandas as pd
import yfinance as yf
import pytz
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input
from tensorflow.keras.callbacks import EarlyStopping
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from fastapi import Depends
from passlib.context import CryptContext
from jose import jwt
from pydantic import BaseModel


app = FastAPI()
# ==============================
# DATABASE SETUP
# ==============================
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str
DATABASE_URL = "sqlite:///./stocks.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

SECRET_KEY = "secretkey123"

ALGORITHM = "HS256"
# Purana rate 95.60 hata kar real rate ke paas rakhein (optional)
INR_RATE = 83.50 

def get_converted_price(price, ticker):
    ticker = ticker.upper()
    # Agar ticker ke end mein .NS (NSE) ya .BO (BSE) hai, toh conversion mat karo
    if ticker.endswith(".NS") or ticker.endswith(".BO"):
        return price 
    # Agar US stock hai, toh INR mein convert karo
    return price * INR_RATE


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ==============================
# DATABASE MODELS
# ==============================

class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String)

    email = Column(String, unique=True)

    password = Column(String)


class Portfolio(Base):

    __tablename__ = "portfolio"

    id = Column(Integer, primary_key=True, index=True)

    ticker = Column(String)

    quantity = Column(Integer)

    buy_price = Column(Float)

    user_id = Column(Integer)

Base.metadata.create_all(bind=engine)

def get_market_info(ticker):
    ticker = ticker.upper()
    tz = pytz.timezone('Asia/Kolkata') if (ticker.endswith(".NS") or ticker.endswith(".BO")) else pytz.timezone('US/Eastern')
    now = datetime.now(tz)
    m_start_h, m_start_m = (9, 15) if "Kolkata" in str(tz) else (9, 30)
    m_end_h, m_end_m = (15, 30) if "Kolkata" in str(tz) else (16, 0)
    if now.weekday() >= 5: return "CLOSED"
    start_time = now.replace(hour=m_start_h, minute=m_start_m, second=0, microsecond=0)
    end_time = now.replace(hour=m_end_h, minute=m_end_m, second=0, microsecond=0)
    return "OPEN" if start_time <= now <= end_time else "CLOSED"

def build_lstm_model(input_shape):
    model = Sequential([
        Input(shape=input_shape),
        LSTM(units=50, return_sequences=True),
        Dropout(0.1),
        LSTM(units=50, return_sequences=False),
        Dropout(0.1),
        Dense(units=3) # High, Low, Close
    ])
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model


# ==============================
# REGISTER
# ==============================

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_password = pwd_context.hash(user.password[:72])

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()

    return {"message": "User Registered"}
# ==============================
# LOGIN
# ==============================

@app.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    db_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid Email"
        )

    if not pwd_context.verify(
        user.password,
        db_user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid Password"
        )

    token = jwt.encode(
        {"user_id": db_user.id},
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "access_token": token,
        "user_id": db_user.id
    }

# ==============================
# ADD PORTFOLIO
# ==============================

@app.post("/portfolio/add")

def add_portfolio(
    data: dict,
    db: Session = Depends(get_db)
):

    portfolio = Portfolio(

        ticker=data["ticker"],

        quantity=data["quantity"],

        buy_price=data["buy_price"],

        user_id=data["user_id"]
    )

    db.add(portfolio)

    db.commit()

    return {

        "message": "Stock Added"
    }
# ==============================
# GET PORTFOLIO
# ==============================

@app.get("/portfolio/{user_id}")

def get_portfolio(
    user_id: int,
    db: Session = Depends(get_db)
):

    data = db.query(Portfolio).filter(

        Portfolio.user_id == user_id

    ).all()

    return data


# @app.get("/data/{ticker}/{range}")
# def get_historical_data(ticker: str, range: str):
#     try:
#         stock = yf.Ticker(ticker)
#         periods = {"1d": ("1d", "1m"), "7d": ("7d", "1h"), "15d": ("15d", "1d"), "30d": ("1mo", "1d")}
#         if range not in periods: raise HTTPException(400, "Invalid range")
        
#         df = stock.history(period=periods[range][0], interval=periods[range][1])
#         if df.empty: raise HTTPException(404, "Ticker not found")

#         result = []
#         for index, row in df.iterrows():
#             result.append({
#                 # Frontend sync ke liye date format ko simple rakha hai
#                 "Date": index.strftime("%Y-%m-%d %H:%M"),
#                 "Price": round(float(row['Close']), 2),
#                 "isPrediction": False
#             })
#         return result
#     except Exception as e:
#         raise HTTPException(500, str(e))

@app.get("/data/{ticker}/{range}")
def get_historical_data(ticker: str, range: str):
    try:
        stock = yf.Ticker(ticker)
        periods = {
            "1d": ("1d", "1m"),
            "7d": ("7d", "1h"),
            "15d": ("15d", "1d"),
            "30d": ("30d", "1d")
        }

        df = stock.history(period=periods[range][0], interval=periods[range][1])

        if df.empty:
            raise HTTPException(404, "No data found")


        result = []

        for index, row in df.iterrows():
            result.append({
                "Date": index.strftime("%Y-%m-%d %H:%M"),
                "Price": round(get_converted_price(float(row["Close"]), ticker), 2),
                "type": "history"   # 👈 IMPORTANT FLAG
            })

        return result

    except Exception as e:
        raise HTTPException(500, str(e))
# sell stock
@app.post("/portfolio/sell")

def sell_stock(
    data: dict,
    db: Session = Depends(get_db)
):

    stock = db.query(Portfolio).filter(

        Portfolio.user_id == data["user_id"],
        Portfolio.ticker == data["ticker"]

    ).first()

    if not stock:

        raise HTTPException(
            status_code=404,
            detail="Stock not found"
        )

    if stock.quantity < data["quantity"]:

        raise HTTPException(
            status_code=400,
            detail="Not enough shares"
        )

    stock.quantity -= data["quantity"]

    if stock.quantity == 0:

        db.delete(stock)

    db.commit()

    return {
        "message": "Stock Sold"
    }


@app.get("/predict/{ticker}")
def predict_stock(ticker: str):
    try:
        ticker = ticker.upper()
        stock = yf.Ticker(ticker)
        info = stock.info or {}

        df = stock.history(period="2y", interval="1d")

        if len(df) < 60:
            raise HTTPException(400, "Not enough data")
        
        open_price = df["Open"].iloc[-1] * INR_RATE

        data_filtered = df[['High', 'Low', 'Close']].values
        # Indian Rupee Conversion Rate
        
        current_price_usd = (
          stock.fast_info.get('lastPrice')
          if hasattr(stock, "fast_info") and stock.fast_info
          else info.get("regularMarketPrice", 0)
        )
        
           # Convert Current Price to INR
        
        current_price_inr = round(get_converted_price(current_price_usd, ticker), 2)
        open_price = round(get_converted_price(df["Open"].iloc[-1], ticker), 2)
        # current_price_inr = round(current_price_usd * INR_RATE, 2)

        scaler = MinMaxScaler()
        scaled_data = scaler.fit_transform(data_filtered)
        lookback = 60
        model_path = f"model_{ticker}.h5"

        if os.path.exists(model_path):
            model = load_model(model_path)
        else:
            X_train = np.array([scaled_data[i-lookback:i] for i in range(lookback, len(scaled_data))])
            y_train = np.array([scaled_data[i] for i in range(lookback, len(scaled_data))])
            model = build_lstm_model((lookback, 3))
            model.fit(X_train, y_train, epochs=5, batch_size=32, verbose=0)
            model.save(model_path)

        forecast = []
        last_batch = scaled_data[-lookback:].reshape(1, lookback, 3)
        last_date = df.index[-1]

        for i in range(30):
            pred = model.predict(last_batch, verbose=0)
            price_unscaled = scaler.inverse_transform(pred)[0]
            last_date += timedelta(days=1)
            while last_date.weekday() >= 5: last_date += timedelta(days=1)

            # Saara forecast data INR mein convert kar rahe hain
          # predict_stock function ke loop ke andar:
            forecast.append({
              "Date": last_date.strftime('%Y-%m-%d'),
              "Price": round(get_converted_price(float(price_unscaled[2]), ticker), 2),
              "Predicted": round(get_converted_price(float(price_unscaled[2]), ticker), 2),        
              "Max": round(get_converted_price(float(price_unscaled[0]), ticker), 2),
              "Min": round(get_converted_price(float(price_unscaled[1]), ticker), 2),   # 'Min' rakhein
              "type": "prediction"
             })

            last_batch = np.append(last_batch[:, 1:, :], pred.reshape(1, 1, 3), axis=1)

        change = ((forecast[-1]['Predicted'] - current_price_inr) / current_price_inr) * 100

        return {
            "ticker": ticker,
            "market_status": get_market_info(ticker),
            "current_price": current_price_inr, 
            "recommendation": "BUY" if change > 2 else "SELL" if change < -2 else "HOLD",
            "expected_return": f"{round(change, 2)}%",
            
            "metrics": {
                "open": round(open_price, 2),
                "high": round(get_converted_price(info.get("dayHigh", 0), ticker), 2),
                "low": round(get_converted_price(info.get("dayLow", 0), ticker), 2),
                "volume": info.get("volume", 0),
                "prev_close": round(get_converted_price(info.get("previousClose", 0), ticker), 2)
            },
            "forecast": forecast
        }

    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(500, str(e))