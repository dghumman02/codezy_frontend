import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus, BookOpenCheck, User, Bell, LayoutDashboard, ListChecks, LineChart,
  CreditCard, MessageSquare, UserCog, X, LogOut, Trash2, CheckSquare, Square,
  Award, FileText, Settings, ChevronRight, Hash, Loader2, Edit2, ChevronDown, FlaskConical, Users,
  TrendingUp, Menu, Zap, AlertTriangle
} from "lucide-react";

const API_COURSES = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/courses`;
const API_TEACHERS = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/teachers`;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } })
};

const ManageCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", courseCode: "", status: "Active", classes: [] });
  const [activeMenu, setActiveMenu] = useState("Manage Courses");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showOrphanModal, setShowOrphanModal] = useState(false);
  const [orphanData, setOrphanData] = useState(null);
  const [orphanLoading, setOrphanLoading] = useState(false);

  // Handle resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const token = localStorage.getItem("token");

const authHeaders = {
  headers: {
    Authorization: `Bearer ${token}`
  }
};


  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tRes, cRes] = await Promise.all([
        axios.get(API_TEACHERS, authHeaders),
        axios.get(API_COURSES, authHeaders)
      ]);
      setTeachers(tRes.data || []);
      setCourses(cRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getTeacherDisplayName = (classObj) => {
    if (classObj.teacher?.name) return classObj.teacher.name;
    const found = teachers.find(t => t._id === (classObj.teacherId || classObj.teacher));
    return found ? found.name : "Unassigned";
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  // --- DELETE LOGIC ---
  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleIndividualDelete = async (id) => {
    if (!window.confirm("Delete this course permanently?")) return;
    try {
      await axios.delete(`${API_COURSES}/${id}`, authHeaders);
      setCourses(prev => prev.filter(c => c._id !== id));
      setSelectedIds(prev => prev.filter(i => i !== id));
    } catch (err) {
      alert("Failed to delete course.");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected courses permanently?`)) return;
    try {
      await Promise.all(selectedIds.map(id => axios.delete(`${API_COURSES}/${id}`, authHeaders)));
      setCourses(prev => prev.filter(c => !selectedIds.includes(c._id)));
      setSelectedIds([]);
      alert("Batch deletion successful.");
    } catch (err) {
      alert("Error during bulk delete.");
    }
  };

  // DELETE CLASS (removes class from course, deletes enrolled students if not in other classes)
  const handleDeleteClass = async (courseId, classId, className) => {
    console.log("[Delete Class] Attempting to delete:", { courseId, classId, className });
    if (!classId) {
      alert("Error: Class ID is missing. Cannot delete class.");
      return;
    }
    if (!window.confirm(`Delete class "${className}" permanently?\n\nThis will also delete all students enrolled ONLY in this class.`)) return;
    try {
      const res = await axios.delete(`${API_COURSES}/${courseId}/classes/${classId}`, authHeaders);
      console.log("[Delete Class] Response:", res.data);
      // Refresh courses to reflect the change
      fetchData();
      alert(`Class deleted successfully.\n${res.data.studentsRemoved} students removed from class.\n${res.data.studentsDeleted} student accounts deleted.`);
    } catch (err) {
      console.error("Delete class error:", err);
      console.error("Error response:", err.response?.data);
      alert(`Failed to delete class: ${err.response?.data?.message || err.message}`);
    }
  };

  // --- ORPHAN STUDENTS ---
  const handleScanOrphans = async () => {
    setOrphanLoading(true);
    try {
      const res = await axios.get(`${API_COURSES}/orphan-students`, authHeaders);
      setOrphanData(res.data);
      setShowOrphanModal(true);
    } catch (err) {
      alert("Failed to scan for orphan students: " + (err.response?.data?.message || err.message));
    } finally {
      setOrphanLoading(false);
    }
  };

  const handleDeleteOrphans = async () => {
    if (!window.confirm(`Delete ${orphanData.orphanCount} orphan student(s) permanently? This cannot be undone.`)) return;
    try {
      const res = await axios.delete(`${API_COURSES}/orphan-students`, authHeaders);
      alert(res.data.message);
      setShowOrphanModal(false);
      setOrphanData(null);
    } catch (err) {
      alert("Failed to delete orphan students: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSaveCourse = async () => {
    if (!newCourse.title || !newCourse.courseCode) return alert("Required: Name and Code");
    const payload = {
      ...newCourse,
      classes: newCourse.classes.map(cls => {
        const mapped = { name: cls.name, teacher: cls.teacherId };
        if (cls._id) mapped._id = cls._id;
        return mapped;
      })
    };
    try {
      if (isEditing) await axios.put(`${API_COURSES}/${editingId}`, payload, authHeaders);
      else await axios.post(API_COURSES, payload, authHeaders);
      fetchData();
      setShowAddCourse(false);
      setIsEditing(false);
      setNewCourse({ title: "", courseCode: "", status: "Active", classes: [] });
    } catch (err) { alert("Error saving updates."); }
  };

  const handleEditClick = (e, course) => {
    e.stopPropagation();
    setNewCourse({
      title: course.title,
      courseCode: course.courseCode,
      status: course.status,
      classes: course.classes.map(cls => ({
        _id: cls._id,
        name: cls.name,
        teacherId: cls.teacher?._id || cls.teacher
      }))
    });
    setEditingId(course._id);
    setIsEditing(true);
    setShowAddCourse(true);
  };

  // --- MENU ITEM CLICK ---
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

  // --- NAVIGATION ITEMS (matching AdminDashboard) ---
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

  // --- SIDEBAR ITEM COMPONENT ---
  const SidebarItem = ({ icon: Icon, label, isSelected }) => {
    const defaultColor = 'text-white';
    const activeBg = isSelected ? 'bg-indigo-600/50 backdrop-blur-sm shadow-xl' : 'hover:bg-blue-700/50';
    const baseClasses = `w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-300 relative group`;
    return (
      <motion.button
        onClick={() => handleMenuItemClick(label)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`${baseClasses} ${activeBg} ${defaultColor}`}
      >
        <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-700' : 'bg-blue-800/70'} shadow-md`}>
          <Icon size={20} className={defaultColor} />
        </div>
        <span className="font-medium">{label}</span>
      </motion.button>
    );
  };

  // Animation variants
  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: isMobile ? -288 : 0 }
  };

  // Color palette for cards
  const colorPalette = [
    { border: 'border-l-violet-500', bg: 'bg-violet-50', text: 'text-violet-600' },
    { border: 'border-l-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
    { border: 'border-l-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600' },
    { border: 'border-l-purple-500', bg: 'bg-purple-50', text: 'text-purple-600' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 relative overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div variants={sidebarVariants} initial={isMobile ? "closed" : "open"} animate={sidebarOpen || !isMobile ? "open" : "closed"} 
        className="fixed md:relative z-50 w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col h-full shadow-2xl">
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-lg">
              <Zap size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Codezy</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {topMenuItems.map((item) => <SidebarItem key={item.label} icon={item.icon} label={item.label} isSelected={activeMenu === item.label} />)}
          <div className="my-6 border-t border-gray-700/50"></div>
          {mainNavigation.map((item) => <SidebarItem key={item.label} icon={item.icon} label={item.label} isSelected={activeMenu === item.label} />)}
          <div className="my-6 border-t border-gray-700/50"></div>
          {bottomNavigation.map((item) => <SidebarItem key={item.label} icon={item.icon} label={item.label} isSelected={activeMenu === item.label} />)}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-700/50">
          <motion.button
            onClick={handleLogout} 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 shadow-md text-white transition-all"
          >
            <div className="p-2 bg-red-700/50 rounded-lg flex items-center justify-center">
              <LogOut size={20} />
            </div>
            <span className="font-medium">Logout</span>
          </motion.button>
        </div>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <nav className="bg-white shadow-md sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Manage Courses</h1>
            </div>
            <div className="flex items-center gap-3 mr-4">
              <button className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600"><Bell size={20} /><span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span></button>
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold uppercase shadow-lg shadow-indigo-200">A</div>
            </div>
          </div>
        </nav>

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-8">
            <div className="text-left">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Course Management</h2>
              <p className="text-slate-500 font-medium">Academic staff management and course assignments</p>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleScanOrphans}
                disabled={orphanLoading}
                className="bg-amber-500 text-white px-5 py-3 rounded-xl shadow-xl font-bold flex items-center gap-2 hover:bg-amber-600 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
              >
                {orphanLoading ? <Loader2 size={18} className="animate-spin" /> : <AlertTriangle size={18} />} ORPHAN CLEANUP
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setIsEditing(false); setNewCourse({ title: "", courseCode: "", status: "Active", classes: [] }); setShowAddCourse(true); }}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all text-sm uppercase tracking-widest"
              >
                <Plus size={18} /> ADD NEW COURSE
              </motion.button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {courses.map((course, i) => {
                const totalStudents = course.classes?.reduce((acc, cls) => acc + (cls.students?.length || 0), 0);
                const totalLabs = course.classes?.reduce((acc, cls) => acc + (cls.labs?.length || 0), 0);
                const isSelected = selectedIds.includes(course._id);
                const colors = colorPalette[i % colorPalette.length];

                return (
                  <motion.div
                    key={course._id} custom={i} variants={cardVariants} initial="hidden" animate="visible"
                    className={`bg-white rounded-[2rem] border-l-8 ${colors.border} overflow-hidden relative group hover:shadow-2xl transition-all duration-300 ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200'}`}
                  >
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-6">
                        {/* RE-ADDED CHECKBOX */}
                        <button 
                          onClick={() => toggleSelection(course._id)}
                          className={`p-2 rounded-xl transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300 hover:text-indigo-400'}`}
                        >
                          {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                        </button>
                        
                        <div className="flex gap-2">
                          <button onClick={(e) => handleEditClick(e, course)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm"><Edit2 size={16}/></button>
                          <button onClick={() => handleIndividualDelete(course._id)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-all shadow-sm"><Trash2 size={16}/></button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-2">
                        <div className={`w-12 h-12 ${colors.bg} rounded-2xl flex items-center justify-center ${colors.text} font-black text-lg shadow-inner`}>{course.title.charAt(0)}</div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl font-black text-slate-800 tracking-tight truncate">{course.title}</h3>
                          <p className={`${colors.text} font-bold text-[10px] flex items-center gap-1 font-mono uppercase tracking-widest`}><Hash size={10}/>{course.courseCode}</p>
                        </div>
                      </div>

                      <div className="flex gap-3 mb-6 mt-6">
                        <div className="flex-1 bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Students</p>
                          <div className="text-xl font-black text-slate-700 tracking-tight">{totalStudents}</div>
                        </div>
                        <div className="flex-1 bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Labs</p>
                          <div className="text-xl font-black text-slate-700 tracking-tight">{totalLabs}</div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4">
                        <button onClick={() => setExpandedCourseId(expandedCourseId === course._id ? null : course._id)} className="w-full flex justify-between items-center text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">View Classes ({course.classes?.length || 0}) {expandedCourseId === course._id ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}</button>
                        <AnimatePresence>
                          {expandedCourseId === course._id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4 space-y-3">
                              {course.classes?.map((cls, idx) => (
                                <div key={idx} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col gap-4 relative overflow-hidden group/class">
                                  <div className={`absolute top-0 left-0 h-full w-1.5 ${colors.border.replace('border-l-', 'bg-')}`}></div>
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="text-xs font-black text-slate-800 block tracking-tight uppercase">{cls.name}</span>
                                      <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-500 uppercase mt-1"><User size={10}/> {getTeacherDisplayName(cls)}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-2xl text-center shadow-sm">
                                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">Avg. Score</p>
                                        <p className={`text-xs font-black ${colors.text}`}>{cls.averageScore || "0.0"}<span className="text-[9px] text-slate-300">/10</span></p>
                                      </div>
                                      <button 
                                        onClick={() => handleDeleteClass(course._id, cls._id, cls.name)}
                                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition-all shadow-sm opacity-0 group-hover/class:opacity-100"
                                        title="Delete Class"
                                      >
                                        <Trash2 size={14}/>
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex gap-6 border-t border-slate-200/50 pt-2 font-bold text-[10px] uppercase text-slate-500 tracking-tighter">
                                    <div className="flex items-center gap-1.5"><Users size={12} className="text-indigo-500"/> {cls.students?.length || 0} Enrollments</div>
                                    <div className="flex items-center gap-1.5"><FlaskConical size={12} className="text-purple-500"/> {cls.labs?.length || 0} Active Units</div>
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* BULK ACTION BAR */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 shadow-2xl px-8 py-4 rounded-3xl z-50 flex items-center gap-8 border border-slate-700"
            >
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">{selectedIds.length}</span>
                <span className="text-white font-black text-[10px] uppercase tracking-widest">Courses Selected</span>
              </div>
              <div className="h-8 w-[1px] bg-slate-700"></div>
              <button 
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] transition-all"
              >
                <Trash2 size={14} /> Delete Batch
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                className="text-slate-400 font-black hover:text-white text-[10px] uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ADD/EDIT MODAL */}
      <AnimatePresence>
        {showAddCourse && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto border-l-[10px] border-indigo-600 relative">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{isEditing ? 'Modify Course' : 'New Course'}</h2>
                <button onClick={() => setShowAddCourse(false)} className="bg-slate-100 p-2 rounded-full hover:bg-red-100 hover:text-red-500 transition-all"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Course Name</label>
                        <input type="text" placeholder="E.G. DATA STRUCTURES" className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-black text-slate-800 text-sm uppercase tracking-wider" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">System Identifier</label>
                        <input type="text" placeholder="E.G. CS-101" className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-black text-indigo-600 uppercase tracking-widest text-sm" value={newCourse.courseCode} onChange={e => setNewCourse({...newCourse, courseCode: e.target.value})} />
                    </div>
                </div>

                <div className="pt-2">
                  <h3 className="font-black text-slate-800 uppercase text-[11px] mb-4 tracking-widest flex items-center gap-2 border-l-4 border-indigo-500 pl-3">Assignments</h3>
                  <div className="space-y-3">
                    {newCourse.classes.map((cls, idx) => (
                      <div key={idx} className="flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative group">
                        <button onClick={() => setNewCourse({...newCourse, classes: newCourse.classes.filter((_, i) => i !== idx)})} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors"><X size={16}/></button>
                        <div className="flex gap-2">
                            <input placeholder="CLASS TAG" className="flex-1 bg-white p-3 rounded-lg outline-none text-[11px] font-black uppercase shadow-sm border border-slate-100 focus:border-indigo-300 tracking-wider" value={cls.name} onChange={e => {
                                const updated = [...newCourse.classes]; updated[idx].name = e.target.value; setNewCourse({...newCourse, classes: updated});
                            }} />
                            <select className="flex-1 bg-white p-3 rounded-lg outline-none text-[10px] font-black uppercase shadow-sm border border-slate-100 focus:border-indigo-300 text-slate-600 appearance-none cursor-pointer" value={cls.teacherId} onChange={e => {
                                const updated = [...newCourse.classes]; updated[idx].teacherId = e.target.value; setNewCourse({...newCourse, classes: updated});
                            }}>
                              <option value="">SELECT FACULTY</option>
                              {teachers.map(t => <option key={t._id} value={t._id}>{t.name.toUpperCase()} — {t.email.toLowerCase()}</option>)}
                            </select>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setNewCourse({...newCourse, classes: [...newCourse.classes, {name:"", teacherId:""}]})} className="mt-4 text-indigo-600 text-[10px] font-black uppercase hover:bg-indigo-50 px-4 py-2 rounded-lg transition-all font-black">+ REGISTER NEW CLASS</button>
                </div>

                <div className="flex justify-center pt-4">
                  <button onClick={handleSaveCourse} className="w-full md:w-3/4 bg-slate-900 text-white py-4 rounded-xl font-black text-xs shadow-xl hover:bg-black transition-all uppercase tracking-widest">
                    {isEditing ? 'COMMIT DATA UPDATES' : 'PUBLISH COURSE'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ORPHAN STUDENTS MODAL */}
      <AnimatePresence>
        {showOrphanModal && orphanData && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto border-l-[10px] border-amber-500 relative">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <AlertTriangle size={24} className="text-amber-500" /> Orphan Students
                </h2>
                <button onClick={() => setShowOrphanModal(false)} className="bg-slate-100 p-2 rounded-full hover:bg-red-100 hover:text-red-500 transition-all"><X size={20} /></button>
              </div>

              <div className="mb-4 flex gap-4">
                <div className="flex-1 bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Total Students</p>
                  <div className="text-xl font-black text-slate-700">{orphanData.totalStudents}</div>
                </div>
                <div className="flex-1 bg-amber-50 p-3 rounded-2xl text-center border border-amber-200">
                  <p className="text-[9px] font-bold text-amber-500 uppercase mb-1 tracking-wider">Orphaned</p>
                  <div className="text-xl font-black text-amber-600">{orphanData.orphanCount}</div>
                </div>
              </div>

              {orphanData.orphanCount === 0 ? (
                <p className="text-center text-slate-500 py-8 font-medium">No orphan students found. All students are enrolled in at least one class.</p>
              ) : (
                <>
                  <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                    {orphanData.orphans.map(s => (
                      <div key={s._id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-black text-slate-800 uppercase">{s.name}</p>
                          <p className="text-[10px] text-slate-500">{s.email} | {s.rollNumber}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleDeleteOrphans}
                    className="w-full bg-red-600 text-white py-3 rounded-xl font-black text-xs shadow-xl hover:bg-red-700 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Delete All Orphan Students ({orphanData.orphanCount})
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageCourses;