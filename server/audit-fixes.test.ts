import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-audit",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
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

describe("calendar.getApprovedReels endpoint", () => {
  it("returns data with fallbackToStatic when no assignments exist", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.calendar.getApprovedReels({
      sectorSlug: "clinica-estetica",
      month: 2, // March (0-indexed)
      year: 2026,
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("assignments");
    expect(Array.isArray(result.assignments)).toBe(true);
    
    // If no assignments in DB, should flag fallback
    if (result.assignments.length === 0) {
      expect(result.fallbackToStatic).toBe(true);
    }
  });

  it("accepts valid month range boundaries (0 and 11)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test month 0 (January)
    const janResult = await caller.calendar.getApprovedReels({
      sectorSlug: "personal-trainer",
      month: 0,
      year: 2026,
    });
    expect(janResult).toBeDefined();
    expect(janResult).toHaveProperty("assignments");

    // Test month 11 (December)
    const decResult = await caller.calendar.getApprovedReels({
      sectorSlug: "personal-trainer",
      month: 11,
      year: 2026,
    });
    expect(decResult).toBeDefined();
    expect(decResult).toHaveProperty("assignments");
  });

  it("rejects invalid month values", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.calendar.getApprovedReels({
        sectorSlug: "personal-trainer",
        month: -1,
        year: 2026,
      })
    ).rejects.toThrow();

    await expect(
      caller.calendar.getApprovedReels({
        sectorSlug: "personal-trainer",
        month: 12,
        year: 2026,
      })
    ).rejects.toThrow();
  });
});

describe("calendar.getApprovedReelsBySector endpoint", () => {
  it("returns approved reels array for a valid sector", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.calendar.getApprovedReelsBySector({
      sectorSlug: "clinica-estetica",
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("calendar.getSubscriptionConfig endpoint", () => {
  it("returns subscription config for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.calendar.getSubscriptionConfig();

    expect(result).toBeDefined();
    expect(result).toHaveProperty("plan");
    expect(result).toHaveProperty("reelsPerDay");
    expect(result).toHaveProperty("allowedMonths");
    expect(typeof result.plan).toBe("string");
    expect(typeof result.reelsPerDay).toBe("number");
    expect(Array.isArray(result.allowedMonths)).toBe(true);
    expect(result.reelsPerDay).toBeGreaterThanOrEqual(1);
  });
});

describe("sectors.list endpoint", () => {
  it("returns list of sectors as public endpoint", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sectors.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("slug");
    }
  });
});

describe("Analyzer unlock dates removed", () => {
  it("should not have any UNLOCK_DATE references in Analyzer.tsx", async () => {
    const fs = await import("fs");
    const analyzerContent = fs.readFileSync(
      "/home/ubuntu/viral-video-analyzer/client/src/pages/Analyzer.tsx",
      "utf-8"
    );
    
    expect(analyzerContent).not.toContain("UNLOCK_DATE_USER_VIDEO");
    expect(analyzerContent).not.toContain("UNLOCK_DATE_VIRAL_VIDEO");
    expect(analyzerContent).not.toContain("isFeatureUnlocked");
    expect(analyzerContent).not.toContain("LockedFeatureCard");
    expect(analyzerContent).not.toContain("daysUntilUnlock");
    expect(analyzerContent).not.toContain("formatUnlockDate");
  });

  it("should not have outdated date references in Home.tsx", async () => {
    const fs = await import("fs");
    const homeContent = fs.readFileSync(
      "/home/ubuntu/viral-video-analyzer/client/src/pages/Home.tsx",
      "utf-8"
    );
    
    expect(homeContent).not.toContain("30 Enero");
    expect(homeContent).not.toContain("5 Febrero");
    expect(homeContent).not.toContain("2026-01-30");
    expect(homeContent).not.toContain("2026-02-05");
  });

  it("should not have outdated TikTok date message in Analyzer.tsx", async () => {
    const fs = await import("fs");
    const analyzerContent = fs.readFileSync(
      "/home/ubuntu/viral-video-analyzer/client/src/pages/Analyzer.tsx",
      "utf-8"
    );
    
    expect(analyzerContent).not.toContain("5 de febrero");
    expect(analyzerContent).not.toContain("disponible el 5");
  });
});
