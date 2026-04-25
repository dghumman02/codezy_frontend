import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, FlaskConical, Users, Zap, TrendingUp, FileText, ChevronRight, Filter, Calendar, Clock, Megaphone, X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from "react-router-dom";
import NotificationDropdown from '../NotificationDropdown';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ labs: 0, students: 0 });
  const [teacherId, setTeacherId] = useState(null);
  const [teacherName, setTeacherName] = useState("");
  const [teacherLabs, setTeacherLabs] = useState([]);

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [openAnnouncement, setOpenAnnouncement] = useState(null);
  const [hoveredLab, setHoveredLab] = useState(null);
  
  // Filter states
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");

  // Fetch labs from all courses & classes
  const fetchTeacherLabs = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/courses/teacher/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const coursesData = await res.json();
      const labsFromCourses = [];
      const uniqueCourses = [];
      
      coursesData.forEach(course => {
        // Extract unique courses with their classes
        uniqueCourses.push({
          _id: course._id,
          title: course.title,
          courseCode: course.courseCode,
          classes: course.classes?.map(cl => ({ _id: cl._id, name: cl.name })) || []
        });
        
        if (course.classes?.length) {
          course.classes.forEach(cl => {
            cl.labs?.forEach(lab => {
              labsFromCourses.push({
                ...lab,
                courseTitle: course.title,
                courseCode: course.courseCode,
                className: cl.name,
                students: cl.students?.length || 0,
                submissionsCount: lab.submissions?.length || 0,
                parentClassId: cl._id,
                courseId: course._id 
              });
            });
          });
        }
      });

      setCourses(uniqueCourses);
      setTeacherLabs(labsFromCourses);
    } catch (err) {
      console.error("Error fetching labs:", err);
      setTeacherLabs([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch announcements for this teacher
  const fetchAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const announcementNotifs = (data.notifications || []).filter(
        n => n.type === 'ANNOUNCEMENT'
      );
      setAnnouncements(announcementNotifs);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  // Load teacher info
  useEffect(() => {
    const id = localStorage.getItem("userId");
    const name = localStorage.getItem("fullName");
    if (!id) return;

    setTeacherId(id);
    setTeacherName(name);
    fetchTeacherLabs(id);
    fetchAnnouncements();
  }, []);

  //useEffect(() => {
    //if (teacherId) fetchTeacherLabs(teacherId);
  //}, [teacherId]);

  // Helper function to check if a lab is expired (moved up for use in stats)
  const checkLabExpired = (lab) => {
    if (!lab.dueDate) return false;
    const now = new Date();
    const dueDate = new Date(lab.dueDate);
    if (lab.dueTime) {
      const [hours, minutes] = lab.dueTime.split(':');
      dueDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    } else {
      dueDate.setHours(23, 59, 59, 999);
    }
    return now > dueDate;
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("fullName");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login"); 
  };

  const getLifecycleColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Draft': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Closed': return 'bg-red-100 text-red-700 border-red-200';
      case 'Expired': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200'; // Default color for old labs
    }
  };

  // Get effective status considering expiry
  const getEffectiveStatus = (lab) => {
    if (lab.status === 'Draft' || lab.status === 'Closed') return lab.status;
    // For Active or old labs (no status), check if expired
    if (lab.status === 'Active' || !lab.status) {
      return checkLabExpired(lab) ? 'Expired' : 'Active';
    }
    return lab.status || 'Active';
  };

  // Get classes for selected course
  const availableClasses = useMemo(() => {
    if (selectedCourse === "all") return [];
    const course = courses.find(c => c._id === selectedCourse);
    return course?.classes || [];
  }, [selectedCourse, courses]);

  // Reset class selection when course changes
  useEffect(() => {
    setSelectedClass("all");
  }, [selectedCourse]);

  // Logic to separate and filter lists
  // Old labs without a status field are treated as "Active"
  const filteredLabs = useMemo(() => {
    let labs = teacherLabs;
    
    // Filter by course
    if (selectedCourse !== "all") {
      labs = labs.filter(lab => lab.courseId === selectedCourse);
    }
    
    // Filter by class
    if (selectedClass !== "all") {
      labs = labs.filter(lab => lab.parentClassId === selectedClass);
    }
    
    return labs;
  }, [teacherLabs, selectedCourse, selectedClass]);

  // Updated stats logic - reactive to filters, counts only non-expired active labs, deduplicates students by class
  useEffect(() => {
    // Count only labs that are truly active (Active or no status) AND not expired
    const labsCount = filteredLabs?.filter(lab => {
      if (lab.status !== "Active" && lab.status) return false;
      return !checkLabExpired(lab);
    }).length || 0;

    // Count unique students per class (not per lab) to avoid double counting
    const uniqueClassIds = new Set();
    let studentsCount = 0;
    filteredLabs?.forEach(lab => {
      if (lab.parentClassId && !uniqueClassIds.has(lab.parentClassId)) {
        uniqueClassIds.add(lab.parentClassId);
        studentsCount += lab.students || 0;
      }
    });

    setStats({ labs: labsCount, students: studentsCount });
  }, [filteredLabs]);

  // Sort by creation time (most recent first) and filter by status
  const activeLabsList = useMemo(() => {
    return filteredLabs
      .filter(lab => lab.status === "Active" || !lab.status)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [filteredLabs]);
  
  const draftLabsList = useMemo(() => {
    return filteredLabs
      .filter(lab => lab.status === "Draft")
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [filteredLabs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 relative overflow-hidden">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                onClick={() => navigate('/teacher')}
                className="text-indigo-600 font-bold text-xl flex items-center cursor-pointer"
              >
                <span className="text-2xl mr-1">&lt;/&gt;</span>
                <span>Codezy</span>
              </motion.div>
            </div>
            <div className="hidden md:flex items-center space-x-8 font-medium">
              <span className="text-indigo-600 border-b-2 border-indigo-600 py-5 px-1">Dashboard</span>
              <a className="py-5 px-1 text-gray-600 hover:text-indigo-600 transition" href="/mycourses">My Courses</a>
              <a className="py-5 px-1 text-gray-600 hover:text-indigo-600 transition" href="/createlab">Create Lab</a>
              <a className="py-5 px-1 text-gray-600 hover:text-indigo-600 transition" href="/reports">Reports</a>
              <a className="py-5 px-1 text-gray-600 hover:text-indigo-600 transition" href="/profile">Profile</a>
              <NotificationDropdown />
              <button className="py-5 px-1 text-gray-600 hover:text-indigo-600 transition" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-2xl p-6 text-white shadow-xl">
              <h1 className="text-2xl font-bold mb-1">Welcome back, {teacherName || "Teacher"}! 👋</h1>
              <p className="text-indigo-100">Ready to inspire your students today?</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[ 
                { icon: FlaskConical, label: 'Active Labs', value: stats.labs },
                { icon: Users, label: 'Total Students', value: stats.students }
              ].map((stat, index) => (
                <div key={index} className="bg-white rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <stat.icon className="text-indigo-600" size={24} />
                    <TrendingUp className="text-emerald-500" size={16} />
                  </div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* My Labs Section (Includes previously created labs) */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                   <FlaskConical className="text-indigo-600" size={20}/>
                   My Labs
                </h2>
                
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <Filter size={16} className="text-gray-500" />
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Courses</option>
                    {courses.map(course => (
                      <option key={course._id} value={course._id}>
                        {course.title} ({course.courseCode})
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    disabled={selectedCourse === "all"}
                    className={`px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      selectedCourse === "all" ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <option value="all">All Classes</option>
                    {availableClasses.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <p className="text-gray-500">Loading labs...</p>
              ) : activeLabsList.length === 0 ? (
                <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-500 italic">
                   No labs available.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {activeLabsList.map((lab) => {
                    const effectiveStatus = getEffectiveStatus(lab);
                    return (
                      <div 
                        key={lab._id}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 flex flex-col gap-3 transform hover:scale-105 hover:shadow-xl transition-all duration-500"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg text-gray-900">{lab.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getLifecycleColor(effectiveStatus)}`}>
                            {effectiveStatus}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-500">{lab.courseTitle} ({lab.courseCode}) — Class: {lab.className}</p>
                        
                        {/* Date information */}
                        <div className="flex gap-4 text-xs text-gray-500 flex-wrap items-center">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-indigo-500" />
                            Created: {lab.startDate ? `${new Date(lab.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${lab.startTime ? ` at ${lab.startTime}` : ''}` : 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} className={effectiveStatus === 'Expired' ? 'text-orange-500' : 'text-emerald-500'} />
                            Due: {lab.dueDate ? `${new Date(lab.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${lab.dueTime ? ` at ${lab.dueTime}` : ''}` : 'No deadline'}
                          </span>
                        </div>
                        
                        {/* Statistics display */}
                        <div className="flex gap-4 text-xs text-gray-500 flex-wrap items-center">
                          <span className="flex items-center gap-1"><Users size={12} /> {lab.students} students</span>
                          <span className="flex items-center gap-1"><FlaskConical size={12} /> {lab.submissionsCount} submissions</span>
                        </div>

                        <div className="mt-2">
                          <button onClick={() => navigate(`/courses/${lab.courseId}/class/${lab.parentClassId}/labs/${lab._id}/submissions`)} 
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                            View Submissions
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drafts Section - Separated lower down */}
            {draftLabsList.length > 0 && (
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="text-gray-400" size={20} />
                  <h2 className="text-lg font-bold text-gray-500">Drafts & Unfinished Work</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {draftLabsList.map((lab) => (
                    <div key={lab._id} className="bg-gray-100/50 border border-gray-200 rounded-2xl p-4 flex flex-col justify-between hover:bg-white transition-all duration-300 group">
                      <div>
                        <h4 className="font-bold text-gray-700">{lab.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{lab.courseCode} • {lab.className}</p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Calendar size={10} />
                          Created: {lab.startDate ? `${new Date(lab.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${lab.startTime ? ` at ${lab.startTime}` : ''}` : 'N/A'}
                        </p>
                      </div>
                      <button 
                        onClick={() => navigate(`/createlab/${lab._id}/${lab.courseId}/${lab.parentClassId}`)}
                        className="mt-3 text-indigo-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all"
                      >
                        Continue Editing <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Actions + Announcements) */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <Zap className="mr-2 text-yellow-500" size={18} />
                Quick Actions
              </h3>
              <button onClick={() => navigate(`/course-students`)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl hover:shadow-md transition-all">
                Upload Student List
              </button>
              <Link to="/createlab">
                <button className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-3 rounded-xl hover:shadow-md transition-all">
                  Create New Lab
                </button>
              </Link>
            </div>

            {/* Announcements Panel */}
            <div className="bg-white rounded-2xl p-5 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Megaphone className="text-purple-500" size={18} />
                Announcements
                {announcements.filter(a => !a.isRead).length > 0 && (
                  <span className="ml-auto bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {announcements.filter(a => !a.isRead).length} new
                  </span>
                )}
              </h3>

              {announcementsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <Megaphone size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No announcements yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {announcements.map(a => (
                    <button
                      key={a._id}
                      onClick={() => setOpenAnnouncement(a)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors hover:border-purple-300 hover:bg-purple-50
                        ${!a.isRead ? 'bg-purple-50/60 border-purple-200' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base mt-0.5">📣</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${!a.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                            {a.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{a.subject || a.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        {!a.isRead && <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-1.5" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Announcement detail modal */}
          {openAnnouncement && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg shadow">📣</div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-purple-500">Announcement</p>
                      <h2 className="text-base font-bold text-gray-900 leading-snug mt-0.5">{openAnnouncement.title}</h2>
                    </div>
                  </div>
                  <button onClick={() => setOpenAnnouncement(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0">
                    <X size={18} />
                  </button>
                </div>
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
                  {openAnnouncement.senderName && (
                    <span>From: <span className="font-medium text-gray-700">{openAnnouncement.senderName}</span></span>
                  )}
                  <span>Sent: <span className="font-medium text-gray-700">{new Date(openAnnouncement.createdAt).toLocaleString()}</span></span>
                  {openAnnouncement.subject && (
                    <span className="w-full">Subject: <span className="font-medium text-gray-700">{openAnnouncement.subject}</span></span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {openAnnouncement.announcementBody || openAnnouncement.message}
                  </p>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => setOpenAnnouncement(null)}
                    className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}