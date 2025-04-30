#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base URL for API requests
const API_BASE_URL = 'http://localhost:5000';

// ASCII color codes for better readability
const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m'
};

// State to store created resources for later tests
const state = {
  videoId: null,
  renderId: null
};

// Helper function to log with colors
function logWithColor(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

// Helper to print test results
function printResult(testName, success, response = null, error = null) {
  if (success) {
    logWithColor(`✅ PASS: ${testName}`, COLORS.GREEN);
    if (response) {
      logWithColor('Response:', COLORS.CYAN);
      console.log(JSON.stringify(response, null, 2));
    }
  } else {
    logWithColor(`❌ FAIL: ${testName}`, COLORS.RED);
    if (error) {
      logWithColor('Error:', COLORS.RED);
      console.error(error);
    }
    if (response) {
      logWithColor('Response:', COLORS.YELLOW);
      console.log(JSON.stringify(response, null, 2));
    }
  }
  console.log('-----------------------------------');
}

// Test API status endpoint
async function testApiStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/status`);
    const data = await response.json();
    
    const success = response.ok && data.status === 'ok';
    printResult('API Status', success, data);
    return success;
  } catch (error) {
    printResult('API Status', false, null, error);
    return false;
  }
}

// Test system stats endpoint
async function testSystemStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stats`);
    const data = await response.json();
    
    const success = response.ok && data.success === true;
    printResult('System Stats', success, data);
    return success;
  } catch (error) {
    printResult('System Stats', false, null, error);
    return false;
  }
}

// Test video upload
async function testVideoUpload() {
  try {
    // First check if we have a sample video file
    const sampleVideoPath = path.join(__dirname, 'sample.mp4');
    if (!fs.existsSync(sampleVideoPath)) {
      // Create a simple text file instead (not a real video but will test the API flow)
      logWithColor('Sample video not found. Creating dummy file for testing...', COLORS.YELLOW);
      fs.writeFileSync(sampleVideoPath, 'This is a dummy file for testing video upload API', 'utf8');
    }
    
    // Create a FormData instance
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('video', fs.createReadStream(sampleVideoPath));
    
    const response = await fetch(`${API_BASE_URL}/api/videos/upload`, {
      method: 'POST',
      body: form
    });
    
    const data = await response.json();
    const success = response.ok && data.success === true;
    
    if (success && data.data && data.data.id) {
      state.videoId = data.data.id;
      logWithColor(`Video ID for later tests: ${state.videoId}`, COLORS.MAGENTA);
    }
    
    printResult('Video Upload', success, data);
    return success;
  } catch (error) {
    printResult('Video Upload', false, null, error);
    return false;
  }
}

// Test get all videos
async function testGetAllVideos() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/videos`);
    const data = await response.json();
    
    const success = response.ok && data.success === true;
    printResult('Get All Videos', success, data);
    
    // Fallback: If we didn't get a videoId from upload, try to get one from the list
    if (success && !state.videoId && data.data && data.data.length > 0) {
      state.videoId = data.data[0].id;
      logWithColor(`Using existing video ID for tests: ${state.videoId}`, COLORS.MAGENTA);
    }
    
    return success;
  } catch (error) {
    printResult('Get All Videos', false, null, error);
    return false;
  }
}

// Test get single video
async function testGetSingleVideo() {
  // Skip if we don't have a videoId
  if (!state.videoId) {
    logWithColor('⚠️ Skipping Get Single Video test: No video ID available', COLORS.YELLOW);
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/videos/${state.videoId}`);
    const data = await response.json();
    
    const success = response.ok && data.success === true;
    printResult('Get Single Video', success, data);
    return success;
  } catch (error) {
    printResult('Get Single Video', false, null, error);
    return false;
  }
}

// Test trim video
async function testTrimVideo() {
  // Skip if we don't have a videoId
  if (!state.videoId) {
    logWithColor('⚠️ Skipping Trim Video test: No video ID available', COLORS.YELLOW);
    return false;
  }
  
  try {
    const trimData = {
      startTime: '00:00:01',
      endTime: '00:00:10'
    };
    
    const response = await fetch(`${API_BASE_URL}/api/videos/${state.videoId}/trim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trimData)
    });
    
    const data = await response.json();
    const success = response.ok && data.success === true;
    printResult('Trim Video', success, data);
    return success;
  } catch (error) {
    printResult('Trim Video', false, null, error);
    return false;
  }
}

// Test add subtitles
async function testAddSubtitles() {
  // Skip if we don't have a videoId
  if (!state.videoId) {
    logWithColor('⚠️ Skipping Add Subtitles test: No video ID available', COLORS.YELLOW);
    return false;
  }
  
  try {
    const subtitlesData = {
      subtitles: [
        { startTime: '00:00:01', endTime: '00:00:05', text: 'This is a test subtitle' },
        { startTime: '00:00:06', endTime: '00:00:10', text: 'Another test subtitle' }
      ]
    };
    
    const response = await fetch(`${API_BASE_URL}/api/videos/${state.videoId}/subtitles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subtitlesData)
    });
    
    const data = await response.json();
    const success = response.ok && data.success === true;
    printResult('Add Subtitles', success, data);
    return success;
  } catch (error) {
    printResult('Add Subtitles', false, null, error);
    return false;
  }
}

// Test render video
async function testRenderVideo() {
  // Skip if we don't have a videoId
  if (!state.videoId) {
    logWithColor('⚠️ Skipping Render Video test: No video ID available', COLORS.YELLOW);
    return false;
  }
  
  try {
    const renderData = {
      includeOperations: true
    };
    
    const response = await fetch(`${API_BASE_URL}/api/videos/${state.videoId}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(renderData)
    });
    
    const data = await response.json();
    const success = response.ok && data.success === true;
    
    if (success && data.data && data.data.renderId) {
      state.renderId = data.data.renderId;
      logWithColor(`Render ID for later tests: ${state.renderId}`, COLORS.MAGENTA);
    }
    
    printResult('Render Video', success, data);
    return success;
  } catch (error) {
    printResult('Render Video', false, null, error);
    return false;
  }
}

// Test get render status
async function testGetRenderStatus() {
  // Skip if we don't have a renderId
  if (!state.renderId) {
    logWithColor('⚠️ Skipping Get Render Status test: No render ID available', COLORS.YELLOW);
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/renders/${state.renderId}`);
    const data = await response.json();
    
    const success = response.ok && data.success === true;
    printResult('Get Render Status', success, data);
    return success;
  } catch (error) {
    printResult('Get Render Status', false, null, error);
    return false;
  }
}

// Test download video
async function testDownloadVideo() {
  // Skip if we don't have a videoId
  if (!state.videoId) {
    logWithColor('⚠️ Skipping Download Video test: No video ID available', COLORS.YELLOW);
    return false;
  }
  
  try {
    // We'll just check the response headers without downloading the whole file
    const response = await fetch(`${API_BASE_URL}/api/videos/${state.videoId}/download`, {
      method: 'HEAD'
    });
    
    // For download endpoints, a 200 OK with content-type header is success
    const success = response.ok && response.headers.get('content-type') !== null;
    
    // Create a simplified response object for logging
    const responseInfo = {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'content-type': response.headers.get('content-type'),
        'content-length': response.headers.get('content-length')
      }
    };
    
    printResult('Download Video', success, responseInfo);
    return success;
  } catch (error) {
    printResult('Download Video', false, null, error);
    return false;
  }
}

// Main test function
async function runTests() {
  logWithColor('🚀 Starting API Tests', COLORS.CYAN);
  console.log('===================================');
  
  // Basic API tests
  await testApiStatus();
  await testSystemStats();
  
  // Video upload and management
  await testVideoUpload();
  await testGetAllVideos();
  await testGetSingleVideo();
  
  // Video operations
  await testTrimVideo();
  await testAddSubtitles();
  await testRenderVideo();
  await testGetRenderStatus();
  await testDownloadVideo();
  
  logWithColor('🏁 API Tests Complete', COLORS.CYAN);
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});