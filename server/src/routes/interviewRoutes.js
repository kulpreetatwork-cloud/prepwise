import express from 'express';
import { getInterviews, getInterview, getFeedback, deleteInterview, deleteAllInterviews } from '../controllers/interviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getInterviews);
router.delete('/all', deleteAllInterviews);
router.get('/:id', getInterview);
router.get('/:id/feedback', getFeedback);
router.delete('/:id', deleteInterview);

export default router;
