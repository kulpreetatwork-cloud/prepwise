import express from 'express';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  useTemplate,
} from '../controllers/templateController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getTemplates).post(createTemplate);
router.route('/:id').put(updateTemplate).delete(deleteTemplate);
router.post('/:id/use', useTemplate);

export default router;
