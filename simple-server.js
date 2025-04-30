// A simple test server to verify port binding
import express from 'express';
import http from 'http';

const app = express();
const server = http.createServer(app);

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running correctly' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Video Editing Platform API - Simple Test Server');
});

// Start the server
const port = 5000;
server.listen(port, '0.0.0.0', () => {
  console.log(`Simple test server running at http://0.0.0.0:${port}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close();
  process.exit(0);
});