import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Get current directory (ES modules replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

/**
 * Check if a file exists
 */
export const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Delete a file if it exists
 */
export const deleteFile = async (filePath) => {
  try {
    if (await fileExists(filePath)) {
      await fs.unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    return false;
  }
};

/**
 * Get file size in bytes
 */
export const getFileSize = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    console.error(`Error getting file size for ${filePath}:`, error);
    return 0;
  }
};

/**
 * Generate path for original video
 */
export const getOriginalVideoPath = (filename) => {
  return path.join(rootDir, 'uploads', 'original', filename);
};

/**
 * Generate path for processed video
 */
export const getProcessedVideoPath = (operationType, videoId, filename) => {
  return path.join(rootDir, 'uploads', 'processed', `${operationType}_${videoId}_${filename}`);
};

/**
 * Generate path for rendered video
 */
export const getRenderedVideoPath = (renderId, filename) => {
  return path.join(rootDir, 'uploads', 'rendered', `render_${renderId}_${filename}`);
};

/**
 * Generate a temporary file path
 */
export const getTempFilePath = (prefix) => {
  const randomString = crypto.randomBytes(8).toString('hex');
  return path.join(rootDir, 'uploads', 'temp', `${prefix}_${randomString}`);
};

/**
 * Sanitize filename (remove unsafe characters)
 */
export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9_\-\.]/g, '_') // Replace unsafe chars with underscore
    .replace(/_{2,}/g, '_'); // Replace multiple underscores with a single one
};