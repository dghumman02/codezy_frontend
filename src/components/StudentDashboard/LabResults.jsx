import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, CheckCircle2, XCircle, Clock, Award, 
  Code, Target, TrendingUp, Calendar, AlertTriangle
} from "lucide-react";
import Navbar from './Navbar';

const LabResults = () => {
  const { labId } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem("userId");
  const studentName = localStorage.getItem('fullName') || 'Student';

  const [labData, setLabData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!studentId) {
      navigate('/login');
      return;
    }

    fetch(`http://localhost:5000/api/students/${studentId}/lab-results/${labId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch lab results');
        return res.json();
      })
      .then(data => {
        setLabData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching lab results:", err);
        setError(err.message);
        setIsLoading(false);
      });
  }, [labId, studentId, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !labData) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] font-sans">
        <Navbar studentName={studentName} />
        <div className="max-w-4xl mx-auto px-8 py-10">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold text-sm mb-6 transition-colors"
          >
            <ChevronLeft size={20} /> Back
          </button>
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Unable to Load Results</h2>
            <p className="text-gray-500">{error || "No submission found for this lab."}</p>
          </div>
        </div>
      </div>
    );
  }

  const { lab, submission, tasks } = labData;
  
  // Calculate actual score from averageScore (out of 10) to lab marks
  const labMarks = lab.marks || 100;
  const avgScore = submission.averageScore || 0;
  const actualScore = Math.round((avgScore / 10) * labMarks);
  const performance = labMarks > 0 ? Math.round((actualScore / labMarks) * 100) : 0;
  
  // Count passed/failed tasks
  const passedTasks = tasks.filter(t => t.passed).length;
  const failedTasks = tasks.filter(t => !t.passed).length;

  return (
    <div className="min-h-screen bg-[#F8F9FD] font-sans pb-12">
      <Navbar studentName={studentName} />
      
      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold text-sm mb-6 transition-colors"
        >
          <ChevronLeft size={20} /> Back to Labs
        </button>

        {/* Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-8 text-white shadow-2xl mb-8"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">
                {lab.courseCode} • {lab.courseName}
              </p>
              <h1 className="text-3xl font-extrabold mb-3">{lab.title}</h1>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full">
                  <Calendar size={14} />
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </span>
                {submission.isLate && (
                  <span className="flex items-center gap-1.5 bg-orange-500/80 px-3 py-1 rounded-full">
                    <Clock size={14} /> Late Submission
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <div className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Your Score</div>
                <div className="text-4xl font-black">{actualScore}<span className="text-xl text-white/70">/{labMarks}</span></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              <Target size={14} className="text-indigo-500" /> Performance
            </div>
            <div className={`text-3xl font-black ${
              performance >= 70 ? 'text-green-600' : performance >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>{performance}%</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              <Award size={14} className="text-yellow-500" /> XP Earned
            </div>
            <div className="text-3xl font-black text-gray-800">{submission.xp || 0}</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              <CheckCircle2 size={14} className="text-green-500" /> Passed
            </div>
            <div className="text-3xl font-black text-green-600">{passedTasks}</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              <XCircle size={14} className="text-red-500" /> Failed
            </div>
            <div className="text-3xl font-black text-red-600">{failedTasks}</div>
          </motion.div>
        </div>

        {/* Task-wise Results */}
        <h2 className="text-xl font-extrabold text-gray-800 mb-4">Task-wise Results</h2>
        <div className="space-y-4">
          {tasks.map((task, index) => {
            // Calculate task's actual score from 10 to task marks
            const taskMarks = task.marks || 10;
            const taskActualScore = Math.round((task.score / 10) * taskMarks);
            const taskPerformance = taskMarks > 0 ? Math.round((taskActualScore / taskMarks) * 100) : 0;

            return (
              <motion.div
                key={task._id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-all ${
                  task.passed ? 'border-green-100' : 'border-red-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      task.passed ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {task.passed ? (
                        <CheckCircle2 size={24} className="text-green-600" />
                      ) : (
                        <XCircle size={24} className="text-red-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">
                        Task {index + 1}: {task.title || `Task ${index + 1}`}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                          <Code size={12} /> {task.language || 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                          <Target size={12} /> {taskMarks} marks
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          task.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {task.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-3xl font-black ${
                      taskPerformance >= 70 ? 'text-green-600' : 
                      taskPerformance >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {taskActualScore}<span className="text-lg text-gray-400">/{taskMarks}</span>
                    </div>
                    <div className="text-xs font-bold text-gray-400 mt-1">
                      {taskPerformance}% Score
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {tasks.length === 0 && (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
            <Code size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-semibold">No task results available</p>
          </div>
        )}

        {/* Re-attempt Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <button
            onClick={() => navigate(`/lab-session/${labId}`)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-green-100 hover:from-green-600 hover:to-emerald-700 transition-all active:scale-95 inline-flex items-center gap-2"
          >
            <TrendingUp size={20} /> Re-attempt This Lab
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default LabResults;
