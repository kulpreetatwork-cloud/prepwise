import Feedback from '../models/Feedback.js';
import Interview from '../models/Interview.js';
import User from '../models/User.js';

function getDateFilter(period) {
  if (period === 'weekly') {
    return { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  }
  if (period === 'monthly') {
    return { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
  }
  return null;
}

export const getLeaderboard = async (req, res, next) => {
  try {
    const { type = 'score', period = 'all-time' } = req.query;
    const dateFilter = getDateFilter(period);
    let entries = [];

    if (type === 'score') {
      const matchStage = dateFilter
        ? { $match: { createdAt: dateFilter } }
        : { $match: {} };

      entries = await Feedback.aggregate([
        matchStage,
        {
          $group: {
            _id: '$userId',
            avgScore: { $avg: '$overallScore' },
            count: { $sum: 1 },
            bestScore: { $max: '$overallScore' },
          },
        },
        { $match: { count: { $gte: 1 } } },
        { $sort: { avgScore: -1 } },
        { $limit: 50 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            userId: '$_id',
            name: '$user.name',
            avatar: '$user.avatar',
            targetRole: '$user.targetRole',
            value: { $round: ['$avgScore', 1] },
            count: 1,
            bestScore: 1,
          },
        },
      ]);
    } else if (type === 'interviews') {
      const matchStage = dateFilter
        ? { $match: { status: 'completed', createdAt: dateFilter } }
        : { $match: { status: 'completed' } };

      entries = await Interview.aggregate([
        matchStage,
        {
          $group: {
            _id: '$userId',
            value: { $sum: 1 },
          },
        },
        { $sort: { value: -1 } },
        { $limit: 50 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            userId: '$_id',
            name: '$user.name',
            avatar: '$user.avatar',
            targetRole: '$user.targetRole',
            value: 1,
          },
        },
      ]);
    } else if (type === 'streak') {
      const users = await User.find({
        'streak.longest': { $gt: 0 },
      })
        .sort({ 'streak.longest': -1 })
        .limit(50)
        .select('name avatar targetRole streak')
        .lean();

      entries = users.map((u) => ({
        userId: u._id,
        name: u.name,
        avatar: u.avatar,
        targetRole: u.targetRole,
        value: u.streak.longest,
        current: u.streak.current,
      }));
    } else if (type === 'improvement') {
      const users = await User.find().select('_id name avatar targetRole').lean();

      const results = [];

      for (const u of users) {
        const feedbacks = await Feedback.find({ userId: u._id })
          .sort({ createdAt: 1 })
          .select('overallScore')
          .lean();

        if (feedbacks.length < 3) continue;

        const earlyCount = Math.min(3, Math.floor(feedbacks.length / 2));
        const earlyAvg =
          feedbacks.slice(0, earlyCount).reduce((s, f) => s + f.overallScore, 0) / earlyCount;
        const lateAvg =
          feedbacks.slice(-earlyCount).reduce((s, f) => s + f.overallScore, 0) / earlyCount;
        const improvement = Math.round((lateAvg - earlyAvg) * 10) / 10;

        if (improvement > 0) {
          results.push({
            userId: u._id,
            name: u.name,
            avatar: u.avatar,
            targetRole: u.targetRole,
            value: improvement,
          });
        }
      }

      results.sort((a, b) => b.value - a.value);
      entries = results.slice(0, 50);
    }

    entries = entries.map((e, i) => ({ ...e, rank: i + 1 }));

    res.json({ success: true, entries, type, period });
  } catch (error) {
    next(error);
  }
};
