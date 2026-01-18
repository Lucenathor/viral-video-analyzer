/**
 * Azure Video Indexer Trial Account Service
 * Uses the simpler Trial account API that doesn't require Azure AD authentication
 */

const VI_API_URL = 'https://api.videoindexer.ai';
const VI_LOCATION = 'trial';
const VI_ACCOUNT_ID = '6281b6ac-b928-4dd3-b59d-f76415cf0421';

// API Key from the Video Indexer portal
const VI_API_KEY = process.env.AZURE_VIDEO_INDEXER_API_KEY || '48da1830da71434583b5274424508857';

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
 * Get an access token for the Video Indexer API using the Trial account
 */
async function getAccessToken(permission: 'Reader' | 'Contributor' = 'Contributor'): Promise<string | null> {
  try {
    const url = `${VI_API_URL}/Auth/${VI_LOCATION}/Accounts/${VI_ACCOUNT_ID}/AccessToken?allowEdit=${permission === 'Contributor'}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': VI_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to get access token: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return null;
    }

    const token = await response.text();
    // Remove quotes if present
    return token.replace(/"/g, '');
  } catch (error) {
    console.error('Error getting access token:', error);
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
    const accessToken = await getAccessToken('Contributor');
    if (!accessToken) {
      console.error('Failed to get access token for upload');
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

    const url = `${VI_API_URL}/${VI_LOCATION}/Accounts/${VI_ACCOUNT_ID}/Videos?${params.toString()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to upload video: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return null;
    }

    const result = await response.json();
    return {
      videoId: result.id,
      state: result.state,
    };
  } catch (error) {
    console.error('Error uploading video:', error);
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
    const accessToken = await getAccessToken('Reader');
    if (!accessToken) {
      return null;
    }

    const url = `${VI_API_URL}/${VI_LOCATION}/Accounts/${VI_ACCOUNT_ID}/Videos/${videoId}/Index?accessToken=${accessToken}`;

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
    console.error('Error getting video status:', error);
    return null;
  }
}

/**
 * Get video insights after indexing is complete
 */
export async function getVideoInsights(videoId: string): Promise<VideoIndexerInsights | null> {
  try {
    const accessToken = await getAccessToken('Reader');
    if (!accessToken) {
      return null;
    }

    const url = `${VI_API_URL}/${VI_LOCATION}/Accounts/${VI_ACCOUNT_ID}/Videos/${videoId}/Index?accessToken=${accessToken}&includeSummarizedInsights=true`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to get video insights: ${response.status}`);
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
    console.error('Error getting video insights:', error);
    return null;
  }
}

/**
 * Check if the Video Indexer Trial API is available
 */
export async function checkTrialApiStatus(): Promise<boolean> {
  try {
    const accessToken = await getAccessToken('Reader');
    return accessToken !== null;
  } catch {
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
