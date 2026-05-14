import React from 'react';

const StockTable = ({ data }) => {
  // Loading ya Empty state handling
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#161b22] p-6 rounded-xl border border-gray-800 text-center">
        <p className="text-gray-500">No data available for the selected range.</p>
      </div>
    );
  }

  // Logic: Agar prediction hai toh hum reverse karke dikhayenge taaki future upar dikhe.
  // Hum slice(0, 30) kar sakte hain taaki kam se kam 1 mahine ka data dikhe.
  const displayData = [...data].reverse().slice(0, 30);

  return (
    <div className="bg-[#161b22] rounded-xl border border-gray-800 overflow-hidden shadow-xl">
      <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1c2128]">
        <div>
          <h2 className="text-lg font-bold text-white">Market Analysis & Forecast</h2>
          <p className="text-[10px] text-gray-500 font-mono">Showing latest records and AI predictions</p>
        </div>
        <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded font-bold tracking-tighter">
          LIVE FEED
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#0d1117] text-gray-400 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">High (Est.)</th>
              <th className="px-6 py-4">Low (Est.)</th>
              <th className="px-6 py-4">Close Price</th>
              <th className="px-6 py-4 text-right">Volume</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {displayData.map((item, index) => (
              <tr 
                key={index} 
                className={`transition-colors group ${
                  item.isPrediction ? "bg-blue-500/[0.02] hover:bg-blue-500/10" : "hover:bg-gray-700/30"
                }`}
              >
                <td className={`px-6 py-4 font-mono ${item.isPrediction ? "text-blue-400" : "text-gray-300"}`}>
                  {item.Date || "N/A"}
                </td>
                
                {/* High Price Column */}
                <td className="px-6 py-4 text-green-500">
                  ${item.High?.toFixed(2) || "0.00"}
                </td>

                {/* Low Price Column */}
                <td className="px-6 py-4 text-red-500">
                  ${item.Low?.toFixed(2) || "0.00"}
                </td>

                {/* Close Price Column with AI Badge */}
                <td className={`px-6 py-4 font-bold ${item.isPrediction ? "text-blue-400" : "text-white"}`}>
                  ${item.Close?.toFixed(2) || "0.00"}
                  {item.isPrediction && (
                    <span className="ml-2 text-[7px] bg-blue-500/20 text-blue-400 border border-blue-500/40 px-1.5 py-0.5 rounded-sm uppercase tracking-widest font-black">
                      AI
                    </span>
                  )}
                </td>

                {/* Volume Column */}
                <td className="px-6 py-4 text-right text-gray-500 font-mono text-xs">
                  {item.isPrediction ? "—" : (item.Volume ? Number(item.Volume).toLocaleString() : "0")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer hint */}
      <div className="bg-[#0d1117] px-6 py-3 border-t border-gray-800">
         <p className="text-[9px] text-gray-600 uppercase tracking-widest">
           * High/Low for AI predictions represent calculated resistance and support zones.
         </p>
      </div>
    </div>
  );
};

export default StockTable;