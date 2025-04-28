import mongoose from 'mongoose';
import { User, Video, Operation, Render, IUser, IVideo, IOperation, IRender } from '@shared/models';

export interface IStorage {
  // User operations
  getUser(id: string): Promise<IUser | null>;
  getUserByUsername(username: string): Promise<IUser | null>;
  createUser(user: Partial<IUser>): Promise<IUser>;

  // Video operations
  createVideo(video: Partial<IVideo>): Promise<IVideo>;
  getVideo(id: string): Promise<IVideo | null>;
  updateVideo(id: string, updates: Partial<IVideo>): Promise<IVideo | null>;
  getAllVideos(limit?: number): Promise<IVideo[]>;
  deleteVideo(id: string): Promise<boolean>;

  // Operation operations
  createOperation(operation: Partial<IOperation>): Promise<IOperation>;
  getOperation(id: string): Promise<IOperation | null>;
  getVideoOperations(videoId: string): Promise<IOperation[]>;
  updateOperation(id: string, updates: Partial<IOperation>): Promise<IOperation | null>;
  
  // Render operations
  createRender(render: Partial<IRender>): Promise<IRender>;
  getRender(id: string): Promise<IRender | null>;
  getVideoRenders(videoId: string): Promise<IRender[]>;
  updateRender(id: string, updates: Partial<IRender>): Promise<IRender | null>;
  getRecentJobs(limit?: number): Promise<(IOperation | IRender)[]>;
}

export class MongoDBStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await User.findById(id);
  }

  async getUserByUsername(username: string): Promise<IUser | null> {
    return await User.findOne({ username });
  }

  async createUser(user: Partial<IUser>): Promise<IUser> {
    const newUser = new User(user);
    return await newUser.save();
  }

  // Video methods
  async createVideo(video: Partial<IVideo>): Promise<IVideo> {
    const newVideo = new Video(video);
    return await newVideo.save();
  }

  async getVideo(id: string): Promise<IVideo | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Video.findById(id);
  }

  async updateVideo(id: string, updates: Partial<IVideo>): Promise<IVideo | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Video.findByIdAndUpdate(id, updates, { new: true });
  }

  async getAllVideos(limit: number = 100): Promise<IVideo[]> {
    return await Video.find().sort({ createdAt: -1 }).limit(limit);
  }

  async deleteVideo(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await Video.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  // Operation methods
  async createOperation(operation: Partial<IOperation>): Promise<IOperation> {
    const newOperation = new Operation(operation);
    return await newOperation.save();
  }

  async getOperation(id: string): Promise<IOperation | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Operation.findById(id);
  }

  async getVideoOperations(videoId: string): Promise<IOperation[]> {
    if (!mongoose.Types.ObjectId.isValid(videoId)) return [];
    return await Operation.find({ videoId }).sort({ createdAt: -1 });
  }

  async updateOperation(id: string, updates: Partial<IOperation>): Promise<IOperation | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Operation.findByIdAndUpdate(id, updates, { new: true });
  }

  // Render methods
  async createRender(render: Partial<IRender>): Promise<IRender> {
    const newRender = new Render(render);
    return await newRender.save();
  }

  async getRender(id: string): Promise<IRender | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Render.findById(id);
  }

  async getVideoRenders(videoId: string): Promise<IRender[]> {
    if (!mongoose.Types.ObjectId.isValid(videoId)) return [];
    return await Render.find({ videoId }).sort({ createdAt: -1 });
  }

  async updateRender(id: string, updates: Partial<IRender>): Promise<IRender | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Render.findByIdAndUpdate(id, updates, { new: true });
  }

  async getRecentJobs(limit: number = 10): Promise<(IOperation | IRender)[]> {
    // Get recent operations and renders, sorted by creation date
    const operations = await Operation.find().sort({ createdAt: -1 }).limit(limit);
    const renders = await Render.find().sort({ createdAt: -1 }).limit(limit);
    
    // Combine and sort by creation date
    const combined = [...operations, ...renders].sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
    
    return combined.slice(0, limit);
  }
}

export const storage = new MongoDBStorage();