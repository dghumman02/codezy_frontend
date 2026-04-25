import axiosInstance from './axiosInstance';

/**
 * Learner Gamification API Service
 * For Individual Learners Only
 */

/**
 * Get achievements summary for a learner
 * @param {string} learnerId 
 */
export const getAchievementsSummary = async (learnerId) => {
  const response = await axiosInstance.get(`/learner-gamification/achievements/${learnerId}`);
  return response.data;
};

/**
 * Get badge progress for a learner
 * @param {string} learnerId 
 */
export const getBadgeProgress = async (learnerId) => {
  const response = await axiosInstance.get(`/learner-gamification/progress/${learnerId}`);
  return response.data;
};

/**
 * Get streak information
 * @param {string} learnerId 
 */
export const getStreak = async (learnerId) => {
  const response = await axiosInstance.get(`/learner-gamification/streak/${learnerId}`);
  return response.data;
};

/**
 * Record lesson completion
 * @param {string} learnerId 
 * @param {string} courseId 
 */
export const recordLessonComplete = async (learnerId, courseId) => {
  const response = await axiosInstance.post('/learner-gamification/lesson-complete', { 
    learnerId, 
    courseId 
  });
  return response.data;
};

/**
 * Record quiz completion
 * @param {object} params 
 */
export const recordQuizComplete = async ({ learnerId, quizId, courseId, score, maxScore }) => {
  const response = await axiosInstance.post('/learner-gamification/quiz-complete', { 
    learnerId, 
    quizId, 
    courseId, 
    score, 
    maxScore 
  });
  return response.data;
};

/**
 * Record course completion
 * @param {string} learnerId 
 * @param {string} courseId 
 */
export const recordCourseComplete = async (learnerId, courseId) => {
  const response = await axiosInstance.post('/learner-gamification/course-complete', { 
    learnerId, 
    courseId 
  });
  return response.data;
};

/**
 * Seed default achievements (admin use)
 */
export const seedAchievements = async () => {
  const response = await axiosInstance.post('/learner-gamification/seed-achievements');
  return response.data;
};

/**
 * Get all available badges
 */
export const getAllBadges = async () => {
  const response = await axiosInstance.get('/learner-gamification/all-badges');
  return response.data;
};

export default {
  getAchievementsSummary,
  getBadgeProgress,
  getStreak,
  recordLessonComplete,
  recordQuizComplete,
  recordCourseComplete,
  seedAchievements,
  getAllBadges
};
