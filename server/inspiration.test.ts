import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("inspiration.getAll", () => {
  it("returns sectors, categories, and total count", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inspiration.getAll();

    expect(result).toHaveProperty("sectors");
    expect(result).toHaveProperty("categories");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.sectors)).toBe(true);
    expect(Array.isArray(result.categories)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("returns 136 sectors from the seeded database", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inspiration.getAll();

    expect(result.total).toBe(136);
    expect(result.sectors.length).toBe(136);
  });

  it("returns categories sorted by count descending", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inspiration.getAll();

    expect(result.categories.length).toBeGreaterThan(0);
    
    // Verify descending order
    for (let i = 1; i < result.categories.length; i++) {
      expect(result.categories[i - 1].count).toBeGreaterThanOrEqual(result.categories[i].count);
    }
  });

  it("each sector has required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inspiration.getAll();

    for (const sector of result.sectors.slice(0, 5)) {
      expect(sector).toHaveProperty("id");
      expect(sector).toHaveProperty("name");
      expect(sector).toHaveProperty("slug");
      expect(sector).toHaveProperty("category");
      expect(sector).toHaveProperty("reelUrl");
      expect(sector).toHaveProperty("platform");
      expect(sector).toHaveProperty("categoryIcon");
      expect(sector).toHaveProperty("gradientFrom");
      expect(sector).toHaveProperty("gradientTo");
      expect(["tiktok", "instagram", "other"]).toContain(sector.platform);
    }
  });

  it("each category has icon, gradient, and count", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inspiration.getAll();

    for (const cat of result.categories) {
      expect(cat).toHaveProperty("name");
      expect(cat).toHaveProperty("icon");
      expect(cat).toHaveProperty("gradientFrom");
      expect(cat).toHaveProperty("gradientTo");
      expect(cat).toHaveProperty("count");
      expect(cat.count).toBeGreaterThan(0);
    }
  });
});

describe("inspiration.search", () => {
  it("returns matching sectors for a valid query", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.inspiration.search({ query: "peluquería" });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    // All results should contain "peluquería" (case-insensitive via LIKE)
    for (const r of results) {
      expect(r.name.toLowerCase()).toContain("peluquer");
    }
  });

  it("returns empty array for non-matching query", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.inspiration.search({ query: "zzzznonexistent" });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  it("limits results to 20", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // "a" should match many sectors
    const results = await caller.inspiration.search({ query: "a" });

    expect(results.length).toBeLessThanOrEqual(20);
  });
});

describe("inspiration.getByCategory", () => {
  it("returns sectors for a valid category", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.inspiration.getByCategory({ category: "Fitness y Deporte" });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.category).toBe("Fitness y Deporte");
    }
  });

  it("returns empty array for non-existing category", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.inspiration.getByCategory({ category: "NonExistentCategory" });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});

describe("inspiration.getBySlug", () => {
  it("returns a sector for a valid slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inspiration.getBySlug({ slug: "peluqueria" });

    expect(result).not.toBeNull();
    expect(result!.name.toLowerCase()).toContain("peluquer");
  });

  it("returns null for non-existing slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inspiration.getBySlug({ slug: "nonexistent-slug-xyz" });

    expect(result).toBeNull();
  });
});

describe("inspiration.getStats", () => {
  it("returns total, categories count, and platform breakdown", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.inspiration.getStats();

    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("categories");
    expect(stats).toHaveProperty("platforms");
    expect(stats.total).toBe(136);
    expect(stats.categories).toBeGreaterThan(0);
    expect(stats.platforms).toHaveProperty("tiktok");
    expect(stats.platforms).toHaveProperty("instagram");
    expect(stats.platforms.tiktok).toBeGreaterThan(0);
  });
});
