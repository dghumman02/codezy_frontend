import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronLeft,
  TrendingUp,
  PlayCircle,
  Lock,
  XCircle,
  RefreshCw,
  Eye,
  FileCheck,
  FileQuestion,
  FileMinus,
  BarChart3
} from "lucide-react";
import Navbar from '../StudentDashboard/Navbar'; // Shared Navbar Component

// Helper function to check lab time status
const getLabTimeStatus = (lab) => {
  const now = new Date();
  
  // Combine date and time for start
  const startDateTime = new Date(lab.startDate);
  if (lab.startTime) {
    const [startHours, startMinutes] = lab.startTime.split(':');
    startDateTime.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10), 0, 0);
  }
  
  // Combine date and time for due
  const dueDateTime = new Date(lab.dueDate);
  if (lab.dueTime) {
    const [dueHours, dueMinutes] = lab.dueTime.split(':');
    dueDateTime.setHours(parseInt(dueHours, 10), parseInt(dueMinutes, 10), 0, 0);
  }
  
  if (now < startDateTime) {
    return { 
      canAttempt: false, 
      reason: 'not_started', 
      message: `Lab opens on ${startDateTime.toLocaleDateString()} at ${lab.startTime || '00:00'}`,
      startDateTime
    };
  }
  
  if (now > dueDateTime) {
    return { 
      canAttempt: false, 
      reason: 'expired', 
      message: `Lab expired on ${dueDateTime.toLocaleDateString()} at ${lab.dueTime || '23:59'}`,
      dueDateTime
    };
  }
  
  return { canAttempt: true, reason: 'active', message: 'Lab is available' };
};

const CourseLabs = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const studentId = localStorage.getItem("userId");
  const studentName = localStorage.getItem('fullName') || 'Student';

  const [activeLabs, setActiveLabs] = useState([]);
  const [historyLabs, setHistoryLabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/students/${studentId}/courses/${courseId}/labs`)
      .then((res) => res.json())
      .then((data) => {
        setActiveLabs(data.active || []);
        setHistoryLabs(data.history || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching labs:", err);
        setIsLoading(false);
      });
  }, [courseId, studentId]);

  const allLabs = [...activeLabs, ...historyLabs];

  // Calculate course statistics
  const courseStats = React.useMemo(() => {
    let submitted = 0;
    let pending = 0;
    let expired = 0;
    let totalScore = 0;
    let totalMarks = 0;

    allLabs.forEach(lab => {
      const isDone = lab.status === 'Completed' || lab.status === 'Submitted';
      const isLate = lab.status === 'Late Submitted';
      const timeStatus = getLabTimeStatus(lab);
      const labMarks = lab.marks || 0;

      if (isDone || isLate) {
        submitted++;
        // Calculate score for average
        const avgScore = lab.score || 0; // out of 10
        const actualScore = (avgScore / 10) * labMarks;
        totalScore += actualScore;
        totalMarks += labMarks;
      } else if (timeStatus.reason === 'expired') {
        expired++;
        // Include expired labs with 0 score in average calculation
        totalScore += 0;
        totalMarks += labMarks;
      } else {
        pending++;
      }
    });

    const averageScore = totalMarks > 0 ? ((totalScore / totalMarks) * 100).toFixed(1) : 0;

    return { submitted, pending, expired, averageScore };
  }, [allLabs]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FD] font-sans pb-12">
      {/* ✅ Shared Navbar */}
      <Navbar studentName={studentName} />

      <div className="max-w-7xl mx-auto px-8 py-10">
        <header className="mb-10 flex flex-col gap-4">
          <button 
            onClick={() => navigate('/student/courses')} 
            className="flex items-center gap-2 text-indigo-600 font-bold text-sm"
          >
            <ChevronLeft size={18} /> Back to Courses
          </button>
          
          {/* Course Statistics Boxes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            {/* Submitted Labs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-700">{courseStats.submitted}</p>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Submitted</p>
                </div>
              </div>
            </motion.div>

            {/* Pending Labs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <FileQuestion className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-amber-700">{courseStats.pending}</p>
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Pending</p>
                </div>
              </div>
            </motion.div>

            {/* Expired Labs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <FileMinus className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-red-700">{courseStats.expired}</p>
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Expired</p>
                </div>
              </div>
            </motion.div>

            {/* Average Score */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-indigo-700">{courseStats.averageScore}%</p>
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Avg Score</p>
                </div>
              </div>
            </motion.div>
          </div>
          
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Course Assignments</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allLabs.map((lab) => {
            const isDone = lab.status === 'Completed' || lab.status === 'Submitted';
            const isLate = lab.status === 'Late Submitted';
            const timeStatus = getLabTimeStatus(lab);

            // Handler for attempting lab with time validation
            const handleAttemptLab = () => {
              if (!timeStatus.canAttempt) {
                if (timeStatus.reason === 'not_started') {
                  toast.error(`⏰ Lab hasn't started yet!\n${timeStatus.message}`, { duration: 4000 });
                } else if (timeStatus.reason === 'expired') {
                  toast.error(`⌛ Lab has expired!\n${timeStatus.message}`, { duration: 4000 });
                }
                return;
              }
              navigate(`/lab-session/${lab._id}`);
            };

            return (
              <motion.div
                key={lab._id}
                whileHover={{ y: -5 }}
                className={`bg-white rounded-3xl p-7 shadow-sm border transition-all ${
                  isDone ? 'border-blue-100' : isLate ? 'border-red-100' : 
                  !timeStatus.canAttempt ? 'border-gray-200' : 'border-amber-100'
                }`}
              >
                {/* Calculate actual score from averageScore (out of 10) to lab marks */}
                {(() => {
                  const labMarks = lab.marks || 0;
                  const avgScore = lab.score || 0; // averageScore is out of 10
                  const actualScore = Math.round((avgScore / 10) * labMarks);
                  const performance = labMarks > 0 ? Math.round((actualScore / labMarks) * 100) : 0;
                  
                  return (
                    <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{lab.title}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{lab.courseCode || 'Assignment'}</p>
                    {/* Status Badge */}
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isDone ? 'bg-blue-100 text-blue-700' : 
                      isLate ? 'bg-red-100 text-red-700' : 
                      timeStatus.reason === 'expired' ? 'bg-gray-100 text-gray-600' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {isDone ? 'Submitted' : isLate ? 'Late Submitted' : timeStatus.reason === 'expired' ? 'Expired' : 'Pending'}
                    </span>
                  </div>
                  <div className="mt-1">
                    {isDone ? <CheckCircle2 className="text-blue-500" size={24} /> : 
                     isLate ? <AlertCircle className="text-red-500" size={24} /> : 
                     timeStatus.reason === 'expired' ? <XCircle className="text-gray-400" size={24} /> :
                     timeStatus.reason === 'not_started' ? <Lock className="text-gray-400" size={24} /> :
                     <Clock className="text-amber-500" size={24} />}
                  </div>
                </div>

                <div className="space-y-4 text-sm border-b border-gray-50 pb-6 mb-6">
                  <div className="flex justify-between items-center text-gray-500">
                    <span className="font-bold uppercase text-[11px] tracking-wider">Total Tasks</span>
                    <span className="font-black text-gray-800">{lab.tasks?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span className="font-bold uppercase text-[11px] tracking-wider">Marks</span>
                    <span className="font-black text-gray-800">{labMarks}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span className="font-bold uppercase text-[11px] tracking-wider">Your Score</span>
                    <span className="font-black text-gray-900">{(isDone || isLate) ? actualScore : 0}/{labMarks}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest ${
                    isDone ? 'text-blue-600' : isLate ? 'text-red-600' : 
                    timeStatus.reason === 'expired' ? 'text-gray-500' :
                    timeStatus.reason === 'not_started' ? 'text-purple-600' :
                    'text-amber-600'
                  }`}>
                    {isDone ? (
                      <><CheckCircle2 size={14} /> Submitted: {new Date(lab.submittedAt || Date.now()).toLocaleDateString()}</>
                    ) : isLate ? (
                      <><AlertCircle size={14} /> Submitted Late: {new Date(lab.submittedAt || Date.now()).toLocaleDateString()}</>
                    ) : timeStatus.reason === 'expired' ? (
                      <><XCircle size={14} /> Expired: {new Date(lab.dueDate).toLocaleDateString()}</>
                    ) : timeStatus.reason === 'not_started' ? (
                      <><Lock size={14} /> Opens: {new Date(lab.startDate).toLocaleDateString()} at {lab.startTime || '00:00'}</>
                    ) : (
                      <><Clock size={14} /> Due: {new Date(lab.dueDate).toLocaleDateString()} at {lab.dueTime || '23:59'}</>
                    )}
                  </div>

                  {/* Show Re-attempt if submitted but lab is still active */}
                  {(isDone || isLate) && timeStatus.canAttempt ? (
                    <div className="flex flex-col gap-2">
                      <div className={`flex items-center gap-2 font-black text-[11px] uppercase tracking-widest w-fit px-3 py-1.5 rounded-xl ${
                          isDone ? 'text-blue-600 bg-blue-50' : 'text-red-600 bg-red-50'
                      }`}>
                        <TrendingUp size={14} /> Performance: {performance}%
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => navigate(`/lab-results/${lab._id}`)}
                          className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                        >
                          <Eye size={18} /> View Details
                        </button>
                        <button 
                          onClick={handleAttemptLab}
                          className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-lg shadow-green-100"
                        >
                          <RefreshCw size={18} /> Re-attempt
                        </button>
                      </div>
                    </div>
                  ) : (isDone || isLate) ? (
                    <div className="flex flex-col gap-2">
                      <div className={`flex items-center gap-2 font-black text-[11px] uppercase tracking-widest w-fit px-3 py-1.5 rounded-xl ${
                          isDone ? 'text-blue-600 bg-blue-50' : 'text-red-600 bg-red-50'
                      }`}>
                        <TrendingUp size={14} /> Performance: {performance}%
                      </div>
                      <button 
                        onClick={() => navigate(`/lab-results/${lab._id}`)}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                      >
                        <Eye size={18} /> View Details
                      </button>
                    </div>
                  ) : timeStatus.reason === 'not_started' ? (
                    <button 
                      onClick={handleAttemptLab}
                      className="w-full py-3 bg-gray-300 text-gray-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <Lock size={18} /> Not Available Yet
                    </button>
                  ) : timeStatus.reason === 'expired' ? (
                    <button 
                      onClick={handleAttemptLab}
                      className="w-full py-3 bg-gray-200 text-gray-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <XCircle size={18} /> Lab Expired
                    </button>
                  ) : (
                    <button 
                      onClick={handleAttemptLab}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                    >
                      <PlayCircle size={18} /> Attempt Lab
                    </button>
                  )}
                </div>
                    </>
                  );
                })()}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CourseLabs;
