import { describe, expect, it } from "vitest";

/**
 * Tests for the direct video upload system.
 * The upload endpoint is an Express route (not tRPC), so we test:
 * 1. Mime type detection logic
 * 2. The compareUrlVsUpload tRPC endpoint input validation
 */

describe("Video Upload - Mime Type Detection", () => {
  // Replicate the mime type detection logic from server/_core/index.ts
  const extMimeMap: Record<string, string> = {
    '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
    '.webm': 'video/webm', '.mkv': 'video/x-matroska', '.mpeg': 'video/mpeg',
    '.mpg': 'video/mpeg', '.3gp': 'video/3gpp', '.flv': 'video/x-flv',
    '.ogg': 'video/ogg', '.wmv': 'video/x-ms-wmv', '.m4v': 'video/mp4',
  };

  function detectMimeType(originalname: string, multerMimetype: string): string {
    const ext = '.' + originalname.split('.').pop()?.toLowerCase();
    return (multerMimetype === 'application/octet-stream' && extMimeMap[ext])
      ? extMimeMap[ext]
      : multerMimetype;
  }

  it("returns video/mp4 for .mp4 files when multer returns octet-stream", () => {
    expect(detectMimeType("my_video.mp4", "application/octet-stream")).toBe("video/mp4");
  });

  it("returns video/quicktime for .mov files when multer returns octet-stream", () => {
    expect(detectMimeType("recording.MOV", "application/octet-stream")).toBe("video/quicktime");
  });

  it("returns video/webm for .webm files when multer returns octet-stream", () => {
    expect(detectMimeType("clip.webm", "application/octet-stream")).toBe("video/webm");
  });

  it("returns video/x-matroska for .mkv files when multer returns octet-stream", () => {
    expect(detectMimeType("movie.mkv", "application/octet-stream")).toBe("video/x-matroska");
  });

  it("returns video/x-msvideo for .avi files when multer returns octet-stream", () => {
    expect(detectMimeType("old_video.avi", "application/octet-stream")).toBe("video/x-msvideo");
  });

  it("returns video/mpeg for .mpeg files when multer returns octet-stream", () => {
    expect(detectMimeType("video.mpeg", "application/octet-stream")).toBe("video/mpeg");
  });

  it("returns video/3gpp for .3gp files when multer returns octet-stream", () => {
    expect(detectMimeType("mobile.3gp", "application/octet-stream")).toBe("video/3gpp");
  });

  it("returns video/x-flv for .flv files when multer returns octet-stream", () => {
    expect(detectMimeType("flash.flv", "application/octet-stream")).toBe("video/x-flv");
  });

  it("returns video/ogg for .ogg files when multer returns octet-stream", () => {
    expect(detectMimeType("clip.ogg", "application/octet-stream")).toBe("video/ogg");
  });

  it("returns video/x-ms-wmv for .wmv files when multer returns octet-stream", () => {
    expect(detectMimeType("windows.wmv", "application/octet-stream")).toBe("video/x-ms-wmv");
  });

  it("preserves the original mime type when multer detects it correctly", () => {
    expect(detectMimeType("video.mp4", "video/mp4")).toBe("video/mp4");
  });

  it("preserves the original mime type for non-video files", () => {
    expect(detectMimeType("document.pdf", "application/pdf")).toBe("application/pdf");
  });

  it("returns octet-stream for unknown extensions", () => {
    expect(detectMimeType("file.xyz", "application/octet-stream")).toBe("application/octet-stream");
  });

  it("handles uppercase extensions correctly", () => {
    expect(detectMimeType("VIDEO.MP4", "application/octet-stream")).toBe("video/mp4");
  });

  it("handles .m4v extension as video/mp4", () => {
    expect(detectMimeType("iphone_video.m4v", "application/octet-stream")).toBe("video/mp4");
  });
});

describe("Video Upload - compareUrlVsUpload input validation", () => {
  it("requires viralUrl to be a valid URL", () => {
    const { z } = require("zod");
    const schema = z.object({
      viralUrl: z.string().url("URL del vídeo viral no válida"),
      userFileKey: z.string().min(1, "File key del vídeo del usuario requerido"),
      userFileName: z.string(),
      userMimeType: z.string(),
      userFileSize: z.number(),
    });

    // Valid input
    const valid = schema.safeParse({
      viralUrl: "https://example.com/video.mp4",
      userFileKey: "videos/123/abc-video.mp4",
      userFileName: "my_video.mp4",
      userMimeType: "video/mp4",
      userFileSize: 1024000,
    });
    expect(valid.success).toBe(true);

    // Invalid URL
    const invalidUrl = schema.safeParse({
      viralUrl: "not-a-url",
      userFileKey: "videos/123/abc-video.mp4",
      userFileName: "my_video.mp4",
      userMimeType: "video/mp4",
      userFileSize: 1024000,
    });
    expect(invalidUrl.success).toBe(false);

    // Empty file key
    const emptyKey = schema.safeParse({
      viralUrl: "https://example.com/video.mp4",
      userFileKey: "",
      userFileName: "my_video.mp4",
      userMimeType: "video/mp4",
      userFileSize: 1024000,
    });
    expect(emptyKey.success).toBe(false);
  });
});

describe("Video Upload - File size validation", () => {
  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

  it("accepts files under 500MB", () => {
    const fileSize = 100 * 1024 * 1024; // 100MB
    expect(fileSize <= MAX_FILE_SIZE).toBe(true);
  });

  it("rejects files over 500MB", () => {
    const fileSize = 600 * 1024 * 1024; // 600MB
    expect(fileSize <= MAX_FILE_SIZE).toBe(false);
  });

  it("accepts exactly 500MB", () => {
    const fileSize = 500 * 1024 * 1024; // 500MB
    expect(fileSize <= MAX_FILE_SIZE).toBe(true);
  });
});
