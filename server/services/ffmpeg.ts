import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { getTempFilePath, getProcessedVideoPath, getRenderedVideoPath } from '../utils/fileUtils';
import config from '../config/config';

/**
 * Get video metadata using FFmpeg
 */
export const getVideoMetadata = (filePath: string): Promise<{ duration: number, format: string }> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      
      const duration = metadata.format.duration ?? 0;
      const format = metadata.format.format_name ?? '';
      
      resolve({ duration, format });
    });
  });
};

/**
 * Trim a video to specified start and end times
 */
export const trimVideo = (
  inputPath: string,
  outputPath: string,
  startTime: number,
  endTime: number,
  onProgress?: (progress: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(endTime - startTime)
      .output(outputPath)
      .outputOptions('-c copy') // Use copy codec for faster processing
      .on('progress', (progress) => {
        if (onProgress) onProgress(Math.round(progress.percent));
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
};

/**
 * Generate a subtitle file (SRT format) from an array of subtitles
 */
export const generateSubtitleFile = (
  subtitles: { text: string, startTime: number, endTime: number }[]
): string => {
  const srtPath = getTempFilePath('subtitles') + '.srt';
  
  let srtContent = '';
  subtitles.forEach((subtitle, index) => {
    const startTimeFormatted = formatSrtTime(subtitle.startTime);
    const endTimeFormatted = formatSrtTime(subtitle.endTime);
    
    srtContent += `${index + 1}\n`;
    srtContent += `${startTimeFormatted} --> ${endTimeFormatted}\n`;
    srtContent += `${subtitle.text}\n\n`;
  });
  
  fs.writeFileSync(srtPath, srtContent);
  return srtPath;
};

/**
 * Format time for SRT format (HH:MM:SS,MS)
 */
const formatSrtTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
};

/**
 * Add subtitles to a video
 */
export const addSubtitlesToVideo = (
  inputPath: string,
  outputPath: string,
  subtitles: { text: string, startTime: number, endTime: number }[],
  style: {
    fontSize?: number,
    fontColor?: string,
    backgroundColor?: string,
    position?: 'top' | 'middle' | 'bottom'
  } = {},
  onProgress?: (progress: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Create subtitle file
    const srtPath = generateSubtitleFile(subtitles);
    
    // Default styles
    const fontSize = style.fontSize || config.subtitles.defaultStyle.fontSize;
    const fontColor = style.fontColor || config.subtitles.defaultStyle.fontColor;
    const backgroundColor = style.backgroundColor || config.subtitles.defaultStyle.backgroundColor;
    const position = style.position || config.subtitles.defaultStyle.position;
    
    // Vertical position
    let verticalPos = '(h-text_h)-20'; // bottom
    if (position === 'top') verticalPos = '20';
    if (position === 'middle') verticalPos = '(h-text_h)/2';
    
    ffmpeg(inputPath)
      .input(srtPath)
      .complexFilter([
        {
          filter: 'subtitles',
          options: {
            filename: srtPath,
            force_style: `FontSize=${fontSize},PrimaryColour=${fontColor},BackColour=${backgroundColor},Alignment=2`
          }
        }
      ])
      .output(outputPath)
      .on('progress', (progress) => {
        if (onProgress) onProgress(Math.round(progress.percent));
      })
      .on('end', () => {
        // Clean up subtitle file
        fs.unlinkSync(srtPath);
        resolve();
      })
      .on('error', (err) => {
        // Clean up subtitle file
        if (fs.existsSync(srtPath)) fs.unlinkSync(srtPath);
        reject(err);
      })
      .run();
  });
};

/**
 * Render a final video with multiple operations
 */
export const renderFinalVideo = (
  inputPath: string,
  outputPath: string,
  operationPaths: string[],
  quality: 'low' | 'medium' | 'high' = 'high',
  onProgress?: (progress: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If no operations, just copy the original
    if (operationPaths.length === 0) {
      ffmpeg(inputPath)
        .output(outputPath)
        .on('progress', (progress) => {
          if (onProgress) onProgress(Math.round(progress.percent));
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
      return;
    }

    // Use last operation as input for final render
    const lastOperationPath = operationPaths[operationPaths.length - 1];

    // Get quality settings
    let qualitySettings = config.ffmpeg.highQuality;
    if (quality === 'low') qualitySettings = config.ffmpeg.lowQuality;
    if (quality === 'medium') qualitySettings = config.ffmpeg.mediumQuality;

    ffmpeg(lastOperationPath)
      .outputOptions([
        `-crf ${qualitySettings.crf}`,
        `-preset ${qualitySettings.preset}`
      ])
      .output(outputPath)
      .on('progress', (progress) => {
        if (onProgress) onProgress(Math.round(progress.percent));
      })
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
};
