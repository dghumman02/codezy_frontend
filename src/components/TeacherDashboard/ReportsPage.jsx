import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Download,
  Filter,
  BarChart3,
  Users,
  TrendingUp,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Percent,
  CheckCircle,
  XCircle,
  Clock,
  PieChart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import AnalyticsView from "./AnalyticsView";

const API_BASE = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api`;

const ReportsPage = () => {
  const teacherId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // View toggle state
  const [activeView, setActiveView] = useState("reports"); // "reports" or "analytics"

  // Filter states
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedLab, setSelectedLab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [scoreValue, setScoreValue] = useState("8.5");

  // Data states
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sorting states
  const [sortField, setSortField] = useState("rollNumber");
  const [sortOrder, setSortOrder] = useState("asc");

  // Get available classes for selected course
  const availableClasses = useMemo(() => {
    if (!selectedCourse) return [];
    const course = courses.find((c) => c._id === selectedCourse);
    return course?.classes || [];
  }, [selectedCourse, courses]);

  // Fetch initial courses data
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`${API_BASE}/courses/reports/teacher/${teacherId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.courses) {
          setCourses(data.courses);
          // Set defaults
          if (data.courses.length > 0) {
            setSelectedCourse(data.courses[0]._id);
            if (data.courses[0].classes?.length > 0) {
              setSelectedClass(data.courses[0].classes[0]._id);
            }
          }
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching courses:", err);
        toast.error("Failed to load courses");
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [teacherId, token]);

  // Fetch report data when filters change
  useEffect(() => {
    const fetchReport = async () => {
      if (!selectedCourse || !selectedClass) return;

      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          courseId: selectedCourse,
          classId: selectedClass,
          labId: selectedLab,
        });

        if (statusFilter !== "all") params.append("status", statusFilter);
        if (scoreFilter !== "all") {
          params.append("scoreFilter", scoreFilter);
          params.append("scoreValue", scoreValue);
        }

        const res = await fetch(
          `${API_BASE}/courses/reports/teacher/${teacherId}?${params}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setReportData(data);
      } catch (err) {
        console.error("Error fetching report:", err);
        toast.error("Failed to load report data");
      }
      setIsLoading(false);
    };

    fetchReport();
  }, [selectedCourse, selectedClass, selectedLab, statusFilter, scoreFilter, scoreValue, teacherId, token]);

  // Sorted students
  const sortedStudents = useMemo(() => {
    if (!reportData?.students) return [];
    
    return [...reportData.students].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle string sorting
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }, [reportData?.students, sortField, sortOrder]);

  // Handle sort click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Download report as CSV
  const downloadReport = () => {
    if (!reportData?.students?.length) {
      toast.error("No data to download");
      return;
    }

    const isSpecificLab = reportData.isSpecificLab;
    let headers, rows;

    if (isSpecificLab) {
      headers = ["Roll Number", "Name", "Score", "XP", "Status"];
      rows = sortedStudents.map((s) => [
        s.rollNumber,
        s.name,
        s.score,
        s.xp,
        s.status,
      ]);
    } else {
      headers = ["Roll Number", "Name", "Avg Score (%)", "XP", "Completion (%)", "Submitted", "Expired", "Pending"];
      rows = sortedStudents.map((s) => [
        s.rollNumber,
        s.name,
        s.score,
        s.xp,
        s.completion,
        s.submitted,
        s.expired,
        s.pending,
      ]);
    }

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Report_${reportData.courseName}_${reportData.className}_${reportData.labTitle || "AllLabs"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  // Sort icon component
  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 text-indigo-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-indigo-600" />
    );
  };

  // Status badge
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

  if (isLoading && !reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
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
                onClick={() => window.location.href = '/teacher'}
                className="text-indigo-600 font-bold text-xl flex items-center cursor-pointer"
              >
                <span className="text-2xl mr-1">&lt;/&gt;</span>
                <span>Codezy</span>
              </motion.div>
            </div>
            <div className="hidden md:flex space-x-8 font-medium">
              <a href="/teacher" className="hover:text-indigo-600 transition">Dashboard</a>
              <a href="/mycourses" className="hover:text-indigo-600 transition">My Courses</a>
              <a href="/createlab" className="hover:text-indigo-600 transition">Create Lab</a>
              <span className="text-indigo-600 border-b-2 border-indigo-600">Reports</span>
              <a href="/profile" className="hover:text-indigo-600 transition">Profile</a>
              <a href="/login" className="hover:text-indigo-600 transition">Logout</a>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Track student performance and progress</p>
          
          {/* Toggle Button */}
          <div className="mt-6">
            <div className="inline-flex rounded-xl bg-gray-100 p-1 shadow-inner">
              <button
                onClick={() => setActiveView("reports")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeView === "reports"
                    ? "bg-white text-indigo-600 shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileText className="w-4 h-4" />
                Reports
              </button>
              <button
                onClick={() => setActiveView("analytics")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeView === "analytics"
                    ? "bg-white text-indigo-600 shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <PieChart className="w-4 h-4" />
                Analytics
              </button>
            </div>
          </div>
        </motion.div>

        {/* Analytics View */}
        {activeView === "analytics" ? (
          <AnalyticsView
            courses={courses}
            selectedCourse={selectedCourse}
            selectedClass={selectedClass}
            onCourseChange={(courseId) => {
              setSelectedCourse(courseId);
              const course = courses.find((c) => c._id === courseId);
              if (course?.classes?.length > 0) {
                setSelectedClass(course.classes[0]._id);
              } else {
                setSelectedClass("");
              }
            }}
            onClassChange={(classId) => setSelectedClass(classId)}
          />
        ) : (
          <>
            {/* Summary Stats Cards */}
            {reportData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
              >
            {/* Average Score */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <p className="text-3xl font-black text-indigo-700">
                    {reportData.summary?.averageScore || 0}%
                  </p>
                  <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
                    Average Score
                  </p>
                </div>
              </div>
            </div>

            {/* Submission Rate */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <Percent className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <p className="text-3xl font-black text-emerald-700">
                    {reportData.summary?.submissionRate || 0}%
                  </p>
                  <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">
                    Submission Rate
                  </p>
                </div>
              </div>
            </div>

            {/* Total Students */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <p className="text-3xl font-black text-amber-700">
                    {reportData.summary?.totalStudents || 0}
                  </p>
                  <p className="text-sm font-semibold text-amber-600 uppercase tracking-wide">
                    Total Students
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Course Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Course
              </label>
              <div className="relative">
                <select
                  value={selectedCourse}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    const course = courses.find((c) => c._id === e.target.value);
                    if (course?.classes?.length > 0) {
                      setSelectedClass(course.classes[0]._id);
                    } else {
                      setSelectedClass("");
                    }
                    setSelectedLab("all");
                  }}
                  className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-xl text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.courseCode} - {course.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Class Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Class
              </label>
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedLab("all");
                  }}
                  className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-xl text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {availableClasses.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Lab Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Lab
              </label>
              <div className="relative">
                <select
                  value={selectedLab}
                  onChange={(e) => {
                    setSelectedLab(e.target.value);
                    if (e.target.value === "all") setStatusFilter("all");
                  }}
                  className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-xl text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Labs</option>
                  {reportData?.labs?.map((lab) => (
                    <option key={lab._id} value={lab._id}>
                      {lab.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Status Filter - Only for specific lab */}
            {selectedLab !== "all" && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-xl text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All</option>
                    <option value="submitted">Submitted</option>
                    <option value="not_submitted">Not Submitted</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Score Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Score
              </label>
              <div className="relative">
                <select
                  value={scoreFilter}
                  onChange={(e) => setScoreFilter(e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-xl text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All</option>
                  <option value="greater">Greater than</option>
                  <option value="less">Less than</option>
                  <option value="perfect">Perfect (10/10)</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Score Value Input */}
            {(scoreFilter === "greater" || scoreFilter === "less") && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Score Value
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={scoreValue}
                  onChange={(e) => setScoreValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="8.5"
                />
              </div>
            )}
          </div>

          {/* Download Button */}
          <div className="mt-4 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={downloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Report
            </motion.button>
          </div>
        </motion.div>

        {/* Report Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {reportData?.labTitle === "All Labs" ? "All Labs Report" : `Lab Report: ${reportData?.labTitle}`}
              </h3>
              <p className="text-sm text-gray-500">
                {reportData?.courseName} • {reportData?.className}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {sortedStudents.length} student{sortedStudents.length !== 1 ? "s" : ""}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : sortedStudents.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No students found matching the criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("rollNumber")}
                    >
                      <div className="flex items-center gap-2">
                        Roll Number
                        <SortIcon field="rollNumber" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("score")}
                    >
                      <div className="flex items-center gap-2">
                        {reportData?.isSpecificLab ? "Score" : "Avg Score"}
                        <SortIcon field="score" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("xp")}
                    >
                      <div className="flex items-center gap-2">
                        XP
                        <SortIcon field="xp" />
                      </div>
                    </th>
                    {reportData?.isSpecificLab ? (
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    ) : (
                      <>
                        <th
                          className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort("completion")}
                        >
                          <div className="flex items-center gap-2">
                            Completion
                            <SortIcon field="completion" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Submitted / Expired / Pending
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {sortedStudents.map((student, index) => (
                      <motion.tr
                        key={student.studentId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {student.rollNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-bold ${
                              reportData?.isSpecificLab
                                ? student.score >= 8.5
                                  ? "text-emerald-600"
                                  : student.score >= 5
                                  ? "text-amber-600"
                                  : "text-red-600"
                                : student.score >= 85
                                ? "text-emerald-600"
                                : student.score >= 50
                                ? "text-amber-600"
                                : "text-red-600"
                            }`}
                          >
                            {reportData?.isSpecificLab ? student.score : `${student.score}%`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-indigo-600">
                            {student.xp?.toLocaleString() || 0}
                          </span>
                        </td>
                        {reportData?.isSpecificLab ? (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={student.status} />
                          </td>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      student.completion === 100
                                        ? "bg-emerald-500"
                                        : student.completion >= 50
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{ width: `${student.completion}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-gray-700">
                                  {student.completion}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="text-emerald-600 font-semibold">{student.submitted}</span>
                              <span className="text-gray-400 mx-1">/</span>
                              <span className="text-red-600 font-semibold">{student.expired}</span>
                              <span className="text-gray-400 mx-1">/</span>
                              <span className="text-amber-600 font-semibold">{student.pending}</span>
                            </td>
                          </>
                        )}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
