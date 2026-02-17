import Interview from '../models/Interview.js';
import Feedback from '../models/Feedback.js';

export const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [interviews, feedbacks] = await Promise.all([
      Interview.find({ userId, status: 'completed' }).sort({ createdAt: 1 }).lean(),
      Feedback.find({ userId }).sort({ createdAt: 1 }).lean(),
    ]);

    // Heatmap: interviews per day for last 365 days
    const heatmap = [];
    const dayMap = {};
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    interviews.forEach((iv) => {
      const d = new Date(iv.createdAt);
      if (d >= oneYearAgo) {
        const key = d.toISOString().split('T')[0];
        dayMap[key] = (dayMap[key] || 0) + 1;
      }
    });

    for (let d = new Date(oneYearAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      heatmap.push({ date: key, count: dayMap[key] || 0 });
    }

    // Category trends over time (per feedback, chronological)
    const categoryTrends = feedbacks.map((f) => ({
      date: new Date(f.createdAt).toISOString().split('T')[0],
      communication: f.categoryScores?.communication || 0,
      technicalAccuracy: f.categoryScores?.technicalAccuracy || 0,
      confidence: f.categoryScores?.confidence || 0,
      clarity: f.categoryScores?.clarity || 0,
      relevance: f.categoryScores?.relevance || 0,
      overallScore: f.overallScore,
    }));

    // Performance by interview type
    const byType = {};
    interviews.forEach((iv) => {
      const t = iv.config?.type || 'unknown';
      if (!byType[t]) byType[t] = { scores: [], count: 0 };
      byType[t].count += 1;
    });
    feedbacks.forEach((f) => {
      const iv = interviews.find(
        (i) => i._id.toString() === f.interviewId?.toString()
      );
      if (iv) {
        const t = iv.config?.type || 'unknown';
        if (!byType[t]) byType[t] = { scores: [], count: 0 };
        byType[t].scores.push(f.overallScore);
      }
    });
    const performanceByType = Object.entries(byType).map(([type, data]) => ({
      type,
      avgScore: data.scores.length
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
        : 0,
      count: data.count,
    }));

    // Performance by difficulty
    const byDifficulty = {};
    interviews.forEach((iv) => {
      const d = iv.config?.difficulty || 'unknown';
      if (!byDifficulty[d]) byDifficulty[d] = { scores: [], count: 0 };
      byDifficulty[d].count += 1;
    });
    feedbacks.forEach((f) => {
      const iv = interviews.find(
        (i) => i._id.toString() === f.interviewId?.toString()
      );
      if (iv) {
        const d = iv.config?.difficulty || 'unknown';
        if (!byDifficulty[d]) byDifficulty[d] = { scores: [], count: 0 };
        byDifficulty[d].scores.push(f.overallScore);
      }
    });
    const performanceByDifficulty = Object.entries(byDifficulty).map(
      ([difficulty, data]) => ({
        difficulty,
        avgScore: data.scores.length
          ? Math.round(
              data.scores.reduce((a, b) => a + b, 0) / data.scores.length
            )
          : 0,
        count: data.count,
      })
    );

    // Performance by role
    const byRole = {};
    interviews.forEach((iv) => {
      const r = iv.config?.role || 'unknown';
      if (!byRole[r]) byRole[r] = { scores: [], count: 0 };
      byRole[r].count += 1;
    });
    feedbacks.forEach((f) => {
      const iv = interviews.find(
        (i) => i._id.toString() === f.interviewId?.toString()
      );
      if (iv) {
        const r = iv.config?.role || 'unknown';
        if (!byRole[r]) byRole[r] = { scores: [], count: 0 };
        byRole[r].scores.push(f.overallScore);
      }
    });
    const performanceByRole = Object.entries(byRole).map(([role, data]) => ({
      role,
      avgScore: data.scores.length
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
        : 0,
      count: data.count,
    }));

    // Time-of-day analysis
    const byHour = {};
    feedbacks.forEach((f) => {
      const iv = interviews.find(
        (i) => i._id.toString() === f.interviewId?.toString()
      );
      if (iv) {
        const hour = new Date(iv.startedAt || iv.createdAt).getHours();
        if (!byHour[hour]) byHour[hour] = [];
        byHour[hour].push(f.overallScore);
      }
    });
    const timeOfDay = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      avgScore: byHour[h]
        ? Math.round(byHour[h].reduce((a, b) => a + b, 0) / byHour[h].length)
        : 0,
      count: byHour[h]?.length || 0,
    }));

    // Duration analysis
    const byDuration = {};
    interviews.forEach((iv) => {
      const dur = iv.config?.duration || 10;
      if (!byDuration[dur]) byDuration[dur] = { scores: [], count: 0 };
      byDuration[dur].count += 1;
    });
    feedbacks.forEach((f) => {
      const iv = interviews.find(
        (i) => i._id.toString() === f.interviewId?.toString()
      );
      if (iv) {
        const dur = iv.config?.duration || 10;
        if (!byDuration[dur]) byDuration[dur] = { scores: [], count: 0 };
        byDuration[dur].scores.push(f.overallScore);
      }
    });
    const performanceByDuration = Object.entries(byDuration).map(
      ([duration, data]) => ({
        duration: Number(duration),
        avgScore: data.scores.length
          ? Math.round(
              data.scores.reduce((a, b) => a + b, 0) / data.scores.length
            )
          : 0,
        count: data.count,
      })
    );

    // Summary stats
    const allScores = feedbacks.map((f) => f.overallScore);
    const totalPracticeSeconds = interviews.reduce(
      (sum, iv) => sum + (iv.actualDuration || 0),
      0
    );

    const roleFreq = {};
    interviews.forEach((iv) => {
      const r = iv.config?.role || 'unknown';
      roleFreq[r] = (roleFreq[r] || 0) + 1;
    });
    const mostPracticedRole =
      Object.entries(roleFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const improvementRate =
      allScores.length >= 2
        ? Math.round(
            (allScores[allScores.length - 1] - allScores[0]) * 10
          ) / 10
        : 0;

    const summary = {
      totalInterviews: interviews.length,
      totalPracticeHours: Math.round((totalPracticeSeconds / 3600) * 10) / 10,
      bestScore: allScores.length ? Math.max(...allScores) : 0,
      worstScore: allScores.length ? Math.min(...allScores) : 0,
      avgScore: allScores.length
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 0,
      mostPracticedRole,
      improvementRate,
    };

    res.json({
      success: true,
      analytics: {
        heatmap,
        categoryTrends,
        performanceByType,
        performanceByDifficulty,
        performanceByRole,
        timeOfDay,
        performanceByDuration,
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};
