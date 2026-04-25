import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Megaphone, BookOpen, Users, GraduationCap, UserCog,
  Check, X, Send, AlertCircle, CheckCircle
} from 'lucide-react';

const AUDIENCE_OPTIONS = [
  { value: 'students',  label: 'Students',                Icon: GraduationCap, gradient: 'from-blue-500 to-cyan-500' },
  { value: 'teachers',  label: 'Instructors',             Icon: UserCog,       gradient: 'from-violet-500 to-purple-500' },
  { value: 'both',      label: 'Students & Instructors',  Icon: Users,         gradient: 'from-green-500 to-emerald-500' },
];

const MakeAnnouncementPage = () => {
  const navigate = useNavigate();
  const courseDropdownRef = useRef(null);

  /* ── form state ─────────────────────────────────────────── */
  const [availableCourses, setAvailableCourses]         = useState([]);
  const [loadingCourses, setLoadingCourses]             = useState(true);
  const [courseDropdownOpen, setCourseDropdownOpen]     = useState(false);

  const [selectedCourseId,   setSelectedCourseId]       = useState('');
  const [selectedCourseName, setSelectedCourseName]     = useState('');
  const [selectedClassId,    setSelectedClassId]        = useState('');
  const [allClasses,         setAllClasses]             = useState(true);

  const [audience, setAudience] = useState('both');
  const [title,   setTitle]     = useState('');
  const [subject, setSubject]   = useState('');
  const [body,    setBody]       = useState('');

  /* ── ui state ───────────────────────────────────────────── */
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);

  /* ── derived ────────────────────────────────────────────── */
  const selectedCourseObj = availableCourses.find(c => c._id === selectedCourseId);
  const availableClasses  = selectedCourseObj?.classes || [];

  /* ── fetch courses ──────────────────────────────────────── */
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/courses/admin/all', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAvailableCourses(res.data || []);
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  /* ── click-outside closes course dropdown ───────────────── */
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(e.target)) {
        setCourseDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  /* ── helpers ────────────────────────────────────────────── */
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSelectCourse = (course) => {
    setSelectedCourseId(course._id);
    setSelectedCourseName(course.title);
    setSelectedClassId('');
    setAllClasses(true);
    setCourseDropdownOpen(false);
  };

  const handleClearCourse = () => {
    setSelectedCourseId('');
    setSelectedCourseName('');
    setSelectedClassId('');
    setAllClasses(true);
  };

  const handleClassToggle = (classId) => {
    if (selectedClassId === classId) {
      setSelectedClassId('');
      setAllClasses(true);
    } else {
      setSelectedClassId(classId);
      setAllClasses(false);
    }
  };

  const reset = () => {
    setSelectedCourseId('');
    setSelectedCourseName('');
    setSelectedClassId('');
    setAllClasses(true);
    setAudience('both');
    setTitle('');
    setSubject('');
    setBody('');
  };

  /* ── submit ─────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim() || !body.trim()) {
      showToast('error', 'Title, subject line and body are all required.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title:          title.trim(),
        subject:        subject.trim(),
        body:           body.trim(),
        targetAudience: audience,
        ...(selectedCourseId && { courseId: selectedCourseId }),
        ...(selectedClassId  && { classId:  selectedClassId  }),
      };
      const { data } = await axios.post('http://localhost:5000/api/announcements', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast('success', data.message || 'Announcement sent!');
      reset();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to send announcement.');
    } finally {
      setLoading(false);
    }
  };

  /* ── eligibility summary text ───────────────────────────── */
  const eligibilitySummary = () => {
    if (!selectedCourseId) return 'Sent to everyone in the institution';
    const cls = availableClasses.find(c => c._id === selectedClassId);
    if (cls) return `${selectedCourseName} – ${cls.name}`;
    return `All classes in: ${selectedCourseName}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 relative overflow-hidden">
      {/* background blobs */}
      <div className="absolute top-0 -left-20 w-80 h-80 bg-gradient-to-r from-purple-400/10 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium
          ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Navbar */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}
        className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/admin')}>
              <span className="text-indigo-600 font-bold text-xl">&lt;/&gt;</span>
              <span className="text-indigo-600 font-bold text-xl">Codezy</span>
            </div>
            <div className="hidden md:flex space-x-8 font-medium text-gray-700">
              <button onClick={() => navigate('/admin')} className="hover:text-indigo-600 transition">Dashboard</button>
              <button onClick={() => navigate('/admin/courses')} className="hover:text-indigo-600 transition">Courses</button>
              <span className="text-purple-600 border-b-2 border-purple-600">Make Announcement</span>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-4xl mx-auto p-6 relative z-10">
        {/* Page header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Megaphone size={36} className="text-purple-500" />
            Make Announcement
          </h1>
          <p className="text-gray-600 text-lg">Send a notification to students, instructors, or both</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ── SECTION 1: Targeting ── */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg">
                  <Users size={24} className="text-white" />
                </div>
                Target Audience
              </h2>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Required</span>
            </div>

            {/* Audience pills */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Who should receive this announcement? *</label>
              <div className="flex flex-wrap gap-3">
                {AUDIENCE_OPTIONS.map(({ value, label, Icon, gradient }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAudience(value)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200
                      ${audience === value
                        ? `bg-gradient-to-r ${gradient} border-transparent text-white shadow-lg scale-105`
                        : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Course dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-500" /> Select Course
                </label>
                <div className="relative" ref={courseDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setCourseDropdownOpen(o => !o)}
                    disabled={loadingCourses}
                    className="w-full flex items-center justify-between px-4 py-4 border-2 border-gray-200 rounded-xl bg-white hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                  >
                    <span className="text-sm text-gray-600">
                      {loadingCourses
                        ? 'Loading courses…'
                        : selectedCourseId
                          ? selectedCourseName
                          : 'All Courses (Institution-wide)'}
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedCourseId && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); handleClearCourse(); }}
                          onKeyDown={(e) => e.key === 'Enter' && (e.stopPropagation(), handleClearCourse())}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Clear course"
                        >
                          <X size={14} />
                        </span>
                      )}
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${courseDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Dropdown list */}
                  {courseDropdownOpen && !loadingCourses && (
                    <div className="absolute z-30 top-full mt-1 w-full bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                      {availableCourses.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">No courses found</div>
                      ) : (
                        availableCourses.map(course => {
                          const isSelected = course._id === selectedCourseId;
                          return (
                            <button
                              key={course._id}
                              type="button"
                              onClick={() => handleSelectCourse(course)}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-indigo-50 ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}
                            >
                              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                {isSelected && <Check size={11} className="text-white" />}
                              </span>
                              <span className="font-medium">{course.title}</span>
                              {course.courseCode && (
                                <span className="ml-auto text-xs text-gray-400">{course.courseCode}</span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Selected course chip */}
                {selectedCourseId && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold border border-indigo-200">
                      <BookOpen size={12} />
                      {selectedCourseName}
                      <button
                        type="button"
                        onClick={handleClearCourse}
                        className="ml-0.5 hover:text-red-500 transition-colors"
                        aria-label="Remove course"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  </div>
                )}
              </div>

              {/* Class selection — only when a course is selected */}
              {selectedCourseId && availableClasses.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Class</label>
                  <div className="border-2 border-gray-200 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2 bg-white">
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-indigo-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={allClasses}
                        onChange={() => { setSelectedClassId(''); setAllClasses(true); }}
                        className="form-checkbox text-indigo-600 rounded"
                      />
                      <span className="text-sm font-semibold text-indigo-600">All Classes</span>
                    </label>
                    <hr className="border-gray-200" />
                    {availableClasses.map(cls => (
                      <label key={cls._id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedClassId === cls._id}
                          onChange={() => handleClassToggle(cls._id)}
                          className="form-checkbox text-indigo-600 rounded"
                        />
                        <span className="text-sm text-gray-700">{cls.name}</span>
                      </label>
                    ))}
                  </div>
                  {!allClasses && selectedClassId && (
                    <p className="text-xs text-indigo-600 mt-2 font-medium">1 class selected</p>
                  )}
                </div>
              )}
            </div>

            {/* Eligibility summary badge */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full text-sm text-purple-700 font-medium">
              <Check size={14} className="text-purple-500" />
              {eligibilitySummary()}
            </div>
          </div>

          {/* ── SECTION 2: Content ── */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg shadow-lg">
                  <Megaphone size={24} className="text-white" />
                </div>
                Announcement Content
              </h2>
              <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">Required</span>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Important update regarding final exams"
                  maxLength={120}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Subject Line *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Short summary shown in notification preview"
                  maxLength={160}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Body *</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Write the full announcement here…"
                  rows={8}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all resize-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-4 pb-10">
            <button
              type="button"
              onClick={reset}
              className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={18} />}
              {loading ? 'Sending…' : 'Send Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MakeAnnouncementPage;
