import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Filter,
  ChevronDown,
  Trophy,
  TrendingUp,
  Award,
  Zap,
  Users,
  Target,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

const API_BASE = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api`;

// Custom colors for charts
const COLORS = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  pink: "#ec4899",
  cyan: "#06b6d4",
};

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];
const DOUGHNUT_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

const AnalyticsView = ({ courses, selectedCourse, selectedClass, onCourseChange, onClassChange }) => {
  const teacherId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLab, setSelectedLab] = useState("all");
  const [scoreFilterRange, setScoreFilterRange] = useState("all");

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedCourse || !selectedClass) return;

      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          courseId: selectedCourse,
          classId: selectedClass,
        });

        if (selectedLab !== "all") params.append("labId", selectedLab);

        const res = await fetch(
          `${API_BASE}/courses/analytics/teacher/${teacherId}?${params}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setAnalyticsData(data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        toast.error("Failed to load analytics data");
      }
      setIsLoading(false);
    };

    fetchAnalytics();
  }, [selectedCourse, selectedClass, selectedLab, teacherId, token]);

  // Get available classes for selected course
  const availableClasses = useMemo(() => {
    if (!selectedCourse) return [];
    const course = courses.find((c) => c._id === selectedCourse);
    return course?.classes || [];
  }, [selectedCourse, courses]);

  // Filter score distribution based on selected range
  const filteredScoreDistribution = useMemo(() => {
    if (!analyticsData?.scoreDistribution) return [];
    if (scoreFilterRange === "all") return analyticsData.scoreDistribution;
    return analyticsData.scoreDistribution.filter(s => s.label === scoreFilterRange);
  }, [analyticsData?.scoreDistribution, scoreFilterRange]);

  // Custom tooltip for multi-class line charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <p className="font-bold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-semibold">{entry.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for score chart
  const ScoreTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <p className="font-bold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-20 text-gray-500">
        <Target className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg">Select a course and class to view analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Course Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Course
            </label>
            <div className="relative">
              <select
                value={selectedCourse}
                onChange={(e) => onCourseChange(e.target.value)}
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
                onChange={(e) => onClassChange(e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-xl text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Classes</option>
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
                onChange={(e) => setSelectedLab(e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-xl text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Labs</option>
                {analyticsData?.labs?.map((lab) => (
                  <option key={lab._id} value={lab._id}>
                    {lab.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Score Range Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Score Range
            </label>
            <div className="relative">
              <select
                value={scoreFilterRange}
                onChange={(e) => setScoreFilterRange(e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-xl text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Ranges</option>
                <option value="0-4">0-4 (Low)</option>
                <option value="4-6">4-6 (Below Avg)</option>
                <option value="6-8">6-8 (Average)</option>
                <option value="8-9">8-9 (Good)</option>
                <option value="9-10">9-10 (Excellent)</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-3xl font-black">{analyticsData.totalStudents}</p>
              <p className="text-sm font-medium opacity-80">Total Students</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-3xl font-black">{analyticsData.totalLabs}</p>
              <p className="text-sm font-medium opacity-80">Total Labs</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-3xl font-black">{analyticsData.performanceDistribution?.high || 0}</p>
              <p className="text-sm font-medium opacity-80">High Performers</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-3xl font-black">
                {analyticsData.topPerformers?.[0]?.xp?.toLocaleString() || 0}
              </p>
              <p className="text-sm font-medium opacity-80">Highest XP</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Score Distribution Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <BarChart className="w-5 h-5 text-indigo-600" />
            </div>
            Score Distribution
          </h3>
          <p className="text-sm text-gray-500 mb-4">Students count by score ranges</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredScoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} 
              />
              <Bar dataKey="count" fill="url(#colorGradient)" radius={[8, 8, 0, 0]}>
                {filteredScoreDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Performers Horizontal Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            Top Performers
            <span className="text-amber-500 ml-1">👑</span>
          </h3>
          <p className="text-sm text-gray-500 mb-4">Top 5 students (70% Score + 30% XP)</p>
          <div className="space-y-3">
            {analyticsData.topPerformers?.map((student, index) => (
              <div
                key={student.studentId}
                className="flex items-center gap-4 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                  index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                  index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                  index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                  'bg-gradient-to-br from-indigo-400 to-indigo-600'
                }`}>
                  {index === 0 ? '👑' : index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.rollNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-indigo-600">
                    {student.combinedScore ?? student.avgScore ?? 0}/10
                  </p>
                  <p className="text-xs text-gray-500">
                    Avg: {student.avgScore ?? 0} | XP: {student.xp?.toLocaleString() ?? 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Submission Rate Trend Line Chart - Only when specific class selected */}
        {selectedClass && selectedClass !== 'all' && analyticsData.submissionRateTrend && analyticsData.submissionRateTrend.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              Submission Rate Trend
            </h3>
            <p className="text-sm text-gray-500 mb-4">Submission percentage over labs</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.submissionRateTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="labNumber" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="submissionRate"
                  name="Submission Rate"
                  stroke={COLORS.success}
                  strokeWidth={3}
                  dot={{ fill: COLORS.success, strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Average Score Per Lab Chart - Only when specific class selected */}
        {selectedClass && selectedClass !== 'all' && analyticsData.avgScorePerLab && analyticsData.avgScorePerLab.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              Average Score Per Lab
            </h3>
            <p className="text-sm text-gray-500 mb-4">Performance across labs</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.avgScorePerLab}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="labNumber" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  domain={[0, 10]}
                />
                <Tooltip content={<ScoreTooltip />} />
                <Legend />
                <Bar 
                  dataKey="avgScore" 
                  name="Average Score"
                  fill="url(#purpleGradient)" 
                  radius={[8, 8, 0, 0]}
                >
                  {analyticsData.avgScorePerLab?.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.avgScore >= 8 ? COLORS.success : entry.avgScore >= 6 ? COLORS.warning : COLORS.danger} 
                    />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Performance Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-rose-600" />
            </div>
            Weak Students Detection
          </h3>
          <p className="text-sm text-gray-500 mb-4">Student performance categories</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'High (>8.5)', value: analyticsData.performanceDistribution?.high || 0 },
                  { name: 'Medium (6-8.5)', value: analyticsData.performanceDistribution?.medium || 0 },
                  { name: 'Low (<6)', value: analyticsData.performanceDistribution?.low || 0 },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {PIE_COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '12px' 
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Completion Rate Doughnut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-cyan-600" />
            </div>
            Completion Rate
          </h3>
          <p className="text-sm text-gray-500 mb-4">Lab completion status</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Fully Completed', value: analyticsData.completionRate?.fullyCompleted || 0 },
                  { name: 'Partially Completed', value: analyticsData.completionRate?.partiallyCompleted || 0 },
                  { name: 'No Submissions', value: analyticsData.completionRate?.noSubmissions || 0 },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
              >
                {DOUGHNUT_COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '12px' 
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* XP Distribution Histogram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:col-span-2"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            XP Distribution
            <span className="text-orange-500 ml-1">🔥</span>
          </h3>
          <p className="text-sm text-gray-500 mb-4">Experience points distribution among students</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.xpDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                labelFormatter={(label) => `XP Range: ${label}`}
                formatter={(value) => [`${value} students`, 'Count']}
              />
              <Bar dataKey="count" fill="url(#xpGradient)" radius={[8, 8, 0, 0]}>
                {analyticsData.xpDistribution?.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`hsl(${40 + index * 15}, 90%, ${55 - index * 3}%)`} 
                  />
                ))}
              </Bar>
              <defs>
                <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.9}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsView;
