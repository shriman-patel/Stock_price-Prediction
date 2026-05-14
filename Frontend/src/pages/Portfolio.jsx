import React, { useEffect, useState } from "react";
import axios from "axios";

const Portfolio = () => {
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
  const userId = localStorage.getItem("user_id");

  console.log("User ID:", userId);

  if (!userId) return;

  axios.get(`https://stock-price-prediction-46mf.onrender.com/portfolio/${userId}`)
    .then(res => {
      console.log(res.data);
      setPortfolio(res.data);
    })
    .catch(err => console.log(err));

}, []);

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-6">My Portfolio</h1>

      {stocks.length === 0 ? (
        <p className="text-gray-400">No stocks added yet</p>
      ) : (
        <div className="grid gap-4">
          {stocks.map((item, index) => (
            <div key={index} className="p-4 bg-[#121217] rounded-xl border border-gray-800">
              <h2 className="font-bold">{item.ticker}</h2>
              <p>Qty: {item.quantity}</p>
              <p>Buy Price: ${item.buy_price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Portfolio;