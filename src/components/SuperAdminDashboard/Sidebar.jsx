import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, BookOpen, BarChart3, LogOut, Zap, Trophy, MessageSquare
} from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.clear();
    sessionStorage.removeItem("welcomeShown");
    navigate('/login');
  };

  const menuItems = [
  { icon: <LayoutDashboard />, label: "Dashboard", path: "/superadmin-dashboard" },
  { icon: <Building2 />, label: "Institutions", path: "/superadmin-institutions" },
  { icon: <BookOpen />, label: "Global Courses", path: "/superadmin-courses" },
  { icon: <Trophy />, label: "Competitions", path: "/superadmin-competitions" },
  { icon: <BarChart3 />, label: "Analytics", path: "/superadmin-reports" },
  { icon: <MessageSquare />, label: "Feedbacks", path: "/superadmin-feedbacks" },
];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isOpen ? '288px' : '0px' }}
      className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col shadow-2xl overflow-hidden relative h-screen"
    >
      <div className="p-6 border-b border-gray-700/50 flex items-center gap-3 min-w-[288px]">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Zap size={22} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">
          Codezy
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4 min-w-[288px] overflow-y-auto">
        {menuItems.map((item) => (
          <SidebarItem 
            key={item.path}
            icon={item.icon} 
            label={item.label} 
            active={location.pathname === item.path}
            onClick={() => navigate(item.path)} 
          />
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700/50 min-w-[288px]">
        <motion.button 
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600/90 hover:bg-red-600 text-white shadow-lg transition-all"
        >
          <LogOut size={20} /> <span className="font-medium">Logout</span>
        </motion.button>
      </div>
    </motion.aside>
  );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02, x: 5 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group
      ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
  >
    <div className={`p-2 rounded-lg ${active ? 'bg-white/20' : 'bg-gray-800 group-hover:bg-gray-700'}`}>
      {icon}
    </div>
    <span className="font-semibold text-sm">{label}</span>
  </motion.button>
);

export default Sidebar;