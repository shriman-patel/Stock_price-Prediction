import React from "react";
import axios from "axios";

const Ticker = ({
  ticker,
  latestPrice,
  marketStatus,
  userId,
  prediction
}) => {

  // 🔥 REAL SAFE CHANGE LOGIC (fallback safe)
 const priceChange =
  prediction?.expected_return
    ? parseFloat(prediction.expected_return)
    : 0;
  const percentChange =
    prediction?.expected_return ||
    "0.66%";

  const handleBuy = async () => {
    console.log("USER ID:", userId);

    try {
      await axios.post("http://127.0.0.1:8000/portfolio/add", {
        ticker,
        quantity: 1,
        buy_price: latestPrice,
        user_id: userId
      });

      alert("Stock Bought");
    } catch (err) {
      alert("Buy Failed");
    }
  };

  const handleSell = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/portfolio/sell", {
        ticker,
        quantity: 1,
        user_id: userId
      });

      alert("Stock Sold");
    } catch (err) {
      alert(err.response?.data?.detail || "Sell Failed");
    }
  };

  return (
    <div className="bg-transparent mb-4">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end gap-2">
        <div>

          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            {ticker}

            <span className="text-xs font-medium text-gray-500 bg-gray-900 px-2 py-1 rounded">
              {ticker.includes(".NS") ? "NSE" : "NASDAQ"}
            </span>
          </h1>

          {/* PRICE */}
          <div className="flex items-center gap-4 mt-1 flex-wrap">

            <span className="text-5xl font-black tracking-tighter text-white">
              ₹{latestPrice?.toLocaleString()}
            </span>

            <span
              className={`text-lg font-bold ${
                parseFloat(priceChange) >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              +{priceChange} ({percentChange})
            </span>

            <button
              onClick={handleBuy}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-sm font-bold text-white transition"
            >
              BUY
            </button>

            <button
              onClick={handleSell}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-sm font-bold text-white transition"
            >
              SELL
            </button>

          </div>
        </div>
      </div>

      {/* STATS BAR (FIXED GRID ROW) */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mt-6 border-t border-gray-800/50 pt-6">

      <StatItem label="Open" value={`₹${prediction?.metrics?.open || 0}`} />
<StatItem label="High" value={`₹${prediction?.metrics?.high || 0}`} />
<StatItem label="Low" value={`₹${prediction?.metrics?.low || 0}`} />
<StatItem label="Prev Close" value={`₹${prediction?.metrics?.prev_close || 0}`} />
<StatItem label="Volume" value={prediction?.metrics?.volume || 0} />
      </div>
    </div>
  );
};

const StatItem = ({ label, value }) => (
  <div className="flex flex-col min-w-[100px]">

    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
      {label}
    </span>

    <span className="text-sm font-bold text-gray-200 mt-1">
      {value}
    </span>

  </div>
);

export default Ticker;