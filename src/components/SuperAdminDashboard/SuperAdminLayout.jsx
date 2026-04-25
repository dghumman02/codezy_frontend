import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const SuperAdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* 1. Shared Sidebar */}
      <Sidebar isOpen={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 2. Shared Top Navbar */}
        <TopNavbar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />
        
        {/* 3. Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;