import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  getAllSectors: vi.fn().mockResolvedValue([
    { id: 1, name: "Restaurantes", slug: "restaurantes", description: "Sector gastronómico", imageUrl: null, reelsCount: 25 },
    { id: 2, name: "Fitness", slug: "fitness", description: "Gimnasios y entrenadores", imageUrl: null, reelsCount: 30 },
  ]),
  getSectorBySlug: vi.fn().mockImplementation(async (slug: string) => {
    if (slug === "restaurantes") {
      return { id: 1, name: "Restaurantes", slug: "restaurantes", description: "Sector gastronómico", imageUrl: null, reelsCount: 25 };
    }
    return null;
  }),
  getVideosBySector: vi.fn().mockResolvedValue([
    { id: 1, title: "Reel viral 1", videoUrl: "https://example.com/video1.mp4", thumbnailUrl: null, viewCount: 10000, duration: 30 },
  ]),
  getUserVideos: vi.fn().mockResolvedValue([
    { id: 1, title: "Mi video", videoUrl: "https://example.com/myvideo.mp4", videoType: "viral_reference", createdAt: new Date() },
  ]),
  getUserAnalyses: vi.fn().mockResolvedValue([
    { id: 1, analysisType: "viral_analysis", status: "completed", overallScore: 85, hookScore: 90, pacingScore: 80, engagementScore: 85, createdAt: new Date() },
  ]),
  getUserSupportTickets: vi.fn().mockResolvedValue([
    { id: 1, subject: "Ayuda con análisis", message: "Necesito ayuda", status: "open", category: "analysis_help", createdAt: new Date() },
  ]),
  getSupportTicketById: vi.fn().mockImplementation(async (id: number) => {
    if (id === 1) {
      return { id: 1, userId: 1, subject: "Ayuda con análisis", message: "Necesito ayuda", status: "open", category: "analysis_help", createdAt: new Date() };
    }
    return null;
  }),
  getTicketMessages: vi.fn().mockResolvedValue([]),
  getLibraryVideos: vi.fn().mockResolvedValue([
    { id: 1, title: "Video viral", videoUrl: "https://example.com/viral.mp4", thumbnailUrl: null, viewCount: 50000 },
  ]),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("sectors router", () => {
  it("lists all sectors (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const sectors = await caller.sectors.list();

    expect(sectors).toHaveLength(2);
    expect(sectors[0]).toHaveProperty("name", "Restaurantes");
    expect(sectors[1]).toHaveProperty("name", "Fitness");
  });

  it("gets sector by slug (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const sector = await caller.sectors.getBySlug({ slug: "restaurantes" });

    expect(sector).not.toBeNull();
    expect(sector?.name).toBe("Restaurantes");
  });

  it("returns null for non-existent sector", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const sector = await caller.sectors.getBySlug({ slug: "non-existent" });

    expect(sector).toBeNull();
  });

  it("gets videos by sector (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const videos = await caller.sectors.getVideos({ sectorId: 1 });

    expect(videos).toHaveLength(1);
    expect(videos[0]).toHaveProperty("title", "Reel viral 1");
  });
});

describe("video router", () => {
  it("gets user videos (authenticated)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const videos = await caller.video.getUserVideos();

    expect(videos).toHaveLength(1);
    expect(videos[0]).toHaveProperty("title", "Mi video");
  });

  it("gets user analyses (authenticated)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const analyses = await caller.video.getUserAnalyses();

    expect(analyses).toHaveLength(1);
    expect(analyses[0]).toHaveProperty("status", "completed");
    expect(analyses[0]).toHaveProperty("overallScore", 85);
  });

  it("gets library videos (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const videos = await caller.video.getLibraryVideos({});

    expect(videos).toHaveLength(1);
    expect(videos[0]).toHaveProperty("title", "Video viral");
  });

  it("rejects unauthenticated access to user videos", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.video.getUserVideos()).rejects.toThrow();
  });
});

describe("support router", () => {
  it("gets user tickets (authenticated)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const tickets = await caller.support.getUserTickets();

    expect(tickets).toHaveLength(1);
    expect(tickets[0]).toHaveProperty("subject", "Ayuda con análisis");
  });

  it("gets ticket by id (authenticated, own ticket)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const ticket = await caller.support.getTicket({ id: 1 });

    expect(ticket).not.toBeNull();
    expect(ticket.subject).toBe("Ayuda con análisis");
  });

  it("rejects access to non-existent ticket", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.support.getTicket({ id: 999 })).rejects.toThrow("Ticket not found");
  });

  it("rejects unauthenticated access to tickets", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.support.getUserTickets()).rejects.toThrow();
  });
});
