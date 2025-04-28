import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table (keeping the existing one)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Videos table to store uploaded videos
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  originalPath: text("original_path").notNull(),
  duration: doublePrecision("duration"),
  fileSize: integer("file_size"),
  status: text("status").notNull().default("uploaded"), // uploaded, processing, ready
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const videosRelations = relations(videos, ({ many }) => ({
  operations: many(operations),
  renders: many(renders),
}));

// Video operations (trim, subtitles, etc.)
export const operations = pgTable("operations", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // trim, subtitles, etc.
  params: jsonb("params").notNull(), // Store operation-specific parameters
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  resultPath: text("result_path"), // Path to the result of this operation
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const operationsRelations = relations(operations, ({ one }) => ({
  video: one(videos, {
    fields: [operations.videoId],
    references: [videos.id],
  }),
}));

// Render jobs that combine multiple operations
export const renders = pgTable("renders", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
  operations: jsonb("operations"), // Array of operation IDs to include
  outputPath: text("output_path"), // Path to the rendered video
  outputName: text("output_name"),
  outputFormat: text("output_format").default("mp4"),
  quality: text("quality").default("high"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  progress: integer("progress").default(0), // 0-100 percentage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  estimatedCompletionTime: timestamp("estimated_completion_time"),
});

export const rendersRelations = relations(renders, ({ one }) => ({
  video: one(videos, {
    fields: [renders.videoId],
    references: [videos.id],
  }),
}));

// Insert schemas for validation
export const insertVideoSchema = createInsertSchema(videos)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertOperationSchema = createInsertSchema(operations)
  .omit({ id: true, createdAt: true, updatedAt: true, resultPath: true });

export const insertRenderSchema = createInsertSchema(renders)
  .omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true, 
    outputPath: true, 
    progress: true, 
    estimatedCompletionTime: true 
  });

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type Operation = typeof operations.$inferSelect;
export type InsertOperation = z.infer<typeof insertOperationSchema>;

export type Render = typeof renders.$inferSelect;
export type InsertRender = z.infer<typeof insertRenderSchema>;

// Zod schemas for API validation
export const trimRequestSchema = z.object({
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  output: z.object({
    name: z.string().optional(),
  }).optional(),
});

export const subtitleRequestSchema = z.object({
  subtitles: z.array(z.object({
    text: z.string(),
    startTime: z.number().min(0),
    endTime: z.number().min(0),
  })),
  style: z.object({
    fontSize: z.number().optional(),
    fontColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    position: z.enum(['top', 'middle', 'bottom']).optional(),
  }).optional(),
});

export const renderRequestSchema = z.object({
  operations: z.array(z.number()).optional(),
  output: z.object({
    name: z.string().optional(),
    format: z.enum(['mp4', 'webm', 'mov']).optional(),
    quality: z.enum(['low', 'medium', 'high']).optional(),
  }).optional(),
});
