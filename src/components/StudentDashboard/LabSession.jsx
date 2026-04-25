import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Play, CheckCircle2, XCircle, Info, 
  AlertTriangle, Terminal, Clock, Target, ShieldCheck,
  Send, Layers, Loader2, Award, X, Sparkles
} from 'lucide-react';
import axios from 'axios';
import Editor from '@monaco-editor/react';

const LabSession = ({preloadedData = null}) => {
  const { labId } = useParams();
  const navigate = useNavigate();
  const [labData, setLabData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for multi-task handling
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [taskCodes, setTaskCodes] = useState({}); // Stores code per task ID
  const [activeTab, setActiveTab] = useState('problem'); // 'problem' or 'testcases'
  
  // New: Code execution states
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [accessError, setAccessError] = useState(null);
  
  // Submission popup states
  const [showSubmissionPopup, setShowSubmissionPopup] = useState(false);
  const [taskScores, setTaskScores] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionConfirmed, setSubmissionConfirmed] = useState(false);

  // AI Analyzer states
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiError, setAiError] = useState(null);

  // Helper function to check lab time status
  const checkLabTimeAccess = (lab) => {
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
        canAccess: false, 
        reason: 'not_started', 
        message: `This lab hasn't started yet. It will be available on ${startDateTime.toLocaleDateString()} at ${lab.startTime || '00:00'}.`
      };
    }
    
    if (now > dueDateTime) {
      return { 
        canAccess: false, 
        reason: 'expired', 
        message: `This lab has expired. The deadline was ${dueDateTime.toLocaleDateString()} at ${lab.dueTime || '23:59'}.`
      };
    }
    
    return { canAccess: true };
  };

  useEffect(() => {
      // If data was passed directly (learner lab), skip fetch
    if (preloadedData) {
      const timeAccess = checkLabTimeAccess ? { canAccess: true } : { canAccess: true };
      setLabData(preloadedData);
      const initialCodes = {};
      preloadedData.tasks.forEach(task => {
        initialCodes[task._id] = "";
      });
      setTaskCodes(initialCodes);
      setIsLoading(false);
      return;
    }

    // Original fetch logic for student labs
    if (!labId) {
      console.error('Lab ID is missing from URL parameters!');
      alert('Invalid lab ID. Returning to dashboard...');
      navigate('/student-dashboard');
      return;
    }

       // Fetches lab details including tasks, constraints, and test cases
    console.log('Fetching lab details for labId:', labId);

    fetch(`http://localhost:5000/api/students/lab-details/${labId}`)
      .then(res => res.json())
      .then(data => {
        console.log('Lab data received:', data);
        console.log('Tasks count:', data.tasks?.length);
        
        // Check time-based access
        const timeAccess = checkLabTimeAccess(data);
        if (!timeAccess.canAccess) {
          setAccessError(timeAccess);
          setIsLoading(false);
          return;
        }
        
        setLabData(data);
        // Initialize taskCodes with empty strings or starter code if available
        const initialCodes = {};
        if (data.tasks && Array.isArray(data.tasks)) {
          data.tasks.forEach(task => {
            console.log('Task ID:', task._id, 'Title:', task.title);
            initialCodes[task._id] = ""; 
          });
        } else {
          console.error('No tasks found in lab data!');
        }
        setTaskCodes(initialCodes);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching lab details:", err);
        alert('Failed to load lab data. Please try again.');
        setIsLoading(false);
      });
  }, [labId, navigate, preloadedData]);

  const handleCodeChange = (newCode) => {
    const currentTaskId = labData.tasks[activeTaskIndex]._id;
    setTaskCodes(prev => ({
      ...prev,
      [currentTaskId]: newCode
    }));
  };

  // Run code (without saving)
  const handleRunCode = async () => {
    // Validate lab data is loaded
    if (!labData || !labData.tasks || labData.tasks.length === 0) {
      alert('Lab data is still loading. Please wait...');
      return;
    }

    const currentTaskId = labData.tasks[activeTaskIndex]?._id;
    const code = taskCodes[currentTaskId];

    // Debug logging
    console.log('Debug - Running code with:', {
      labId,
      taskId: currentTaskId,
      language: selectedLanguage,
      codeLength: code?.length,
      activeTaskIndex,
      totalTasks: labData.tasks.length
    });

    // Validate all required fields
    if (!currentTaskId) {
      alert('Task ID is missing. Please refresh the page.');
      return;
    }

    if (!labId) {
      alert('Lab ID is missing. Please return to dashboard and try again.');
      return;
    }

    if (!code || !code.trim()) {
      alert('Please write some code first!');
      return;
    }

    setIsRunning(true);
    setExecutionResult(null);

    try {
      const studentId = JSON.parse(localStorage.getItem('user'))?.id;
      
      const requestPayload = {
        code,
        language: selectedLanguage,
        labId,
        taskId: currentTaskId,
        studentId
      };

      console.log('Sending code execution request:', requestPayload);
      console.log('Request payload validation:',  {
        hasCode: !!code,
        hasLanguage: !!selectedLanguage,
        hasLabId: !!labId,
        hasTaskId: !!currentTaskId,
        hasStudentId: !!studentId
      });
      
      const response = await axios.post('http://localhost:5000/api/code-execution/run', requestPayload);

      setExecutionResult(response.data);
    } catch (error) {
      console.error('Execution error:', error);
      console.error('Error response:', error.response?.data);
      setExecutionResult({
        success: false,
        error: error.response?.data?.error || error.message || 'Execution failed',
        terminal: `Error: ${error.response?.data?.error || error.message || 'An error occurred'}`,
        score: 0,
        maxScore: 10
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Evaluate all tasks and show submission popup
  const handleSubmitCode = async () => {
    // Validate lab data is loaded
    if (!labData || !labData.tasks || labData.tasks.length === 0) {
      alert('Lab data is still loading. Please wait...');
      return;
    }

    // Check if all tasks have code
    const emptyTasks = labData.tasks.filter(task => {
      const code = taskCodes[task._id];
      return !code || !code.trim();
    });

    if (emptyTasks.length > 0) {
      alert(`Please write code for all tasks before submitting. Missing: ${emptyTasks.map(t => t.title).join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setTaskScores([]);

    try {
      const studentId = JSON.parse(localStorage.getItem('user'))?.id;
      const scores = [];

      // Evaluate each task
      for (const task of labData.tasks) {
        try {
          const response = await axios.post('http://localhost:5000/api/code-execution/run', {
            code: taskCodes[task._id],
            language: selectedLanguage,
            labId,
            taskId: task._id,
            studentId
          });

          scores.push({
            taskId: task._id,
            taskTitle: task.title,
            taskMarks: task.marks,
            score: response.data.score || 0,
            maxScore: 10,
            passed: (response.data.score || 0) >= 7
          });
        } catch (error) {
          scores.push({
            taskId: task._id,
            taskTitle: task.title,
            taskMarks: task.marks,
            score: 0,
            maxScore: 10,
            passed: false,
            error: error.response?.data?.error || error.message
          });
        }
      }

      setTaskScores(scores);
      setShowSubmissionPopup(true);
    } catch (error) {
      console.error('Evaluation error:', error);
      alert(`Evaluation failed: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm and save the submission
  const handleConfirmSubmission = async () => {
    setIsSubmitting(true);
    
    try {
      const studentId = JSON.parse(localStorage.getItem('user'))?.id;
      
      // Submit all tasks to backend
      const response = await axios.post('http://localhost:5000/api/code-execution/submit-lab', {
        labId,
        studentId,
        taskSubmissions: labData.tasks.map(task => ({
          taskId: task._id,
          code: taskCodes[task._id],
          language: selectedLanguage,
          score: taskScores.find(s => s.taskId === task._id)?.score || 0
        }))
      });

      setSubmissionConfirmed(true);
    } catch (error) {
      console.error('Submission error:', error);
      alert(`Submission failed: ${error.response?.data?.error || error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
    </div>
  );

  // Show access error if lab is not within valid time window
  if (accessError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-4">
        <div className="bg-[#1E293B] rounded-2xl p-8 max-w-md w-full text-center border border-slate-700 shadow-xl">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
            accessError.reason === 'not_started' ? 'bg-purple-500/20' : 'bg-red-500/20'
          }`}>
            {accessError.reason === 'not_started' ? (
              <Clock size={40} className="text-purple-400" />
            ) : (
              <AlertTriangle size={40} className="text-red-400" />
            )}
          </div>
          
          <h2 className={`text-2xl font-bold mb-3 ${
            accessError.reason === 'not_started' ? 'text-purple-400' : 'text-red-400'
          }`}>
            {accessError.reason === 'not_started' ? 'Lab Not Available Yet' : 'Lab Has Expired'}
          </h2>
          
          <p className="text-slate-400 mb-6 leading-relaxed">
            {accessError.message}
          </p>
          
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            <ChevronLeft size={18} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleLearnerSubmit = async () => {
  const currentTaskId = labData.tasks[activeTaskIndex]?._id;
  const code = taskCodes[currentTaskId];

  if (!code || !code.trim()) {
    alert('Please write some code before marking as complete!');
    return;
  }

  setIsSubmitting(true);

  try {
    const userId = localStorage.getItem('userId');
    
    // Extract courseId and lessonTitle from the lab _id
    // Format: learner_${courseId}_${encodedLessonTitle}
    const parts = labData._id.replace('learner_', '').split('_');
    const courseId = parts[0];
    const lessonTitle = decodeURIComponent(parts.slice(1).join('_'));

    const response = await axios.post('http://localhost:5000/api/learners/submit-lab', {
      userId,
      courseId,
      lessonTitle,
      code,
      language: selectedLanguage,
      score: executionResult?.score || 0
    });

    alert(`Lab completed! You earned ${response.data.xpEarned} XP 🎉`);
    navigate(-1);
  } catch (err) {
    if (err.response?.data?.message === 'Already submitted') {
      alert('You have already submitted this lab.');
    } else {
      alert(`Submission failed: ${err.response?.data?.message || err.message}`);
    }
  } finally {
    setIsSubmitting(false);
  }
};

  const handleAiAnalyze = async () => {
    const currentTaskId = labData.tasks[activeTaskIndex]?._id;
    const code = taskCodes[currentTaskId];

    if (!code || !code.trim()) {
      alert('Please write some code first before asking for AI help!');
      return;
    }

    setShowAiPanel(true);
    setIsAnalyzing(true);
    setAiAnalysis(null);
    setAiError(null);

    try {
      const response = await axios.post('http://localhost:5000/api/students/ai-analyze', {
        code,
        language: selectedLanguage,
        taskTitle: currentTask?.title,
        taskDescription: currentTask?.description,
        codeConstraints: currentTask?.codeConstraints || [],
        labTitle: labData?.title
      });

      setAiAnalysis(response.data);
    } catch (err) {
      setAiError(err.response?.data?.message || "AI analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentTask = labData?.tasks[activeTaskIndex];

  return (
    <div className="h-screen bg-[#0F172A] text-slate-300 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 bg-[#1E293B] px-6 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col border-l border-slate-700 pl-4">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{labData?.courseCode}</span>
            <h1 className="text-sm font-black text-white leading-none uppercase">{labData?.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 text-xs font-bold">
            <Target size={14} className="text-emerald-500" />
            <span>{labData?.marks} Total Marks</span>
          </div>
          {/* Only show submit for student labs */}
          {!labData?.isLearnerLab && (
            <button 
              onClick={handleSubmitCode}
              disabled={isRunning || !labData || !labData.tasks || labData.tasks.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/20"
            >
              <Send size={14} /> Submit Solution
            </button>
          )}
           {/* Learner complete button */}
          {labData?.isLearnerLab && (
            <button
              onClick={handleLearnerSubmit}
              disabled={isRunning}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
            >
              <Send size={14} /> Mark Complete
            </button>
          )}
        </div>
      </header>

      {/* Task Switcher Bar for Multiple Tasks */}
      <div className="h-10 bg-[#1E293B]/50 border-b border-slate-800 flex items-center px-4 gap-2">
        <div className="flex items-center gap-2 px-3 border-r border-slate-700 mr-2">
          <Layers size={14} className="text-slate-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase">Tasks</span>
        </div>
        {labData?.tasks.map((task, idx) => (
          <button
            key={task._id}
            onClick={() => setActiveTaskIndex(idx)}
            className={`px-4 h-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTaskIndex === idx 
              ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5' 
              : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {idx + 1}. {task.title}
          </button>
        ))}
      </div>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Problem, Constraints & Test Cases */}
        <aside className="w-[480px] border-r border-slate-800 flex flex-col bg-[#0F172A] shrink-0">
          <div className="flex border-b border-slate-800 bg-[#1E293B]/30">
            <button onClick={() => setActiveTab('problem')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'problem' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5' : 'text-slate-500'}`}>
              Description
            </button>
            <button onClick={() => setActiveTab('testcases')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'testcases' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5' : 'text-slate-500'}`}>
              Test Cases
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'problem' ? (
                <motion.div 
                  key={`prob-${activeTaskIndex}`}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  className="space-y-8"
                >
                  <section>
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="text-white font-bold text-lg">{currentTask?.title}</h2>
                      <span className="text-[10px] font-bold bg-indigo-500/10 px-2 py-1 rounded text-indigo-400">{currentTask?.marks} pts</span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-400 bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                      {currentTask?.description || "No description provided."}
                    </p>
                  </section>

                  {currentTask?.codeConstraints?.length > 0 && (
                    <section className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-2">
                        <ShieldCheck size={14} /> Structural Constraints
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {currentTask.codeConstraints.map((con, cIdx) => (
                          <div key={cIdx} className={`text-xs p-3 rounded-xl border ${con.type === 'Forbidden' ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}>
                            <span className="font-bold">{con.type}:</span> {con.construct} 
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key={`test-${activeTaskIndex}`}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <h2 className="text-white font-bold text-sm mb-4">Verification Suites</h2>
                  {currentTask?.testCases?.map((tc, i) => (
                    <div key={i} className={`bg-slate-900 rounded-xl border ${tc.isHidden ? 'border-dashed border-slate-800' : 'border-slate-800'} overflow-hidden`}>
                      <div className="bg-slate-800/50 px-4 py-2 text-[9px] font-bold uppercase tracking-wider flex justify-between">
                        <span>Case {i + 1}</span>
                        <span className={tc.isHidden ? "text-amber-500" : "text-indigo-400"}>
                          {tc.isHidden ? "Hidden Case" : "Public Case"}
                        </span>
                      </div>
                      {!tc.isHidden ? (
                        <div className="p-4 space-y-4">
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Input</label>
                            <pre className="mt-1 bg-black/30 p-3 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800">{tc.input || "No Input"}</pre>
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Expected Output</label>
                            <pre className="mt-1 bg-black/30 p-3 rounded-lg text-xs font-mono text-blue-400 overflow-x-auto border border-slate-800">{tc.expectedOutput}</pre>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 flex flex-col items-center justify-center gap-3 italic text-xs text-slate-500">
                          <AlertTriangle size={24} className="text-slate-700" />
                          <span>Input/Output hidden for evaluation</span>
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* Right Panel: Editor & Execution Console */}
        <section className="flex-1 flex flex-col bg-[#111827]">
          {/* Code Editor Space */}
          <div className="flex-1 p-4 relative">
             <div className="absolute top-8 right-10 z-10 flex items-center gap-3">
                <select 
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="text-[10px] font-black uppercase tracking-widest bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="python">Python 3.11</option>
                  <option value="java">Java 17</option>
                  <option value="cpp">C++ 17</option>
                </select>
                <div className="h-4 w-px bg-slate-800"></div>
                <Info size={14} className="text-slate-600" />
             </div>
            <Editor
              height="100%"
              language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
              value={taskCodes[currentTask?._id] || ""}
              onChange={(value) => handleCodeChange(value || "")}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
                fontLigatures: true,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                formatOnPaste: true,
                formatOnType: true,
                tabSize: 4,
                insertSpaces: true,
                renderWhitespace: 'selection',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                mouseWheelZoom: true,
                bracketPairColorization: { enabled: true },
                guides: {
                  bracketPairs: true,
                  indentation: true
                }
              }}
              loading={
                <div className="flex items-center justify-center h-full bg-[#1E293B]">
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
              }
            />
          </div>

          {/* Execution Console */}
          <div className="h-[280px] bg-[#020617] border-t border-slate-800 flex flex-col">
            <div className="flex justify-between items-center px-6 py-3 border-b border-slate-800 bg-slate-900/30">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Terminal size={14} /> Results Console
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAiAnalyze}
                  disabled={isRunning}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-900/20 active:scale-95"
                >
                  <Sparkles size={12} /> AI Assistance
                </button>
                <button 
                  onClick={handleRunCode}
                  disabled={isRunning || !labData || !labData.tasks || labData.tasks.length === 0}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-6 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
                >
                  {isRunning ? (
                    <><Loader2 size={12} className="animate-spin" /> Running...</>
                  ) : (
                    <><Play size={12} fill="currentColor" /> Run Current Task</>
                  )}
                </button>
              </div>
            </div>
            <div className="flex-1 p-6 font-mono text-xs overflow-y-auto space-y-4 custom-scrollbar">
               {!executionResult && !isRunning && (
                 <div className="flex items-center gap-3 text-slate-600">
                    <span className="animate-pulse">●</span>
                    <span className="uppercase text-[10px] font-bold tracking-widest">Waiting for execution...</span>
                 </div>
               )}
               
               {isRunning && (
                 <div className="flex items-center gap-3 text-indigo-400">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="uppercase text-[10px] font-bold tracking-widest">Executing code...</span>
                 </div>
               )}

               {executionResult && (
                 <div className="space-y-4">
                   {/* Score Display */}
                   <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Score</span>
                       <span className={`text-2xl font-bold ${executionResult.score >= 7 ? 'text-green-400' : executionResult.score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                         {executionResult.score}/{executionResult.maxScore}
                       </span>
                     </div>
                     {executionResult.testCases && executionResult.structural && (
                       <div className="text-[10px] text-slate-500 space-y-1">
                         <div>Test Cases: {executionResult.testCases.passed}/{executionResult.testCases.total}</div>
                         <div>Structural: {executionResult.structural.passed}/{executionResult.structural.total}</div>
                       </div>
                     )}
                   </div>

                   {/* Terminal Output */}
                   {executionResult.terminal && (
                     <div className="bg-black rounded-lg p-4 border border-slate-800">
                       <pre className="text-slate-300 whitespace-pre-wrap text-[10px] leading-relaxed">
                         {executionResult.terminal}
                       </pre>
                     </div>
                   )}

                   {/* Error Display */}
                   {executionResult.error && !executionResult.terminal && (
                     <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                       <div className="flex items-center gap-2 mb-2">
                         <XCircle size={14} className="text-red-400" />
                         <span className="text-red-400 font-bold text-xs">Error</span>
                       </div>
                       <pre className="text-red-300 text-[10px] whitespace-pre-wrap">
                         {executionResult.error}
                       </pre>
                     </div>
                   )}
                 </div>
               )}
            </div>
          </div>
        </section>
      </main>
      
      {/* AI Analysis Panel */}
      <AnimatePresence>
        {showAiPanel && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 h-full w-[420px] bg-[#0F172A] border-l border-slate-800 z-40 flex flex-col shadow-2xl"
          >
            {/* Panel Header */}
            <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Sparkles size={16} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">AI Code Assistant</h3>
                  <p className="text-slate-500 text-[10px]">{currentTask?.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiPanel(false)}
                className="text-slate-500 hover:text-white transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              
              {/* Loading State */}
              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-purple-500/20 flex items-center justify-center">
                      <Loader2 size={28} className="animate-spin text-purple-400" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-300 font-semibold text-sm">Analyzing your code...</p>
                    <p className="text-slate-500 text-xs mt-1">AI is reviewing your approach</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {aiError && !isAnalyzing && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle size={14} className="text-red-400" />
                    <span className="text-red-400 font-bold text-xs">Analysis Failed</span>
                  </div>
                  <p className="text-slate-400 text-xs">{aiError}</p>
                  <button
                    onClick={handleAiAnalyze}
                    className="mt-3 text-xs text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Try Again →
                  </button>
                </div>
              )}

              {/* Analysis Result */}
              {aiAnalysis && !isAnalyzing && (
                <div className="space-y-4">
                  
                  {/* Overall Assessment */}
                  {aiAnalysis.overallAssessment && (
                    <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
                      <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Info size={12} /> Overall Assessment
                      </h4>
                      <p className="text-slate-300 text-sm leading-relaxed">{aiAnalysis.overallAssessment}</p>
                    </div>
                  )}

                  {/* What's Wrong / Issues */}
                  {aiAnalysis.issues && aiAnalysis.issues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle size={12} /> Issues Found
                      </h4>
                      {aiAnalysis.issues.map((issue, idx) => (
                        <div key={idx} className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                          <p className="text-slate-300 text-xs leading-relaxed">{issue}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hints / Approach Suggestions */}
                  {aiAnalysis.hints && aiAnalysis.hints.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                        <Target size={12} /> Approach Hints
                      </h4>
                      {aiAnalysis.hints.map((hint, idx) => (
                        <div key={idx} className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                          <div className="flex gap-2">
                            <span className="text-amber-500 font-bold text-xs shrink-0">{idx + 1}.</span>
                            <p className="text-slate-300 text-xs leading-relaxed">{hint}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Logic Feedback */}
                  {aiAnalysis.logicFeedback && (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                      <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ShieldCheck size={12} /> Logic Analysis
                      </h4>
                      <p className="text-slate-300 text-xs leading-relaxed">{aiAnalysis.logicFeedback}</p>
                    </div>
                  )}

                  {/* Constraint Feedback */}
                  {aiAnalysis.constraintFeedback && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                      <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ShieldCheck size={12} /> Constraint Check
                      </h4>
                      <p className="text-slate-300 text-xs leading-relaxed">{aiAnalysis.constraintFeedback}</p>
                    </div>
                  )}

                  {/* Re-analyze button */}
                  <button
                    onClick={handleAiAnalyze}
                    className="w-full py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles size={12} /> Re-analyze Updated Code
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submission Popup Modal */}
      <AnimatePresence>
        {showSubmissionPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => !isSubmitting && !submissionConfirmed && setShowSubmissionPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1E293B] rounded-2xl max-w-md w-full shadow-2xl border border-slate-700 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="text-white" size={24} />
                  <h2 className="text-white font-bold text-lg">
                    {submissionConfirmed ? 'Submission Complete!' : 'Lab Evaluation Results'}
                  </h2>
                </div>
                {!isSubmitting && !submissionConfirmed && (
                  <button
                    onClick={() => setShowSubmissionPopup(false)}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {submissionConfirmed ? (
                  // Success Message
                  <div className="text-center py-6">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 size={40} className="text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Successfully Submitted!</h3>
                    <p className="text-slate-400 mb-4">Your lab has been submitted for grading.</p>
                    <div className="bg-slate-800 rounded-xl p-4 mb-6">
                      <div className="text-3xl font-bold text-indigo-400">
                        {(taskScores.reduce((acc, t) => acc + t.score, 0) / taskScores.length).toFixed(1)}/10
                      </div>
                      <div className="text-slate-500 text-sm">Overall Score</div>
                    </div>
                    <button
                      onClick={() => navigate(-1)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                ) : (
                  // Task Scores List
                  <>
                    <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                      {taskScores.map((task, idx) => (
                        <div
                          key={task.taskId}
                          className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                task.passed ? 'bg-green-500/20' : 'bg-red-500/20'
                              }`}>
                                {task.passed ? (
                                  <CheckCircle2 size={16} className="text-green-400" />
                                ) : (
                                  <XCircle size={16} className="text-red-400" />
                                )}
                              </div>
                              <div>
                                <div className="text-white font-semibold text-sm">
                                  Task {idx + 1}: {task.taskTitle}
                                </div>
                                <div className="text-slate-500 text-xs">
                                  {task.taskMarks} marks
                                </div>
                              </div>
                            </div>
                            <div className={`text-xl font-bold ${
                              task.score >= 7 ? 'text-green-400' : task.score >= 5 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {task.score}/10
                            </div>
                          </div>
                          {task.error && (
                            <div className="mt-2 text-xs text-red-400 bg-red-500/10 rounded-lg p-2">
                              {task.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Overall Score */}
                    <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-xl p-4 border border-indigo-500/30 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-semibold">Overall Score</span>
                        <span className="text-2xl font-bold text-indigo-400">
                          {(taskScores.reduce((acc, t) => acc + t.score, 0) / taskScores.length).toFixed(1)}/10
                        </span>
                      </div>
                    </div>

                    {/* Confirm Button */}
                    <button
                      onClick={handleConfirmSubmission}
                      disabled={isSubmitting}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Confirm Submission
                        </>
                      )}
                    </button>

                    <p className="text-center text-slate-500 text-xs mt-3">
                      This will finalize your submission. You cannot modify it after confirmation.
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submitting Evaluation Overlay */}
      <AnimatePresence>
        {isSubmitting && !showSubmissionPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          >
            <div className="bg-[#1E293B] rounded-2xl p-8 text-center border border-slate-700">
              <Loader2 size={48} className="animate-spin text-indigo-400 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">Evaluating Your Code</h3>
              <p className="text-slate-400">Please wait while we check all tasks...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Wrapper component that passes preloaded data
export const LabSessionWithData = ({ labData }) => {
  return <LabSession preloadedData={labData} />;
};

export default LabSession;