import { describe, it, expect, vi } from "vitest";
import { resolveVideoUrl, downloadResolvedVideo } from "./services/videoUrlResolver";

describe("Video URL Resolver", () => {
  describe("resolveVideoUrl", () => {
    it("should detect Instagram platform from URL", async () => {
      const result = await resolveVideoUrl("https://www.instagram.com/reel/CtjoC2BNsB2/");
      expect(result.platform).toBe("instagram");
    });

    it("should detect TikTok platform from URL", async () => {
      const result = await resolveVideoUrl("https://www.tiktok.com/@user/video/1234567890");
      expect(result.platform).toBe("tiktok");
    });

    it("should detect direct video URL", async () => {
      const result = await resolveVideoUrl("https://example.com/video.mp4");
      expect(result.platform).toBe("direct");
      expect(result.directUrl).toBe("https://example.com/video.mp4");
    });

    it("should detect direct .mov URL", async () => {
      const result = await resolveVideoUrl("https://example.com/video.mov");
      expect(result.platform).toBe("direct");
      expect(result.directUrl).toBe("https://example.com/video.mov");
    });

    it("should detect direct .webm URL", async () => {
      const result = await resolveVideoUrl("https://example.com/video.webm");
      expect(result.platform).toBe("direct");
      expect(result.directUrl).toBe("https://example.com/video.webm");
    });

    it("should handle Instagram URL with query params", async () => {
      const result = await resolveVideoUrl("https://www.instagram.com/reel/CtjoC2BNsB2/?igsh=abc123");
      expect(result.platform).toBe("instagram");
    });

    it("should resolve a known public Instagram reel to direct video URL", async () => {
      const result = await resolveVideoUrl("https://www.instagram.com/reel/CtjoC2BNsB2/");
      expect(result.platform).toBe("instagram");
      expect(result.directUrl).toContain("cdninstagram.com");
      expect(result.directUrl).toContain(".mp4");
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.duration).toBeGreaterThan(0);
      expect(result.metadata?.hasAudio).toBe(true);
    }, 15000);

    it("should handle private/unavailable Instagram reels gracefully", async () => {
      // This shortcode likely doesn't exist
      const result = await resolveVideoUrl("https://www.instagram.com/reel/XXXXXXXXXX/");
      // Should not throw, should return fallback
      expect(result).toBeDefined();
      expect(result.directUrl).toBeDefined();
    }, 15000);

    it("should handle non-video Instagram posts", async () => {
      // A photo post - should still return something without crashing
      const result = await resolveVideoUrl("https://www.instagram.com/p/XXXXXXXXXX/");
      expect(result).toBeDefined();
    }, 15000);
  });

  describe("downloadResolvedVideo", () => {
    it("should download a resolved Instagram video", async () => {
      const resolved = await resolveVideoUrl("https://www.instagram.com/reel/CtjoC2BNsB2/");
      expect(resolved.platform).toBe("instagram");
      
      const buffer = await downloadResolvedVideo(resolved);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
    }, 30000);
  });
});
