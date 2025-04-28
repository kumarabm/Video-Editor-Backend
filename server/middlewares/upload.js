import multer from 'multer';
import path from 'path';
import config from '../config/config.js';
import { promises as fs } from 'fs';
import { sanitizeFilename } from '../utils/fileUtils.js';

// Set up storage engine
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // Ensure directory exists
      await fs.mkdir(config.storage.originalVideosDir, { recursive: true });
      cb(null, config.storage.originalVideosDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    // Generate a safe filename: timestamp_sanitized-original-name.ext
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const basename = path.basename(originalName, extension);
    const safeBasename = sanitizeFilename(basename);
    const timestamp = Date.now();
    const filename = `${timestamp}_${safeBasename}${extension}`;
    cb(null, filename);
  }
});

// Set up file filter
const fileFilter = (req, file, cb) => {
  // Check if the file type is in allowed MIME types
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${config.upload.allowedMimeTypes.join(', ')}`), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize // Max file size in bytes
  }
});

// Handle upload errors
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size allowed is ${config.upload.maxFileSize / (1024 * 1024)}MB`
      });
    }
    return res.status(400).json({ 
      success: false,
      message: `Upload error: ${err.message}`
    });
  } else if (err) {
    // Another error occurred
    return res.status(400).json({ 
      success: false,
      message: err.message
    });
  }
  
  // No error, continue
  next();
};

export {
  upload,
  handleUploadErrors
};