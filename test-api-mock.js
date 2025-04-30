#!/usr/bin/env node
import fetch from 'node-fetch';

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

// Test health endpoint
async function testHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    const success = response.ok && data.status === 'ok';
    printResult('Health Check', success, data);
    return success;
  } catch (error) {
    printResult('Health Check', false, null, error);
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

// Test root endpoint (HTML response)
async function testRootEndpoint() {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    const html = await response.text();
    
    const success = response.ok && html.includes('Video Editing Platform API');
    printResult('Root Endpoint', success, { 
      status: response.status, 
      statusText: response.statusText,
      htmlLength: html.length,
      contentType: response.headers.get('content-type')
    });
    return success;
  } catch (error) {
    printResult('Root Endpoint', false, null, error);
    return false;
  }
}

// Test API documentation endpoint
async function testApiDocs() {
  try {
    const response = await fetch(`${API_BASE_URL}/api-docs`);
    const html = await response.text();
    
    // For Swagger UI, a 200 OK with HTML containing "swagger" is success
    const success = response.ok && (
      html.includes('swagger') || 
      html.includes('Swagger') || 
      html.includes('OpenAPI')
    );
    
    printResult('API Documentation', success, { 
      status: response.status, 
      statusText: response.statusText,
      htmlLength: html.length,
      contentType: response.headers.get('content-type')
    });
    return success;
  } catch (error) {
    printResult('API Documentation', false, null, error);
    return false;
  }
}

// Main test function
async function runTests() {
  logWithColor('🚀 Starting API Tests', COLORS.CYAN);
  console.log('===================================');
  
  // Basic API tests
  await testApiStatus();
  await testHealth();
  await testSystemStats();
  await testRootEndpoint();
  await testApiDocs();
  
  logWithColor('🏁 Basic API Tests Complete', COLORS.CYAN);
  
  logWithColor('\nℹ️ Advanced tests for video operations would require actual video files.', COLORS.YELLOW);
  logWithColor('ℹ️ The following endpoints are available but require valid video files for testing:', COLORS.YELLOW);
  logWithColor('  - POST /api/videos/upload - Upload a video', COLORS.YELLOW);
  logWithColor('  - GET /api/videos - Get all videos', COLORS.YELLOW);
  logWithColor('  - GET /api/videos/:id - Get a single video', COLORS.YELLOW);
  logWithColor('  - POST /api/videos/:id/trim - Trim a video', COLORS.YELLOW);
  logWithColor('  - POST /api/videos/:id/subtitles - Add subtitles to a video', COLORS.YELLOW);
  logWithColor('  - POST /api/videos/:id/render - Render a video with all operations', COLORS.YELLOW);
  logWithColor('  - GET /api/renders/:renderId - Get render status', COLORS.YELLOW);
  logWithColor('  - GET /api/videos/:id/download - Download rendered video', COLORS.YELLOW);
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});