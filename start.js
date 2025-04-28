// This is a simple script to start the server with Node.js directly
// instead of using typescript

console.log('Starting the server with Node.js directly...');
process.env.NODE_ENV = 'development';

// Execute the main server file using ES modules
import './server/index.js';