import { describe, it, expect } from "vitest";
import { resolveVideoUrl, downloadResolvedVideo } from "./services/videoUrlResolver";

describe("Video URL Resolver", () => {
  describe("resolveVideoUrl", () => {
    it("should detect Instagram platform from URL", async () => {
      const result = await resolveVideoUrl("https://www.instagram.com/reel/DLQAXzKN33c/");
      expect(result.platform).toBe("instagram");
      // With RapidAPI, should get a direct video URL
      expect(result.directUrl).toContain("http");
    }, 15000);

    it("should detect TikTok platform from URL", async () => {
      const result = await resolveVideoUrl("https://www.tiktok.com/@tiktok/video/7516594811734854943");
      expect(result.platform).toBe("tiktok");
      expect(result.directUrl).toContain("http");
    }, 15000);

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
      const result = await resolveVideoUrl("https://www.instagram.com/reel/DLQAXzKN33c/?igsh=abc123");
      expect(result.platform).toBe("instagram");
      expect(result.directUrl).toContain("http");
    }, 15000);

    it("should resolve a known public Instagram reel to direct video URL", async () => {
      const result = await resolveVideoUrl("https://www.instagram.com/reel/DLQAXzKN33c/");
      expect(result.platform).toBe("instagram");
      expect(result.directUrl).toContain("cdninstagram.com");
      expect(result.metadata).toBeDefined();
    }, 15000);

    it("should handle private/unavailable Instagram reels gracefully", async () => {
      const result = await resolveVideoUrl("https://www.instagram.com/reel/XXXXXXXXXX/");
      expect(result).toBeDefined();
      expect(result.directUrl).toBeDefined();
    }, 15000);

    it("should handle non-video Instagram posts", async () => {
      const result = await resolveVideoUrl("https://www.instagram.com/p/XXXXXXXXXX/");
      expect(result).toBeDefined();
    }, 15000);
  });

  describe("downloadResolvedVideo", () => {
    it("should download a resolved Instagram video", async () => {
      const resolved = await resolveVideoUrl("https://www.instagram.com/reel/DLQAXzKN33c/");
      expect(resolved.platform).toBe("instagram");

      const buffer = await downloadResolvedVideo(resolved);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
    }, 30000);

    it("should download a resolved TikTok video", async () => {
      const resolved = await resolveVideoUrl("https://www.tiktok.com/@tiktok/video/7516594811734854943");
      expect(resolved.platform).toBe("tiktok");

      const buffer = await downloadResolvedVideo(resolved);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
    }, 30000);
  });
});
