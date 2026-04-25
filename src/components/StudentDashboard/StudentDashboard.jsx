import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from "react-router-dom"; 
import { 
  Zap, Flame, Target, Tag, CheckCircle, AlertCircle,
  Calendar, Clock, Play, LogOut, RefreshCw, ChevronDown, Filter, XCircle
} from 'lucide-react';
import Navbar from './Navbar';

// Helper for Date & Time Formatting
const formatDateTime = (dateString) => {
  if (!dateString) return { date: "N/A", time: "N/A" };
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };
};

const fetchStudentData = async (studentId) => {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/students/${studentId}/dashboard-data`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

const StudentDashboard = () => { 
  const STUDENT_ID = localStorage.getItem('userId'); 
  const navigate = useNavigate(); 

  const [isLoading, setIsLoading] = useState(true);
  const [studentName, setStudentName] = useState(localStorage.getItem('fullName') || 'Student'); 
  const [labs, setLabs] = useState([]);
  const [stats, setStats] = useState({ xp: 0, streak: 5 });
  const [statusFilter, setStatusFilter] = useState('All Labs');
  const [courseFilter, setCourseFilter] = useState('All Courses');

  useEffect(() => {
    if (!STUDENT_ID) { navigate('/login'); return; }

    const loadData = async () => {
      try {
        const data = await fetchStudentData(STUDENT_ID);
        setStudentName(data.studentName || 'Student');
        setLabs(data.labs || []);
        setStats(prev => ({ ...prev, xp: data.xp || 0 }));
        setIsLoading(false);
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
        setIsLoading(false);
      }
    };
    loadData();
  }, [STUDENT_ID, navigate]);

  // Get unique courses for filter dropdown
  const uniqueCourses = [...new Set(labs.map(lab => lab.course))].filter(Boolean);

  // Filter labs based on selected filters
  const filteredLabs = labs.filter(lab => {
    const statusMatch = statusFilter === 'All Labs' || 
      (statusFilter === 'Completed' && (lab.status === 'Submitted' || lab.status === 'Late Submitted')) ||
      (statusFilter === 'Pending' && lab.status === 'Pending') ||
      (statusFilter === 'Expired' && lab.status === 'Expired');
    const courseMatch = courseFilter === 'All Courses' || lab.course === courseFilter;
    return statusMatch && courseMatch;
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600 text-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FD] pb-12 font-sans">
      {/* Use Navbar Component */}
      <Navbar studentName={studentName} />

      <div className="max-w-7xl mx-auto px-8 mt-8">
        {/* Banner with Progress Metrics */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-10 text-white flex justify-between items-center shadow-2xl mb-10 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold mb-2">Welcome back, {studentName}! 👋</h1>
            <p className="text-indigo-100 text-lg opacity-90">Manage your active assignments and track your progress.</p>
          </div>
          <div className="flex gap-4 relative z-10">
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl min-w-[140px] border border-white/10 text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-yellow-300 uppercase tracking-wider">
                <Zap size={16} fill="currentColor" /> Total XP
              </div>
              <div className="text-3xl font-black mt-1">{stats.xp.toLocaleString()}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl min-w-[140px] border border-white/10 text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <Flame size={16} fill="currentColor" /> Active Labs
              </div>
              <div className="text-3xl font-black mt-1">{labs.filter(l => l.status === 'Pending').length}</div>
            </div>
          </div>
        </div>

        {/* Labs Section - Displays Dynamic Lab Cards */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-extrabold text-gray-800">Your Labs</h2>
            <div className="flex items-center gap-3">
              {/* Status Filter */}
              <div className="relative">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-gray-600 cursor-pointer hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                >
                  <option>All Labs</option>
                  <option>Completed</option>
                  <option>Pending</option>
                  <option>Expired</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Course Filter */}
              <div className="relative">
                <select 
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-gray-600 cursor-pointer hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                >
                  <option>All Courses</option>
                  {uniqueCourses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="space-y-5">
            {filteredLabs.length > 0 ? filteredLabs.map((lab, i) => {
              const { date, time } = formatDateTime(lab.dueDate);
              // Check for Submitted or Late Submitted status
              const isCompleted = lab.status === 'Submitted' || lab.status === 'Late Submitted' || lab.status === 'Completed';
              const isExpired = lab.status === 'Expired';
              
              // Calculate actual score from averageScore (out of 10) to lab marks
              const labMarks = lab.marks || 0;
              const avgScore = lab.score || 0; // averageScore is out of 10
              const actualScore = Math.round((avgScore / 10) * labMarks);

              return (
                <motion.div 
                  key={lab._id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-all ${
                    isCompleted ? 'border-green-50 bg-green-50/5' : 
                    isExpired ? 'border-red-50 bg-red-50/5' : 
                    'border-transparent hover:border-indigo-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`font-bold text-lg ${isCompleted ? 'text-gray-400' : isExpired ? 'text-gray-400' : 'text-gray-900'}`}>{lab.title}</h3>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                          isCompleted ? 'bg-green-100 text-green-600' : 
                          isExpired ? 'bg-red-100 text-red-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {isCompleted ? <><CheckCircle size={12} /> {lab.status === 'Late Submitted' ? 'Late' : 'Submitted'}</> : 
                           isExpired ? <><XCircle size={12} /> Expired</> : 'Pending'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 mb-4">
                        <Tag size={12} className="fill-indigo-100" /> {lab.course} • {lab.courseCode}
                      </div>

                      <div className="flex items-center gap-8 text-[11px] font-bold">
                        <div className="text-gray-500 flex items-center gap-1.5 uppercase tracking-wide">
                          <Target size={14} className={isCompleted ? "text-emerald-500" : "text-gray-400"} /> 
                          Score: <span className={isCompleted ? "text-emerald-600" : "text-gray-500"}>{isCompleted ? actualScore : 0}/{labMarks}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 uppercase tracking-wide"><Calendar size={14} /> Due: {date}</div>
                        <div className="flex items-center gap-1.5 text-gray-400 uppercase tracking-wide"><Clock size={14} /> Time: {time}</div>
                      </div>
                    </div>

                    {!isCompleted && !isExpired ? (
                      <button 
                        onClick={() => navigate(`/lab-session/${lab._id}`)}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all active:scale-95"
                      >
                        <Play size={14} fill="currentColor" /> Start Lab
                      </button>
                    ) : isExpired ? (
                      <div className="flex items-center gap-2 text-red-500 font-bold text-xs px-6 py-3">
                        <XCircle size={16} /> Deadline Passed
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => navigate(`/lab-session/${lab._id}`)}
                          className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-xl shadow-green-100 hover:bg-green-700 flex items-center gap-2 transition-all active:scale-95"
                        >
                          <RefreshCw size={14} /> Re-attempt
                        </button>
                        <button 
                          onClick={() => navigate(`/lab-results/${lab._id}`)}
                          className="bg-white border border-gray-200 text-gray-600 px-6 py-3 rounded-2xl font-bold text-xs hover:bg-gray-50 transition-all active:scale-95"
                        >
                          View Details
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            }) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400 font-bold">
                {labs.length === 0 ? 'No labs found.' : 'No labs match the selected filters.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
