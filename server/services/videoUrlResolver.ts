/**
 * Video URL Resolver Service
 * Extracts direct video download URLs from Instagram Reels and TikTok URLs
 * using RapidAPI services.
 */

import { ENV } from "../_core/env";

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

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "instagram-scraper-stable-api.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
      signal: AbortSignal.timeout(15000),
    });

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

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "instagram-scraper-stable-api.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
      signal: AbortSignal.timeout(20000),
    });

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
 */
export async function resolveVideoUrl(url: string): Promise<ResolvedVideo> {
  console.log(`[VideoResolver] Resolving URL: ${url}`);

  const platform = detectPlatform(url);

  // If it's a direct video URL, return as-is
  if (platform === "direct" && isDirectVideoUrl(url)) {
    console.log("[VideoResolver] Direct video URL detected, using as-is");
    return { directUrl: url, platform: "direct" };
  }

  // Try platform-specific resolution
  let resolved: ResolvedVideo | null = null;

  if (platform === "instagram") {
    resolved = await resolveInstagramUrl(url);
  } else if (platform === "tiktok") {
    resolved = await resolveTikTokUrl(url);
  }

  // If platform resolution succeeded, return it
  if (resolved) {
    return resolved;
  }

  // Fallback: try to use the URL directly
  console.log(`[VideoResolver] Platform resolution failed, trying direct URL as fallback`);

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
  } catch {
    // Ignore HEAD check errors
  }

  // Last resort: return the original URL and let downstream handle the error
  console.log(`[VideoResolver] WARNING: Could not resolve video URL, returning original`);
  return {
    directUrl: url,
    platform,
    metadata: undefined,
  };
}

/**
 * Download a video from a resolved URL and return it as a Buffer.
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
    throw new Error(`Failed to download video: HTTP ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  console.log(`[VideoResolver] Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

  if (buffer.length < 1000) {
    throw new Error("Downloaded file is too small to be a valid video");
  }

  return buffer;
}
