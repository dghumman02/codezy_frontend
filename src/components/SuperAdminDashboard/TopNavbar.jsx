import React from 'react';
import { Menu, X, Search, Bell, User } from 'lucide-react';

const TopNavbar = ({ sidebarOpen, setSidebarOpen, title = "SuperAdmin Hub" }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100 px-8 py-4 flex justify-between items-center z-10">
      <div className="flex items-center gap-4">
        {/* Toggle Button */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Global search..." 
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm w-64 focus:ring-2 focus:ring-indigo-500 outline-none" 
          />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
            <Bell size={20} />
          </button>
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 border border-gray-200 cursor-pointer">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;