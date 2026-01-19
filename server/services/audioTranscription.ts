/**
 * Audio transcription service for video analysis
 * Uses Whisper API to transcribe extracted audio from videos
 */
import { ENV } from "../_core/env";
import * as fs from 'fs';

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  success: boolean;
  text: string;
  language: string;
  duration: number;
  segments: TranscriptionSegment[];
  error?: string;
}

/**
 * Transcribe audio file using Whisper API
 * @param audioPath - Path to the local audio file (MP3)
 * @param language - Optional language hint (e.g., "es", "en")
 */
export async function transcribeAudioFile(
  audioPath: string,
  language?: string
): Promise<TranscriptionResult> {
  try {
    // Validate file exists
    if (!fs.existsSync(audioPath)) {
      return {
        success: false,
        text: '',
        language: '',
        duration: 0,
        segments: [],
        error: 'Audio file not found'
      };
    }

    // Check file size (16MB limit for Whisper)
    const stats = fs.statSync(audioPath);
    const sizeMB = stats.size / (1024 * 1024);
    
    if (sizeMB > 16) {
      console.warn(`[Transcription] Audio file is ${sizeMB.toFixed(2)}MB, may need to split`);
      // For now, we'll try anyway - Whisper might handle it
    }

    // Validate environment
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      return {
        success: false,
        text: '',
        language: '',
        duration: 0,
        segments: [],
        error: 'Transcription service not configured'
      };
    }

    // Read audio file
    const audioBuffer = fs.readFileSync(audioPath);
    
    // Create FormData
    const formData = new FormData();
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/mpeg' });
    formData.append("file", audioBlob, "audio.mp3");
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");
    
    // Add language hint if provided
    if (language) {
      formData.append("language", language);
    }
    
    // Add prompt for better accuracy
    formData.append("prompt", "Transcribe this audio accurately, including all spoken words, pauses, and any background sounds or music descriptions.");

    // Call Whisper API
    const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
    const fullUrl = new URL("v1/audio/transcriptions", baseUrl).toString();

    console.log('[Transcription] Calling Whisper API...');
    
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "Accept-Encoding": "identity",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error('[Transcription] API error:', response.status, errorText);
      return {
        success: false,
        text: '',
        language: '',
        duration: 0,
        segments: [],
        error: `Transcription failed: ${response.status} ${errorText}`
      };
    }

    const result = await response.json() as {
      text: string;
      language: string;
      duration: number;
      segments: Array<{
        id: number;
        start: number;
        end: number;
        text: string;
      }>;
    };

    console.log(`[Transcription] Success! Language: ${result.language}, Duration: ${result.duration}s`);
    console.log(`[Transcription] Text preview: ${result.text.substring(0, 100)}...`);

    return {
      success: true,
      text: result.text,
      language: result.language,
      duration: result.duration,
      segments: result.segments.map(s => ({
        id: s.id,
        start: s.start,
        end: s.end,
        text: s.text
      }))
    };

  } catch (error) {
    console.error('[Transcription] Error:', error);
    return {
      success: false,
      text: '',
      language: '',
      duration: 0,
      segments: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Format transcription with timestamps for display
 */
export function formatTranscriptionWithTimestamps(segments: TranscriptionSegment[]): string {
  return segments.map(s => {
    const startTime = formatTime(s.start);
    const endTime = formatTime(s.end);
    return `[${startTime} - ${endTime}] ${s.text.trim()}`;
  }).join('\n');
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Extract key moments from transcription based on content
 */
export function extractKeyMoments(segments: TranscriptionSegment[]): Array<{
  timestamp: number;
  text: string;
  type: 'hook' | 'cta' | 'key_point' | 'question';
}> {
  const keyMoments: Array<{
    timestamp: number;
    text: string;
    type: 'hook' | 'cta' | 'key_point' | 'question';
  }> = [];

  // Patterns to detect
  const ctaPatterns = [
    /suscr[ií]b/i, /follow/i, /like/i, /comenta/i, /comparte/i,
    /link/i, /enlace/i, /bio/i, /descripci[oó]n/i, /click/i,
    /activa/i, /notificaci[oó]n/i, /campana/i
  ];
  
  const questionPatterns = [
    /\?$/, /¿/, /qu[eé]/i, /c[oó]mo/i, /por qu[eé]/i,
    /cu[aá]l/i, /cu[aá]ndo/i, /d[oó]nde/i
  ];
  
  const hookPatterns = [
    /sabías/i, /secreto/i, /truco/i, /hack/i, /increíble/i,
    /no vas a creer/i, /esto es/i, /atenci[oó]n/i, /importante/i
  ];

  for (const segment of segments) {
    const text = segment.text.trim();
    
    // Check for CTA
    if (ctaPatterns.some(p => p.test(text))) {
      keyMoments.push({
        timestamp: segment.start,
        text,
        type: 'cta'
      });
      continue;
    }
    
    // Check for questions
    if (questionPatterns.some(p => p.test(text))) {
      keyMoments.push({
        timestamp: segment.start,
        text,
        type: 'question'
      });
      continue;
    }
    
    // Check for hooks (especially in first 5 seconds)
    if (segment.start < 5 && hookPatterns.some(p => p.test(text))) {
      keyMoments.push({
        timestamp: segment.start,
        text,
        type: 'hook'
      });
      continue;
    }
    
    // First segment is always a potential hook
    if (segment.id === 0 && text.length > 10) {
      keyMoments.push({
        timestamp: segment.start,
        text,
        type: 'hook'
      });
    }
  }

  return keyMoments;
}
