import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Sectors for categorizing viral reels
 */
export const sectors = mysqlTable("sectors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  imageUrl: varchar("imageUrl", { length: 500 }),
  reelsCount: int("reelsCount").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Sector = typeof sectors.$inferSelect;
export type InsertSector = typeof sectors.$inferInsert;

/**
 * Viral videos uploaded for analysis or as library examples
 */
export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  sectorId: int("sectorId").references(() => sectors.id),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  videoUrl: varchar("videoUrl", { length: 500 }).notNull(),
  videoKey: varchar("videoKey", { length: 500 }).notNull(),
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }),
  duration: int("duration"), // in seconds
  fileSize: int("fileSize"), // in bytes
  mimeType: varchar("mimeType", { length: 100 }),
  videoType: mysqlEnum("videoType", ["viral_reference", "user_video", "library_example"]).default("user_video").notNull(),
  isPublic: boolean("isPublic").default(false).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * AI-generated analysis of viral videos
 */
export const videoAnalyses = mysqlTable("video_analyses", {
  id: int("id").autoincrement().primaryKey(),
  videoId: int("videoId").references(() => videos.id).notNull(),
  userId: int("userId").references(() => users.id).notNull(),
  analysisType: mysqlEnum("analysisType", ["viral_analysis", "comparison", "expert_review"]).default("viral_analysis").notNull(),
  // Viral structure analysis
  hookAnalysis: text("hookAnalysis"), // First 3 seconds hook analysis
  structureBreakdown: json("structureBreakdown"), // JSON with timing, cuts, transitions
  viralityFactors: json("viralityFactors"), // JSON with factors that made it viral
  summary: text("summary"), // Overall summary of what happens in the video
  // Comparison fields (when comparing user video to viral)
  comparisonVideoId: int("comparisonVideoId").references(() => videos.id),
  improvementPoints: json("improvementPoints"), // JSON array of improvement suggestions
  cutRecommendations: json("cutRecommendations"), // JSON with specific cut timing suggestions
  editingSuggestions: text("editingSuggestions"),
  // Scoring
  overallScore: int("overallScore"), // 0-100
  hookScore: int("hookScore"),
  pacingScore: int("pacingScore"),
  engagementScore: int("engagementScore"),
  // Status
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoAnalysis = typeof videoAnalyses.$inferSelect;
export type InsertVideoAnalysis = typeof videoAnalyses.$inferInsert;

/**
 * Support tickets for 24h expert support
 */
export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  videoId: int("videoId").references(() => videos.id),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  category: mysqlEnum("category", ["analysis_help", "video_review", "technical", "general"]).default("general").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "waiting_response", "resolved", "closed"]).default("open").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  // Expert response
  expertResponse: text("expertResponse"),
  loomVideoUrl: varchar("loomVideoUrl", { length: 500 }),
  respondedAt: timestamp("respondedAt"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

/**
 * Messages within support tickets
 */
export const ticketMessages = mysqlTable("ticket_messages", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").references(() => supportTickets.id).notNull(),
  userId: int("userId").references(() => users.id),
  isFromSupport: boolean("isFromSupport").default(false).notNull(),
  message: text("message").notNull(),
  attachmentUrl: varchar("attachmentUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = typeof ticketMessages.$inferInsert;
