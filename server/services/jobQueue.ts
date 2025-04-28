import Queue from 'bull';
import { getVideoMetadata, trimVideo, addSubtitlesToVideo, renderFinalVideo } from './ffmpeg';
import { storage } from '../storage';
import { getProcessedVideoPath, getRenderedVideoPath } from '../utils/fileUtils';
import { IOperation, IRender } from '@shared/models';

// Create queues directly without Redis for development
const videoProcessingQueue = new Queue('video-processing');
const renderQueue = new Queue('video-rendering');

// Set up concurrency
videoProcessingQueue.process(2, processVideoJob);
renderQueue.process(1, processRenderJob);

// Process video operations (trim, subtitles)
async function processVideoJob(job: Queue.Job) {
  const { operationId, type } = job.data;

  try {
    // Get operation details
    const operation = await storage.getOperation(operationId);
    if (!operation) {
      throw new Error(`Operation not found: ${operationId}`);
    }

    // Update status to processing
    await storage.updateOperation(operationId, { status: 'processing' });

    // Get video details
    const video = await storage.getVideo(operation.videoId.toString());
    if (!video) {
      throw new Error(`Video not found: ${operation.videoId}`);
    }

    // Path for processed video output
    const outputFilename = `processed_${Date.now()}_${operation.videoId}.mp4`;
    const outputPath = getProcessedVideoPath(type, operation.videoId.toString(), outputFilename);

    // Process based on operation type
    if (type === 'trim') {
      const { startTime, endTime } = operation.params as { startTime: number, endTime: number };
      
      // Validate times
      if (startTime >= endTime) {
        throw new Error('Start time must be less than end time');
      }
      
      // Handle progress updates
      const updateProgress = async (progress: number) => {
        job.progress(progress);
      };
      
      // Trim the video
      await trimVideo(video.filename, outputPath, startTime, endTime, updateProgress);
      
      // Update operation with result path
      await storage.updateOperation(operationId, { 
        status: 'completed', 
        output: { path: outputPath }
      });
      
      return { success: true, resultPath: outputPath };
    } 
    else if (type === 'subtitles') {
      const { subtitles, style } = operation.params as { 
        subtitles: { text: string, startTime: number, endTime: number }[],
        style?: { 
          fontSize?: number, 
          fontColor?: string, 
          backgroundColor?: string, 
          position?: 'top' | 'middle' | 'bottom' 
        }
      };
      
      // Handle progress updates
      const updateProgress = async (progress: number) => {
        job.progress(progress);
      };
      
      // Add subtitles to the video
      await addSubtitlesToVideo(video.filename, outputPath, subtitles, style, updateProgress);
      
      // Update operation with result path
      await storage.updateOperation(operationId, { 
        status: 'completed', 
        output: { path: outputPath }
      });
      
      return { success: true, resultPath: outputPath };
    }
    
    throw new Error(`Unsupported operation type: ${type}`);
  } catch (error: any) {
    console.error(`Error processing video operation ${operationId}:`, error);
    
    // Update operation status to failed
    await storage.updateOperation(operationId, { 
      status: 'failed',
      error: error.message
    });
    
    throw error;
  }
}

// Process render jobs
async function processRenderJob(job: Queue.Job) {
  const { renderId } = job.data;

  try {
    // Get render details
    const render = await storage.getRender(renderId);
    if (!render) {
      throw new Error(`Render not found: ${renderId}`);
    }

    // Update status to processing
    await storage.updateRender(renderId, { 
      status: 'processing',
      progress: 0
    });

    // Get video details
    const video = await storage.getVideo(render.videoId.toString());
    if (!video) {
      throw new Error(`Video not found: ${render.videoId}`);
    }

    // Get all operations for this video
    let operationIds: string[] = [];
    if (render.operations && Array.isArray(render.operations)) {
      operationIds = render.operations.map(id => id.toString());
    } else {
      // If no operations specified, get all completed operations for this video
      const allOperations = await storage.getVideoOperations(render.videoId.toString());
      operationIds = allOperations
        .filter(op => op.status === 'completed')
        .map(op => op.id);
    }

    // Get operation paths in order
    const operations = await Promise.all(
      operationIds.map(id => storage.getOperation(id))
    );
    
    // Filter out any undefined operations and only include completed ones with result paths
    const validOperations = operations
      .filter((op): op is IOperation => 
        op !== null && 
        op.status === 'completed' && 
        op.output !== undefined && 
        op.output.path !== undefined
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    const operationPaths = validOperations.map(op => op.output!.path!);

    // Set output filename
    const outputName = render.output?.name || `final_${render.videoId}_${Date.now()}.${render.output?.format || 'mp4'}`;
    const outputPath = getRenderedVideoPath(render.id, outputName);

    // Handle progress updates
    const updateProgress = async (progress: number) => {
      job.progress(progress);
      await storage.updateRender(renderId, { progress });
    };

    // Render the final video
    await renderFinalVideo(
      video.filename,
      outputPath,
      operationPaths,
      (render.output?.quality as 'low' | 'medium' | 'high') || 'high',
      updateProgress
    );

    // Update render with completion info
    await storage.updateRender(renderId, { 
      status: 'completed',
      progress: 100,
      output: {
        ...render.output,
        path: outputPath
      }
    });

    return { success: true, outputPath };
  } catch (error: any) {
    console.error(`Error processing render ${renderId}:`, error);
    
    // Update render status to failed
    await storage.updateRender(renderId, { 
      status: 'failed',
      error: error.message
    });
    
    throw error;
  }
}

// Helper functions to add jobs to the queue
export const queueVideoOperation = async (operationId: string, type: string) => {
  return await videoProcessingQueue.add({ operationId, type }, { 
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  });
};

export const queueRender = async (renderId: string) => {
  return await renderQueue.add({ renderId }, { 
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 10000
    }
  });
};

// Export queues for monitoring
export { videoProcessingQueue, renderQueue };