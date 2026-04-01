import { describe, it, expect } from "vitest";
import { resolveVideoUrl, downloadResolvedVideo } from "./services/videoUrlResolver";

describe("Video URL Resolver", () => {
  describe("resolveVideoUrl", () => {
    it("should detect direct .mp4 video URL", async () => {
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

    it("should resolve a known public Instagram reel to direct video URL", async () => {
      const result = await resolveVideoUrl("https://www.instagram.com/p/CyGEFpToo62/");
      expect(result.platform).toBe("instagram");
      expect(result.directUrl).toContain("cdninstagram.com");
      expect(result.metadata).toBeDefined();
    }, 20000);

    it("should throw error for private/unavailable Instagram reels", async () => {
      await expect(
        resolveVideoUrl("https://www.instagram.com/reel/XXXXXXXXXX/")
      ).rejects.toThrow("No se pudo obtener el video de Instagram");
    }, 20000);

    it("should throw error for non-video Instagram posts that can't be resolved", async () => {
      await expect(
        resolveVideoUrl("https://www.instagram.com/p/XXXXXXXXXX/")
      ).rejects.toThrow("No se pudo obtener el video de Instagram");
    }, 20000);

    it("should throw error for non-existent TikTok videos", async () => {
      await expect(
        resolveVideoUrl("https://www.tiktok.com/@nonexistent/video/0000000000000000000")
      ).rejects.toThrow("No se pudo obtener el video de TikTok");
    }, 20000);
  });

  describe("downloadResolvedVideo", () => {
    it("should download a resolved Instagram video and validate it is a real video", async () => {
      const resolved = await resolveVideoUrl("https://www.instagram.com/p/CyGEFpToo62/");
      expect(resolved.platform).toBe("instagram");

      const buffer = await downloadResolvedVideo(resolved);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
      
      // Verify it's actually a video (MP4 magic bytes: ftyp at offset 4)
      const ftyp = buffer.slice(4, 8).toString('ascii');
      expect(ftyp).toBe('ftyp');
    }, 30000);

    it("should reject HTML content as invalid video", async () => {
      // This tests the validation in downloadResolvedVideo
      const fakeResolved = {
        directUrl: "https://www.instagram.com/",
        platform: "instagram" as const,
      };
      await expect(
        downloadResolvedVideo(fakeResolved)
      ).rejects.toThrow();
    }, 15000);
  });
});
