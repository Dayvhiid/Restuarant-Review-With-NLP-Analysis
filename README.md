# Restaurant Review with NLP Analysis

A Node.js REST API for restaurant reviews with sentiment analysis using Natural Language Processing. This application allows users to submit reviews, analyze sentiment, and rank restaurants based on review analysis.

## Features

- 🔐 **User Authentication** (JWT-based)
- 🍽️ **Restaurant Management** (CRUD operations)
- 📝 **Review System** with sentiment analysis
- 📊 **Restaurant Rankings** based on sentiment scores
- 🤖 **NLP Sentiment Analysis** using node-nlp
- 📱 **RESTful API** design
- 🗄️ **MongoDB** database integration

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **NLP**: node-nlp for sentiment analysis
- **Testing**: Jest, Supertest
- **Environment Management**: dotenv

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB database (local or cloud)
- npm or yarn package manager

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Dayvhiid/Restuarant-Review-With-NLP-Analysis.git
   cd Restuarant-Review-With-NLP-Analysis
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
   JWT_EXPIRES_IN=30d
   NODE_ENV=development
   PORT=5000
   ```

4. **Seed the database** (Optional)
   ```bash
   npm run seed:restaurants
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Sign In
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User (Protected)
```http
GET /api/auth/me
Authorization: Bearer your_jwt_token
```

### Restaurant Endpoints

#### Get All Restaurants
```http
GET /api/restaurants?page=1&limit=10&cuisine=italian
```

#### Get Single Restaurant
```http
GET /api/restaurants/:id?includeComments=true
```

### Review Endpoints

#### Submit Review (Protected)
```http
POST /api/reviews/submit
Authorization: Bearer your_jwt_token
Content-Type: application/json

{
  "resturantId": "restaurant_object_id",
  "comment": "The food was absolutely amazing! Great service too."
}
```

#### Get Restaurant Comments
```http
GET /api/reviews/restaurant/:restaurantId?page=1&limit=10
```

#### Get User's Comments (Protected)
```http
GET /api/reviews/my-comments?page=1&limit=10
Authorization: Bearer your_jwt_token
```

### Ranking Endpoints

#### Get Restaurant Rankings
```http
GET /api/rankings/restaurants?sortBy=overallScore&order=desc&cuisine=italian&minComments=3
```

**Query Parameters:**
- `sortBy`: `overallScore`, `avgSentimentScore`, `positivePercentage`, `totalComments`, `name`, `createdAt`
- `order`: `desc` or `asc`
- `cuisine`: Filter by cuisine type
- `location`: Filter by location
- `minComments`: Minimum number of comments required
- `page`: Page number for pagination
- `limit`: Number of results per page

#### Get Top Restaurants
```http
GET /api/rankings/top?category=overall&limit=10
```

**Categories:**
- `overall`: Best overall ratings
- `mostPositive`: Highest positive percentage
- `mostReviewed`: Most reviewed restaurants
- `trending`: Recently active with positive sentiment

#### Get Ranking Statistics
```http
GET /api/rankings/stats
```

## Data Models

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['user', 'admin'], default: 'user'),
  createdAt: Date,
  updatedAt: Date
}
```

### Restaurant Model
```javascript
{
  name: String (required),
  location: String,
  cuisine: String (required),
  comments: [ObjectId] (ref: 'Comment'),
  createdAt: Date
}
```

### Comment Model
```javascript
{
  content: String (required),
  user: ObjectId (ref: 'User', required),
  restaurant: ObjectId (ref: 'Restaurant', required),
  sentimentAnalysis: {
    score: Number (default: 0),
    label: String (enum: ['positive', 'negative', 'neutral']),
    confidence: Number (default: 0)
  },
  createdAt: Date
}
```

## Sentiment Analysis

The application uses **node-nlp** to perform sentiment analysis on restaurant reviews:

- **Positive**: Score > 0.1 (Happy, satisfied, excellent, etc.)
- **Negative**: Score < -0.1 (Disappointed, terrible, bad, etc.)
- **Neutral**: Score between -0.1 and 0.1

### Ranking Algorithm

Restaurants are ranked using an **Overall Score** calculated as:
```
Overall Score = Average Sentiment Score × Boost Factor
Boost Factor = min(1 + (Total Comments / 10), 2)
```

This algorithm considers both review quality and quantity, giving a slight boost to restaurants with more reviews while capping the boost at 2x.

## Available Scripts

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Seed restaurants database
npm run seed:restaurants

# Clear restaurants database
npm run clear:restaurants
```

## Testing

The project includes comprehensive tests using Jest and Supertest:

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

Test coverage includes:
- Authentication endpoints
- User registration and login
- Protected routes
- JWT token validation
- Database operations
- Error handling

## Project Structure

```
restuarant_review_with_NLP_analysis/
├── controllers/
│   ├── authController.js      # Authentication logic
│   ├── reviewController.js    # Review and sentiment analysis
│   └── rankingController.js   # Restaurant rankings
├── middleware/
│   └── auth.js               # JWT authentication middleware
├── models/
│   ├── User.js               # User data model
│   ├── Restaurant.js         # Restaurant data model
│   └── Comment.js            # Comment data model
├── routes/
│   ├── authRoutes.js         # Authentication routes
│   ├── reviewRoutes.js       # Review routes
│   ├── restaurantRoutes.js   # Restaurant routes
│   └── rankingRoutes.js      # Ranking routes
├── seeders/
│   └── restaurantSeeder.js   # Database seeding
├── tests/
│   ├── auth.test.js          # Authentication tests
│   └── setup.js              # Test configuration
├── .env                      # Environment variables
├── .env.test                 # Test environment variables
├── index.js                  # Main application file
├── package.json              # Dependencies and scripts
└── README.md                 # Project documentation
```

## Error Handling

The API includes comprehensive error handling for:
- JSON parsing errors
- Authentication failures
- Validation errors
- Database connection issues
- Invalid ObjectId formats
- 404 Not Found errors

All errors return a consistent JSON format:
```json
{
  "success": false,
  "message": "Error description",
  "details": "Additional error details (optional)"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGO_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT tokens | Yes | - |
| `JWT_EXPIRES_IN` | JWT token expiration time | No | 30d |
| `NODE_ENV` | Node environment | No | development |
| `PORT` | Server port number | No | 5000 |

## API Response Format

All API responses follow this consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Success message (optional)"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "details": "Additional details (optional)"
}
```

## License

This project is licensed under the ISC License.

## Author

**Dayvhiid**
- GitHub: [@Dayvhiid](https://github.com/Dayvhiid)

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Happy Coding! 🚀**
