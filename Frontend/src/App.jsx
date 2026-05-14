import { useEffect, useState, useCallback } from "react";
import axios from "axios";

import Header from "./components/Header";
import Ticker from "./components/Ticker";
import StockChart from "./components/StockChart";
import StockTable from "./components/StockTable";
import Sidebar from "./components/Sidebar";
import PredictionChart from "./components/PredictionChart";
import ForecastTable from "./components/ForecastTable";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Portfolio from "./pages/Portfolio";

import { useRef } from "react";


import "./App.css";


import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

const STOCKS = [
  { symbol: "AAPL", name: "Apple Inc" },
  { symbol: "TSLA", name: "Tesla Inc" },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Google" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "META", name: "Meta Platforms Facebook" },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "NFLX", name: "Netflix" },
  { symbol: "BRK-B", name: "Berkshire Hathaway" },
  { symbol: "JPM", name: "JP Morgan Chase" },
  { symbol: "V", name: "Visa Inc" },
  { symbol: "MA", name: "Mastercard" },
  { symbol: "DIS", name: "Disney" },
  { symbol: "INTC", name: "Intel Corporation" },
  { symbol: "AMD", name: "Advanced Micro Devices" },

  // 🇮🇳 Indian Stocks
  { symbol: "TCS.NS", name: "Tata Consultancy Services" },
  { symbol: "INFY.NS", name: "Infosys" },
  { symbol: "RELIANCE.NS", name: "Reliance Industries" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank" },
  { symbol: "SBIN.NS", name: "State Bank of India" },
  { symbol: "ITC.NS", name: "ITC Limited" },
  { symbol: "LT.NS", name: "Larsen & Toubro" },
  { symbol: "WIPRO.NS", name: "Wipro" },
  { symbol: "BHARTIARTL.NS", name: "Airtel" }
];

function App() {

  const [ticker, setTicker] = useState("AAPL");

  const [data, setData] = useState([]);

  const [prediction, setPrediction] = useState(null);

  const [loading, setLoading] = useState(false);

  const [marketStatus, setMarketStatus] = useState("CLOSED");

  const [latestPrice, setLatestPrice] = useState(0);

  const [activeTab, setActiveTab] = useState("Live Market");

  const [range, setRange] = useState("1d");

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const searchRef = useRef(null);

  const [suggestions, setSuggestions] = useState([]);

const handleSearch = (value) => {
  setTicker(value.toUpperCase());

  if (!value) {
    setSuggestions([]);
    return;
  }

  const input = value.trim().toLowerCase();

  // 1. Smart filtering
  const filtered = STOCKS.filter((stock) => {
    return (
      stock.symbol.toLowerCase().includes(input) ||
      stock.name.toLowerCase().includes(input)
    );
  });

  // 2. Limit results (important for UI clean)
  const topResults = filtered.slice(0, 6);

  setSuggestions(topResults);

  // 3. Auto-correct only when confident
  if (
    input.length > 3 &&
    filtered.length > 0 &&
    filtered[0].symbol.toLowerCase().startsWith(input)
  ) {
    setTicker(filtered[0].symbol);
  }
};

useEffect(() => {

  const token = localStorage.getItem("token");

  if (token) {

    setIsAuthenticated(true);

  }

}, []); 

  const fetchPrediction = useCallback(() => {
    if (!ticker) return;
    setLoading(true);
const dataUrl = `https://stock-price-prediction-46mf.onrender.com/data/${ticker}/${range}`;
const predictUrl = `https://stock-price-prediction-46mf.onrender.com/predict/${ticker}`;
    Promise.all([axios.get(dataUrl), axios.get(predictUrl)])
        .then(([historyRes, predictRes]) => {
            const historicalData = historyRes.data;
            const forecastData = predictRes.data.forecast; // Backend se aya hua array

            // 1. Current Price and Status
            const currentPrice = predictRes.data.current_price;
            setMarketStatus(predictRes.data.market_status);
            setLatestPrice(currentPrice);

            // 2. Format Forecast (Ensuring keys match Backend)
            const formattedForecast = forecastData.map(item => ({
                ...item,
                Price: item.Price || item.Predicted, // Fallback if key missing
                type: "prediction"
            }));

            // 3. Update States separately to avoid mixing
            // Live Market Graph ke liye sirf history
            setData(historicalData.map(h => ({ ...h, type: "history" })));

            // AI Prediction state update (for Table and Prediction Chart)
            setPrediction({ 
                ...predictRes.data, 
                forecast: formattedForecast 
            });

            setLoading(false);
        })
        .catch((err) => {
            console.error("API Error:", err);
            setLoading(false);
        });
}, [ticker, range]);

  useEffect(() => {

    fetchPrediction();

  }, [fetchPrediction]);

  return (

    <BrowserRouter>

      <Routes>

        {/* MAIN DASHBOARD */}

        <Route

          path="/"

          element={

            <div className="flex h-screen bg-[#09090b] text-gray-200 overflow-hidden font-sans">

              {/* SIDEBAR */}

              <Sidebar

                activeTab={activeTab}

                setActiveTab={setActiveTab}

                  searchRef={searchRef}

              />

              {/* MAIN CONTENT */}

              <div className="flex-1 flex flex-col overflow-y-auto bg-gradient-to-br from-[#09090b] to-[#121217]">

                {/* HEADER */}

                <header className="sticky top-0 z-50 backdrop-blur-lg bg-[#09090b]/80 border-b border-gray-800 p-4 px-8">

                  <Header

  ticker={ticker}

  setTicker={setTicker}

  searchRef={searchRef}

  onSearch={handleSearch}
  suggestions={suggestions}
  setSuggestions={setSuggestions}
  onPredict={() => {

    fetchPrediction();

    setActiveTab(
      "Live Market"
    );

  }}

  loading={loading}

  isAuthenticated={isAuthenticated}

  setIsAuthenticated={setIsAuthenticated}

/>

                </header>

                {/* MAIN */}

                <main className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">

                  {/* TICKER */}

                <Ticker
  ticker={ticker}
  latestPrice={latestPrice}
  marketStatus={marketStatus}
  userId={localStorage.getItem("user_id")}
  prediction={prediction}
/>

                  {/* LIVE MARKET */}

                  {(activeTab === "Live Market" ||

                    activeTab === "Search Stock") && (

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">

                      {/* LEFT */}

                      <div className="lg:col-span-2 space-y-8">

                        {/* CHART CARD */}

                        <div className="bg-[#121217] border border-gray-800 p-8 rounded-3xl shadow-2xl">

                          {/* RANGE BUTTONS */}

                          <div className="flex gap-3 mb-6">

                            <button

                              onClick={() =>
                                setRange("1d")
                              }

                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all
                              ${range === "1d"
                                  ? "bg-blue-500 text-white"
                                  : "bg-[#1a1a1f] text-gray-400 hover:bg-[#22222a]"
                                }`}
                            >

                              TODAY

                            </button>

                            <button

                              onClick={() =>
                                setRange("7d")
                              }

                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all
                              ${range === "7d"
                                  ? "bg-blue-500 text-white"
                                  : "bg-[#1a1a1f] text-gray-400 hover:bg-[#22222a]"
                                }`}
                            >

                              7D

                            </button>

                            <button

                              onClick={() =>
                                setRange("15d")
                              }

                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all
                              ${range === "15d"
                                  ? "bg-blue-500 text-white"
                                  : "bg-[#1a1a1f] text-gray-400 hover:bg-[#22222a]"
                                }`}
                            >

                              15D

                            </button>

                            <button

                              onClick={() =>
                                setRange("30d")
                              }

                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all
                              ${range === "30d"
                                  ? "bg-blue-500 text-white"
                                  : "bg-[#1a1a1f] text-gray-400 hover:bg-[#22222a]"
                                }`}
                            >

                              30D

                            </button>

                          </div>

                          {/* CHART */}

                          <div className="h-[400px]">

                           <StockChart data={data.filter(d => d.type === "history")} />

                          </div>

                        </div>

                        {/* TABLE */}
{/* 
                        <StockTable
                          data={data.filter(d => d.type === "history")}
                        /> */}

                      </div>

                      {/* RIGHT */}

                      <aside className="space-y-8">

                        <div className="bg-[#121217] border border-gray-800 p-6 rounded-3xl shadow-lg">

                          <h3 className="text-xs font-black text-gray-500 uppercase mb-6 border-b border-gray-800 pb-4">

                            Real-Time Stats

                          </h3>

                          <div className="space-y-5">

                            <MetricRow
                              label="Period High"
                              value={`₹${prediction?.metrics?.high || "0"}`}
                            />

                            <MetricRow
                              label="Period Low"
                              value={`₹${prediction?.metrics?.low || "0"}`}
                            />

                            <MetricRow
                              label="Avg Volume"
                              value={`₹${prediction?.metrics?.volume || "N/A"}`}
                            />

                            <MetricRow
                              label="Market Status"
                              value={marketStatus}
                              color={
                                marketStatus === "OPEN"
                                  ? "text-green-400"
                                  : "text-red-400"
                              }
                            />

                          </div>

                        </div>

                      </aside>

                    </div>
                  )}

                  {/* AI PREDICTION */}

                  {activeTab === "AI Prediction" && (

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-700">

                      <div className="lg:col-span-2 space-y-8">

                        {prediction && (

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl">

                              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">

                                Target Price (30D)

                              </p>

                              <h2 className="text-4xl font-bold text-emerald-400">

                                ₹
                                {prediction.forecast?.[
                                  prediction.forecast.length - 1
                                ]?.Predicted || "0.00"}

                              </h2>

                            </div>

                            {/* <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-3xl">

                         

                              <h2 className="text-4xl font-black text-blue-400">

                                {
                                  prediction.recommendation?.confidence
                                }

                              </h2>

                            </div> */}

                          </div>
                        )}

                        {/* AI CHART */}

                        <div className="bg-[#121217] border border-gray-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">

                          <div className="mb-8">

                            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">

                              AI Neural Projection

                            </h2>

                            <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">

                              Future 30 Days Estimated Trend

                            </p>

                          </div>

                          <div className="h-[420px]">

                            <PredictionChart
                              forecastData={prediction?.forecast}
                            />

                          </div>

                        </div>

                      </div>

                      {/* FORECAST TABLE */}

                      <div className="lg:col-span-1">

                        <ForecastTable
                          forecast={prediction?.forecast}
                        />

                      </div>

                    </div>
                  )}

                </main>

              </div>

            </div>
          }
        />

        {/* LOGIN */}

   <Route
  path="/login"
  element={
    !isAuthenticated ? (
      <Login
        setIsAuthenticated={setIsAuthenticated}
      />
    ) : (
      <Navigate to="/" />
    )
  }
/>

        {/* REGISTER */}
<Route
  path="/register"
  element={
    !isAuthenticated
      ? <Register />
      : <Navigate to="/" />
  }
/>

        {/* PORTFOLIO */}

     <Route path="/portfolio" element={<Portfolio />} />

      </Routes>

    </BrowserRouter>
  );
}

/* HELPER */

const MetricRow = ({
  label,
  value,
  color = "text-white"
}) => (

  <div className="flex justify-between items-center">

    <span className="text-gray-500 text-[11px] font-bold uppercase tracking-tight">

      {label}

    </span>

    <span className={`font-mono text-xs font-bold ${color}`}>

      {value}

    </span>

  </div>
);

export default App;