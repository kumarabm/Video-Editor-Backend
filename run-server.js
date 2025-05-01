// Run the video platform server using JavaScript instead of TypeScript
import { exec } from 'child_process';

console.log('Starting Video Editing API server...');
console.log('Press Ctrl+C to stop the server');

// Set the environment variable to development for better debugging
process.env.NODE_ENV = 'development';

// Import and run the server directly
import('./server/index.js').catch(error => {
  console.error('Error starting server:', error);
  process.exit(1);
});