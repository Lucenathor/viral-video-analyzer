import { describe, it, expect } from 'vitest';
import { searchTikTokVideos } from './services/tiktokService';

describe('TikTok API', () => {
  it('should search for videos with valid API key', async () => {
    // This test validates that the TikTok API integration works
    // It uses the Manus Data API which is pre-configured
    const result = await searchTikTokVideos('viral', 0);
    
    // Should return an object with videos array
    expect(result).toBeDefined();
    expect(result).toHaveProperty('videos');
    expect(Array.isArray(result.videos)).toBe(true);
    
    // Should find at least some videos
    expect(result.videos.length).toBeGreaterThan(0);
    
    // Each video should have required properties
    if (result.videos.length > 0) {
      const video = result.videos[0];
      expect(video).toHaveProperty('id');
      expect(video).toHaveProperty('description');
      expect(video).toHaveProperty('stats');
      expect(video.stats).toHaveProperty('likeCount');
    }
  }, 30000); // 30 second timeout for API call
});
