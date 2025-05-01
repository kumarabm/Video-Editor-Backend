#!/usr/bin/env node
import { connectDatabase } from './server/db.js';

// ASCII color codes for better readability
const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m'
};

// Helper function to log with colors
function logWithColor(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

// Main test function
async function testMongoDBConnection() {
  logWithColor('🚀 Testing MongoDB Connection', COLORS.CYAN);
  console.log('===================================');
  
  logWithColor('MongoDB Connection URL:', COLORS.YELLOW);
  if (process.env.MONGODB_URL) {
    console.log(`Connection string: ${process.env.MONGODB_URL.substring(0, 15)}...`);
  } else if (process.env.DATABASE_URL) {
    logWithColor('Found DATABASE_URL but no MONGODB_URL. DATABASE_URL is for PostgreSQL, not MongoDB', COLORS.YELLOW);
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL.substring(0, 15)}...`);
  } else {
    logWithColor('No MONGODB_URL or DATABASE_URL found in environment', COLORS.RED);
  }
  
  try {
    logWithColor('Attempting to connect to MongoDB...', COLORS.BLUE);
    const connected = await connectDatabase();
    
    if (connected) {
      logWithColor('✅ Successfully connected to MongoDB', COLORS.GREEN);
    } else {
      logWithColor('❌ Failed to connect to MongoDB - using in-memory storage fallback', COLORS.RED);
      logWithColor('To connect to a real MongoDB database, set the MONGODB_URL environment variable', COLORS.YELLOW);
      logWithColor('Example: MONGODB_URL=mongodb://username:password@hostname:port/dbname', COLORS.YELLOW);
    }
  } catch (error) {
    logWithColor('❌ Error testing MongoDB connection:', COLORS.RED);
    console.error(error);
  }
  
  console.log('===================================');
}

// Run the test
testMongoDBConnection().catch(error => {
  console.error('Unexpected error:', error);
});