import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Play, CheckCircle2, XCircle, Terminal, Clock, Target,
    ShieldCheck, Send, Layers, Loader2, Trophy, X, Medal, Users
} from 'lucide-react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import HtmlPreview from '../StudentDashboard/HtmlPreview';

/* ─── helpers ─────────────────────────────────────────────── */
const LANG_MONACO = { python: 'python', java: 'java', cpp: 'cpp', html: 'html' };
const HTML_STARTER = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Page</title>
    <style>body { font-family: Arial, sans-serif; margin: 20px; }</style>
</head>
<body>
    <h1>Hello World</h1>
</body>
</html>`;

const checkTimeAccess = (comp) => {
    const now = new Date();
    const start = new Date(comp.startDate);
    const due = new Date(comp.dueDate);
    if (now < start) return {
        canAccess: false,
        reason: 'not_started',
        message: `Competition hasn't started yet. Available from ${start.toLocaleDateString()}.`
    };
    if (now > due) return {
        canAccess: false,
        reason: 'expired',
        message: `Competition ended on ${due.toLocaleDateString()}.`
    };
    return { canAccess: true };
};

/* ─── Main Component ──────────────────────────────────────── */
const LearnerCompetitionSession = () => {
    const { competitionId } = useParams();
    const navigate = useNavigate();
    const learnerId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('role');
    const isStudent = userRole === 'student';
    const backUrl = isStudent ? '/student/competitions' : '/learner/competitions';
    const submitEndpoint = isStudent
        ? `${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/platform-competitions/${competitionId}/student-submit`
        : `${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/platform-competitions/${competitionId}/learner-submit`;

    const [compData, setCompData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [accessError, setAccessError] = useState(null);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);

    const [activeTaskIndex, setActiveTaskIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('problem');
    const [taskCodes, setTaskCodes] = useState({});
    const [outputTab, setOutputTab] = useState('console');

    const [isRunning, setIsRunning] = useState(false);
    const [runResult, setRunResult] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [taskScores, setTaskScores] = useState([]);
    const [submitResult, setSubmitResult] = useState(null);

    /* ─── fetch competition ─── */
    useEffect(() => {
        if (!learnerId) { navigate('/login'); return; }
        if (!competitionId) { navigate(-1); return; }

        axios.get(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/platform-competitions/${competitionId}/learner-view`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(r => {
                const comp = r.data;
                const access = checkTimeAccess(comp);
                if (!access.canAccess) {
                    setAccessError(access);
                    setIsLoading(false);
                    return;
                }

                if (comp.hasSubmitted && comp.mySubmission) {
                    setAlreadySubmitted(true);
                    setSubmitResult(comp.mySubmission);
                }

                setCompData(comp);
                const initialCodes = {};
                (comp.tasks || []).forEach(t => {
                    initialCodes[t._id] = comp.language === 'html' ? HTML_STARTER : '';
                });
                setTaskCodes(initialCodes);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [competitionId, learnerId, navigate]);

    const currentTask = compData?.tasks?.[activeTaskIndex];
    const language = compData?.language || 'python';

    /* ─── run code ─── */
    const handleRun = async () => {
        if (!currentTask) return;
        const code = taskCodes[currentTask._id];
        if (!code?.trim()) { alert('Please write some code first!'); return; }

        setIsRunning(true);
        setRunResult(null);
        try {
            const r = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/platform-competitions/${competitionId}/run`,
                { taskId: currentTask._id, code, language },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setRunResult(r.data);
            if (language === 'html') setOutputTab('preview');
        } catch (err) {
            setRunResult({
                success: false,
                error: err.response?.data?.message || err.message,
                terminal: `Error: ${err.message}`,
                score: 0
            });
        } finally {
            setIsRunning(false);
        }
    };

    /* ─── evaluate all tasks then show confirm modal ─── */
    const handlePrepareSubmit = async () => {
        if (!compData) return;
        const empty = compData.tasks.filter(t => !taskCodes[t._id]?.trim());
        if (empty.length > 0) {
            alert(`Please write code for all tasks. Missing: ${empty.map(t => t.title).join(', ')}`);
            return;
        }

        setIsSubmitting(true);
        setTaskScores([]);
        const scores = [];
        for (const task of compData.tasks) {
            try {
                const r = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/platform-competitions/${competitionId}/run`,
                    { taskId: task._id, code: taskCodes[task._id], language },
                    { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                );
                scores.push({
                    taskId: task._id,
                    taskTitle: task.title,
                    taskMarks: task.marks,
                    score: r.data.score || 0
                });
            } catch {
                scores.push({ taskId: task._id, taskTitle: task.title, taskMarks: task.marks, score: 0 });
            }
        }
        setTaskScores(scores);
        setIsSubmitting(false);
        setShowSubmitConfirm(true);
    };

    /* ─── confirm final submission ─── */
    const handleConfirmSubmit = async () => {
        setIsSubmitting(true);
        try {
            const r = await axios.post(
                submitEndpoint,
                {
                    taskSubmissions: compData.tasks.map(t => ({
                        taskId: t._id,
                        code: taskCodes[t._id],
                        score: taskScores.find(s => s.taskId === t._id)?.score || 0
                    }))
                },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setSubmitResult(r.data);
            setAlreadySubmitted(true);
            setShowSubmitConfirm(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Submission failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ─── loading / access error ─── */
    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
            <Loader2 className="animate-spin text-purple-400" size={40} />
        </div>
    );

    if (accessError) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-4">
            <div className="bg-[#1E293B] rounded-2xl p-8 max-w-md w-full text-center border border-slate-700">
                <Trophy size={48} className="mx-auto text-slate-600 mb-4" />
                <h2 className="text-xl font-bold text-slate-300 mb-2">
                    {accessError.reason === 'not_started' ? 'Competition Not Yet Open' : 'Competition Ended'}
                </h2>
                <p className="text-slate-500 mb-6">{accessError.message}</p>
                <button
                    onClick={() => navigate(backUrl)}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                    <ChevronLeft size={18} /> Back to Competitions
                </button>
            </div>
        </div>
    );

    /* ─── already submitted ─── */
    if (alreadySubmitted && submitResult) return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#1E293B] rounded-2xl p-8 max-w-md w-full border border-slate-700 text-center shadow-2xl"
            >
                <CheckCircle2 size={56} className="text-emerald-400 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-white mb-2">Submission Complete!</h2>
                <p className="text-slate-400 mb-6">Your solution has been recorded.</p>
                <div className="bg-slate-900 rounded-xl p-5 mb-6 border border-slate-800">
                    <div className="text-4xl font-black text-purple-400 mb-1">{submitResult.score}%</div>
                    <div className="text-sm text-slate-500">
                        {submitResult.earnedMarks} / {submitResult.totalMarks} marks
                    </div>
                </div>
                <button
                    onClick={() => navigate(backUrl)}
                    className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                    <ChevronLeft size={16} /> Back to Competitions
                </button>
            </motion.div>
        </div>
    );

    /* ─── main session UI ─── */
    return (
        <div className="h-screen bg-[#0F172A] text-slate-300 flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b border-slate-800 bg-[#1E293B] px-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(backUrl)}
                        className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex flex-col border-l border-slate-700 pl-4">
                        <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1">
                            <Trophy size={10} /> Platform Competition
                        </span>
                        <h1 className="text-sm font-black text-white leading-none">{compData?.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 text-xs font-bold">
                        <Target size={14} className="text-emerald-500" />
                        <span>{compData?.totalMarks} marks</span>
                    </div>
                    <button
                        onClick={handlePrepareSubmit}
                        disabled={isRunning || isSubmitting}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
                    >
                        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        Submit
                    </button>
                </div>
            </header>

            {/* Task switcher */}
            <div className="h-10 bg-[#1E293B]/50 border-b border-slate-800 flex items-center px-4 gap-2">
                <div className="flex items-center gap-2 px-3 border-r border-slate-700 mr-2">
                    <Layers size={14} className="text-slate-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase">Tasks</span>
                </div>
                {compData?.tasks.map((task, idx) => (
                    <button
                        key={task._id}
                        onClick={() => { setActiveTaskIndex(idx); setRunResult(null); }}
                        className={`px-4 h-full text-[10px] font-black uppercase tracking-widest transition-all
                            ${activeTaskIndex === idx
                                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-400/5'
                                : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        {idx + 1}. {task.title}
                    </button>
                ))}
            </div>

            <main className="flex-1 flex overflow-hidden">
                {/* LEFT: Problem panel */}
                <aside className="w-[420px] border-r border-slate-800 flex flex-col bg-[#0F172A] shrink-0">
                    <div className="flex border-b border-slate-800 bg-[#1E293B]/30">
                        <button
                            onClick={() => setActiveTab('problem')}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all
                                ${activeTab === 'problem'
                                    ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-400/5'
                                    : 'text-slate-500'}`}
                        >
                            Description
                        </button>
                        <button
                            onClick={() => setActiveTab('constraints')}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all
                                ${activeTab === 'constraints'
                                    ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-400/5'
                                    : 'text-slate-500'}`}
                        >
                            Constraints
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        <AnimatePresence mode="wait">
                            {activeTab === 'problem' ? (
                                <motion.div key={`prob-${activeTaskIndex}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <div className="flex justify-between items-center mb-3">
                                        <h2 className="text-white font-bold text-base">{currentTask?.title}</h2>
                                        <span className="text-[10px] font-bold bg-purple-500/10 px-2 py-1 rounded text-purple-400">
                                            {currentTask?.marks} pts
                                        </span>
                                    </div>
                                    <p className="text-sm leading-relaxed text-slate-400 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                                        {currentTask?.description || 'No description provided.'}
                                    </p>
                                    {compData?.instructions && (
                                        <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                            <p className="text-[10px] font-black text-amber-400 uppercase mb-2">Instructions</p>
                                            <p className="text-xs text-slate-400 whitespace-pre-wrap">{compData.instructions}</p>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key={`con-${activeTaskIndex}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {currentTask?.codeConstraints?.length > 0 && (
                                        <section className="space-y-2 mb-6">
                                            <h3 className="text-[10px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-2">
                                                <ShieldCheck size={14} /> Code Constraints
                                            </h3>
                                            {currentTask.codeConstraints.map((con, i) => (
                                                <div
                                                    key={i}
                                                    className={`text-xs p-3 rounded-xl border
                                                        ${con.type === 'Forbidden'
                                                            ? 'bg-rose-500/5 border-rose-500/20 text-rose-400'
                                                            : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}
                                                >
                                                    <span className="font-bold">{con.type}:</span> {con.construct}
                                                </div>
                                            ))}
                                        </section>
                                    )}

                                    {currentTask?.testCases?.filter(tc => !tc.isHidden).length > 0 && (
                                        <section className="space-y-3">
                                            <h3 className="text-[10px] font-black uppercase text-cyan-400 tracking-widest">
                                                Sample Test Cases
                                            </h3>
                                            {currentTask.testCases.filter(tc => !tc.isHidden).map((tc, i) => (
                                                <div key={i} className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-2">
                                                    <p className="text-[10px] font-bold text-slate-500">Test #{i + 1}</p>
                                                    {tc.input && (
                                                        <div>
                                                            <p className="text-[10px] text-slate-600 uppercase mb-1">Input</p>
                                                            <pre className="text-xs font-mono text-slate-300 bg-black/30 px-3 py-2 rounded">{tc.input}</pre>
                                                        </div>
                                                    )}
                                                    {tc.expectedOutput && (
                                                        <div>
                                                            <p className="text-[10px] text-slate-600 uppercase mb-1">Expected</p>
                                                            <pre className="text-xs font-mono text-emerald-400 bg-black/30 px-3 py-2 rounded">{tc.expectedOutput}</pre>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </section>
                                    )}

                                    {(!currentTask?.codeConstraints?.length && !currentTask?.testCases?.filter(tc => !tc.isHidden).length) && (
                                        <p className="text-slate-500 text-sm text-center py-8">
                                            No public constraints or test cases for this task.
                                        </p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </aside>

                {/* RIGHT: Editor + Output */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Language badge */}
                    <div className="h-9 bg-[#1E293B]/50 border-b border-slate-800 flex items-center px-4 gap-3">
                        <span className="text-[10px] font-black uppercase text-slate-500">Language:</span>
                        <span className="text-[10px] font-black text-purple-400 uppercase">{language}</span>
                    </div>

                    {/* Monaco Editor */}
                    <div className="flex-1 overflow-hidden">
                        <Editor
                            height="100%"
                            language={LANG_MONACO[language] || 'python'}
                            theme="vs-dark"
                            value={currentTask ? (taskCodes[currentTask._id] ?? '') : ''}
                            onChange={(val) => {
                                if (currentTask) {
                                    setTaskCodes(prev => ({ ...prev, [currentTask._id]: val || '' }));
                                }
                            }}
                            options={{
                                fontSize: 14,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                wordWrap: 'on'
                            }}
                        />
                    </div>

                    {/* Output panel */}
                    <div className="h-52 border-t border-slate-800 bg-[#0F172A] flex flex-col">
                        <div className="h-9 flex items-center justify-between px-4 border-b border-slate-800 bg-[#1E293B]/30 shrink-0">
                            <div className="flex gap-1">
                                {language === 'html' && (
                                    <button
                                        onClick={() => setOutputTab('preview')}
                                        className={`px-3 h-full text-[10px] font-black uppercase tracking-widest
                                            ${outputTab === 'preview' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500'}`}
                                    >
                                        Preview
                                    </button>
                                )}
                                <button
                                    onClick={() => setOutputTab('console')}
                                    className={`px-3 h-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5
                                        ${outputTab === 'console' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500'}`}
                                >
                                    <Terminal size={11} /> Console
                                </button>
                            </div>
                            <button
                                onClick={handleRun}
                                disabled={isRunning}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white px-4 py-1 rounded-lg text-xs font-bold transition-all"
                            >
                                {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} Run
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
                            {outputTab === 'preview' && runResult && language === 'html' ? (
                                <HtmlPreview code={currentTask ? taskCodes[currentTask._id] : ''} />
                            ) : runResult ? (
                                <div className="space-y-2">
                                    {runResult.error ? (
                                        <p className="text-red-400">{runResult.error}</p>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2 mb-2">
                                                {(runResult.score ?? 0) >= 7
                                                    ? <CheckCircle2 size={14} className="text-emerald-400" />
                                                    : <XCircle size={14} className="text-rose-400" />}
                                                <span className="text-slate-300 font-bold">
                                                    Score: {runResult.score?.toFixed(1) ?? 0} / 10
                                                </span>
                                            </div>
                                            {runResult.terminal && (
                                                <pre className="whitespace-pre-wrap text-slate-400 bg-black/40 p-3 rounded-lg">
                                                    {runResult.terminal}
                                                </pre>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p className="text-slate-600">
                                    Click <span className="text-emerald-400">Run</span> to execute your code.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Submit confirmation modal */}
            <AnimatePresence>
                {showSubmitConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1E293B] rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                                <h2 className="font-black text-white flex items-center gap-2">
                                    <Send size={18} className="text-purple-400" /> Review & Submit
                                </h2>
                                <button onClick={() => setShowSubmitConfirm(false)} className="text-slate-500 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="space-y-3 mb-6">
                                    {taskScores.map(ts => (
                                        <div key={ts.taskId} className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                                            <span className="text-sm text-slate-300 font-medium">{ts.taskTitle}</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-black ${ts.score >= 7 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {ts.score?.toFixed(1)}/10
                                                </span>
                                                <span className="text-[10px] text-slate-500">{ts.taskMarks} marks</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mb-5 text-center">
                                    ⚠️ You can only submit once. This cannot be undone.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowSubmitConfirm(false)}
                                        className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors"
                                    >
                                        Review Code
                                    </button>
                                    <button
                                        onClick={handleConfirmSubmit}
                                        disabled={isSubmitting}
                                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Trophy size={16} />}
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LearnerCompetitionSession;
