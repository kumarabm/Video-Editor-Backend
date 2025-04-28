import { storage } from '../storage';
import { getVideoMetadata } from './ffmpeg';
import { getFileSize } from '../utils/fileUtils';
import { queueVideoOperation, queueRender } from './jobQueue';
import { IVideo, IOperation, IRender } from '@shared/models';
import mongoose from 'mongoose';

/**
 * Create a new video entry from an uploaded file
 */
export const createVideo = async (
  filePath: string,
  name: string,
  description?: string
): Promise<IVideo> => {
  try {
    // Get video metadata
    const metadata = await getVideoMetadata(filePath);
    const fileSize = await getFileSize(filePath);
    
    // Create video record in database
    const video = {
      name,
      description,
      filename: filePath.split('/').pop() || '',
      duration: metadata.duration,
      fileSize,
      status: 'ready',
      url: `/api/videos/${filePath.split('/').pop()}`
    };
    
    return await storage.createVideo(video);
  } catch (error: any) {
    throw new Error(`Failed to create video: ${error.message}`);
  }
};

/**
 * Create and queue a trim operation for a video
 */
export const createTrimOperation = async (
  videoId: string,
  startTime: number,
  endTime: number,
  outputName?: string
): Promise<IOperation> => {
  // Get video to verify it exists
  const video = await storage.getVideo(videoId);
  if (!video) {
    throw new Error(`Video not found: ${videoId}`);
  }
  
  // Create operation record
  const operation = {
    videoId: new mongoose.Types.ObjectId(videoId),
    type: 'trim',
    params: {
      startTime,
      endTime,
      output: outputName ? { name: outputName } : undefined
    },
    status: 'pending'
  };
  
  const createdOperation = await storage.createOperation(operation);
  
  // Queue the operation for processing
  await queueVideoOperation(createdOperation.id, 'trim');
  
  return createdOperation;
};

/**
 * Create and queue a subtitles operation for a video
 */
export const createSubtitlesOperation = async (
  videoId: string,
  subtitles: { text: string, startTime: number, endTime: number }[],
  style?: {
    fontSize?: number,
    fontColor?: string,
    backgroundColor?: string,
    position?: 'top' | 'middle' | 'bottom'
  }
): Promise<IOperation> => {
  // Get video to verify it exists
  const video = await storage.getVideo(videoId);
  if (!video) {
    throw new Error(`Video not found: ${videoId}`);
  }
  
  // Create operation record
  const operation = {
    videoId: new mongoose.Types.ObjectId(videoId),
    type: 'subtitles',
    params: {
      subtitles,
      style
    },
    status: 'pending'
  };
  
  const createdOperation = await storage.createOperation(operation);
  
  // Queue the operation for processing
  await queueVideoOperation(createdOperation.id, 'subtitles');
  
  return createdOperation;
};

/**
 * Create and queue a render job for a video
 */
export const createRenderJob = async (
  videoId: string,
  operations?: string[],
  output?: {
    name?: string,
    format?: 'mp4' | 'webm' | 'mov',
    quality?: 'low' | 'medium' | 'high'
  }
): Promise<IRender> => {
  // Get video to verify it exists
  const video = await storage.getVideo(videoId);
  if (!video) {
    throw new Error(`Video not found: ${videoId}`);
  }
  
  // Create render record
  const render = {
    videoId: new mongoose.Types.ObjectId(videoId),
    operations: operations ? operations.map(id => new mongoose.Types.ObjectId(id)) : [],
    status: 'pending',
    progress: 0,
    output: {
      name: output?.name,
      format: output?.format || 'mp4',
      quality: output?.quality || 'high'
    }
  };
  
  const createdRender = await storage.createRender(render);
  
  // Queue the render job
  await queueRender(createdRender.id);
  
  return createdRender;
};

/**
 * Get system statistics
 */
export const getSystemStats = async () => {
  // Get all videos
  const videos = await storage.getAllVideos();
  
  // Get active renders
  const renders = await Promise.all(videos.map(v => storage.getVideoRenders(v.id)));
  const activeRenders = renders.flat().filter(r => r.status === 'processing');
  
  // Calculate total storage used
  const totalStorageBytes = videos.reduce((total, video) => total + (video.fileSize || 0), 0);
  const totalStorageGB = (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(1);
  
  // Get recent jobs
  const recentJobs = await storage.getRecentJobs(10);
  
  // Format job data for front-end
  const formattedJobs = recentJobs.map(job => {
    // Check if it's a render or operation
    const isRender = 'progress' in job;
    
    return {
      id: job.id,
      videoId: job.videoId.toString(),
      type: isRender ? 'render' : (job as IOperation).type,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      progress: isRender ? (job as IRender).progress : undefined
    };
  });
  
  return {
    apiStatus: 'Operational',
    activeRenders: activeRenders.length,
    totalVideos: videos.length,
    storageUsed: totalStorageGB,
    recentJobs: formattedJobs
  };
};