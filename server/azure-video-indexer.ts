import axios from "axios";

const AZURE_VIDEO_INDEXER_ACCOUNT_ID = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_ID || "";
const AZURE_VIDEO_INDEXER_API_KEY = process.env.AZURE_VIDEO_INDEXER_API_KEY || "";
const AZURE_VIDEO_INDEXER_LOCATION = process.env.AZURE_VIDEO_INDEXER_LOCATION || "eastus";
const API_BASE_URL = "https://api.videoindexer.ai";

interface VideoIndexerToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: VideoIndexerToken | null = null;

/**
 * Get access token for Azure Video Indexer API
 */
export async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.accessToken;
  }

  if (!AZURE_VIDEO_INDEXER_ACCOUNT_ID || !AZURE_VIDEO_INDEXER_API_KEY) {
    throw new Error("Azure Video Indexer credentials not configured");
  }

  try {
    const response = await axios.get(
      `${API_BASE_URL}/Auth/${AZURE_VIDEO_INDEXER_LOCATION}/Accounts/${AZURE_VIDEO_INDEXER_ACCOUNT_ID}/AccessToken`,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_VIDEO_INDEXER_API_KEY,
        },
        params: {
          allowEdit: true,
        },
      }
    );

    const accessToken = response.data;
    cachedToken = {
      accessToken,
      expiresAt: Date.now() + 3600000, // Token valid for 1 hour
    };

    return accessToken;
  } catch (error) {
    console.error("Failed to get Video Indexer access token:", error);
    throw new Error("Failed to authenticate with Azure Video Indexer");
  }
}

/**
 * Upload a video to Azure Video Indexer for analysis
 */
export async function uploadVideo(
  videoUrl: string,
  videoName: string,
  description?: string
): Promise<{ videoId: string; state: string }> {
  const accessToken = await getAccessToken();

  try {
    const response = await axios.post(
      `${API_BASE_URL}/${AZURE_VIDEO_INDEXER_LOCATION}/Accounts/${AZURE_VIDEO_INDEXER_ACCOUNT_ID}/Videos`,
      null,
      {
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          accessToken,
          name: videoName,
          description: description || "Video uploaded for viral analysis",
          videoUrl,
          language: "es-ES",
          indexingPreset: "Default",
          streamingPreset: "NoStreaming",
          privacy: "Private",
        },
      }
    );

    return {
      videoId: response.data.id,
      state: response.data.state,
    };
  } catch (error) {
    console.error("Failed to upload video to Video Indexer:", error);
    throw new Error("Failed to upload video for analysis");
  }
}

/**
 * Get the indexing status of a video
 */
export async function getVideoIndex(videoId: string): Promise<VideoIndexResult | null> {
  const accessToken = await getAccessToken();

  try {
    const response = await axios.get(
      `${API_BASE_URL}/${AZURE_VIDEO_INDEXER_LOCATION}/Accounts/${AZURE_VIDEO_INDEXER_ACCOUNT_ID}/Videos/${videoId}/Index`,
      {
        params: {
          accessToken,
          language: "es-ES",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to get video index:", error);
    return null;
  }
}

/**
 * Wait for video indexing to complete
 */
export async function waitForIndexing(
  videoId: string,
  maxWaitMs: number = 300000, // 5 minutes max
  pollIntervalMs: number = 10000 // Poll every 10 seconds
): Promise<VideoIndexResult | null> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const index = await getVideoIndex(videoId);
    
    if (index && index.state === "Processed") {
      return index;
    }

    if (index && index.state === "Failed") {
      throw new Error("Video indexing failed");
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error("Video indexing timed out");
}

/**
 * Extract viral analysis data from Video Indexer results
 */
export function extractViralAnalysisData(index: VideoIndexResult): ExtractedVideoData {
  const video = index.videos?.[0];
  if (!video) {
    throw new Error("No video data found in index");
  }

  const insights = video.insights;

  // Extract transcript
  const transcript = insights?.transcript?.map((t: TranscriptItem) => ({
    text: t.text,
    startTime: t.instances?.[0]?.start || "0:00:00",
    endTime: t.instances?.[0]?.end || "0:00:00",
    confidence: t.confidence || 0,
  })) || [];

  // Extract scenes/shots
  const scenes = insights?.shots?.map((shot: ShotItem) => ({
    id: shot.id,
    startTime: shot.instances?.[0]?.start || "0:00:00",
    endTime: shot.instances?.[0]?.end || "0:00:00",
    keyFrames: shot.keyFrames?.map((kf: KeyFrameItem) => ({
      id: kf.id,
      instances: kf.instances,
    })) || [],
  })) || [];

  // Extract emotions
  const emotions = insights?.emotions?.map((emotion: EmotionItem) => ({
    type: emotion.type,
    instances: emotion.instances?.map((inst: EmotionInstance) => ({
      startTime: inst.start,
      endTime: inst.end,
      confidence: inst.confidence,
    })) || [],
  })) || [];

  // Extract sentiments
  const sentiments = insights?.sentiments?.map((sentiment: SentimentItem) => ({
    sentiment: sentiment.sentimentKey,
    instances: sentiment.instances?.map((inst: SentimentInstance) => ({
      startTime: inst.start,
      endTime: inst.end,
      confidence: inst.confidence,
    })) || [],
  })) || [];

  // Extract keywords/topics
  const keywords = insights?.keywords?.map((kw: KeywordItem) => ({
    text: kw.text,
    confidence: kw.confidence,
    instances: kw.instances?.length || 0,
  })) || [];

  // Extract labels (objects, actions detected)
  const labels = insights?.labels?.map((label: LabelItem) => ({
    name: label.name,
    instances: label.instances?.length || 0,
  })) || [];

  // Calculate duration
  const durationSeconds = parseDuration(video.durationInSeconds || insights?.duration || "0");

  return {
    transcript,
    scenes,
    emotions,
    sentiments,
    keywords,
    labels,
    durationSeconds,
    language: insights?.language || "es",
  };
}

/**
 * Parse duration string to seconds
 */
function parseDuration(duration: string | number): number {
  if (typeof duration === "number") {
    return duration;
  }
  
  // Handle HH:MM:SS format
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parseFloat(duration) || 0;
}

/**
 * Check if Azure Video Indexer is configured and available
 */
export function isVideoIndexerConfigured(): boolean {
  return !!(AZURE_VIDEO_INDEXER_ACCOUNT_ID && AZURE_VIDEO_INDEXER_API_KEY);
}

/**
 * Test the connection to Azure Video Indexer
 */
export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    await getAccessToken();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Type definitions
interface VideoIndexResult {
  state: string;
  videos?: Array<{
    durationInSeconds?: number;
    insights?: {
      duration?: string;
      language?: string;
      transcript?: TranscriptItem[];
      shots?: ShotItem[];
      emotions?: EmotionItem[];
      sentiments?: SentimentItem[];
      keywords?: KeywordItem[];
      labels?: LabelItem[];
    };
  }>;
}

interface TranscriptItem {
  text: string;
  confidence?: number;
  instances?: Array<{ start: string; end: string }>;
}

interface ShotItem {
  id: string;
  instances?: Array<{ start: string; end: string }>;
  keyFrames?: KeyFrameItem[];
}

interface KeyFrameItem {
  id: string;
  instances?: Array<{ start: string; end: string }>;
}

interface EmotionItem {
  type: string;
  instances?: EmotionInstance[];
}

interface EmotionInstance {
  start: string;
  end: string;
  confidence: number;
}

interface SentimentItem {
  sentimentKey: string;
  instances?: SentimentInstance[];
}

interface SentimentInstance {
  start: string;
  end: string;
  confidence: number;
}

interface KeywordItem {
  text: string;
  confidence: number;
  instances?: Array<unknown>;
}

interface LabelItem {
  name: string;
  instances?: Array<unknown>;
}

export interface ExtractedVideoData {
  transcript: Array<{
    text: string;
    startTime: string;
    endTime: string;
    confidence: number;
  }>;
  scenes: Array<{
    id: string;
    startTime: string;
    endTime: string;
    keyFrames: Array<{
      id: string;
      instances?: Array<{ start: string; end: string }>;
    }>;
  }>;
  emotions: Array<{
    type: string;
    instances: Array<{
      startTime: string;
      endTime: string;
      confidence: number;
    }>;
  }>;
  sentiments: Array<{
    sentiment: string;
    instances: Array<{
      startTime: string;
      endTime: string;
      confidence: number;
    }>;
  }>;
  keywords: Array<{
    text: string;
    confidence: number;
    instances: number;
  }>;
  labels: Array<{
    name: string;
    instances: number;
  }>;
  durationSeconds: number;
  language: string;
}
