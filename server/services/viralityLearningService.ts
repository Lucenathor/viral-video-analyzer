/**
 * Virality Learning Service
 * Learns from labeled data to predict viral potential
 */

import { getDb } from "../db";
import { labeledReels, viralityPatterns, candidateReels, type LabeledReel } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import type { ProcessedVideo } from "./tiktokAdvancedService";

interface ViralityFeatures {
  hasHook: boolean;
  hookType: string;
  contentType: string;
  hasCTA: boolean;
  hasTextOverlay: boolean;
  hasTrendingSound: boolean;
}

/**
 * Analyze video content with AI to extract features
 */
export async function analyzeVideoFeatures(
  video: ProcessedVideo
): Promise<ViralityFeatures> {
  const prompt = `Analiza este TikTok y extrae las siguientes características:

Descripción: "${video.description}"
Hashtags: ${video.hashtags.join(", ")}
Duración: ${video.duration} segundos
Likes: ${video.likes.toLocaleString()}
Views: ${video.views.toLocaleString()}

Responde SOLO con un JSON válido con estos campos:
{
  "hasHook": boolean,
  "hookType": string,
  "contentType": string,
  "hasCTA": boolean,
  "hasTextOverlay": boolean,
  "hasTrendingSound": boolean
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Eres un experto en análisis de contenido viral de TikTok. Responde SOLO con JSON válido." },
        { role: "user", content: prompt },
      ],
    });

    const content = response.choices[0]?.message?.content || "{}";
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("Error analyzing video features:", error);
  }

  return {
    hasHook: false,
    hookType: "none",
    contentType: "other",
    hasCTA: false,
    hasTextOverlay: false,
    hasTrendingSound: false,
  };
}

/**
 * Label a reel as viral or not viral
 */
export async function labelReel(
  video: ProcessedVideo,
  sectorSlug: string,
  isViral: boolean,
  labelNotes: string,
  labeledBy: number,
  searchQuery: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const features = await analyzeVideoFeatures(video);

  const likeToViewRatio = video.views > 0 ? video.likes / video.views : 0;
  const commentToViewRatio = video.views > 0 ? video.comments / video.views : 0;
  const shareToViewRatio = video.views > 0 ? video.shares / video.views : 0;
  const engagementRate = video.views > 0 
    ? (video.likes + video.comments + video.shares) / video.views 
    : 0;

  await db.insert(labeledReels).values({
    tiktokId: video.tiktokId,
    tiktokUrl: video.tiktokUrl,
    authorUsername: video.authorUsername,
    description: video.description,
    coverUrl: video.coverUrl,
    duration: video.duration,
    likes: video.likes,
    comments: video.comments,
    shares: video.shares,
    views: video.views,
    likeToViewRatio: String(likeToViewRatio),
    commentToViewRatio: String(commentToViewRatio),
    shareToViewRatio: String(shareToViewRatio),
    engagementRate: String(engagementRate),
    hashtags: video.hashtags,
    hasHook: features.hasHook,
    hookType: features.hookType,
    contentType: features.contentType,
    hasCTA: features.hasCTA,
    hasTextOverlay: features.hasTextOverlay,
    hasTrendingSound: features.hasTrendingSound,
    sectorSlug,
    isViral,
    labelNotes,
    labeledBy,
    searchQuery,
    publishTime: video.publishTime,
  }).onDuplicateKeyUpdate({
    set: {
      isViral,
      labelNotes,
      labeledBy,
      sectorSlug,
    },
  });

  await updateSectorPatterns(sectorSlug);
}

/**
 * Update virality patterns for a sector based on labeled data
 */
export async function updateSectorPatterns(sectorSlug: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const viralReels = await db
    .select()
    .from(labeledReels)
    .where(and(
      eq(labeledReels.sectorSlug, sectorSlug),
      eq(labeledReels.isViral, true)
    ));

  const notViralReels = await db
    .select()
    .from(labeledReels)
    .where(and(
      eq(labeledReels.sectorSlug, sectorSlug),
      eq(labeledReels.isViral, false)
    ));

  if (viralReels.length === 0) return;

  const avgLikeToViewRatio = viralReels.reduce(
    (sum: number, r: LabeledReel) => sum + parseFloat(r.likeToViewRatio || "0"), 0
  ) / viralReels.length;

  const avgEngagementRate = viralReels.reduce(
    (sum: number, r: LabeledReel) => sum + parseFloat(r.engagementRate || "0"), 0
  ) / viralReels.length;

  const minLikes = Math.min(...viralReels.map((r: LabeledReel) => r.likes));
  
  const durations = viralReels.map((r: LabeledReel) => r.duration || 0).filter((d: number) => d > 0);
  const optimalDurationMin = durations.length > 0 ? Math.min(...durations) : 10;
  const optimalDurationMax = durations.length > 0 ? Math.max(...durations) : 60;

  const hookTypeCounts: Record<string, number> = {};
  viralReels.forEach((r: LabeledReel) => {
    const hookType = r.hookType || "none";
    hookTypeCounts[hookType] = (hookTypeCounts[hookType] || 0) + 1;
  });
  const commonHookTypes = Object.entries(hookTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type]) => type);

  const contentTypeCounts: Record<string, number> = {};
  viralReels.forEach((r: LabeledReel) => {
    const contentType = r.contentType || "other";
    contentTypeCounts[contentType] = (contentTypeCounts[contentType] || 0) + 1;
  });
  const commonContentTypes = Object.entries(contentTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type]) => type);

  const hashtagCounts: Record<string, number> = {};
  viralReels.forEach((r: LabeledReel) => {
    const hashtags = (r.hashtags as string[]) || [];
    hashtags.forEach((tag: string) => {
      hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
    });
  });
  const topHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag]) => tag);

  const existingPattern = await db
    .select()
    .from(viralityPatterns)
    .where(eq(viralityPatterns.sectorSlug, sectorSlug))
    .limit(1);

  const patternData = {
    sectorSlug,
    avgLikeToViewRatio: String(avgLikeToViewRatio),
    avgEngagementRate: String(avgEngagementRate),
    minLikesThreshold: minLikes,
    optimalDurationMin,
    optimalDurationMax,
    commonHookTypes,
    commonContentTypes,
    topHashtags,
    totalLabeledReels: viralReels.length + notViralReels.length,
    viralReelsCount: viralReels.length,
    notViralReelsCount: notViralReels.length,
    lastTrainedAt: new Date(),
  };

  if (existingPattern.length > 0) {
    await db
      .update(viralityPatterns)
      .set(patternData)
      .where(eq(viralityPatterns.sectorSlug, sectorSlug));
  } else {
    await db.insert(viralityPatterns).values(patternData);
  }
}

/**
 * Predict virality score for a video based on learned patterns
 */
export async function predictViralityScore(
  video: ProcessedVideo,
  sectorSlug: string
): Promise<{ score: number; reason: string }> {
  const db = await getDb();
  if (!db) return basicViralityScore(video);

  const patterns = await db
    .select()
    .from(viralityPatterns)
    .where(eq(viralityPatterns.sectorSlug, sectorSlug))
    .limit(1);

  if (patterns.length === 0) {
    return basicViralityScore(video);
  }

  const pattern = patterns[0];
  let score = 0;
  const reasons: string[] = [];

  const minLikes = pattern.minLikesThreshold || 10000;
  if (video.likes >= minLikes) {
    score += 25;
    reasons.push(`Tiene ${video.likes.toLocaleString()} likes`);
  } else {
    const likeRatio = video.likes / minLikes;
    score += Math.floor(likeRatio * 25);
  }

  const avgEngagement = parseFloat(pattern.avgEngagementRate || "0.05");
  const videoEngagement = video.views > 0 
    ? (video.likes + video.comments + video.shares) / video.views 
    : 0;
  
  if (videoEngagement >= avgEngagement) {
    score += 25;
    reasons.push(`Engagement ${(videoEngagement * 100).toFixed(2)}%`);
  } else {
    const engagementRatio = videoEngagement / avgEngagement;
    score += Math.floor(engagementRatio * 25);
  }

  const minDuration = pattern.optimalDurationMin || 10;
  const maxDuration = pattern.optimalDurationMax || 60;
  if (video.duration >= minDuration && video.duration <= maxDuration) {
    score += 15;
    reasons.push(`Duración óptima: ${video.duration}s`);
  }

  const topHashtags = (pattern.topHashtags as string[]) || [];
  const matchingHashtags = video.hashtags.filter(h => 
    topHashtags.some(th => th.toLowerCase() === h.toLowerCase())
  );
  if (matchingHashtags.length > 0) {
    score += Math.min(matchingHashtags.length * 5, 15);
    reasons.push(`Hashtags virales: ${matchingHashtags.join(", ")}`);
  }

  const features = await analyzeVideoFeatures(video);
  
  const commonHookTypes = (pattern.commonHookTypes as string[]) || [];
  if (features.hasHook && commonHookTypes.includes(features.hookType)) {
    score += 10;
    reasons.push(`Hook tipo "${features.hookType}"`);
  }

  const commonContentTypes = (pattern.commonContentTypes as string[]) || [];
  if (commonContentTypes.includes(features.contentType)) {
    score += 10;
    reasons.push(`Contenido tipo "${features.contentType}"`);
  }

  return {
    score: Math.min(score, 100),
    reason: reasons.join(". ") || "Análisis basado en patrones aprendidos",
  };
}

/**
 * Basic virality score when no patterns exist
 */
function basicViralityScore(video: ProcessedVideo): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  if (video.likes >= 1000000) {
    score += 40;
    reasons.push(`${(video.likes / 1000000).toFixed(1)}M likes`);
  } else if (video.likes >= 100000) {
    score += 30;
    reasons.push(`${(video.likes / 1000).toFixed(0)}K likes`);
  } else if (video.likes >= 10000) {
    score += 20;
    reasons.push(`${(video.likes / 1000).toFixed(0)}K likes`);
  }

  if (video.engagementRate >= 10) {
    score += 30;
    reasons.push(`Engagement ${video.engagementRate.toFixed(1)}%`);
  } else if (video.engagementRate >= 5) {
    score += 20;
    reasons.push(`Engagement ${video.engagementRate.toFixed(1)}%`);
  }

  if (video.likeToViewRatio >= 5) {
    score += 20;
    reasons.push(`Ratio likes/views ${video.likeToViewRatio.toFixed(1)}%`);
  } else if (video.likeToViewRatio >= 2) {
    score += 10;
  }

  if (video.duration >= 10 && video.duration <= 30) {
    score += 10;
    reasons.push("Duración óptima");
  }

  return {
    score: Math.min(score, 100),
    reason: reasons.join(". ") || "Análisis básico de métricas",
  };
}

/**
 * Add candidate reel for review
 */
export async function addCandidateReel(
  video: ProcessedVideo,
  sectorSlug: string,
  searchQuery: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select()
    .from(candidateReels)
    .where(eq(candidateReels.tiktokId, video.tiktokId))
    .limit(1);

  if (existing.length > 0) return;

  const prediction = await predictViralityScore(video, sectorSlug);

  await db.insert(candidateReels).values({
    tiktokId: video.tiktokId,
    tiktokUrl: video.tiktokUrl,
    authorUsername: video.authorUsername,
    authorName: video.authorName,
    description: video.description,
    coverUrl: video.coverUrl,
    videoUrl: video.videoUrl,
    duration: video.duration,
    likes: video.likes,
    comments: video.comments,
    shares: video.shares,
    views: video.views,
    hashtags: video.hashtags,
    searchQuery,
    sectorSlug,
    publishTime: video.publishTime,
    predictedViralScore: prediction.score,
    predictedViralReason: prediction.reason,
  });
}

/**
 * Get sector training stats
 */
export async function getSectorTrainingStats(sectorSlug: string): Promise<{
  totalLabeled: number;
  viralCount: number;
  notViralCount: number;
  accuracy: number | null;
  lastTrained: Date | null;
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalLabeled: 0,
      viralCount: 0,
      notViralCount: 0,
      accuracy: null,
      lastTrained: null,
    };
  }

  const pattern = await db
    .select()
    .from(viralityPatterns)
    .where(eq(viralityPatterns.sectorSlug, sectorSlug))
    .limit(1);

  if (pattern.length === 0) {
    return {
      totalLabeled: 0,
      viralCount: 0,
      notViralCount: 0,
      accuracy: null,
      lastTrained: null,
    };
  }

  return {
    totalLabeled: pattern[0].totalLabeledReels,
    viralCount: pattern[0].viralReelsCount,
    notViralCount: pattern[0].notViralReelsCount,
    accuracy: pattern[0].accuracy ? parseFloat(pattern[0].accuracy) : null,
    lastTrained: pattern[0].lastTrainedAt,
  };
}
