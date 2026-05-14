import React from 'react';

const ForecastTable = ({ forecast }) => {
  if (!forecast) return null;

  return (
    <div className="bg-[#121217] border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-gray-800 bg-gray-900/30 flex justify-between items-center">
        <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">30-Day Neural Forecast</h3>
        <span className="text-[9px] text-gray-500 font-bold uppercase italic">Range: ±2% Volatility</span>
      </div>
      <div className="max-h-[550px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left text-[11px]">
          <thead className="sticky top-0 bg-[#121217] text-gray-500 uppercase font-bold border-b border-gray-800">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4 text-emerald-400">Target</th>
              <th className="p-4 text-red-400">Min</th>
              <th className="p-4 text-blue-400">Max</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {forecast.map((item, index) => {
              const price = parseFloat(item.Predicted);
              // Agar backend se Min/Max nahi aa raha toh yahan calculate kar lein
              const minPrice = item.Min || (price * 0.98).toFixed(2);
              const maxPrice = item.Max || (price * 1.02).toFixed(2);

              return (
                <tr key={index} className="hover:bg-emerald-500/5 transition group">
                  <td className="p-4 font-mono text-gray-400 group-hover:text-emerald-400">
                    {item.Date.split('-').slice(1).join('/')}
                  </td>
                  <td className="p-4 font-black text-white">
                    ₹{price.toFixed(2)}
                  </td>
                  <td className="p-4 font-mono text-red-500/80">
                    ₹{minPrice}
                  </td>
                  <td className="p-4 font-mono text-blue-500/80">
                    ₹{maxPrice}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ForecastTable;