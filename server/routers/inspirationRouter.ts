import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { inspirationSectors } from "../../drizzle/schema";
import { eq, like, sql, asc } from "drizzle-orm";

export const inspirationRouter = router({
  // Get all sectors grouped by category
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { sectors: [], categories: [], total: 0 };

    const allSectors = await db
      .select()
      .from(inspirationSectors)
      .orderBy(asc(inspirationSectors.category), asc(inspirationSectors.name));

    // Group by category
    const categoryMap = new Map<string, {
      name: string;
      icon: string;
      gradientFrom: string;
      gradientTo: string;
      count: number;
    }>();

    for (const sector of allSectors) {
      if (!categoryMap.has(sector.category)) {
        categoryMap.set(sector.category, {
          name: sector.category,
          icon: sector.categoryIcon,
          gradientFrom: sector.gradientFrom,
          gradientTo: sector.gradientTo,
          count: 0,
        });
      }
      categoryMap.get(sector.category)!.count++;
    }

    const categories = Array.from(categoryMap.values())
      .sort((a, b) => b.count - a.count);

    return {
      sectors: allSectors,
      categories,
      total: allSectors.length,
    };
  }),

  // Search sectors by name (fuzzy)
  search: publicProcedure
    .input(z.object({ query: z.string().min(1).max(200) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const searchTerm = `%${input.query}%`;
      
      const results = await db
        .select()
        .from(inspirationSectors)
        .where(like(inspirationSectors.name, searchTerm))
        .orderBy(asc(inspirationSectors.name))
        .limit(20);

      return results;
    }),

  // Get sectors by category
  getByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const results = await db
        .select()
        .from(inspirationSectors)
        .where(eq(inspirationSectors.category, input.category))
        .orderBy(asc(inspirationSectors.name));

      return results;
    }),

  // Get a single sector by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [result] = await db
        .select()
        .from(inspirationSectors)
        .where(eq(inspirationSectors.slug, input.slug))
        .limit(1);

      return result || null;
    }),

  // Get category stats
  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, categories: 0, platforms: { tiktok: 0, instagram: 0, other: 0 } };

    const [totalResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(inspirationSectors);

    const categoryResults = await db
      .select({ 
        category: inspirationSectors.category,
        count: sql<number>`COUNT(*)` 
      })
      .from(inspirationSectors)
      .groupBy(inspirationSectors.category);

    const platformResults = await db
      .select({ 
        platform: inspirationSectors.platform,
        count: sql<number>`COUNT(*)` 
      })
      .from(inspirationSectors)
      .groupBy(inspirationSectors.platform);

    const platforms = { tiktok: 0, instagram: 0, other: 0 };
    for (const p of platformResults) {
      if (p.platform in platforms) {
        platforms[p.platform as keyof typeof platforms] = p.count;
      }
    }

    return {
      total: totalResult?.count || 0,
      categories: categoryResults.length,
      platforms,
    };
  }),
});
