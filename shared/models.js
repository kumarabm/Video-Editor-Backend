import mongoose from 'mongoose';
import { z } from 'zod';

const { Schema } = mongoose;

// USER SCHEMA
const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// VIDEO SCHEMA
const VideoSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  filename: { type: String, required: true },
  duration: { type: Number },
  fileSize: { type: Number },
  status: { 
    type: String, 
    enum: ['uploading', 'ready', 'processing', 'error'], 
    default: 'uploading' 
  },
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// OPERATION SCHEMA (for trim, subtitles, etc.)
const OperationSchema = new Schema({
  videoId: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
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
  params: { type: Schema.Types.Mixed, required: true },
  output: {
    filename: String,
    path: String
  },
  progress: { type: Number, default: 0 },
  error: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// RENDER SCHEMA (final video with operations applied)
const RenderSchema = new Schema({
  videoId: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
  operations: [{ type: Schema.Types.ObjectId, ref: 'Operation' }],
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending'
  },
  progress: { type: Number, default: 0 },
  output: {
    name: String,
    format: { type: String, default: 'mp4' },
    quality: { type: String, default: 'high' },
    path: String
  },
  error: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Create models (only if they don't already exist)
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Video = mongoose.models.Video || mongoose.model('Video', VideoSchema);
export const Operation = mongoose.models.Operation || mongoose.model('Operation', OperationSchema);
export const Render = mongoose.models.Render || mongoose.model('Render', RenderSchema);

// Zod validation schemas
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
    fontSize: z.number().optional(),
    fontColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    position: z.enum(['top', 'middle', 'bottom']).optional()
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