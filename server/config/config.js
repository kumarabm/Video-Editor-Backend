import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (ES modules replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

// Application configuration
const config = {
  // Upload settings
  upload: {
    maxFileSize: 1024 * 1024 * 500, // 500MB max file size
    allowedMimeTypes: [
      'video/mp4', 
      'video/webm', 
      'video/quicktime', 
      'video/x-msvideo', 
      'video/x-matroska'
    ]
  },
  
  // Storage paths
  storage: {
    uploadDir: path.join(rootDir, 'uploads'),
    originalVideosDir: path.join(rootDir, 'uploads', 'original'),
    processedVideosDir: path.join(rootDir, 'uploads', 'processed'),
    renderedVideosDir: path.join(rootDir, 'uploads', 'rendered'),
    tempDir: path.join(rootDir, 'uploads', 'temp')
  },
  
  // Database settings (fallback to environment variables)
  db: {
    uri: process.env.DATABASE_URL || 'mongodb://localhost:27017/video-platform'
  },
  
  // Video processing settings
  processing: {
    // Default quality settings for rendering
    quality: {
      low: { crf: '28', preset: 'faster' },
      medium: { crf: '23', preset: 'medium' },
      high: { crf: '18', preset: 'slow' }
    },
    
    // Default formats
    formats: ['mp4', 'webm', 'mov'],
    
    // Max concurrent operations
    concurrency: {
      videoProcessing: 2,
      rendering: 1
    }
  }
};

export default config;