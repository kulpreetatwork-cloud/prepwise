import express from 'express';
import { getQuestions, bookmarkQuestion, getBookmarkedQuestions } from '../controllers/questionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getQuestions);

router.use(protect);
router.get('/bookmarked', getBookmarkedQuestions);
router.post('/:questionId/bookmark', bookmarkQuestion);

export default router;
