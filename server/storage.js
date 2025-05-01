import mongoose from 'mongoose';
import { User, Video, Operation, Render } from '../shared/models.js';

// Interface for storage operations
// MongoDB implementation
export class MongoDBStorage {
  constructor() {
    // Initialize in-memory storage regardless (we'll use it as fallback)
    this.inMemoryStorage = {
      users: [],
      videos: [],
      operations: [],
      renders: []
    };
    this.idCounters = {
      users: 1,
      videos: 1,
      operations: 1,
      renders: 1
    };
    
    // Check if MongoDB is connected (we'll update this after each connection attempt)
    this.updateConnectionStatus();
    
    console.log(`Storage initialized. Using ${this.isConnected ? 'MongoDB' : 'in-memory storage'}`);
  }
  
  updateConnectionStatus() {
    // Check either global flag or mongoose connection state
    this.isConnected = global.__USING_REAL_DATABASE__ === true || 
                       mongoose.connection.readyState === 1;
    
    if (!this.isConnected) {
      console.warn('MongoDB not connected - using in-memory storage fallback');
    }
  }
  // User operations
  async getUser(id) {
    this.updateConnectionStatus();
    try {
      if (!this.isConnected) {
        // Use in-memory storage fallback
        const user = this.inMemoryStorage.users.find(u => u._id === id || u.id === id);
        return user || null;
      }
      return await User.findById(id);
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getUserByUsername(username) {
    this.updateConnectionStatus();
    try {
      if (!this.isConnected) {
        // Use in-memory storage fallback
        const user = this.inMemoryStorage.users.find(u => u.username === username);
        return user || null;
      }
      return await User.findOne({ username });
    } catch (error) {
      console.error('Error getting user by username:', error);
      return null;
    }
  }

  async createUser(user) {
    this.updateConnectionStatus();
    try {
      if (!this.isConnected) {
        // Use in-memory storage fallback
        const newUser = {
          ...user,
          _id: String(this.idCounters.users++),
          id: String(this.idCounters.users-1),
          createdAt: new Date(),
          toObject: function() { return this; }
        };
        this.inMemoryStorage.users.push(newUser);
        return newUser;
      }
      return await User.create(user);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Video operations
  async createVideo(video) {
    this.updateConnectionStatus();
    try {
      if (!this.isConnected) {
        // Use in-memory storage fallback
        const newVideo = {
          ...video,
          _id: String(this.idCounters.videos++),
          id: String(this.idCounters.videos-1),
          createdAt: new Date(),
          toObject: function() { return this; }
        };
        this.inMemoryStorage.videos.push(newVideo);
        return newVideo;
      }
      return await Video.create(video);
    } catch (error) {
      console.error('Error creating video:', error);
      throw error;
    }
  }

  async getVideo(id) {
    this.updateConnectionStatus();
    try {
      if (!this.isConnected) {
        // Use in-memory storage fallback
        const video = this.inMemoryStorage.videos.find(v => v._id === id || v.id === id);
        return video || null;
      }
      return await Video.findById(id);
    } catch (error) {
      console.error('Error getting video:', error);
      return null;
    }
  }

  async updateVideo(id, updates) {
    try {
      if (!this.isConnected) {
        // Use in-memory storage fallback
        const videoIndex = this.inMemoryStorage.videos.findIndex(v => v._id === id || v.id === id);
        if (videoIndex >= 0) {
          this.inMemoryStorage.videos[videoIndex] = {
            ...this.inMemoryStorage.videos[videoIndex],
            ...updates,
            toObject: function() { return this; }
          };
          return this.inMemoryStorage.videos[videoIndex];
        }
        return null;
      }
      return await Video.findByIdAndUpdate(id, updates, { new: true });
    } catch (error) {
      console.error('Error updating video:', error);
      return null;
    }
  }

  async getAllVideos(limit = 100) {
    try {
      if (!this.isConnected) {
        // Use in-memory storage fallback
        return this.inMemoryStorage.videos
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, limit);
      }
      return await Video.find().sort({ createdAt: -1 }).limit(limit);
    } catch (error) {
      console.error('Error getting all videos:', error);
      return [];
    }
  }

  async deleteVideo(id) {
    try {
      if (!this.isConnected) {
        // Use in-memory storage fallback
        const initialLength = this.inMemoryStorage.videos.length;
        this.inMemoryStorage.videos = this.inMemoryStorage.videos.filter(v => v._id !== id && v.id !== id);
        return this.inMemoryStorage.videos.length < initialLength;
      }
      const result = await Video.deleteOne({ _id: id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting video:', error);
      return false;
    }
  }

  // Operation operations
  async createOperation(operation) {
    try {
      if (!this.isConnected) {
        // Use in-memory storage fallback
        const newOperation = {
          ...operation,
          _id: String(this.idCounters.operations++),
          id: String(this.idCounters.operations-1),
          createdAt: new Date(),
          toObject: function() { return this; }
        };
        this.inMemoryStorage.operations.push(newOperation);
        return newOperation;
      }
      
      if (typeof operation.videoId === 'string') {
        try {
          operation.videoId = new mongoose.Types.ObjectId(operation.videoId);
        } catch (err) {
          console.warn('Invalid ObjectId format for operation.videoId:', operation.videoId);
        }
      }
      return await Operation.create(operation);
    } catch (error) {
      console.error('Error creating operation:', error);
      throw error;
    }
  }

  async getOperation(id) {
    try {
      if (!this.isConnected) {
        // Use in-memory storage fallback
        const operation = this.inMemoryStorage.operations.find(o => o._id === id || o.id === id);
        return operation || null;
      }
      return await Operation.findById(id);
    } catch (error) {
      console.error('Error getting operation:', error);
      return null;
    }
  }

  async getVideoOperations(videoId) {
    try {
      if (!this.isConnected) {
        // Use in-memory storage fallback
        return this.inMemoryStorage.operations
          .filter(o => String(o.videoId) === String(videoId))
          .sort((a, b) => b.createdAt - a.createdAt);
      }
      return await Operation.find({ videoId }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting video operations:', error);
      return [];
    }
  }

  async updateOperation(id, updates) {
    try {
      if (!this.isConnected) {
        // Use in-memory storage fallback
        const opIndex = this.inMemoryStorage.operations.findIndex(o => o._id === id || o.id === id);
        if (opIndex >= 0) {
          this.inMemoryStorage.operations[opIndex] = {
            ...this.inMemoryStorage.operations[opIndex],
            ...updates,
            toObject: function() { return this; }
          };
          return this.inMemoryStorage.operations[opIndex];
        }
        return null;
      }
      return await Operation.findByIdAndUpdate(id, updates, { new: true });
    } catch (error) {
      console.error('Error updating operation:', error);
      return null;
    }
  }

  // Render operations
  async createRender(render) {
    try {
      if (!this.isConnected) {
        // Use in-memory storage fallback
        // No need to convert to ObjectIds in in-memory mode
        const newRender = {
          ...render,
          _id: String(this.idCounters.renders++),
          id: String(this.idCounters.renders-1),
          createdAt: new Date(),
          toObject: function() { return this; }
        };
        this.inMemoryStorage.renders.push(newRender);
        return newRender;
      }
      
      // MongoDB is connected - now we need to convert IDs to ObjectIds
      if (typeof render.videoId === 'string') {
        try {
          render.videoId = new mongoose.Types.ObjectId(render.videoId);
        } catch (err) {
          console.warn('Invalid ObjectId format for render.videoId:', render.videoId);
        }
      }
      
      // Only try to convert operation IDs to ObjectId if MongoDB is connected
      if (render.operations && Array.isArray(render.operations)) {
        // Handle operations separately from the main render object to avoid validation issues
        const validOperations = [];
        
        for (const opId of render.operations) {
          if (typeof opId === 'string') {
            try {
              validOperations.push(new mongoose.Types.ObjectId(opId));
            } catch (err) {
              console.warn('Skipping invalid ObjectId format:', opId);
            }
          } else {
            validOperations.push(opId);
          }
        }
        
        render.operations = validOperations;
      }
      
      return await Render.create(render);
    } catch (error) {
      console.error('Error creating render:', error);
      
      // If MongoDB validation fails, fall back to in-memory storage
      const newRender = {
        ...render,
        _id: String(this.idCounters.renders++),
        id: String(this.idCounters.renders-1),
        createdAt: new Date(),
        toObject: function() { return this; }
      };
      this.inMemoryStorage.renders.push(newRender);
      console.log('MongoDB validation failed, using in-memory storage instead');
      return newRender;
    }
  }

  async getRender(id) {
    try {
      if (!this.isConnected) {
        // Use in-memory storage fallback
        const render = this.inMemoryStorage.renders.find(r => r._id === id || r.id === id);
        return render || null;
      }
      return await Render.findById(id);
    } catch (error) {
      console.error('Error getting render:', error);
      return null;
    }
  }

  async getVideoRenders(videoId) {
    try {
      if (!this.isConnected) {
        // Use in-memory storage fallback
        return this.inMemoryStorage.renders
          .filter(r => String(r.videoId) === String(videoId))
          .sort((a, b) => b.createdAt - a.createdAt);
      }
      return await Render.find({ videoId }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting video renders:', error);
      return [];
    }
  }

  async updateRender(id, updates) {
    try {
      if (!this.isConnected) {
        // Use in-memory storage fallback
        const renderIndex = this.inMemoryStorage.renders.findIndex(r => r._id === id || r.id === id);
        if (renderIndex >= 0) {
          this.inMemoryStorage.renders[renderIndex] = {
            ...this.inMemoryStorage.renders[renderIndex],
            ...updates,
            toObject: function() { return this; }
          };
          return this.inMemoryStorage.renders[renderIndex];
        }
        return null;
      }
      return await Render.findByIdAndUpdate(id, updates, { new: true });
    } catch (error) {
      console.error('Error updating render:', error);
      return null;
    }
  }

  async getRecentJobs(limit = 10) {
    try {
      if (!this.isConnected) {
        // Use in-memory storage fallback
        const operations = this.inMemoryStorage.operations;
        const renders = this.inMemoryStorage.renders;
        
        // Combine and sort them
        const allJobs = [...operations, ...renders];
        allJobs.sort((a, b) => b.createdAt - a.createdAt);
        
        // Return only the first 'limit' items
        return allJobs.slice(0, limit);
      }
    
      // Find both operations and renders, sort by creation time
      const operations = await Operation.find().sort({ createdAt: -1 }).limit(limit);
      const renders = await Render.find().sort({ createdAt: -1 }).limit(limit);
      
      // Combine and sort them
      const allJobs = [...operations, ...renders];
      allJobs.sort((a, b) => b.createdAt - a.createdAt);
      
      // Return only the first 'limit' items
      return allJobs.slice(0, limit);
    } catch (error) {
      console.error('Error getting recent jobs:', error);
      return [];
    }
  }
}

export const storage = new MongoDBStorage();