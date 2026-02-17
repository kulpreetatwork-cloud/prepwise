import Interview from '../models/Interview.js';
import Feedback from '../models/Feedback.js';

export const getInterviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, status, sortBy = 'createdAt' } = req.query;

    const filter = { userId: req.user._id };
    if (role) filter['config.role'] = role;
    if (status) filter.status = status;

    const interviews = await Interview.find(filter)
      .sort({ [sortBy]: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await Interview.countDocuments(filter);

    const interviewsWithFeedback = await Promise.all(
      interviews.map(async (interview) => {
        const feedback = await Feedback.findOne({ interviewId: interview._id })
          .select('overallScore grade')
          .lean();
        return { ...interview, feedback };
      })
    );

    res.json({
      success: true,
      interviews: interviewsWithFeedback,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!interview) {
      res.status(404);
      throw new Error('Interview not found');
    }

    const feedback = await Feedback.findOne({ interviewId: interview._id }).lean();

    res.json({
      success: true,
      interview,
      feedback,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findOne({
      interviewId: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!feedback) {
      res.status(404);
      throw new Error('Feedback not found');
    }

    const interview = await Interview.findById(req.params.id)
      .select('config startedAt endedAt actualDuration')
      .lean();

    res.json({
      success: true,
      feedback,
      interview,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!interview) {
      res.status(404);
      throw new Error('Interview not found');
    }

    await Feedback.deleteOne({ interviewId: interview._id });
    await Interview.deleteOne({ _id: interview._id });

    res.json({ success: true, message: 'Interview deleted' });
  } catch (error) {
    next(error);
  }
};

export const deleteAllInterviews = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ userId: req.user._id }).select('_id').lean();
    const interviewIds = interviews.map((i) => i._id);

    await Feedback.deleteMany({ interviewId: { $in: interviewIds } });
    await Interview.deleteMany({ userId: req.user._id });

    res.json({ success: true, message: `Deleted ${interviewIds.length} interviews` });
  } catch (error) {
    next(error);
  }
};
