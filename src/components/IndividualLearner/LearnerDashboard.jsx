import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from '../NotificationDropdown';
import ChatWidget from './ai/ChatWidget'; 
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, BookOpen, Trophy, Flame, TrendingUp, Award,
  LogOut, Users, Edit3, Clock, DollarSign, User, 
  ArrowLeft, Video, Code, HelpCircle, ChevronRight,
  Lock, CheckCircle, Play, Eye, CreditCard, FileText
} from 'lucide-react';  

const LearnerDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Levels");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [lessonContext, setLessonContext] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  const userId = localStorage.getItem("userId");
  const fullName = localStorage.getItem("fullName") || "Learner";

  // One card per course/specialization — no flattening into children
  const flattenCourses = (recommended) => {
    return (recommended || []).map(course => {
      if (course.isSpecialization && course.childCourses && course.childCourses.length) {
        const allModules = course.childCourses.reduce((acc, child) => acc.concat(child.modules || []), []);
        return Object.assign({}, course, {
          title: course.title,
          isSpecialization: true,
          modules: allModules.length ? allModules : (course.modules || []),
          enrollmentCount: course.enrollmentCount || 0,
        });
      }
      return course;
    });
  };

  const fetchDashboardData = async (autoOpenId = null) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/learners/dashboard-data/${userId}`);
      setData(res.data);

      if (autoOpenId) {
        const freshFlattened = flattenCourses(res.data.recommended);
        const target = freshFlattened.find(c => String(c._id) === String(autoOpenId));
        if (target) setSelectedCourse(target);
      }
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paidCourseId = params.get("courseId");

    if (!paidCourseId) {
      fetchDashboardData();
      return;
    }

    window.history.replaceState({}, document.title, "/learner-dashboard");

    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/learners/dashboard-data/${userId}`);
        const freshData = res.data;

        const isEnrolled = freshData.enrolled?.some(e => {
          const id = String(e.courseId?._id || e.courseId);
          return id === String(paidCourseId);
        });

        if (!isEnrolled && attempts < 6) {
          setTimeout(poll, 2000);
          return;
        }

        setData(freshData);

        const flattened = flattenCourses(freshData.recommended);
        const target = flattened.find(c =>
          String(c._id) === String(paidCourseId) ||
          String(c.parentId) === String(paidCourseId)
        );
        if (target) setSelectedCourse(target);

      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    setTimeout(poll, 2000);
  }, [userId]);

  const handleEnroll = async (course) => {
    try {
      setIsRedirecting(true);
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/payments/create-course-checkout`,
        {
          courseId: course._id,
          courseTitle: course.title,
          coursePrice: course.price,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.url) window.location.href = res.data.url;
    } catch (err) {
      console.error("Payment Error:", err);
      alert("Failed to initiate payment.");
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  const handleLessonClick = (ls, moduleId, childCourseId) => {
    setActiveLesson(ls);
    setLessonContext({
      courseId: selectedCourse?._id,
      moduleId: moduleId || 'unknown',
      childCourseId: childCourseId || null
    });
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  const handleQuizSubmit = async () => {
    if (!activeLesson?.quizData?.length) return;
    setQuizSubmitting(true);
    setQuizSubmitted(true);

    const correctAnswers = activeLesson.quizData.filter(
      (q, i) => quizAnswers[i] === q.correctAnswer
    ).length;
    const totalQuestions = activeLesson.quizData.length;

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/learner-submissions/submit-quiz`, {
        learnerId: userId,
        courseId: lessonContext.courseId || 'unknown',
        childCourseId: lessonContext.childCourseId || null,
        moduleId: lessonContext.moduleId || 'unknown',
        lessonId: activeLesson._id || activeLesson.id || activeLesson.title,
        lessonTitle: activeLesson.title,
        score: Math.round((correctAnswers / totalQuestions) * 10 * 10) / 10,
        totalQuestions,
        correctAnswers,
        quizAnswers: Object.values(quizAnswers)
      });
    } catch (err) {
      console.error('Quiz submission error:', err);
    } finally {
      setQuizSubmitting(false);
    }
  };

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Codezy...</p>
      </div>
    </div>
  );

  const flattenedCourses = flattenCourses(data.recommended);

  const filteredCourses = flattenedCourses.filter(course => {
    const title = course?.title?.toLowerCase() || "";
    const matchesSearch = title.includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All Levels" ||
      (activeCategory === "Specialization" ? course?.isSpecialization : course?.difficulty === activeCategory);
    return matchesSearch && matchesCategory;
  });

  const isSubscribed = (courseId, parentId = null) => {
    return data.enrolled?.some(e => {
      const enrolledId = String(e.courseId?._id || e.courseId);
      return enrolledId === String(courseId) ||
        (parentId && enrolledId === String(parentId));
    });
  };

  const getLessonIcon = (type, size = 14) => {
    if (type === 'video') return <Video size={size}/>;
    if (type === 'lab') return <Code size={size}/>;
    if (type === 'quiz') return <HelpCircle size={size}/>;
    if (type === 'document') return <FileText size={size}/>;
    return <FileText size={size}/>;
  };

  const getLessonColor = (type) => {
    if (type === 'video') return 'bg-blue-600';
    if (type === 'lab') return 'bg-emerald-600';
    if (type === 'quiz') return 'bg-purple-600';
    if (type === 'document') return 'bg-orange-500';
    return 'bg-gray-600';
  };

  // ─── COURSE VIEWER ───────────────────────────────────────────────
  if (selectedCourse) {
    const subscribed = isSubscribed(selectedCourse._id, selectedCourse.parentId);

    return (
      <div className="flex h-screen bg-white overflow-hidden font-sans">

        {/* Sidebar */}
        <aside className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-5 border-b border-gray-100 bg-white">
            <button
              onClick={() => { setSelectedCourse(null); setActiveLesson(null); }}
              className="flex items-center gap-2 text-gray-400 hover:text-purple-600 mb-4 text-[10px] font-bold uppercase tracking-widest"
            >
              <ArrowLeft size={12} /> Dashboard
            </button>
            <h2 className="font-black text-sm text-gray-800 uppercase truncate">
              {selectedCourse.title}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Specialization: group by child course → modules → lessons */}
            {selectedCourse.isSpecialization && selectedCourse.childCourses?.length > 0
              ? selectedCourse.childCourses.map((child, cIdx) => (
                <div key={child._id || `child-${cIdx}`} className="space-y-2">
                  {/* Pink header = child course */}
                  <div className="px-3 py-2 bg-pink-50 rounded-lg text-[10px] font-black text-pink-700 uppercase tracking-tighter border border-pink-100">
                    {child.title}
                  </div>
                  {(child.modules || []).map((mod, mIdx) => (
                    <div key={`mod-${cIdx}-${mIdx}`} className="space-y-1 pl-2">
                      {/* Purple header = module */}
                      <div className="px-3 py-1.5 bg-purple-50 rounded-lg text-[10px] font-black text-purple-700 uppercase tracking-tighter">
                        {mod.title}
                      </div>
                      <div className="space-y-1">
                        {(mod.lessons?.length ? mod.lessons : (mod.subModules?.[0]?.lessons || [])).map((ls, lsIdx) => (
                          <button
                            key={ls._id || ls.id || `ls-${cIdx}-${mIdx}-${lsIdx}`}
                            onClick={() => subscribed ? handleLessonClick(ls, mod.id || mod._id || mod.title, child._id) : alert("Course restricted. Please subscribe to unlock content.")}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-[11px] font-bold transition-all
                              ${activeLesson?.title === ls.title
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-white text-gray-500 border border-gray-100 hover:border-purple-200'}`}
                          >
                            {getLessonIcon(ls.type)}
                            <span className="truncate flex-1 text-left">{ls.title}</span>
                            {!subscribed
                              ? <Lock size={12} className="ml-auto text-gray-300 shrink-0" />
                              : <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                  ls.type === 'video' ? 'bg-blue-100 text-blue-600' :
                                  ls.type === 'lab' ? 'bg-emerald-100 text-emerald-600' :
                                  ls.type === 'quiz' ? 'bg-purple-100 text-purple-600' :
                                  'bg-gray-100 text-gray-500'
                                }`}>{ls.type}</span>
                            }
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))
              : /* Regular course — flat modules */
              selectedCourse.modules?.length === 0
                ? <p className="text-xs text-gray-400 text-center mt-8">No modules available yet.</p>
                : selectedCourse.modules?.map((mod, mIdx) => (
                  <div key={mod._id || mod.id || `mod-${mIdx}`} className="space-y-2">
                    <div className="px-3 py-2 bg-purple-50 rounded-lg text-[10px] font-black text-purple-700 uppercase tracking-tighter">
                      {mod.title}
                    </div>
                    <div className="space-y-1">
                      {(mod.lessons?.length ? mod.lessons : (mod.subModules?.[0]?.lessons || [])).map((ls, lsIdx) => (
                        <button
                          key={ls._id || ls.id || `ls-${mIdx}-${lsIdx}`}
                          onClick={() => subscribed ? handleLessonClick(ls, mod.id || mod._id || mod.title, null) : alert("Course restricted. Please subscribe to unlock content.")}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl text-[11px] font-bold transition-all
                            ${activeLesson?.title === ls.title
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-white text-gray-500 border border-gray-100 hover:border-purple-200'}`}
                        >
                          {getLessonIcon(ls.type)}
                          <span className="truncate flex-1 text-left">{ls.title}</span>
                          {!subscribed
                            ? <Lock size={12} className="ml-auto text-gray-300 shrink-0" />
                            : <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                ls.type === 'video' ? 'bg-blue-100 text-blue-600' :
                                ls.type === 'lab' ? 'bg-emerald-100 text-emerald-600' :
                                ls.type === 'quiz' ? 'bg-purple-100 text-purple-600' :
                                'bg-gray-100 text-gray-500'
                              }`}>{ls.type}</span>
                          }
                        </button>
                      ))}
                    </div>
                  </div>
                ))
            }
          </div>

          {!subscribed && (
            <div className="p-4 bg-white border-t border-gray-100">
              <button
                disabled={isRedirecting}
                onClick={() => handleEnroll(selectedCourse)}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-xs shadow-lg hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                {isRedirecting
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><CreditCard size={14}/> SUBSCRIBE TO ACCESS</>
                }
              </button>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-white flex justify-center">
          <div className="w-full max-w-3xl px-12 py-12 pb-32">

            {!activeLesson ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="relative h-64 w-full rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <img src={selectedCourse.thumbnail || "/placeholder.jpg"} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
                    <h1 className="text-3xl font-black text-white">{selectedCourse.title}</h1>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Difficulty</p>
                    <p className="text-sm font-bold text-purple-600">{selectedCourse.difficulty || "Beginner"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Duration</p>
                    <p className="text-sm font-bold text-gray-800">{selectedCourse.duration || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Instructor</p>
                    <p className="text-sm font-bold text-gray-800">{selectedCourse.instructor || "Codezy"}</p>
                  </div>
                </div>

                {selectedCourse.description && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Overview</h3>
                    <p className="text-gray-500 leading-relaxed">{selectedCourse.description}</p>
                  </div>
                )}

                {/* Curriculum — grouped by child course for specializations */}
                {selectedCourse.isSpecialization && selectedCourse.childCourses?.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Curriculum</h3>
                    {selectedCourse.childCourses.map((child, cIdx) => (
                      <div key={child._id || cIdx} className="border border-pink-100 rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 bg-pink-50 border-b border-pink-100">
                          <p className="font-black text-pink-700 text-xs uppercase">{child.title}</p>
                          <p className="text-[10px] text-pink-400 mt-0.5">{child.modules?.length || 0} module{child.modules?.length !== 1 ? 's' : ''}</p>
                        </div>
                        {(child.modules || []).map((mod, mIdx) => {
                          const lessons = mod.lessons?.length ? mod.lessons : (mod.subModules?.[0]?.lessons || []);
                          return (
                            <div key={mIdx} className="p-4 bg-gray-50 border-b border-gray-100 last:border-0 pl-6">
                              <p className="font-black text-gray-700 text-xs uppercase mb-1">{mod.title}</p>
                              <p className="text-xs text-gray-400">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</p>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ) : selectedCourse.modules?.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Curriculum</h3>
                    {(selectedCourse.modules || []).map((mod, mIdx) => {
                      const lessons = mod.lessons?.length ? mod.lessons : (mod.subModules?.[0]?.lessons || []);
                      return (
                        <div key={mIdx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <p className="font-black text-gray-700 text-xs uppercase mb-2">{mod.title}</p>
                          <p className="text-xs text-gray-400">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {!subscribed && (
                  <div className="p-8 bg-purple-50 rounded-[2.5rem] border border-purple-100 text-center">
                    <Lock size={40} className="mx-auto text-purple-200 mb-4" />
                    <h4 className="text-lg font-black text-purple-900 uppercase">Content Locked</h4>
                    <p className="text-purple-500 text-sm mt-2 mb-6">Subscribe to unlock all modules and lessons</p>
                    <button
                      disabled={isRedirecting}
                      onClick={() => handleEnroll(selectedCourse)}
                      className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-xl hover:scale-105 transition-transform"
                    >
                      {isRedirecting ? "Redirecting..." : `Unlock Now — $${selectedCourse.price ?? 0}`}
                    </button>
                  </div>
                )}
              </div>

            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                  <div className={`p-3 rounded-2xl ${getLessonColor(activeLesson.type)} text-white`}>
                    {getLessonIcon(activeLesson.type, 24)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{activeLesson.type}</p>
                    <h2 className="text-2xl font-black text-gray-900">{activeLesson.title}</h2>
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
                            : `${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}${activeLesson.videoUrl}`
                        }
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-[2rem] bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200">
                      <p className="text-gray-400 font-bold text-sm">
                        No video URL provided.
                      </p>
                    </div>
                  )
                )}

                {activeLesson.type === 'lab' && (
                  <div className="space-y-6">
                    {activeLesson.labConfig?.problemStatement && (
                      <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <h4 className="font-black text-emerald-900 text-xs uppercase mb-3">Problem Statement</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{activeLesson.labConfig.problemStatement}</p>
                      </div>
                    )}
                    {activeLesson.labConfig?.code && (
                      <div className="p-6 bg-gray-900 rounded-2xl">
                        <h4 className="font-black text-gray-400 text-xs uppercase mb-3">Starter Code</h4>
                        <pre className="text-emerald-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                          {activeLesson.labConfig.code}
                        </pre>
                      </div>
                    )}
                    {activeLesson.labConfig?.testCases?.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-black text-gray-700 text-xs uppercase">Test Cases</h4>
                        {activeLesson.labConfig.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                          <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 font-mono text-xs">
                            <span className="text-gray-400">Input: </span>
                            <span className="text-gray-800">{tc.input || 'N/A'}</span>
                            <span className="text-gray-400 ml-4">Expected: </span>
                            <span className="text-emerald-700">{tc.expectedOutput || 'N/A'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => navigate('/learner-lab', { state: { lesson: activeLesson, courseTitle: selectedCourse.title, courseId: lessonContext.courseId, moduleId: lessonContext.moduleId, childCourseId: lessonContext.childCourseId } })}
                      className="w-full py-4 bg-gray-900 text-emerald-400 font-mono rounded-xl flex items-center justify-center gap-3 hover:bg-black transition-colors font-bold">
                      <Code size={18}/> Launch Cloud IDE
                    </button>
                  </div>
                )}

                {activeLesson.type === 'quiz' && (
                  <div className="space-y-6">
                    {(!activeLesson.quizData || activeLesson.quizData.length === 0) ? (
                      <div className="p-8 bg-purple-50 rounded-2xl text-center">
                        <HelpCircle size={32} className="mx-auto text-purple-200 mb-3"/>
                        <p className="text-purple-400 font-bold text-sm">No questions available for this quiz yet.</p>
                      </div>
                    ) : (
                      <>
                        {activeLesson.quizData.map((q, qIdx) => (
                          <div key={qIdx} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                            <p className="font-black text-gray-800 text-sm">
                              <span className="text-purple-500 mr-2">Q{qIdx + 1}.</span>{q.question}
                            </p>
                            <div className="space-y-2">
                              {q.options?.map((opt, oIdx) => {
                                const isSelected = quizAnswers[qIdx] === oIdx;
                                const isCorrect = oIdx === q.correctAnswer;
                                return (
                                  <button key={oIdx} disabled={quizSubmitted}
                                    onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                                    className={`w-full text-left p-3 rounded-xl text-sm font-medium border transition-all
                                      ${quizSubmitted
                                        ? isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                          : isSelected ? 'bg-red-50 border-red-300 text-red-700'
                                          : 'bg-white border-gray-200 text-gray-500'
                                        : isSelected ? 'bg-purple-50 border-purple-400 text-purple-800'
                                          : 'bg-white border-gray-200 text-gray-700 hover:border-purple-200 hover:bg-purple-50'
                                      }`}
                                  >
                                    <span className="font-black mr-2 text-gray-400">{String.fromCharCode(65 + oIdx)}.</span>
                                    {opt}
                                    {quizSubmitted && isCorrect && <CheckCircle size={14} className="inline ml-2 text-emerald-600"/>}
                                  </button>
                                );
                              })}
                            </div>
                            {quizSubmitted && q.explanation && (
                              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-xs text-blue-700"><span className="font-black">💡 Explanation: </span>{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        ))}
                        {!quizSubmitted ? (
                          <button onClick={handleQuizSubmit}
                            disabled={Object.keys(quizAnswers).length < activeLesson.quizData.length || quizSubmitting}
                            className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                            {quizSubmitting ? 'Submitting...' : 'Submit Quiz'}
                          </button>
                        ) : (
                          <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 text-center">
                            <p className="font-black text-purple-800 text-lg">
                              Score: {activeLesson.quizData.filter((q, i) => quizAnswers[i] === q.correctAnswer).length}
                              /{activeLesson.quizData.length}
                            </p>
                            <button onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }}
                              className="mt-3 text-xs font-bold text-purple-600 underline">Retry Quiz</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {activeLesson.type === 'document' && (
                  activeLesson.studyMaterial ? (
                    <div className="p-8 bg-orange-50 rounded-2xl border border-orange-100 prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">{activeLesson.studyMaterial}</div>
                    </div>
                  ) : (
                    <div className="p-8 bg-gray-50 rounded-2xl text-center border-2 border-dashed border-gray-200">
                      <FileText size={32} className="mx-auto text-gray-200 mb-3"/>
                      <p className="text-gray-400 font-bold text-sm">No study material available for this lesson.</p>
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

  // ─── MAIN DASHBOARD ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F9FAFB] relative font-sans">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-8">
          <a href="/learner-dashboard" className="text-purple-700 font-bold text-xl flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="bg-purple-700 text-white px-1.5 py-0.5 rounded-md text-sm font-mono">{"</>"}</div>
            Codezy
          </a>
          <div className="hidden md:flex gap-6 text-sm font-semibold text-gray-500">
            <a href="/courses" className="hover:text-purple-700 transition-colors">Courses</a>
            <a href="/learner/competitions" className="hover:text-purple-700 transition-colors">Competitions</a>
            <a href="/achievements" className="hover:text-purple-700 transition-colors">Achievements</a>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <NotificationDropdown />
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 font-bold text-xs flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
            <LogOut size={16} /> Logout
          </button>
          <a href="/learner-profile" className="w-9 h-9 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-bold uppercase hover:bg-purple-200 transition-colors">
            {fullName.charAt(0)}
          </a>
        </div>
      </nav>

      <header className="bg-gradient-to-r from-[#7C3AED] via-[#A21CAF] to-[#DB2777] p-8 text-white shadow-md">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Welcome Back, {fullName}! 👋</h1>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
            <StatCard label="Total XP" value={data.stats?.totalXp || 0} icon={<Trophy size={18}/>} />
            <StatCard label="Completed Labs" value={data.stats?.completedLabs || 0} icon={<BookOpen size={18}/>} />
            <StatCard label="Learning Streak" value={`${data.stats?.learningStreak || 0} days`} icon={<Flame size={18}/>} />
            <StatCard label="XP This Week" value={`+${data.stats?.xpThisWeek || 0}`} icon={<TrendingUp size={18}/>} />
            <a href="/achievements" className="bg-white/15 backdrop-blur-md p-4 rounded-xl border border-white/20 flex items-center gap-4 transition-transform hover:scale-105 hover:bg-white/25 cursor-pointer no-underline text-white">
              <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center"><Award size={18}/></div>
              <div>
                <p className="text-[10px] opacity-80 uppercase font-bold leading-none">Achievements</p>
                <p className="text-lg font-bold mt-0.5">View All →</p>
              </div>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-12 pb-24">
        <section>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search curriculum..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border-none text-sm outline-none focus:ring-2 focus:ring-purple-500"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['All Levels', 'Beginner', 'Intermediate', 'Advanced', 'Specialization'].map((lvl) => (
                <button key={lvl} onClick={() => setActiveCategory(lvl)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeCategory === lvl ? 'bg-purple-700 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode='popLayout'>
              {filteredCourses.map((course, index) => (
                <CourseCard
                  key={course._id || `course-${index}`}
                  course={course}
                  index={index}
                  onView={() => setSelectedCourse(course)}
                  subscribed={isSubscribed(course._id, course.parentId)}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>

      <ChatWidget context={{ userName: fullName, stats: data.stats }} />
    </div>
  );
};

const StatCard = ({ label, value, icon }) => (
  <div className="bg-white/15 backdrop-blur-md p-4 rounded-xl border border-white/20 flex items-center gap-4 transition-transform hover:scale-105 cursor-default">
    <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center">{icon}</div>
    <div>
      <p className="text-[10px] opacity-80 uppercase font-bold leading-none">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  </div>
);

const CourseCard = ({ course, index, onView, subscribed }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.05 }}
    className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all group overflow-hidden relative"
  >
    <div className="h-40 w-full overflow-hidden relative">
      <img src={course.thumbnail || "/placeholder.jpg"} alt={course.title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
      {subscribed && (
        <div className="absolute top-3 left-3 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
          <CheckCircle size={14} />
        </div>
      )}
    </div>
    <div className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded uppercase">
          {course.difficulty || 'General'}
        </span>
        {course.isSpecialization && (
          <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2 py-1 rounded uppercase">
            Specialization
          </span>
        )}
      </div>
      <h3 className="text-md font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors line-clamp-1">
        {course.title}
      </h3>
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
        <User size={14} className="text-purple-500" />
        <span className="font-medium">{course.instructor || "Instructor"}</span>
      </div>
      <div className="grid grid-cols-2 gap-y-3 mb-6">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
          <Users size={14} className="text-purple-500" />{course.enrollmentCount || 0} Learners
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
          <Edit3 size={14} className="text-emerald-500" />{course.modules?.length || 0} Modules
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
          <Clock size={14} className="text-orange-500" />{course.duration || "N/A"}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700">
          <DollarSign size={14} className="text-green-500" />{course.price > 0 ? `$${course.price}` : "Free"}
        </span>
      </div>
      <button onClick={onView}
        className={`w-full py-2.5 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2
          ${subscribed ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-50 text-purple-700 hover:bg-purple-600 hover:text-white border border-transparent'}`}>
        {subscribed ? <Play size={14}/> : <Eye size={14}/>}
        {subscribed ? "Continue Learning" : "View Details"}
      </button>
    </div>
  </motion.div>
);

export default LearnerDashboard;