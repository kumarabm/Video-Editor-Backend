import mongoose, { Document, Schema, Model } from 'mongoose';

// User Interface
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}

// Video Interface
export interface IVideo extends Document {
  name: string;
  description?: string;
  filename: string;
  duration?: number;
  fileSize?: number;
  status: string;
  url: string;
  createdAt: Date;
}

// Operation Interface
export interface IOperation extends Document {
  videoId: mongoose.Types.ObjectId;
  type: string; // 'trim' | 'subtitles'
  status: string; // 'pending' | 'processing' | 'completed' | 'failed'
  params: any;
  output?: {
    filename?: string;
    path?: string;
  };
  progress?: number;
  error?: string;
  createdAt: Date;
}

// Render Interface
export interface IRender extends Document {
  videoId: mongoose.Types.ObjectId;
  operations: mongoose.Types.ObjectId[];
  status: string; // 'pending' | 'processing' | 'completed' | 'failed'
  progress: number;
  output: {
    name?: string;
    format?: string;
    quality?: string;
    path?: string;
  };
  error?: string;
  createdAt: Date;
}

// User Schema
const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Video Schema
const VideoSchema = new Schema<IVideo>({
  name: { type: String, required: true },
  description: { type: String },
  filename: { type: String, required: true },
  duration: { type: Number },
  fileSize: { type: Number },
  status: { type: String, required: true, default: 'uploaded' },
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Operation Schema
const OperationSchema = new Schema<IOperation>({
  videoId: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
  type: { type: String, required: true },
  status: { type: String, required: true, default: 'pending' },
  params: { type: Schema.Types.Mixed, required: true },
  output: {
    filename: { type: String },
    path: { type: String }
  },
  progress: { type: Number, default: 0 },
  error: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Render Schema
const RenderSchema = new Schema<IRender>({
  videoId: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
  operations: [{ type: Schema.Types.ObjectId, ref: 'Operation' }],
  status: { type: String, required: true, default: 'pending' },
  progress: { type: Number, default: 0 },
  output: {
    name: { type: String },
    format: { type: String },
    quality: { type: String },
    path: { type: String }
  },
  error: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Create models
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Video: Model<IVideo> = mongoose.models.Video || mongoose.model<IVideo>('Video', VideoSchema);
export const Operation: Model<IOperation> = mongoose.models.Operation || mongoose.model<IOperation>('Operation', OperationSchema);
export const Render: Model<IRender> = mongoose.models.Render || mongoose.model<IRender>('Render', RenderSchema);

// Define input validation schemas for the client-side
export const trimRequestSchema = {
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  output: {
    name: { type: String }
  }
};

export const subtitleRequestSchema = {
  subtitles: [
    {
      text: { type: String, required: true },
      startTime: { type: Number, required: true },
      endTime: { type: Number, required: true }
    }
  ],
  style: {
    fontSize: { type: Number },
    fontColor: { type: String },
    backgroundColor: { type: String },
    position: { type: String, enum: ['top', 'middle', 'bottom'] }
  }
};

export const renderRequestSchema = {
  operations: [{ type: Schema.Types.ObjectId }],
  output: {
    name: { type: String },
    format: { type: String, enum: ['mp4', 'webm', 'mov'] },
    quality: { type: String, enum: ['low', 'medium', 'high'] }
  }
};