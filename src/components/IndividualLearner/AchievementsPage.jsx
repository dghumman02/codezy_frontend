import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LearnerNavbar from './Navbar';
import ChatWidget from '../ai/ChatWidget';
import { getAchievementsSummary } from '../../services/learnerGamificationApi';
import {
  Trophy, Star, Target, Flame, Lock, CheckCircle,
  Loader2, RefreshCw, Zap, TrendingUp, Award, Medal, Crown,
  Diamond, Sparkles, Code, Layers, Footprints, Rocket, Info
} from 'lucide-react';

// Map icon string names from backend to lucide components
const iconMap = {
  trophy: Trophy,
  star: Star,
  target: Target,
  flame: Flame,
  zap: Zap,
  award: Award,
  medal: Medal,
  crown: Crown,
  diamond: Diamond,
  sparkles: Sparkles,
  code: Code,
  layers: Layers,
  footprints: Footprints,
  rocket: Rocket,
  'trending-up': TrendingUp,
};

const tierEmojis = {
  Bronze: '🥉',
  Silver: '🥈',
  Gold: '🥇',
  Platinum: '💎',
  Diamond: '👑',
};

const tierGradients = {
  Bronze: 'from-amber-600 to-amber-700',
  Silver: 'from-gray-400 to-gray-500',
  Gold: 'from-yellow-400 to-yellow-500',
  Platinum: 'from-cyan-400 to-cyan-500',
  Diamond: 'from-purple-400 to-pink-500',
};

const categoryConfig = {
  Beginner: { emoji: '🚀', gradient: 'from-emerald-400 to-green-500' },
  'Score Based': { emoji: '⭐', gradient: 'from-yellow-400 to-orange-500' },
  'Learning Progress': { emoji: '📚', gradient: 'from-blue-400 to-indigo-500' },
  Streak: { emoji: '🔥', gradient: 'from-orange-400 to-red-500' },
};

const AchievementsPage = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const learnerId = localStorage.getItem('userId');

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAchievementsSummary(learnerId);
      if (res.success) {
        setData(res);
      } else {
        setError(res.error || 'Failed to load achievements');
      }
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError('Failed to load achievements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Beginner', 'Score Based', 'Learning Progress', 'Streak'];

  const allBadges = data?.badges || [];
  const filteredBadges = activeFilter === 'All'
    ? allBadges
    : allBadges.filter(b => b.category === activeFilter);

  const unlockedBadges = filteredBadges.filter(b => !b.isLocked);
  const inProgressBadges = filteredBadges.filter(b => b.isLocked && b.progress > 0);
  const lockedBadges = filteredBadges.filter(b => b.isLocked && b.progress === 0);

  const renderIcon = (iconName, color, size = 'w-7 h-7') => {
    const IconComponent = iconMap[iconName] || Trophy;
    return <IconComponent className={size} style={{ color }} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 font-sans">
      <LearnerNavbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* HEADER */}
        <header className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200/50">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Achievements</h1>
                <p className="text-gray-500 text-sm mt-0.5">Earn badges and XP as you master coding skills</p>
              </div>
            </div>
            <button
              onClick={fetchAchievements}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-purple-700 bg-purple-50 rounded-xl hover:bg-purple-100 transition-all disabled:opacity-50 border border-purple-100"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Streak badge */}
          {data?.streaks?.submission?.current > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-bold shadow-lg shadow-orange-200/50"
            >
              <Flame className="w-4 h-4 animate-pulse" />
              {data.streaks.submission.current} Day Streak! {data.streaks.submission.current >= 7 && '🔥'}
            </motion.div>
          )}
        </header>

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-purple-100 rounded-full animate-spin border-t-purple-500" />
              <Trophy className="w-8 h-8 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-500 font-medium mt-6">Loading your achievements...</p>
          </div>
        )}

        {/* ERROR */}
        {error && !loading && (
          <div className="text-center py-24 bg-red-50/50 rounded-3xl border-2 border-dashed border-red-100">
            <Trophy size={48} className="mx-auto mb-4 text-red-300" />
            <p className="text-red-500 font-medium mb-4">{error}</p>
            <button
              onClick={fetchAchievements}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-purple-200/50 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* CONTENT */}
        {!loading && !error && data && (
          <>
            {/* TOP STATS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              {/* Total XP */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total XP</p>
                    <p className="text-2xl font-black text-gray-800 mt-0.5">{(data.totalXp || 0).toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>

              {/* Badges Earned */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Badges Earned</p>
                    <p className="text-2xl font-black text-gray-800 mt-0.5">{data.earnedBadges}/{data.totalBadges}</p>
                  </div>
                </div>
              </motion.div>

              {/* Current Tier */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tierGradients[data.tier] || tierGradients.Bronze} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <span className="text-xl">{tierEmojis[data.tier] || '🥉'}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Tier</p>
                    <p className="text-2xl font-black text-gray-800 mt-0.5">{data.tier}</p>
                  </div>
                </div>
              </motion.div>

              {/* Completion */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Completion</p>
                    <p className="text-2xl font-black text-gray-800 mt-0.5">{data.completionPercent}%</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* TIER PROGRESS BAR */}
            {data.nextTier && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500">
                    {tierEmojis[data.tier]} {data.tier} → {tierEmojis[data.nextTier]} {data.nextTier}
                  </span>
                  <span className="text-xs font-bold text-purple-600">{data.xpToNextTier?.toLocaleString()} XP to go</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.nextTierPercent || 0}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className={`h-full bg-gradient-to-r ${tierGradients[data.tier] || tierGradients.Bronze} rounded-full`}
                  />
                </div>
              </motion.div>
            )}

            {/* CATEGORY FILTERS */}
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map(cat => {
                const config = categoryConfig[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                      activeFilter === cat
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent shadow-lg shadow-purple-200/50'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-purple-200 hover:text-purple-600 hover:bg-purple-50/50'
                    }`}
                  >
                    {config && <span className="mr-1.5">{config.emoji}</span>}
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* UNLOCKED BADGES */}
            {unlockedBadges.length > 0 && (
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-200/50">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-800">Unlocked Badges</h2>
                    <p className="text-xs text-gray-400">{unlockedBadges.length} badges earned</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {unlockedBadges.map((badge, idx) => (
                    <BadgeCard key={badge.code} badge={badge} renderIcon={renderIcon} />
                  ))}
                </div>
              </motion.section>
            )}

            {/* IN PROGRESS BADGES */}
            {inProgressBadges.length > 0 && (
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-800">In Progress</h2>
                    <p className="text-xs text-gray-400">{inProgressBadges.length} badges in progress</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {inProgressBadges.map((badge) => (
                    <ProgressCard key={badge.code} badge={badge} renderIcon={renderIcon} />
                  ))}
                </div>
              </motion.section>
            )}

            {/* LOCKED BADGES */}
            {lockedBadges.length > 0 && (
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl flex items-center justify-center shadow-lg shadow-gray-200/50">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-800">Locked Badges</h2>
                    <p className="text-xs text-gray-400">{lockedBadges.length} badges to unlock</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {lockedBadges.map((badge) => (
                    <LockedCard key={badge.code} badge={badge} />
                  ))}
                </div>
              </motion.section>
            )}

            {/* EMPTY STATE */}
            {filteredBadges.length === 0 && (
              <div className="text-center py-24 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                <Trophy size={56} className="mx-auto mb-4 text-gray-200" />
                <h3 className="text-gray-500 font-bold text-lg mb-1">No badges found</h3>
                <p className="text-gray-400 text-sm">Try selecting a different category</p>
              </div>
            )}

            {/* LEARNING STATS */}
            {data.stats && (
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200/50">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-extrabold text-gray-800">Learning Stats</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard label="Labs Done" value={data.stats.labsCompleted} icon={<Code className="w-5 h-5 text-blue-500" />} />
                  <StatCard label="Modules Done" value={data.stats.modulesCompleted} icon={<Layers className="w-5 h-5 text-purple-500" />} />
                  <StatCard label="Courses Done" value={data.stats.coursesCompleted} icon={<Trophy className="w-5 h-5 text-yellow-500" />} />
                  <StatCard label="Quizzes Taken" value={data.stats.quizzesTaken} icon={<Target className="w-5 h-5 text-cyan-500" />} />
                  <StatCard label="Perfect Labs" value={data.stats.perfectLabs} icon={<Star className="w-5 h-5 text-amber-500" />} />
                  <StatCard label="Perfect Quizzes" value={data.stats.perfectQuizzes} icon={<Award className="w-5 h-5 text-orange-500" />} />
                </div>

                {/* Streak row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                      <Flame className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Streak</p>
                      <p className="text-2xl font-black text-gray-800">{data.streaks?.submission?.current || 0} days</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Longest Streak</p>
                      <p className="text-2xl font-black text-gray-800">{data.streaks?.submission?.longest || 0} days</p>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </>
        )}
      </main>

      <ChatWidget />
    </div>
  );
};

/* ===== BADGE CARD (Unlocked) ===== */
const BadgeCard = ({ badge, renderIcon }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-xl transition-all group cursor-pointer relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/0 to-yellow-100/30 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg max-w-[200px] text-center"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Info size={12} className="text-green-400" />
              <span className="font-bold text-green-400">Completed!</span>
            </div>
            <p className="text-gray-300">{badge.description}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner border border-yellow-100/50">
              {renderIcon(badge.icon, badge.iconColor, 'w-8 h-8')}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br ${tierGradients[badge.tier] || tierGradients.Bronze} rounded-lg flex items-center justify-center text-white shadow-lg`}>
              <Medal className="w-3 h-3" />
            </div>
          </div>
        </div>

        <h3 className="font-bold text-gray-800 text-center mb-1">{badge.title}</h3>
        <p className="text-[11px] text-gray-400 text-center mb-3 line-clamp-2 leading-relaxed">{badge.description}</p>

        {/* Repeatable counter */}
        {badge.repeatable && badge.earnedCount > 1 && (
          <div className="flex justify-center mb-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              ×{badge.earnedCount}
            </span>
          </div>
        )}

        <div className="flex items-center justify-center gap-2">
          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {badge.tier}
          </span>
          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {badge.category}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-green-600 font-bold text-xs">
          <Sparkles size={12} className="text-yellow-500" />
          <span>+{badge.xpAward} XP Earned</span>
        </div>
      </div>
    </motion.div>
  );
};

/* ===== PROGRESS CARD (In Progress) ===== */
const ProgressCard = ({ badge, renderIcon }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = categoryConfig[badge.category] || { emoji: '🏆', gradient: 'from-gray-400 to-gray-500' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-xl transition-all group relative"
    >
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg max-w-[220px] text-center"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Info size={12} className="text-blue-400" />
              <span className="font-bold text-blue-400">How to unlock:</span>
            </div>
            <p className="text-gray-300">{badge.description}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100">
          {renderIcon(badge.icon, badge.iconColor, 'w-6 h-6')}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-800 truncate">{badge.title}</h3>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r ${config.gradient} text-white`}>
              {badge.category}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mb-3 line-clamp-1">{badge.description}</p>

          <div className="mb-2">
            <div className="flex justify-between text-[10px] font-bold mb-1.5">
              <span className="text-purple-600">{badge.current}/{badge.target}</span>
              <span className="text-gray-400">{badge.progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${badge.progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full bg-gradient-to-r ${config.gradient} rounded-full`}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg w-fit">
            <Star size={10} fill="currentColor" />
            +{badge.xpAward} XP on unlock
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ===== LOCKED CARD ===== */
const LockedCard = ({ badge }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className="bg-gray-50 rounded-xl border border-gray-200 p-4 opacity-60 hover:opacity-80 transition-all group relative cursor-pointer"
    >
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg max-w-[200px] text-center"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Lock size={12} className="text-amber-400" />
              <span className="font-bold text-amber-400">How to unlock:</span>
            </div>
            <p className="text-gray-300">{badge.description}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-3 group-hover:bg-gray-300 transition-colors">
          <Lock className="w-5 h-5 text-gray-400" />
        </div>
        <h3 className="font-bold text-gray-500 text-sm mb-1 truncate w-full">{badge.title}</h3>
        <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">
          {badge.target > 1 ? `${badge.target} required` : 'Locked'}
        </p>
        <div className="mt-2 text-[9px] font-bold text-gray-400">
          +{badge.xpAward} XP
        </div>
      </div>
    </motion.div>
  );
};

/* ===== STAT CARD ===== */
const StatCard = ({ label, value, icon }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-xl font-black text-gray-800">{value || 0}</p>
    </div>
  </div>
);

export default AchievementsPage;
