import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, CheckCircle, Circle, Zap, Flame, Target, 
  Trophy, Rocket, Award, Star, TrendingUp,
  ArrowRight
} from 'lucide-react';

/**
 * XP Checklist Modal
 * Shows an attractive breakdown of XP earned after lab submission
 */
const XPChecklistModal = ({ 
  isOpen, 
  onClose, 
  gamificationData,
  averageScore,
  labTitle 
}) => {
  if (!isOpen || !gamificationData) return null;

  const { 
    breakdown, 
    bonuses, 
    achievements, 
    streaks, 
    tier, 
    isReattempt,
    checklist,
    xpGained,
    totalXp 
  } = gamificationData;

  // Tier colors
  const tierColors = {
    Bronze: 'from-amber-600 to-amber-700',
    Silver: 'from-gray-400 to-gray-500',
    Gold: 'from-yellow-400 to-yellow-600',
    Platinum: 'from-cyan-400 to-cyan-600',
    Diamond: 'from-purple-400 to-pink-500'
  };

  // Tier emojis
  const tierEmojis = {
    Bronze: '🥉',
    Silver: '🥈',
    Gold: '🥇',
    Platinum: '💎',
    Diamond: '👑'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header with Total XP */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 text-white relative overflow-hidden flex-shrink-0">
              {/* Background decorations */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative z-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Trophy className="w-8 h-8 text-yellow-300" />
                </motion.div>
                
                <h2 className="text-xl font-bold mb-1">Lab Submitted!</h2>
                <p className="text-purple-200 text-sm mb-4">{labTitle}</p>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/20 backdrop-blur-sm rounded-2xl py-4 px-6"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Zap className="w-6 h-6 text-yellow-300" fill="currentColor" />
                    <span className="text-4xl font-black">+{xpGained}</span>
                    <span className="text-xl font-bold">XP</span>
                  </div>
                  <p className="text-purple-200 text-xs mt-1">
                    Total: {totalXp?.toLocaleString()} XP
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="p-6 flex-1 overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                XP Breakdown
              </h3>
              
              <div className="space-y-3">
                {checklist?.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                      item.achieved 
                        ? 'bg-emerald-50 border border-emerald-100' 
                        : 'bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div className={`mt-0.5 ${item.achieved ? 'text-emerald-500' : 'text-gray-300'}`}>
                      {item.achieved ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold text-sm ${
                          item.achieved ? 'text-gray-800' : 'text-gray-400'
                        }`}>
                          {item.label}
                        </span>
                        <span className={`font-bold text-sm ${
                          item.achieved ? 'text-emerald-600' : 'text-gray-400'
                        }`}>
                          {item.value}
                        </span>
                      </div>
                      {item.detail && (
                        <p className={`text-xs mt-0.5 ${
                          item.achieved ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {item.detail}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Bonuses Section */}
              {bonuses && bonuses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-6"
                >
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Bonuses Earned
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {bonuses.map((bonus, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"
                      >
                        <Star className="w-3 h-3" />
                        +{bonus.xp} XP
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Achievements Unlocked */}
              {achievements && achievements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="mt-6"
                >
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Achievements Unlocked!
                  </h3>
                  <div className="space-y-2">
                    {achievements.map((achievement, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1 + index * 0.2, type: "spring" }}
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 text-white flex items-center gap-3"
                      >
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                          <Award className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold">{achievement.title}</h4>
                          <p className="text-purple-200 text-xs">+{achievement.xpAwarded} XP</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Streak Info - Handle both institutional students and individual learners */}
              {streaks && (streaks.submission?.current > 1 || streaks.earlyExcellence?.current > 0 || streaks.current > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="mt-6 flex gap-3"
                >
                  {/* Institutional student streaks */}
                  {streaks.submission?.current > 1 && (
                    <div className="flex-1 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-4 text-white">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-5 h-5" />
                        <span className="font-bold">{streaks.submission.current} Day Streak!</span>
                      </div>
                      <p className="text-orange-100 text-xs">Keep it up!</p>
                    </div>
                  )}
                  
                  {streaks.earlyExcellence?.current > 0 && (
                    <div className="flex-1 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl p-4 text-white">
                      <div className="flex items-center gap-2 mb-1">
                        <Rocket className="w-5 h-5" />
                        <span className="font-bold">{streaks.earlyExcellence.current} Top Finishes!</span>
                      </div>
                      <p className="text-purple-100 text-xs">Elite performance!</p>
                    </div>
                  )}
                  
                  {/* Individual learner streak */}
                  {streaks.current > 0 && !streaks.submission && (
                    <div className="flex-1 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-4 text-white">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-5 h-5" />
                        <span className="font-bold">{streaks.current} Day Streak!</span>
                      </div>
                      <p className="text-orange-100 text-xs">Keep the momentum going!</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Badge Progress - For Individual Learners */}
              {gamificationData?.badgeProgress && gamificationData.badgeProgress.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.15 }}
                  className="mt-6"
                >
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Badge Progress
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {gamificationData.badgeProgress
                      .filter(badge => badge.status === 'in-progress')
                      .slice(0, 3)
                      .map((badge, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{badge.icon}</span>
                              <span className="font-semibold text-gray-700 text-sm">{badge.title}</span>
                            </div>
                            <span className="text-xs text-gray-500">{badge.current}/{badge.target}</span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                              style={{ width: `${badge.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}

              {/* Tier Progress */}
              {tier && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="mt-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{tierEmojis[tier.currentTier]}</span>
                      <span className="font-bold text-gray-700">{tier.currentTier}</span>
                    </div>
                    {tier.nextTier && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <ArrowRight className="w-4 h-4" />
                        <span className="text-lg">{tierEmojis[tier.nextTier]}</span>
                        <span className="font-medium">{tier.nextTier}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${tier.progress}%` }}
                      transition={{ delay: 1.3, duration: 0.8 }}
                      className={`h-full rounded-full bg-gradient-to-r ${tierColors[tier.currentTier] || tierColors.Bronze}`}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {tier.xpToNextTier} XP to {tier.nextTier}
                  </p>
                </motion.div>
              )}

              {/* Reattempt Notice */}
              {isReattempt && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3 }}
                  className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4"
                >
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-700 text-sm">Reattempt Detected</p>
                      <p className="text-blue-600 text-xs">
                        XP was calculated based on improvement over your previous best score.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default XPChecklistModal;
