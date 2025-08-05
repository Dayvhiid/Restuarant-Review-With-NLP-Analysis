import { SentimentAnalyzer } from "node-nlp";
import Restaurant from '../models/Restaurant.js';

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

    // Return sentiment analysis results
    res.status(200).json({
      success: true,
      data: {
        restaurantId: resturantId,
        restaurant: {
          name: restaurant.name,
          location: restaurant.location,
          cuisine: restaurant.cuisine
        },
        userId: userId,
        comment: comment,
        sentimentAnalysis: {
          score: sentimentScore,
          label: sentimentLabel,
          confidence: Math.abs(sentimentScore)
        }
      },
      message: 'Sentiment analysis completed successfully'
    });

  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during review processing'
    });
  }
};

export { submitReview };

