import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  MessageSquare, Star, X, Building2, GraduationCap,
  Calendar, ChevronRight, Inbox
} from 'lucide-react';
import SuperAdminLayout from './SuperAdminLayout';

/* ── Helpers ─────────────────────────────────────────── */
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const avgRating = (ratings) => {
  if (!ratings) return 0;
  const { helpfulness, userExperience, overall } = ratings;
  return ((helpfulness + userExperience + overall) / 3).toFixed(1);
};

const StarDisplay = ({ value, size = 16 }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={size}
        fill={s <= Math.round(value) ? '#f59e0b' : 'none'}
        stroke={s <= Math.round(value) ? '#f59e0b' : '#d1d5db'}
        strokeWidth={1.5}
      />
    ))}
  </div>
);

const RATING_LABELS = {
  helpfulness: 'Codezy Helpfulness',
  userExperience: 'User Experience',
  overall: 'Overall Rating'
};

/* ── Detail Modal ────────────────────────────────────── */
const FeedbackDetailModal = ({ feedback, onClose }) => {
  const avg = avgRating(feedback.ratings);
  const isInstitution = feedback.submitterType === 'institution_admin';

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
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className={`px-6 py-5 flex items-start justify-between gap-4 ${isInstitution ? 'bg-gradient-to-r from-indigo-600 to-blue-600' : 'bg-gradient-to-r from-purple-600 to-indigo-600'}`}>
            <div className="text-white">
              <div className="flex items-center gap-2 mb-1">
                {isInstitution
                  ? <Building2 size={18} />
                  : <GraduationCap size={18} />}
                <span className="font-black text-lg">{feedback.submitterName}</span>
              </div>
              <p className="text-xs opacity-80">
                {isInstitution ? `🏢 ${feedback.institutionName}` : '🎓 Individual Learner'}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <StarDisplay value={Number(avg)} size={14} />
                <span className="text-yellow-200 font-bold text-sm">{avg} / 5</span>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors mt-0.5">
              <X size={22} />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto px-6 py-5 space-y-5">
            {/* Individual ratings */}
            <div className="space-y-3">
              {Object.entries(feedback.ratings).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-medium">{RATING_LABELS[key] || key}</span>
                  <div className="flex items-center gap-2">
                    <StarDisplay value={val} size={15} />
                    <span className="text-xs font-bold text-gray-500">{val}/5</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100" />

            {/* Review text */}
            {feedback.review ? (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Written Review</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  {feedback.review}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No written review provided.</p>
            )}

            {/* Date */}
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <Calendar size={13} />
              Submitted on {formatDate(feedback.createdAt)}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ── Feedback Card ───────────────────────────────────── */
const FeedbackCard = ({ feedback, onClick }) => {
  const avg = avgRating(feedback.ratings);
  const isInstitution = feedback.submitterType === 'institution_admin';

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 12px 30px rgba(0,0,0,0.10)' }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer transition-all"
    >
      {/* Top row: name + type badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-black text-gray-800 text-base truncate">{feedback.submitterName}</p>
          <div className="flex items-center gap-1.5 mt-1">
            {isInstitution ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                <Building2 size={11} /> {feedback.institutionName || 'Institution'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">
                <GraduationCap size={11} /> Individual Learner
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 justify-end">
            <Star size={16} fill="#f59e0b" stroke="#f59e0b" strokeWidth={1.5} />
            <span className="font-black text-gray-800 text-lg">{avg}</span>
          </div>
          <p className="text-xs text-gray-400">Overall Avg.</p>
        </div>
      </div>

      {/* Star rows */}
      <div className="space-y-1.5 mb-3">
        {Object.entries(feedback.ratings).map(([key, val]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{RATING_LABELS[key] || key}</span>
            <StarDisplay value={val} size={13} />
          </div>
        ))}
      </div>

      {/* Review snippet */}
      {feedback.review && (
        <p className="text-xs text-gray-500 line-clamp-2 italic border-t border-gray-50 pt-2 mb-2">
          "{feedback.review}"
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-400">{formatDate(feedback.createdAt)}</span>
        <span className="text-xs text-indigo-600 font-bold flex items-center gap-0.5">
          View full <ChevronRight size={13} />
        </span>
      </div>
    </motion.div>
  );
};

/* ── Main Page ───────────────────────────────────────── */
const SuperAdminFeedbacksPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/feedback`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { setFeedbacks(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = feedbacks.filter(f => {
    if (filter === 'Institution') return f.submitterType === 'institution_admin';
    if (filter === 'Learner') return f.submitterType === 'individual_learner';
    return true;
  });

  const avgOverall = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + Number(avgRating(f.ratings)), 0) / feedbacks.length).toFixed(1)
    : '—';

  return (
    <SuperAdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <MessageSquare size={22} className="text-indigo-600" />
            </div>
            User Feedbacks
          </h1>
          <p className="text-gray-400 mt-1 text-sm">All feedback from institution admins and individual learners.</p>
        </div>
        {/* Summary badge */}
        {feedbacks.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow px-5 py-3 flex items-center gap-3">
            <div>
              <p className="text-xs text-gray-400 font-medium">Platform Average</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Star size={18} fill="#f59e0b" stroke="#f59e0b" strokeWidth={1.5} />
                <span className="font-black text-2xl text-gray-800">{avgOverall}</span>
                <span className="text-gray-400 text-sm font-medium">/ 5</span>
              </div>
            </div>
            <div className="border-l border-gray-100 pl-4">
              <p className="text-xs text-gray-400 font-medium">Total Reviews</p>
              <p className="font-black text-2xl text-gray-800">{feedbacks.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {['All', 'Institution', 'Learner'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === tab
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-500 border border-gray-100 hover:border-indigo-200 hover:text-indigo-600'
            }`}
          >
            {tab === 'All' ? `All (${feedbacks.length})` : tab === 'Institution'
              ? `Institutions (${feedbacks.filter(f => f.submitterType === 'institution_admin').length})`
              : `Learners (${feedbacks.filter(f => f.submitterType === 'individual_learner').length})`}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <Inbox size={52} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-semibold text-lg">No feedbacks yet.</p>
          <p className="text-gray-300 text-sm mt-1">Feedbacks will appear here once users submit them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(fb => (
            <FeedbackCard key={fb._id} feedback={fb} onClick={() => setSelected(fb)} />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <FeedbackDetailModal feedback={selected} onClose={() => setSelected(null)} />
      )}
    </SuperAdminLayout>
  );
};

export default SuperAdminFeedbacksPage;
