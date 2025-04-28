import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { 
  createVideo, 
  createTrimOperation, 
  createSubtitlesOperation, 
  createRenderJob,
  getSystemStats
} from '../services/videoService';
import { storage } from '../storage';
import { trimRequestSchema, subtitleRequestSchema, renderRequestSchema } from '@shared/schema';
import { fileExists } from '../utils/fileUtils';
import { sanitizeFilename } from '../utils/fileUtils';

/**
 * Upload a video
 */
export const uploadVideo = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded'
      });
    }

    // Get file details from multer
    const { path: filePath, originalname, mimetype, size } = req.file;
    const name = req.body.name || originalname;
    const description = req.body.description || '';

    // Create video in database
    const video = await createVideo(filePath, name, description);

    // Return response
    return res.status(201).json({
      success: true,
      data: {
        id: video.id,
        name: video.name,
        description: video.description,
        duration: video.duration,
        fileSize: video.fileSize,
        status: video.status,
        createdAt: video.createdAt,
        url: `/api/videos/${video.id}`
      }
    });
  } catch (error) {
    console.error('Upload video error:', error);
    return res.status(500).json({
      success: false,
      message: `Error uploading video: ${error.message}`
    });
  }
};

/**
 * Get all videos
 */
export const getAllVideos = async (req: Request, res: Response) => {
  try {
    const videos = await storage.getAllVideos();
    
    return res.status(200).json({
      success: true,
      data: videos.map(video => ({
        id: video.id,
        name: video.name,
        description: video.description,
        duration: video.duration,
        fileSize: video.fileSize,
        status: video.status,
        createdAt: video.createdAt,
        url: `/api/videos/${video.id}`
      }))
    });
  } catch (error) {
    console.error('Get all videos error:', error);
    return res.status(500).json({
      success: false,
      message: `Error getting videos: ${error.message}`
    });
  }
};

/**
 * Get a single video
 */
export const getVideo = async (req: Request, res: Response) => {
  try {
    const videoId = parseInt(req.params.id);
    if (isNaN(videoId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video ID'
      });
    }

    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: video.id,
        name: video.name,
        description: video.description,
        duration: video.duration,
        fileSize: video.fileSize,
        status: video.status,
        createdAt: video.createdAt,
        url: `/api/videos/${video.id}`
      }
    });
  } catch (error) {
    console.error('Get video error:', error);
    return res.status(500).json({
      success: false,
      message: `Error getting video: ${error.message}`
    });
  }
};

/**
 * Trim a video
 */
export const trimVideo = async (req: Request, res: Response) => {
  try {
    const videoId = parseInt(req.params.id);
    if (isNaN(videoId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video ID'
      });
    }

    // Validate request body
    const validationResult = trimRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.format()
      });
    }

    const { startTime, endTime, output } = validationResult.data;
    
    // Create trim operation
    const operation = await createTrimOperation(
      videoId,
      startTime,
      endTime,
      output?.name
    );

    // Calculate estimated completion time (simple estimate)
    const estimatedCompletionTime = new Date();
    estimatedCompletionTime.setMinutes(estimatedCompletionTime.getMinutes() + 1);

    return res.status(202).json({
      success: true,
      data: {
        id: operation.id,
        videoId: operation.videoId,
        type: operation.type,
        status: operation.status,
        params: operation.params,
        createdAt: operation.createdAt,
        estimatedCompletionTime
      }
    });
  } catch (error) {
    console.error('Trim video error:', error);
    return res.status(500).json({
      success: false,
      message: `Error trimming video: ${error.message}`
    });
  }
};

/**
 * Add subtitles to a video
 */
export const addSubtitles = async (req: Request, res: Response) => {
  try {
    const videoId = parseInt(req.params.id);
    if (isNaN(videoId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video ID'
      });
    }

    // Validate request body
    const validationResult = subtitleRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.format()
      });
    }

    const { subtitles, style } = validationResult.data;
    
    // Create subtitles operation
    const operation = await createSubtitlesOperation(
      videoId,
      subtitles,
      style
    );

    // Calculate estimated completion time (simple estimate)
    const estimatedCompletionTime = new Date();
    estimatedCompletionTime.setMinutes(estimatedCompletionTime.getMinutes() + 2);

    return res.status(202).json({
      success: true,
      data: {
        id: operation.id,
        videoId: operation.videoId,
        type: operation.type,
        status: operation.status,
        params: {
          subtitlesCount: subtitles.length,
          style
        },
        createdAt: operation.createdAt,
        estimatedCompletionTime
      }
    });
  } catch (error) {
    console.error('Add subtitles error:', error);
    return res.status(500).json({
      success: false,
      message: `Error adding subtitles: ${error.message}`
    });
  }
};

/**
 * Render a video with all operations
 */
export const renderVideo = async (req: Request, res: Response) => {
  try {
    const videoId = parseInt(req.params.id);
    if (isNaN(videoId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video ID'
      });
    }

    // Validate request body
    const validationResult = renderRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.format()
      });
    }

    const { operations, output } = validationResult.data;
    
    // Create render job
    const render = await createRenderJob(
      videoId,
      operations,
      output
    );

    return res.status(202).json({
      success: true,
      data: {
        id: render.id,
        videoId: render.videoId,
        status: render.status,
        progress: render.progress,
        operations: render.operations,
        output: {
          name: render.outputName,
          format: render.outputFormat,
          quality: render.quality
        },
        createdAt: render.createdAt,
        estimatedCompletionTime: render.estimatedCompletionTime
      }
    });
  } catch (error) {
    console.error('Render video error:', error);
    return res.status(500).json({
      success: false,
      message: `Error rendering video: ${error.message}`
    });
  }
};

/**
 * Get render status
 */
export const getRenderStatus = async (req: Request, res: Response) => {
  try {
    const renderId = parseInt(req.params.renderId);
    if (isNaN(renderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid render ID'
      });
    }

    const render = await storage.getRender(renderId);
    if (!render) {
      return res.status(404).json({
        success: false,
        message: 'Render not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: render.id,
        videoId: render.videoId,
        status: render.status,
        progress: render.progress,
        createdAt: render.createdAt,
        estimatedCompletionTime: render.estimatedCompletionTime
      }
    });
  } catch (error) {
    console.error('Get render status error:', error);
    return res.status(500).json({
      success: false,
      message: `Error getting render status: ${error.message}`
    });
  }
};

/**
 * Download a rendered video
 */
export const downloadVideo = async (req: Request, res: Response) => {
  try {
    const videoId = parseInt(req.params.id);
    if (isNaN(videoId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video ID'
      });
    }

    // Check if a specific render is requested
    const renderId = req.query.renderId ? parseInt(req.query.renderId as string) : undefined;
    
    let filePath: string | undefined;
    let filename: string | undefined;
    
    if (renderId) {
      // Get specific render
      const render = await storage.getRender(renderId);
      if (!render) {
        return res.status(404).json({
          success: false,
          message: 'Render not found'
        });
      }
      
      // Check if render is complete
      if (render.status !== 'completed') {
        return res.status(202).json({
          status: render.status,
          progress: render.progress,
          estimatedCompletionTime: render.estimatedCompletionTime
        });
      }
      
      filePath = render.outputPath;
      filename = render.outputName || `rendered_video_${render.id}.${render.outputFormat || 'mp4'}`;
    } else {
      // Get latest completed render for this video
      const renders = await storage.getVideoRenders(videoId);
      const latestRender = renders
        .filter(r => r.status === 'completed' && r.outputPath)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      if (!latestRender) {
        // If no renders found, try to send the original video
        const video = await storage.getVideo(videoId);
        if (!video) {
          return res.status(404).json({
            success: false,
            message: 'Video not found'
          });
        }
        
        filePath = video.originalPath;
        filename = video.name;
      } else {
        filePath = latestRender.outputPath;
        filename = latestRender.outputName || `rendered_video_${latestRender.id}.${latestRender.outputFormat || 'mp4'}`;
      }
    }
    
    // Check if file exists
    if (!filePath || !(await fileExists(filePath))) {
      return res.status(404).json({
        success: false,
        message: 'Video file not found'
      });
    }
    
    // Send file for download
    const sanitizedFilename = sanitizeFilename(filename);
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
    res.setHeader('Content-Type', 'video/mp4');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download video error:', error);
    return res.status(500).json({
      success: false,
      message: `Error downloading video: ${error.message}`
    });
  }
};

/**
 * Get system stats for dashboard
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await getSystemStats();
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({
      success: false,
      message: `Error getting stats: ${error.message}`
    });
  }
};
