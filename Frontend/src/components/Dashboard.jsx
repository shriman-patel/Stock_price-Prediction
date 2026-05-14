import React, { useState } from 'react';
import Auth from './Auth';
import StatsCards from './StatsCards';
import StockChart from './StockChart'; // Aapki pichli Chart file
import PortfolioTables from './PortfolioTables';

const Dashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <Auth onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter">PORTFOLIO.OS</h1>
            <p className="text-gray-500 text-sm font-medium">May 13, 2026 • Market is OPEN</p>
          </div>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-400 transition"
          >
            Logout
          </button>
        </div>

        {/* Top: Stats */}
        <StatsCards />

        {/* Middle: Performance Chart */}
        <div className="bg-[#121217] border border-gray-800 rounded-3xl p-6 mb-8 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500">Performance Over Time</h3>
            <div className="flex gap-2">
              {['1D', '1W', '1M', '1Y'].map(t => (
                <button key={t} className="text-[10px] font-black px-3 py-1 rounded-lg hover:bg-white/10 text-gray-400">{t}</button>
              ))}
            </div>
          </div>
          <div className="h-[400px]">
             <StockChart data={[]} /> {/* Pass your data here */}
          </div>
        </div>

        {/* Bottom: Tables & Signals */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
           <PortfolioTables />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;