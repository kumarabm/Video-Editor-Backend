import fs from 'fs';
import path from 'path';
import { 
  createVideo, 
  createTrimOperation, 
  createSubtitlesOperation, 
  createRenderJob, 
  getSystemStats 
} from '../services/videoService.js';
import { storage } from '../storage.js';
import { fileExists } from '../utils/fileUtils.js';

/**
 * Upload a video
 */
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No video file uploaded' 
      });
    }

    const { originalname, path: filePath, size } = req.file;
    const { name = originalname, description = '' } = req.body;

    // Create video document in database
    const video = await createVideo(filePath, name, description);

    res.status(201).json({ 
      success: true, 
      message: 'Video uploaded successfully', 
      data: video 
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Get all videos
 */
const getAllVideos = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const videos = await storage.getAllVideos(limit);

    res.json({ 
      success: true, 
      data: videos 
    });
  } catch (error) {
    console.error('Error getting videos:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Get a single video
 */
const getVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    const video = await storage.getVideo(videoId);

    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }

    // Get operations for this video
    const operations = await storage.getVideoOperations(videoId);
    
    // Get renders for this video
    const renders = await storage.getVideoRenders(videoId);

    res.json({ 
      success: true, 
      data: {
        ...video.toObject(),
        operations,
        renders
      }
    });
  } catch (error) {
    console.error('Error getting video:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Trim a video
 */
const trimVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    const { startTime, endTime, output } = req.body;

    if (typeof startTime !== 'number' || typeof endTime !== 'number') {
      return res.status(400).json({ 
        success: false, 
        message: 'Start time and end time must be numbers' 
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start time must be less than end time' 
      });
    }

    // Create trim operation
    const operation = await createTrimOperation(
      videoId,
      startTime,
      endTime,
      output?.name
    );

    res.status(202).json({ 
      success: true, 
      message: 'Trim operation queued', 
      data: operation 
    });
  } catch (error) {
    console.error('Error trimming video:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Add subtitles to a video
 */
const addSubtitles = async (req, res) => {
  try {
    const videoId = req.params.id;
    const { subtitles, style } = req.body;

    if (!Array.isArray(subtitles) || subtitles.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subtitles must be a non-empty array' 
      });
    }

    // Validate each subtitle entry
    for (const sub of subtitles) {
      if (!sub.text || typeof sub.startTime !== 'number' || typeof sub.endTime !== 'number') {
        return res.status(400).json({ 
          success: false, 
          message: 'Each subtitle must have text, startTime, and endTime' 
        });
      }
      
      if (sub.startTime >= sub.endTime) {
        return res.status(400).json({ 
          success: false, 
          message: 'Subtitle start time must be less than end time' 
        });
      }
    }

    // Create subtitles operation
    const operation = await createSubtitlesOperation(
      videoId,
      subtitles,
      style
    );

    res.status(202).json({ 
      success: true, 
      message: 'Subtitles operation queued', 
      data: operation 
    });
  } catch (error) {
    console.error('Error adding subtitles:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Render a video with all operations
 */
const renderVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    const { operations, output } = req.body;

    // If operations is provided, validate it
    if (operations && (!Array.isArray(operations) || operations.some(op => typeof op !== 'string'))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Operations must be an array of operation IDs' 
      });
    }

    // Validate output if provided
    if (output) {
      if (output.format && !['mp4', 'webm', 'mov'].includes(output.format)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Format must be one of: mp4, webm, mov' 
        });
      }
      
      if (output.quality && !['low', 'medium', 'high'].includes(output.quality)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Quality must be one of: low, medium, high' 
        });
      }
    }

    // Create render job
    const render = await createRenderJob(
      videoId,
      operations,
      output
    );

    res.status(202).json({ 
      success: true, 
      message: 'Render job queued', 
      data: render 
    });
  } catch (error) {
    console.error('Error rendering video:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Get render status
 */
const getRenderStatus = async (req, res) => {
  try {
    const renderId = req.params.renderId;
    const render = await storage.getRender(renderId);

    if (!render) {
      return res.status(404).json({ 
        success: false, 
        message: 'Render not found' 
      });
    }

    res.json({ 
      success: true, 
      data: render 
    });
  } catch (error) {
    console.error('Error getting render status:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Download a rendered video
 */
const downloadVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    const { renderId } = req.query;

    if (!renderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Render ID is required' 
      });
    }

    // Get the render
    const render = await storage.getRender(renderId);
    if (!render) {
      return res.status(404).json({ 
        success: false, 
        message: 'Render not found' 
      });
    }

    // Check if render is complete
    if (render.status !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: `Render is not ready for download (status: ${render.status})` 
      });
    }

    // Check if output path exists
    const outputPath = render.output?.path;
    if (!outputPath) {
      return res.status(500).json({ 
        success: false, 
        message: 'Render output path not found' 
      });
    }

    // Check if file exists
    const exists = await fileExists(outputPath);
    if (!exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rendered file not found' 
      });
    }

    // Set content disposition and type
    const filename = path.basename(outputPath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');

    // Stream the file
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading video:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Get system stats for dashboard
 */
const getStats = async (req, res) => {
  try {
    const stats = await getSystemStats();
    res.json({ 
      success: true, 
      data: stats 
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export {
  uploadVideo,
  getAllVideos,
  getVideo,
  trimVideo,
  addSubtitles,
  renderVideo,
  getRenderStatus,
  downloadVideo,
  getStats
};