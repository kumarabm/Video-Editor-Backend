import Queue from 'bull';
import { getVideoMetadata, trimVideo, addSubtitlesToVideo, renderFinalVideo } from './ffmpeg.js';
import { storage } from '../storage.js';
import { getProcessedVideoPath, getRenderedVideoPath } from '../utils/fileUtils.js';

// Set environment variable to force use of in-memory queue
// Default to true to avoid Redis connection errors
const FORCE_INMEMORY_QUEUE = process.env.FORCE_INMEMORY_QUEUE !== 'false';

// Fallback in-memory job processing system (no Redis required)
class InMemoryQueue {
  constructor(name) {
    this.name = name;
    this.processor = null;
    this.jobs = [];
    this.completedJobs = [];
    this.failedJobs = [];
    this.nextJobId = 1;
    console.log(`Created in-memory queue: ${name}`);
  }

  process(concurrency, processFunction) {
    if (typeof concurrency === 'function') {
      this.processor = concurrency;
    } else {
      this.processor = processFunction;
    }
    console.log(`Processor registered for queue: ${this.name}`);
    return this;
  }

  async add(data, options = {}) {
    const jobId = this.nextJobId++;
    const job = {
      id: jobId,
      data,
      options,
      progress: (value) => {
        console.log(`Job ${jobId} progress: ${value}%`);
        job._progress = value;
        return Promise.resolve();
      },
      _progress: 0,
      _createdAt: new Date()
    };

    this.jobs.push(job);
    console.log(`Added job ${jobId} to queue: ${this.name}`);
    
    // Process the job asynchronously
    setTimeout(() => this._processJob(job), 100);
    
    return job;
  }

  async _processJob(job) {
    if (!this.processor) {
      console.error(`No processor registered for queue: ${this.name}`);
      return;
    }

    try {
      console.log(`Processing job ${job.id} in queue: ${this.name}`);
      const result = await this.processor(job);
      console.log(`Job ${job.id} completed successfully in queue: ${this.name}`);
      job._result = result;
      job._completedAt = new Date();
      this.completedJobs.push(job);
      // Remove from active jobs
      this.jobs = this.jobs.filter(j => j.id !== job.id);
    } catch (error) {
      console.error(`Error processing job ${job.id} in queue ${this.name}:`, error);
      job._error = error;
      job._failedAt = new Date();
      this.failedJobs.push(job);
      // Remove from active jobs
      this.jobs = this.jobs.filter(j => j.id !== job.id);
    }
  }

  // Basic Bull-compatible methods for queue stats
  async getJobCounts() {
    return {
      waiting: this.jobs.length,
      active: 0,
      completed: this.completedJobs.length,
      failed: this.failedJobs.length,
      delayed: 0,
      paused: 0
    };
  }
}

// Try to create Bull queues with Redis, fall back to in-memory if not available
let videoProcessingQueue, renderQueue;

// Skip Redis entirely if forced to use in-memory queue
if (FORCE_INMEMORY_QUEUE) {
  console.log('Forced to use in-memory queues (FORCE_INMEMORY_QUEUE=true)');
  videoProcessingQueue = new InMemoryQueue('video-processing');
  renderQueue = new InMemoryQueue('video-rendering');
} else {
  try {
    console.log('Attempting to create Bull queues with Redis...');
    
    // Create Bull queues with more resilient settings
    const redisOptions = {
      // Don't reconnect more than a few times
      maxRetriesPerRequest: 3, 
      connectTimeout: 3000, // 3 second timeout
      // Completely disable offline queue to prevent command buffering when Redis is down
      enableOfflineQueue: false,
      // Disable auto-reconnect to prevent hanging connections
      autoReconnect: false,
      // Connection name for identifying in Redis logs
      connectionName: 'video-processing-api'
    };
    
    // Create queues with the better settings
    videoProcessingQueue = new Queue('video-processing', { redis: redisOptions });
    renderQueue = new Queue('video-rendering', { redis: redisOptions });
    
    console.log('Created Bull queues with Redis configuration');
    
    // Add error handlers to catch Redis connection issues
    videoProcessingQueue.on('error', (error) => {
      console.error('Video processing queue error:', error.message);
    });
    
    renderQueue.on('error', (error) => {
      console.error('Render queue error:', error.message);
    });
    
    // Set up event listeners for failed jobs
    videoProcessingQueue.on('failed', (job, err) => {
      console.error(`Job ${job.id} in video-processing queue failed: ${err.message}`);
    });
    
    renderQueue.on('failed', (job, err) => {
      console.error(`Job ${job.id} in render queue failed: ${err.message}`);
    });
    
    // Set up concurrency
    videoProcessingQueue.process(2, processVideoJob);
    renderQueue.process(1, processRenderJob);
    
  } catch (error) {
    console.error('Failed to create Bull queues with Redis:', error.message);
    console.log('Creating in-memory job queues as fallback');
    
    // Create in-memory queues as fallback
    videoProcessingQueue = new InMemoryQueue('video-processing');
    renderQueue = new InMemoryQueue('video-rendering');
    
    // Set up processors
    videoProcessingQueue.process(2, processVideoJob);
    renderQueue.process(1, processRenderJob);
  }
}

// Process video operations (trim, subtitles)
async function processVideoJob(job) {
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
      const { startTime, endTime } = operation.params;
      
      // Validate times
      if (startTime >= endTime) {
        throw new Error('Start time must be less than end time');
      }
      
      // Handle progress updates
      const updateProgress = async (progress) => {
        job.progress(progress);
      };
      
      // Trim the video
      // Use path from video object (path or filename property)
      const videoPath = video.path || video.filename;
      console.log(`Trimming video from path: ${videoPath}`);
      await trimVideo(videoPath, outputPath, startTime, endTime, updateProgress);
      
      // Update operation with result path
      await storage.updateOperation(operationId, { 
        status: 'completed', 
        output: { path: outputPath }
      });
      
      return { success: true, resultPath: outputPath };
    } 
    else if (type === 'subtitles') {
      const { subtitles, style } = operation.params;
      
      // Handle progress updates
      const updateProgress = async (progress) => {
        job.progress(progress);
      };
      
      // Add subtitles to the video
      // Use path from video object (path or filename property)
      const videoPath = video.path || video.filename;
      console.log(`Adding subtitles to video from path: ${videoPath}`);
      await addSubtitlesToVideo(videoPath, outputPath, subtitles, style, updateProgress);
      
      // Update operation with result path
      await storage.updateOperation(operationId, { 
        status: 'completed', 
        output: { path: outputPath }
      });
      
      return { success: true, resultPath: outputPath };
    }
    
    throw new Error(`Unsupported operation type: ${type}`);
  } catch (error) {
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
async function processRenderJob(job) {
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
    let operationIds = [];
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
      .filter(op => 
        op !== null && 
        op.status === 'completed' && 
        op.output !== undefined && 
        op.output.path !== undefined
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    const operationPaths = validOperations.map(op => op.output.path);

    // Set output filename
    const outputName = render.output?.name || `final_${render.videoId}_${Date.now()}.${render.output?.format || 'mp4'}`;
    const outputPath = getRenderedVideoPath(render.id, outputName);

    // Handle progress updates
    const updateProgress = async (progress) => {
      job.progress(progress);
      await storage.updateRender(renderId, { progress });
    };

    // Render the final video
    // Use path from video object (path or filename property)
    const videoPath = video.path || video.filename;
    console.log(`Rendering final video from path: ${videoPath}`);
    
    await renderFinalVideo(
      videoPath,
      outputPath,
      operationPaths,
      render.output?.quality || 'high',
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
  } catch (error) {
    console.error(`Error processing render ${renderId}:`, error);
    
    // Update render status to failed
    await storage.updateRender(renderId, { 
      status: 'failed',
      error: error.message
    });
    
    throw error;
  }
}

// Helper functions to add jobs to the queue with better error handling
export const queueVideoOperation = async (operationId, type) => {
  try {
    return await videoProcessingQueue.add({ operationId, type }, { 
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });
  } catch (error) {
    console.error(`Error adding job to video processing queue: ${error.message}`);
    
    // If Bull fails due to Redis, create a fallback in-memory queue
    if (!(videoProcessingQueue instanceof InMemoryQueue)) {
      console.log('Creating in-memory job queue as fallback after Redis error');
      videoProcessingQueue = new InMemoryQueue('video-processing');
      videoProcessingQueue.process(2, processVideoJob);
      
      // Try again with the in-memory queue
      return await videoProcessingQueue.add({ operationId, type });
    }
    
    throw error;
  }
};

export const queueRender = async (renderId) => {
  try {
    return await renderQueue.add({ renderId }, { 
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 10000
      }
    });
  } catch (error) {
    console.error(`Error adding job to render queue: ${error.message}`);
    
    // If Bull fails due to Redis, create a fallback in-memory queue
    if (!(renderQueue instanceof InMemoryQueue)) {
      console.log('Creating in-memory job queue as fallback after Redis error');
      renderQueue = new InMemoryQueue('video-rendering');
      renderQueue.process(1, processRenderJob);
      
      // Try again with the in-memory queue
      return await renderQueue.add({ renderId });
    }
    
    throw error;
  }
};

// Export queues for monitoring
export { videoProcessingQueue, renderQueue };