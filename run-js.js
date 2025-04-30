import { exec } from 'child_process';

console.log('Starting Video Editing API server with JavaScript...');
console.log('Press Ctrl+C to stop the server');

// Run the server using nodemon for auto-restart on changes
const server = exec('NODE_ENV=development nodemon --exec "node server/index.js" --ext js');

server.stdout.on('data', (data) => {
  console.log(data.toString().trim());
});

server.stderr.on('data', (data) => {
  console.error(data.toString().trim());
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.kill();
  process.exit(0);
});