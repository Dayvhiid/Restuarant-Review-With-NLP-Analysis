import express from 'express';
import { submitReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Review routes - all protected (require authentication)
router.post('/submit', protect, submitReview);

export default router;
