import mongoose from 'mongoose';
import { z } from 'zod';

// Schema for User
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Schema for Video
const VideoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  filename: {
    type: String,
    required: true
  },
  duration: {
    type: Number
  },
  fileSize: {
    type: Number
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'ready', 'error'],
    default: 'uploaded'
  },
  url: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Schema for Operation (trim, subtitle, etc.)
const OperationSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  type: {
    type: String,
    enum: ['trim', 'subtitles'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  params: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  output: {
    filename: String,
    path: String
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  error: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Schema for Render
const RenderSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  operations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Operation'
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  output: {
    name: String,
    format: {
      type: String,
      enum: ['mp4', 'webm', 'mov'],
      default: 'mp4'
    },
    quality: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'high'
    },
    path: String
  },
  error: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Models
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Video = mongoose.models.Video || mongoose.model('Video', VideoSchema);
export const Operation = mongoose.models.Operation || mongoose.model('Operation', OperationSchema);
export const Render = mongoose.models.Render || mongoose.model('Render', RenderSchema);

// Validation schemas using Zod
export const trimRequestSchema = z.object({
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  output: z.object({
    name: z.string().optional()
  }).optional()
});

export const subtitleRequestSchema = z.object({
  subtitles: z.array(z.object({
    text: z.string(),
    startTime: z.number().min(0),
    endTime: z.number().min(0)
  })),
  style: z.object({
    fontName: z.string().optional(),
    fontSize: z.number().optional(),
    fontColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    position: z.string().optional()
  }).optional()
});

export const renderRequestSchema = z.object({
  operations: z.array(z.string()).optional(),
  output: z.object({
    name: z.string().optional(),
    format: z.enum(['mp4', 'webm', 'mov']).optional(),
    quality: z.enum(['low', 'medium', 'high']).optional()
  }).optional()
});

// Export interfaces to maintain compatibility with TypeScript code
export const interfaces = {
  IUser: UserSchema,
  IVideo: VideoSchema,
  IOperation: OperationSchema,
  IRender: RenderSchema
};