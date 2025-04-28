// This is a script to start the server using Node.js with JavaScript (not TypeScript)
console.log('Starting the Video Editing Platform API with Node.js...');

// Set environment
process.env.NODE_ENV = 'development';

// Import and run the main server file
import('../server/index.js').catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});