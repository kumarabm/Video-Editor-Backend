/**
 * This is a stub/proxy file to redirect imports from controllers
 * to the actual ffmpeg.js in the services directory.
 */
import * as ffmpegModule from '../services/ffmpeg.js';

// Re-export everything from the real ffmpeg.js file
export default ffmpegModule;
export const {
  getVideoMetadata,
  trimVideo,
  generateSubtitleFile,
  formatTimeForSRT,
  addSubtitlesToVideo,
  renderFinalVideo
} = ffmpegModule;