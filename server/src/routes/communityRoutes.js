import express from 'express';
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  votePost,
  getComments,
  createComment,
  voteComment,
  deleteComment,
} from '../controllers/communityController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/posts', getPosts);
router.get('/posts/:id', getPost);

router.use(protect);

router.post('/posts', createPost);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);
router.post('/posts/:id/vote', votePost);
router.get('/posts/:id/comments', getComments);
router.post('/posts/:id/comments', createComment);
router.post('/comments/:id/vote', voteComment);
router.delete('/comments/:id', deleteComment);

export default router;
