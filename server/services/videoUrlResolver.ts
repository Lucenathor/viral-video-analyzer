/**
 * Video URL Resolver Service
 * Extracts direct video download URLs from Instagram Reels and TikTok URLs.
 * Falls back to the original URL if extraction fails (for direct .mp4 links).
 */

import { ENV } from "../_core/env";

interface ResolvedVideo {
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

// ============================================================
// Instagram Reel URL Extraction (GraphQL - No Cookie Needed)
// ============================================================

const IG_GRAPHQL_URL = "https://www.instagram.com/api/graphql";
const IG_DOC_ID = "10015901848480474";
const IG_LSD = "AVqbxe3J_YA";
const IG_APP_ID = "936619743392459";
const IG_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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
 * Resolve an Instagram Reel/Post URL to a direct video URL using GraphQL API.
 */
async function resolveInstagramUrl(url: string): Promise<ResolvedVideo | null> {
  const shortcode = getInstagramShortcode(url);
  if (!shortcode) {
    console.log("[VideoResolver] Could not extract Instagram shortcode from:", url);
    return null;
  }

  console.log(`[VideoResolver] Resolving Instagram shortcode: ${shortcode}`);

  try {
    const params = new URLSearchParams({
      variables: JSON.stringify({ shortcode }),
      doc_id: IG_DOC_ID,
      lsd: IG_LSD,
    });

    const response = await fetch(IG_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "User-Agent": IG_USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        "X-IG-App-ID": IG_APP_ID,
        "X-FB-LSD": IG_LSD,
        "X-ASBD-ID": "129477",
        "Sec-Fetch-Site": "same-origin",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      console.log(`[VideoResolver] Instagram GraphQL returned ${response.status}`);
      return null;
    }

    const json = await response.json();
    const media = json?.data?.xdt_shortcode_media;

    if (!media) {
      console.log("[VideoResolver] No media data in Instagram response (reel may be private)");
      return null;
    }

    if (!media.is_video || !media.video_url) {
      console.log("[VideoResolver] Instagram post is not a video or has no video_url");
      return null;
    }

    console.log(`[VideoResolver] Instagram video resolved: duration=${media.video_duration}s`);

    return {
      directUrl: media.video_url,
      platform: "instagram",
      metadata: {
        duration: media.video_duration,
        hasAudio: media.has_audio,
        caption: media.edge_media_to_caption?.edges?.[0]?.node?.text,
        author: media.owner?.username,
        viewCount: media.video_play_count || media.video_view_count,
      },
    };
  } catch (error: any) {
    console.error("[VideoResolver] Instagram GraphQL error:", error.message);
    return null;
  }
}

// ============================================================
// TikTok URL Extraction (via RapidAPI)
// ============================================================

/**
 * Extract TikTok video ID from URL
 */
function getTikTokVideoId(url: string): string | null {
  // Standard format: https://www.tiktok.com/@user/video/1234567890
  const standardMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (standardMatch) return standardMatch[1];

  // Short format: https://vm.tiktok.com/XXXXXXX/
  // These need to be resolved via redirect
  if (url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com")) {
    return null; // Will be handled by following redirects
  }

  return null;
}

/**
 * Resolve a TikTok URL to a direct video URL.
 * Uses the RapidAPI TikTok scraper if available.
 */
async function resolveTikTokUrl(url: string): Promise<ResolvedVideo | null> {
  console.log(`[VideoResolver] Resolving TikTok URL: ${url}`);

  const apiKey = ENV.RAPIDAPI_TIKTOK_KEY;
  if (!apiKey) {
    console.log("[VideoResolver] No RapidAPI TikTok key available");
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
          headers: {
            "User-Agent": IG_USER_AGENT,
          },
        });
        resolvedUrl = redirectResponse.url;
        console.log(`[VideoResolver] TikTok short URL resolved to: ${resolvedUrl}`);
      } catch {
        console.log("[VideoResolver] Could not resolve TikTok short URL");
      }
    }

    // Use RapidAPI to get video info and download URL
    const apiUrl = `https://tiktok-scraper7.p.rapidapi.com/video/info?video_url=${encodeURIComponent(resolvedUrl)}`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "tiktok-scraper7.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    });

    if (!response.ok) {
      console.log(`[VideoResolver] TikTok RapidAPI returned ${response.status}`);
      return null;
    }

    const json = await response.json();
    
    // Try to get the download URL from the response
    const videoData = json?.data;
    const downloadUrl =
      videoData?.play ||
      videoData?.hdplay ||
      videoData?.wmplay ||
      videoData?.download?.wm ||
      videoData?.download?.nowm;

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
        caption: videoData?.title || videoData?.desc,
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
 * Check if a URL is a direct video link (ends with video extension or has video content-type).
 */
function isDirectVideoUrl(url: string): boolean {
  const videoExtensions = [".mp4", ".mov", ".avi", ".webm", ".mkv", ".m4v"];
  const urlLower = url.toLowerCase().split("?")[0];
  return videoExtensions.some((ext) => urlLower.endsWith(ext));
}

/**
 * Resolve any video URL to a direct download URL.
 * Supports Instagram Reels, TikTok videos, and direct video URLs.
 * 
 * @param url - The URL to resolve (Instagram reel, TikTok, or direct video link)
 * @returns ResolvedVideo with the direct download URL, or null if resolution fails
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
  // This handles cases where:
  // - The reel is private (Instagram GraphQL returns null)
  // - The API is temporarily down
  // - The URL is from an unsupported platform
  console.log(`[VideoResolver] Platform resolution failed, using original URL as fallback`);
  
  // Try to check if the URL returns video content
  try {
    const headResponse = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": IG_USER_AGENT },
    });
    const contentType = headResponse.headers.get("content-type") || "";
    if (contentType.startsWith("video/")) {
      console.log(`[VideoResolver] Original URL returns video content-type: ${contentType}`);
      return { directUrl: headResponse.url, platform: "direct" };
    }
  } catch {
    // Ignore HEAD check errors
  }

  // Last resort: return the original URL (will likely fail during download, but let the caller handle it)
  return {
    directUrl: url,
    platform,
    metadata: undefined,
  };
}

/**
 * Download a video from a resolved URL and return it as a Buffer.
 * Handles the specific headers needed for each platform.
 */
export async function downloadResolvedVideo(resolved: ResolvedVideo): Promise<Buffer> {
  console.log(`[VideoResolver] Downloading video from ${resolved.platform}: ${resolved.directUrl.substring(0, 80)}...`);

  const headers: Record<string, string> = {
    "User-Agent": IG_USER_AGENT,
  };

  // Instagram CDN requires specific referer
  if (resolved.platform === "instagram") {
    headers["Referer"] = "https://www.instagram.com/";
  } else if (resolved.platform === "tiktok") {
    headers["Referer"] = "https://www.tiktok.com/";
  }

  const response = await fetch(resolved.directUrl, {
    headers,
    redirect: "follow",
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
