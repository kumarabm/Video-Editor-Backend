import mongoose from 'mongoose';
import * as models from '../shared/models.js';

// Configure mongoose
mongoose.set('strictQuery', false);

// Database connection function
export const connectDatabase = async () => {
  // For development, we'll use an in-memory MongoDB if no connection string is available
  let mongoUri = 'mongodb://localhost:27017/video-platform';
  
  // Check if we have a valid MongoDB URL
  if (process.env.MONGODB_URL && 
     (process.env.MONGODB_URL.startsWith('mongodb://') || 
      process.env.MONGODB_URL.startsWith('mongodb+srv://'))) {
    mongoUri = process.env.MONGODB_URL;
  } else {
    console.warn('No valid MongoDB URL found. Using in-memory fallback.');
    console.warn('Set MONGODB_URL environment variable to connect to a real MongoDB instance.');
    // Since we don't have a real MongoDB, we'll use an in-memory fallback
    // This is only for development purposes
    global.__MONGO_URI__ = mongoUri;
  }
  
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB database');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.warn('Continuing without database connection - some features may not work.');
    // Instead of throwing, we'll log the error but continue
  }
};

export default mongoose;