import User from '../models/User.js';
import Interview from '../models/Interview.js';
import Feedback from '../models/Feedback.js';
import Achievement from '../models/Achievement.js';

export const getProfile = async (req, res) => {
  res.json({ success: true, user: req.user });
};

export const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'bio', 'skills', 'targetRole', 'experienceLevel', 'avatar', 'theme'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      returnDocument: 'after',
      runValidators: true,
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [totalInterviews, completedInterviews, feedbacks, achievements, recentInterviews] =
      await Promise.all([
        Interview.countDocuments({ userId }),
        Interview.countDocuments({ userId, status: 'completed' }),
        Feedback.find({ userId }).sort({ createdAt: -1 }),
        Achievement.find({ userId }).sort({ unlockedAt: -1 }),
        Interview.find({ userId, status: 'completed' })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      ]);

    const averageScore =
      feedbacks.length > 0
        ? Math.round(feedbacks.reduce((sum, f) => sum + f.overallScore, 0) / feedbacks.length)
        : 0;

    const totalPracticeTime = await Interview.aggregate([
      { $match: { userId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$actualDuration' } } },
    ]);

    const practiceMinutes = totalPracticeTime.length > 0
      ? Math.round(totalPracticeTime[0].total / 60)
      : 0;

    const progressData = feedbacks
      .slice(0, 10)
      .reverse()
      .map((f, i) => ({
        interview: i + 1,
        score: f.overallScore,
        communication: f.categoryScores.communication,
        technical: f.categoryScores.technicalAccuracy,
        confidence: f.categoryScores.confidence,
      }));

    const skillRadar = feedbacks.length > 0
      ? {
          communication: Math.round(
            feedbacks.reduce((s, f) => s + f.categoryScores.communication, 0) / feedbacks.length
          ),
          technicalAccuracy: Math.round(
            feedbacks.reduce((s, f) => s + f.categoryScores.technicalAccuracy, 0) / feedbacks.length
          ),
          confidence: Math.round(
            feedbacks.reduce((s, f) => s + f.categoryScores.confidence, 0) / feedbacks.length
          ),
          clarity: Math.round(
            feedbacks.reduce((s, f) => s + f.categoryScores.clarity, 0) / feedbacks.length
          ),
          relevance: Math.round(
            feedbacks.reduce((s, f) => s + f.categoryScores.relevance, 0) / feedbacks.length
          ),
        }
      : null;

    const recentWithFeedback = await Promise.all(
      recentInterviews.map(async (interview) => {
        const feedback = await Feedback.findOne({ interviewId: interview._id }).lean();
        return {
          ...interview,
          feedback: feedback
            ? { overallScore: feedback.overallScore, grade: feedback.grade }
            : null,
        };
      })
    );

    res.json({
      success: true,
      stats: {
        totalInterviews,
        completedInterviews,
        averageScore,
        practiceMinutes,
        currentStreak: req.user.streak?.current || 0,
        longestStreak: req.user.streak?.longest || 0,
        progressData,
        skillRadar,
        recentInterviews: recentWithFeedback,
        achievements,
      },
    });
  } catch (error) {
    next(error);
  }
};
