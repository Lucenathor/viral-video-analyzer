// Azure Video Indexer Service
// Handles video upload, indexing, and analysis retrieval with thumbnail extraction

import { ENV } from '../_core/env';

const AZURE_TENANT_ID = ENV.AZURE_TENANT_ID;
const AZURE_CLIENT_ID = ENV.AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET = ENV.AZURE_CLIENT_SECRET;
const AZURE_SUBSCRIPTION_ID = ENV.AZURE_SUBSCRIPTION_ID;
const AZURE_RESOURCE_GROUP = ENV.AZURE_RESOURCE_GROUP;
const AZURE_VIDEO_INDEXER_ACCOUNT_NAME = ENV.AZURE_VIDEO_INDEXER_ACCOUNT_NAME;
const AZURE_VIDEO_INDEXER_ACCOUNT_ID = ENV.AZURE_VIDEO_INDEXER_ACCOUNT_ID;
const AZURE_VIDEO_INDEXER_LOCATION = ENV.AZURE_VIDEO_INDEXER_LOCATION;

// Cache for tokens
let azureADTokenCache: { token: string; expiresAt: number } | null = null;
let viTokenCache: { token: string; expiresAt: number } | null = null;

/**
 * Get Azure AD token for management API
 */
async function getAzureADToken(): Promise<string> {
  if (azureADTokenCache && Date.now() < azureADTokenCache.expiresAt) {
    return azureADTokenCache.token;
  }

  const tokenUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams();
  params.append('client_id', AZURE_CLIENT_ID!);
  params.append('client_secret', AZURE_CLIENT_SECRET!);
  params.append('scope', 'https://management.azure.com/.default');
  params.append('grant_type', 'client_credentials');
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Azure AD token: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  azureADTokenCache = {
    token: result.access_token,
    expiresAt: Date.now() + 50 * 60 * 1000,
  };
  
  return result.access_token;
}

/**
 * Get Video Indexer access token
 */
async function getVideoIndexerToken(): Promise<string> {
  if (viTokenCache && Date.now() < viTokenCache.expiresAt) {
    return viTokenCache.token;
  }

  const azureToken = await getAzureADToken();
  
  const url = `https://management.azure.com/subscriptions/${AZURE_SUBSCRIPTION_ID}/resourceGroups/${AZURE_RESOURCE_GROUP}/providers/Microsoft.VideoIndexer/accounts/${AZURE_VIDEO_INDEXER_ACCOUNT_NAME}/generateAccessToken?api-version=2025-04-01`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${azureToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      permissionType: 'Contributor',
      scope: 'Account',
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Video Indexer token: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  viTokenCache = {
    token: result.accessToken,
    expiresAt: Date.now() + 50 * 60 * 1000,
  };
  
  return result.accessToken;
}

/**
 * Upload video to Azure Video Indexer
 */
export async function uploadVideoToIndexer(
  videoUrl: string,
  videoName: string,
  language: string = 'Spanish'
): Promise<string> {
  const viToken = await getVideoIndexerToken();
  
  const uploadUrl = `https://api.videoindexer.ai/${AZURE_VIDEO_INDEXER_LOCATION}/Accounts/${AZURE_VIDEO_INDEXER_ACCOUNT_ID}/Videos?accessToken=${viToken}&name=${encodeURIComponent(videoName)}&videoUrl=${encodeURIComponent(videoUrl)}&language=${language}&indexingPreset=Default&streamingPreset=NoStreaming&preventDuplicates=false`;
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    if (result.ErrorType === 'VIDEO_ALREADY_IN_PROGRESS' || result.ErrorType === 'VIDEO_ALREADY_EXISTS') {
      const match = result.Message?.match(/video id: '([^']+)'/);
      if (match) {
        return match[1];
      }
    }
    throw new Error(`Failed to upload video: ${response.status} - ${JSON.stringify(result)}`);
  }
  
  return result.id;
}

/**
 * Get video index/analysis status
 */
export async function getVideoIndex(videoId: string): Promise<any> {
  const viToken = await getVideoIndexerToken();
  
  const statusUrl = `https://api.videoindexer.ai/${AZURE_VIDEO_INDEXER_LOCATION}/Accounts/${AZURE_VIDEO_INDEXER_ACCOUNT_ID}/Videos/${videoId}/Index?accessToken=${viToken}`;
  
  const response = await fetch(statusUrl);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get video index: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Get thumbnail URLs from video index result
 */
export async function getThumbnailUrls(videoId: string, indexResult: any): Promise<{ url: string; time: string }[]> {
  const viToken = await getVideoIndexerToken();
  const thumbnails: { url: string; time: string }[] = [];
  
  const video = indexResult.videos?.[0];
  const insights = video?.insights || {};
  
  // Get keyframes from shots
  if (insights.shots) {
    for (const shot of insights.shots.slice(0, 15)) { // Limit to 15 shots
      for (const keyFrame of (shot.keyFrames || []).slice(0, 2)) {
        const thumbnailId = keyFrame.instances?.[0]?.thumbnailId;
        if (thumbnailId) {
          const url = `https://api.videoindexer.ai/${AZURE_VIDEO_INDEXER_LOCATION}/Accounts/${AZURE_VIDEO_INDEXER_ACCOUNT_ID}/Videos/${videoId}/Thumbnails/${thumbnailId}?accessToken=${viToken}&format=Jpeg`;
          thumbnails.push({
            url,
            time: keyFrame.instances?.[0]?.start || '0:00:00'
          });
        }
      }
    }
  }
  
  return thumbnails;
}

/**
 * Download thumbnail as base64
 */
export async function downloadThumbnailAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch (e) {
    console.error('Error downloading thumbnail:', e);
    return null;
  }
}

/**
 * Get all thumbnails as base64
 */
export async function getThumbnailsBase64(videoId: string, indexResult: any, maxThumbnails: number = 10): Promise<string[]> {
  const thumbnailUrls = await getThumbnailUrls(videoId, indexResult);
  const thumbnailsBase64: string[] = [];
  
  for (const thumb of thumbnailUrls.slice(0, maxThumbnails)) {
    const base64 = await downloadThumbnailAsBase64(thumb.url);
    if (base64) {
      thumbnailsBase64.push(base64);
    }
  }
  
  return thumbnailsBase64;
}

/**
 * Wait for video indexing to complete
 */
export async function waitForIndexing(
  videoId: string,
  maxWaitMinutes: number = 30,
  onProgress?: (state: string, elapsed: number) => void
): Promise<any> {
  const startTime = Date.now();
  const maxWaitMs = maxWaitMinutes * 60 * 1000;
  
  while (Date.now() - startTime < maxWaitMs) {
    const status = await getVideoIndex(videoId);
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    
    if (onProgress) {
      onProgress(status.state, elapsed);
    }
    
    if (status.state === 'Processed') {
      return status;
    }
    
    if (status.state === 'Failed') {
      throw new Error(`Video indexing failed: ${JSON.stringify(status)}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  throw new Error('Timeout waiting for video indexing');
}

/**
 * Extract complete data from Azure Video Indexer result
 */
export function extractFullAzureData(indexResult: any): {
  transcript: string;
  transcriptWithTimestamps: string;
  duration: number;
  language: string;
  resolution: string;
  topics: string[];
  keywords: string[];
  sentiments: { type: string; score: number }[];
  emotions: { type: string; score: number }[];
  speakers: number;
  locations: string[];
  people: string[];
  brands: string[];
  objects: string[];
  labels: string[];
  audioEffects: string[];
  shots: { start: string; end: string }[];
} {
  const video = indexResult.videos?.[0];
  const insights = video?.insights || {};
  
  // Transcript with timestamps
  const transcriptWithTimestamps = insights.transcript
    ?.map((t: any) => `[${t.instances?.[0]?.start || ''}] ${t.text}`)
    .join('\n') || '';
  
  // Plain transcript
  const transcript = insights.transcript
    ?.map((t: any) => t.text)
    .join(' ') || '';
  
  return {
    transcript,
    transcriptWithTimestamps,
    duration: video?.durationInSeconds || 0,
    language: video?.language || 'unknown',
    resolution: `${indexResult.width || 0}x${indexResult.height || 0}`,
    topics: insights.topics?.map((t: any) => `${t.name} (${(t.confidence * 100).toFixed(0)}%)`) || [],
    keywords: insights.keywords?.map((k: any) => k.text) || [],
    sentiments: insights.sentiments?.map((s: any) => ({ type: s.sentimentType, score: s.averageScore })) || [],
    emotions: insights.emotions?.map((e: any) => ({ type: e.type, score: e.averageScore })) || [],
    speakers: insights.speakers?.length || 0,
    locations: insights.namedLocations?.map((l: any) => l.name) || [],
    people: insights.namedPeople?.map((p: any) => p.name) || [],
    brands: insights.brands?.map((b: any) => b.name) || [],
    objects: insights.detectedObjects?.map((o: any) => o.displayName) || [],
    labels: insights.labels?.map((l: any) => l.name) || [],
    audioEffects: insights.audioEffects?.map((a: any) => a.type) || [],
    shots: insights.shots?.map((s: any) => ({
      start: s.keyFrames?.[0]?.instances?.[0]?.start || '',
      end: s.keyFrames?.[0]?.instances?.[0]?.end || ''
    })) || []
  };
}

// Legacy function for backwards compatibility
export function extractViralAnalysis(indexResult: any) {
  const data = extractFullAzureData(indexResult);
  return {
    transcript: data.transcript,
    duration: data.duration,
    language: data.language,
    topics: data.topics.map(t => t.split(' (')[0]), // Remove confidence
    keywords: data.keywords,
    sentiments: data.sentiments,
    speakers: data.speakers,
    locations: data.locations,
    people: data.people,
    objects: data.objects,
    audioEffects: data.audioEffects,
  };
}

/**
 * Full video analysis pipeline with thumbnails
 */
export async function analyzeVideoComplete(
  videoUrl: string,
  videoName: string,
  onProgress?: (message: string) => void
): Promise<{
  videoId: string;
  indexResult: any;
  azureData: ReturnType<typeof extractFullAzureData>;
  thumbnailsBase64: string[];
}> {
  // Step 1: Upload video
  if (onProgress) onProgress('Subiendo vídeo a Azure Video Indexer...');
  const videoId = await uploadVideoToIndexer(videoUrl, videoName);
  
  // Step 2: Wait for indexing
  if (onProgress) onProgress('Procesando vídeo con Azure IA...');
  const indexResult = await waitForIndexing(videoId, 30, (state, elapsed) => {
    if (onProgress) {
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      onProgress(`Azure procesando: ${state} (${mins}m ${secs}s)`);
    }
  });
  
  // Step 3: Extract full data
  if (onProgress) onProgress('Extrayendo datos de Azure...');
  const azureData = extractFullAzureData(indexResult);
  
  // Step 4: Get thumbnails
  if (onProgress) onProgress('Descargando frames del vídeo...');
  const thumbnailsBase64 = await getThumbnailsBase64(videoId, indexResult, 10);
  
  return {
    videoId,
    indexResult,
    azureData,
    thumbnailsBase64,
  };
}

// Legacy function
export async function analyzeVideo(
  videoUrl: string,
  videoName: string,
  onProgress?: (message: string) => void
) {
  const result = await analyzeVideoComplete(videoUrl, videoName, onProgress);
  return {
    videoId: result.videoId,
    indexResult: result.indexResult,
    analysis: extractViralAnalysis(result.indexResult),
  };
}
