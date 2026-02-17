import express from 'express';
import { getProfile, updateProfile, getDashboardStats } from '../controllers/userController.js';
import { getAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/profile').get(getProfile).put(updateProfile);
router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);

export default router;
