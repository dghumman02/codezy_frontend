import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Play, CheckCircle2, XCircle, Info,
  AlertTriangle, Terminal, Target, ShieldCheck,
  Send, Loader2, Award, X, Star, Zap, Trophy, TrendingUp,
  Monitor, Eye, Code2
} from 'lucide-react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import HtmlPreview from '../StudentDashboard/HtmlPreview';

/** Recursive display for nesting constraint tree */
const NestingTreeDisplay = ({ node, depth }) => {
  const depthColors = ['border-cyan-500/30', 'border-emerald-500/30', 'border-amber-500/30', 'border-purple-500/30', 'border-rose-500/30'];
  const color = depthColors[depth % depthColors.length];
  return (
    <div className={`border-l-2 ${color} pl-3 ${depth > 0 ? 'ml-2 mt-2' : ''}`}>
      <div className="flex items-center gap-2 py-1">
        <span className="text-sm font-mono font-bold text-cyan-300">&lt;{node.tag}&gt;</span>
        <span className="text-[9px] text-slate-500">min: {node.minCount ?? 1}</span>
      </div>
      {node.message && <p className="text-[9px] text-slate-600 mb-1">{node.message}</p>}
      {node.children?.map((child, i) => (
        <NestingTreeDisplay key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  );
};

const HTML_STARTER_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Page</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
    </style>
</head>
<body>
    <h1>Hello World</h1>
</body>
</html>`;

const LearnerLabSession = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Lab data passed via router state
  const lesson = location.state?.lesson;
  const courseTitle = location.state?.courseTitle || 'Course';
  const labConfig = lesson?.labConfig;

  const [activeTab, setActiveTab] = useState('problem'); // 'problem' or 'testcases'
  const [selectedLanguage, setSelectedLanguage] = useState(labConfig?.language === 'nodejs' ? 'javascript' : (labConfig?.language || 'python'));
  const [code, setCode] = useState(labConfig?.code || (labConfig?.language === 'html' ? HTML_STARTER_CODE : ''));
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [outputTab, setOutputTab] = useState('preview');

  // Submission states
  const [showSubmissionPopup, setShowSubmissionPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  
  // New states for gamification
  const [submissionConfirmed, setSubmissionConfirmed] = useState(false);
  const [isProcessingGamification, setIsProcessingGamification] = useState(false);
  const [gamificationResult, setGamificationResult] = useState(null);

  if (!lesson || !labConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-4">
        <div className="bg-[#1E293B] rounded-2xl p-8 max-w-md w-full text-center border border-slate-700 shadow-xl">
          <AlertTriangle size={40} className="text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-3">No Lab Data</h2>
          <p className="text-slate-400 mb-6">Lab configuration was not found. Please go back and try again.</p>
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

  const testCases = labConfig.testCases || [];
  const constraints = labConfig.codeConstraints || [];
  const htmlRequiredTags = labConfig.htmlRequiredTags || [];
  const htmlNestingConstraints = labConfig.htmlNestingConstraints || [];
  const isHtml = selectedLanguage === 'html';

  // Map language selection to Monaco language id
  const getMonacoLanguage = (lang) => {
    const map = { python: 'python', java: 'java', cpp: 'cpp', javascript: 'javascript', nodejs: 'javascript', html: 'html' };
    return map[lang] || lang;
  };

  // Run code against test cases
  const handleRunCode = async () => {
    if (!code || !code.trim()) {
      alert('Please write some code first!');
      return;
    }

    setIsRunning(true);
    setExecutionResult(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/code-execution/run-direct`, {
        code,
        language: selectedLanguage === 'javascript' ? 'nodejs' : selectedLanguage,
        testCases: testCases,
        codeConstraints: constraints,
        htmlRequiredTags: htmlRequiredTags,
        htmlNestingConstraints: htmlNestingConstraints
      });

      setExecutionResult(response.data);
      if (isHtml) setOutputTab('preview');
    } catch (error) {
      console.error('Execution error:', error);
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

  // Submit code for evaluation
  const handleSubmitCode = async () => {
    if (!code || !code.trim()) {
      alert('Please write some code first!');
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/code-execution/run-direct`, {
        code,
        language: selectedLanguage === 'javascript' ? 'nodejs' : selectedLanguage,
        testCases: testCases,
        codeConstraints: constraints,
        htmlRequiredTags: htmlRequiredTags,
        htmlNestingConstraints: htmlNestingConstraints
      });

      setSubmissionResult({
        score: response.data.score || 0,
        maxScore: response.data.maxScore || 10,
        passed: (response.data.score || 0) >= 7,
        testCases: response.data.testCases,
        structural: response.data.structural,
        terminal: response.data.terminal,
      });
      setShowSubmissionPopup(true);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionResult({
        score: 0,
        maxScore: 10,
        passed: false,
        error: error.response?.data?.error || error.message
      });
      setShowSubmissionPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm submission and process gamification
  const handleConfirmSubmission = async () => {
    setIsProcessingGamification(true);
    
    try {
      const learnerId = localStorage.getItem('userId');
      
      if (!learnerId) {
        console.error('No learner ID found');
        setSubmissionConfirmed(true);
        setGamificationResult(null);
        return;
      }
      
      // Run both API calls independently so one failing doesn't block the other
      let submissionResponse = null;
      let gamificationResponse = null;
      
      // First, submit to the learner-submissions API to track submissions properly
      try {
        submissionResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/learner-submissions/submit-lab`, {
          learnerId,
          courseId: location.state?.courseId || 'unknown',
          childCourseId: location.state?.childCourseId || null,
          moduleId: location.state?.moduleId || 'unknown',
          lessonId: lesson._id || lesson.id || lesson.title,
          lessonTitle: lesson.title,
          score: submissionResult?.score || 0,
          testCasesPassed: submissionResult?.testCases?.passed || 0,
          testCasesTotal: submissionResult?.testCases?.total || 0,
          code: code
        });
      } catch (subErr) {
        console.error('Lab submission tracking error:', subErr);
      }
      
      // Then call the gamification API for XP and achievements (independent of above)
      try {
        gamificationResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/learner-gamification/lab-submit`, {
          learnerId,
          labId: lesson._id || lesson.id || 'unknown',
          courseId: location.state?.courseId || 'unknown',
          score: submissionResult?.score || 0,
          difficulty: labConfig?.difficulty || 'Medium',
          labTitle: lesson.title
        });
      } catch (gamErr) {
        console.error('Gamification API error:', gamErr);
      }
      
      // Merge results
      if (gamificationResponse) {
        setGamificationResult({
          ...gamificationResponse.data,
          submissionData: submissionResponse?.data
        });
      } else {
        setGamificationResult(null);
      }
      setSubmissionConfirmed(true);
    } catch (error) {
      console.error('Submission/Gamification error:', error);
      // Still show confirmation but without gamification data
      setSubmissionConfirmed(true);
      setGamificationResult(null);
    } finally {
      setIsProcessingGamification(false);
    }
  };

  // Reset modal state
  const handleCloseModal = () => {
    setShowSubmissionPopup(false);
    setSubmissionConfirmed(false);
    setGamificationResult(null);
  };

  return (
    <div className="h-screen bg-[#0F172A] text-slate-300 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 bg-[#1E293B] px-6 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col border-l border-slate-700 pl-4">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{courseTitle}</span>
            <h1 className="text-sm font-black text-white leading-none uppercase">{lesson.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSubmitCode}
            disabled={isRunning || isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/20"
          >
            <Send size={14} /> Submit Solution
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Problem, Constraints & Test Cases */}
        <aside className="w-[480px] border-r border-slate-800 flex flex-col bg-[#0F172A] shrink-0">
          <div className="flex border-b border-slate-800 bg-[#1E293B]/30">
            <button onClick={() => setActiveTab('problem')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'problem' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5' : 'text-slate-500'}`}>
              Description
            </button>
            <button onClick={() => setActiveTab('testcases')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'testcases' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5' : 'text-slate-500'}`}>
              {isHtml ? 'Constraints' : 'Test Cases'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'problem' ? (
                <motion.div
                  key="problem"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  className="space-y-8"
                >
                  {/* Problem Statement */}
                  <section>
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="text-white font-bold text-lg">{lesson.title}</h2>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-400 bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                      {labConfig.problemStatement || "No problem statement provided."}
                    </p>
                  </section>

                  {/* Structural Constraints (non-HTML) */}
                  {constraints.length > 0 && !isHtml && (
                    <section className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-2">
                        <ShieldCheck size={14} /> Structural Constraints
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {constraints.map((con, cIdx) => (
                          <div key={cIdx} className={`text-xs p-3 rounded-xl border ${con.type === 'Forbidden' ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}>
                            <span className="font-bold">{con.type}:</span> {con.construct}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* HTML constraint summary */}
                  {isHtml && (htmlRequiredTags.length > 0 || htmlNestingConstraints.length > 0) && (
                    <section className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-orange-400 tracking-widest flex items-center gap-2">
                        <Code2 size={14} /> HTML Constraints
                      </h3>
                      <p className="text-xs text-slate-500">
                        {htmlRequiredTags.length} required tag rule(s) and {htmlNestingConstraints.length} nesting rule(s).
                        See the <button onClick={() => setActiveTab('testcases')} className="text-indigo-400 underline">Constraints</button> tab for details.
                      </p>
                    </section>
                  )}

                  {/* Starter Code Info */}
                  {labConfig.code && (
                    <section className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Starter Code Provided</h3>
                      <p className="text-xs text-slate-500">The editor has been pre-filled with starter code. Modify it to solve the problem.</p>
                    </section>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="testcases"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  {isHtml ? (
                    <>
                      {htmlRequiredTags.length > 0 && (
                        <section className="space-y-3">
                          <h3 className="text-[10px] font-black uppercase text-orange-400 tracking-widest">🏷️ Required Tags</h3>
                          <div className="grid grid-cols-1 gap-2">
                            {htmlRequiredTags.map((rule, i) => (
                              <div key={i} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-mono font-bold text-orange-300">&lt;{rule.tag}&gt;</span>
                                  <span className="text-[9px] font-bold text-slate-500 uppercase">
                                    {rule.maxCount > 0 ? `${rule.minCount} – ${rule.maxCount}` : `≥ ${rule.minCount}`}
                                  </span>
                                </div>
                                {rule.message && <p className="text-[10px] text-slate-500 mt-1">{rule.message}</p>}
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                      {htmlNestingConstraints.length > 0 && (
                        <section className="space-y-3">
                          <h3 className="text-[10px] font-black uppercase text-cyan-400 tracking-widest">🌳 Nesting Constraints</h3>
                          <div className="space-y-2">
                            {htmlNestingConstraints.map((node, i) => (
                              <NestingTreeDisplay key={i} node={node} depth={0} />
                            ))}
                          </div>
                        </section>
                      )}
                      {!htmlRequiredTags.length && !htmlNestingConstraints.length && (
                        <div className="text-center py-8 text-slate-600">
                          <Code2 size={32} className="mx-auto mb-3 opacity-40" />
                          <p className="text-xs">No constraints defined for this lab.</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                  <h2 className="text-white font-bold text-sm mb-4">Verification Suites</h2>
                  {testCases.length === 0 ? (
                    <p className="text-slate-500 text-sm">No test cases defined for this lab.</p>
                  ) : (
                    testCases.map((tc, i) => (
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
                    ))
                  )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* Right Panel: Editor & Execution Console */}
        <section className="flex-1 flex flex-col bg-[#111827]">
          {/* Code Editor */}
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
                <option value="html">HTML</option>
              </select>
              <div className="h-4 w-px bg-slate-800"></div>
              <Info size={14} className="text-slate-600" />
            </div>
            <Editor
              height="100%"
              language={getMonacoLanguage(selectedLanguage)}
              value={code}
              onChange={(value) => setCode(value || "")}
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

          {/* Output Panel — HTML: Preview/Console toggle, Others: Console only */}
          <div className={`${isHtml ? 'h-[320px]' : 'h-[280px]'} bg-[#020617] border-t border-slate-800 flex flex-col`}>
            <div className="flex justify-between items-center px-6 py-3 border-b border-slate-800 bg-slate-900/30">
              {isHtml ? (
                <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setOutputTab('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                      outputTab === 'preview' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye size={12} /> Preview
                  </button>
                  <button
                    onClick={() => setOutputTab('console')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                      outputTab === 'console' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Terminal size={12} /> Console
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Terminal size={14} /> Results Console
                </div>
              )}
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-6 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
              >
                {isRunning ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Running...
                  </>
                ) : (
                  <>
                    <Play size={12} fill="currentColor" /> Run Code
                  </>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              {isHtml && outputTab === 'preview' ? (
                <HtmlPreview htmlCode={executionResult ? code : null} autoRefresh={false} />
              ) : (
                <div className="h-full p-6 font-mono text-xs overflow-y-auto space-y-4 custom-scrollbar">
                  {!executionResult && !isRunning && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <span className="animate-pulse">●</span>
                      <span className="uppercase text-[10px] font-bold tracking-widest">Waiting for execution...</span>
                    </div>
                  )}

                  {isRunning && (
                    <div className="flex items-center gap-3 text-indigo-400">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="uppercase text-[10px] font-bold tracking-widest">
                        {isHtml ? 'Evaluating HTML...' : 'Executing code...'}
                      </span>
                    </div>
                  )}

                  {executionResult && (
                    <div className="space-y-4">
                      <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Score</span>
                          <span className={`text-2xl font-bold ${executionResult.score >= 7 ? 'text-green-400' : executionResult.score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {executionResult.score}/{executionResult.maxScore}
                          </span>
                        </div>
                        {isHtml && executionResult.htmlEvaluation ? (
                          <div className="text-[10px] text-slate-500 space-y-1">
                            <div>Required Tags: {executionResult.htmlEvaluation.requiredTags.passed}/{executionResult.htmlEvaluation.requiredTags.total}</div>
                            <div>Nesting Rules: {executionResult.htmlEvaluation.nestingConstraints.passed}/{executionResult.htmlEvaluation.nestingConstraints.total}</div>
                          </div>
                        ) : executionResult.testCases && executionResult.structural ? (
                          <div className="text-[10px] text-slate-500 space-y-1">
                            <div>Test Cases: {executionResult.testCases.passed}/{executionResult.testCases.total}</div>
                            <div>Structural: {executionResult.structural.passed}/{executionResult.structural.total}</div>
                          </div>
                        ) : null}
                      </div>

                      {executionResult.terminal && (
                        <div className="bg-black rounded-lg p-4 border border-slate-800">
                          <pre className="text-slate-300 whitespace-pre-wrap text-[10px] leading-relaxed">
                            {executionResult.terminal}
                          </pre>
                        </div>
                      )}

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
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Submission Result Popup - Two Phase Modal */}
      <AnimatePresence>
        {showSubmissionPopup && submissionResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => !isProcessingGamification && !submissionConfirmed && handleCloseModal()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1E293B] rounded-2xl max-w-md w-full shadow-2xl border border-slate-700 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between sticky top-0">
                <div className="flex items-center gap-3">
                  {submissionConfirmed ? <Trophy className="text-yellow-300" size={24} /> : <Award className="text-white" size={24} />}
                  <h2 className="text-white font-bold text-lg">
                    {submissionConfirmed ? 'Submission Complete!' : 'Evaluation Results'}
                  </h2>
                </div>
                {!submissionConfirmed && !isProcessingGamification && (
                  <button
                    onClick={handleCloseModal}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {!submissionConfirmed ? (
                  /* Phase 1: Show Evaluation Results */
                  <>
                    {/* Score */}
                    <div className="text-center py-4">
                      <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${submissionResult.passed ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {submissionResult.passed ? (
                          <CheckCircle2 size={48} className="text-green-400" />
                        ) : (
                          <XCircle size={48} className="text-red-400" />
                        )}
                      </div>
                      <div className={`text-4xl font-bold mb-2 ${submissionResult.score >= 7 ? 'text-green-400' : submissionResult.score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {submissionResult.score}/{submissionResult.maxScore}
                      </div>
                      <p className="text-slate-400">
                        {submissionResult.passed ? 'Great work! You passed this lab.' : 'Keep trying! Review the problem and try again.'}
                      </p>
                    </div>

                    {/* Breakdown */}
                    {submissionResult.testCases && (
                      <div className="bg-slate-800/50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Test Cases Passed</span>
                          <span className="text-white font-bold">{submissionResult.testCases.passed}/{submissionResult.testCases.total}</span>
                        </div>
                        {submissionResult.structural && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Structural Checks</span>
                            <span className="text-white font-bold">{submissionResult.structural.passed}/{submissionResult.structural.total}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {submissionResult.error && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                        <p className="text-red-400 text-xs">{submissionResult.error}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleCloseModal}
                        disabled={isProcessingGamification}
                        className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold text-sm hover:bg-slate-600 transition-colors disabled:opacity-50"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={handleConfirmSubmission}
                        disabled={isProcessingGamification}
                        className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isProcessingGamification ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            Confirm Submission
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  /* Phase 2: Show XP, Badges, and Progress */
                  <>
                    {/* Score Summary */}
                    <div className="text-center">
                      <div className={`w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center ${submissionResult.passed ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                        {submissionResult.passed ? (
                          <CheckCircle2 size={40} className="text-green-400" />
                        ) : (
                          <AlertTriangle size={40} className="text-amber-400" />
                        )}
                      </div>
                      <div className={`text-3xl font-bold mb-1 ${submissionResult.score >= 7 ? 'text-green-400' : 'text-amber-400'}`}>
                        {submissionResult.score}/{submissionResult.maxScore}
                      </div>
                    </div>

                    {/* XP Earned Section */}
                    {gamificationResult && (
                      <>
                        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-xl p-4 border border-indigo-500/20">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-300 font-medium flex items-center gap-2">
                              <Zap className="text-yellow-400" size={18} />
                              XP Earned
                            </span>
                            <span className="text-2xl font-black text-yellow-400">+{gamificationResult.xpGained} XP</span>
                          </div>
                          
                          {/* XP Breakdown */}
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-slate-400">
                              <span>Base XP ({submissionResult.score >= 10 ? 'Perfect' : submissionResult.score >= 8.5 ? 'High Score' : 'Passed'})</span>
                              <span className="text-white">+{gamificationResult.breakdown?.baseXp || 0}</span>
                            </div>
                            {gamificationResult.breakdown?.streakBonus > 0 && (
                              <div className="flex justify-between text-slate-400">
                                <span>🔥 Streak Bonus ({gamificationResult.streak?.current || 0} days)</span>
                                <span className="text-orange-400">+{gamificationResult.breakdown.streakBonus}</span>
                              </div>
                            )}
                            {gamificationResult.breakdown?.achievementBonus > 0 && (
                              <div className="flex justify-between text-slate-400">
                                <span>🏆 Achievement Bonus</span>
                                <span className="text-purple-400">+{gamificationResult.breakdown.achievementBonus}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between">
                            <span className="text-slate-300">Total XP</span>
                            <span className="text-white font-bold">{gamificationResult.totalXp || 0} XP</span>
                          </div>
                        </div>

                        {/* Badges Unlocked */}
                        {gamificationResult.newAchievements && gamificationResult.newAchievements.length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-white font-bold flex items-center gap-2">
                              <Trophy className="text-yellow-400" size={18} />
                              Badges Unlocked!
                            </h3>
                            <div className="space-y-2">
                              {gamificationResult.newAchievements.map((achievement, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-center gap-3"
                                >
                                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center text-2xl">
                                    {achievement.icon || '🏆'}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-white font-bold text-sm">{achievement.title}</p>
                                    <p className="text-slate-400 text-xs">{achievement.description}</p>
                                  </div>
                                  <div className="text-yellow-400 font-bold text-sm">
                                    +{achievement.xpAwarded} XP
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Badge Progress */}
                        {gamificationResult.badgeProgress && gamificationResult.badgeProgress.filter(b => b.status === 'in-progress').length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-white font-bold flex items-center gap-2">
                              <TrendingUp className="text-blue-400" size={18} />
                              Badge Progress
                            </h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {gamificationResult.badgeProgress
                                .filter(badge => badge.status === 'in-progress')
                                .slice(0, 4)
                                .map((badge, idx) => (
                                  <div key={idx} className="bg-slate-800/50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">{badge.icon || '🎯'}</span>
                                        <span className="text-white text-sm font-medium">{badge.title}</span>
                                      </div>
                                      <span className="text-slate-400 text-xs">{badge.current}/{badge.target}</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-2">
                                      <div
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                                        style={{ width: `${badge.percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Streak Info */}
                        {gamificationResult.streak?.current > 0 && (
                          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex items-center justify-between">
                            <span className="text-slate-300 flex items-center gap-2">
                              🔥 Learning Streak
                            </span>
                            <span className="text-orange-400 font-bold">{gamificationResult.streak.current} days</span>
                          </div>
                        )}
                      </>
                    )}

                    {/* No gamification data fallback */}
                    {!gamificationResult && (
                      <div className="text-center py-4">
                        <p className="text-slate-400">Lab submitted successfully!</p>
                      </div>
                    )}

                    {/* OK Button */}
                    <button
                      onClick={() => navigate(-1)}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-sm hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={18} />
                      OK - Back to Course
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submitting Overlay */}
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
              <p className="text-slate-400">Please wait while we run the test cases...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LearnerLabSession;
