import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus, Edit2, Trash2, User, Loader2, Filter,
  LogOut, Bell, LayoutDashboard, ListChecks, BookOpenCheck, LineChart,
  CreditCard, MessageSquare, UserCog, X, ChevronDown, Mail, Briefcase,
  Award, FileText, Settings, Eye, EyeOff, CheckSquare, Square, UploadCloud, ToggleLeft, ToggleRight,
  TrendingUp, Menu, Zap, MoreVertical, Snowflake
} from "lucide-react";

const API_URL = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/teachers`;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5 } })
};

const defaultTeacher = {
  name: '', email: '', role: '', status: 'Active',
  departmentStr: '', password: ''
};

const ManageTeachers = () => {
  const navigate = useNavigate();

  // State
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [modalTab, setModalTab] = useState('manual');
  const [CSVFile, setCSVFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ ...defaultTeacher });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [activeMenu, setActiveMenu] = useState('Manage Teachers');
  const [isEditing, setIsEditing] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionTeacher, setActionTeacher] = useState(null);
  const menuRef = useRef(null);

  // Handle resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Helper to get JWT header ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); // JWT stored in localStorage
    return { Authorization: `Bearer ${token}` };
  };

  // --- FETCH TEACHERS ---
  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(API_URL, { headers: getAuthHeaders() });
      setTeachers(res.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  // --- LOGOUT ---
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  // --- SELECTION ---
  const toggleSelection = (e, id) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredTeachers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTeachers.map(t => t._id));
    }
  };

  // --- CSV UPLOAD ---
  const handleCSVUpload = async () => {
    if (!CSVFile) return alert("Please select a CSV file first.");
    const formData = new FormData();
    formData.append("file", CSVFile);
    setIsUploading(true);
    try {
      const res = await axios.post(`${API_URL}/bulk`, formData, {
        headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" }
      });
      alert(res.data.message || "Batch upload successful!");
      setCSVFile(null);
      setShowAddModal(false);
      fetchTeachers();
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.message || "Bulk upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- SAVE TEACHER (CREATE / EDIT) ---
  const handleSaveTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.role) {
      return alert("Required: Name, Email, Role");
    }
    if (!isEditing && !newTeacher.password) {
      return alert("Password is required when creating a teacher");
    }
    if (!isEditing && newTeacher.password.length < 6) {
      return alert("Password must be at least 6 characters");
    }
    const payload = {
      ...newTeacher,
      department: typeof newTeacher.departmentStr === 'string' 
        ? newTeacher.departmentStr.split(',').map(s => s.trim()).filter(Boolean) 
        : [],
    };
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/${editingTeacherId}`, payload, { headers: getAuthHeaders() });
      } else {
        await axios.post(API_URL, payload, { headers: getAuthHeaders() });
      }
      fetchTeachers();
      setShowAddModal(false);
      setNewTeacher({ ...defaultTeacher });
    } catch (err) {
      alert(err.response?.data?.message || "Error saving teacher to database");
    }
  };

  // --- DELETE TEACHERS ---
  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected teachers permanently?`)) return;
    try {
      await Promise.all(selectedIds.map(id => axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() })));
      setTeachers(prev => prev.filter(t => !selectedIds.includes(t._id)));
      setSelectedIds([]);
      alert("Batch deletion successful");
    } catch (err) {
      alert("Error during bulk delete");
    }
  };

  const handleDeleteTeacher = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this teacher permanently?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
      setTeachers(prev => prev.filter(t => t._id !== id));
      setSelectedIds(prev => prev.filter(i => i !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  // --- EDIT / VIEW ---
  const handleEditTeacher = (e, t) => {
    e.stopPropagation();
    setNewTeacher({
      ...t,
      departmentStr: t.department?.join(', ') || '',
      password: ''
    });
    setEditingTeacherId(t._id);
    setIsEditing(true);
    setModalTab('manual');
    setShowAddModal(true);
  };

  const handleViewTeacher = (t) => {
    if (selectedIds.length > 0) return;
    setSelectedTeacher(t);
    setShowViewModal(true);
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

  // --- 3-DOTS MENU ACTIONS ---
  const handleFreeze = (e, teacher) => {
    e.stopPropagation();
    setActionTeacher(teacher);
    setShowFreezeModal(true);
    setOpenMenuId(null);
  };

  const handleDelete = (e, teacher) => {
    e.stopPropagation();
    setActionTeacher(teacher);
    setShowDeleteModal(true);
    setOpenMenuId(null);
  };

  const confirmFreeze = async () => {
    if (!actionTeacher) return;
    try {
      const newFreezeState = !actionTeacher.isFrozen;
      await axios.patch(`${API_URL}/${actionTeacher._id}/freeze`, { isFrozen: newFreezeState }, { headers: getAuthHeaders() });
      setTeachers(prev => prev.map(t => t._id === actionTeacher._id ? { ...t, isFrozen: newFreezeState } : t));
      setShowFreezeModal(false);
      setActionTeacher(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update freeze status');
    }
  };

  const confirmDelete = async () => {
    if (!actionTeacher) return;
    try {
      await axios.delete(`${API_URL}/${actionTeacher._id}`, { headers: getAuthHeaders() });
      setTeachers(prev => prev.filter(t => t._id !== actionTeacher._id));
      setSelectedIds(prev => prev.filter(i => i !== actionTeacher._id));
      setShowDeleteModal(false);
      setActionTeacher(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
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

  // Generate initials
  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    return parts.length >= 2 
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  // Color palette for cards
  const colorPalette = [
    { bg: 'bg-gradient-to-br from-violet-500 to-purple-600', border: 'border-l-violet-500' },
    { bg: 'bg-gradient-to-br from-blue-500 to-cyan-600', border: 'border-l-blue-500' },
    { bg: 'bg-gradient-to-br from-indigo-500 to-blue-600', border: 'border-l-indigo-500' },
    { bg: 'bg-gradient-to-br from-purple-500 to-pink-600', border: 'border-l-purple-500' },
  ];

  // --- FILTERED TEACHERS ---
  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
              <h1 className="text-2xl font-bold text-gray-800">Manage Teachers</h1>
            </div>
            <div className="flex items-center gap-3 mr-4">
              <button className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600"><Bell size={20} /><span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span></button>
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold uppercase shadow-lg shadow-indigo-200">A</div>
            </div>
          </div>
        </nav>

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-left">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Faculty Management</h2>
              <p className="text-slate-500 font-medium">Directory of faculty members and profile control</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setIsEditing(false); setNewTeacher({...defaultTeacher}); setShowAddModal(true); }}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all text-sm uppercase tracking-widest"
            >
              <Plus size={18} /> ADD NEW TEACHER
            </motion.button>
          </div>

          {/* SEARCH + FILTER + SELECT ALL */}
          <div className="flex flex-wrap gap-4 mb-8 items-center">
            <button 
                onClick={handleSelectAll}
                className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-3 rounded-2xl hover:bg-slate-50 transition-all group"
            >
                {selectedIds.length > 0 && selectedIds.length === filteredTeachers.length ? (
                    <CheckSquare size={20} className="text-indigo-600" />
                ) : (
                    <Square size={20} className="text-slate-300 group-hover:text-indigo-400" />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Select All</span>
            </button>

            <input 
              type="text" placeholder="Search by name or email..." 
              className="flex-1 min-w-[300px] bg-white border border-slate-200 px-6 py-3 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            />
            <select 
              className="bg-white border border-slate-200 px-6 py-3 rounded-2xl outline-none font-bold text-slate-600 cursor-pointer"
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>

          {/* TEACHER CARDS */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>
          ) : (
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredTeachers.map((t, i) => {
                const isSelected = selectedIds.includes(t._id);
                const colors = colorPalette[i % colorPalette.length];
                return (
                  <motion.div
                    key={t._id} custom={i} variants={cardVariants} initial="hidden" animate="visible"
                    onClick={() => handleViewTeacher(t)}
                    className={`bg-white rounded-[2rem] border overflow-hidden relative group hover:shadow-2xl transition-all duration-300 cursor-pointer border-l-8 ${colors.border} ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200'}`}
                  >
                    {/* Frozen overlay */}
                    {t.isFrozen && (
                      <div className="absolute inset-0 bg-blue-50/80 z-10 flex items-center justify-center">
                        <div className="bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                          <Snowflake size={16} /> Account Frozen
                        </div>
                      </div>
                    )}
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-6">
                        <button 
                          onClick={(e) => toggleSelection(e, t._id)}
                          className={`p-2 rounded-xl transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300 hover:text-indigo-400'}`}
                        >
                          {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                        </button>
                        
                        {/* 3-dots menu */}
                        <div className="relative" ref={openMenuId === t._id ? menuRef : null}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === t._id ? null : t._id); }}
                            className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-600 transition-colors shadow-sm"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          <AnimatePresence>
                            {openMenuId === t._id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-0 top-12 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-20 min-w-[160px]"
                              >
                                <button
                                  onClick={(e) => handleEditTeacher(e, t)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  <Edit2 size={14} className="text-indigo-600" />
                                  Edit Details
                                </button>
                                <button
                                  onClick={(e) => handleFreeze(e, t)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  <Snowflake size={14} className="text-blue-500" />
                                  {t.isFrozen ? 'Unfreeze Account' : 'Freeze Account'}
                                </button>
                                <button
                                  onClick={(e) => handleDelete(e, t)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={14} />
                                  Delete Teacher
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 mb-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg text-white ${colors.bg}`}>
                          {getInitials(t.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl font-bold text-slate-800 tracking-tight truncate">{t.name}</h3>
                          <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-lg inline-block mt-1 ${t.isFrozen ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                            {t.isFrozen ? 'Frozen' : t.status || 'Active'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-8 text-slate-500 text-sm font-medium">
                        <div className="flex items-center"><Mail size={16} className="mr-3 text-indigo-400 flex-shrink-0" /><span className="truncate">{t.email}</span></div>
                        <div className="flex items-center"><Briefcase size={16} className="mr-3 text-indigo-400 flex-shrink-0" /><span className="truncate">{t.role}</span></div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center font-black">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100"><div className="text-[9px] text-slate-400 uppercase mb-1">Courses</div><div className="text-lg text-slate-700">{t.courses?.length || 0}</div></div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100"><div className="text-[9px] text-slate-400 uppercase mb-1">Classes</div><div className="text-lg text-slate-700">{t.classes?.length || 0}</div></div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100"><div className="text-[9px] text-slate-400 uppercase mb-1">Students</div><div className="text-lg text-slate-700">{t.students || 0}</div></div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* BULK ACTION BAR */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 shadow-2xl px-8 py-4 rounded-3xl z-50 flex items-center gap-8 border border-slate-700">
              <div className="flex items-center gap-2"><span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">{selectedIds.length}</span><span className="text-white font-black text-[10px] uppercase tracking-widest">Selected</span></div>
              <button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"><Trash2 size={14} /> DELETE BATCH</button>
              <button onClick={() => setSelectedIds([])} className="text-slate-400 font-black hover:text-white text-[10px] uppercase tracking-widest transition-colors">CANCEL</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ADD/EDIT MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto border-l-[10px] border-indigo-600 relative">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{isEditing ? 'Modify Profile' : 'Add Teacher'}</h2>
                <button onClick={() => { setShowAddModal(false); setCSVFile(null); }} className="bg-slate-100 p-2 rounded-full hover:bg-red-500 hover:text-white transition-all"><X size={20} /></button>
              </div>

              <div className="flex gap-3 mb-6 bg-slate-100 p-1 rounded-xl">
                <button className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${modalTab === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`} onClick={() => setModalTab('manual')}>MANUAL ENTRY</button>
                {!isEditing && (
                   <button className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${modalTab === 'csv' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`} onClick={() => setModalTab('csv')}>CSV UPLOAD</button>
                )}
              </div>

              {modalTab === 'manual' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Full Name</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Email Address</label>
                      <input type="email" className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" value={newTeacher.email} onChange={e => setNewTeacher({...newTeacher, email: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">
                        Password {isEditing && <span className="normal-case text-slate-300 font-medium">(leave blank to keep current)</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="w-full bg-slate-50 border border-slate-100 p-3 pr-10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                          value={newTeacher.password}
                          onChange={e => setNewTeacher({...newTeacher, password: e.target.value})}
                          placeholder={isEditing ? "Leave blank to keep current" : "Enter password"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Role</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" value={newTeacher.role} onChange={e => setNewTeacher({...newTeacher, role: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block ml-1">Status</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold text-slate-600 cursor-pointer"
                        value={newTeacher.status}
                        onChange={e => setNewTeacher({...newTeacher, status: e.target.value})}
                      >
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-center pt-4">
                    <button onClick={handleSaveTeacher} className="w-2/3 bg-slate-900 text-white py-4 rounded-xl font-bold text-xs shadow-xl hover:bg-black transition-all uppercase tracking-[0.2em]">
                      {isEditing ? 'Commit Updates' : 'Create Teacher'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                    <input type="file" id="csv" hidden accept=".csv" onChange={e => setCSVFile(e.target.files[0])} />
                    <label htmlFor="csv" className="cursor-pointer group">
                      <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                        <UploadCloud size={24} />
                      </div>
                      <p className="font-bold text-slate-800 text-sm">{CSVFile ? CSVFile.name : 'Click to select CSV File'}</p>
                      <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-widest">Required: Name, Email, Role</p>
                    </label>
                  </div>
                  
                  <div className="flex justify-center">
                    <button 
                      onClick={handleCSVUpload}
                      disabled={!CSVFile || isUploading}
                      className={`w-2/3 py-4 rounded-xl font-bold text-xs shadow-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${
                        !CSVFile ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {isUploading ? (
                        <><Loader2 size={16} className="animate-spin" /> UPLOADING...</>
                      ) : (
                        <>START BATCH IMPORT</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FREEZE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showFreezeModal && actionTeacher && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Snowflake size={32} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {actionTeacher.isFrozen ? 'Unfreeze Account?' : 'Freeze Account?'}
                </h3>
                <p className="text-slate-500 mb-6">
                  {actionTeacher.isFrozen 
                    ? `This will allow ${actionTeacher.name} to log in again.`
                    : `This will prevent ${actionTeacher.name} from logging in.`}
                </p>
                <div className="flex gap-4 justify-center">
                  <button onClick={() => { setShowFreezeModal(false); setActionTeacher(null); }} className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    Cancel
                  </button>
                  <button onClick={confirmFreeze} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all">
                    {actionTeacher.isFrozen ? 'Unfreeze' : 'Freeze'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteModal && actionTeacher && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Teacher?</h3>
                <p className="text-slate-500 mb-6">
                  This will permanently delete <strong>{actionTeacher.name}</strong> and all associated data. This action cannot be undone.
                </p>
                <div className="flex gap-4 justify-center">
                  <button onClick={() => { setShowDeleteModal(false); setActionTeacher(null); }} className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    Cancel
                  </button>
                  <button onClick={confirmDelete} className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all">
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageTeachers;
