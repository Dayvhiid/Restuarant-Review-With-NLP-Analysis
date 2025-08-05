import Restaurant from '../models/Restaurant.js';
import Comment from '../models/Comment.js';

// Get all restaurants
const getAllRestaurants = async (req, res) => {
  try {
    const { page = 1, limit = 10, cuisine } = req.query;
    
    // Build filter
    const filter = {};
    if (cuisine) {
      filter.cuisine = { $regex: cuisine, $options: 'i' };
    }

    const restaurants = await Restaurant.find(filter)
      .select('name location cuisine createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Restaurant.countDocuments(filter);

    // Get comment counts for each restaurant
    const restaurantsWithCounts = await Promise.all(
      restaurants.map(async (restaurant) => {
        const commentCount = await Comment.countDocuments({ restaurant: restaurant._id });
        return {
          ...restaurant.toJSON(),
          commentCount
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        restaurants: restaurantsWithCounts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRestaurants: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
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

// Get single restaurant with comments
const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeComments = false, page = 1, limit = 5 } = req.query;

    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    let result = {
      restaurant: restaurant.toJSON()
    };

    if (includeComments === 'true') {
      const comments = await Comment.find({ restaurant: id })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalComments = await Comment.countDocuments({ restaurant: id });

      result.comments = comments;
      result.commentsPagination = {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalComments / limit),
        totalComments,
        hasNext: page < Math.ceil(totalComments / limit),
        hasPrev: page > 1
      };
    }

    // Get comment statistics
    const commentStats = await Comment.aggregate([
      { $match: { restaurant: restaurant._id } },
      {
        $group: {
          _id: '$sentimentAnalysis.label',
          count: { $sum: 1 },
          avgScore: { $avg: '$sentimentAnalysis.score' }
        }
      }
    ]);

    result.sentimentStats = commentStats;

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching restaurant'
    });
  }
};

export { getAllRestaurants, getRestaurantById };