import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import path from 'path';
import { promises as fs } from 'fs';
import { getTempFilePath } from '../utils/fileUtils.js';
import { fileURLToPath } from 'url';

// Calculate __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we're in development mode (for mocking FFmpeg operations)
const isDevelopment = process.env.NODE_ENV === 'development';
// Always use mocks in development mode or if MOCK_FFMPEG is set to true
const useMocks = process.env.MOCK_FFMPEG === 'true' || (isDevelopment && true);

// Create mock directories if they don't exist
async function ensureMockDirectories() {
  try {
    const mockDirs = [
      path.join(__dirname, '../../uploads'),
      path.join(__dirname, '../../uploads/processed'),
      path.join(__dirname, '../../uploads/rendered'),
      path.join(__dirname, '../../temp')
    ];
    
    for (const dir of mockDirs) {
      await fs.mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  } catch (error) {
    console.error('Error creating mock directories:', error);
  }
}

// Ensure mock directories exist in development
if (isDevelopment) {
  ensureMockDirectories();
}

const ffprobePath = ffprobeStatic.path;

// Set ffmpeg and ffprobe paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

/**
 * Mock function for FFmpeg operations
 */
const mockFFmpegOperation = async (operation, inputPath, outputPath, options = {}, updateProgress = null) => {
  console.log(`Mocking FFmpeg operation: ${operation}`);
  console.log(`Input path: ${inputPath}`);
  console.log(`Output path: ${outputPath}`);
  console.log('Options:', options);
  
  try {
    // Create the output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Simulate progress updates
    if (updateProgress) {
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        updateProgress(i);
      }
    }
    
    // Create a mock output file
    const content = `This is a mock ${operation} file created at ${new Date().toISOString()}
Input: ${inputPath}
Output: ${outputPath}
Options: ${JSON.stringify(options)}
`;
    
    await fs.writeFile(outputPath, content);
    console.log(`Created mock output file: ${outputPath}`);
    
    return {
      success: true,
      outputPath
    };
  } catch (error) {
    console.error(`Error in mock FFmpeg operation:`, error);
    throw error;
  }
};

/**
 * Get video metadata using FFmpeg
 */
const getVideoMetadata = (filePath) => {
  // If using mocks, return fake metadata
  if (useMocks) {
    console.log(`Mocking video metadata for: ${filePath}`);
    return Promise.resolve({
      format: {
        filename: filePath,
        duration: 60, // 1 minute
        size: 1024 * 1024 * 10 // 10MB
      },
      streams: [
        {
          codec_type: 'video',
          width: 1280,
          height: 720,
          duration: 60,
          r_frame_rate: '30/1'
        }
      ]
    });
  }
  
  // Real implementation
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }
      
      resolve({
        duration: metadata.format.duration || 0,
        format: metadata.format.format_name
      });
    });
  });
};

/**
 * Trim a video to specified start and end times
 */
const trimVideo = (
  inputPath,
  outputPath,
  startTime,
  endTime,
  progressCallback
) => {
  // Use mock implementation in development mode
  if (useMocks) {
    console.log(`Mocking trim video: ${inputPath} -> ${outputPath}`);
    console.log(`Trim from ${startTime} to ${endTime}`);
    return mockFFmpegOperation('trim', inputPath, outputPath, { startTime, endTime }, progressCallback);
  }
  
  // Real implementation
  return new Promise((resolve, reject) => {
    const duration = endTime - startTime;
    
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .duration(duration)
      .output(outputPath)
      .on('progress', (progress) => {
        // Progress is a percent out of 100
        if (progressCallback) {
          progressCallback(Math.min(progress.percent, 100));
        }
      })
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(new Error(`Error trimming video: ${err.message}`));
      })
      .run();
  });
};

/**
 * Generate a subtitle file (SRT format) from an array of subtitles
 */
const generateSubtitleFile = (
  subtitles
) => {
  const tempPath = getTempFilePath('subtitles') + '.srt';
  
  let srtContent = '';
  
  subtitles.forEach((subtitle, index) => {
    const startTime = formatTimeForSRT(subtitle.startTime);
    const endTime = formatTimeForSRT(subtitle.endTime);
    
    srtContent += `${index + 1}\n`;
    srtContent += `${startTime} --> ${endTime}\n`;
    srtContent += `${subtitle.text}\n\n`;
  });
  
  return fs.writeFile(tempPath, srtContent)
    .then(() => tempPath)
    .catch(err => {
      throw new Error(`Error creating subtitle file: ${err.message}`);
    });
};

/**
 * Format time for SRT format (HH:MM:SS,MS)
 */
const formatTimeForSRT = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
};

/**
 * Add subtitles to a video
 */
const addSubtitlesToVideo = async (
  inputPath,
  outputPath,
  subtitles,
  style = {},
  progressCallback
) => {
  // Use mock implementation in development mode
  if (useMocks) {
    console.log(`Mocking add subtitles to video: ${inputPath} -> ${outputPath}`);
    console.log(`Subtitles count: ${subtitles.length}`);
    return mockFFmpegOperation('subtitles', inputPath, outputPath, { subtitles, style }, progressCallback);
  }
  
  // Real implementation
  const subtitlePath = await generateSubtitleFile(subtitles);
  
  const fontSize = style.fontSize || 24;
  const fontColor = style.fontColor || 'white';
  const bgColor = style.backgroundColor || 'black@0.5';
  const position = style.position || 'bottom';
  
  // Define vertical position based on style.position
  let vPosition;
  if (position === 'top') {
    vPosition = '(h/10)';
  } else if (position === 'middle') {
    vPosition = '(h/2)';
  } else {
    vPosition = '(h-h/10)'; // bottom
  }
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-vf', `subtitles=${subtitlePath}:force_style='FontSize=${fontSize},PrimaryColour=${fontColor},BackColour=${bgColor},Alignment=${position === 'top' ? 8 : position === 'middle' ? 5 : 2}'`
      ])
      .output(outputPath)
      .on('progress', (progress) => {
        if (progressCallback) {
          progressCallback(Math.min(progress.percent, 100));
        }
      })
      .on('end', async () => {
        // Clean up the temporary subtitle file
        try {
          await fs.unlink(subtitlePath);
        } catch (error) {
          console.error(`Failed to delete subtitle file: ${error.message}`);
        }
        resolve(outputPath);
      })
      .on('error', async (err) => {
        // Clean up the temporary subtitle file
        try {
          await fs.unlink(subtitlePath);
        } catch (error) {
          console.error(`Failed to delete subtitle file: ${error.message}`);
        }
        reject(new Error(`Error adding subtitles to video: ${err.message}`));
      })
      .run();
  });
};

/**
 * Render a final video with multiple operations
 */
const renderFinalVideo = async (
  originalVideoPath,
  outputPath,
  operationPaths,
  quality = 'high',
  progressCallback
) => {
  // Use mock implementation in development mode
  if (useMocks) {
    console.log(`Mocking render final video: ${originalVideoPath} -> ${outputPath}`);
    console.log(`Operation paths count: ${operationPaths.length}`);
    console.log(`Quality: ${quality}`);
    return mockFFmpegOperation('render', originalVideoPath, outputPath, { 
      operationPaths, 
      quality 
    }, progressCallback);
  }
  
  // Define quality preset
  const qualitySettings = {
    low: { crf: '28', preset: 'faster' },
    medium: { crf: '23', preset: 'medium' },
    high: { crf: '18', preset: 'slow' }
  };
  
  const settings = qualitySettings[quality] || qualitySettings.high;
  
  // If there are no operations, just copy the original with quality settings
  if (!operationPaths.length) {
    return new Promise((resolve, reject) => {
      ffmpeg(originalVideoPath)
        .outputOptions([
          '-c:v', 'libx264',
          '-crf', settings.crf,
          '-preset', settings.preset,
          '-c:a', 'aac',
          '-b:a', '128k'
        ])
        .output(outputPath)
        .on('progress', (progress) => {
          if (progressCallback) {
            progressCallback(Math.min(progress.percent, 100));
          }
        })
        .on('end', () => {
          resolve(outputPath);
        })
        .on('error', (err) => {
          reject(new Error(`Error rendering video: ${err.message}`));
        })
        .run();
    });
  }
  
  // Use the last operation result as the input for the final render
  const lastOperationPath = operationPaths[operationPaths.length - 1];
  
  return new Promise((resolve, reject) => {
    ffmpeg(lastOperationPath)
      .outputOptions([
        '-c:v', 'libx264',
        '-crf', settings.crf,
        '-preset', settings.preset,
        '-c:a', 'aac',
        '-b:a', '128k'
      ])
      .output(outputPath)
      .on('progress', (progress) => {
        if (progressCallback) {
          progressCallback(Math.min(progress.percent, 100));
        }
      })
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(new Error(`Error rendering video: ${err.message}`));
      })
      .run();
  });
};

export {
  getVideoMetadata,
  trimVideo,
  generateSubtitleFile,
  formatTimeForSRT,
  addSubtitlesToVideo,
  renderFinalVideo
};