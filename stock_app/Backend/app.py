from flask import Flask, render_template, request
import yfinance as yf
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM

app = Flask(__name__)

def predict_price(ticker):
    # Data fetch karna
    data = yf.download(ticker, period='1y')
    if data.empty:
        return None
    
    df = data[['Close']]
    dataset = df.values
    scaler = MinMaxScaler(feature_range=(0,1))
    scaled_data = scaler.fit_transform(dataset)

    # Simple LSTM Model setup
    X_train, y_train = [], []
    for i in range(60, len(scaled_data)):
        X_train.append(scaled_data[i-60:i, 0])
        y_train.append(scaled_data[i, 0])
    
    X_train, y_train = np.array(X_train), np.array(y_train)
    X_train = np.reshape(X_train, (X_train.shape[0], X_train.shape[1], 1))

    model = Sequential([
        LSTM(50, return_sequences=True, input_shape=(X_train.shape[1], 1)),
        LSTM(50, return_sequences=False),
        Dense(25),
        Dense(1)
    ])
    
    model.compile(optimizer='adam', loss='mean_squared_error')
    model.fit(X_train, y_train, batch_size=1, epochs=1, verbose=0)

    # Next day prediction
    last_60_days = scaled_data[-60:].reshape(1, -1, 1)
    predicted_price = model.predict(last_60_days)
    return scaler.inverse_transform(predicted_price)[0][0]

@app.route('/', methods=['GET', 'POST'])
def index():
    prediction = None
    symbol = None
    if request.method == 'POST':
        symbol = request.form['symbol'].upper()
        prediction = predict_price(symbol)
    return render_template('index.html', prediction=prediction, symbol=symbol)

if __name__ == '__main__':
    app.run(debug=True)