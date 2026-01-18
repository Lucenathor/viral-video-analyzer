// Azure Video Indexer Service
// Handles video upload, indexing, and analysis retrieval

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
  // Check cache
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
  
  // Cache token (expires in 1 hour, we cache for 50 minutes)
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
  // Check cache
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
  
  // Cache token (expires in 1 hour, we cache for 50 minutes)
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
    // Check if video already exists
    if (result.ErrorType === 'VIDEO_ALREADY_IN_PROGRESS' || result.ErrorType === 'VIDEO_ALREADY_EXISTS') {
      // Extract video ID from error message
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
    
    // Wait 10 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  throw new Error('Timeout waiting for video indexing');
}

/**
 * Extract viral analysis data from Azure Video Indexer result
 */
export function extractViralAnalysis(indexResult: any): {
  transcript: string;
  duration: number;
  language: string;
  topics: string[];
  keywords: string[];
  sentiments: { type: string; score: number }[];
  speakers: number;
  locations: string[];
  people: string[];
  objects: string[];
  audioEffects: string[];
} {
  const video = indexResult.videos?.[0];
  const insights = video?.insights || {};
  
  // Extract transcript
  const transcript = insights.transcript
    ?.map((t: any) => t.text)
    .join(' ') || '';
  
  // Extract duration in seconds
  const durationStr = video?.durationInSeconds || 0;
  
  // Extract topics
  const topics = insights.topics?.map((t: any) => t.name) || [];
  
  // Extract keywords
  const keywords = insights.keywords?.map((k: any) => k.text) || [];
  
  // Extract sentiments
  const sentiments = insights.sentiments?.map((s: any) => ({
    type: s.sentimentType,
    score: s.averageScore,
  })) || [];
  
  // Extract speakers count
  const speakers = insights.speakers?.length || 0;
  
  // Extract locations
  const locations = insights.namedLocations?.map((l: any) => l.name) || [];
  
  // Extract people
  const people = insights.namedPeople?.map((p: any) => p.name) || [];
  
  // Extract objects
  const objects = insights.detectedObjects?.map((o: any) => o.displayName) || [];
  
  // Extract audio effects
  const audioEffects = insights.audioEffects?.map((a: any) => a.type) || [];
  
  return {
    transcript,
    duration: durationStr,
    language: video?.language || 'unknown',
    topics,
    keywords,
    sentiments,
    speakers,
    locations,
    people,
    objects,
    audioEffects,
  };
}

/**
 * Full video analysis pipeline
 */
export async function analyzeVideo(
  videoUrl: string,
  videoName: string,
  onProgress?: (message: string) => void
): Promise<{
  videoId: string;
  indexResult: any;
  analysis: ReturnType<typeof extractViralAnalysis>;
}> {
  // Step 1: Upload video
  if (onProgress) onProgress('Subiendo vídeo a Azure Video Indexer...');
  const videoId = await uploadVideoToIndexer(videoUrl, videoName);
  
  // Step 2: Wait for indexing
  if (onProgress) onProgress('Procesando vídeo con IA...');
  const indexResult = await waitForIndexing(videoId, 30, (state, elapsed) => {
    if (onProgress) {
      onProgress(`Procesando: ${state} (${Math.round(elapsed / 60)}min ${elapsed % 60}s)`);
    }
  });
  
  // Step 3: Extract analysis
  if (onProgress) onProgress('Extrayendo análisis de viralidad...');
  const analysis = extractViralAnalysis(indexResult);
  
  return {
    videoId,
    indexResult,
    analysis,
  };
}
