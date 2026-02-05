import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  sectors, InsertSector, Sector,
  videos, InsertVideo, Video,
  videoAnalyses, InsertVideoAnalysis, VideoAnalysis,
  supportTickets, InsertSupportTicket, SupportTicket,
  ticketMessages, InsertTicketMessage, TicketMessage
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER FUNCTIONS ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== SECTOR FUNCTIONS ====================
export async function getAllSectors() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sectors).where(eq(sectors.isActive, true)).orderBy(sectors.name);
}

export async function getSectorBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sectors).where(eq(sectors.slug, slug)).limit(1);
  return result[0];
}

export async function createSector(data: InsertSector) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sectors).values(data);
  return result[0].insertId;
}

export async function updateSectorReelsCount(sectorId: number) {
  const db = await getDb();
  if (!db) return;
  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(videos)
    .where(and(eq(videos.sectorId, sectorId), eq(videos.videoType, "library_example")));
  const count = countResult[0]?.count ?? 0;
  await db.update(sectors).set({ reelsCount: count }).where(eq(sectors.id, sectorId));
}

// ==================== VIDEO FUNCTIONS ====================
export async function createVideo(data: InsertVideo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(videos).values(data);
  return result[0].insertId;
}

export async function getVideoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return result[0];
}

export async function getUserVideos(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videos).where(eq(videos.userId, userId)).orderBy(desc(videos.createdAt));
}

export async function getVideosBySector(sectorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videos)
    .where(and(eq(videos.sectorId, sectorId), eq(videos.videoType, "library_example"), eq(videos.isPublic, true)))
    .orderBy(desc(videos.viewCount));
}

export async function getLibraryVideos(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videos)
    .where(and(eq(videos.videoType, "library_example"), eq(videos.isPublic, true)))
    .orderBy(desc(videos.viewCount))
    .limit(limit);
}

export async function incrementVideoViews(videoId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(videos).set({ viewCount: sql`${videos.viewCount} + 1` }).where(eq(videos.id, videoId));
}

// ==================== VIDEO ANALYSIS FUNCTIONS ====================
export async function createVideoAnalysis(data: InsertVideoAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(videoAnalyses).values(data);
  return result[0].insertId;
}

export async function getVideoAnalysisById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(videoAnalyses).where(eq(videoAnalyses.id, id)).limit(1);
  return result[0];
}

export async function getUserAnalyses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videoAnalyses)
    .where(eq(videoAnalyses.userId, userId))
    .orderBy(desc(videoAnalyses.createdAt));
}

export async function updateVideoAnalysis(id: number, data: Partial<VideoAnalysis>) {
  const db = await getDb();
  if (!db) return;
  await db.update(videoAnalyses).set(data).where(eq(videoAnalyses.id, id));
}

export async function getAnalysesByVideoId(videoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videoAnalyses)
    .where(eq(videoAnalyses.videoId, videoId))
    .orderBy(desc(videoAnalyses.createdAt));
}

// ==================== SUPPORT TICKET FUNCTIONS ====================
export async function createSupportTicket(data: InsertSupportTicket) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(supportTickets).values(data);
  return result[0].insertId;
}

export async function getSupportTicketById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  return result[0];
}

export async function getUserSupportTickets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supportTickets)
    .where(eq(supportTickets.userId, userId))
    .orderBy(desc(supportTickets.createdAt));
}

export async function getAllSupportTickets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
}

export async function updateSupportTicket(id: number, data: Partial<SupportTicket>) {
  const db = await getDb();
  if (!db) return;
  await db.update(supportTickets).set(data).where(eq(supportTickets.id, id));
}

// ==================== TICKET MESSAGE FUNCTIONS ====================
export async function createTicketMessage(data: InsertTicketMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ticketMessages).values(data);
  return result[0].insertId;
}

export async function getTicketMessages(ticketId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ticketMessages)
    .where(eq(ticketMessages.ticketId, ticketId))
    .orderBy(ticketMessages.createdAt);
}


// ==================== STORY HISTORY FUNCTIONS ====================
import { storyHistory, InsertStoryHistory, StoryHistory } from "../drizzle/schema";

export async function createStoryHistory(data: Omit<InsertStoryHistory, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(storyHistory).values(data);
  return result[0].insertId;
}

export async function getStoryHistory(userId: number, limit = 20, sectorId?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (sectorId) {
    return db.select().from(storyHistory)
      .where(and(eq(storyHistory.userId, userId), eq(storyHistory.sectorId, sectorId)))
      .orderBy(desc(storyHistory.createdAt))
      .limit(limit);
  }
  
  return db.select().from(storyHistory)
    .where(eq(storyHistory.userId, userId))
    .orderBy(desc(storyHistory.createdAt))
    .limit(limit);
}

export async function getStoryById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(storyHistory)
    .where(and(eq(storyHistory.id, id), eq(storyHistory.userId, userId)))
    .limit(1);
  return result[0];
}


// ==================== CALENDAR PROGRESS FUNCTIONS ====================
import { calendarProgress, InsertCalendarProgress, CalendarProgress, scheduledStories, InsertScheduledStory, ScheduledStory } from "../drizzle/schema";

export async function getCalendarProgress(userId: number, sectorId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(calendarProgress)
    .where(and(eq(calendarProgress.userId, userId), eq(calendarProgress.sectorId, sectorId)))
    .orderBy(calendarProgress.scheduledDate);
}

export async function upsertCalendarProgress(data: Omit<InsertCalendarProgress, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if entry exists
  const existing = await db.select().from(calendarProgress)
    .where(and(
      eq(calendarProgress.userId, data.userId),
      eq(calendarProgress.sectorId, data.sectorId),
      eq(calendarProgress.videoId, data.videoId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(calendarProgress)
      .set({ 
        isCompleted: data.isCompleted, 
        completedAt: data.isCompleted ? new Date() : null,
        notes: data.notes 
      })
      .where(eq(calendarProgress.id, existing[0].id));
    return existing[0].id;
  } else {
    const result = await db.insert(calendarProgress).values({
      ...data,
      completedAt: data.isCompleted ? new Date() : null
    });
    return result[0].insertId;
  }
}

export async function markVideoCompleted(userId: number, sectorId: string, videoId: string, completed: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(calendarProgress)
    .where(and(
      eq(calendarProgress.userId, userId),
      eq(calendarProgress.sectorId, sectorId),
      eq(calendarProgress.videoId, videoId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(calendarProgress)
      .set({ 
        isCompleted: completed, 
        completedAt: completed ? new Date() : null 
      })
      .where(eq(calendarProgress.id, existing[0].id));
  } else {
    await db.insert(calendarProgress).values({
      userId,
      sectorId,
      videoId,
      scheduledDate: new Date(),
      isCompleted: completed,
      completedAt: completed ? new Date() : null
    });
  }
}

// ==================== SCHEDULED STORIES FUNCTIONS ====================
export async function createScheduledStory(data: Omit<InsertScheduledStory, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(scheduledStories).values(data);
  return result[0].insertId;
}

export async function getScheduledStories(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scheduledStories)
    .where(eq(scheduledStories.userId, userId))
    .orderBy(scheduledStories.scheduledDate);
}

export async function markScheduledStoryCompleted(id: number, userId: number, completed: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(scheduledStories)
    .set({ 
      isCompleted: completed, 
      completedAt: completed ? new Date() : null 
    })
    .where(and(eq(scheduledStories.id, id), eq(scheduledStories.userId, userId)));
}


// ==================== SUBSCRIPTION FUNCTIONS ====================
import { subscriptions, InsertSubscription, Subscription, pendingReels, InsertPendingReel, PendingReel, approvedReels, InsertApprovedReel, ApprovedReel } from "../drizzle/schema";

export async function getUserSubscription(userId: number): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result[0];
}

export async function createOrUpdateSubscription(userId: number, data: Partial<InsertSubscription>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getUserSubscription(userId);
  
  if (existing) {
    await db.update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.userId, userId));
    return existing.id;
  } else {
    const result = await db.insert(subscriptions).values({
      userId,
      ...data,
    });
    return result[0].insertId;
  }
}

export async function updateSubscriptionByStripeId(stripeSubscriptionId: string, data: Partial<Subscription>) {
  const db = await getDb();
  if (!db) return;
  await db.update(subscriptions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
}

export async function getSubscriptionByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.stripeCustomerId, stripeCustomerId)).limit(1);
  return result[0];
}

export async function incrementSubscriptionUsage(userId: number, type: 'analysis' | 'stories') {
  const db = await getDb();
  if (!db) return;
  
  const field = type === 'analysis' ? subscriptions.analysisCount : subscriptions.storiesCount;
  await db.update(subscriptions)
    .set({ [type === 'analysis' ? 'analysisCount' : 'storiesCount']: sql`${field} + 1` })
    .where(eq(subscriptions.userId, userId));
}

export async function resetMonthlyUsage() {
  const db = await getDb();
  if (!db) return;
  await db.update(subscriptions).set({ analysisCount: 0, storiesCount: 0 });
}

// ==================== PENDING REELS FUNCTIONS ====================
export async function createPendingReel(data: Omit<InsertPendingReel, 'id' | 'createdAt' | 'updatedAt' | 'foundAt'>): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if reel already exists
  const existing = await db.select().from(pendingReels).where(eq(pendingReels.tiktokId, data.tiktokId)).limit(1);
  if (existing.length > 0) {
    return existing[0].id;
  }
  
  const result = await db.insert(pendingReels).values(data);
  return result[0].insertId;
}

export async function getPendingReels(status: 'pending' | 'approved' | 'rejected' = 'pending', limit = 50): Promise<PendingReel[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pendingReels)
    .where(eq(pendingReels.status, status))
    .orderBy(desc(pendingReels.foundAt))
    .limit(limit);
}

export async function getPendingReelById(id: number): Promise<PendingReel | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pendingReels).where(eq(pendingReels.id, id)).limit(1);
  return result[0];
}

export async function updatePendingReel(id: number, data: Partial<PendingReel>) {
  const db = await getDb();
  if (!db) return;
  await db.update(pendingReels).set({ ...data, updatedAt: new Date() }).where(eq(pendingReels.id, id));
}

export async function approvePendingReel(id: number, reviewerId: number, assignedSector: string, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update pending reel status
  await db.update(pendingReels).set({
    status: 'approved',
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
    assignedSector,
    reviewNotes: notes,
    updatedAt: new Date(),
  }).where(eq(pendingReels.id, id));
  
  // Get the pending reel data
  const pendingReel = await getPendingReelById(id);
  if (!pendingReel) throw new Error("Pending reel not found");
  
  // Create approved reel
  const result = await db.insert(approvedReels).values({
    pendingReelId: id,
    tiktokId: pendingReel.tiktokId,
    tiktokUrl: pendingReel.tiktokUrl,
    authorUsername: pendingReel.authorUsername,
    authorName: pendingReel.authorName,
    title: pendingReel.title,
    description: pendingReel.description,
    coverUrl: pendingReel.coverUrl,
    videoUrl: pendingReel.videoUrl,
    duration: pendingReel.duration,
    likes: pendingReel.likes,
    comments: pendingReel.comments,
    shares: pendingReel.shares,
    views: pendingReel.views,
    sectorSlug: assignedSector,
    viralityExplanation: pendingReel.viralityExplanation,
    approvedBy: reviewerId,
  });
  
  return result[0].insertId;
}

export async function rejectPendingReel(id: number, reviewerId: number, notes?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(pendingReels).set({
    status: 'rejected',
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
    reviewNotes: notes,
    updatedAt: new Date(),
  }).where(eq(pendingReels.id, id));
}

// ==================== APPROVED REELS FUNCTIONS ====================
export async function getApprovedReels(sectorSlug?: string, limit = 50): Promise<ApprovedReel[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (sectorSlug) {
    return db.select().from(approvedReels)
      .where(eq(approvedReels.sectorSlug, sectorSlug))
      .orderBy(desc(approvedReels.likes))
      .limit(limit);
  }
  
  return db.select().from(approvedReels)
    .orderBy(desc(approvedReels.likes))
    .limit(limit);
}

export async function getApprovedReelById(id: number): Promise<ApprovedReel | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(approvedReels).where(eq(approvedReels.id, id)).limit(1);
  return result[0];
}

export async function getFeaturedReels(limit = 10): Promise<ApprovedReel[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(approvedReels)
    .where(eq(approvedReels.isFeatured, true))
    .orderBy(approvedReels.displayOrder)
    .limit(limit);
}

export async function updateApprovedReel(id: number, data: Partial<ApprovedReel>) {
  const db = await getDb();
  if (!db) return;
  await db.update(approvedReels).set({ ...data, updatedAt: new Date() }).where(eq(approvedReels.id, id));
}

export async function getReelStats() {
  const db = await getDb();
  if (!db) return { pending: 0, approved: 0, rejected: 0 };
  
  const pendingCount = await db.select({ count: sql<number>`count(*)` }).from(pendingReels).where(eq(pendingReels.status, 'pending'));
  const approvedCount = await db.select({ count: sql<number>`count(*)` }).from(approvedReels);
  const rejectedCount = await db.select({ count: sql<number>`count(*)` }).from(pendingReels).where(eq(pendingReels.status, 'rejected'));
  
  return {
    pending: pendingCount[0]?.count ?? 0,
    approved: approvedCount[0]?.count ?? 0,
    rejected: rejectedCount[0]?.count ?? 0,
  };
}
