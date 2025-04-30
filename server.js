// Server.js - Main entry point for JavaScript implementation
console.log('Starting Video Editing API server...');

// Import the actual server implementation from the JavaScript file
import('./server/index.js').catch(error => {
  console.error('Failed to import server implementation:', error);
  process.exit(1);
});