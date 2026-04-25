import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Plus, Trash2, Calendar, Globe, Building2, GraduationCap, X, BarChart2, Zap } from 'lucide-react';
import SuperAdminLayout from './SuperAdminLayout';

const LANG_ICONS = { python: '🐍', java: '☕', cpp: '⚡', html: '🌐' };

const DIFFICULTY_COLORS = {
    Easy: 'bg-emerald-100 text-emerald-700',
    Medium: 'bg-amber-100 text-amber-700',
    Hard: 'bg-red-100 text-red-700',
};

const getStatus = (comp) => {
    const now = new Date();
    const start = new Date(comp.startDate);
    const due = new Date(comp.dueDate);
    if (comp.status === 'Draft') return { label: 'Draft', color: 'bg-gray-100 text-gray-600' };
    if (now < start) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    if (now > due) return { label: 'Ended', color: 'bg-gray-100 text-gray-500' };
    return { label: 'Live', color: 'bg-green-100 text-green-700' };
};

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

/* ── Leaderboard Modal ───────────────────────────────── */
const rankBg = [
    'bg-yellow-50 border-yellow-200',
    'bg-gray-50 border-gray-200',
    'bg-amber-50 border-amber-200',
];
const rankColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
const rankMedals = ['🥇', '🥈', '🥉'];

const LeaderboardModal = ({ comp, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        axios
            .get(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/platform-competitions/${comp._id}/leaderboard`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(r => { setData(r.data); setLoading(false); })
            .catch(() => { setError('Failed to load leaderboard.'); setLoading(false); });
    }, [comp._id]);

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
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.92, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
                        <div className="flex items-center gap-3 text-white">
                            <Trophy size={22} />
                            <div>
                                <p className="font-black text-lg leading-tight">{comp.title}</p>
                                <p className="text-xs text-indigo-200">Global Competition • Leaderboard</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                            <X size={22} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="overflow-y-auto flex-1 px-6 py-5">
                        {loading && (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" />
                            </div>
                        )}
                        {error && <p className="text-center text-red-500 py-10">{error}</p>}
                        {data && (
                            <>
                                <p className="text-xs text-gray-400 mb-5 text-center">
                                    {data.totalParticipants} participant{data.totalParticipants !== 1 ? 's' : ''} submitted
                                </p>
                                {data.leaderboard.length === 0 ? (
                                    <div className="text-center py-16">
                                        <BarChart2 size={44} className="mx-auto text-gray-200 mb-3" />
                                        <p className="text-gray-400">No submissions yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {/* Column headers */}
                                        <div className="grid grid-cols-12 text-xs font-bold text-gray-400 px-4 pb-1">
                                            <span className="col-span-1">#</span>
                                            <span className="col-span-4">Name</span>
                                            <span className="col-span-4">Institution</span>
                                            <span className="col-span-1 text-right">XP</span>
                                            <span className="col-span-2 text-right">Score</span>
                                        </div>
                                        {data.leaderboard.map((entry) => (
                                            <div
                                                key={entry.rank}
                                                className={`grid grid-cols-12 items-center gap-1 px-4 py-3 rounded-xl border ${
                                                    entry.rank <= 3
                                                        ? rankBg[entry.rank - 1]
                                                        : 'bg-gray-50 border-gray-100'
                                                }`}
                                            >
                                                <span className={`col-span-1 text-base font-black ${
                                                    entry.rank <= 3 ? rankColors[entry.rank - 1] : 'text-gray-400'
                                                }`}>
                                                    {entry.rank <= 3 ? rankMedals[entry.rank - 1] : `#${entry.rank}`}
                                                </span>
                                                <span className="col-span-4 font-semibold text-gray-800 text-sm truncate">
                                                    {entry.participantName}
                                                </span>
                                                <span className="col-span-4 text-xs text-gray-500 truncate">
                                                    {entry.institutionLabel === 'Individual Learner' ? (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-600 font-medium">
                                                            🎓 Individual
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-medium">
                                                            🏢 {entry.institutionLabel}
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="col-span-1 text-right text-xs font-bold text-amber-600">
                                                    {entry.xp}
                                                </span>
                                                <div className="col-span-2 text-right">
                                                    <p className="font-black text-indigo-600 text-sm">{entry.score}%</p>
                                                    <p className="text-xs text-gray-400">{entry.earnedMarks}/{entry.totalMarks}</p>
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

const SuperAdminCompetitionsPage = () => {
    const navigate = useNavigate();
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [leaderboardComp, setLeaderboardComp] = useState(null);

    useEffect(() => {
        const fetchCompetitions = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/platform-competitions`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCompetitions(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error('Fetch platform competitions error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCompetitions();
    }, []);

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Delete competition "${title}"? This cannot be undone.`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/platform-competitions/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCompetitions(prev => prev.filter(c => c._id !== id));
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete competition.');
        }
    };

    const filteredList = competitions.filter(comp => {
        if (filter === 'All') return true;
        const status = getStatus(comp);
        return status.label === filter;
    });

    const counts = {
        All: competitions.length,
        Live: competitions.filter(c => getStatus(c).label === 'Live').length,
        Upcoming: competitions.filter(c => getStatus(c).label === 'Upcoming').length,
        Ended: competitions.filter(c => getStatus(c).label === 'Ended').length,
        Draft: competitions.filter(c => getStatus(c).label === 'Draft').length,
    };

    return (
        <SuperAdminLayout>
            {leaderboardComp && (
                <LeaderboardModal comp={leaderboardComp} onClose={() => setLeaderboardComp(null)} />
            )}
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                            <Trophy size={32} className="text-yellow-500" />
                            Platform Competitions
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Manage and create platform-wide coding competitions
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/superadmin-competitions/create')}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-md font-semibold"
                    >
                        <Plus size={20} />
                        Create Competition
                    </button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(counts).map(([label, count]) => (
                        <div
                            key={label}
                            onClick={() => setFilter(label)}
                            className={`cursor-pointer rounded-2xl p-4 text-center border-2 transition-all ${
                                filter === label
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-100 bg-white hover:border-indigo-300'
                            }`}
                        >
                            <p className="text-2xl font-extrabold text-gray-900">{count}</p>
                            <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
                        </div>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex justify-center py-24">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredList.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                        <Trophy size={48} className="mx-auto text-gray-200 mb-3" />
                        <p className="text-gray-400 font-semibold text-lg">No competitions found</p>
                        <p className="text-gray-400 text-sm mt-1">
                            {filter === 'All' ? 'Click "Create Competition" to get started.' : `No ${filter} competitions.`}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredList.map(comp => {
                            const status = getStatus(comp);
                            const diff = DIFFICULTY_COLORS[comp.difficulty] || 'bg-gray-100 text-gray-600';
                            return (
                                <div
                                    key={comp._id}
                                    onClick={() => setLeaderboardComp(comp)}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition-all overflow-hidden cursor-pointer"
                                >
                                    <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
                                    <div className="p-5">
                                        {/* Top row */}
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{LANG_ICONS[comp.language] || '💻'}</span>
                                                <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2">
                                                    {comp.title}
                                                </h3>
                                            </div>
                                            <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>

                                        {/* Description */}
                                        {comp.description && (
                                            <p className="text-gray-500 text-xs mb-3 line-clamp-2">{comp.description}</p>
                                        )}

                                        {/* Chips */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${diff}`}>
                                                {comp.difficulty}
                                            </span>
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                                                {comp.totalMarks} marks
                                            </span>
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 uppercase">
                                                {comp.language}
                                            </span>
                                        </div>

                                        {/* Eligibility summary */}
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">
                                                <Building2 size={11} />
                                                {comp.eligibility?.institutions === 'all'
                                                    ? 'All universities'
                                                    : comp.eligibility?.institutions === 'none'
                                                        ? 'No universities'
                                                        : `${(comp.eligibility?.tenantNames || []).length} univ.`}
                                            </span>
                                            {comp.eligibility?.allowLearners && (
                                                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-lg font-medium">
                                                    <GraduationCap size={11} />
                                                    Learners
                                                </span>
                                            )}
                                        </div>

                                        {/* Dates */}
                                        <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={11} className="text-green-500" />
                                                {formatDate(comp.startDate)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={11} className="text-rose-500" />
                                                {formatDate(comp.dueDate)}
                                            </span>
                                        </div>

                                        {/* Delete */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(comp._id, comp.title); }}
                                            className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg transition-colors font-medium"
                                        >
                                            <Trash2 size={14} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
};

export default SuperAdminCompetitionsPage;
