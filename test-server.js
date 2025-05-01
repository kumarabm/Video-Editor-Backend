// Simple test server to check port binding
import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    status: 'ok', 
    message: 'Test server is running',
    nodeVersion: process.version
  }));
});

// Try to bind to port 5000
server.listen(5000, '0.0.0.0', () => {
  console.log('Test server running on http://0.0.0.0:5000');
  
  // Output environment information
  console.log(`Node.js version: ${process.version}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Working directory: ${process.cwd()}`);
  
  // List environment variables
  console.log('Environment variables:');
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('npm_') || key.startsWith('PATH')) continue;
    console.log(`  ${key}: ${value}`);
  }
});