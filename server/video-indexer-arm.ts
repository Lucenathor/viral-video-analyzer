/**
 * Azure Video Indexer ARM Account Service
 * Uses Azure AD authentication for the paid ARM account
 */

const VI_API_URL = 'https://api.videoindexer.ai';

// ARM Account configuration from environment variables
const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID;
const RESOURCE_GROUP = process.env.AZURE_RESOURCE_GROUP;
const ACCOUNT_NAME = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_NAME;
const ACCOUNT_ID = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_ID;
const LOCATION = process.env.AZURE_VIDEO_INDEXER_LOCATION || 'eastus';

interface VideoIndexerInsights {
  transcript?: string;
  keywords?: string[];
  topics?: string[];
  faces?: { name: string; confidence: number }[];
  emotions?: { type: string; confidence: number }[];
  scenes?: { start: string; end: string; description: string }[];
  labels?: string[];
  brands?: string[];
  duration?: number;
  language?: string;
}

/**
 * Get Azure AD token for ARM API access
 */
async function getAzureADToken(): Promise<string | null> {
  try {
    if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
      console.error('[ARM] Missing Azure AD credentials');
      return null;
    }

    const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'https://management.azure.com/.default',
      grant_type: 'client_credentials',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      console.error(`[ARM] Failed to get Azure AD token: ${response.status}`);
      const errorText = await response.text();
      console.error('[ARM] Error:', errorText);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('[ARM] Error getting Azure AD token:', error);
    return null;
  }
}

/**
 * Get Video Indexer access token using ARM API
 */
async function getVideoIndexerAccessToken(permission: 'Reader' | 'Contributor' = 'Contributor'): Promise<string | null> {
  try {
    const armToken = await getAzureADToken();
    if (!armToken) {
      console.error('[ARM] Failed to get ARM token');
      return null;
    }

    if (!SUBSCRIPTION_ID || !RESOURCE_GROUP || !ACCOUNT_NAME) {
      console.error('[ARM] Missing ARM configuration');
      return null;
    }

    const url = `https://management.azure.com/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.VideoIndexer/accounts/${ACCOUNT_NAME}/generateAccessToken?api-version=2024-01-01`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${armToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        permissionType: permission,
        scope: 'Account',
      }),
    });

    if (!response.ok) {
      console.error(`[ARM] Failed to get Video Indexer token: ${response.status}`);
      const errorText = await response.text();
      console.error('[ARM] Error:', errorText);
      return null;
    }

    const data = await response.json();
    return data.accessToken;
  } catch (error) {
    console.error('[ARM] Error getting Video Indexer token:', error);
    return null;
  }
}

/**
 * Upload a video to Video Indexer for analysis
 */
export async function uploadVideoForAnalysis(
  videoUrl: string,
  videoName: string,
  description?: string
): Promise<{ videoId: string; state: string } | null> {
  try {
    console.log('[ARM] Starting video upload for:', videoName);
    
    const accessToken = await getVideoIndexerAccessToken('Contributor');
    if (!accessToken) {
      console.error('[ARM] Failed to get access token for upload');
      return null;
    }

    const params = new URLSearchParams({
      accessToken,
      name: videoName,
      description: description || 'Video uploaded for viral analysis',
      privacy: 'Private',
      videoUrl,
      language: 'auto',
      indexingPreset: 'Default',
      sendSuccessEmail: 'false',
    });

    const url = `${VI_API_URL}/${LOCATION}/Accounts/${ACCOUNT_ID}/Videos?${params.toString()}`;
    console.log('[ARM] Upload URL:', url.substring(0, 100) + '...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[ARM] Failed to upload video: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('[ARM] Error details:', errorText);
      return null;
    }

    const result = await response.json();
    console.log('[ARM] Video uploaded successfully:', result.id);
    return {
      videoId: result.id,
      state: result.state,
    };
  } catch (error) {
    console.error('[ARM] Error uploading video:', error);
    return null;
  }
}

/**
 * Get the indexing status of a video
 */
export async function getVideoIndexingStatus(videoId: string): Promise<{
  state: string;
  progress: number;
} | null> {
  try {
    const accessToken = await getVideoIndexerAccessToken('Reader');
    if (!accessToken) {
      return null;
    }

    const url = `${VI_API_URL}/${LOCATION}/Accounts/${ACCOUNT_ID}/Videos/${videoId}/Index?accessToken=${accessToken}`;

    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return {
      state: result.state,
      progress: result.processingProgress || 0,
    };
  } catch (error) {
    console.error('[ARM] Error getting video status:', error);
    return null;
  }
}

/**
 * Get video insights after indexing is complete
 */
export async function getVideoInsights(videoId: string): Promise<VideoIndexerInsights | null> {
  try {
    const accessToken = await getVideoIndexerAccessToken('Reader');
    if (!accessToken) {
      return null;
    }

    const url = `${VI_API_URL}/${LOCATION}/Accounts/${ACCOUNT_ID}/Videos/${videoId}/Index?accessToken=${accessToken}&includeSummarizedInsights=true`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[ARM] Failed to get video insights: ${response.status}`);
      return null;
    }

    const result = await response.json();
    
    // Extract relevant insights
    const insights: VideoIndexerInsights = {
      duration: result.durationInSeconds,
      language: result.sourceLanguage,
    };

    // Extract transcript
    if (result.videos?.[0]?.insights?.transcript) {
      insights.transcript = result.videos[0].insights.transcript
        .map((t: { text: string }) => t.text)
        .join(' ');
    }

    // Extract keywords
    if (result.videos?.[0]?.insights?.keywords) {
      insights.keywords = result.videos[0].insights.keywords
        .map((k: { text: string }) => k.text);
    }

    // Extract topics
    if (result.videos?.[0]?.insights?.topics) {
      insights.topics = result.videos[0].insights.topics
        .map((t: { name: string }) => t.name);
    }

    // Extract emotions
    if (result.videos?.[0]?.insights?.emotions) {
      insights.emotions = result.videos[0].insights.emotions
        .map((e: { type: string; sepiScore: number }) => ({
          type: e.type,
          confidence: e.sepiScore,
        }));
    }

    // Extract scenes
    if (result.videos?.[0]?.insights?.scenes) {
      insights.scenes = result.videos[0].insights.scenes
        .map((s: { start: string; end: string }) => ({
          start: s.start,
          end: s.end,
          description: '',
        }));
    }

    // Extract labels
    if (result.videos?.[0]?.insights?.labels) {
      insights.labels = result.videos[0].insights.labels
        .map((l: { name: string }) => l.name);
    }

    // Extract brands
    if (result.videos?.[0]?.insights?.brands) {
      insights.brands = result.videos[0].insights.brands
        .map((b: { name: string }) => b.name);
    }

    // Extract faces
    if (result.videos?.[0]?.insights?.faces) {
      insights.faces = result.videos[0].insights.faces
        .map((f: { name: string; confidence: number }) => ({
          name: f.name || 'Unknown',
          confidence: f.confidence || 0,
        }));
    }

    return insights;
  } catch (error) {
    console.error('[ARM] Error getting video insights:', error);
    return null;
  }
}

/**
 * Check if the Video Indexer ARM API is available
 */
export async function checkArmApiStatus(): Promise<boolean> {
  try {
    console.log('[ARM] Checking API status...');
    const accessToken = await getVideoIndexerAccessToken('Reader');
    const isAvailable = accessToken !== null;
    console.log('[ARM] API status:', isAvailable ? 'Available' : 'Not available');
    return isAvailable;
  } catch (error) {
    console.error('[ARM] Error checking API status:', error);
    return false;
  }
}

/**
 * Format insights for display in the analysis
 */
export function formatInsightsForAnalysis(insights: VideoIndexerInsights): string {
  const parts: string[] = [];

  if (insights.transcript) {
    parts.push(`**Transcripción del vídeo:**\n${insights.transcript}`);
  }

  if (insights.keywords?.length) {
    parts.push(`**Palabras clave detectadas:** ${insights.keywords.join(', ')}`);
  }

  if (insights.topics?.length) {
    parts.push(`**Temas identificados:** ${insights.topics.join(', ')}`);
  }

  if (insights.emotions?.length) {
    const emotionStr = insights.emotions
      .map(e => `${e.type} (${Math.round(e.confidence * 100)}%)`)
      .join(', ');
    parts.push(`**Emociones detectadas:** ${emotionStr}`);
  }

  if (insights.labels?.length) {
    parts.push(`**Etiquetas visuales:** ${insights.labels.join(', ')}`);
  }

  if (insights.brands?.length) {
    parts.push(`**Marcas detectadas:** ${insights.brands.join(', ')}`);
  }

  if (insights.duration) {
    const minutes = Math.floor(insights.duration / 60);
    const seconds = insights.duration % 60;
    parts.push(`**Duración:** ${minutes}:${seconds.toString().padStart(2, '0')}`);
  }

  if (insights.scenes?.length) {
    parts.push(`**Número de escenas:** ${insights.scenes.length}`);
  }

  return parts.join('\n\n');
}
