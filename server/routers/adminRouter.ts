import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import * as db from "../db";
import { ENV } from "../_core/env";
import { findViralReelsForSector, runViralSearchJob, addCandidatesToPendingQueue } from "../services/viralReelFinder";

// Sectors available for classification
const SECTORS = [
  { slug: 'clinica-estetica', name: 'Clínica Estética' },
  { slug: 'inmobiliaria', name: 'Inmobiliaria' },
  { slug: 'abogados', name: 'Abogados' },
  { slug: 'marketing', name: 'Agencias de Marketing' },
  { slug: 'personal-trainer', name: 'Personal Trainer' },
  { slug: 'manicura', name: 'Manicura / Uñas' },
  { slug: 'micropigmentacion', name: 'Micropigmentación' },
  { slug: 'peluqueria', name: 'Peluquería / Barbería' },
  { slug: 'restaurantes', name: 'Restaurantes' },
  { slug: 'coaches', name: 'Coaches / Consultores' },
];

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  // Check if user is admin or owner
  if (ctx.user.role !== 'admin' && ctx.user.openId !== ENV.ownerOpenId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Solo los administradores pueden acceder a esta función',
    });
  }
  return next({ ctx });
});

/**
 * Admin Router - Internal panel for managing viral reels
 */
export const adminRouter = router({
  // Get stats overview
  getStats: adminProcedure.query(async () => {
    const stats = await db.getReelStats();
    return {
      ...stats,
      sectors: SECTORS.length,
    };
  }),

  // Get pending reels for review
  getPendingReels: adminProcedure
    .input(z.object({
      status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      return db.getPendingReels(input.status, input.limit);
    }),

  // Get a single pending reel with full details
  getPendingReel: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const reel = await db.getPendingReelById(input.id);
      if (!reel) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Reel no encontrado',
        });
      }
      return reel;
    }),

  // Approve a pending reel
  approveReel: adminProcedure
    .input(z.object({
      id: z.number(),
      sectorSlug: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const approvedId = await db.approvePendingReel(
        input.id,
        ctx.user.id,
        input.sectorSlug,
        input.notes
      );
      return { success: true, approvedId };
    }),

  // Reject a pending reel
  rejectReel: adminProcedure
    .input(z.object({
      id: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.rejectPendingReel(input.id, ctx.user.id, input.notes);
      return { success: true };
    }),

  // Get approved reels
  getApprovedReels: adminProcedure
    .input(z.object({
      sectorSlug: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      return db.getApprovedReels(input.sectorSlug, input.limit);
    }),

  // Update approved reel (featured, order, etc.)
  updateApprovedReel: adminProcedure
    .input(z.object({
      id: z.number(),
      isFeatured: z.boolean().optional(),
      displayOrder: z.number().optional(),
      viralityExplanation: z.string().optional(),
      teachingPoints: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateApprovedReel(id, data as any);
      return { success: true };
    }),

  // Get available sectors
  getSectors: adminProcedure.query(() => {
    return SECTORS;
  }),

  // Search for viral reels in a specific sector
  searchViralReels: adminProcedure
    .input(z.object({
      sectorSlug: z.string().min(2),
      maxResults: z.number().min(1).max(20).default(10),
    }))
    .mutation(async ({ input }) => {
      console.log(`[Admin] Searching viral reels for sector: ${input.sectorSlug}`);
      
      try {
        const candidates = await findViralReelsForSector(input.sectorSlug, input.maxResults);
        const { added, skipped } = await addCandidatesToPendingQueue(candidates);
        
        return {
          success: true,
          found: candidates.length,
          added,
          skipped,
          message: `Encontrados ${candidates.length} reels virales, ${added} añadidos a la cola`,
        };
      } catch (error: any) {
        console.error('[Admin] Error searching viral reels:', error);
        return {
          success: false,
          found: 0,
          added: 0,
          skipped: 0,
          message: `Error: ${error.message}`,
        };
      }
    }),

  // Run full search job across all sectors
  runFullSearchJob: adminProcedure.mutation(async () => {
    console.log('[Admin] Running full viral search job');
    
    try {
      const results = await runViralSearchJob();
      return {
        success: true,
        ...results,
        message: `Búsqueda completa: ${results.totalFound} encontrados, ${results.totalAdded} añadidos`,
      };
    } catch (error: any) {
      console.error('[Admin] Error running search job:', error);
      return {
        success: false,
        totalFound: 0,
        totalAdded: 0,
        totalSkipped: 0,
        bySector: [],
        message: `Error: ${error.message}`,
      };
    }
  }),

  // Analyze a TikTok URL and add to pending queue
  analyzeAndAddReel: adminProcedure
    .input(z.object({
      tiktokUrl: z.string().url(),
      tiktokId: z.string(),
      authorUsername: z.string().optional(),
      authorName: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      coverUrl: z.string().optional(),
      videoUrl: z.string().optional(),
      duration: z.number().optional(),
      likes: z.number().default(0),
      comments: z.number().default(0),
      shares: z.number().default(0),
      views: z.number().default(0),
      hashtags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      console.log(`[Admin] Analyzing reel: ${input.tiktokUrl}`);
      
      // Use AI to analyze the reel and suggest sector
      const analysisPrompt = `
Analiza este vídeo de TikTok y determina:
1. ¿Para qué sector de negocio sería útil como ejemplo viral?
2. ¿Por qué es viral este vídeo? (técnicas de hook, edición, CTA, etc.)
3. Puntuación de viralidad (0-100)

Datos del vídeo:
- Título: ${input.title || 'No disponible'}
- Descripción: ${input.description || 'No disponible'}
- Autor: ${input.authorName || input.authorUsername || 'Desconocido'}
- Likes: ${input.likes.toLocaleString()}
- Comentarios: ${input.comments.toLocaleString()}
- Compartidos: ${input.shares.toLocaleString()}
- Vistas: ${input.views.toLocaleString()}
- Hashtags: ${input.hashtags?.join(', ') || 'Ninguno'}

Sectores disponibles:
${SECTORS.map(s => `- ${s.slug}: ${s.name}`).join('\n')}

Responde en JSON con este formato exacto:
{
  "suggestedSector": "slug-del-sector",
  "viralityExplanation": "Explicación detallada de por qué es viral...",
  "viralityScore": 85,
  "contentAnalysis": {
    "hookType": "pregunta/afirmación/visual",
    "editingStyle": "rápido/lento/dinámico",
    "ctaPresent": true,
    "emotionalTriggers": ["curiosidad", "urgencia"],
    "teachingPoints": ["punto1", "punto2"]
  }
}
`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'Eres un experto en marketing viral y análisis de contenido de TikTok. Responde siempre en JSON válido.' },
            { role: 'user', content: analysisPrompt },
          ],
        });

        let analysis;
        try {
          const rawContent = response.choices[0]?.message?.content || '{}';
          const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
          // Extract JSON from markdown if needed
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
          analysis = JSON.parse(jsonMatch[1] || content);
        } catch {
          analysis = {
            suggestedSector: 'marketing',
            viralityExplanation: 'Análisis automático no disponible',
            viralityScore: 70,
            contentAnalysis: {},
          };
        }

        // Create pending reel
        const pendingId = await db.createPendingReel({
          tiktokId: input.tiktokId,
          tiktokUrl: input.tiktokUrl,
          authorUsername: input.authorUsername,
          authorName: input.authorName,
          title: input.title,
          description: input.description,
          coverUrl: input.coverUrl,
          videoUrl: input.videoUrl,
          duration: input.duration,
          likes: input.likes,
          comments: input.comments,
          shares: input.shares,
          views: input.views,
          suggestedSector: analysis.suggestedSector,
          viralityExplanation: analysis.viralityExplanation,
          viralityScore: analysis.viralityScore,
          contentAnalysis: analysis.contentAnalysis,
          hashtags: input.hashtags,
          searchQuery: 'manual',
          status: 'pending',
        });

        return {
          success: true,
          pendingId,
          analysis,
        };
      } catch (error) {
        console.error('[Admin] Error analyzing reel:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al analizar el reel',
        });
      }
    }),

  // Bulk import reels from a list
  bulkImportReels: adminProcedure
    .input(z.object({
      reels: z.array(z.object({
        tiktokUrl: z.string().url(),
        tiktokId: z.string(),
        authorUsername: z.string().optional(),
        likes: z.number().default(0),
        views: z.number().default(0),
        coverUrl: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      console.log(`[Admin] Bulk importing ${input.reels.length} reels`);
      
      const results = {
        imported: 0,
        skipped: 0,
        errors: 0,
      };

      for (const reel of input.reels) {
        try {
          await db.createPendingReel({
            tiktokId: reel.tiktokId,
            tiktokUrl: reel.tiktokUrl,
            authorUsername: reel.authorUsername,
            likes: reel.likes,
            views: reel.views,
            coverUrl: reel.coverUrl,
            comments: 0,
            shares: 0,
            status: 'pending',
          });
          results.imported++;
        } catch (error: any) {
          if (error.code === 'ER_DUP_ENTRY') {
            results.skipped++;
          } else {
            results.errors++;
          }
        }
      }

      return results;
    }),
});
