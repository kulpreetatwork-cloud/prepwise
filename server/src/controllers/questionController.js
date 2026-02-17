import Question from '../models/Question.js';
import User from '../models/User.js';

export const getQuestions = async (req, res, next) => {
  try {
    const { role, type, difficulty, category, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;
    if (search) {
      filter.question = { $regex: search, $options: 'i' };
    }

    const questions = await Question.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await Question.countDocuments(filter);

    res.json({
      success: true,
      questions,
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

export const bookmarkQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const user = await User.findById(req.user._id);

    const idx = user.bookmarkedQuestions.indexOf(questionId);
    if (idx > -1) {
      user.bookmarkedQuestions.splice(idx, 1);
    } else {
      user.bookmarkedQuestions.push(questionId);
    }
    await user.save();

    res.json({
      success: true,
      bookmarkedQuestions: user.bookmarkedQuestions,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookmarkedQuestions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('bookmarkedQuestions');
    res.json({
      success: true,
      questions: user.bookmarkedQuestions,
    });
  } catch (error) {
    next(error);
  }
};
