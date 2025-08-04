import express from 'express';
import { register, signin, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Authentication routes
router.post('/register', register);
router.post('/signin', signin);
router.get('/me', protect, getMe);

export default router;
