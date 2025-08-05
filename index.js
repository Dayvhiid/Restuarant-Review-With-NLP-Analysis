import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';

dotenv.config();
const app = express();
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/restaurants', restaurantRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Restaurant Review API with NLP Analysis',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        signin: 'POST /api/auth/signin',
        me: 'GET /api/auth/me (Protected)'
      },
      restaurants: {
        getAll: 'GET /api/restaurants',
        getOne: 'GET /api/restaurants/:id'
      },
      reviews: {
        submit: 'POST /api/reviews/submit (Protected)'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Handle 404 routes
// app.all('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Route not found'
//   });
// });

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
         .then(() => {
              console.log('MongoDB connected successfully');
              app.listen(PORT, () => {
                  console.log(`Server running on port ${PORT}`);
              });
         }) 
         .catch((err) => {
            console.log('Database connection error:', err);
         });