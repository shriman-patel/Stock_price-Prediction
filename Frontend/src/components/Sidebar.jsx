import React from 'react';
import { useNavigate } from "react-router-dom";
const Sidebar = ({ activeTab, setActiveTab, searchRef }) => {
  const menuItems = [
    { id: 'search', label: 'Search Stock', icon: '🔍' },
    { id: 'live', label: 'Live Market', icon: '📈' },
    { id: 'prediction', label: 'AI Prediction', icon: '🤖' },
  { id: 'portfolio', label: 'Portfolio', icon: '💼', route: '/portfolio' },
  { id: 'login', label: 'Login', icon: '🔑', route: '/login' },
  { id: 'register', label: 'Register', icon: '📝', route: '/register' },  ];

  const navigate = useNavigate();

const handleClick = (item) => {
  setActiveTab(item.label);

  if (item.id === "search") {
    setTimeout(() => {
      searchRef?.current?.focus();
    }, 50);
  }

  if (item.route) {
    navigate(item.route);
  }
};
  return (
    <aside className="w-64 hidden lg:block border-r border-gray-800 bg-[#020205] p-6 h-screen sticky top-0">
      {/* Brand Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white italic">S</div>
        <h1 className="text-xl font-black text-white tracking-tighter italic">STK.AI</h1>
      </div>

      {/* Navigation Menu */}
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <div
            key={item.id}
onClick={() => handleClick(item)}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
              activeTab === item.label
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                : 'text-gray-500 hover:bg-gray-900 hover:text-gray-300'
            }`}
          >
            <span className={`text-lg transition-transform duration-200 ${activeTab === item.label ? 'scale-110' : 'group-hover:scale-110'}`}>
              {item.icon}
            </span>
            <span className="font-bold text-sm">{item.label}</span>
          </div>
        ))}
      </nav>

      {/* User Status / Bottom Info */}
      <div className="absolute bottom-10 left-6 right-6">
        <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-2xl">
          <p className="text-[10px] text-gray-500 uppercase font-black mb-2">AI Engine Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-gray-300 font-medium">Neural Node Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;