import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import config from '../config/config';

const fsAccess = promisify(fs.access);
const fsUnlink = promisify(fs.unlink);
const fsStat = promisify(fs.stat);

/**
 * Check if a file exists
 */
export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fsAccess(filePath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Delete a file if it exists
 */
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    if (await fileExists(filePath)) {
      await fsUnlink(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Error deleting file ${filePath}:`, err);
    return false;
  }
};

/**
 * Get file size in bytes
 */
export const getFileSize = async (filePath: string): Promise<number> => {
  try {
    const stats = await fsStat(filePath);
    return stats.size;
  } catch (err) {
    console.error(`Error getting file size for ${filePath}:`, err);
    return 0;
  }
};

/**
 * Generate path for original video
 */
export const getOriginalVideoPath = (filename: string): string => {
  return path.join(config.storage.originalVideosDir, filename);
};

/**
 * Generate path for processed video
 */
export const getProcessedVideoPath = (operationType: string, videoId: number, filename: string): string => {
  return path.join(config.storage.processedVideosDir, `${operationType}_${videoId}_${filename}`);
};

/**
 * Generate path for rendered video
 */
export const getRenderedVideoPath = (renderId: number, filename: string): string => {
  return path.join(config.storage.renderDir, `render_${renderId}_${filename}`);
};

/**
 * Generate a temporary file path
 */
export const getTempFilePath = (prefix: string): string => {
  return path.join(config.storage.tmpDir, `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.tmp`);
};

/**
 * Sanitize filename (remove unsafe characters)
 */
export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
};
