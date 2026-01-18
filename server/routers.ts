import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { storagePut, storageGet } from "./storage";
import { nanoid } from "nanoid";
import { notifyOwner } from "./_core/notification";
import * as db from "./db";
import { analyzeVideo as analyzeVideoWithAzure, extractViralAnalysis } from "./services/azureVideoIndexer";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Sectors router
  sectors: router({
    list: publicProcedure.query(async () => {
      return db.getAllSectors();
    }),
    
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return db.getSectorBySlug(input.slug);
      }),
    
    getVideos: publicProcedure
      .input(z.object({ sectorId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideosBySector(input.sectorId);
      }),
  }),

  // Video router
  video: router({
    // New endpoint: Get upload URL for direct S3 upload
    getUploadUrl: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const fileKey = `videos/${ctx.user.id}/${nanoid()}-${input.fileName}`;
        return { fileKey, userId: ctx.user.id };
      }),

    // Upload video chunk by chunk
    uploadChunk: protectedProcedure
      .input(z.object({
        fileKey: z.string(),
        chunk: z.string(), // base64 chunk
        chunkIndex: z.number(),
        totalChunks: z.number(),
        mimeType: z.string(),
        isLastChunk: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Decode base64 chunk and upload to S3
        const chunkBuffer = Buffer.from(input.chunk, 'base64');
        const chunkKey = `${input.fileKey}.chunk${input.chunkIndex}`;
        
        try {
          await storagePut(chunkKey, chunkBuffer, input.mimeType);
          console.log(`[Upload] Chunk ${input.chunkIndex + 1}/${input.totalChunks} uploaded for ${input.fileKey}`);
          return { success: true, chunkIndex: input.chunkIndex };
        } catch (error) {
          console.error(`[Upload] Error uploading chunk ${input.chunkIndex}:`, error);
          throw new Error(`Failed to upload chunk ${input.chunkIndex}`);
        }
      }),

    // Finalize upload and start analysis with Azure Video Indexer
    finalizeUploadAndAnalyze: protectedProcedure
      .input(z.object({
        fileKey: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
        analysisType: z.enum(["viral_analysis", "comparison", "expert_review"]),
      }))
      .mutation(async ({ ctx, input }) => {
        console.log('[Analysis] ====== FINALIZING UPLOAD AND STARTING ANALYSIS ======');
        console.log('[Analysis] User ID:', ctx.user.id);
        console.log('[Analysis] File key:', input.fileKey);
        
        // Get the video URL from storage
        const { url: videoUrl } = await storageGet(input.fileKey + '.chunk0');
        console.log('[Analysis] Video URL:', videoUrl);
        
        // Create video record
        const videoId = await db.createVideo({
          userId: ctx.user.id,
          title: input.fileName,
          videoUrl: videoUrl,
          videoKey: input.fileKey,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          videoType: "viral_reference",
        });
        console.log('[Analysis] Video record created. ID:', videoId);
        
        // Create analysis record
        const analysisId = await db.createVideoAnalysis({
          videoId,
          userId: ctx.user.id,
          analysisType: input.analysisType,
          status: "processing",
        });
        console.log('[Analysis] Analysis record created. ID:', analysisId);
        
        // Perform AI analysis with Azure Video Indexer
        try {
          console.log('[Analysis] Starting Azure Video Indexer analysis...');
          
          // Analyze with Azure Video Indexer
          const { videoId: azureVideoId, indexResult, analysis } = await analyzeVideoWithAzure(
            videoUrl,
            `${input.fileName}-${Date.now()}`,
            (message) => console.log(`[Azure] ${message}`)
          );
          
          console.log('[Analysis] Azure Video Indexer completed. Video ID:', azureVideoId);
          console.log('[Analysis] Transcript length:', analysis.transcript.length);
          console.log('[Analysis] Topics:', analysis.topics);
          console.log('[Analysis] Keywords:', analysis.keywords);
          
          // Now use LLM to generate viral analysis based on Azure's data
          const analysisPrompt = `Eres un experto en análisis de vídeos virales de redes sociales (Instagram Reels, TikTok, YouTube Shorts).

Te proporciono los datos extraídos por Azure Video Indexer de un vídeo. ANALIZA estos datos y proporciona un análisis de viralidad detallado.

DATOS DEL VÍDEO:
- Duración: ${analysis.duration} segundos
- Idioma: ${analysis.language}
- Transcripción: "${analysis.transcript}"
- Temas detectados: ${analysis.topics.join(', ') || 'Ninguno'}
- Palabras clave: ${analysis.keywords.join(', ') || 'Ninguna'}
- Ubicaciones mencionadas: ${analysis.locations.join(', ') || 'Ninguna'}
- Personas mencionadas: ${analysis.people.join(', ') || 'Ninguna'}
- Objetos detectados: ${analysis.objects.join(', ') || 'Ninguno'}
- Número de hablantes: ${analysis.speakers}
- Sentimientos: ${analysis.sentiments.map(s => `${s.type} (${s.score})`).join(', ') || 'Neutral'}
- Efectos de audio: ${analysis.audioEffects.join(', ') || 'Ninguno'}

Basándote en estos datos, analiza:
1. Los primeros 3 segundos (el "hook") - ¿Qué técnica usa para captar atención?
2. La estructura completa del vídeo - Divide en segmentos con timestamps
3. Los factores de viralidad - Puntúa cada aspecto del 0 al 100
4. Un resumen detallado de qué hace el vídeo y por qué funcionaría (o no) como contenido viral

Responde en formato JSON.`;

          console.log('[Analysis] Calling LLM for viral analysis...');
          
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "Eres un experto analista de contenido viral. Analiza los datos del vídeo y proporciona un análisis detallado. Responde siempre en español y en formato JSON válido." },
              { role: "user", content: analysisPrompt }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "viral_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    hookAnalysis: { type: "string" },
                    structureBreakdown: {
                      type: "object",
                      properties: {
                        segments: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              startTime: { type: "number" },
                              endTime: { type: "number" },
                              type: { type: "string" },
                              description: { type: "string" }
                            },
                            required: ["startTime", "endTime", "type", "description"],
                            additionalProperties: false
                          }
                        }
                      },
                      required: ["segments"],
                      additionalProperties: false
                    },
                    viralityFactors: {
                      type: "object",
                      properties: {
                        factors: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              score: { type: "number" },
                              description: { type: "string" }
                            },
                            required: ["name", "score", "description"],
                            additionalProperties: false
                          }
                        }
                      },
                      required: ["factors"],
                      additionalProperties: false
                    },
                    summary: { type: "string" },
                    overallScore: { type: "number" },
                    hookScore: { type: "number" },
                    pacingScore: { type: "number" },
                    engagementScore: { type: "number" }
                  },
                  required: ["hookAnalysis", "structureBreakdown", "viralityFactors", "summary", "overallScore", "hookScore", "pacingScore", "engagementScore"],
                  additionalProperties: false
                }
              }
            }
          });
          
          console.log('[Analysis] LLM response received');
          const content = response.choices[0].message.content;
          const analysisData = JSON.parse(typeof content === 'string' ? content : '{}');
          
          // Update analysis record with results
          await db.updateVideoAnalysis(analysisId, {
            status: "completed",
            hookAnalysis: analysisData.hookAnalysis,
            structureBreakdown: JSON.stringify(analysisData.structureBreakdown),
            viralityFactors: JSON.stringify(analysisData.viralityFactors),
            summary: analysisData.summary,
            overallScore: analysisData.overallScore,
            hookScore: analysisData.hookScore,
            pacingScore: analysisData.pacingScore,
            engagementScore: analysisData.engagementScore,
          });
          
          console.log('[Analysis] Analysis completed successfully');
          
          return {
            id: analysisId,
            videoId,
            azureVideoId,
            hookAnalysis: analysisData.hookAnalysis,
            structureBreakdown: analysisData.structureBreakdown,
            viralityFactors: analysisData.viralityFactors,
            summary: analysisData.summary,
            overallScore: analysisData.overallScore,
            hookScore: analysisData.hookScore,
            pacingScore: analysisData.pacingScore,
            engagementScore: analysisData.engagementScore,
            // Include Azure data for reference
            azureAnalysis: {
              transcript: analysis.transcript,
              duration: analysis.duration,
              language: analysis.language,
              topics: analysis.topics,
              keywords: analysis.keywords,
              locations: analysis.locations,
              people: analysis.people,
              objects: analysis.objects,
              speakers: analysis.speakers,
              sentiments: analysis.sentiments,
            }
          };
        } catch (error) {
          console.error('[Analysis] Error during analysis:', error);
          await db.updateVideoAnalysis(analysisId, { status: "failed" });
          throw error;
        }
      }),

    // Get user's videos
    getUserVideos: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserVideos(ctx.user.id);
    }),

    // Get library videos (for dashboard) - public for browsing
    getLibraryVideos: publicProcedure.query(async () => {
      return db.getLibraryVideos();
    }),

    // Get analysis by ID
    getAnalysis: protectedProcedure
      .input(z.object({ analysisId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoAnalysisById(input.analysisId);
      }),

    // Get all analyses for a user
    getUserAnalyses: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserAnalyses(ctx.user.id);
    }),
  }),

  // Support router
  support: router({
    submit: protectedProcedure
      .input(z.object({
        subject: z.string().min(1),
        message: z.string().min(1),
        category: z.enum(["bug", "feature", "question", "other"]),
      }))
      .mutation(async ({ ctx, input }) => {
        // Notify owner about support request
        await notifyOwner({
          title: `[ViralPro Support] ${input.category}: ${input.subject}`,
          content: `User: ${ctx.user.name} (${ctx.user.openId})\n\nCategory: ${input.category}\nSubject: ${input.subject}\n\nMessage:\n${input.message}`,
        });
        
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
