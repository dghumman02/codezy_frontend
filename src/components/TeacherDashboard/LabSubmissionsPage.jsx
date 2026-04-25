import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, XCircle, Eye, Clock, X, Award, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LabSubmissionsPage = () => {
  const { courseId, classId, labId } = useParams();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [labData, setLabData] = useState(null);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/courses/${courseId}/classes/${classId}/labs/${labId}/submissions`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to load submissions", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLabData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/courses/${courseId}/classes/${classId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const lab = res.data.labs?.find(l => l._id === labId);
      setLabData(lab);
    } catch (err) {
      console.error("Failed to load lab data", err);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    fetchLabData();
  }, [courseId, classId, labId]);

  const handleViewTasks = (student) => {
    setSelectedStudent(student);
    setShowTaskModal(true);
  };

  if (loading) {
    return <div className="p-10 text-center">Loading submissions...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Lab Submissions</h1>
        <button
          onClick={() => navigate('/teacher')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Roll No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Student Name</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Score</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">XP</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>
            </tr>
          </thead>

          <tbody>
            {students.map((stu) => (
              <tr key={stu.studentId} className="border-t hover:bg-gray-50">
                {/* Roll */}
                <td className="px-4 py-3 text-sm">{stu.rollNumber}</td>

                {/* Name */}
                <td className="px-4 py-3 text-sm font-medium">{stu.name}</td>

                {/* Status */}
                <td className="px-4 py-3 text-center">
                  {stu.submitted ? (
                    <div className="inline-flex flex-col items-center gap-1">
                      <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                        <CheckCircle size={16} /> Submitted
                      </span>

                      {stu.isLate && (
                        <span className="inline-flex items-center gap-1 text-orange-500 text-xs font-semibold">
                          <Clock size={14} /> Late
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                      <XCircle size={16} /> Not Submitted
                    </span>
                  )}
                </td>

                {/* Score */}
                <td className="px-4 py-3 text-center">
                  {stu.submitted ? (
                    <span className={`font-bold ${
                      stu.averageScore >= 7 ? 'text-green-600' : 
                      stu.averageScore >= 5 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {stu.averageScore?.toFixed(1) || '0.0'}/10
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>

                {/* XP */}
                <td className="px-4 py-3 text-center font-bold">
                  {stu.submitted ? stu.xp ?? "-" : "-"}
                </td>

                {/* Action */}
                <td className="px-4 py-3 text-center">
                  {stu.submitted ? (
                    <button
                      onClick={() => handleViewTasks(stu)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Eye size={16} /> View
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {students.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No students enrolled in this class.
          </div>
        )}
      </div>

      {/* Task-wise Score Modal */}
      <AnimatePresence>
        {showTaskModal && selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTaskModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="text-white" size={24} />
                  <div>
                    <h2 className="text-white font-bold text-lg">Task-wise Scores</h2>
                    <p className="text-white/70 text-sm">{selectedStudent.name} ({selectedStudent.rollNumber})</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {selectedStudent.results && selectedStudent.results.length > 0 ? (
                  <div className="space-y-3 mb-6">
                    {selectedStudent.results.map((result, idx) => {
                      const task = labData?.tasks?.find(t => t._id === result.taskId);
                      return (
                        <div
                          key={result.taskId || idx}
                          className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                result.passed ? 'bg-green-100' : 'bg-red-100'
                              }`}>
                                {result.passed ? (
                                  <CheckCircle size={20} className="text-green-600" />
                                ) : (
                                  <XCircle size={20} className="text-red-600" />
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">
                                  Task {idx + 1}: {task?.title || `Task ${idx + 1}`}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {task?.marks || 0} marks • {result.language || 'Unknown'}
                                </div>
                              </div>
                            </div>
                            <div className={`text-2xl font-bold ${
                              result.score >= 7 ? 'text-green-600' : 
                              result.score >= 5 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {result.score}/10
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No task results available
                  </div>
                )}

                {/* Overall Score Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-semibold">Overall Average Score</span>
                    <span className={`text-2xl font-bold ${
                      selectedStudent.averageScore >= 7 ? 'text-green-600' : 
                      selectedStudent.averageScore >= 5 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {selectedStudent.averageScore?.toFixed(1) || '0.0'}/10
                    </span>
                  </div>
                </div>

                {/* Submitted At */}
                {selectedStudent.submittedAt && (
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Submitted on {new Date(selectedStudent.submittedAt).toLocaleString()}
                    {selectedStudent.isLate && (
                      <span className="ml-2 text-orange-500 font-semibold">(Late)</span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LabSubmissionsPage;
