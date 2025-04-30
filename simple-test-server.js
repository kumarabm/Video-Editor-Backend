// Extremely simple server to see if we can bind to port 5000
import http from 'http';

console.log('Starting simple test server...');

// Create a basic server
const server = http.createServer((req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Test server is running');
});

// Server error handler
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Try to listen on port 5000
const port = 5000;
console.log(`Attempting to bind to port ${port}...`);
server.listen(port, '0.0.0.0', () => {
  console.log(`Test server running on http://0.0.0.0:${port}`);
  const address = server.address();
  console.log('Server address info:', address);
});