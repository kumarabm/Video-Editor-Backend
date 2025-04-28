import { createServer } from "http";
import { storage } from "./storage.js";
import { upload, handleUploadErrors } from "./middlewares/upload.js";
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
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
} from "./controllers/videoController.js";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read and parse the Swagger YAML file
const swaggerYaml = fs.readFileSync(path.join(process.cwd(), 'swagger.yaml'), 'utf8');

async function registerRoutes(app) {
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

  const httpServer = createServer(app);

  return httpServer;
}

export { registerRoutes };