import React from 'react';
import { TrendingUp, Wallet, Activity } from 'lucide-react';

const StatsCards = () => {
  const stats = [
    { label: 'Total Balance', value: '$124,592.00', icon: <Wallet size={20}/>, color: 'text-white' },
    { label: 'Total Profit', value: '+$12,402.50', icon: <TrendingUp size={20}/>, color: 'text-emerald-400' },
    { label: 'Daily Change', value: '+1.42%', icon: <Activity size={20}/>, color: 'text-blue-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((s, i) => (
        <div key={i} className="bg-[#121217] border border-gray-800 p-6 rounded-3xl hover:border-gray-700 transition shadow-xl">
          <div className="flex items-center gap-3 mb-4 text-gray-500 uppercase text-[10px] font-black tracking-widest">
            {s.icon} {s.label}
          </div>
          <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;