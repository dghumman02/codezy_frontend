import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Plus, Search, Filter, MoreVertical, Eye,
  Users, Trash2, Edit3, CheckSquare, Square,
  Clock, DollarSign, User
} from 'lucide-react';
import SuperAdminLayout from './SuperAdminLayout';
import { useNavigate } from 'react-router-dom';

const GlobalCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourses, setSelectedCourses] = useState([]);
  const navigate = useNavigate();

  // 1. FETCH ALL COURSES FROM THE CURRICULUM API
  const fetchGlobalCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/curriculum/global-courses`);
      setCourses(res.data || []);
    } catch (err) {
      console.error("Error loading global courses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalCourses();
  }, []);

  // 2. DELETE SINGLE COURSE
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this course?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/curriculum/global-courses/${id}`);
      setCourses(courses.filter(c => c._id !== id));
      setSelectedCourses(selectedCourses.filter(selectedId => selectedId !== id));
    } catch (err) {
      alert("Failed to delete course. Please check backend connection.");
    }
  };

  // 3. BULK DELETE FUNCTIONALITY
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedCourses.length} courses?`)) return;
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/curriculum/global-courses/bulk-delete`, { 
        ids: selectedCourses 
      });
      setCourses(courses.filter(c => !selectedCourses.includes(c._id)));
      setSelectedCourses([]);
      alert("Bulk deletion successful.");
    } catch (err) {
      alert("Bulk delete failed.");
    }
  };

  const toggleSelect = (id) => {
    setSelectedCourses(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SuperAdminLayout title="Global Curriculum Management">
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Global Courses</h1>
            <p className="text-gray-500">Manage official Codezy curriculum for solo learners.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedCourses.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-xl hover:bg-red-100 transition-all font-bold border border-red-100 shadow-sm"
              >
                <Trash2 size={20} /> Bulk Delete ({selectedCourses.length})
              </button>
            )}

            <button 
              onClick={() => navigate('/superadmin-courses/editor')}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-semibold"
            >
              <Plus size={20} /> Create New Course
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by course title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
            <Filter size={18} /> Filters
          </button>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [0,1,2,3,4,5].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-3xl h-64 border border-gray-100 shadow-sm" />
            ))
          ) : (
            <AnimatePresence mode='popLayout'>
              {filteredCourses.map((course, index) => (
                <CourseCard 
                  key={course._id} 
                  course={course} 
                  index={index} 
                  isSelected={selectedCourses.includes(course._id)}
                  onSelect={() => toggleSelect(course._id)}
                  onDelete={() => handleDelete(course._id)}
                  onEdit={() => navigate(`/superadmin-courses/editor/${course._id}`)}
                  onView={() => navigate(`/superadmin-courses/editor/${course._id}?mode=view`)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <BookOpen className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900">No Courses Found</h3>
            <p className="text-gray-500">Try adjusting your search or create a new curriculum path.</p>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

// --- Sub-Component: Course Card ---
const CourseCard = ({ course, index, isSelected, onSelect, onDelete, onEdit, onView }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ delay: index * 0.05 }}
    className={`bg-white rounded-2xl border transition-all group overflow-hidden relative ${
        isSelected ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-gray-100 hover:shadow-xl'
    }`}
  >
    {/* Bulk Selection Checkbox Overlay */}
    <div 
        onClick={onSelect}
        className="absolute top-4 right-4 z-20 cursor-pointer p-1 bg-white/80 backdrop-blur rounded-lg border border-gray-100 shadow-sm"
    >
        {isSelected ? <CheckSquare className="text-indigo-600" size={22} /> : <Square className="text-gray-300" size={22} />}
    </div>

    {course.thumbnail ? (
      <img
        src={course.thumbnail}
        alt={course.title}
        className="h-40 w-full object-cover"
      />
    ) : (
      <div className="h-2 bg-indigo-600" />
    )}
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
          <BookOpen size={24} />
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
        {course.title}
      </h3>
            {/* Instructor */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <User size={16} className="text-indigo-500" />
        <span className="font-medium">
          {course.instructor || "No Instructor"}
        </span>
      </div>

      {/* Difficulty + Specialization Badge */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded uppercase">
          {course.difficulty}
        </span>

        {course.isSpecialization && (
          <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-1 rounded uppercase">
            Specialization
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
        <span className="flex items-center gap-1 font-medium">
          <Users size={16} className="text-indigo-500" />
          {course.enrollmentCount || 0} Learners
        </span>

        <span className="flex items-center gap-1 font-medium">
          <Edit3 size={16} className="text-emerald-500" />
          {course.modules?.length || 0} Modules
        </span>

        {course.duration && (
          <span className="flex items-center gap-1 font-medium">
            <Clock size={16} className="text-orange-500" />
            {course.duration}
          </span>
        )}

        <span className="flex items-center gap-1 font-bold text-gray-700">
          <DollarSign size={16} className="text-green-500" />
          {course.price > 0 ? `$${course.price}` : "Free"}
        </span>
      </div>

      <div className="flex gap-2 relative z-10">
        <button 
          onClick={onEdit}
          className="flex-1 py-2.5 bg-gray-50 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm flex items-center justify-center gap-2"
        >
          Edit Curriculum
        </button>
        <button 
          onClick={onDelete}
          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={onView}
          className="p-2.5 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors border border-transparent hover:border-indigo-100"
        >
          <Eye size={20} />
        </button>
      </div>
    </div>
  </motion.div>
);

export default GlobalCoursesPage;