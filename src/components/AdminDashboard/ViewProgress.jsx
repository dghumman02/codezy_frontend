import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, BookOpen, GraduationCap, Layers, LayoutDashboard, ListChecks, BookOpenCheck, LineChart,
  X, LogOut, Menu, Zap, ChevronRight, Trophy, Filter, Medal, AlertTriangle, Clock, Calendar,
  ChevronDown, ChevronUp, Download, Bell, TrendingUp, CreditCard, MessageSquare, UserCog
} from "lucide-react";

const API_BASE = "http://localhost:5000/api";

const ViewProgress = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeMenu, setActiveMenu] = useState("View Progress");
  const [activeTab, setActiveTab] = useState("progress");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data State
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [competitions, setCompetitions] = useState([]);

  // Competition detail state
  const [selectedComp, setSelectedComp] = useState(null);
  const [compStats, setCompStats] = useState(null);
  const [compStatsLoading, setCompStatsLoading] = useState(false);
  const [showNonParticipants, setShowNonParticipants] = useState(false);

  // Filter State
  const [filterCourse, setFilterCourse] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterPerformance, setFilterPerformance] = useState("xp"); // "xp" or "score"

  // Handle resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all courses
        const coursesRes = await fetch(`${API_BASE}/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const coursesData = await coursesRes.json();
        console.log("Courses data:", coursesData);
        
        // Fetch all teachers
        const teachersRes = await fetch(`${API_BASE}/teachers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const teachersData = await teachersRes.json();
        console.log("Teachers data:", teachersData);

        // Fetch competitions
        const compsRes = await fetch(`${API_BASE}/competitions/admin`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (compsRes.ok) {
          const compsData = await compsRes.json();
          setCompetitions(Array.isArray(compsData) ? compsData : []);
        }

        if (Array.isArray(coursesData)) {
          setCourses(coursesData);
          
          // Build teacher map
          const teacherMap = {};
          if (Array.isArray(teachersData)) {
            setTeachers(teachersData);
            teachersData.forEach(t => { teacherMap[t._id] = t.name; });
          }

          // Extract and process all classes from courses
          const classesArr = [];
          const allStudentIds = new Set();

          coursesData.forEach(course => {
            (course.classes || []).forEach(cls => {
              const studentIds = cls.students || [];
              studentIds.forEach(sid => allStudentIds.add(typeof sid === 'string' ? sid : sid._id || sid));

              // Calculate avg score and completion for this class
              const labs = cls.labs || [];
              let totalScore = 0;
              let totalSubmissions = 0;
              let totalPossibleSubmissions = studentIds.length * labs.length;

              labs.forEach(lab => {
                (lab.submissions || []).forEach(sub => {
                  if (studentIds.some(sid => (sid._id || sid).toString() === sub.studentId?.toString())) {
                    totalSubmissions++;
                    totalScore += sub.averageScore || 0;
                  }
                });
              });

              const avgScore = totalSubmissions > 0 ? (totalScore / totalSubmissions).toFixed(1) : 0;
              const completionRate = totalPossibleSubmissions > 0 
                ? Math.round((totalSubmissions / totalPossibleSubmissions) * 100) 
                : 0;

              classesArr.push({
                _id: cls._id,
                className: cls.name,
                courseId: course._id,
                courseName: course.title,
                courseCode: course.courseCode,
                teacherId: cls.teacher,
                teacherName: teacherMap[cls.teacher] || 'Unassigned',
                totalStudents: studentIds.length,
                totalLabs: labs.length,
                avgScore: parseFloat(avgScore),
                completionRate: completionRate,
                labs: labs,
                students: studentIds,
                // Store reference to original data for detail page
                originalClass: cls,
                originalCourse: course
              });
            });
          });

          setAllClasses(classesArr);
          console.log("Processed classes:", classesArr);

          // Fetch students for top performers from all classes
          const allStudentsMap = new Map(); // Map to track unique students
          
          for (const cls of classesArr) {
            if (cls.students && cls.students.length > 0) {
              try {
                const studentsRes = await fetch(
                  `${API_BASE}/courses/${cls.courseId}/classes/${cls._id}/students`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                
                if (studentsRes.ok) {
                  const studentsData = await studentsRes.json();
                  const students = Array.isArray(studentsData) ? studentsData : (studentsData.students || []);
                  
                  students.forEach(student => {
                    // Calculate student's avg score from labs in this class
                    let totalScore = 0;
                    let submittedCount = 0;
                    
                    (cls.labs || []).forEach(lab => {
                      const submission = (lab.submissions || []).find(s => 
                        s.studentId?.toString() === student._id?.toString()
                      );
                      if (submission) {
                        submittedCount++;
                        totalScore += submission.averageScore || 0;
                      }
                    });
                    
                    const avgScore = submittedCount > 0 ? parseFloat((totalScore / submittedCount).toFixed(1)) : 0;
                    
                    // If student already exists, keep the one with higher XP or add scores
                    const existingStudent = allStudentsMap.get(student._id?.toString());
                    if (existingStudent) {
                      // Update if this class has a higher score contribution
                      if (avgScore > existingStudent.avgScore) {
                        existingStudent.avgScore = avgScore;
                        existingStudent.className = cls.className;
                        existingStudent.courseName = cls.courseName;
                        existingStudent.courseId = cls.courseId;
                        existingStudent.classId = cls._id;
                      }
                    } else {
                      allStudentsMap.set(student._id?.toString(), {
                        _id: student._id,
                        name: student.name || 'Unknown',
                        rollNumber: student.rollNumber || 'N/A',
                        xp: student.xp || student.totalXP || 0,
                        avgScore: avgScore,
                        className: cls.className,
                        courseName: cls.courseName,
                        courseId: cls.courseId,
                        classId: cls._id
                      });
                    }
                  });
                }
              } catch (e) {
                console.log(`Could not fetch students for class ${cls.className}:`, e);
              }
            }
          }
          
          // Convert map to array and sort by XP
          const allStudentsList = Array.from(allStudentsMap.values());
          console.log("All students for top performers:", allStudentsList);
          setTopPerformers(allStudentsList);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchData();
    } else {
      setError("No authentication token found. Please login again.");
      setIsLoading(false);
    }
  }, [token]);

  // Handle class card click - navigate to detail page
  const handleClassClick = (cls) => {
    // Pass all computed data including teacher name, labs, students
    navigate('/admin/progress/class', {
      state: {
        classData: {
          _id: cls._id,
          name: cls.className,
          className: cls.className,
          courseName: cls.courseName,
          courseCode: cls.courseCode,
          teacherId: cls.teacherId,
          teacherName: cls.teacherName,
          totalStudents: cls.totalStudents,
          totalLabs: cls.totalLabs,
          avgScore: cls.avgScore,
          completionRate: cls.completionRate,
          labs: cls.labs || [],
          students: cls.students || []
        },
        courseData: cls.originalCourse || { 
          _id: cls.courseId,
          title: cls.courseName,
          courseCode: cls.courseCode
        }
      }
    });
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

  const handleCompClick = useCallback(async (comp) => {
    setSelectedComp(comp);
    setCompStats(null);
    setShowNonParticipants(false);
    setCompStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/competitions/${comp._id}/admin-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCompStats(data);
    } catch (e) {
      setCompStats({ error: e.message });
    } finally {
      setCompStatsLoading(false);
    }
  }, [token]);

  const LANG_ICON = { python: '🐍', java: '☕', cpp: '⚡', html: '🌐' };
  const DIFF_COLOR = { Easy: 'bg-emerald-100 text-emerald-700', Medium: 'bg-amber-100 text-amber-700', Hard: 'bg-rose-100 text-rose-700' };
  const STATUS_COLOR = { Active: 'bg-green-100 text-green-700', Draft: 'bg-gray-100 text-gray-600', Closed: 'bg-slate-100 text-slate-600' };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const downloadCSV = (rows, filename) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  // Summary calculations
  const summary = useMemo(() => {
    const uniqueStudents = new Set();
    allClasses.forEach(cls => {
      (cls.students || []).forEach(sid => uniqueStudents.add((sid._id || sid).toString()));
    });
    
    return {
      totalStudents: uniqueStudents.size,
      totalFaculty: teachers.length,
      totalCourses: courses.length,
      totalClasses: allClasses.length,
      totalCompetitions: competitions.length,
    };
  }, [allClasses, teachers, courses, competitions]);

  // Filtered classes for display
  const filteredClasses = useMemo(() => {
    let result = allClasses;
    if (filterCourse) {
      result = result.filter(c => c.courseId === filterCourse);
    }
    return result;
  }, [allClasses, filterCourse]);

  // Filtered top performers
  const filteredTopPerformers = useMemo(() => {
    let result = [...topPerformers];
    if (filterCourse) {
      result = result.filter(p => p.courseId === filterCourse);
    }
    if (filterClass) {
      result = result.filter(p => p.classId === filterClass);
    }
    // Sort by selected performance metric
    if (filterPerformance === "xp") {
      result.sort((a, b) => (b.xp || 0) - (a.xp || 0));
    } else {
      result.sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0));
    }
    return result.slice(0, 20); // Top 20
  }, [topPerformers, filterCourse, filterClass, filterPerformance]);

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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading progress data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
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
        <nav className="bg-white shadow-md sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100">
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="text-2xl font-bold text-gray-800">View Progress</h1>
            </div>
          </div>
        </nav>

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.totalStudents}</p>
                </div>
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-indigo-600" />
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Faculty</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.totalFaculty}</p>
                </div>
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-emerald-600" />
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Courses</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.totalCourses}</p>
                </div>
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-amber-600" />
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Classes</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.totalClasses}</p>
                </div>
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center">
                  <Layers className="w-7 h-7 text-purple-600" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("progress")}
                className={`px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === "progress" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Course Progress
              </button>
              <button
                onClick={() => setActiveTab("topPerformers")}
                className={`px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === "topPerformers" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Top Performers
              </button>
              <button
                onClick={() => setActiveTab("competitions")}
                className={`px-6 py-4 text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "competitions" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Trophy size={15} /> Competitions
                {competitions.length > 0 && (
                  <span className="ml-1 bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{competitions.length}</span>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "progress" && (
            <div className="space-y-4">
              {filteredClasses.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                  <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Classes Found</h3>
                  <p className="text-gray-500">Create courses and add classes to see progress data here.</p>
                </div>
              ) : (
                filteredClasses.map((cls, idx) => (
                  <motion.div
                    key={cls._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleClassClick(cls)}
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {cls.courseName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {cls.className} • Teacher: {cls.teacherName}
                        </p>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-800">{cls.totalStudents}</p>
                          <p className="text-xs text-gray-500">Students</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-indigo-600">{cls.avgScore}/10</p>
                          <p className="text-xs text-gray-500">Avg Score</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                              style={{ width: `${cls.completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 w-12">{cls.completionRate}%</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === "topPerformers" && (
            <div>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterCourse}
                  onChange={(e) => { setFilterCourse(e.target.value); setFilterClass(""); }}
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Courses</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  disabled={!filterCourse}
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm disabled:opacity-50 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Classes</option>
                  {filterCourse && courses.find(c => c._id === filterCourse)?.classes?.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
                <select
                  value={filterPerformance}
                  onChange={(e) => setFilterPerformance(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="xp">Sort by XP</option>
                  <option value="score">Sort by Avg Score</option>
                </select>
              </div>

              {/* Top Performers */}
              {filteredTopPerformers.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Top Performers Yet</h3>
                  <p className="text-gray-500">Students will appear here once they earn XP by completing labs.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTopPerformers.map((p, idx) => (
                    <motion.div
                      key={p._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg ${
                          idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                          idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                          idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                          'bg-gradient-to-br from-indigo-500 to-purple-600'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{p.name}</h4>
                          <p className="text-sm text-gray-500">{p.rollNumber}</p>
                          <p className="text-xs text-indigo-600 mt-1 truncate">{p.courseName} • {p.className}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <div className={filterPerformance === "xp" ? "opacity-100" : "opacity-50"}>
                            <p className={`text-xl font-bold ${filterPerformance === "xp" ? "text-purple-600" : "text-gray-500"}`}>{p.xp || 0}</p>
                            <p className="text-xs text-gray-500">XP</p>
                          </div>
                          <div className={filterPerformance === "score" ? "opacity-100" : "opacity-50"}>
                            <p className={`text-xl font-bold ${filterPerformance === "score" ? "text-green-600" : "text-gray-500"}`}>{(p.avgScore || 0).toFixed(0)}%</p>
                            <p className="text-xs text-gray-500">Avg Score</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === "competitions" && (
            <div>
              {competitions.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Competitions Yet</h3>
                  <p className="text-gray-500">Create a competition from the dashboard to see it here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {competitions.map((comp, idx) => (
                    <motion.div
                      key={comp._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleCompClick(comp)}
                      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{LANG_ICON[comp.language] || '💻'}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[comp.status] || 'bg-gray-100 text-gray-600'}`}>{comp.status}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${DIFF_COLOR[comp.difficulty] || 'bg-gray-100 text-gray-600'}`}>{comp.difficulty}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2">{comp.title}</h3>
                      <p className="text-xs text-gray-500 mb-3">{(comp.language || '').toUpperCase()} · {comp.totalMarks} marks</p>
                      <div className="space-y-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5"><Calendar size={12} className="text-green-500" /><span>Starts: {fmtDate(comp.startDate)}</span></div>
                        <div className="flex items-center gap-1.5"><Clock size={12} className="text-red-400" /><span>Ends: {fmtDate(comp.dueDate)}</span></div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {comp.eligibility?.courseIds?.length > 0
                            ? `${comp.eligibility.courseNames?.join(', ')}`
                            : 'Open to all'}
                        </span>
                        <ChevronRight size={14} className="text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Competition Detail Modal ── */}
      <AnimatePresence>
        {selectedComp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedComp(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 shrink-0">
                <div className="flex items-center gap-3">
                  <Trophy size={20} className="text-yellow-300" />
                  <div>
                    <h2 className="font-bold text-white text-lg leading-tight">{selectedComp.title}</h2>
                    <p className="text-indigo-200 text-xs">{(selectedComp.language || '').toUpperCase()} · {selectedComp.difficulty} · {selectedComp.totalMarks} marks</p>
                  </div>
                </div>
                <button onClick={() => setSelectedComp(null)} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                  <X size={22} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {compStatsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-500 text-sm">Loading competition data...</p>
                  </div>
                ) : compStats?.error ? (
                  <div className="text-center py-10 text-red-500">
                    <AlertTriangle size={32} className="mx-auto mb-2" />
                    <p>{compStats.error}</p>
                  </div>
                ) : compStats && (
                  <>
                    {/* Info + Stats row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Dates & Eligibility */}
                      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-widest">Competition Details</h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2"><Calendar size={14} className="text-green-500 shrink-0" /><span><span className="font-medium">Start:</span> {fmtDateTime(compStats.competition.startDate)}</span></div>
                          <div className="flex items-center gap-2"><Clock size={14} className="text-red-400 shrink-0" /><span><span className="font-medium">End:</span> {fmtDateTime(compStats.competition.dueDate)}</span></div>
                          <div className="flex items-start gap-2 pt-1 border-t border-gray-200">
                            <Users size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-gray-700">Eligibility</p>
                              {!compStats.competition.eligibility?.courseIds?.length ? (
                                <p className="text-gray-500">Open to all students</p>
                              ) : (
                                <>
                                  <p className="text-gray-600">Courses: <span className="font-medium">{compStats.competition.eligibility.courseNames?.join(', ')}</span></p>
                                  {compStats.competition.eligibility.classIds?.length > 0
                                    ? <p className="text-gray-600">Classes: <span className="font-medium">{compStats.competition.eligibility.classNames?.join(', ')}</span></p>
                                    : <p className="text-gray-500">All classes in those courses</p>
                                  }
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stat boxes */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-4 text-center">
                          <p className="text-3xl font-black text-indigo-600">{compStats.eligibleCount}</p>
                          <p className="text-xs font-semibold text-indigo-500 mt-1">Eligible Students</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 text-center">
                          <p className="text-3xl font-black text-emerald-600">{compStats.participantCount}</p>
                          <p className="text-xs font-semibold text-emerald-500 mt-1">Participated</p>
                        </div>
                        <div className="bg-rose-50 rounded-xl border border-rose-100 p-4 text-center">
                          <p className="text-3xl font-black text-rose-500">{compStats.nonParticipantCount}</p>
                          <p className="text-xs font-semibold text-rose-400 mt-1">Did Not Participate</p>
                        </div>
                      </div>
                    </div>

                    {/* Leaderboard */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><Medal size={16} className="text-yellow-500" /> Leaderboard</h3>
                        {compStats.leaderboard.length > 0 && (
                          <button
                            onClick={() => downloadCSV(
                              compStats.leaderboard.map(r => ({
                                Rank: r.rank, Name: r.name, 'Roll No': r.rollNumber, Email: r.email,
                                'Score (%)': r.score, 'Earned Marks': r.earnedMarks, 'Total Marks': r.totalMarks,
                                Courses: r.enrolledCourses.join(' | '), Classes: r.enrolledClasses.join(' | '),
                                Submitted: fmtDateTime(r.submittedAt)
                              })),
                              `${selectedComp.title}-leaderboard.csv`
                            )}
                            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Download size={12} /> Export CSV
                          </button>
                        )}
                      </div>
                      {compStats.leaderboard.length === 0 ? (
                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                          <Trophy size={32} className="text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No submissions yet.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                {['Rank', 'Name', 'Roll No', 'Email', 'Score', 'Marks', 'Courses Enrolled', 'Classes Enrolled', 'Submitted'].map(h => (
                                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {compStats.leaderboard.map((row) => (
                                <tr key={row.rank} className={`hover:bg-indigo-50/40 transition-colors ${row.rank <= 3 ? 'bg-yellow-50/30' : ''}`}>
                                  <td className="px-4 py-3 font-black text-center">
                                    {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : <span className="text-gray-500">#{row.rank}</span>}
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{row.name}</td>
                                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.rollNumber}</td>
                                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.email}</td>
                                  <td className="px-4 py-3">
                                    <span className={`font-bold ${row.score >= 70 ? 'text-emerald-600' : row.score >= 40 ? 'text-amber-600' : 'text-rose-500'}`}>{row.score}%</span>
                                  </td>
                                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.earnedMarks}/{row.totalMarks}</td>
                                  <td className="px-4 py-3 text-gray-600 text-xs">{row.enrolledCourses.join(', ') || '—'}</td>
                                  <td className="px-4 py-3 text-gray-600 text-xs">{row.enrolledClasses.join(', ') || '—'}</td>
                                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDateTime(row.submittedAt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Non-Participants section */}
                    <div className="border border-rose-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setShowNonParticipants(v => !v)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-rose-50 hover:bg-rose-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={16} className="text-rose-500" />
                          <span className="font-bold text-rose-700">Eligible but Did Not Participate ({compStats.nonParticipantCount})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {compStats.nonParticipants.length > 0 && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadCSV(
                                  compStats.nonParticipants.map(s => ({
                                    Name: s.name, 'Roll No': s.rollNumber, Email: s.email,
                                    Courses: s.enrolledCourses.join(' | '), Classes: s.enrolledClasses.join(' | ')
                                  })),
                                  `${selectedComp.title}-non-participants.csv`
                                );
                              }}
                              className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-white border border-rose-200 px-3 py-1 rounded-lg transition-colors"
                            >
                              <Download size={11} /> Export CSV
                            </span>
                          )}
                          {showNonParticipants ? <ChevronUp size={16} className="text-rose-500" /> : <ChevronDown size={16} className="text-rose-500" />}
                        </div>
                      </button>

                      {showNonParticipants && (
                        compStats.nonParticipants.length === 0 ? (
                          <div className="px-5 py-6 text-center text-gray-500 text-sm bg-white">All eligible students have participated! 🎉</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm bg-white">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                  {['#', 'Name', 'Roll No', 'Email', 'Courses Enrolled', 'Classes Enrolled'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {compStats.nonParticipants.map((s, i) => (
                                  <tr key={s._id} className="hover:bg-rose-50/30 transition-colors">
                                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{s.name}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.rollNumber}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.email}</td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">{s.enrolledCourses.join(', ') || '—'}</td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">{s.enrolledClasses.join(', ') || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ViewProgress;
