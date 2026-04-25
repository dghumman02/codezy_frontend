
import React from "react";
import { useLocation } from "react-router-dom";
import NotificationDropdown from "../NotificationDropdown";
import { LogOut } from "lucide-react";

const LearnerNavbar = () => {
  const fullName = localStorage.getItem("fullName") || "User";
  const { pathname } = useLocation();

  const navLink = (href, label) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    return (
      <a
        href={href}
        className={
          isActive
            ? "bg-purple-50 text-purple-700 px-4 py-2 rounded-xl font-bold"
            : "text-gray-500 hover:text-purple-700 px-4 py-2"
        }
      >
        {label}
      </a>
    );
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      sessionStorage.removeItem('welcomeShown');
      window.location.href = "/login";
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-8">
        <a
          href="/learner-dashboard"
          className="text-purple-700 font-bold text-xl flex items-center gap-2"
        >
          <div className="bg-purple-700 text-white px-1.5 py-0.5 rounded-md text-sm font-mono">
            {"</>"}
          </div>
          Codezy
        </a>

        <div className="hidden md:flex gap-2 text-sm font-semibold">
          {navLink("/courses", "Courses")}
          {navLink("/learner/competitions", "Competitions")}
          {navLink("/achievements", "Achievements")}
          {navLink("/learner/feedback", "Feedback")}
        </div>
      </div>

      <div className="flex items-center gap-5">
        <NotificationDropdown />

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-500 hover:text-red-600 font-bold text-xs px-3 py-2 rounded-xl hover:bg-red-50"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>

        <a
          href="/learner-profile"
          className="w-9 h-9 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-bold uppercase"
        >
          {fullName.charAt(0)}
        </a>
      </div>
    </nav>
  );
};

export default LearnerNavbar;