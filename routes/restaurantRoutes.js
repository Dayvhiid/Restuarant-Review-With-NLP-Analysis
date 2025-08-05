import express from "express";
import { getAllRestaurants, getRestaurantById } from "../controllers/restaurantController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get('/', protect,getAllRestaurants);
router.get('/:id', protect, getRestaurantById);

export default router;