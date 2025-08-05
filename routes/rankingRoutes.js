import express from 'express';
import { 
  getRestaurantRankings, 
  getTopRestaurants, 
  getRankingStats 
} from '../controllers/rankingController.js';

const router = express.Router();

// Get restaurant rankings with filters
// Query params: cuisine, location, minComments, sortBy, order, page, limit
router.get('/restaurants', getRestaurantRankings);

// Get top restaurants by category
// Query params: category (overall, mostPositive, mostReviewed, trending), limit
router.get('/top', getTopRestaurants);

// Get ranking statistics
router.get('/stats', getRankingStats);

export default router;