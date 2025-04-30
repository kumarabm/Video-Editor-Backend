// Main entry point for JavaScript implementation
// This is a more stable version that explicitly binds to port 5000
import express from 'express';
import { createServer } from 'http';
import { connectDatabase } from './server/db.js';
import { storage } from './server/storage.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { 
  uploadVideo, 
  getAllVideos, 
  getVideo, 
  trimVideo, 
  addSubtitles, 
  renderVideo, 
  getRenderStatus,
  downloadVideo,
  getStats 
} from './server/controllers/videoController.js';
import { upload, handleUploadErrors } from './server/middlewares/upload.js';
import swaggerUi from 'swagger-ui-express';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create directories for storing videos if they don't exist
const uploadDir = path.join(process.cwd(), 'uploads');
const originalVideosDir = path.join(uploadDir, 'original');
const processedVideosDir = path.join(uploadDir, 'processed');
const renderedVideosDir = path.join(uploadDir, 'rendered');
const tempDir = path.join(uploadDir, 'temp');

[uploadDir, originalVideosDir, processedVideosDir, renderedVideosDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Read and parse the Swagger YAML file
try {
  console.log('Setting up Swagger UI...');
  const swaggerYamlPath = path.join(process.cwd(), 'swagger.yaml');
  console.log(`Looking for Swagger YAML at: ${swaggerYamlPath}`);
  
  if (fs.existsSync(swaggerYamlPath)) {
    console.log('Swagger YAML file found, setting up endpoints');
    const swaggerYaml = fs.readFileSync(swaggerYamlPath, 'utf8');
    
    // Set up Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, {
      swaggerOptions: {
        url: '/swagger.yaml', // URL to fetch the Swagger definition
      },
    }));
    
    // Serve the Swagger YAML file
    app.get('/swagger.yaml', (req, res) => {
      res.setHeader('Content-Type', 'text/yaml');
      res.send(swaggerYaml);
    });
    
    console.log('Swagger UI endpoints set up successfully');
  } else {
    console.warn('Swagger YAML file not found at:', swaggerYamlPath);
    console.warn('Swagger UI will not be available');
  }
} catch (error) {
  console.error('Error setting up Swagger UI:', error);
  console.error('Continuing without Swagger UI');
}

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Dashboard stats endpoint
app.get('/api/stats', getStats);

// Video Upload Endpoint
app.post('/api/videos/upload', upload.single('video'), handleUploadErrors, uploadVideo);

// Get all videos
app.get('/api/videos', getAllVideos);

// Get a single video
app.get('/api/videos/:id', getVideo);

// Video Trimming Endpoint
app.post('/api/videos/:id/trim', trimVideo);

// Add Subtitles Endpoint
app.post('/api/videos/:id/subtitles', addSubtitles);

// Render Final Video Endpoint
app.post('/api/videos/:id/render', renderVideo);

// Get Render Status
app.get('/api/renders/:renderId', getRenderStatus);

// Download Final Video Endpoint
app.get('/api/videos/:id/download', downloadVideo);
  
// Project download route
app.get('/download-project', (req, res) => {
  const zipPath = path.join(process.cwd(), 'dist', 'video-editing-platform.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'video-editing-platform.zip');
  } else {
    res.status(404).json({ 
      success: false, 
      message: 'Project zip file not found. Run "node scripts/archive.js" first.' 
    });
  }
});

// Root endpoint for the frontend (can be enhanced later)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Video Editing Platform API</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #2c3e50;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
        .card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
          background-color: #f9f9f9;
        }
        .endpoints {
          list-style-type: none;
          padding: 0;
        }
        .endpoints li {
          margin-bottom: 10px;
          padding: 8px;
          border-left: 3px solid #3498db;
          background-color: #ecf0f1;
          padding-left: 10px;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        .get {
          background-color: #2ecc71;
          color: white;
        }
        .post {
          background-color: #3498db;
          color: white;
        }
        a {
          color: #3498db;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <h1>Video Editing Platform API</h1>
      <div class="card">
        <h2>API Status: <span style="color: #2ecc71;">Operational</span></h2>
        <p>Welcome to the Video Editing Platform API. This API provides endpoints for video processing operations.</p>
        <p><a href="/api-docs">API Documentation</a></p>
      </div>
      
      <h2>Available Endpoints</h2>
      <ul class="endpoints">
        <li><span class="badge get">GET</span> <code>/api/status</code> - Check API status</li>
        <li><span class="badge get">GET</span> <code>/api/stats</code> - Get system statistics</li>
        <li><span class="badge post">POST</span> <code>/api/videos/upload</code> - Upload a video</li>
        <li><span class="badge get">GET</span> <code>/api/videos</code> - Get all videos</li>
        <li><span class="badge get">GET</span> <code>/api/videos/:id</code> - Get a single video</li>
        <li><span class="badge post">POST</span> <code>/api/videos/:id/trim</code> - Trim a video</li>
        <li><span class="badge post">POST</span> <code>/api/videos/:id/subtitles</code> - Add subtitles to a video</li>
        <li><span class="badge post">POST</span> <code>/api/videos/:id/render</code> - Render a video with all operations</li>
        <li><span class="badge get">GET</span> <code>/api/renders/:renderId</code> - Get render status</li>
        <li><span class="badge get">GET</span> <code>/api/videos/:id/download</code> - Download rendered video</li>
      </ul>
    </body>
    </html>
  `);
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ 
    success: false,
    message 
  });
  console.error(err);
});

// Start server with additional debugging
(async () => {
  try {
    console.log('Starting server initialization...');
    
    // Connect to MongoDB with additional logging
    console.log('Attempting to connect to MongoDB...');
    const dbConnected = await connectDatabase();
    if (!dbConnected) {
      console.warn('Running without database connection - using in-memory storage');
    } else {
      console.log('Successfully connected to MongoDB');
    }
    
    console.log('Creating HTTP server...');
    const server = createServer(app);
    console.log('HTTP server created');
    
    // Start the server on port 5000 with explicit binding to 0.0.0.0
    const port = 5000;
    console.log(`Attempting to bind to http://0.0.0.0:${port}...`);
    
    // Make sure the server logs any errors
    server.on('error', (error) => {
      console.error('SERVER ERROR:', error.message);
      console.error(error.stack);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Try using a different port.`);
      } else if (error.code === 'EACCES') {
        console.error(`Permission denied to bind to port ${port}. Try using a port number above 1024.`);
      }
    });
    
    // Explicitly log each step
    console.log('About to call server.listen()...');
    server.listen(port, '0.0.0.0', () => {
      console.log(`SUCCESS: Video Editing Platform API server running at http://0.0.0.0:${port}`);
      console.log('API documentation available at http://0.0.0.0:5000/api-docs');
      
      // Print all bound addresses
      const addresses = server.address();
      console.log('Server bound address info:', JSON.stringify(addresses));
    });
    console.log('server.listen() called, waiting for it to bind...');
    
    // Add more event listeners for additional debugging
    server.on('listening', () => {
      console.log('Server is now listening for connections');
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('Shutting down server...');
      server.close();
      process.exit(0);
    });
    
    // Log that we've reached the end of the try block
    console.log('Server initialization completed');
  } catch (error) {
    console.error('CRITICAL ERROR starting server:', error);
    console.error(error.stack);
    process.exit(1);
  }
})();