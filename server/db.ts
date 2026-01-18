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
