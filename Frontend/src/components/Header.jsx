import React from 'react';
import { Link, useNavigate } from "react-router-dom";

const Header = ({ ticker, setTicker, onPredict, loading, marketStatus, latestPrice,isAuthenticated,
setIsAuthenticated, searchRef ,onSearch,
  suggestions = [],   // ✅ DEFAULT FIX

setSuggestions    }) => {
const navigate = useNavigate();
  const handleLogout = () => {

  localStorage.removeItem("token");

  localStorage.removeItem("user_id");

  setIsAuthenticated(false);

  navigate("/");
};
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-6 w-full">
      {/* 1. Search Section */}
<div className="flex items-center gap-3">

  <div className="relative group w-full max-w-md">

    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
      🔍
    </span>

    <input 
    ref={searchRef}
      type="text" 
      value={ticker}
onChange={(e) => onSearch(e.target.value)}
onKeyDown={(e) => {
  if (e.key === "Enter") {

    if (suggestions.length > 0) {
      setTicker(suggestions[0].symbol);
    } else {
      setTicker(ticker.toUpperCase());
    }

    setSuggestions([]);

    onPredict();
  }
}}


placeholder="Search stocks (e.g., RELIANCE.NS, AAPL)"
      className="w-full bg-[#1e293b] border border-gray-800 text-sm py-3 pl-12 pr-4 rounded-2xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white"
   
   />
  {(suggestions || []).length > 0 &&  (
  <div className="absolute left-0 right-0 mt-2 bg-[#0f172a] border border-gray-700 rounded-xl z-50 max-h-60 overflow-y-auto">
    {suggestions.map((stock, index) => (
      <div
        key={index}
        onClick={() => {
          setTicker(stock.symbol);
          setSuggestions([]);
            onPredict();

        }}
        className="px-4 py-2 hover:bg-gray-800 cursor-pointer text-sm"
      >
        <div className="font-bold text-white">{stock.symbol}</div>
        <div className="text-gray-400 text-xs">{stock.name}</div>
      </div>
    ))}
  </div>
)}

  </div>

  <button 
    onClick={onPredict}
    disabled={loading}
    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap"
  >
    {loading ? "Processing..." : "Search Stock"}
  </button>

</div>


      {/* 2. Market Status & Quick Info */}
      <div className="flex items-center gap-8">
        <div className="flex flex-col">
  
  <div className="flex items-center gap-2">

    <span
      className={`w-2 h-2 rounded-full ${
        marketStatus === "OPEN"
          ? "bg-green-500 animate-pulse"
          : "bg-red-500"
      }`}
    ></span>

    <span className="text-xs font-black uppercase tracking-widest text-gray-400">
      Market {marketStatus}
    </span>

  </div>

  <p className="text-[10px] text-gray-600 font-mono mt-1">
    {new Date().toLocaleTimeString("en-IN", { hour12: true })} IST
  </p>

</div>
<div className="flex items-center gap-3">



  {/* AUTH BUTTONS */}
  {!isAuthenticated ? (
    <>
      <Link to="/login">
        <button className="px-4 py-2 text-white border rounded-xl">
          Login
        </button>
      </Link>

      <Link to="/register">
        <button className="px-4 py-2 text-gray-300 border rounded-xl">
          Register
        </button>
      </Link>
    </>
  ) : (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-600 text-white rounded-xl"
    >
      Logout
    </button>
  )}

</div>
      </div>
    </div>
  );
};

export default Header;