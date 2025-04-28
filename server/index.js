import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { registerRoutes } from './routes.js';
import { setupVite, serveStatic, log } from './vite.js';
import { connectDatabase } from './db.js';

// Create directories for storing videos if they don't exist
const uploadDir = path.join(process.cwd(), 'uploads');
const originalVideosDir = path.join(uploadDir, 'original');
const processedVideosDir = path.join(uploadDir, 'processed');
const renderedVideosDir = path.join(uploadDir, 'rendered');
const tempDir = path.join(uploadDir, 'temp');

[uploadDir, originalVideosDir, processedVideosDir, renderedVideosDir, tempDir].forEach(dir => {
  fs.mkdir(dir, { recursive: true })
    .then(() => console.log(`Created directory: ${dir}`))
    .catch(err => console.error(`Failed to create directory ${dir}:`, err));
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Connect to MongoDB (this won't throw anymore)
    await connectDatabase();
    
    // Register all routes
    const server = await registerRoutes(app);

    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ 
        success: false,
        message 
      });
      console.error(err);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      console.log(`★★★ Server running at http://0.0.0.0:${port} ★★★`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

// Export the app for testing
export default app;