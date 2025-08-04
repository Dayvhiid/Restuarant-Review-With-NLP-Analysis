import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

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