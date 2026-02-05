/**
 * Training Router - Admin endpoints for viral reel training
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { 
  searchTikTokVideos, 
  SECTOR_KEYWORDS,
  type ProcessedVideo 
} from "../services/tiktokAdvancedService";
import { 
  labelReel, 
  addCandidateReel, 
  getSectorTrainingStats,
  predictViralityScore 
} from "../services/viralityLearningService";
import { getDb } from "../db";
import { candidateReels, labeledReels, approvedReels, calendarAssignments } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// Admin check middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const trainingRouter = router({
  /**
   * Search TikTok videos with filters
   */
  searchVideos: adminProcedure
    .input(z.object({
      keywords: z.string().min(1),
      region: z.string().default("es"),
      publishTime: z.number().default(180), // 6 months
      sortType: z.number().default(1), // Sort by likes
      count: z.number().default(30),
      cursor: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await searchTikTokVideos({
          keywords: input.keywords,
          region: input.region,
          publishTime: input.publishTime as 0 | 1 | 7 | 30 | 90 | 180,
          sortType: input.sortType as 0 | 1 | 3,
          count: input.count,
          cursor: input.cursor,
        });
        return result;
      } catch (error) {
        console.error("Search error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Search failed",
        });
      }
    }),

  /**
   * Search videos for a specific sector using predefined keywords
   */
  searchBySector: adminProcedure
    .input(z.object({
      sectorSlug: z.string(),
      publishTime: z.number().default(180),
      count: z.number().default(30),
    }))
    .mutation(async ({ input }) => {
      const keywords = SECTOR_KEYWORDS[input.sectorSlug];
      if (!keywords || keywords.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `No keywords defined for sector: ${input.sectorSlug}`,
        });
      }

      const allVideos: ProcessedVideo[] = [];
      const seen = new Set<string>();

      // Search with first 3 keywords
      for (const keyword of keywords.slice(0, 3)) {
        try {
          const result = await searchTikTokVideos({
            keywords: keyword,
            region: "es",
            publishTime: input.publishTime as 0 | 1 | 7 | 30 | 90 | 180,
            sortType: 1,
            count: input.count,
          });

          for (const video of result.videos) {
            if (!seen.has(video.tiktokId)) {
              seen.add(video.tiktokId);
              allVideos.push(video);
            }
          }
        } catch (error) {
          console.error(`Error searching "${keyword}":`, error);
        }
      }

      // Sort by likes
      return {
        videos: allVideos.sort((a, b) => b.likes - a.likes),
        sectorSlug: input.sectorSlug,
        keywordsUsed: keywords.slice(0, 3),
      };
    }),

  /**
   * Label a video as viral or not viral
   */
  labelVideo: adminProcedure
    .input(z.object({
      video: z.object({
        tiktokId: z.string(),
        tiktokUrl: z.string(),
        authorUsername: z.string(),
        authorName: z.string().optional(),
        authorAvatar: z.string().optional(),
        description: z.string(),
        coverUrl: z.string(),
        videoUrl: z.string().optional(),
        duration: z.number(),
        likes: z.number(),
        comments: z.number(),
        shares: z.number(),
        views: z.number(),
        hashtags: z.array(z.string()),
        publishTime: z.string().or(z.date()),
        engagementRate: z.number(),
        likeToViewRatio: z.number(),
      }),
      sectorSlug: z.string(),
      isViral: z.boolean(),
      notes: z.string().optional(),
      searchQuery: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const processedVideo: ProcessedVideo = {
        ...input.video,
        authorName: input.video.authorName || "",
        authorAvatar: input.video.authorAvatar || "",
        videoUrl: input.video.videoUrl || "",
        publishTime: new Date(input.video.publishTime),
      };

      await labelReel(
        processedVideo,
        input.sectorSlug,
        input.isViral,
        input.notes || "",
        ctx.user.id,
        input.searchQuery || ""
      );

      return { success: true };
    }),

  /**
   * Add video to candidate queue for later review
   */
  addToQueue: adminProcedure
    .input(z.object({
      video: z.object({
        tiktokId: z.string(),
        tiktokUrl: z.string(),
        authorUsername: z.string(),
        authorName: z.string().optional(),
        authorAvatar: z.string().optional(),
        description: z.string(),
        coverUrl: z.string(),
        videoUrl: z.string().optional(),
        duration: z.number(),
        likes: z.number(),
        comments: z.number(),
        shares: z.number(),
        views: z.number(),
        hashtags: z.array(z.string()),
        publishTime: z.string().or(z.date()),
        engagementRate: z.number(),
        likeToViewRatio: z.number(),
      }),
      sectorSlug: z.string(),
      searchQuery: z.string(),
    }))
    .mutation(async ({ input }) => {
      const processedVideo: ProcessedVideo = {
        ...input.video,
        authorName: input.video.authorName || "",
        authorAvatar: input.video.authorAvatar || "",
        videoUrl: input.video.videoUrl || "",
        publishTime: new Date(input.video.publishTime),
      };

      await addCandidateReel(processedVideo, input.sectorSlug, input.searchQuery);
      return { success: true };
    }),

  /**
   * Get candidate reels pending review
   */
  getCandidates: adminProcedure
    .input(z.object({
      sectorSlug: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = db
        .select()
        .from(candidateReels)
        .where(eq(candidateReels.status, "pending"))
        .orderBy(desc(candidateReels.predictedViralScore))
        .limit(input.limit);

      if (input.sectorSlug) {
        query = db
          .select()
          .from(candidateReels)
          .where(and(
            eq(candidateReels.status, "pending"),
            eq(candidateReels.sectorSlug, input.sectorSlug)
          ))
          .orderBy(desc(candidateReels.predictedViralScore))
          .limit(input.limit);
      }

      return query;
    }),

  /**
   * Get labeled reels history
   */
  getLabeledReels: adminProcedure
    .input(z.object({
      sectorSlug: z.string().optional(),
      isViral: z.boolean().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      if (input.sectorSlug && input.isViral !== undefined) {
        return db
          .select()
          .from(labeledReels)
          .where(and(
            eq(labeledReels.sectorSlug, input.sectorSlug),
            eq(labeledReels.isViral, input.isViral)
          ))
          .orderBy(desc(labeledReels.labeledAt))
          .limit(input.limit);
      }

      if (input.sectorSlug) {
        return db
          .select()
          .from(labeledReels)
          .where(eq(labeledReels.sectorSlug, input.sectorSlug))
          .orderBy(desc(labeledReels.labeledAt))
          .limit(input.limit);
      }

      return db
        .select()
        .from(labeledReels)
        .orderBy(desc(labeledReels.labeledAt))
        .limit(input.limit);
    }),

  /**
   * Get training stats for a sector
   */
  getSectorStats: adminProcedure
    .input(z.object({
      sectorSlug: z.string(),
    }))
    .query(async ({ input }) => {
      return getSectorTrainingStats(input.sectorSlug);
    }),

  /**
   * Get all sector stats
   */
  getAllSectorStats: adminProcedure.query(async () => {
    const stats: Record<string, {
      totalLabeled: number;
      viralCount: number;
      notViralCount: number;
    }> = {};

    for (const sectorSlug of Object.keys(SECTOR_KEYWORDS)) {
      const sectorStats = await getSectorTrainingStats(sectorSlug);
      stats[sectorSlug] = {
        totalLabeled: sectorStats.totalLabeled,
        viralCount: sectorStats.viralCount,
        notViralCount: sectorStats.notViralCount,
      };
    }

    return stats;
  }),

  /**
   * Predict virality for a video
   */
  predictVirality: adminProcedure
    .input(z.object({
      video: z.object({
        tiktokId: z.string(),
        tiktokUrl: z.string(),
        authorUsername: z.string(),
        authorName: z.string().optional(),
        authorAvatar: z.string().optional(),
        description: z.string(),
        coverUrl: z.string(),
        videoUrl: z.string().optional(),
        duration: z.number(),
        likes: z.number(),
        comments: z.number(),
        shares: z.number(),
        views: z.number(),
        hashtags: z.array(z.string()),
        publishTime: z.string().or(z.date()),
        engagementRate: z.number(),
        likeToViewRatio: z.number(),
      }),
      sectorSlug: z.string(),
    }))
    .mutation(async ({ input }) => {
      const processedVideo: ProcessedVideo = {
        ...input.video,
        authorName: input.video.authorName || "",
        authorAvatar: input.video.authorAvatar || "",
        videoUrl: input.video.videoUrl || "",
        publishTime: new Date(input.video.publishTime),
      };

      return predictViralityScore(processedVideo, input.sectorSlug);
    }),

  /**
   * Get available sectors with keywords
   */
  getAvailableSectors: adminProcedure.query(() => {
    return Object.entries(SECTOR_KEYWORDS).map(([slug, keywords]) => ({
      slug,
      name: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      keywords,
    }));
  }),

  /**
   * Accept a video for the calendar - marks as viral, adds to approved reels, assigns to calendar
   */
  acceptForCalendar: adminProcedure
    .input(z.object({
      video: z.object({
        tiktokId: z.string(),
        tiktokUrl: z.string(),
        authorUsername: z.string(),
        authorName: z.string().optional(),
        authorAvatar: z.string().optional(),
        description: z.string(),
        coverUrl: z.string(),
        videoUrl: z.string().optional(),
        duration: z.number(),
        likes: z.number(),
        comments: z.number(),
        shares: z.number(),
        views: z.number(),
        hashtags: z.array(z.string()),
        publishTime: z.string().or(z.date()),
        engagementRate: z.number(),
        likeToViewRatio: z.number(),
      }),
      sectorSlug: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const processedVideo: ProcessedVideo = {
        ...input.video,
        authorName: input.video.authorName || "",
        authorAvatar: input.video.authorAvatar || "",
        videoUrl: input.video.videoUrl || "",
        publishTime: new Date(input.video.publishTime),
      };

      // 1. Label as viral
      await labelReel(
        processedVideo,
        input.sectorSlug,
        true, // isViral = true
        input.notes || "Accepted for calendar",
        ctx.user.id,
        ""
      );

      // 2. Check if reel already exists in approved_reels
      const existingReel = await db
        .select()
        .from(approvedReels)
        .where(eq(approvedReels.tiktokId, input.video.tiktokId))
        .limit(1);

      let approvedReelId: number;

      if (existingReel.length > 0) {
        // Reel already approved, use existing ID
        approvedReelId = existingReel[0].id;
      } else {
        // Add new approved reel - use only essential fields
        // Extract just the video ID from tiktokId (remove any URL parts)
        const cleanTiktokId = input.video.tiktokId.split('/').pop()?.split('?')[0] || input.video.tiktokId;
        
        const insertResult = await db.insert(approvedReels).values({
          tiktokId: cleanTiktokId.slice(0, 250), // Ensure it fits in varchar(255)
          tiktokUrl: input.video.tiktokUrl.slice(0, 490),
          authorUsername: input.video.authorUsername?.slice(0, 95) || null,
          authorName: input.video.authorName?.slice(0, 250) || null,
          title: input.video.description?.slice(0, 200) || null,
          description: input.video.description || null,
          coverUrl: input.video.coverUrl?.slice(0, 490) || null,
          videoUrl: input.video.videoUrl?.slice(0, 490) || null,
          duration: input.video.duration || 0,
          likes: input.video.likes || 0,
          comments: input.video.comments || 0,
          shares: input.video.shares || 0,
          views: input.video.views || 0,
          sectorSlug: input.sectorSlug,
          viralityExplanation: input.notes || "Manually approved as viral content",
          approvedBy: ctx.user.id,
        });
        approvedReelId = Number(insertResult[0].insertId);
      }

      // 3. Find next available date for this sector
      const existingAssignments = await db
        .select()
        .from(calendarAssignments)
        .where(eq(calendarAssignments.sectorSlug, input.sectorSlug))
        .orderBy(desc(calendarAssignments.year), desc(calendarAssignments.month), desc(calendarAssignments.dayOfMonth));

      // Calculate next date (2 reels per week: Tuesday and Thursday)
      let nextDate: Date;
      if (existingAssignments.length === 0) {
        // Start from today
        nextDate = new Date();
        // Find next Tuesday or Thursday
        const dayOfWeek = nextDate.getDay();
        if (dayOfWeek <= 2) {
          nextDate.setDate(nextDate.getDate() + (2 - dayOfWeek)); // Next Tuesday
        } else if (dayOfWeek <= 4) {
          nextDate.setDate(nextDate.getDate() + (4 - dayOfWeek)); // Next Thursday
        } else {
          nextDate.setDate(nextDate.getDate() + (9 - dayOfWeek)); // Next Tuesday
        }
      } else {
        // Get last assignment date and add to next slot
        const lastAssignment = existingAssignments[0];
        nextDate = new Date(lastAssignment.year, lastAssignment.month - 1, lastAssignment.dayOfMonth);
        const dayOfWeek = nextDate.getDay();
        if (dayOfWeek === 2) {
          // Was Tuesday, go to Thursday
          nextDate.setDate(nextDate.getDate() + 2);
        } else {
          // Was Thursday (or other), go to next Tuesday
          nextDate.setDate(nextDate.getDate() + (7 - dayOfWeek + 2));
        }
      }

      // 4. Create calendar assignment
      await db.insert(calendarAssignments).values({
        approvedReelId: approvedReelId,
        sectorSlug: input.sectorSlug,
        dayOfMonth: nextDate.getDate(),
        month: nextDate.getMonth() + 1,
        year: nextDate.getFullYear(),
        orderInDay: 1,
        isActive: true,
      });

      return {
        success: true,
        assignedDate: nextDate.toISOString(),
        message: `Vídeo añadido al calendario para ${nextDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
      };
    }),

  /**
   * Get calendar assignments for a sector
   */
  getCalendarAssignments: adminProcedure
    .input(z.object({
      sectorSlug: z.string(),
      month: z.number().optional(),
      year: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const now = new Date();
      const month = input.month || now.getMonth() + 1;
      const year = input.year || now.getFullYear();

      const assignments = await db
        .select({
          id: calendarAssignments.id,
          dayOfMonth: calendarAssignments.dayOfMonth,
          month: calendarAssignments.month,
          year: calendarAssignments.year,
          orderInDay: calendarAssignments.orderInDay,
          reel: {
            id: approvedReels.id,
            tiktokId: approvedReels.tiktokId,
            tiktokUrl: approvedReels.tiktokUrl,
            authorUsername: approvedReels.authorUsername,
            title: approvedReels.title,
            description: approvedReels.description,
            coverUrl: approvedReels.coverUrl,
            duration: approvedReels.duration,
            likes: approvedReels.likes,
            views: approvedReels.views,
          },
        })
        .from(calendarAssignments)
        .innerJoin(approvedReels, eq(calendarAssignments.approvedReelId, approvedReels.id))
        .where(and(
          eq(calendarAssignments.sectorSlug, input.sectorSlug),
          eq(calendarAssignments.month, month),
          eq(calendarAssignments.year, year),
          eq(calendarAssignments.isActive, true)
        ))
        .orderBy(calendarAssignments.dayOfMonth, calendarAssignments.orderInDay);

      return assignments;
    }),

  /**
   * Get total approved reels count per sector
   */
  getApprovedReelsCount: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return {};

    const counts: Record<string, number> = {};
    for (const sectorSlug of Object.keys(SECTOR_KEYWORDS)) {
      const reels = await db
        .select()
        .from(approvedReels)
        .where(eq(approvedReels.sectorSlug, sectorSlug));
      counts[sectorSlug] = reels.length;
    }
    return counts;
  }),
});
