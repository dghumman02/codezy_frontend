import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Zap, Lock, CheckCircle, Star, Award, Flame, 
  Target, Rocket, Crown, Medal, Clock, Code, Layers, 
  GitBranch, List, Footprints, Sword
} from 'lucide-react';
import Navbar from './Navbar';

// Icon mapping for achievement icons
const iconMap = {
  trophy: Trophy,
  zap: Zap,
  star: Star,
  award: Award,
  flame: Flame,
  target: Target,
  rocket: Rocket,
  crown: Crown,
  medal: Medal,
  clock: Clock,
  code: Code,
  layers: Layers,
  'git-branch': GitBranch,
  list: List,
  footprints: Footprints,
  sword: Sword
};

// Tier emoji mapping
const tierEmojis = {
  Bronze: '🥉',
  Silver: '🥈',
  Gold: '🥇',
  Platinum: '💎',
  Diamond: '👑'
};

const StudentAchievements = () => {
  const navigate = useNavigate();
  const STUDENT_ID = localStorage.getItem('userId');
  const studentName = localStorage.getItem('fullName') || 'Student';

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!STUDENT_ID) {
      navigate('/login');
      return;
    }

    const fetchAchievements = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/students/${STUDENT_ID}/achievements`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch achievements');
        }
        
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching achievements:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAchievements();
  }, [STUDENT_ID, navigate]);

  // Get unique categories from badges
  const categories = data?.badges 
    ? ['All', ...new Set(data.badges.map(b => b.category).filter(Boolean))]
    : ['All', 'Programming', 'Object-Oriented', 'Data', 'Database', 'General', 'Streak', 'Performance'];

  // Filter badges
  const filteredBadges = data?.badges?.filter(
    b => filter === 'All' || b.category === filter
  ) || [];

  // Count earned/locked badges
  const earnedBadges = filteredBadges.filter(b => !b.isLocked);
  const lockedBadges = filteredBadges.filter(b => b.isLocked);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] font-sans pb-20">
        <Navbar studentName={studentName} />
        <div className="max-w-7xl mx-auto px-8 py-10">
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">Error loading achievements</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FD] font-sans pb-20">
      <Navbar studentName={studentName} />

      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-black text-gray-900">
            Achievements & XP Progress
          </h1>
          <p className="text-gray-500 font-medium">
            Track your learning journey and unlock badges
          </p>
        </header>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total XP Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            <div className="relative z-10">
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">
                Total XP Points
              </p>
              <h2 className="text-4xl font-black flex items-center gap-2">
                {(data?.totalXp || 0).toLocaleString()} XP
                <Zap className="w-8 h-8 text-yellow-300" fill="currentColor" />
              </h2>
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-indigo-100 text-sm font-semibold flex items-center gap-2">
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    +{data?.weeklyXp || 0} XP this week
                  </span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Current Tier Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm"
          >
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
              Current Tier
            </p>
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
              {tierEmojis[data?.tier] || '🥉'} {data?.tier || 'Bronze'}
            </h2>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-gray-500 text-sm">
                <span className="font-semibold">XP Range:</span> {data?.xpRange || '0 - 999'}
              </p>
            </div>
          </motion.div>

          {/* Next Tier Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                  Next Tier
                </p>
                <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                  {tierEmojis[data?.nextTier] || '🥈'} {data?.nextTier || 'Silver'}
                </h2>
              </div>
              <span className="text-indigo-600 font-black text-lg">
                {data?.nextTierPercent || 0}%
              </span>
            </div>

            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data?.nextTierPercent || 0}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              />
            </div>
            <p className="text-gray-400 text-xs mt-2 text-right">
              {data?.xpToNextTier || 0} XP to next tier
            </p>
          </motion.div>
        </div>

        {/* Badge Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                  Earned Badges
                </p>
                <p className="text-2xl font-black text-gray-800">
                  {data?.earnedBadges || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
                <Lock className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                  Locked Badges
                </p>
                <p className="text-2xl font-black text-gray-800">
                  {data?.lockedBadges || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Award className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                  Total Badges
                </p>
                <p className="text-2xl font-black text-gray-800">
                  {data?.totalBadges || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                  Completion
                </p>
                <p className="text-2xl font-black text-gray-800">
                  {data?.completionPercent || 0}%
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {categories.map((tab, index) => (
            <motion.button
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              onClick={() => setFilter(tab)}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap
              ${filter === tab
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'bg-white text-gray-400 border border-gray-100 hover:border-indigo-200 hover:text-indigo-500'
              }`}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        {/* Badges Grid */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {filteredBadges.map((badge, idx) => {
              const IconComponent = iconMap[badge.icon] || Star;
              
              return (
                <motion.div
                  key={badge.code || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className={`bg-white rounded-3xl p-6 border flex flex-col items-center text-center relative overflow-hidden group
                  ${badge.isLocked
                    ? 'border-gray-100'
                    : 'border-indigo-50 shadow-lg shadow-indigo-50'
                  }`}
                >
                  {/* Tooltip showing criteria on hover */}
                  <div className="absolute inset-x-0 top-0 -translate-y-full opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-200 z-20 pointer-events-none px-2">
                    <div className="bg-gray-900 text-white text-xs p-3 rounded-xl shadow-xl max-w-xs mx-auto">
                      <p className="font-bold text-yellow-400 mb-1">How to unlock:</p>
                      <p className="text-gray-200">{badge.description}</p>
                      {badge.earnedCount > 0 && (
                        <p className="text-emerald-400 mt-2 font-semibold">
                          ✓ Achieved {badge.earnedCount} time{badge.earnedCount > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <div className="w-3 h-3 bg-gray-900 rotate-45 mx-auto -mt-1.5"></div>
                  </div>
                  
                  {/* Earned count badge (for repeatable achievements) */}
                  {badge.earnedCount > 1 && (
                    <div className="absolute top-4 right-4 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      ×{badge.earnedCount}
                    </div>
                  )}
                  
                  {/* Badge Icon */}
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all
                    ${badge.isLocked
                      ? 'bg-gray-100'
                      : ''
                    }`}
                    style={!badge.isLocked ? { backgroundColor: `${badge.iconColor}20` } : {}}
                  >
                    {badge.isLocked ? (
                      <Lock className="w-8 h-8 text-gray-300" />
                    ) : (
                      <IconComponent 
                        className="w-10 h-10" 
                        style={{ color: badge.iconColor || '#6366f1' }}
                      />
                    )}
                  </div>

                  {/* Badge Title */}
                  <h3 className={`font-black mb-2 ${badge.isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
                    {badge.title}
                  </h3>
                  
                  {/* Badge Description */}
                  <p className="text-[11px] text-gray-400 mb-4 line-clamp-2">
                    {badge.description}
                  </p>

                  {/* Badge Status */}
                  <div className="mt-auto w-full">
                    {!badge.isLocked ? (
                      <>
                        <div className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase py-1.5 rounded-lg flex justify-center items-center gap-1 mb-3">
                          <CheckCircle className="w-3 h-3" /> Earned
                        </div>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase flex items-center justify-center gap-1">
                          <Zap className="w-3 h-3" />+{badge.xpAward} XP
                        </p>
                        {badge.earnedAt && (
                          <p className="text-[9px] text-gray-400 mt-1">
                            Earned: {new Date(badge.earnedAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="bg-gray-100 text-gray-400 text-[10px] font-black uppercase py-1.5 rounded-lg mb-3 flex justify-center items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked
                        </div>
                        {badge.progress > 0 && (
                          <div className="w-full">
                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-400 h-full rounded-full transition-all"
                                style={{ width: `${badge.progress}%` }}
                              />
                            </div>
                            <p className="text-[9px] text-gray-400 mt-1 text-right">
                              {badge.progress}% Complete
                            </p>
                          </div>
                        )}
                        <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center justify-center gap-1 mt-2">
                          <Zap className="w-3 h-3" />+{badge.xpAward} XP
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {filteredBadges.length === 0 && (
          <div className="text-center py-20">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No badges in this category yet</p>
            <p className="text-gray-400 text-sm">Keep completing labs to unlock achievements!</p>
          </div>
        )}

        {/* Streak Info Section */}
        {data?.streaks && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12"
          >
            <h2 className="text-xl font-black text-gray-900 mb-6">Your Streaks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Submission Streak */}
              <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-2xl">
                    <Flame className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-orange-100 text-xs font-bold uppercase tracking-widest">
                      Submission Streak
                    </p>
                    <p className="text-3xl font-black">
                      {data.streaks.submission?.current || 0} Days
                    </p>
                    <p className="text-orange-200 text-xs mt-1">
                      Longest: {data.streaks.submission?.longest || 0} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Early Excellence Streak Info */}
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-2xl">
                    <Rocket className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-purple-100 text-xs font-bold uppercase tracking-widest">
                      Early Excellence
                    </p>
                    <p className="text-3xl font-black">
                      {data.streaks.earlyExcellence?.[0]?.current || 0} Labs
                    </p>
                    <p className="text-purple-200 text-xs mt-1">
                      Consecutive top 3 finishes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* First Submission Stats Section */}
        {data?.firstSubmitStats && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8"
          >
            <h2 className="text-xl font-black text-gray-900 mb-6">Speed Leader Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First to Submit with High Score */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white relative group cursor-pointer hover:scale-[1.02] transition-transform">
                <div className="absolute inset-x-0 top-0 -translate-y-full opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-200 z-20 pointer-events-none px-4">
                  <div className="bg-gray-900 text-white text-xs p-3 rounded-xl shadow-xl">
                    <p className="font-semibold text-amber-400">Trailblazer Count</p>
                    <p className="text-gray-200 mt-1">Number of labs where you were the FIRST student to submit with a score of 8.5 or higher (85%+)</p>
                  </div>
                  <div className="w-3 h-3 bg-gray-900 rotate-45 mx-auto -mt-1.5"></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-2xl">
                    <Zap className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-amber-100 text-xs font-bold uppercase tracking-widest">
                      1st Place Finishes
                    </p>
                    <p className="text-4xl font-black">
                      {data.firstSubmitStats.firstToSubmitHighScore || 0}
                    </p>
                    <p className="text-amber-200 text-xs mt-1">
                      First to submit with 85%+ score
                    </p>
                  </div>
                </div>
              </div>

              {/* Top 5 Submissions */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white relative group cursor-pointer hover:scale-[1.02] transition-transform">
                <div className="absolute inset-x-0 top-0 -translate-y-full opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-200 z-20 pointer-events-none px-4">
                  <div className="bg-gray-900 text-white text-xs p-3 rounded-xl shadow-xl">
                    <p className="font-semibold text-emerald-400">Top 5 Finisher Count</p>
                    <p className="text-gray-200 mt-1">Number of labs where you were among the first 5 students to submit with a passing score of 8.5 or higher</p>
                  </div>
                  <div className="w-3 h-3 bg-gray-900 rotate-45 mx-auto -mt-1.5"></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-2xl">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest">
                      Top 5 Finishes
                    </p>
                    <p className="text-4xl font-black">
                      {data.firstSubmitStats.topFiveSubmissions || 0}
                    </p>
                    <p className="text-emerald-200 text-xs mt-1">
                      Among first 5 to submit
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudentAchievements;
