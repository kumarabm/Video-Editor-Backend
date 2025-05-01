#!/usr/bin/env node
import { createServer } from 'http';
import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import multer from 'multer';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';

// Calculate __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting video editing platform API server...');

// Import controllers lazily to avoid potential circular dependencies
let videoController;
import('./server/controllers/videoController.js').then(module => {
  videoController = module;
  console.log('Video controller loaded successfully');
}).catch(err => {
  console.error('Error loading video controller:', err);
});

// Create a very basic express app
const app = express();

// Add middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Created upload directory: ${uploadDir}`);
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Keep original filename but sanitize it
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${sanitizedFilename}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1000 * 1024 * 1024 } // 1000MB max file size
});

// Error handler for file uploads
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        success: false, 
        message: 'File too large. Maximum file size is 1000MB.'
      });
    }
    return res.status(400).json({ 
      success: false, 
      message: `Upload error: ${err.message}`
    });
  }
  next(err);
};

// Setup Swagger UI if swagger.yaml exists
const swaggerYamlPath = path.join(__dirname, 'swagger.yaml');
if (fs.existsSync(swaggerYamlPath)) {
  try {
    const swaggerYaml = fs.readFileSync(swaggerYamlPath, 'utf8');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, {
      swaggerOptions: {
        url: '/swagger.yaml',
      },
    }));
    
    app.get('/swagger.yaml', (req, res) => {
      res.setHeader('Content-Type', 'text/yaml');
      res.send(swaggerYaml);
    });
    console.log('Swagger UI set up successfully at /api-docs');
  } catch (error) {
    console.error('Error setting up Swagger UI:', error);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Root endpoint with HTML interface
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

// Register API routes dynamically once controllers are loaded
setTimeout(() => {
  // Only register routes if videoController is loaded
  if (videoController) {
    console.log('Registering API routes...');
    
    try {
      // Dashboard stats endpoint
      app.get('/api/stats', videoController.getStats);
      
      // Video Upload Endpoint
      app.post('/api/videos/upload', upload.single('video'), handleUploadErrors, videoController.uploadVideo);
      
      // Get all videos
      app.get('/api/videos', videoController.getAllVideos);
      
      // Get a single video
      app.get('/api/videos/:id', videoController.getVideo);
      
      // Video Trimming Endpoint
      app.post('/api/videos/:id/trim', videoController.trimVideo);
      
      // Add Subtitles Endpoint
      app.post('/api/videos/:id/subtitles', videoController.addSubtitles);
      
      // Render Final Video Endpoint
      app.post('/api/videos/:id/render', videoController.renderVideo);
      
      // Get Render Status
      app.get('/api/renders/:renderId', videoController.getRenderStatus);
      
      // Download Final Video Endpoint
      app.get('/api/videos/:id/download', videoController.downloadVideo);
      
      console.log('All API routes registered successfully');
    } catch (error) {
      console.error('Error registering API routes:', error);
    }
  } else {
    console.warn('Video controller not loaded, API routes not registered');
  }
}, 2000); // Wait a bit for dynamic imports to complete

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

// Create HTTP server
const server = createServer(app);

// Bind to port 5000
const port = 5000;
console.log(`Attempting to bind to http://0.0.0.0:${port}...`);

// Set up error handler
server.on('error', (error) => {
  console.error('SERVER ERROR:', error.message);
  console.error(error.stack);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`);
  } else if (error.code === 'EACCES') {
    console.error(`Permission denied to bind to port ${port}.`);
  }
});

// Add dedicated listening event
server.on('listening', () => {
  console.log('Server is now listening for connections');
  const address = server.address();
  console.log('Server address info:', address);
});

// Start listening
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});

// Log process info
console.log('Process ID:', process.pid);
console.log('Node version:', process.version);
console.log('Platform:', process.platform);

// Handle SIGTERM and SIGINT
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});