#!/usr/bin/env node
import { storage } from './server/storage.js';

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

// State to store created resources for later tests
const state = {
  videoId: null,
  operationId: null,
  renderId: null
};

// Test creating a video in storage
async function testCreateVideo() {
  try {
    const videoData = {
      originalFilename: 'test-video.mp4',
      fileSize: 1024 * 1024, // 1MB
      duration: 60, // 1 minute
      width: 1280,
      height: 720,
      format: 'mp4',
      path: '/uploads/test-video.mp4',
      createdAt: new Date().toISOString()
    };
    
    const video = await storage.createVideo(videoData);
    const success = video && video.id;
    
    if (success) {
      state.videoId = video.id;
      logWithColor(`Video ID for later tests: ${state.videoId}`, COLORS.MAGENTA);
    }
    
    printResult('Create Video', success, video);
    return success;
  } catch (error) {
    printResult('Create Video', false, null, error);
    return false;
  }
}

// Test getting all videos
async function testGetAllVideos() {
  try {
    const videos = await storage.getAllVideos();
    const success = Array.isArray(videos);
    printResult('Get All Videos', success, videos);
    return success;
  } catch (error) {
    printResult('Get All Videos', false, null, error);
    return false;
  }
}

// Test getting a single video
async function testGetVideo() {
  // Skip if we don't have a videoId
  if (!state.videoId) {
    logWithColor('⚠️ Skipping Get Video test: No video ID available', COLORS.YELLOW);
    return false;
  }
  
  try {
    const video = await storage.getVideo(state.videoId);
    const success = video && video.id === state.videoId;
    printResult('Get Video', success, video);
    return success;
  } catch (error) {
    printResult('Get Video', false, null, error);
    return false;
  }
}

// Test creating a trim operation
async function testCreateTrimOperation() {
  // Skip if we don't have a videoId
  if (!state.videoId) {
    logWithColor('⚠️ Skipping Create Trim Operation test: No video ID available', COLORS.YELLOW);
    return false;
  }
  
  try {
    const operationData = {
      videoId: state.videoId,
      type: 'trim',
      status: 'pending',
      params: {
        startTime: '00:00:05',
        endTime: '00:00:15'
      },
      createdAt: new Date().toISOString()
    };
    
    const operation = await storage.createOperation(operationData);
    const success = operation && operation.id;
    
    if (success) {
      state.operationId = operation.id;
      logWithColor(`Operation ID for later tests: ${state.operationId}`, COLORS.MAGENTA);
    }
    
    printResult('Create Trim Operation', success, operation);
    return success;
  } catch (error) {
    printResult('Create Trim Operation', false, null, error);
    return false;
  }
}

// Test creating a subtitles operation
async function testCreateSubtitlesOperation() {
  // Skip if we don't have a videoId
  if (!state.videoId) {
    logWithColor('⚠️ Skipping Create Subtitles Operation test: No video ID available', COLORS.YELLOW);
    return false;
  }
  
  try {
    const operationData = {
      videoId: state.videoId,
      type: 'subtitles',
      status: 'pending',
      params: {
        subtitles: [
          { startTime: '00:00:01', endTime: '00:00:05', text: 'This is a test subtitle' },
          { startTime: '00:00:06', endTime: '00:00:10', text: 'Another test subtitle' }
        ]
      },
      createdAt: new Date().toISOString()
    };
    
    const operation = await storage.createOperation(operationData);
    const success = operation && operation.id;
    
    printResult('Create Subtitles Operation', success, operation);
    return success;
  } catch (error) {
    printResult('Create Subtitles Operation', false, null, error);
    return false;
  }
}

// Test getting video operations
async function testGetVideoOperations() {
  // Skip if we don't have a videoId
  if (!state.videoId) {
    logWithColor('⚠️ Skipping Get Video Operations test: No video ID available', COLORS.YELLOW);
    return false;
  }
  
  try {
    const operations = await storage.getVideoOperations(state.videoId);
    const success = Array.isArray(operations);
    printResult('Get Video Operations', success, operations);
    return success;
  } catch (error) {
    printResult('Get Video Operations', false, null, error);
    return false;
  }
}

// Test updating an operation
async function testUpdateOperation() {
  // Skip if we don't have an operationId
  if (!state.operationId) {
    logWithColor('⚠️ Skipping Update Operation test: No operation ID available', COLORS.YELLOW);
    return false;
  }
  
  try {
    const updates = {
      status: 'completed',
      processedPath: '/uploads/processed/test-video-trim.mp4',
      updatedAt: new Date().toISOString()
    };
    
    const operation = await storage.updateOperation(state.operationId, updates);
    const success = operation && operation.id === state.operationId && operation.status === 'completed';
    
    printResult('Update Operation', success, operation);
    return success;
  } catch (error) {
    printResult('Update Operation', false, null, error);
    return false;
  }
}

// Test creating a render
async function testCreateRender() {
  // Skip if we don't have a videoId
  if (!state.videoId) {
    logWithColor('⚠️ Skipping Create Render test: No video ID available', COLORS.YELLOW);
    return false;
  }
  
  try {
    const renderData = {
      videoId: state.videoId,
      operationIds: state.operationId ? [state.operationId] : [],
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString()
    };
    
    const render = await storage.createRender(renderData);
    const success = render && render.id;
    
    if (success) {
      state.renderId = render.id;
      logWithColor(`Render ID for later tests: ${state.renderId}`, COLORS.MAGENTA);
    }
    
    printResult('Create Render', success, render);
    return success;
  } catch (error) {
    printResult('Create Render', false, null, error);
    return false;
  }
}

// Test updating a render
async function testUpdateRender() {
  // Skip if we don't have a renderId
  if (!state.renderId) {
    logWithColor('⚠️ Skipping Update Render test: No render ID available', COLORS.YELLOW);
    return false;
  }
  
  try {
    const updates = {
      status: 'completed',
      progress: 100,
      outputPath: '/uploads/rendered/test-video-final.mp4',
      updatedAt: new Date().toISOString()
    };
    
    const render = await storage.updateRender(state.renderId, updates);
    const success = render && render.id === state.renderId && render.status === 'completed';
    
    printResult('Update Render', success, render);
    return success;
  } catch (error) {
    printResult('Update Render', false, null, error);
    return false;
  }
}

// Test getting a render
async function testGetRender() {
  // Skip if we don't have a renderId
  if (!state.renderId) {
    logWithColor('⚠️ Skipping Get Render test: No render ID available', COLORS.YELLOW);
    return false;
  }
  
  try {
    const render = await storage.getRender(state.renderId);
    const success = render && render.id === state.renderId;
    
    printResult('Get Render', success, render);
    return success;
  } catch (error) {
    printResult('Get Render', false, null, error);
    return false;
  }
}

// Test getting video renders
async function testGetVideoRenders() {
  // Skip if we don't have a videoId
  if (!state.videoId) {
    logWithColor('⚠️ Skipping Get Video Renders test: No video ID available', COLORS.YELLOW);
    return false;
  }
  
  try {
    const renders = await storage.getVideoRenders(state.videoId);
    const success = Array.isArray(renders);
    
    printResult('Get Video Renders', success, renders);
    return success;
  } catch (error) {
    printResult('Get Video Renders', false, null, error);
    return false;
  }
}

// Test getting recent jobs
async function testGetRecentJobs() {
  try {
    const jobs = await storage.getRecentJobs();
    const success = Array.isArray(jobs);
    
    printResult('Get Recent Jobs', success, jobs);
    return success;
  } catch (error) {
    printResult('Get Recent Jobs', false, null, error);
    return false;
  }
}

// Main test function
async function runTests() {
  logWithColor('🚀 Starting Storage Layer Tests', COLORS.CYAN);
  console.log('===================================');
  
  // Basic storage operations
  await testCreateVideo();
  await testGetAllVideos();
  await testGetVideo();
  
  // Operations
  await testCreateTrimOperation();
  await testCreateSubtitlesOperation();
  await testGetVideoOperations();
  await testUpdateOperation();
  
  // Renders
  await testCreateRender();
  await testUpdateRender();
  await testGetRender();
  await testGetVideoRenders();
  
  // Jobs
  await testGetRecentJobs();
  
  logWithColor('🏁 Storage Layer Tests Complete', COLORS.CYAN);
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});