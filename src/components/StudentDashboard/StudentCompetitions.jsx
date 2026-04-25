import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Calendar, Clock, Code2, Zap, CheckCircle2, Lock, AlertCircle, BarChart2, X, Medal } from 'lucide-react';
import Navbar from './Navbar';

const LANG_ICONS = {
    python: '🐍',
    java: '☕',
    cpp: '⚡',
    html: '🌐',
};

const DIFFICULTY_COLORS = {
    Easy: 'bg-emerald-100 text-emerald-700',
    Medium: 'bg-amber-100 text-amber-700',
    Hard: 'bg-red-100 text-red-700',
};

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
};

const getCompetitionStatus = (comp) => {
    const now = new Date();
    const start = new Date(comp.startDate);
    const due = new Date(comp.dueDate);
    if (now < start) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700', icon: <Clock size={13} /> };
    if (now > due) return { label: 'Ended', color: 'bg-gray-100 text-gray-600', icon: <AlertCircle size={13} /> };
    return { label: 'Live', color: 'bg-green-100 text-green-700 font-semibold', icon: <Zap size={13} /> };
};

const CompetitionCard = ({ comp, onClick, onLeaderboard }) => {
    const status = getCompetitionStatus(comp);
    const langIcon = LANG_ICONS[comp.language] || '💻';
    const diffColor = DIFFICULTY_COLORS[comp.difficulty] || 'bg-gray-100 text-gray-700';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -8px rgba(99,102,241,0.15)' }}
            transition={{ duration: 0.3 }}
            onClick={onClick}
            className={`bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 ${comp.hasSubmitted ? 'ring-2 ring-emerald-300' : ''}`}
        >
            {/* Top accent bar */}
            <div className={`h-2 w-full bg-gradient-to-r ${comp.hasSubmitted ? 'from-emerald-400 to-teal-500' : 'from-indigo-500 to-purple-500'}`} />

            <div className="p-6">
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{langIcon}</span>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg leading-tight">{comp.title}</h3>
                            {comp.isPlatformCompetition && (
                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                    🌐 Global Competition
                                </span>
                            )}
                            {!comp.isPlatformCompetition && comp.eligibility?.courseName && (
                                <p className="text-xs text-indigo-500 font-medium mt-0.5">{comp.eligibility.courseName}</p>
                            )}
                        </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.color}`}>
                        {status.icon}
                        {status.label}
                    </div>
                </div>

                {/* Description */}
                {comp.description && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{comp.description}</p>
                )}

                {/* Meta chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${diffColor}`}>{comp.difficulty}</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        <Code2 size={10} className="inline mr-1" />{comp.language?.toUpperCase()}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                        {comp.totalMarks} marks
                    </span>
                </div>

                {/* Dates */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-green-500" />
                        <span>Starts: <span className="font-medium text-gray-700">{formatDate(comp.startDate)}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-rose-500" />
                        <span>Due: <span className="font-medium text-gray-700">{formatDate(comp.dueDate)}</span></span>
                    </div>
                </div>

                {/* Submission status */}
                {comp.hasSubmitted && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-2 rounded-xl">
                        <CheckCircle2 size={14} />
                        Submitted – Score: {comp.myScore ?? '–'}%
                    </div>
                )}

                {/* Leaderboard button */}
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onLeaderboard(comp); }}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                >
                    <BarChart2 size={13} /> View Leaderboard
                </button>
            </div>
        </motion.div>
    );
};

/* ── Leaderboard Modal ─────────────────────────────────────── */
const rankColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
const rankBg = ['bg-yellow-50 border-yellow-200', 'bg-gray-50 border-gray-200', 'bg-amber-50 border-amber-200'];

const LeaderboardModal = ({ comp, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const url = comp.isPlatformCompetition
            ? `${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/platform-competitions/${comp._id}/leaderboard`
            : `${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/competitions/${comp._id}/leaderboard`;

        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => { setError('Failed to load leaderboard.'); setLoading(false); });
    }, [comp._id, comp.isPlatformCompetition]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
                >
                    {/* Modal header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-500 to-purple-500">
                        <div className="flex items-center gap-2 text-white">
                            <Trophy size={20} />
                            <div>
                                <p className="font-black text-base leading-tight">{comp.title}</p>
                                <p className="text-xs text-indigo-100">Leaderboard</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Modal body */}
                    <div className="overflow-y-auto flex-1 px-6 py-4">
                        {loading && (
                            <div className="flex items-center justify-center py-16">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" />
                            </div>
                        )}
                        {error && <p className="text-center text-red-500 py-8">{error}</p>}
                        {data && (
                            <>
                                <p className="text-xs text-gray-400 mb-4 text-center">
                                    {data.totalParticipants} participant{data.totalParticipants !== 1 ? 's' : ''} submitted
                                </p>
                                {data.leaderboard.length === 0 ? (
                                    <div className="text-center py-12">
                                        <BarChart2 size={40} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-gray-400 text-sm">No submissions yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {comp.isPlatformCompetition && (
                                            <div className="grid grid-cols-12 text-xs font-bold text-gray-400 px-4 pb-1">
                                                <span className="col-span-1">#</span>
                                                <span className="col-span-4">Name</span>
                                                <span className="col-span-3">Institution</span>
                                                <span className="col-span-2 text-right">XP</span>
                                                <span className="col-span-2 text-right">Score</span>
                                            </div>
                                        )}
                                        {data.leaderboard.map((entry) => (
                                            <div
                                                key={entry.rank}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                                                    entry.rank <= 3 ? rankBg[entry.rank - 1] : 'bg-gray-50 border-gray-100'
                                                }`}
                                            >
                                                <span className={`text-lg font-black w-7 text-center shrink-0 ${
                                                    entry.rank <= 3 ? rankColors[entry.rank - 1] : 'text-gray-400'
                                                }`}>
                                                    {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank - 1] : `#${entry.rank}`}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-800 text-sm truncate">
                                                        {entry.participantName || entry.studentName}
                                                    </p>
                                                    {entry.rollNumber && (
                                                        <p className="text-xs text-gray-400">{entry.rollNumber}</p>
                                                    )}
                                                    {entry.institutionLabel && (
                                                        <span className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${
                                                            entry.institutionLabel === 'Individual Learner'
                                                                ? 'bg-purple-50 text-purple-600'
                                                                : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                            {entry.institutionLabel === 'Individual Learner' ? '🎓 Individual' : `🏢 ${entry.institutionLabel}`}
                                                        </span>
                                                    )}
                                                </div>
                                                {entry.xp !== undefined && (
                                                    <span className="text-xs font-bold text-amber-600 shrink-0">{entry.xp} XP</span>
                                                )}
                                                <div className="text-right shrink-0">
                                                    <p className="font-black text-indigo-600 text-sm">{entry.score}%</p>
                                                    <p className="text-xs text-gray-400">{entry.earnedMarks}/{entry.totalMarks} marks</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const StudentCompetitions = () => {
    const studentId = localStorage.getItem('userId');
    const studentName = localStorage.getItem('fullName') || 'Student';
    const navigate = useNavigate();

    const [competitions, setCompetitions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [leaderboardComp, setLeaderboardComp] = useState(null);

    useEffect(() => {
        if (!studentId) { navigate('/login'); return; }

        const fetchCompetitions = async () => {
            try {
                const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
                const [instRes, platformRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/competitions/student/${studentId}`, { headers }),
                    fetch(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/platform-competitions/student`, { headers })
                ]);
                const instData = await instRes.json();
                const platformData = await platformRes.json();
                const instComps = Array.isArray(instData) ? instData : [];
                const platformComps = Array.isArray(platformData)
                    ? platformData.map(c => ({ ...c, isPlatformCompetition: true }))
                    : [];
                setCompetitions([...instComps, ...platformComps]);
            } catch (err) {
                console.error('Error fetching competitions:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompetitions();
    }, [studentId, navigate]);

    const filtered = competitions.filter(comp => {
        const now = new Date();
        const start = new Date(comp.startDate);
        const due = new Date(comp.dueDate);
        if (filter === 'Live') return now >= start && now <= due;
        if (filter === 'Upcoming') return now < start;
        if (filter === 'Ended') return now > due;
        if (filter === 'Submitted') return comp.hasSubmitted;
        return true;
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FD] font-sans">
            <Navbar studentName={studentName} />
            {leaderboardComp && (
                <LeaderboardModal comp={leaderboardComp} onClose={() => setLeaderboardComp(null)} />
            )}

            <div className="max-w-7xl mx-auto px-6 py-10">
                {/* Header */}
                <header className="mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900 flex items-center gap-3">
                        <Trophy size={36} className="text-yellow-500" /> Competitions
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">Participate in institution-wide coding challenges and climb the leaderboard.</p>
                </header>

                {/* Filter tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {['All', 'Live', 'Upcoming', 'Ended', 'Submitted'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${filter === f ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-400'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {filtered.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
                        <Trophy size={56} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-500">No competitions found</h3>
                        <p className="text-gray-400 mt-2">Check back later for new competitions from your institution.</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(comp => {
                            const now = new Date();
                            const start = new Date(comp.startDate);
                            const isUpcoming = now < start;
                            return (
                                <CompetitionCard
                                    key={comp._id}
                                    comp={comp}
                                    onLeaderboard={(c) => setLeaderboardComp(c)}
                                    onClick={() => {
                                        if (isUpcoming) return;
                                        if (comp.isPlatformCompetition) {
                                            navigate(`/platform-competitions/${comp._id}`);
                                        } else {
                                            navigate(`/student/competitions/${comp._id}`);
                                        }
                                    }}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentCompetitions;
