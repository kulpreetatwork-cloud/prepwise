import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/token', protect, (req, res) => {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) return res.status(500).json({ error: 'STT service not configured' });
  res.json({ key });
});

export default router;
