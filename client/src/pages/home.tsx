import React from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import ApiEndpoint from '@/components/ApiEndpoint';
import { useToast } from "@/hooks/use-toast";

const Home = () => {
  const { toast } = useToast();

  const handleTryOut = (endpoint: string) => {
    toast({
      title: "Try Out",
      description: `This would open an API test interface for ${endpoint} in a real implementation.`,
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Dashboard />
          
          <section id="endpoints" className="mb-8 fade-in">
            <ApiEndpoint 
              id="upload"
              title="Video Upload Endpoint"
              method="POST"
              icon="cloud_upload"
              endpoint="/api/videos/upload"
              description="Upload a video file to the server. The API will store the video file and create metadata in the database."
              requestFormat={`{
  "Content-Type": "multipart/form-data",
  "Body": {
    "video": "[binary file]",
    "name": "example-video.mp4",
    "description": "Optional description of the video"
  }
}`}
              responseFormat={`{
  "success": true,
  "data": {
    "id": "video_12345",
    "name": "example-video.mp4",
    "description": "Optional description of the video",
    "duration": 120.5,
    "fileSize": 15728640,
    "status": "uploaded",
    "createdAt": "2023-04-26T10:30:00Z",
    "url": "/api/videos/video_12345"
  }
}`}
              implementationNotes={[
                "Use Multer for handling file uploads",
                "Store the video file in the local filesystem or in S3",
                "Extract metadata like duration using FFmpeg",
                "Store video metadata in PostgreSQL using Prisma/Sequelize"
              ]}
              onTryOut={() => handleTryOut("Video Upload")}
            />
            
            <ApiEndpoint 
              id="trim"
              title="Video Trimming Endpoint"
              method="POST"
              icon="content_cut"
              endpoint="/api/videos/:id/trim"
              description="Trim a video to the specified start and end times. The original video remains unchanged, and a new trimmed version is created."
              requestFormat={`{
  "Content-Type": "application/json",
  "Body": {
    "startTime": 10.5,  // in seconds
    "endTime": 30.2,    // in seconds
    "output": {
      "name": "trimmed-version.mp4"  // optional
    }
  }
}`}
              responseFormat={`{
  "success": true,
  "data": {
    "id": "operation_12345",
    "videoId": "video_12345",
    "type": "trim",
    "status": "processing",
    "params": {
      "startTime": 10.5,
      "endTime": 30.2
    },
    "createdAt": "2023-04-26T10:35:00Z",
    "estimatedCompletionTime": "2023-04-26T10:36:00Z"
  }
}`}
              implementationNotes={[
                "Use FFmpeg's -ss and -to options for trimming",
                "Consider using the copy codec for faster processing",
                "Store operation in database to track status",
                "Consider implementing this as a background job"
              ]}
              onTryOut={() => handleTryOut("Video Trimming")}
            />
            
            <ApiEndpoint 
              id="subtitles"
              title="Add Subtitles Endpoint"
              method="POST"
              icon="subtitles"
              endpoint="/api/videos/:id/subtitles"
              description="Add subtitle text to a video at specified timestamps. The subtitles are burned into the video."
              requestFormat={`{
  "Content-Type": "application/json",
  "Body": {
    "subtitles": [
      {
        "text": "Welcome to our product demo",
        "startTime": 5.0,  // in seconds
        "endTime": 8.5     // in seconds
      },
      {
        "text": "Let me show you how it works",
        "startTime": 9.0,
        "endTime": 12.5
      }
    ],
    "style": {
      "fontSize": 24,
      "fontColor": "#FFFFFF",
      "backgroundColor": "#000000AA",
      "position": "bottom"  // top, middle, bottom
    }
  }
}`}
              responseFormat={`{
  "success": true,
  "data": {
    "id": "operation_23456",
    "videoId": "video_12345",
    "type": "subtitles",
    "status": "processing",
    "params": {
      "subtitlesCount": 2,
      "style": {
        "fontSize": 24,
        "position": "bottom"
      }
    },
    "createdAt": "2023-04-26T10:40:00Z",
    "estimatedCompletionTime": "2023-04-26T10:42:00Z"
  }
}`}
              implementationNotes={[
                "Use FFmpeg's drawtext filter for adding text",
                "Consider generating a subtitle file (SRT) first",
                "Use enable='between(t,start,end)' for timing control",
                "Store subtitle information in the database for future reference"
              ]}
              onTryOut={() => handleTryOut("Add Subtitles")}
            />
            
            <ApiEndpoint 
              id="render"
              title="Render Video Endpoint"
              method="POST"
              icon="motion_photos_on"
              endpoint="/api/videos/:id/render"
              description="Apply all pending operations and render the final video with all edits applied."
              requestFormat={`{
  "Content-Type": "application/json",
  "Body": {
    "operations": ["operation_12345", "operation_23456"],  // Optional - specify which operations to include
    "output": {
      "name": "final-video.mp4",                          // Optional
      "format": "mp4",                                    // Optional - mp4, webm, mov
      "quality": "high"                                  // Optional - low, medium, high
    }
  }
}`}
              responseFormat={`{
  "success": true,
  "data": {
    "id": "render_34567",
    "videoId": "video_12345",
    "status": "processing",
    "progress": 0,
    "operations": ["operation_12345", "operation_23456"],
    "output": {
      "name": "final-video.mp4",
      "format": "mp4",
      "quality": "high"
    },
    "createdAt": "2023-04-26T10:45:00Z",
    "estimatedCompletionTime": "2023-04-26T10:50:00Z"
  }
}`}
              implementationNotes={[
                "This should be implemented as a background job using BullMQ/Redis",
                "Chain multiple FFmpeg operations together",
                "Consider implementing progress tracking",
                "Store the final rendered video with appropriate metadata"
              ]}
              onTryOut={() => handleTryOut("Render Video")}
            />
            
            <ApiEndpoint 
              id="download"
              title="Download Video Endpoint"
              method="GET"
              icon="cloud_download"
              endpoint="/api/videos/:id/download"
              description="Download the rendered video file. If the render is not complete, this will return a status indicating the current progress."
              requestFormat={`// Query parameters
{
  "renderId": "render_34567"  // Optional - specify which render to download (if multiple exists)
}`}
              responseFormat={`// If render is complete:
HTTP/1.1 200 OK
Content-Type: video/mp4
Content-Disposition: attachment; filename="final-video.mp4"
[Binary file content]

// If render is still processing:
HTTP/1.1 202 Accepted
Content-Type: application/json
{
  "status": "processing",
  "progress": 65,
  "estimatedCompletionTime": "2023-04-26T10:50:00Z"
}`}
              implementationNotes={[
                "Use Express's res.download() function for serving the file",
                "Implement proper error handling for missing files",
                "Consider implementing streaming for large files",
                "Update download statistics in the database"
              ]}
              onTryOut={() => handleTryOut("Download Video")}
            />
          </section>
        </main>
      </div>
      
      <footer className="bg-white border-t border-neutral-200 py-4 text-center text-neutral-500 text-sm">
        <p>Video Editing API • Version 1.0.0</p>
      </footer>
    </div>
  );
};

export default Home;
