import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, LogOut, Bell, LayoutDashboard, ListChecks, BookOpenCheck, LineChart,
  CreditCard, MessageSquare, UserCog, Trash2, Menu, X, Users, BookOpen, TrendingUp, Zap,
  MoreVertical, Snowflake, AlertTriangle, Eye, ChevronRight
} from 'lucide-react';

// Custom hook for count-up stats
const useCountUp = (end, duration = 2000) => {
  const [count, setCount] = useState(0);
  const start = 0;
  const increment = (end - start) / (duration / 16);

  useEffect(() => {
    let currentCount = start;
    const step = () => {
      currentCount += increment;
      if (currentCount < end) setCount(Math.round(currentCount));
      else setCount(end);
      if (currentCount < end) requestAnimationFrame(step);
    };
    const timer = setTimeout(() => { requestAnimationFrame(step); }, 500);
    return () => clearTimeout(timer);
  }, [end, duration, increment, start]);

  return count;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [teachers, setTeachers] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [profileModalData, setProfileModalData] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, type: '', teacher: null });
  const [hasAnimated, setHasAnimated] = useState(false);
  const dropdownRef = useRef(null);

  const facultyCount = useCountUp(teachers.length);
  const studentsCount = useCountUp(totalStudents);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch teachers
        const teachersRes = await fetch('http://localhost:5000/api/teachers', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (teachersRes.ok) {
          const teachersData = await teachersRes.json();
          console.log('Teachers data:', teachersData); // Debug log
          setTeachers(teachersData);
          
          // Calculate total students from teachers' enrolled students
          const totalStudentsCount = teachersData.reduce((sum, teacher) => sum + (teacher.students || 0), 0);
          console.log('Total students count:', totalStudentsCount); // Debug log
          setTotalStudents(totalStudentsCount);
          
          // Mark initial animation as complete after a brief delay
          setTimeout(() => setHasAnimated(true), 1000);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Refresh teachers list
  const refreshTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const teachersRes = await fetch('http://localhost:5000/api/teachers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachers(teachersData);
        const totalStudentsCount = teachersData.reduce((sum, teacher) => sum + (teacher.students || 0), 0);
        setTotalStudents(totalStudentsCount);
      }
    } catch (err) {
      console.error('Error refreshing teachers:', err);
    }
  };

  // Handle freeze/unfreeze teacher
  const handleFreezeTeacher = async (teacher) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = teacher.isFrozen ? 'unfreeze' : 'freeze';
      const res = await fetch(`http://localhost:5000/api/teachers/${teacher._id}/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        await refreshTeachers();
        setConfirmModal({ show: false, type: '', teacher: null });
        alert(`Teacher account ${teacher.isFrozen ? 'unfrozen' : 'frozen'} successfully`);
      } else {
        const data = await res.json();
        alert(data.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Error freezing/unfreezing teacher:', err);
      alert('An error occurred');
    }
  };

  // Handle delete teacher
  const handleDeleteTeacher = async (teacher) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/teachers/${teacher._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        await refreshTeachers();
        setConfirmModal({ show: false, type: '', teacher: null });
        alert('Teacher deleted successfully');
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (err) {
      console.error('Error deleting teacher:', err);
      alert('An error occurred');
    }
  };

  // Fetch teacher profile with detailed information
  const fetchTeacherProfile = async (teacherId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/teachers/${teacherId}/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
      return null;
    } catch (err) {
      console.error('Error fetching teacher profile:', err);
      return null;
    }
  };

  const openProfileModal = async (teacher) => {
    const profileData = await fetchTeacherProfile(teacher._id);
    if (profileData) {
      // Transform the API response to match expected format
      setProfileModalData({
        ...teacher,
        courseLoad: profileData.courses?.length || 0,
        classesLoad: profileData.classes?.length || 0,
        totalStudents: profileData.totalStudents || teacher.students || 0,
        courses: profileData.courses || [],
        classes: profileData.classes || []
      });
    } else {
      // Fallback to basic teacher data
      setProfileModalData(teacher);
    }
  };

  const topMenuItems = [
    { icon: Bell, label: 'Make Announcement', color: 'from-purple-500 to-pink-500' },
    { icon: TrendingUp, label: 'Create Competition', color: 'from-green-500 to-emerald-500' },
  ];

  const mainNavigation = [
    { icon: LayoutDashboard, label: 'Dashboard', isSelected: true },
    { icon: ListChecks, label: 'Manage Teachers' },
    { icon: BookOpenCheck, label: 'Manage Courses' },
    { icon: LineChart, label: 'View Progress' },
    { icon: CreditCard, label: 'Payment & Subscription' },
  ];

  const bottomNavigation = [
    { icon: MessageSquare, label: 'Feedback' },
    { icon: UserCog, label: 'Contact Super Admin' },
  ];

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    return parts.length >= 2 
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  // Color palette for faculty cards
  const colorPalette = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-teal-500 to-green-500',
  ];
const handleLogout = () => {
    // 1. Clear Local Storage
    try {
      localStorage.clear();
      console.log("Local storage cleared upon logout.");
    } catch (error) {
      console.error("Could not clear local storage:", error);
    }

    // 2. Navigate to the login page
    navigate('/login');
  };
  const handleMenuItemClick = (label) => {
    setActiveMenu(label);
    if (isMobile) setSidebarOpen(false);

    switch (label) {
      case 'Manage Teachers':
        navigate('/admin/teachers');
        break;
      case 'Manage Courses':
        navigate('/admin/courses');
        break;
      case 'View Progress':
        navigate('/admin/progress');
        break;
      case 'Payment & Subscription':
        navigate('/admin/payments');
        break;
      case 'Dashboard':
        navigate('/admin');
        break;
      case 'Create Competition':
        navigate('/admin/competitions/create');
        break;
      case 'Make Announcement':
        navigate('/admin/announcements/new');
        break;
      case 'Feedback':
        navigate('/admin/feedback');
        break;
      default:
        break;
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Active') return 'bg-emerald-500/10 text-emerald-600 font-semibold';
    if (status === 'Frozen') return 'bg-blue-500/10 text-blue-600 font-semibold';
    return 'bg-amber-500/10 text-amber-600 font-semibold';
  };

  const sidebarVariants = {
    open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } }
  };

  const statsVariants = {
    hidden: { y: 50, opacity: 0, scale: 0.9 },
    visible: (i) => ({ y: 0, opacity: 1, scale: 1, transition: { delay: i * 0.2, type: 'spring', stiffness: 100, damping: 15 } })
  };

  const FacultyCard = ({ faculty, index, teacher }) => (
    <motion.div
      custom={index}
      variants={statsVariants}
      initial={hasAnimated ? false : "hidden"}
      animate="visible"
      whileHover={{ scale: 1.02, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04)' }}
      className={`bg-white rounded-xl p-5 shadow-lg border ${teacher?.isFrozen ? 'border-blue-300 bg-blue-50/30' : 'border-gray-100/70'}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 bg-gradient-to-r ${faculty.color} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${teacher?.isFrozen ? 'opacity-60' : ''}`}>
            {faculty.initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{faculty.name}</h3>
              {teacher?.isFrozen && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Snowflake size={10} /> Frozen
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">{faculty.position}</p>
          </div>
        </div>
        
        {/* Three dots menu */}
        <div className="relative" ref={activeDropdownId === teacher?._id ? dropdownRef : null}>
          <button 
            onClick={() => setActiveDropdownId(activeDropdownId === teacher?._id ? null : teacher?._id)}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <MoreVertical size={18} />
          </button>
          
          {activeDropdownId === teacher?._id && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
              <button
                onClick={() => {
                  setActiveDropdownId(null);
                  setConfirmModal({ show: true, type: teacher?.isFrozen ? 'unfreeze' : 'freeze', teacher });
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Snowflake size={16} className={teacher?.isFrozen ? 'text-emerald-500' : 'text-blue-500'} />
                {teacher?.isFrozen ? 'Unfreeze Account' : 'Freeze Account'}
              </button>
              <button
                onClick={() => {
                  setActiveDropdownId(null);
                  setConfirmModal({ show: true, type: 'delete', teacher });
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Account
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm font-medium text-gray-700 mb-3 border-b pb-3 border-gray-100">
        Total classes managed: <span className="font-bold text-blue-600">{faculty.classesManaged}</span>
      </p>

      <div className="space-y-4">
        {faculty.subjects.length > 0 ? (
          faculty.subjects.map((subject, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded-lg flex justify-between items-start text-sm">
              <div className="flex flex-col space-y-1">
                <span className="font-medium text-gray-800">{subject.name}</span>
                <span className="text-xs text-gray-500">Students: {subject.students}</span>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(subject.status)}`}>{subject.status}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm italic text-center py-2">No classes assigned yet</p>
        )}
      </div>
      
      <div className="mt-4 text-center">
        <button 
          onClick={() => openProfileModal(teacher)}
          className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center justify-center w-full"
        >
          View complete profile <ChevronRight size={16} className="ml-1" />
        </button>
      </div>
    </motion.div>
  );

  const SidebarItem = ({ icon: Icon, label, isSelected }) => {
    const defaultColor = isSelected ? 'text-white' : 'text-blue-200';
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
       {/* Logout Button (MODIFIED SECTION) */}
        <div className="p-4 border-t border-gray-700/50">
          {/* Removed <a> tag and its href. The navigation is now handled by handleLogout via React Router. */}
          <motion.button
            // The key change: attach the logout function to onClick
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

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <nav className="bg-white shadow-md sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            </div>
          </div>
        </nav>

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {[{ title: 'Total Faculty Members', value: facultyCount, icon: Users, color: 'from-blue-500 to-cyan-500' },
              { title: 'Total Students Enrolled', value: studentsCount, icon: BookOpen, color: 'from-purple-500 to-pink-500' }].map((stat, index) => (
              <motion.div key={stat.title} custom={index} variants={statsVariants} initial="hidden" animate="visible"
                whileHover={{ scale: 1.05, y: -5, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100/70 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">{stat.title}</p>
                    <motion.p className="text-5xl font-extrabold text-gray-900">{stat.value}</motion.p>
                  </div>
                  <div className={`p-4 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                    <stat.icon className="text-white" size={32} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Faculty grid */}
          <motion.div className="bg-white rounded-2xl shadow-xl border border-gray-100/70 overflow-hidden"
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}>
            <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Faculty Access List</h2>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input type="text" placeholder="Search faculty..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm w-40 sm:w-64" />
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading teachers...</div>
              ) : teachers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No teachers found</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {teachers.map((teacher, index) => {
                    const faculty = {
                      id: teacher._id,
                      initials: getInitials(teacher.name),
                      name: teacher.name || 'N/A',
                      position: teacher.role || 'Teacher',
                      classesManaged: teacher.classesLoad || 0,
                      color: colorPalette[index % colorPalette.length],
                      subjects: teacher.classes?.map((className, idx) => ({
                        name: className,
                        students: '-', // Will show correct count in profile modal
                        avgScore: 'N/A',
                        status: 'Active'
                      })) || []
                    };
                    return <FacultyCard key={faculty.id} faculty={faculty} index={index} teacher={teacher} />;
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmModal({ show: false, type: '', teacher: null })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                {confirmModal.type === 'delete' ? (
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="text-red-600" size={24} />
                  </div>
                ) : (
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Snowflake className="text-blue-600" size={24} />
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900">
                  {confirmModal.type === 'delete' ? 'Delete Teacher' : 
                   confirmModal.type === 'freeze' ? 'Freeze Account' : 'Unfreeze Account'}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                {confirmModal.type === 'delete' && (
                  <>Are you sure you want to delete <strong>{confirmModal.teacher?.name}</strong>? This action cannot be undone.</>
                )}
                {confirmModal.type === 'freeze' && (
                  <>Are you sure you want to freeze <strong>{confirmModal.teacher?.name}</strong>'s account? They will not be able to access Codezy until unfrozen.</>
                )}
                {confirmModal.type === 'unfreeze' && (
                  <>Are you sure you want to unfreeze <strong>{confirmModal.teacher?.name}</strong>'s account? They will regain full access to Codezy.</>
                )}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ show: false, type: '', teacher: null })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmModal.type === 'delete') {
                      handleDeleteTeacher(confirmModal.teacher);
                    } else {
                      handleFreezeTeacher(confirmModal.teacher);
                    }
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                    confirmModal.type === 'delete' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : confirmModal.type === 'freeze'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {confirmModal.type === 'delete' ? 'Delete' : 
                   confirmModal.type === 'freeze' ? 'Freeze' : 'Unfreeze'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {profileModalData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setProfileModalData(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                      {getInitials(profileModalData.name)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{profileModalData.name}</h2>
                      <p className="text-indigo-200">{profileModalData.role || 'Teacher'}</p>
                      <p className="text-sm text-indigo-200">{profileModalData.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setProfileModalData(null)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="p-6 grid grid-cols-3 gap-4 border-b">
                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-600">{profileModalData.courseLoad || 0}</p>
                  <p className="text-sm text-gray-500">Courses</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">{profileModalData.classesLoad || 0}</p>
                  <p className="text-sm text-gray-500">Classes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">{profileModalData.totalStudents || 0}</p>
                  <p className="text-sm text-gray-500">Students</p>
                </div>
              </div>

              {/* Courses Managed */}
              <div className="p-6 border-b">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Courses Assigned</h3>
                {profileModalData.courses && profileModalData.courses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {profileModalData.courses.map((course, idx) => (
                      <div key={idx} className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <h4 className="font-semibold text-gray-900">{course.name || 'Unnamed Course'}</h4>
                        <p className="text-xs text-gray-500">{course.courseCode || 'No Code'}</p>
                        <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-indigo-200">
                          <div className="text-center">
                            <p className="text-sm font-bold text-indigo-600">{course.classCount || 0}</p>
                            <p className="text-[9px] text-gray-500 uppercase">Classes</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-purple-600">{course.studentCount || 0}</p>
                            <p className="text-[9px] text-gray-500 uppercase">Students</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-blue-600">{course.labCount || 0}</p>
                            <p className="text-[9px] text-gray-500 uppercase">Labs</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-amber-600">{course.avgScore || 0}%</p>
                            <p className="text-[9px] text-gray-500 uppercase">Avg</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4 italic">No courses assigned yet</p>
                )}
              </div>

              {/* Classes Details */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Classes Managed</h3>
                {profileModalData.classes && profileModalData.classes.length > 0 ? (
                  <div className="space-y-3">
                    {profileModalData.classes.map((cls, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">{cls.name || 'Unnamed Class'}</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              Course: {cls.courseName || 'Unknown'} {cls.courseCode ? `(${cls.courseCode})` : ''}
                            </p>
                          </div>
                          <span className="text-xs bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full">Active</span>
                        </div>
                        <div className="flex gap-6 mt-3 pt-3 border-t border-gray-200">
                          <div className="text-center">
                            <p className="text-lg font-bold text-purple-600">{cls.studentCount || 0}</p>
                            <p className="text-[10px] text-gray-500 uppercase">Students</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-blue-600">{cls.labCount || 0}</p>
                            <p className="text-[10px] text-gray-500 uppercase">Labs</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-amber-600">{cls.avgScore || 0}%</p>
                            <p className="text-[10px] text-gray-500 uppercase">Avg Score</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8 italic">No classes assigned yet</p>
                )}
              </div>

              {/* Account Status */}
              <div className="p-6 bg-gray-50 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Account Status</p>
                    <p className={`font-semibold ${profileModalData.isFrozen ? 'text-blue-600' : 'text-emerald-600'}`}>
                      {profileModalData.isFrozen ? 'Frozen' : 'Active'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-semibold text-gray-900">
                      {profileModalData.createdAt ? new Date(profileModalData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
