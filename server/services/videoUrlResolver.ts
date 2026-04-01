/**
 * Video URL Resolver Service
 * Extracts direct video download URLs from Instagram Reels and TikTok URLs
 * using RapidAPI services.
 */

import { ENV } from "../_core/env";

// ============================================================
// Retry helper with exponential backoff
// ============================================================

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      // If rate limited, retry after delay
      if (response.status === 429 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[VideoResolver] Rate limited (429), retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return response;
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[VideoResolver] Request failed: ${err.message}, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError || new Error('All retry attempts failed');
}

// ============================================================
// Simple in-memory cache for resolved URLs (5 min TTL)
// ============================================================

const urlCache = new Map<string, { result: ResolvedVideo; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedUrl(url: string): ResolvedVideo | null {
  const cached = urlCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[VideoResolver] Using cached URL resolution');
    return cached.result;
  }
  if (cached) urlCache.delete(url);
  return null;
}

function setCachedUrl(url: string, result: ResolvedVideo): void {
  urlCache.set(url, { result, timestamp: Date.now() });
  // Clean old entries if cache grows too large
  if (urlCache.size > 100) {
    const oldest = Array.from(urlCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 50; i++) urlCache.delete(oldest[i][0]);
  }
}

// Track if we're currently rate-limited
let rateLimitedUntil = 0;

export interface ResolvedVideo {
  directUrl: string;
  platform: "instagram" | "tiktok" | "direct";
  metadata?: {
    duration?: number;
    hasAudio?: boolean;
    caption?: string;
    author?: string;
    viewCount?: number;
  };
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ============================================================
// Video content validation
// ============================================================

/**
 * Check if a buffer contains valid video data by inspecting magic bytes.
 * Returns true for MP4, MOV, WebM, AVI, MKV, FLV, MPEG, OGG, WMV, 3GP.
 */
function isValidVideoBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // MP4/MOV/3GP: bytes 4-8 = "ftyp"
  const ftyp = buffer.slice(4, 8).toString('ascii');
  if (ftyp === 'ftyp') return true;

  // WebM/MKV: starts with 0x1A45DFA3 (EBML header)
  if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) return true;

  // AVI: starts with "RIFF" and contains "AVI "
  const riff = buffer.slice(0, 4).toString('ascii');
  const avi = buffer.slice(8, 12).toString('ascii');
  if (riff === 'RIFF' && avi === 'AVI ') return true;

  // FLV: starts with "FLV"
  if (buffer[0] === 0x46 && buffer[1] === 0x4C && buffer[2] === 0x56) return true;

  // MPEG-TS: starts with 0x47 (sync byte)
  if (buffer[0] === 0x47) return true;

  // MPEG-PS: starts with 0x000001BA
  if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0xBA) return true;

  // OGG: starts with "OggS"
  if (buffer.slice(0, 4).toString('ascii') === 'OggS') return true;

  return false;
}

/**
 * Check if a buffer looks like HTML content.
 */
function isHtmlContent(buffer: Buffer): boolean {
  const header = buffer.slice(0, 200).toString('utf-8').toLowerCase();
  return header.includes('<!doctype') || header.includes('<html') || header.includes('<head');
}

// ============================================================
// Instagram Reel URL Extraction (via RapidAPI - Instagram Scraper Stable API)
// ============================================================

/**
 * Extract the shortcode from an Instagram URL.
 * Supports: /reel/CODE, /reels/CODE, /p/CODE, /stories/CODE
 */
function getInstagramShortcode(url: string): string | null {
  const regex =
    /instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(p|reels|reel|stories)\/([A-Za-z0-9-_]+)/;
  const match = url.match(regex);
  return match && match[2] ? match[2] : null;
}

/**
 * Resolve an Instagram Reel/Post URL to a direct video URL using RapidAPI.
 * Tries v2 endpoint first (shortcode only), then falls back to v1 (full URL).
 */
async function resolveInstagramUrl(url: string): Promise<ResolvedVideo | null> {
  const shortcode = getInstagramShortcode(url);
  if (!shortcode) {
    console.log("[VideoResolver] Could not extract Instagram shortcode from:", url);
    return null;
  }

  const apiKey = ENV.RAPIDAPI_KEY;
  if (!apiKey) {
    console.log("[VideoResolver] No RAPIDAPI_KEY available for Instagram");
    return null;
  }

  console.log(`[VideoResolver] Resolving Instagram shortcode: ${shortcode}`);

  // ---- ATTEMPT 1: v2 endpoint (shortcode only, faster) ----
  try {
    const apiUrl = `https://instagram-scraper-stable-api.p.rapidapi.com/get_media_data_v2.php?media_code=${encodeURIComponent(shortcode)}`;
    console.log(`[VideoResolver] Trying v2 endpoint...`);

    const response = await fetchWithRetry(apiUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "instagram-scraper-stable-api.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
      signal: AbortSignal.timeout(30000),
    }, 3, 3000);

    if (response.ok) {
      const json = await response.json();
      const videoUrl = json?.video_url;
      if (videoUrl) {
        console.log(`[VideoResolver] Instagram video resolved via v2 endpoint`);
        return {
          directUrl: videoUrl,
          platform: "instagram",
          metadata: {
            duration: json?.video_duration,
            hasAudio: true,
            caption: json?.edge_media_to_caption?.edges?.[0]?.node?.text || json?.caption?.text,
            author: json?.owner?.username,
            viewCount: json?.video_play_count || json?.video_view_count,
          },
        };
      }
      console.log("[VideoResolver] v2 returned no video_url, keys:", Object.keys(json || {}).join(", "));
      if (json?.error) {
        console.log("[VideoResolver] v2 error message:", json.error);
        // Detect rate limiting from the error message
        if (json.error.includes('429') || json.error.includes('Too Many Requests')) {
          rateLimitedUntil = Date.now() + 30000; // 30s cooldown
          console.log('[VideoResolver] Rate limit detected, setting cooldown');
        }
      }
    } else if (response.status === 429) {
      rateLimitedUntil = Date.now() + 30000;
      console.log(`[VideoResolver] v2 returned HTTP 429 - rate limited`);
    } else {
      console.log(`[VideoResolver] v2 returned HTTP ${response.status}`);
    }
  } catch (error: any) {
    console.warn("[VideoResolver] v2 endpoint failed:", error.message);
  }

  // ---- ATTEMPT 2: v1 endpoint (full URL, slower but more reliable) ----
  try {
    const fullUrl = url.includes("instagram.com") ? url : `https://www.instagram.com/reel/${shortcode}/`;
    const apiUrl = `https://instagram-scraper-stable-api.p.rapidapi.com/get_media_data.php?url=${encodeURIComponent(fullUrl)}`;
    console.log(`[VideoResolver] Trying v1 endpoint with full URL...`);

    const response = await fetchWithRetry(apiUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "instagram-scraper-stable-api.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
      signal: AbortSignal.timeout(30000),
    }, 3, 3000);

    if (response.ok) {
      const json = await response.json();
      const videoUrl = json?.video_url;
      if (videoUrl) {
        console.log(`[VideoResolver] Instagram video resolved via v1 endpoint`);
        return {
          directUrl: videoUrl,
          platform: "instagram",
          metadata: {
            duration: json?.video_duration,
            hasAudio: true,
            caption: json?.edge_media_to_caption?.edges?.[0]?.node?.text || json?.caption?.text,
            author: json?.owner?.username,
            viewCount: json?.video_play_count || json?.video_view_count,
          },
        };
      }
      console.log("[VideoResolver] v1 returned no video_url, keys:", Object.keys(json || {}).join(", "));
      if (json?.error) {
        console.log("[VideoResolver] v1 error message:", json.error);
        if (json.error.includes('429') || json.error.includes('Too Many Requests')) {
          rateLimitedUntil = Date.now() + 30000;
        }
      }
    } else if (response.status === 429) {
      rateLimitedUntil = Date.now() + 30000;
      console.log(`[VideoResolver] v1 returned HTTP 429 - rate limited`);
    } else {
      console.log(`[VideoResolver] v1 returned HTTP ${response.status}`);
    }
  } catch (error: any) {
    console.warn("[VideoResolver] v1 endpoint failed:", error.message);
  }

  console.log("[VideoResolver] All Instagram API attempts failed");
  return null;
}

// ============================================================
// TikTok URL Extraction (via RapidAPI - TikTok Scraper 7)
// ============================================================

/**
 * Resolve a TikTok URL to a direct video URL using RapidAPI.
 */
async function resolveTikTokUrl(url: string): Promise<ResolvedVideo | null> {
  console.log(`[VideoResolver] Resolving TikTok URL: ${url}`);

  const apiKey = ENV.RAPIDAPI_TIKTOK_KEY || ENV.RAPIDAPI_KEY;
  if (!apiKey) {
    console.log("[VideoResolver] No RapidAPI key available for TikTok");
    return null;
  }

  try {
    // First, resolve short URLs by following redirects
    let resolvedUrl = url;
    if (url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com")) {
      try {
        const redirectResponse = await fetch(url, {
          method: "HEAD",
          redirect: "follow",
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(10000),
        });
        resolvedUrl = redirectResponse.url;
        console.log(`[VideoResolver] TikTok short URL resolved to: ${resolvedUrl}`);
      } catch {
        console.log("[VideoResolver] Could not resolve TikTok short URL, using original");
      }
    }

    // Use the correct endpoint format: GET /?url={tiktok_url}&hd=1
    const apiUrl = `https://tiktok-scraper7.p.rapidapi.com/?url=${encodeURIComponent(resolvedUrl)}&hd=1`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "tiktok-scraper7.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.log(`[VideoResolver] TikTok RapidAPI returned ${response.status}`);
      return null;
    }

    const json = await response.json();

    if (json?.code !== 0) {
      console.log(`[VideoResolver] TikTok API error: ${json?.msg || "unknown"}`);
      return null;
    }

    const videoData = json?.data;
    // Prefer HD, then regular play URL
    const downloadUrl = videoData?.hdplay || videoData?.play;

    if (!downloadUrl) {
      console.log("[VideoResolver] No download URL in TikTok response");
      return null;
    }

    console.log(`[VideoResolver] TikTok video resolved: duration=${videoData?.duration}s`);

    return {
      directUrl: downloadUrl,
      platform: "tiktok",
      metadata: {
        duration: videoData?.duration,
        hasAudio: true,
        caption: videoData?.title,
        author: videoData?.author?.unique_id || videoData?.author?.nickname,
        viewCount: videoData?.play_count,
      },
    };
  } catch (error: any) {
    console.error("[VideoResolver] TikTok resolution error:", error.message);
    return null;
  }
}

// ============================================================
// Main Resolver
// ============================================================

/**
 * Detect the platform from a URL.
 */
function detectPlatform(url: string): "instagram" | "tiktok" | "direct" {
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("tiktok.com")) return "tiktok";
  return "direct";
}

/**
 * Check if a URL is a direct video link.
 */
function isDirectVideoUrl(url: string): boolean {
  const videoExtensions = [".mp4", ".mov", ".avi", ".webm", ".mkv", ".m4v"];
  const urlLower = url.toLowerCase().split("?")[0];
  return videoExtensions.some((ext) => urlLower.endsWith(ext));
}

/**
 * Resolve any video URL to a direct download URL.
 * Supports Instagram Reels, TikTok videos, and direct video URLs.
 * THROWS an error if the URL cannot be resolved to a video - never returns HTML fallback.
 */
export async function resolveVideoUrl(url: string): Promise<ResolvedVideo> {
  console.log(`[VideoResolver] Resolving URL: ${url}`);

  const platform = detectPlatform(url);

  // If it's a direct video URL, return as-is
  if (platform === "direct" && isDirectVideoUrl(url)) {
    console.log("[VideoResolver] Direct video URL detected, using as-is");
    return { directUrl: url, platform: "direct" };
  }

  // Check cache first
  const cached = getCachedUrl(url);
  if (cached) return cached;

  // Try platform-specific resolution
  let resolved: ResolvedVideo | null = null;

  if (platform === "instagram") {
    resolved = await resolveInstagramUrl(url);
  } else if (platform === "tiktok") {
    resolved = await resolveTikTokUrl(url);
  }

  // If platform resolution succeeded, cache and return it
  if (resolved) {
    setCachedUrl(url, resolved);
    return resolved;
  }

  // Fallback: check if the URL itself returns video content-type
  console.log(`[VideoResolver] Platform API failed, checking if URL returns video content directly...`);

  try {
    const headResponse = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    const contentType = headResponse.headers.get("content-type") || "";
    if (contentType.startsWith("video/")) {
      console.log(`[VideoResolver] Original URL returns video content-type: ${contentType}`);
      return { directUrl: headResponse.url, platform: "direct" };
    }
    console.log(`[VideoResolver] URL returns content-type: ${contentType} (not video)`);
  } catch (err: any) {
    console.log(`[VideoResolver] HEAD check failed: ${err.message}`);
  }

  // CRITICAL: Do NOT return the original URL as fallback - it would download HTML, not video.
  // Instead, throw a clear error so the user knows the URL couldn't be resolved.
  const platformName = platform === "instagram" ? "Instagram" : platform === "tiktok" ? "TikTok" : "la plataforma";
  
  // Provide a more specific error message based on the failure reason
  const isRateLimited = Date.now() < rateLimitedUntil;
  if (isRateLimited) {
    throw new Error(
      `La API de descarga de ${platformName} esta temporalmente saturada (rate limit). ` +
      `Espera unos 30 segundos e intenta de nuevo, o usa una URL directa (.mp4).`
    );
  }
  
  throw new Error(
    `No se pudo obtener el video de ${platformName}. ` +
    `Esto puede ocurrir si el video es privado, fue eliminado, o la API de descarga no lo reconoce. ` +
    `Prueba con otro enlace de video o usa una URL directa (.mp4).`
  );
}

/**
 * Download a video from a resolved URL and return it as a Buffer.
 * Validates that the downloaded content is actually a video file.
 */
export async function downloadResolvedVideo(resolved: ResolvedVideo): Promise<Buffer> {
  console.log(`[VideoResolver] Downloading video from ${resolved.platform}: ${resolved.directUrl.substring(0, 80)}...`);

  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
  };

  if (resolved.platform === "instagram") {
    headers["Referer"] = "https://www.instagram.com/";
  } else if (resolved.platform === "tiktok") {
    headers["Referer"] = "https://www.tiktok.com/";
  }

  const response = await fetch(resolved.directUrl, {
    headers,
    redirect: "follow",
    signal: AbortSignal.timeout(60000), // 60s timeout for large videos
  });

  if (!response.ok) {
    throw new Error(`Error al descargar el video: HTTP ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  console.log(`[VideoResolver] Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

  if (buffer.length < 1000) {
    throw new Error("El archivo descargado es demasiado pequeno para ser un video valido");
  }

  // CRITICAL: Validate that we actually downloaded a video, not HTML or other content
  if (isHtmlContent(buffer)) {
    console.error("[VideoResolver] CRITICAL: Downloaded HTML instead of video! URL:", resolved.directUrl.substring(0, 100));
    throw new Error(
      "El enlace no devolvio un video valido (se descargo una pagina web en su lugar). " +
      "El video puede ser privado o haber sido eliminado. Prueba con otro enlace."
    );
  }

  if (!isValidVideoBuffer(buffer)) {
    // Log the first bytes for debugging
    console.warn("[VideoResolver] WARNING: Downloaded content may not be a valid video. First bytes:", buffer.slice(0, 16).toString('hex'));
    // Don't throw here - some valid videos may have unusual headers (e.g., fragmented MP4)
    // But log it so we can debug if Gemini fails
  }

  return buffer;
}
