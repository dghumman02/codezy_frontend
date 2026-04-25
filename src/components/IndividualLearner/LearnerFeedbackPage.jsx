import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Star, Send, ChevronLeft, CheckCircle2, Sparkles
} from 'lucide-react';
import axios from 'axios';
import LearnerNavbar from './Navbar';

/* ── Star Rating Widget ─────────────────────────────── */
const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className="cursor-pointer transition-all duration-150 hover:scale-110"
      >
        <Star
          size={28}
          fill={star <= value ? '#f59e0b' : 'none'}
          stroke={star <= value ? '#f59e0b' : '#d1d5db'}
          strokeWidth={1.5}
        />
      </button>
    ))}
  </div>
);

/* ── Questions config ───────────────────────────────── */
const QUESTIONS = [
  {
    key: 'helpfulness',
    label: 'Do you find Codezy helpful?',
    sub: 'How well does Codezy support your learning journey?'
  },
  {
    key: 'userExperience',
    label: 'Overall User Experience',
    sub: 'Navigation, design, and ease of use.'
  },
  {
    key: 'overall',
    label: 'Rate Codezy Overall',
    sub: 'Your overall satisfaction with the platform.'
  }
];

/* ── Main Component ─────────────────────────────────── */
const LearnerFeedbackPage = () => {
  const navigate = useNavigate();
  const [ratings, setRatings] = useState({ helpfulness: 0, userExperience: 0, overall: 0 });
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [alreadyExists, setAlreadyExists] = useState(false);

  // Pre-fill if feedback already submitted
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/feedback/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.data) {
          setRatings(r.data.ratings);
          setReview(r.data.review || '');
          setAlreadyExists(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleRating = (key, val) => setRatings(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    for (const q of QUESTIONS) {
      if (!ratings[q.key]) {
        setError(`Please rate "${q.label}" before submitting.`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}`}/api/feedback`,
        { ratings, review },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={44} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-500 mb-8">We really appreciate you taking the time to share your thoughts.</p>
          <button
            onClick={() => navigate('/learner-dashboard')}
            className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <LearnerNavbar />

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            <Sparkles size={15} />
            Share Your Feedback
          </div>
          <h1 className="text-3xl font-black text-gray-800 mb-2">Rate Your Experience</h1>
          <p className="text-gray-500">Help us build a better learning platform for you.</p>
          {alreadyExists && (
            <p className="mt-2 text-sm text-amber-600 font-semibold">
              You have already submitted feedback. Submitting again will update your review.
            </p>
          )}
        </motion.div>

        <form onSubmit={handleSubmit}>
          {/* Rating cards */}
          <div className="space-y-4 mb-6">
            {QUESTIONS.map((q, i) => (
              <motion.div
                key={q.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-md p-6"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-base">{q.label}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{q.sub}</p>
                  </div>
                  <StarRating
                    value={ratings[q.key]}
                    onChange={(val) => handleRating(q.key, val)}
                  />
                </div>
                {ratings[q.key] > 0 && (
                  <p className="text-xs text-amber-600 font-semibold mt-2">
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][ratings[q.key]]} — {ratings[q.key]}/5
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Review text box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 mb-6"
          >
            <label className="font-bold text-gray-800 block mb-2">
              Write a Review <span className="text-gray-400 font-normal text-sm">(optional)</span>
            </label>
            <textarea
              rows={4}
              maxLength={1000}
              value={review}
              onChange={e => setReview(e.target.value)}
              placeholder="Share your thoughts, suggestions, or anything you'd like us to know..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{review.length}/1000</p>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-500 text-sm font-semibold text-center mb-4"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg hover:shadow-purple-300 flex items-center justify-center gap-2 text-base transition-all disabled:opacity-60"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
            ) : (
              <>
                <Send size={18} />
                {alreadyExists ? 'Update Feedback' : 'Submit Feedback'}
              </>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default LearnerFeedbackPage;
