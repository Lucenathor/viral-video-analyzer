import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, decimal } from "drizzle-orm/mysql-core";

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

/**
 * Story generation history for "Lanzamientos en Caliente"
 */
export const storyHistory = mysqlTable("story_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  sectorId: varchar("sectorId", { length: 100 }).notNull(),
  sectorCustom: varchar("sectorCustom", { length: 255 }),
  objective: varchar("objective", { length: 100 }).notNull(),
  offer: text("offer"),
  urgencyType: varchar("urgencyType", { length: 50 }).notNull(),
  urgencyValue: varchar("urgencyValue", { length: 100 }).notNull(),
  ctaKeyword: varchar("ctaKeyword", { length: 50 }).notNull(),
  variant: varchar("variant", { length: 50 }).notNull(),
  result: json("result").notNull(), // JSON with the generated stories
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StoryHistory = typeof storyHistory.$inferSelect;
export type InsertStoryHistory = typeof storyHistory.$inferInsert;


/**
 * Calendar progress tracking for users
 */
export const calendarProgress = mysqlTable("calendar_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  sectorId: varchar("sectorId", { length: 100 }).notNull(),
  videoId: varchar("videoId", { length: 100 }).notNull(),
  scheduledDate: timestamp("scheduledDate").notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarProgress = typeof calendarProgress.$inferSelect;
export type InsertCalendarProgress = typeof calendarProgress.$inferInsert;

/**
 * Scheduled stories from "Lanzamientos en Caliente" added to calendar
 */
export const scheduledStories = mysqlTable("scheduled_stories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(),
  storyHistoryId: int("storyHistoryId").references(() => storyHistory.id).notNull(),
  scheduledDate: timestamp("scheduledDate").notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledStory = typeof scheduledStories.$inferSelect;
export type InsertScheduledStory = typeof scheduledStories.$inferInsert;


/**
 * User subscriptions - Stripe integration
 * Only stores essential Stripe IDs, not duplicate data
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  // Cache subscription status for quick access (synced via webhooks)
  status: mysqlEnum("status", ["active", "canceled", "past_due", "trialing", "incomplete"]).default("incomplete").notNull(),
  plan: mysqlEnum("plan", ["free", "basic", "pro", "enterprise"]).default("free").notNull(),
  // Usage limits based on plan
  analysisCount: int("analysisCount").default(0).notNull(),
  storiesCount: int("storiesCount").default(0).notNull(),
  // Timestamps
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Pending viral reels - Queue for admin approval
 * Reels found by AI that need manual review before going public
 */
export const pendingReels = mysqlTable("pending_reels", {
  id: int("id").autoincrement().primaryKey(),
  // TikTok data
  tiktokId: varchar("tiktokId", { length: 255 }).notNull().unique(),
  tiktokUrl: varchar("tiktokUrl", { length: 500 }).notNull(),
  authorUsername: varchar("authorUsername", { length: 100 }),
  authorName: varchar("authorName", { length: 255 }),
  // Video metadata
  title: text("title"),
  description: text("description"),
  coverUrl: varchar("coverUrl", { length: 500 }),
  videoUrl: varchar("videoUrl", { length: 500 }),
  duration: int("duration"), // seconds
  // Engagement metrics
  likes: int("likes").default(0).notNull(),
  comments: int("comments").default(0).notNull(),
  shares: int("shares").default(0).notNull(),
  views: int("views").default(0).notNull(),
  // AI analysis
  suggestedSector: varchar("suggestedSector", { length: 100 }),
  viralityExplanation: text("viralityExplanation"), // Why AI thinks it's viral
  viralityScore: int("viralityScore"), // 0-100
  contentAnalysis: json("contentAnalysis"), // Detailed AI analysis
  // Hashtags found
  hashtags: json("hashtags"), // Array of hashtags
  // Search metadata
  searchQuery: varchar("searchQuery", { length: 255 }), // What query found this
  foundAt: timestamp("foundAt").defaultNow().notNull(),
  // Review status
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  // If approved, which sector it was assigned to
  assignedSector: varchar("assignedSector", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PendingReel = typeof pendingReels.$inferSelect;
export type InsertPendingReel = typeof pendingReels.$inferInsert;

/**
 * Approved viral reels - Public library
 * Reels that have been approved by admin and are visible in the library
 */
export const approvedReels = mysqlTable("approved_reels", {
  id: int("id").autoincrement().primaryKey(),
  pendingReelId: int("pendingReelId").references(() => pendingReels.id),
  // TikTok data (copied for quick access)
  tiktokId: varchar("tiktokId", { length: 255 }).notNull().unique(),
  tiktokUrl: varchar("tiktokUrl", { length: 500 }).notNull(),
  authorUsername: varchar("authorUsername", { length: 100 }),
  authorName: varchar("authorName", { length: 255 }),
  // Video metadata
  title: text("title"),
  description: text("description"),
  coverUrl: varchar("coverUrl", { length: 500 }),
  videoUrl: varchar("videoUrl", { length: 500 }),
  duration: int("duration"),
  // Engagement metrics (snapshot at approval time)
  likes: int("likes").default(0).notNull(),
  comments: int("comments").default(0).notNull(),
  shares: int("shares").default(0).notNull(),
  views: int("views").default(0).notNull(),
  // Sector assignment
  sectorSlug: varchar("sectorSlug", { length: 100 }).notNull(),
  // Admin notes about why this is a good example
  viralityExplanation: text("viralityExplanation"),
  teachingPoints: json("teachingPoints"), // What users can learn from this
  // Display order
  displayOrder: int("displayOrder").default(0).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  // Timestamps
  approvedBy: int("approvedBy").references(() => users.id),
  approvedAt: timestamp("approvedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApprovedReel = typeof approvedReels.$inferSelect;
export type InsertApprovedReel = typeof approvedReels.$inferInsert;


/**
 * Calendar assignments - Reels assigned to specific dates for users
 * Controls what reels users see on their calendar based on subscription
 */
export const calendarAssignments = mysqlTable("calendar_assignments", {
  id: int("id").autoincrement().primaryKey(),
  // Reel reference
  approvedReelId: int("approvedReelId").references(() => approvedReels.id).notNull(),
  // Sector this assignment is for
  sectorSlug: varchar("sectorSlug", { length: 100 }).notNull(),
  // Date assignment (day of month, 1-31)
  dayOfMonth: int("dayOfMonth").notNull(),
  // Month/Year for specific assignment
  month: int("month").notNull(), // 1-12
  year: int("year").notNull(),
  // Order within the day (for multiple reels per day)
  orderInDay: int("orderInDay").default(1).notNull(),
  // Active status
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarAssignment = typeof calendarAssignments.$inferSelect;
export type InsertCalendarAssignment = typeof calendarAssignments.$inferInsert;

/**
 * Subscription billing type tracking
 * To know if user paid monthly or annually
 */
export const subscriptionBillingType = mysqlTable("subscription_billing_type", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull().unique(),
  billingType: mysqlEnum("billingType", ["monthly", "annual"]).default("monthly").notNull(),
  // For annual: which months are unlocked
  startMonth: int("startMonth"), // 1-12
  startYear: int("startYear"),
  endMonth: int("endMonth"), // 1-12
  endYear: int("endYear"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionBillingType = typeof subscriptionBillingType.$inferSelect;
export type InsertSubscriptionBillingType = typeof subscriptionBillingType.$inferInsert;


/**
 * Labeled reels for training - Admin labels reels as viral/not viral
 * This is the training data for the learning system
 */
export const labeledReels = mysqlTable("labeled_reels", {
  id: int("id").autoincrement().primaryKey(),
  // TikTok data
  tiktokId: varchar("tiktokId", { length: 255 }).notNull().unique(),
  tiktokUrl: varchar("tiktokUrl", { length: 500 }).notNull(),
  authorUsername: varchar("authorUsername", { length: 100 }),
  // Video metadata
  description: text("description"),
  coverUrl: varchar("coverUrl", { length: 500 }),
  duration: int("duration"), // seconds
  // Engagement metrics at time of labeling
  likes: int("likes").default(0).notNull(),
  comments: int("comments").default(0).notNull(),
  shares: int("shares").default(0).notNull(),
  views: int("views").default(0).notNull(),
  // Calculated ratios
  likeToViewRatio: decimal("likeToViewRatio", { precision: 10, scale: 6 }),
  commentToViewRatio: decimal("commentToViewRatio", { precision: 10, scale: 6 }),
  shareToViewRatio: decimal("shareToViewRatio", { precision: 10, scale: 6 }),
  engagementRate: decimal("engagementRate", { precision: 10, scale: 6 }),
  // Content features extracted by AI
  hashtags: json("hashtags"), // Array of hashtags
  hasHook: boolean("hasHook"), // Does it have a strong hook in first 3 seconds
  hookType: varchar("hookType", { length: 100 }), // question, statement, action, etc.
  contentType: varchar("contentType", { length: 100 }), // tutorial, transformation, story, etc.
  hasCTA: boolean("hasCTA"), // Has call to action
  hasTextOverlay: boolean("hasTextOverlay"),
  hasTrendingSound: boolean("hasTrendingSound"),
  // Sector assignment
  sectorSlug: varchar("sectorSlug", { length: 100 }).notNull(),
  // LABEL - The key field for training
  isViral: boolean("isViral").notNull(), // true = viral, false = not viral
  // Admin notes on why it's viral or not
  labelNotes: text("labelNotes"),
  labeledBy: int("labeledBy").references(() => users.id).notNull(),
  labeledAt: timestamp("labeledAt").defaultNow().notNull(),
  // Search context
  searchQuery: varchar("searchQuery", { length: 255 }),
  publishTime: timestamp("publishTime"), // When the TikTok was published
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LabeledReel = typeof labeledReels.$inferSelect;
export type InsertLabeledReel = typeof labeledReels.$inferInsert;

/**
 * Virality patterns learned from labeled data
 * Stores the patterns/rules learned for each sector
 */
export const viralityPatterns = mysqlTable("virality_patterns", {
  id: int("id").autoincrement().primaryKey(),
  sectorSlug: varchar("sectorSlug", { length: 100 }).notNull(),
  // Pattern metrics (averages from viral reels in this sector)
  avgLikeToViewRatio: decimal("avgLikeToViewRatio", { precision: 10, scale: 6 }),
  avgEngagementRate: decimal("avgEngagementRate", { precision: 10, scale: 6 }),
  minLikesThreshold: int("minLikesThreshold"), // Minimum likes to consider viral
  optimalDurationMin: int("optimalDurationMin"), // Optimal duration range
  optimalDurationMax: int("optimalDurationMax"),
  // Content patterns
  commonHookTypes: json("commonHookTypes"), // Array of most common hook types
  commonContentTypes: json("commonContentTypes"), // Array of most common content types
  topHashtags: json("topHashtags"), // Most used hashtags in viral reels
  // Weights for scoring (learned from data)
  likeWeight: decimal("likeWeight", { precision: 5, scale: 3 }).default("0.3"),
  commentWeight: decimal("commentWeight", { precision: 5, scale: 3 }).default("0.2"),
  shareWeight: decimal("shareWeight", { precision: 5, scale: 3 }).default("0.3"),
  viewWeight: decimal("viewWeight", { precision: 5, scale: 3 }).default("0.2"),
  // Training stats
  totalLabeledReels: int("totalLabeledReels").default(0).notNull(),
  viralReelsCount: int("viralReelsCount").default(0).notNull(),
  notViralReelsCount: int("notViralReelsCount").default(0).notNull(),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }), // Model accuracy %
  lastTrainedAt: timestamp("lastTrainedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ViralityPattern = typeof viralityPatterns.$inferSelect;
export type InsertViralityPattern = typeof viralityPatterns.$inferInsert;

/**
 * Candidate reels for review - Found by search, waiting for labeling
 */
export const candidateReels = mysqlTable("candidate_reels", {
  id: int("id").autoincrement().primaryKey(),
  // TikTok data
  tiktokId: varchar("tiktokId", { length: 255 }).notNull().unique(),
  tiktokUrl: varchar("tiktokUrl", { length: 500 }).notNull(),
  authorUsername: varchar("authorUsername", { length: 100 }),
  authorName: varchar("authorName", { length: 255 }),
  // Video metadata
  description: text("description"),
  coverUrl: varchar("coverUrl", { length: 500 }),
  videoUrl: varchar("videoUrl", { length: 500 }),
  duration: int("duration"),
  // Engagement metrics
  likes: int("likes").default(0).notNull(),
  comments: int("comments").default(0).notNull(),
  shares: int("shares").default(0).notNull(),
  views: int("views").default(0).notNull(),
  // Hashtags
  hashtags: json("hashtags"),
  // Search context
  searchQuery: varchar("searchQuery", { length: 255 }).notNull(),
  sectorSlug: varchar("sectorSlug", { length: 100 }).notNull(),
  publishTime: timestamp("publishTime"),
  // AI predicted score (before human review)
  predictedViralScore: int("predictedViralScore"), // 0-100
  predictedViralReason: text("predictedViralReason"),
  // Status
  status: mysqlEnum("status", ["pending", "labeled", "skipped"]).default("pending").notNull(),
  foundAt: timestamp("foundAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CandidateReel = typeof candidateReels.$inferSelect;
export type InsertCandidateReel = typeof candidateReels.$inferInsert;
