import path from 'path';

const config = {
  // Storage settings
  storage: {
    baseDir: path.join(process.cwd(), 'uploads'),
    originalVideosDir: path.join(process.cwd(), 'uploads', 'original'),
    processedVideosDir: path.join(process.cwd(), 'uploads', 'processed'),
    renderedVideosDir: path.join(process.cwd(), 'uploads', 'rendered'),
    tempDir: path.join(process.cwd(), 'uploads', 'temp')
  },
  
  // Upload settings
  upload: {
    maxFileSize: 1024 * 1024 * 100, // 100MB
    allowedMimeTypes: [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'video/mpeg'
    ]
  },
  
  // Processing settings
  processing: {
    maxConcurrentJobs: 2,
    defaultOutputFormat: 'mp4',
    qualityPresets: {
      low: { crf: '28', preset: 'faster' },
      medium: { crf: '23', preset: 'medium' },
      high: { crf: '18', preset: 'slow' }
    }
  }
};

export default config;