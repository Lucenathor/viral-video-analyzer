import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Create an anonymous (unauthenticated) context - no user
 */
function createAnonymousContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      hostname: "localhost",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("No-auth access: all public procedures should work without login", () => {
  const ctx = createAnonymousContext();
  const caller = appRouter.createCaller(ctx);

  it("video.getUserVideos works without auth (returns empty array)", async () => {
    const result = await caller.video.getUserVideos();
    expect(Array.isArray(result)).toBe(true);
  });

  it("video.getUserAnalyses works without auth (returns empty array)", async () => {
    const result = await caller.video.getUserAnalyses();
    expect(Array.isArray(result)).toBe(true);
  });

  it("calendar.getProgress works without auth", async () => {
    const result = await caller.calendar.getProgress({ sectorId: "clinica_estetica" });
    expect(result).toBeDefined();
  });

  it("auth.me works without auth (returns null user)", async () => {
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("sectors.list works without auth", async () => {
    const result = await caller.sectors.list();
    expect(Array.isArray(result)).toBe(true);
  });
});
