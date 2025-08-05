import { SentimentAnalyzer } from "node-nlp";
import Restaurant from '../models/Restaurant.js';
import Comment from '../models/Comment.js';

const submitReview = async (req, res) => {
  try {
    const { resturantId, comment } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!resturantId || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide restaurant ID and comment'
      });
    }

    // Verify if restaurant exists
    const restaurant = await Restaurant.findById(resturantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Initialize sentiment analyzer
    const sentiment = new SentimentAnalyzer({ language: 'en' });
    
    // Perform sentiment analysis on the comment
    const analysis = await sentiment.getSentiment(comment);
    
    // Calculate sentiment score (normalize to -1 to 1 scale)
    const sentimentScore = analysis.score || 0;
    let sentimentLabel = 'neutral';
    
    if (sentimentScore > 0.1) {
      sentimentLabel = 'positive';
    } else if (sentimentScore < -0.1) {
      sentimentLabel = 'negative';
    }

    // Create and save the comment
    const newComment = new Comment({
      content: comment,
      user: userId,
      restaurant: resturantId,
      sentimentAnalysis: {
        score: sentimentScore,
        label: sentimentLabel,
        confidence: Math.abs(sentimentScore)
      }
    });

    await newComment.save();

    // Add comment reference to restaurant
    restaurant.comments.push(newComment._id);
    await restaurant.save();

    // Return the saved comment with populated data
    const populatedComment = await Comment.findById(newComment._id)
      .populate('user', 'name email')
      .populate('restaurant', 'name location cuisine');

    res.status(201).json({
      success: true,
      data: {
        comment: populatedComment,
        sentimentAnalysis: {
          score: sentimentScore,
          label: sentimentLabel,
          confidence: Math.abs(sentimentScore)
        }
      },
      message: 'Comment submitted and analyzed successfully'
    });

  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during review processing'
    });
  }
};

// Get all comments for a restaurant
const getRestaurantComments = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Verify restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Get paginated comments
    const comments = await Comment.find({ restaurant: restaurantId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalComments = await Comment.countDocuments({ restaurant: restaurantId });

    res.status(200).json({
      success: true,
      data: {
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
          location: restaurant.location,
          cuisine: restaurant.cuisine
        },
        comments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalComments / limit),
          totalComments,
          hasNext: page < Math.ceil(totalComments / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching comments'
    });
  }
};

// Get user's comments
const getUserComments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const comments = await Comment.find({ user: userId })
      .populate('restaurant', 'name location cuisine')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalComments = await Comment.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalComments / limit),
          totalComments,
          hasNext: page < Math.ceil(totalComments / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get user comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user comments'
    });
  }
};

export { submitReview, getRestaurantComments, getUserComments };