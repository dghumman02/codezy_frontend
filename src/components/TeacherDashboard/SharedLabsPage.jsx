import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, Download, Search, Filter, ArrowLeft, User, Calendar, Sparkles, BookOpen, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const SharedLabsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [sharedLabs, setSharedLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [authors, setAuthors] = useState([]);
  const [previewLab, setPreviewLab] = useState(null);

  const currentUserId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const fetchSharedLabs = async () => {
    try {
      setLoading(true);
      if (!token) {
        navigate("/login");
        return;
      }

      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (authorFilter) params.author = authorFilter;

      const res = await axios.get(
        `http://localhost:5000/api/shared-labs/course/${courseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );
      setSharedLabs(res.data || []);
    } catch (err) {
      console.error("Error fetching shared labs:", err.response?.data || err.message);
      setSharedLabs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthors = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/shared-labs/course/${courseId}/authors`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAuthors(res.data || []);
    } catch (err) {
      console.error("Error fetching authors:", err);
    }
  };

  useEffect(() => {
    fetchSharedLabs();
    fetchAuthors();
  }, [courseId]);

  useEffect(() => {
    const timer = setTimeout(() => fetchSharedLabs(), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, authorFilter]);

  const handleImport = (lab) => {
    // Navigate to CreateLabPage with shared lab data via query param
    navigate(`/createlab?importSharedLabId=${lab._id}&courseId=${courseId}`);
  };

  const handleDelete = async (labId) => {
    if (!window.confirm("Are you sure you want to delete this shared lab template?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/shared-labs/${labId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSharedLabs();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.message || "Failed to delete shared lab.");
    }
  };

  const handlePreview = async (labId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/shared-labs/${labId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPreviewLab(res.data);
    } catch (err) {
      console.error("Preview error:", err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                onClick={() => navigate("/teacher")}
                className="text-indigo-600 font-bold text-xl flex items-center cursor-pointer"
              >
                <span className="text-2xl mr-1">&lt;/&gt;</span>
                <span>Codezy</span>
              </motion.div>
            </div>
            <div className="hidden md:flex space-x-8 font-medium">
              <a href="/teacher" className="hover:text-indigo-600 transition">Dashboard</a>
              <a href="/mycourses" className="text-indigo-600 border-b-2 border-indigo-600">My Courses</a>
              <a href="/createlab" className="hover:text-indigo-600 transition">Create Lab</a>
              <a href="/reports" className="hover:text-indigo-600 transition">Reports</a>
              <a href="/profile" className="hover:text-indigo-600 transition">Profile</a>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Sparkles className="text-amber-500" size={28} />
                Shared Labs
              </h1>
              <p className="text-gray-500 mt-1">
                Reusable lab templates shared by instructors in this course
              </p>
            </div>
            <button
              onClick={() => navigate("/mycourses")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              <ArrowLeft size={18} />
              Back to My Courses
            </button>
          </div>
        </header>

        {/* Search & Filter */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search shared labs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              />
            </div>
            <div className="relative w-full md:w-64">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white outline-none appearance-none font-medium text-gray-700 focus:border-indigo-500 transition-all"
              >
                <option value="">All Authors</option>
                {authors.map((a) => (
                  <option key={a.authorId} value={a.authorId}>
                    {a.authorName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Shared Labs Grid */}
        {sharedLabs.length === 0 ? (
          <div className="text-center py-16 bg-white/80 rounded-2xl border border-dashed border-gray-300">
            <BookOpen className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 text-xl font-semibold">No shared labs found</p>
            <p className="text-gray-400 mt-2">
              Labs exported to this course will appear here for all instructors.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sharedLabs.map((lab) => {
              const isAuthor = lab.authorId === currentUserId;
              return (
                <motion.div
                  key={lab._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-900">{lab.title}</h2>
                      {lab.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {lab.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 text-[10px] font-bold rounded-md ${
                        lab.difficulty === "Easy"
                          ? "bg-green-100 text-green-700"
                          : lab.difficulty === "Hard"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {lab.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      <span className="font-medium text-gray-700">{lab.authorName}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(lab.createdAt)}
                    </span>
                    <span className="font-medium text-indigo-600">
                      {lab.marks} marks
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                    <span>{lab.tasks?.length || 0} task(s)</span>
                    <span>
                      {lab.tasks?.reduce((sum, t) => sum + (t.testCases?.length || 0), 0) || 0} test case(s)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handlePreview(lab._id)}
                      className="flex items-center gap-1 text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                    >
                      <Eye size={14} /> Preview
                    </button>
                    <button
                      onClick={() => handleImport(lab)}
                      className="flex items-center gap-1 text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-md"
                    >
                      <Download size={14} /> Import
                    </button>
                    {isAuthor && (
                      <button
                        onClick={() => handleDelete(lab._id)}
                        className="ml-auto flex items-center gap-1 text-sm px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewLab && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreviewLab(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{previewLab.title}</h2>
              <button
                onClick={() => setPreviewLab(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-6">
              <div>
                <span className="font-semibold">Author:</span> {previewLab.authorName}
              </div>
              <div>
                <span className="font-semibold">Marks:</span> {previewLab.marks}
              </div>
              <div>
                <span className="font-semibold">Difficulty:</span> {previewLab.difficulty}
              </div>
              <div>
                <span className="font-semibold">Tasks:</span> {previewLab.tasks?.length || 0}
              </div>
            </div>

            {previewLab.description && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-1">Description</h3>
                <p className="text-gray-600 text-sm">{previewLab.description}</p>
              </div>
            )}

            {previewLab.instructions && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-1">Instructions</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{previewLab.instructions}</p>
              </div>
            )}

            <div className="space-y-4">
              {(previewLab.tasks || []).map((task, index) => (
                <div
                  key={task._id || index}
                  className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                >
                  <h4 className="font-bold text-gray-800 mb-2">
                    Task {index + 1}: {task.title}{" "}
                    <span className="text-sm font-normal text-gray-500">
                      ({task.marks} marks)
                    </span>
                  </h4>
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                  )}

                  {task.testCases?.length > 0 && (
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        Test Cases: {task.testCases.length}
                      </span>
                      <div className="mt-1 space-y-1">
                        {task.testCases.map((tc, i) => (
                          <div
                            key={i}
                            className="text-xs bg-white p-2 rounded border flex gap-4"
                          >
                            <span>
                              <strong>Input:</strong>{" "}
                              {tc.isHidden ? "(hidden)" : tc.input || "(empty)"}
                            </span>
                            <span>
                              <strong>Expected:</strong>{" "}
                              {tc.isHidden
                                ? "(hidden)"
                                : tc.expectedOutput || "(empty)"}
                            </span>
                            <span className="text-gray-400">{tc.comparisonMode}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {task.codeConstraints?.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        Constraints:
                      </span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {task.codeConstraints.map((c, i) => (
                          <span
                            key={i}
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              c.type === "Required"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {c.type}: {c.construct}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setPreviewLab(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleImport(previewLab);
                  setPreviewLab(null);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-md"
              >
                <span className="flex items-center gap-2">
                  <Download size={16} /> Import This Lab
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SharedLabsPage;
