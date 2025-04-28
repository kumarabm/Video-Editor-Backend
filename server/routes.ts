import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import upload, { handleUploadErrors } from "./middlewares/upload";
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
} from "./controllers/videoController";

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);

  return httpServer;
}
