import express from 'express';
import Restaurant from '../models/Restaurant.js';

const router = express.Router();

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({}).sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: {
        restaurants
      }
    });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching restaurants'
    });
  }
};

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @access  Public
const getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        restaurant
      }
    });
  } catch (error) {
    console.error('Get restaurant error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching restaurant'
    });
  }
};

// Restaurant routes
router.get('/', getAllRestaurants);
router.get('/:id', getRestaurant);

export default router;
