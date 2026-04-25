import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from '../NotificationDropdown';
import ChatWidget from '../ai/ChatWidget';
import axios from 'axios';
import {
  Search, BookOpen, LogOut, Users, Edit3,
  Clock, DollarSign, User, Play, CheckCircle, CheckCircle2,
  ArrowLeft, Video, Code, HelpCircle, FileText, Lock, LockOpen,
  Trophy, Award, Zap, X, RotateCcw, Target, TrendingUp, Star,
  ChevronRight, ChevronDown, Loader2, AlertTriangle
} from 'lucide-react';

const CoursesPage = () => {
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLevel, setActiveLevel] = useState("All Levels");
  const [activeSpecialization, setActiveSpecialization] = useState("");

  // Course viewer state
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeChildCourse, setActiveChildCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [courseLoading, setCourseLoading] = useState(false);

  // Submission tracking
  const [submissions, setSubmissions] = useState({});
  const [courseProgress, setCourseProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Modal state
  const [showResultModal, setShowResultModal] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Expanded modules tracking
  const [expandedModules, setExpandedModules] = useState({});

  const userId = localStorage.getItem("userId");
  const fullName = localStorage.getItem("fullName") || "User";

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("userId");
      localStorage.removeItem("fullName");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
  };

  // Fetch enrolled courses
  useEffect(() => {
    if (userId) {
      axios
        .get(`http://localhost:5000/api/learners/enrolled-courses/${userId}`)
        .then(res => {
          console.log("ENROLLED DATA:", res.data);
          setEnrolledCourses(res.data || []);
        })
        .catch(err => console.error("Enrolled courses error:", err));
    }
  }, [userId]);

  // Fetch submissions and progress when a course is selected
  useEffect(() => {
    if (selectedCourse && userId) {
      setLoadingProgress(true);
      
      Promise.all([
        axios.get(`http://localhost:5000/api/learner-submissions/${userId}/course/${selectedCourse._id}`),
        axios.get(`http://localhost:5000/api/learner-submissions/${userId}/course-progress/${selectedCourse._id}`)
      ])
        .then(([submissionsRes, progressRes]) => {
          setSubmissions(submissionsRes.data.submissions || {});
          setCourseProgress(progressRes.data.progress || null);
        })
        .catch(err => {
          console.error("Error fetching progress:", err);
        })
        .finally(() => setLoadingProgress(false));
    }
  }, [selectedCourse, userId]);

  // Open course inline
  const handleContinueLearning = (item) => {
    if (item.isSpecialization && item.childCourses?.length > 0) {
      // For specializations, set the course and first unlocked child course
      setSelectedCourse(item);
      setActiveChildCourse(item.childCourses[0]);
    } else {
      setSelectedCourse(item);
      setActiveChildCourse(null);
    }
    setActiveLesson(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setExpandedModules({});
  };

  // Handle lesson click
  const handleLessonClick = (ls, moduleId, isLocked = false) => {
    if (isLocked) return;
    
    const lessonId = ls._id || ls.id || ls.title;
    const submissionData = submissions[lessonId];
    
    if (submissionData && (ls.type === 'lab' || ls.type === 'quiz')) {
      // Show result modal for submitted labs/quizzes
      setCurrentSubmission({ ...submissionData, lesson: ls, moduleId });
      setShowResultModal(true);
    } else {
      // Regular lesson view
      setActiveLesson({ ...ls, moduleId });
      setQuizAnswers({});
      setQuizSubmitted(false);
    }
  };

  // Submit quiz
  const handleQuizSubmit = async () => {
    if (!activeLesson || !activeLesson.quizData?.length) return;
    
    setIsSubmitting(true);
    
    const totalQuestions = activeLesson.quizData.length;
    const correctAnswers = activeLesson.quizData.filter(
      (q, i) => quizAnswers[i] === q.correctAnswer
    ).length;
    
    const quizAnswersData = activeLesson.quizData.map((q, i) => ({
      questionIndex: i,
      selectedAnswer: quizAnswers[i],
      isCorrect: quizAnswers[i] === q.correctAnswer
    }));
    
    try {
      const response = await axios.post('http://localhost:5000/api/learner-submissions/submit-quiz', {
        learnerId: userId,
        courseId: selectedCourse._id,
        childCourseId: activeChildCourse?._id || null,
        moduleId: activeLesson.moduleId,
        lessonId: activeLesson._id || activeLesson.id || activeLesson.title,
        lessonTitle: activeLesson.title,
        totalQuestions,
        correctAnswers,
        quizAnswers: quizAnswersData
      });
      
      setSubmissionResult(response.data);
      setQuizSubmitted(true);
      
      // Update local submissions
      const lessonId = activeLesson._id || activeLesson.id || activeLesson.title;
      setSubmissions(prev => ({
        ...prev,
        [lessonId]: response.data.submission
      }));
      
      // Refresh course progress
      const progressRes = await axios.get(
        `http://localhost:5000/api/learner-submissions/${userId}/course-progress/${selectedCourse._id}`
      );
      setCourseProgress(progressRes.data.progress || null);
      
    } catch (error) {
      console.error("Quiz submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle re-attempt
  const handleReAttempt = () => {
    setShowResultModal(false);
    if (currentSubmission?.lesson) {
      setActiveLesson({ ...currentSubmission.lesson, moduleId: currentSubmission.moduleId });
      setQuizAnswers({});
      setQuizSubmitted(false);
    }
    setCurrentSubmission(null);
  };

  // Get lesson status
  const getLessonStatus = (lessonId) => {
    const submission = submissions[lessonId];
    if (!submission) return null;
    return submission;
  };

  // Get module progress
  const getModuleProgress = (moduleId) => {
    if (!courseProgress) return null;
    
    if (selectedCourse.isSpecialization && activeChildCourse) {
      const childProgress = courseProgress.childCourses?.find(
        c => c.childCourseId === activeChildCourse._id
      );
      return childProgress?.modules?.find(m => m.moduleId === moduleId);
    }
    
    return courseProgress.modules?.find(m => m.moduleId === moduleId);
  };

  // Check if child course is locked
  // Check if child course is locked — uses ID-based lookup from progress data
  const isChildCourseLocked = (childCourseIndex) => {
    if (childCourseIndex === 0) return false;
    if (!courseProgress?.childCourses) return true;

    // Find previous child course by its ID from the actual course structure
    const prevChildCourseId = selectedCourse?.childCourses?.[childCourseIndex - 1]?._id;
    if (!prevChildCourseId) return true;

    const previousChild = courseProgress.childCourses.find(
      c => c.childCourseId === prevChildCourseId
    );
    if (!previousChild) return true;

    return !previousChild.isCompleted || previousChild.courseScore < 7;
  };

  // Get child course status
  const getChildCourseStatus = (childCourse, index) => {
    if (!courseProgress?.childCourses) return { isLocked: index > 0, isCompleted: false, score: 0 };
    
    const childProgress = courseProgress.childCourses.find(
      c => c.childCourseId === childCourse._id
    );
    
    if (!childProgress) return { isLocked: index > 0, isCompleted: false, score: 0 };
    
    return {
      isLocked: childProgress.isLocked ?? isChildCourseLocked(index),
      isCompleted: childProgress.isCompleted,
      score: childProgress.courseScore
    };
  };

  // Icons and colors
  const getLessonIcon = (type, size = 14) => {
    if (type === 'video') return <Video size={size} />;
    if (type === 'lab') return <Code size={size} />;
    if (type === 'quiz') return <HelpCircle size={size} />;
    if (type === 'document') return <FileText size={size} />;
    return <FileText size={size} />;
  };

  const getLessonColor = (type) => {
    if (type === 'video') return 'bg-blue-600';
    if (type === 'lab') return 'bg-emerald-600';
    if (type === 'quiz') return 'bg-purple-600';
    if (type === 'document') return 'bg-orange-500';
    return 'bg-gray-600';
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-emerald-500';
    if (score >= 7) return 'text-green-500';
    if (score >= 5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score) => {
    if (score >= 8) return 'bg-emerald-500/10 border-emerald-500/30';
    if (score >= 7) return 'bg-green-500/10 border-green-500/30';
    if (score >= 5) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const specializationTags = Array.from(
    new Set(
      enrolledCourses
        .filter(c => c.isSpecialization && c.specializationTitle)
        .map(c => c.specializationTitle)
    )
  );

  const filtered = enrolledCourses.filter(item => {
    const title = item.title || "";
    const instructor = item.instructor || "";
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel =
      activeLevel === "All Levels" ||
      (activeLevel === "Specialization" ? item.isSpecialization : item.level === activeLevel);
    const matchesSpecialization =
      !activeSpecialization || item.specializationTitle === activeSpecialization;
    return matchesSearch && matchesLevel && matchesSpecialization;
  });

  // Get modules to display
  const currentModules = useMemo(() => {
    if (selectedCourse?.isSpecialization && activeChildCourse) {
      return activeChildCourse.modules || [];
    }
    return selectedCourse?.modules || [];
  }, [selectedCourse, activeChildCourse]);

  // ─── RESULT MODAL ──────────────────────────────────────────────────────
  const ResultModal = () => {
    if (!showResultModal || !currentSubmission) return null;
    
    const isLab = currentSubmission.lessonType === 'lab';
    const score = currentSubmission.bestScore || currentSubmission.score;
    const passed = score >= 7;
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={() => setShowResultModal(false)}>
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}>
          
          {/* Header */}
          <div className={`p-6 text-center ${passed ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${passed ? 'bg-white/20' : 'bg-white/20'}`}>
              {passed ? (
                <Trophy size={40} className="text-white" />
              ) : (
                <Target size={40} className="text-white" />
              )}
            </div>
            <h2 className="text-2xl font-black text-white mb-1">
              {passed ? 'Great Job!' : 'Keep Trying!'}
            </h2>
            <p className="text-white/80 text-sm">
              {currentSubmission.lessonTitle}
            </p>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Score Display */}
            <div className="text-center">
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border-2 ${getScoreBgColor(score)}`}>
                <Star className={getScoreColor(score)} size={24} />
                <span className={`text-3xl font-black ${getScoreColor(score)}`}>
                  {score}/10
                </span>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {isLab ? (
                <>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Test Cases</p>
                    <p className="text-lg font-black text-gray-800">
                      {currentSubmission.testCasesPassed}/{currentSubmission.testCasesTotal}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Attempts</p>
                    <p className="text-lg font-black text-gray-800">{currentSubmission.attempts}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Correct</p>
                    <p className="text-lg font-black text-gray-800">
                      {currentSubmission.testCasesPassed}/{currentSubmission.testCasesTotal}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Attempts</p>
                    <p className="text-lg font-black text-gray-800">{currentSubmission.attempts}</p>
                  </div>
                </>
              )}
            </div>
            
            {/* XP Earned */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Zap size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-400 uppercase">Total XP Earned</p>
                  <p className="text-lg font-black text-purple-700">+{currentSubmission.totalXpFromLesson} XP</p>
                </div>
              </div>
              <Award size={32} className="text-purple-300" />
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowResultModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleReAttempt}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Re-attempt
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── COURSE VIEWER ────────────────────────────────────────────────────
  if (selectedCourse) {
    return (
      <div className="flex h-screen bg-white overflow-hidden font-sans">
        <ResultModal />

        {/* Sidebar */}
        <aside className="w-96 bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-200 flex flex-col shrink-0">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-white shadow-sm">
            <button
              onClick={() => { setSelectedCourse(null); setActiveLesson(null); setActiveChildCourse(null); }}
              className="flex items-center gap-2 text-slate-400 hover:text-purple-600 mb-4 text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              <ArrowLeft size={12} /> Dashboard
            </button>
            <h2 className="font-black text-sm text-slate-800 uppercase truncate">
              {selectedCourse.specializationTitle || selectedCourse.title}
            </h2>
            
            {/* Course Progress Bar */}
            {courseProgress && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-400">Overall Progress</span>
                  {courseProgress.isCompleted && (
                    <span className={`text-xs font-bold ${getScoreColor(courseProgress.courseScore)}`}>
                      Score: {courseProgress.courseScore}/10
                    </span>
                  )}
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${courseProgress.isCompleted ? 100 : (
                      selectedCourse.isSpecialization && courseProgress.childCourses?.length
                        ? (courseProgress.childCourses.filter(c => c.isCompleted).length / courseProgress.childCourses.length) * 100
                        : (courseProgress.modules?.filter(m => m.isCompleted).length / (courseProgress.modules?.length || 1)) * 100
                    )}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Child Courses (for Specializations) */}
          {selectedCourse.isSpecialization && selectedCourse.childCourses?.length > 0 && (
            <div className="p-4 border-b border-slate-200 bg-white/50 space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Courses</p>
              {selectedCourse.childCourses.map((child, idx) => {
                const status = getChildCourseStatus(child, idx);
                const isActive = activeChildCourse?._id === child._id;
                
                return (
                  <button
                    key={child._id || idx}
                    onClick={() => {
                      if (!status.isLocked) {
                        setActiveChildCourse(child);
                        setActiveLesson(null);
                      }
                    }}
                    disabled={status.isLocked}
                    className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                      status.isLocked
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                        : isActive
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    {status.isLocked ? (
                      <Lock size={16} className="text-slate-400" />
                    ) : status.isCompleted ? (
                      <CheckCircle2 size={16} className={isActive ? 'text-white' : 'text-emerald-500'} />
                    ) : (
                      <div className={`w-4 h-4 rounded-full border-2 ${isActive ? 'border-white' : 'border-slate-300'}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : ''}`}>
                        Course {idx + 1}: {child.title}
                      </p>
                      {status.isCompleted && (
                        <p className={`text-[10px] ${isActive ? 'text-white/70' : getScoreColor(status.score)}`}>
                          Score: {status.score}/10
                        </p>
                      )}
                      {status.isLocked && (
                        <p className="text-[10px] text-slate-400">
                          Need 7+/10 in previous course
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Modules List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingProgress ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-purple-500" size={24} />
              </div>
            ) : currentModules.length === 0 ? (
              <p className="text-xs text-slate-400 text-center mt-8">No modules available yet.</p>
            ) : (
              currentModules.map((mod, mIdx) => {
                const moduleId = mod.id || mod._id?.toString() || mod.title;
                const moduleProgress = getModuleProgress(moduleId);
                const isExpanded = expandedModules[moduleId] !== false;
                const lessons = mod.lessons?.length ? mod.lessons : (mod.subModules?.[0]?.lessons || []);
                
                return (
                  <div key={moduleId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    {/* Module Header */}
                    <button
                      onClick={() => setExpandedModules(prev => ({ ...prev, [moduleId]: !isExpanded }))}
                      className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${moduleProgress?.isCompleted ? 'bg-emerald-100' : 'bg-purple-100'}`}>
                        {moduleProgress?.isCompleted ? (
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        ) : (
                          <BookOpen size={16} className="text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-wider">
                          Module {mIdx + 1}
                        </p>
                        <p className="text-sm font-bold text-slate-800 truncate">{mod.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {moduleProgress?.isCompleted && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${getScoreBgColor(moduleProgress.moduleScore)} ${getScoreColor(moduleProgress.moduleScore)}`}>
                            {moduleProgress.moduleScore}/10
                          </span>
                        )}
                        {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                      </div>
                    </button>
                    
                    {/* Module Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2">
                        {/* Progress Bar */}
                        {moduleProgress && (
                          <div className="mb-3 px-2">
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-slate-400">
                                {moduleProgress.completedLabs + moduleProgress.completedQuizzes}/
                                {moduleProgress.totalLabs + moduleProgress.totalQuizzes} completed
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                                style={{ 
                                  width: `${((moduleProgress.completedLabs + moduleProgress.completedQuizzes) / 
                                    (moduleProgress.totalLabs + moduleProgress.totalQuizzes || 1)) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Lessons */}
                        {lessons.map((ls, lsIdx) => {
                          const lessonId = ls._id || ls.id || ls.title;
                          const submission = getLessonStatus(lessonId);
                          const isSubmitted = !!submission;
                          const isLabOrQuiz = ls.type === 'lab' || ls.type === 'quiz';
                          
                          return (
                            <button
                              key={lessonId}
                              onClick={() => handleLessonClick(ls, moduleId)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl text-[11px] font-bold transition-all ${
                                activeLesson?.title === ls.title && activeLesson?.moduleId === moduleId
                                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                                  : isSubmitted && isLabOrQuiz
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:border-emerald-300'
                                  : 'bg-slate-50 text-slate-600 border border-slate-100 hover:border-purple-200'
                              }`}
                            >
                              {/* Status Icon */}
                              <div className={`p-1.5 rounded-lg ${
                                isSubmitted && isLabOrQuiz
                                  ? 'bg-emerald-500 text-white'
                                  : activeLesson?.title === ls.title && activeLesson?.moduleId === moduleId
                                  ? 'bg-white/20'
                                  : getLessonColor(ls.type) + ' text-white'
                              }`}>
                                {isSubmitted && isLabOrQuiz ? (
                                  <CheckCircle2 size={12} />
                                ) : (
                                  getLessonIcon(ls.type, 12)
                                )}
                              </div>
                              
                              {/* Title */}
                              <span className="truncate flex-1 text-left">{ls.title}</span>
                              
                              {/* Type Tag & Score */}
                              <div className="flex items-center gap-2 shrink-0">
                                {isSubmitted && isLabOrQuiz && (
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${getScoreBgColor(submission.bestScore)} ${getScoreColor(submission.bestScore)}`}>
                                    {submission.bestScore}/10
                                  </span>
                                )}
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                                  ls.type === 'video' ? 'bg-blue-100 text-blue-600' :
                                  ls.type === 'lab' ? 'bg-emerald-100 text-emerald-600' :
                                  ls.type === 'quiz' ? 'bg-purple-100 text-purple-600' :
                                  'bg-gray-100 text-gray-500'
                                }`}>{ls.type}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-white flex justify-center">
          <div className="w-full max-w-3xl px-12 py-12 pb-32">

            {!activeLesson ? (
              // Course Overview
              <div className="space-y-8">
                <div className="relative h-64 w-full rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <img
                    src={selectedCourse.thumbnail || "/placeholder.jpg"}
                    className="w-full h-full object-cover" alt=""
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
                    <h1 className="text-3xl font-black text-white">
                      {activeChildCourse?.title || selectedCourse.specializationTitle || selectedCourse.title}
                    </h1>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Difficulty</p>
                    <p className="text-sm font-bold text-purple-600">{selectedCourse.difficulty || "Beginner"}</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Duration</p>
                    <p className="text-sm font-bold text-slate-800">{selectedCourse.duration || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Instructor</p>
                    <p className="text-sm font-bold text-slate-800">{selectedCourse.instructor || "Codezy"}</p>
                  </div>
                </div>

                {selectedCourse.description && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Overview</h3>
                    <p className="text-slate-500 leading-relaxed">{selectedCourse.description}</p>
                  </div>
                )}

                {/* Module Summary */}
                {currentModules.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Curriculum</h3>
                    {currentModules.map((mod, mIdx) => {
                      const moduleId = mod.id || mod._id?.toString() || mod.title;
                      const moduleProgress = getModuleProgress(moduleId);
                      const lessons = mod.lessons?.length ? mod.lessons : (mod.subModules?.[0]?.lessons || []);
                      
                      return (
                        <div key={mIdx} className={`p-4 rounded-2xl border ${
                          moduleProgress?.isCompleted 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : 'bg-white border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-black text-slate-700 text-xs uppercase mb-1">{mod.title}</p>
                              <p className="text-xs text-slate-400">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</p>
                            </div>
                            {moduleProgress?.isCompleted && (
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${getScoreColor(moduleProgress.moduleScore)}`}>
                                  {moduleProgress.moduleScore}/10
                                </span>
                                <CheckCircle2 size={20} className="text-emerald-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            ) : (
              // Lesson Viewer
              <div className="space-y-8">
                <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
                  <div className={`p-3 rounded-2xl ${getLessonColor(activeLesson.type)} text-white`}>
                    {getLessonIcon(activeLesson.type, 24)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeLesson.type}</p>
                    <h2 className="text-2xl font-black text-slate-900">{activeLesson.title}</h2>
                  </div>
                </div>

                {/* VIDEO */}
                {activeLesson.type === "video" && (
                  activeLesson.videoUrl ? (
                    <div className="aspect-video rounded-[2rem] overflow-hidden bg-black shadow-2xl">
                      <video
                        controls
                        className="w-full h-full"
                        src={
                          activeLesson.videoUrl.startsWith("http")
                            ? activeLesson.videoUrl
                            : `http://localhost:5000${activeLesson.videoUrl}`
                        }
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-[2rem] bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-bold text-sm">No video URL provided.</p>
                    </div>
                  )
                )}

                {/* LAB */}
                {activeLesson.type === 'lab' && (
                  <div className="space-y-6">
                    {activeLesson.labConfig?.problemStatement && (
                      <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200">
                        <h4 className="font-black text-emerald-900 text-xs uppercase mb-3">Problem Statement</h4>
                        <p className="text-slate-700 text-sm leading-relaxed">{activeLesson.labConfig.problemStatement}</p>
                      </div>
                    )}
                    {activeLesson.labConfig?.code && (
                      <div className="p-6 bg-slate-900 rounded-2xl">
                        <h4 className="font-black text-slate-400 text-xs uppercase mb-3">Starter Code</h4>
                        <pre className="text-emerald-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                          {activeLesson.labConfig.code}
                        </pre>
                      </div>
                    )}
                    {activeLesson.labConfig?.testCases?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-black text-slate-700 text-xs uppercase">Test Cases</h4>
                        {activeLesson.labConfig.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                          <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200 font-mono text-xs shadow-sm">
                            <span className="text-slate-400">Input: </span>
                            <span className="text-slate-800">{tc.input || 'N/A'}</span>
                            <span className="text-slate-400 ml-4">Expected: </span>
                            <span className="text-emerald-700">{tc.expectedOutput || 'N/A'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => navigate('/learner-lab', { 
                        state: { 
                          lesson: activeLesson, 
                          courseTitle: selectedCourse.title,
                          courseId: selectedCourse._id,
                          childCourseId: activeChildCourse?._id,
                          moduleId: activeLesson.moduleId
                        } 
                      })}
                      className="w-full py-4 bg-slate-900 text-emerald-400 font-mono rounded-xl flex items-center justify-center gap-3 hover:bg-black font-bold transition-colors shadow-lg">
                      <Code size={18} /> Launch Cloud IDE
                    </button>
                  </div>
                )}

                {/* QUIZ */}
                {activeLesson.type === 'quiz' && (
                  <div className="space-y-6">
                    {(!activeLesson.quizData || activeLesson.quizData.length === 0) ? (
                      <div className="p-8 bg-purple-50 rounded-2xl text-center border border-purple-100">
                        <HelpCircle size={32} className="mx-auto text-purple-200 mb-3" />
                        <p className="text-purple-400 font-bold text-sm">No questions available yet.</p>
                      </div>
                    ) : (
                      <>
                        {activeLesson.quizData.map((q, qIdx) => (
                          <div key={qIdx} className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                            <p className="font-black text-slate-800 text-sm">
                              <span className="text-purple-500 mr-2">Q{qIdx + 1}.</span>{q.question}
                            </p>
                            <div className="space-y-2">
                              {q.options?.map((opt, oIdx) => {
                                const isSelected = quizAnswers[qIdx] === oIdx;
                                const isCorrect = oIdx === q.correctAnswer;
                                return (
                                  <button
                                    key={oIdx}
                                    disabled={quizSubmitted}
                                    onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                                    className={`w-full text-left p-3 rounded-xl text-sm font-medium border transition-all ${
                                      quizSubmitted
                                        ? isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                          : isSelected ? 'bg-red-50 border-red-300 text-red-700'
                                          : 'bg-white border-slate-200 text-slate-500'
                                        : isSelected ? 'bg-purple-50 border-purple-400 text-purple-800'
                                          : 'bg-white border-slate-200 text-slate-700 hover:border-purple-200'
                                    }`}
                                  >
                                    <span className="font-black mr-2 text-slate-400">{String.fromCharCode(65 + oIdx)}.</span>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                            {quizSubmitted && q.explanation && (
                              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-xs text-blue-700"><span className="font-black">💡 </span>{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        ))}
                        {!quizSubmitted ? (
                          <button
                            onClick={handleQuizSubmit}
                            disabled={Object.keys(quizAnswers).length < activeLesson.quizData.length || isSubmitting}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              'Submit Quiz'
                            )}
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 text-center">
                              <div className="flex items-center justify-center gap-3 mb-3">
                                {submissionResult?.submission?.bestScore >= 7 ? (
                                  <Trophy className="text-emerald-500" size={28} />
                                ) : (
                                  <Target className="text-amber-500" size={28} />
                                )}
                                <p className={`font-black text-2xl ${getScoreColor(submissionResult?.submission?.bestScore || 0)}`}>
                                  {submissionResult?.submission?.bestScore || 0}/10
                                </p>
                              </div>
                              <p className="text-sm text-slate-600 mb-2">
                                {activeLesson.quizData.filter((q, i) => quizAnswers[i] === q.correctAnswer).length}
                                /{activeLesson.quizData.length} questions correct
                              </p>
                              {submissionResult?.xpGained > 0 && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full">
                                  <Zap size={14} className="text-purple-600" />
                                  <span className="text-sm font-bold text-purple-700">+{submissionResult.xpGained} XP</span>
                                </div>
                              )}
                            </div>
                            <button 
                              onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }}
                              className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                            >
                              <RotateCcw size={16} />
                              Try Again
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* DOCUMENT */}
                {activeLesson.type === 'document' && (
                  activeLesson.studyMaterial ? (
                    <div className="p-8 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-200">
                      <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm">
                        {activeLesson.studyMaterial}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 bg-slate-50 rounded-2xl text-center border-2 border-dashed border-slate-200">
                      <FileText size={32} className="mx-auto text-slate-200 mb-3" />
                      <p className="text-slate-400 font-bold text-sm">No study material available.</p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ─── COURSES LIST ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white font-sans relative">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-8">
          <a href="/learner-dashboard" className="text-purple-700 font-bold text-xl flex items-center gap-2">
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white px-1.5 py-0.5 rounded-md text-sm font-mono shadow-md">{"</>"}</div>
            Codezy
          </a>
          <div className="hidden md:flex gap-2 text-sm font-semibold">
            <a href="/courses" className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl font-bold">Courses</a>
            <a href="/learner/competitions" className="text-slate-500 hover:text-purple-700 px-4 py-2">Competitions</a>
            <a href="/achievements" className="text-slate-500 hover:text-purple-700 px-4 py-2">Achievements</a>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <NotificationDropdown />
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-bold text-xs px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
            <LogOut size={16} /><span className="hidden sm:inline">Logout</span>
          </button>
          <a href="/learner-profile" className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 border-2 border-purple-200 flex items-center justify-center text-white font-bold uppercase shadow-md">
            {fullName.charAt(0)}
          </a>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <header className="mb-8">
          <h1 className="text-2xl font-black text-slate-800">My Courses</h1>
          <p className="text-slate-500 text-sm mt-1">View and continue learning your enrolled courses</p>
        </header>

        {/* FILTERS */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search your courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border-none text-sm outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All Levels', 'Beginner', 'Intermediate', 'Advanced', 'Specialization'].map(level => (
              <button key={level} onClick={() => setActiveLevel(level)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeLevel === level ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                }`}>
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* SPECIALIZATION PILLS */}
        {specializationTags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            <button onClick={() => setActiveSpecialization("")}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeSpecialization === "" ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-700' : 'bg-white text-slate-500 border-slate-200'
              }`}>All</button>
            {specializationTags.map(spec => (
              <button key={spec}
                onClick={() => setActiveSpecialization(activeSpecialization === spec ? "" : spec)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  activeSpecialization === spec ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-700' : 'bg-white text-slate-500 border-slate-200'
                }`}>
                {spec}
              </button>
            ))}
          </div>
        )}

        {/* COURSE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.length ? (
            filtered.map((item, index) => (
              <div key={`${item._id}-${index}`}
                className="bg-white rounded-2xl border border-slate-200 hover:shadow-xl transition-all group overflow-hidden relative">
                <div className="h-40 w-full overflow-hidden relative">
                  <img src={item.thumbnail || "/placeholder.jpg"} alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-3 left-3 bg-gradient-to-br from-emerald-500 to-green-600 text-white p-1.5 rounded-full shadow-lg">
                    <CheckCircle size={14} />
                  </div>
                  {item.isSpecialization && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase shadow-md">
                      Specialization
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded uppercase">
                      {item.level || 'General'}
                    </span>
                  </div>
                  <h3 className="text-md font-bold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-1">
                    {item.specializationTitle || item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-600 mb-4">
                    <User size={14} className="text-purple-500" />
                    <span className="font-medium">{item.instructor || "Instructor"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 mb-4">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                      <Users size={14} className="text-purple-500" />{item.enrollmentCount || 0} Learners
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                      <Edit3 size={14} className="text-emerald-500" />{item.moduleCount || 0} Modules
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                      <Clock size={14} className="text-orange-500" />{item.duration || "N/A"}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                      <DollarSign size={14} className="text-green-500" />
                      {item.price > 0 ? `$${item.price}` : "Free"}
                    </span>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Progress</span>
                      <span className="text-[10px] font-bold text-purple-600">{item.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-700"
                        style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>

                  <button
                    onClick={() => handleContinueLearning(item)}
                    disabled={courseLoading}
                    className="w-full py-2.5 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 shadow-lg shadow-purple-500/20"
                  >
                    {courseLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <><Play size={14} /> Continue Learning</>
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-24 text-center">
              <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-400 font-bold">No courses found.</p>
              <button onClick={() => { setActiveLevel("All Levels"); setActiveSpecialization(""); setSearchQuery(""); }}
                className="mt-3 text-purple-600 font-bold text-sm underline">Reset filters</button>
            </div>
          )}
        </div>
      </main>

      <ChatWidget />
    </div>
  );
};

export default CoursesPage;
