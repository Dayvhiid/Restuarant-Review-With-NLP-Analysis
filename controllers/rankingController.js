import Restaurant from '../models/Restaurant.js';
import Comment from '../models/Comment.js';

// Calculate restaurant rankings based on sentiment analysis
const getRestaurantRankings = async (req, res) => {
  try {
    const { 
      cuisine, 
      location, 
      minComments = 1,
      sortBy = 'overallScore',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build match criteria
    const matchCriteria = {};
    if (cuisine) {
      matchCriteria.cuisine = { $regex: cuisine, $options: 'i' };
    }
    if (location) {
      matchCriteria.location = { $regex: location, $options: 'i' };
    }

    // Aggregation pipeline to calculate rankings
    const rankings = await Restaurant.aggregate([
      { $match: matchCriteria },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'restaurant',
          as: 'comments'
        }
      },
      {
        $addFields: {
          totalComments: { $size: '$comments' },
          positiveComments: {
            $size: {
              $filter: {
                input: '$comments',
                cond: { $eq: ['$$this.sentimentAnalysis.label', 'positive'] }
              }
            }
          },
          negativeComments: {
            $size: {
              $filter: {
                input: '$comments',
                cond: { $eq: ['$$this.sentimentAnalysis.label', 'negative'] }
              }
            }
          },
          neutralComments: {
            $size: {
              $filter: {
                input: '$comments',
                cond: { $eq: ['$$this.sentimentAnalysis.label', 'neutral'] }
              }
            }
          },
          avgSentimentScore: {
            $cond: {
              if: { $gt: [{ $size: '$comments' }, 0] },
              then: { $avg: '$comments.sentimentAnalysis.score' },
              else: 0
            }
          }
        }
      },
      {
        $addFields: {
          positivePercentage: {
            $cond: {
              if: { $gt: ['$totalComments', 0] },
              then: { $multiply: [{ $divide: ['$positiveComments', '$totalComments'] }, 100] },
              else: 0
            }
          },
          negativePercentage: {
            $cond: {
              if: { $gt: ['$totalComments', 0] },
              then: { $multiply: [{ $divide: ['$negativeComments', '$totalComments'] }, 100] },
              else: 0
            }
          },
          // Overall score calculation (weighted by number of comments)
          overallScore: {
            $cond: {
              if: { $gt: ['$totalComments', 0] },
              then: {
                $multiply: [
                  '$avgSentimentScore',
                  {
                    $min: [
                      { $add: [1, { $divide: ['$totalComments', 10] }] }, // Boost for more comments, cap at 2x
                      2
                    ]
                  }
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $match: {
          totalComments: { $gte: parseInt(minComments) }
        }
      },
      {
        $addFields: {
          rank: { $meta: 'searchScore' }
        }
      },
      {
        $sort: {
          [sortBy]: order === 'desc' ? -1 : 1
        }
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          comments: 0 // Remove comments array from output
        }
      }
    ]);

    // Add ranking position
    const rankedRestaurants = rankings.map((restaurant, index) => ({
      ...restaurant,
      rankPosition: (page - 1) * limit + index + 1
    }));

    // Get total count for pagination
    const totalCount = await Restaurant.aggregate([
      { $match: matchCriteria },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'restaurant',
          as: 'comments'
        }
      },
      {
        $addFields: {
          totalComments: { $size: '$comments' }
        }
      },
      {
        $match: {
          totalComments: { $gte: parseInt(minComments) }
        }
      },
      {
        $count: 'total'
      }
    ]);

    const total = totalCount[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        rankings: rankedRestaurants,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRestaurants: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        filters: {
          cuisine,
          location,
          minComments: parseInt(minComments),
          sortBy,
          order
        }
      }
    });

  } catch (error) {
    console.error('Get rankings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating rankings'
    });
  }
};

// Get top restaurants by category
const getTopRestaurants = async (req, res) => {
  try {
    const { category = 'overall', limit = 10 } = req.query;

    let sortCriteria = {};
    let matchCriteria = { totalComments: { $gte: 3 } }; // Minimum 3 comments for reliability

    switch (category) {
      case 'mostPositive':
        sortCriteria = { positivePercentage: -1 };
        break;
      case 'mostReviewed':
        sortCriteria = { totalComments: -1 };
        break;
      case 'trending':
        // Restaurants with recent positive reviews
        matchCriteria.recentActivity = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }; // Last 30 days
        sortCriteria = { overallScore: -1 };
        break;
      default: // overall
        sortCriteria = { overallScore: -1 };
    }

    const topRestaurants = await Restaurant.aggregate([
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'restaurant',
          as: 'comments'
        }
      },
      {
        $addFields: {
          totalComments: { $size: '$comments' },
          positiveComments: {
            $size: {
              $filter: {
                input: '$comments',
                cond: { $eq: ['$$this.sentimentAnalysis.label', 'positive'] }
              }
            }
          },
          avgSentimentScore: {
            $cond: {
              if: { $gt: [{ $size: '$comments' }, 0] },
              then: { $avg: '$comments.sentimentAnalysis.score' },
              else: 0
            }
          },
          recentActivity: { $max: '$comments.createdAt' }
        }
      },
      {
        $addFields: {
          positivePercentage: {
            $cond: {
              if: { $gt: ['$totalComments', 0] },
              then: { $multiply: [{ $divide: ['$positiveComments', '$totalComments'] }, 100] },
              else: 0
            }
          },
          overallScore: {
            $cond: {
              if: { $gt: ['$totalComments', 0] },
              then: {
                $multiply: [
                  '$avgSentimentScore',
                  { $min: [{ $add: [1, { $divide: ['$totalComments', 10] }] }, 2] }
                ]
              },
              else: 0
            }
          }
        }
      },
      { $match: matchCriteria },
      { $sort: sortCriteria },
      { $limit: parseInt(limit) },
      {
        $project: {
          comments: 0
        }
      }
    ]);

    // Add ranking positions
    const rankedTop = topRestaurants.map((restaurant, index) => ({
      ...restaurant,
      rankPosition: index + 1
    }));

    res.status(200).json({
      success: true,
      data: {
        category,
        topRestaurants: rankedTop,
        count: rankedTop.length
      }
    });

  } catch (error) {
    console.error('Get top restaurants error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching top restaurants'
    });
  }
};

// Get ranking statistics
const getRankingStats = async (req, res) => {
  try {
    // Overall statistics
    const overallStats = await Restaurant.aggregate([
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'restaurant',
          as: 'comments'
        }
      },
      {
        $addFields: {
          totalComments: { $size: '$comments' },
          hasComments: { $gt: [{ $size: '$comments' }, 0] }
        }
      },
      {
        $group: {
          _id: null,
          totalRestaurants: { $sum: 1 },
          restaurantsWithReviews: { $sum: { $cond: ['$hasComments', 1, 0] } },
          totalComments: { $sum: '$totalComments' },
          avgCommentsPerRestaurant: { $avg: '$totalComments' }
        }
      }
    ]);

    // Cuisine rankings
    const cuisineStats = await Restaurant.aggregate([
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'restaurant',
          as: 'comments'
        }
      },
      {
        $addFields: {
          totalComments: { $size: '$comments' },
          avgSentimentScore: {
            $cond: {
              if: { $gt: [{ $size: '$comments' }, 0] },
              then: { $avg: '$comments.sentimentAnalysis.score' },
              else: 0
            }
          }
        }
      },
      {
        $group: {
          _id: '$cuisine',
          restaurantCount: { $sum: 1 },
          totalComments: { $sum: '$totalComments' },
          avgSentimentScore: { $avg: '$avgSentimentScore' }
        }
      },
      {
        $sort: { avgSentimentScore: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: overallStats[0] || {},
        cuisineRankings: cuisineStats
      }
    });

  } catch (error) {
    console.error('Get ranking stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching ranking statistics'
    });
  }
};

export { getRestaurantRankings, getTopRestaurants, getRankingStats };