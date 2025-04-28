import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import path from 'path';
import { promises as fs } from 'fs';
import { getTempFilePath } from '../utils/fileUtils.js';

const ffprobePath = ffprobeStatic.path;

// Set ffmpeg and ffprobe paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

/**
 * Get video metadata using FFmpeg
 */
const getVideoMetadata = (filePath) => {
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