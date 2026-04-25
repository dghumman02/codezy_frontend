import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { motion } from "framer-motion";
import NotificationDropdown from "../NotificationDropdown";

const TeacherNavbar = () => {
  const navigate = useNavigate();

  const base = "hover:text-indigo-600 transition px-1 pb-1 font-medium";
  const active = "text-indigo-600 border-b-2 border-indigo-600";

  // ✅ Logout handler clears all localStorage & sessionStorage
  const handleLogout = () => {
    localStorage.clear(); // removes all localStorage
    sessionStorage.removeItem("welcomeShown");
    navigate("/login");    // redirect to login page
  };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left Section */}
          <div className="flex items-center space-x-8">
            
            {/* Animated Logo */}
            <motion.div
              whileHover={{ rotate: 5, scale: 1.1 }}
              className="text-indigo-600 font-bold text-xl flex items-center cursor-pointer"
              onClick={() => navigate("/teacher")}
            >
              <span className="text-2xl mr-1">&lt;/&gt;</span>
              <span>Codezy</span>
            </motion.div>

            {/* Nav Links */}
            <div className="hidden md:flex space-x-8 text-gray-700">
              <NavLink to="/teacher" className={({ isActive }) => `${base} ${isActive ? active : ""}`}>
                Dashboard
              </NavLink>
              <NavLink to="/mycourses" className={({ isActive }) => `${base} ${isActive ? active : ""}`}>
                My Courses
              </NavLink>
              <NavLink to="/createlab" className={({ isActive }) => `${base} ${isActive ? active : ""}`}>
                Create Lab
              </NavLink>
              <NavLink to="/reports" className={({ isActive }) => `${base} ${isActive ? active : ""}`}>
                Reports
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => `${base} ${isActive ? active : ""}`}>
                Profile
              </NavLink>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-6">
            <NotificationDropdown />

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-rose-600 font-bold text-sm transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default TeacherNavbar;
