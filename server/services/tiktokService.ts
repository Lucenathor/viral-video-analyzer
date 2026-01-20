/**
 * TikTok API Service
 * Uses Manus Data API to search and download TikTok videos
 */

import { callDataApi } from "../_core/dataApi";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';
import * as http from 'http';

export interface TikTokVideo {
  id: string;
  description: string;
  createTime: number;
  duration: number;
  width: number;
  height: number;
  playUrl: string;
  downloadUrl: string;
  coverUrl: string;
  author: {
    id: string;
    uniqueId: string;
    nickname: string;
    avatarUrl: string;
  };
  stats: {
    playCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
  };
  music?: {
    id: string;
    title: string;
    author: string;
  };
}

export interface TikTokSearchResult {
  videos: TikTokVideo[];
  hasMore: boolean;
  cursor: number;
}

/**
 * Search TikTok videos by keyword
 */
export async function searchTikTokVideos(
  keyword: string,
  cursor: number = 0
): Promise<TikTokSearchResult> {
  try {
    console.log(`[TikTok] Searching videos for keyword: ${keyword}`);
    
    const result = await callDataApi("Tiktok/search_tiktok_video_general", {
      query: { 
        keyword,
        cursor: cursor.toString()
      },
    }) as any;
    
    if (!result || !result.data) {
      console.log('[TikTok] No results found');
      return { videos: [], hasMore: false, cursor: 0 };
    }
    
    const videos: TikTokVideo[] = result.data
      .filter((item: any) => item.item)
      .map((item: any) => {
        const video = item.item;
        return {
          id: video.id || '',
          description: video.desc || '',
          createTime: video.createTime || 0,
          duration: video.video?.duration || 0,
          width: video.video?.width || 0,
          height: video.video?.height || 0,
          playUrl: video.video?.playAddr || '',
          downloadUrl: video.video?.downloadAddr || '',
          coverUrl: video.video?.cover || video.video?.originCover || '',
          author: {
            id: video.author?.id || '',
            uniqueId: video.author?.uniqueId || '',
            nickname: video.author?.nickname || '',
            avatarUrl: video.author?.avatarMedium || video.author?.avatarThumb || '',
          },
          stats: {
            playCount: video.stats?.playCount || video.statsV2?.playCount || 0,
            likeCount: video.stats?.diggCount || video.statsV2?.diggCount || 0,
            commentCount: video.stats?.commentCount || video.statsV2?.commentCount || 0,
            shareCount: video.stats?.shareCount || video.statsV2?.shareCount || 0,
          },
          music: video.music ? {
            id: video.music.id || '',
            title: video.music.title || '',
            author: video.music.authorName || '',
          } : undefined,
        };
      });
    
    console.log(`[TikTok] Found ${videos.length} videos`);
    
    return {
      videos,
      hasMore: result.has_more || false,
      cursor: result.cursor || 0,
    };
  } catch (error: any) {
    console.error('[TikTok] Error searching videos:', error.message);
    throw new Error(`Error buscando vídeos en TikTok: ${error.message}`);
  }
}

/**
 * Get user's popular posts
 */
export async function getUserPopularPosts(
  secUid: string,
  count: number = 10
): Promise<TikTokVideo[]> {
  try {
    console.log(`[TikTok] Getting popular posts for user: ${secUid}`);
    
    const result = await callDataApi("Tiktok/get_user_popular_posts", {
      query: { 
        secUid,
        count: count.toString(),
        cursor: '0'
      },
    }) as any;
    
    if (!result || !result.data || !result.data.itemList) {
      console.log('[TikTok] No posts found');
      return [];
    }
    
    const videos: TikTokVideo[] = result.data.itemList.map((video: any) => ({
      id: video.id || '',
      description: video.desc || '',
      createTime: video.createTime || 0,
      duration: video.video?.duration || 0,
      width: video.video?.width || 0,
      height: video.video?.height || 0,
      playUrl: video.video?.playAddr || '',
      downloadUrl: video.video?.downloadAddr || '',
      coverUrl: video.video?.cover || video.video?.originCover || '',
      author: {
        id: video.author?.id || '',
        uniqueId: video.author?.uniqueId || '',
        nickname: video.author?.nickname || '',
        avatarUrl: video.author?.avatarMedium || video.author?.avatarThumb || '',
      },
      stats: {
        playCount: video.stats?.playCount || 0,
        likeCount: video.stats?.diggCount || 0,
        commentCount: video.stats?.commentCount || 0,
        shareCount: video.stats?.shareCount || 0,
      },
      music: video.music ? {
        id: video.music.id || '',
        title: video.music.title || '',
        author: video.music.authorName || '',
      } : undefined,
    }));
    
    console.log(`[TikTok] Found ${videos.length} popular posts`);
    return videos;
  } catch (error: any) {
    console.error('[TikTok] Error getting popular posts:', error.message);
    throw new Error(`Error obteniendo posts populares: ${error.message}`);
  }
}

/**
 * Get user info by username
 */
export async function getUserInfo(uniqueId: string): Promise<{
  secUid: string;
  id: string;
  nickname: string;
  avatarUrl: string;
  followerCount: number;
  followingCount: number;
  heartCount: number;
  videoCount: number;
} | null> {
  try {
    console.log(`[TikTok] Getting user info for: ${uniqueId}`);
    
    const result = await callDataApi("Tiktok/get_user_info", {
      query: { uniqueId },
    }) as any;
    
    if (!result || !result.userInfo) {
      console.log('[TikTok] User not found');
      return null;
    }
    
    const user = result.userInfo.user || {};
    const stats = result.userInfo.stats || {};
    
    return {
      secUid: user.secUid || '',
      id: user.id || '',
      nickname: user.nickname || '',
      avatarUrl: user.avatarMedium || user.avatarThumb || '',
      followerCount: stats.followerCount || 0,
      followingCount: stats.followingCount || 0,
      heartCount: stats.heartCount || 0,
      videoCount: stats.videoCount || 0,
    };
  } catch (error: any) {
    console.error('[TikTok] Error getting user info:', error.message);
    throw new Error(`Error obteniendo información del usuario: ${error.message}`);
  }
}

/**
 * Download a TikTok video to a local file
 */
export async function downloadTikTokVideo(
  downloadUrl: string,
  outputPath?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      console.log(`[TikTok] Downloading video from: ${downloadUrl.substring(0, 100)}...`);
      
      const finalPath = outputPath || path.join(os.tmpdir(), `tiktok_${Date.now()}.mp4`);
      const file = fs.createWriteStream(finalPath);
      
      const protocol = downloadUrl.startsWith('https') ? https : http;
      
      const request = protocol.get(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://www.tiktok.com/',
        }
      }, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            console.log(`[TikTok] Following redirect to: ${redirectUrl.substring(0, 100)}...`);
            file.close();
            fs.unlinkSync(finalPath);
            downloadTikTokVideo(redirectUrl, finalPath).then(resolve).catch(reject);
            return;
          }
        }
        
        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(finalPath);
          reject(new Error(`Failed to download video: HTTP ${response.statusCode}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          const stats = fs.statSync(finalPath);
          console.log(`[TikTok] Video downloaded: ${finalPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
          resolve(finalPath);
        });
      });
      
      request.on('error', (err) => {
        file.close();
        if (fs.existsSync(finalPath)) {
          fs.unlinkSync(finalPath);
        }
        reject(new Error(`Download error: ${err.message}`));
      });
      
      request.setTimeout(60000, () => {
        request.destroy();
        file.close();
        if (fs.existsSync(finalPath)) {
          fs.unlinkSync(finalPath);
        }
        reject(new Error('Download timeout'));
      });
      
    } catch (error: any) {
      reject(new Error(`Error downloading video: ${error.message}`));
    }
  });
}

/**
 * Get viral videos by sector/niche
 */
export async function getViralVideosBySector(
  sector: string,
  count: number = 10
): Promise<TikTokVideo[]> {
  try {
    // Map sectors to relevant keywords
    const sectorKeywords: Record<string, string[]> = {
      'fitness': ['fitness viral', 'gym motivation', 'workout tips'],
      'cooking': ['cooking viral', 'recipe viral', 'food hack'],
      'tech': ['tech viral', 'gadget review', 'tech tips'],
      'fashion': ['fashion viral', 'outfit ideas', 'style tips'],
      'comedy': ['funny viral', 'comedy skit', 'humor'],
      'education': ['learn viral', 'educational', 'tips and tricks'],
      'business': ['business tips', 'entrepreneur', 'money tips'],
      'beauty': ['beauty viral', 'makeup tutorial', 'skincare'],
      'travel': ['travel viral', 'travel tips', 'destination'],
      'music': ['music viral', 'song cover', 'dance challenge'],
    };
    
    const keywords = sectorKeywords[sector.toLowerCase()] || [sector];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];
    
    const result = await searchTikTokVideos(keyword);
    
    // Sort by engagement (likes + comments + shares)
    const sortedVideos = result.videos.sort((a, b) => {
      const engagementA = a.stats.likeCount + a.stats.commentCount * 2 + a.stats.shareCount * 3;
      const engagementB = b.stats.likeCount + b.stats.commentCount * 2 + b.stats.shareCount * 3;
      return engagementB - engagementA;
    });
    
    return sortedVideos.slice(0, count);
  } catch (error: any) {
    console.error('[TikTok] Error getting viral videos:', error.message);
    throw new Error(`Error obteniendo vídeos virales: ${error.message}`);
  }
}
