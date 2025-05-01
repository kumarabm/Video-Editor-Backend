Video Editing Platform API
A backend service that allows users to upload videos, apply editing operations (trimming, subtitle overlay), and download the rendered video.

Features
Video upload and storage
Video trimming (cut from start to end time)
Adding subtitles to videos
Rendering videos with multiple operations
Download processed videos
Background job processing for video operations
Tech Stack
Node.js with Express
FFmpeg for video processing
MongoDB for data storage (with in-memory fallback)
Bull for job queues
Multer for file uploads
Setup Instructions
Install dependencies:

npm install
Requirements:

Node.js (v14 or higher)
FFmpeg installed on the system
MongoDB (optional - in-memory fallback available)
Redis (optional - for Bull job queue)
Create a .env file based on .env.example and configure:

MONGODB_URL=your_mongodb_connection_string
Start the server:

node start.js
API Endpoints
Upload Video
POST /api/videos/upload
Accepts multipart form data with a video file
Returns the video metadata and ID
Trim Video
POST /api/videos/:id/trim
Request body:
{
  "startTime": 0,
  "endTime": 30
}
Returns operation ID and status
Add Subtitles
POST /api/videos/:id/subtitles
Request body:
{
  "subtitles": [
    {
      "text": "Hello world",
      "startTime": 0,
      "endTime": 5
    }
  ],
  "style": {
    "fontSize": 24,
    "fontColor": "white",
    "backgroundColor": "black",
    "position": "bottom"
  }
}
Returns operation ID and status
Render Video
POST /api/videos/:id/render
Request body:
{
  "operations": ["operation_id_1", "operation_id_2"],
  "output": {
    "name": "final_video",
    "format": "mp4",
    "quality": "high"
  }
}
Returns render ID and status
Get Video
GET /api/videos/:id
Returns video details including operations and renders
Get All Videos
GET /api/videos
Returns list of all videos
Get Render Status
GET /api/renders/:id
Returns render status and progress
Download Video
GET /api/videos/:id/download
Downloads the rendered video file
Get System Stats
GET /api/stats
Returns system statistics (active renders, total videos, etc.)
Project Structure
/server - Backend server code
/controllers - API endpoint handlers
/services - Business logic
/middlewares - Express middlewares
/utils - Utility functions
/uploads - Video storage
/original - Original uploaded videos
/processed - Videos after operations
/rendered - Final rendered videos
/temp - Temporary files