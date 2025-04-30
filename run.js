// Main entry point for the JavaScript implementation
// This file starts the video editing platform API server
import express from 'express';
import { createServer } from 'http';
import { connectDatabase } from './server/db.js';
import { storage } from './server/storage.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
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

// Basic API status endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Basic stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const videos = await storage.getAllVideos(100);
    const recentJobs = await storage.getRecentJobs(10);
    
    // Calculate total storage used
    let totalSize = 0;
    videos.forEach(video => {
      if (video.fileSize) {
        totalSize += video.fileSize;
      }
    });
    
    // Format storage used
    const storageUsed = totalSize < 1024 * 1024 
      ? `${Math.round(totalSize / 1024)} KB` 
      : `${Math.round(totalSize / (1024 * 1024))} MB`;
    
    // Count active renders
    const activeRenders = recentJobs.filter(job => 
      job.status === 'processing' || job.status === 'pending'
    ).length;
    
    res.json({
      success: true,
      data: {
        apiStatus: 'operational',
        activeRenders,
        totalVideos: videos.length,
        storageUsed,
        recentJobs
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system statistics'
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('Video Editing Platform API Server');
});

// Read and parse the Swagger YAML file (if it exists)
try {
  const swaggerYamlPath = path.join(process.cwd(), 'swagger.yaml');
  if (fs.existsSync(swaggerYamlPath)) {
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
    
    console.log('Swagger UI enabled at /api-docs');
  }
} catch (error) {
  console.warn('Could not set up Swagger UI:', error.message);
}

// Initialize the server
(async () => {
  try {
    // Connect to MongoDB
    const dbConnected = await connectDatabase();
    if (!dbConnected) {
      console.warn('Running without database connection - using in-memory storage');
    }

    // Start the server on port 5000 with explicit binding to 0.0.0.0
    const port = 5000;
    const server = createServer(app);
    server.listen(port, '0.0.0.0', () => {
      console.log(`Video Editing Platform API server running at http://0.0.0.0:${port}`);
      console.log('Available API endpoints:');
      console.log('- GET /api/status - Check API status');
      console.log('- GET /api/stats - Get system statistics');
      console.log('- GET / - Root endpoint');
      if (fs.existsSync(path.join(process.cwd(), 'swagger.yaml'))) {
        console.log('- GET /api-docs - API documentation (Swagger UI)');
      }
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('Shutting down server...');
      server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
})();