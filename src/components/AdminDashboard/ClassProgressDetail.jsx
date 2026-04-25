import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, LayoutDashboard, ListChecks, BookOpenCheck, LineChart,
  X, LogOut, Menu, Zap, ArrowLeft, Trophy, BarChart3, Clock, CheckCircle, XCircle, 
  ArrowUp, ArrowDown, ArrowUpDown, FileText, PieChart, AlertCircle,
  Bell, TrendingUp, CreditCard, MessageSquare, UserCog
} from "lucide-react";
import {
  BarChart, Bar, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const API_BASE = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api`;
const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

const ClassProgressDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  
  // Get class data from navigation state
  const classData = location.state?.classData;
  const courseData = location.state?.courseData;

  // Debug log
  console.log("ClassProgressDetail - classData:", classData);
  console.log("ClassProgressDetail - courseData:", courseData);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeMenu, setActiveMenu] = useState("View Progress");
  const [detailView, setDetailView] = useState("reports");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data State
  const [students, setStudents] = useState([]);
  const [selectedLab, setSelectedLab] = useState("all");
  const [sortField, setSortField] = useState("rollNumber");
  const [sortOrder, setSortOrder] = useState("asc");

  // Derived data from classData
  const courseName = classData?.courseName || courseData?.title || 'Course';
  const className = classData?.className || classData?.name || 'Class';
  const teacherName = classData?.teacherName || 'Unassigned';
  const labs = classData?.labs || [];
  const studentIds = classData?.students || [];

  // Handle resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect if no class data
  useEffect(() => {
    if (!classData) {
      navigate('/admin/progress');
    }
  }, [classData, navigate]);

  // Fetch students for this class
  useEffect(() => {
    if (!classData || !courseData) return;

    const fetchStudents = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Fetching students, studentIds:", studentIds);
        
        // If no students in class, set empty and return
        if (!studentIds || studentIds.length === 0) {
          console.log("No students in class");
          setStudents([]);
          setIsLoading(false);
          return;
        }

        // Get the courseId and classId for the correct endpoint
        const courseId = courseData._id;
        const classId = classData._id;
        
        console.log("Fetching from:", `${API_BASE}/courses/${courseId}/classes/${classId}/students`);

        // Fetch students for this specific class
        const response = await fetch(`${API_BASE}/courses/${courseId}/classes/${classId}/students`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch students: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Students from API:", data);
        
        // The response might be an array directly or wrapped in an object
        const classStudents = Array.isArray(data) ? data : (data.students || []);
        
        console.log("Class students:", classStudents);
        setStudents(classStudents);
        
      } catch (err) {
        console.error("Error fetching students:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [classData, courseData, token]);

  // Process students into report data
  const reportData = useMemo(() => {
    const isSpecificLab = selectedLab && selectedLab !== 'all';
    
    let processedStudents = [];

    if (isSpecificLab) {
      const lab = labs.find(l => l._id?.toString() === selectedLab);
      if (lab) {
        processedStudents = students.map(student => {
          const submission = (lab.submissions || []).find(s => 
            s.studentId?.toString() === student._id?.toString()
          );
          return {
            studentId: student._id,
            rollNumber: student.rollNumber || 'N/A',
            name: student.name || 'Unknown',
            score: submission ? (submission.averageScore || 0) : 0,
            xp: submission?.xp || 0,
            status: submission ? (submission.isLate ? 'Late Submitted' : 'Submitted') : 'Not Submitted'
          };
        });
      }
    } else {
      processedStudents = students.map(student => {
        let totalScore = 0;
        let submittedCount = 0;
        let totalXp = 0;

        labs.forEach(lab => {
          const submission = (lab.submissions || []).find(s => 
            s.studentId?.toString() === student._id?.toString()
          );
          if (submission) {
            submittedCount++;
            totalScore += (submission.averageScore || 0);
            totalXp += submission.xp || 0;
          }
        });

        const completion = labs.length > 0 ? Math.round((submittedCount / labs.length) * 100) : 0;
        const avgScore = submittedCount > 0 ? parseFloat((totalScore / submittedCount).toFixed(1)) : 0;

        return {
          studentId: student._id,
          rollNumber: student.rollNumber || 'N/A',
          name: student.name || 'Unknown',
          score: avgScore,
          xp: student.xp || totalXp || 0,
          completion,
          submitted: submittedCount,
          pending: labs.length - submittedCount
        };
      });
    }

    // Calculate summary
    const totalStudents = processedStudents.length || studentIds.length;
    const avgScoreSum = processedStudents.reduce((sum, s) => sum + (s.score || 0), 0);
    const submittedStudents = processedStudents.filter(s => 
      isSpecificLab ? s.status !== 'Not Submitted' : s.completion > 0
    ).length;

    return {
      isSpecificLab,
      summary: {
        averageScore: totalStudents > 0 ? (avgScoreSum / totalStudents).toFixed(1) : '0.0',
        submissionRate: totalStudents > 0 ? Math.round((submittedStudents / totalStudents) * 100) : 0,
        totalStudents
      },
      students: processedStudents,
      labs: labs.map(l => ({ _id: l._id, title: l.title || 'Untitled Lab' }))
    };
  }, [students, labs, selectedLab, studentIds]);

  // Process analytics data
  const analyticsData = useMemo(() => {
    const scoreRanges = [
      { label: '0-4', min: 0, max: 4, count: 0 },
      { label: '4-6', min: 4, max: 6, count: 0 },
      { label: '6-8', min: 6, max: 8, count: 0 },
      { label: '8-9', min: 8, max: 9, count: 0 },
      { label: '9-10', min: 9, max: 10.1, count: 0 }
    ];

    // Count scores in each range
    labs.forEach(lab => {
      (lab.submissions || []).forEach(sub => {
        const score = sub.averageScore || 0;
        for (const range of scoreRanges) {
          if (score >= range.min && score < range.max) {
            range.count++;
            break;
          }
        }
      });
    });

    // Lab submission trends
    const labTrends = labs.map((lab, idx) => {
      const subs = (lab.submissions || []).filter(s => 
        studentIds.some(sid => {
          const sidStr = (typeof sid === 'object' ? sid._id : sid)?.toString();
          return s.studentId?.toString() === sidStr;
        })
      );
      return {
        labTitle: lab.title || `Lab ${idx + 1}`,
        submissionRate: studentIds.length > 0 ? Math.round((subs.length / studentIds.length) * 100) : 0
      };
    });

    // Average score per lab
    const labScores = labs.map((lab, idx) => {
      const subs = (lab.submissions || []).filter(s => 
        studentIds.some(sid => {
          const sidStr = (typeof sid === 'object' ? sid._id : sid)?.toString();
          return s.studentId?.toString() === sidStr;
        })
      );
      const total = subs.reduce((sum, s) => sum + (s.averageScore || 0), 0);
      return {
        labTitle: lab.title || `Lab ${idx + 1}`,
        avgScore: subs.length > 0 ? parseFloat((total / subs.length).toFixed(1)) : 0
      };
    });

    // Submission status
    let onTime = 0, late = 0, missing = 0;
    labs.forEach(lab => {
      const subs = lab.submissions || [];
      studentIds.forEach(sid => {
        const sidStr = (typeof sid === 'object' ? sid._id : sid)?.toString();
        const sub = subs.find(s => s.studentId?.toString() === sidStr);
        if (sub) {
          if (sub.isLate) late++;
          else onTime++;
        } else {
          missing++;
        }
      });
    });
    const total = onTime + late + missing;

    // Top performers from processed students
    const topPerformers = [...(reportData?.students || [])]
      .sort((a, b) => (b.xp || 0) - (a.xp || 0))
      .slice(0, 5);

    return {
      scoreDistribution: scoreRanges,
      labTrends,
      labScores,
      submissionStatus: [
        { label: 'On Time', value: onTime, percentage: total > 0 ? Math.round((onTime / total) * 100) : 0 },
        { label: 'Late', value: late, percentage: total > 0 ? Math.round((late / total) * 100) : 0 },
        { label: 'Missing', value: missing, percentage: total > 0 ? Math.round((missing / total) * 100) : 0 }
      ],
      topPerformers
    };
  }, [labs, studentIds, reportData?.students]);

  // Sorted students for report table
  const sortedStudents = useMemo(() => {
    if (!reportData?.students) return [];
    return [...reportData.students].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === "string") { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
      if (sortOrder === "asc") return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    });
  }, [reportData?.students, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortOrder("asc"); }
  };

  // Navigation
  const handleMenuItemClick = (label) => {
    setActiveMenu(label);
    if (label === 'Dashboard') navigate('/admin');
    else if (label === 'Manage Teachers') navigate('/admin/teachers');
    else if (label === 'Manage Courses') navigate('/admin/courses');
    else if (label === 'View Progress') navigate('/admin/progress');
    else if (label === 'Payment & Subscription') navigate('/admin/billing');
    else if (label === 'Feedback') navigate('/admin/feedback');
    else if (label === 'Contact Super Admin') navigate('/admin/contact');
    else if (label === 'Make Announcement') navigate('/admin/announcements/new');
    else if (label === 'Create Competition') navigate('/admin/competitions/create');
    if (isMobile) setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const config = {
      Submitted: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle },
      "Late Submitted": { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
      "Not Submitted": { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
    };
    const { bg, text, icon: Icon } = config[status] || config["Not Submitted"];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return sortOrder === "asc" ? <ArrowUp className="w-4 h-4 text-indigo-600" /> : <ArrowDown className="w-4 h-4 text-indigo-600" />;
  };

  // Navigation items
  const topMenuItems = [
    { icon: Bell, label: 'Make Announcement' },
    { icon: TrendingUp, label: 'Create Competition' },
  ];

  const mainNavigation = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: ListChecks, label: 'Manage Teachers' },
    { icon: BookOpenCheck, label: 'Manage Courses' },
    { icon: LineChart, label: 'View Progress' },
    { icon: CreditCard, label: 'Payment & Subscription' },
  ];

  const bottomNavigation = [
    { icon: MessageSquare, label: 'Feedback' },
    { icon: UserCog, label: 'Contact Super Admin' },
  ];

  const SidebarItem = ({ icon: Icon, label, isSelected }) => (
    <motion.button
      onClick={() => handleMenuItemClick(label)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-300 text-white
        ${isSelected ? 'bg-indigo-600/50 backdrop-blur-sm shadow-xl' : 'hover:bg-blue-700/50'}`}
    >
      <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-700' : 'bg-blue-800/70'} shadow-md`}>
        <Icon size={20} />
      </div>
      <span className="font-medium">{label}</span>
    </motion.button>
  );

  if (!classData) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 relative overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <motion.div 
        initial={isMobile ? { x: -288 } : { x: 0 }}
        animate={sidebarOpen || !isMobile ? { x: 0 } : { x: -288 }}
        className="fixed md:relative z-50 w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col h-full shadow-2xl"
      >
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg">
              <Zap size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Codezy</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {topMenuItems.map((item) => (
            <SidebarItem key={item.label} icon={item.icon} label={item.label} isSelected={activeMenu === item.label} />
          ))}
          <div className="my-6 border-t border-gray-700/50"></div>
          {mainNavigation.map((item) => (
            <SidebarItem key={item.label} icon={item.icon} label={item.label} isSelected={activeMenu === item.label} />
          ))}
          <div className="my-6 border-t border-gray-700/50"></div>
          {bottomNavigation.map((item) => (
            <SidebarItem key={item.label} icon={item.icon} label={item.label} isSelected={activeMenu === item.label} />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700/50">
          <motion.button onClick={handleLogout} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 shadow-md text-white transition-all">
            <div className="p-2 bg-red-700/50 rounded-lg"><LogOut size={20} /></div>
            <span className="font-medium">Logout</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <nav className="bg-white shadow-md sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100">
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <button 
                onClick={() => navigate('/admin/progress')}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to View Progress</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {/* Class Header - Uses classData directly */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 mb-6">
            <h1 className="text-3xl font-bold mb-2">{courseName}</h1>
            <p className="text-indigo-200 text-lg">
              {className} • Teacher: {teacherName}
            </p>
            <div className="flex gap-6 mt-4 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">{studentIds.length} Students</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">{labs.length} Labs</span>
            </div>
          </div>

          {/* View Toggle & Lab Filter */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
            <div className="inline-flex rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => setDetailView("reports")}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                  detailView === "reports" ? "bg-white text-indigo-600 shadow-md" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileText className="w-4 h-4" /> Reports
              </button>
              <button
                onClick={() => setDetailView("analytics")}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                  detailView === "analytics" ? "bg-white text-indigo-600 shadow-md" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <PieChart className="w-4 h-4" /> Analytics
              </button>
            </div>

            {labs.length > 0 && (
              <select
                value={selectedLab}
                onChange={(e) => setSelectedLab(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Labs</option>
                {labs.map(lab => (
                  <option key={lab._id} value={lab._id}>{lab.title || 'Untitled Lab'}</option>
                ))}
              </select>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-20 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading class data...</p>
            </div>
          ) : (
            <>
              {/* Reports View */}
              {detailView === "reports" && (
                <div>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                          <BarChart3 className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-indigo-700">{reportData.summary.averageScore}</p>
                          <p className="text-sm font-semibold text-indigo-600 uppercase">Average Score</p>
                        </div>
                      </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-emerald-700">{reportData.summary.submissionRate}%</p>
                          <p className="text-sm font-semibold text-emerald-600 uppercase">Submission Rate</p>
                        </div>
                      </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-amber-700">{reportData.summary.totalStudents}</p>
                          <p className="text-sm font-semibold text-amber-600 uppercase">Total Students</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Students Table */}
                  {sortedStudents.length > 0 ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-4 text-left">
                                <button onClick={() => handleSort("rollNumber")} className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase hover:text-gray-900">
                                  Roll No. <SortIcon field="rollNumber" />
                                </button>
                              </th>
                              <th className="px-6 py-4 text-left">
                                <button onClick={() => handleSort("name")} className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase hover:text-gray-900">
                                  Name <SortIcon field="name" />
                                </button>
                              </th>
                              <th className="px-6 py-4 text-left">
                                <button onClick={() => handleSort("score")} className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase hover:text-gray-900">
                                  Score <SortIcon field="score" />
                                </button>
                              </th>
                              <th className="px-6 py-4 text-left">
                                <button onClick={() => handleSort("xp")} className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase hover:text-gray-900">
                                  XP <SortIcon field="xp" />
                                </button>
                              </th>
                              {reportData.isSpecificLab ? (
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                              ) : (
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Completion</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {sortedStudents.map((student, idx) => (
                              <tr key={student.studentId || idx} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                <td className="px-6 py-4 text-sm font-mono text-gray-600">{student.rollNumber}</td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-800">{student.name}</td>
                                <td className="px-6 py-4">
                                  <span className={`text-sm font-bold ${student.score >= 8 ? 'text-emerald-600' : student.score >= 6 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {student.score}/10
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-semibold text-purple-600">{student.xp} XP</td>
                                {reportData.isSpecificLab ? (
                                  <td className="px-6 py-4"><StatusBadge status={student.status} /></td>
                                ) : (
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-32 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${student.completion}%` }}></div>
                                      </div>
                                      <span className="text-sm font-semibold text-gray-600 w-12">{student.completion}%</span>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No Students Found</h3>
                      <p className="text-gray-500">
                        {studentIds.length > 0 
                          ? "Students are enrolled but their data couldn't be loaded. Check the console for details."
                          : "There are no students enrolled in this class yet."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Analytics View */}
              {detailView === "analytics" && (
                <div className="space-y-6">
                  {labs.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                      <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No Labs Created</h3>
                      <p className="text-gray-500">Create labs for this class to see analytics data.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Score Distribution */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-xl border border-gray-200 p-6">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-600" /> Score Distribution
                          </h3>
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={analyticsData.scoreDistribution}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Students" />
                            </BarChart>
                          </ResponsiveContainer>
                        </motion.div>

                        {/* Submission Status */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                          className="bg-white rounded-xl border border-gray-200 p-6">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-emerald-600" /> Submission Status
                          </h3>
                          <ResponsiveContainer width="100%" height={250}>
                            <RechartsPieChart>
                              <Pie
                                data={analyticsData.submissionStatus}
                                dataKey="value"
                                nameKey="label"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ label, percentage }) => percentage > 0 ? `${label}: ${percentage}%` : ''}
                              >
                                {analyticsData.submissionStatus.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                          <div className="flex justify-center gap-6 mt-4">
                            {analyticsData.submissionStatus.map((item, idx) => (
                              <div key={item.label} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }}></div>
                                <span className="text-sm text-gray-600">{item.label}: {item.value}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>

                        {/* Lab Submission Trends */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                          className="bg-white rounded-xl border border-gray-200 p-6">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <LineChart className="w-5 h-5 text-purple-600" /> Lab Submission Trends
                          </h3>
                          <ResponsiveContainer width="100%" height={250}>
                            <RechartsLineChart data={analyticsData.labTrends}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="labTitle" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                              <Line type="monotone" dataKey="submissionRate" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: "#8b5cf6", strokeWidth: 2 }} name="Submission %" />
                            </RechartsLineChart>
                          </ResponsiveContainer>
                        </motion.div>

                        {/* Average Score per Lab */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                          className="bg-white rounded-xl border border-gray-200 p-6">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-amber-600" /> Average Score per Lab
                          </h3>
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={analyticsData.labScores}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="labTitle" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                              <YAxis tick={{ fontSize: 12 }} domain={[0, 10]} />
                              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                              <Bar dataKey="avgScore" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Avg Score" />
                            </BarChart>
                          </ResponsiveContainer>
                        </motion.div>
                      </div>

                      {/* Top Performers */}
                      {analyticsData.topPerformers?.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                          className="bg-white rounded-xl border border-gray-200 p-6">
                          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" /> Top Performers in This Class
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {analyticsData.topPerformers.map((p, idx) => (
                              <div key={p.studentId || idx} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 text-center hover:shadow-md transition-shadow">
                                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white font-bold text-lg mb-3 shadow-lg ${
                                  idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 
                                  idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : 
                                  idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' : 
                                  'bg-gradient-to-br from-indigo-500 to-purple-600'
                                }`}>
                                  {idx + 1}
                                </div>
                                <p className="text-sm font-bold text-gray-800 truncate">{p.name}</p>
                                <p className="text-xs text-gray-500 mb-2">{p.rollNumber}</p>
                                <p className="text-lg font-bold text-purple-600">{p.xp} XP</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassProgressDetail;
