import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { notifyOwner } from "./_core/notification";
import * as db from "./db";
import * as videoIndexerTrial from "./video-indexer-trial";

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
    uploadAndAnalyze: protectedProcedure
      .input(z.object({
        videoData: z.string(), // base64
        fileName: z.string(),
        mimeType: z.string(),
        analysisType: z.enum(["viral_analysis", "comparison", "expert_review"]),
      }))
      .mutation(async ({ ctx, input }) => {
        // Extract base64 data
        const base64Data = input.videoData.split(",")[1] || input.videoData;
        const buffer = Buffer.from(base64Data, "base64");
        
        // Upload to S3
        const fileKey = `videos/${ctx.user.id}/${nanoid()}-${input.fileName}`;
        const { url: videoUrl } = await storagePut(fileKey, buffer, input.mimeType);
        
        // Create video record
        const videoId = await db.createVideo({
          userId: ctx.user.id,
          title: input.fileName,
          videoUrl,
          videoKey: fileKey,
          mimeType: input.mimeType,
          fileSize: buffer.length,
          videoType: "viral_reference",
        });
        
        // Create analysis record
        const analysisId = await db.createVideoAnalysis({
          videoId,
          userId: ctx.user.id,
          analysisType: input.analysisType,
          status: "processing",
        });
        
        // Perform AI analysis
        try {
          // Try to use Azure Video Indexer Trial API if available
          let videoIndexData: {
            transcript: string;
            keywords: string[];
            emotions: string[];
            labels: string[];
            duration: number;
          } | null = null;
          
          try {
            const isAvailable = await videoIndexerTrial.checkTrialApiStatus();
            if (isAvailable) {
              const uploadResult = await videoIndexerTrial.uploadVideoForAnalysis(
                videoUrl,
                input.fileName,
                "Video uploaded for viral analysis"
              );
              
              if (uploadResult) {
                // Wait for indexing to complete (poll every 10 seconds, max 5 minutes)
                let attempts = 0;
                const maxAttempts = 30;
                
                while (attempts < maxAttempts) {
                  const status = await videoIndexerTrial.getVideoIndexingStatus(uploadResult.videoId);
                  if (status?.state === 'Processed') {
                    const insights = await videoIndexerTrial.getVideoInsights(uploadResult.videoId);
                    if (insights) {
                      videoIndexData = {
                        transcript: insights.transcript || '',
                        keywords: insights.keywords || [],
                        emotions: insights.emotions?.map(e => e.type) || [],
                        labels: insights.labels || [],
                        duration: insights.duration || 0,
                      };
                    }
                    break;
                  } else if (status?.state === 'Failed') {
                    console.warn('Video indexing failed');
                    break;
                  }
                  await new Promise(resolve => setTimeout(resolve, 10000));
                  attempts++;
                }
              }
            }
          } catch (indexError) {
            console.warn("Video Indexer analysis failed, falling back to LLM-only analysis:", indexError);
          }
          
          // Build analysis prompt with video data if available
          let videoContext = "";
          if (videoIndexData) {
            videoContext = `\n\nDATOS EXTRAÍDOS DEL VÍDEO:\n- Duración: ${videoIndexData.duration} segundos\n- Transcripción: ${videoIndexData.transcript}\n- Emociones detectadas: ${videoIndexData.emotions.join(", ")}\n- Palabras clave: ${videoIndexData.keywords.join(", ")}\n- Objetos/acciones: ${videoIndexData.labels.join(", ")}\n`;
          }
          
          const analysisPrompt = `Eres un experto en análisis de vídeos virales de redes sociales. Analiza este vídeo y proporciona un análisis detallado en formato JSON.${videoContext}

El vídeo ha sido subido y necesito que analices su potencial viral basándote en las mejores prácticas de contenido viral en Instagram Reels y TikTok.

Proporciona tu análisis en el siguiente formato JSON exacto:
{
  "hookAnalysis": "Análisis detallado del hook (primeros 3 segundos). Describe qué técnica usa para captar atención, si hay texto en pantalla, movimiento de cámara, expresión facial, etc.",
  "structureBreakdown": {
    "segments": [
      {
        "startTime": 0,
        "endTime": 3,
        "type": "Hook",
        "description": "Descripción de lo que ocurre en este segmento"
      },
      {
        "startTime": 3,
        "endTime": 10,
        "type": "Desarrollo",
        "description": "Descripción del contenido principal"
      },
      {
        "startTime": 10,
        "endTime": 15,
        "type": "Clímax/CTA",
        "description": "Momento culminante o llamada a la acción"
      }
    ]
  },
  "viralityFactors": {
    "factors": [
      {
        "name": "Hook Efectivo",
        "score": 85,
        "description": "Explicación de por qué el hook funciona o no"
      },
      {
        "name": "Ritmo y Pacing",
        "score": 78,
        "description": "Análisis del ritmo de edición"
      },
      {
        "name": "Valor Emocional",
        "score": 90,
        "description": "Conexión emocional que genera"
      },
      {
        "name": "Compartibilidad",
        "score": 82,
        "description": "Probabilidad de que se comparta"
      }
    ]
  },
  "summary": "Resumen completo de 2-3 párrafos explicando qué hace el vídeo, por qué funciona, y las técnicas específicas que lo hacen viral. Incluye recomendaciones sobre qué elementos replicar.",
  "overallScore": 84,
  "hookScore": 85,
  "pacingScore": 78,
  "engagementScore": 88
}

Responde SOLO con el JSON, sin texto adicional.`;

          const response = await invokeLLM({
            messages: [
              { role: "system", content: "Eres un experto analista de contenido viral. Responde siempre en español y en formato JSON válido." },
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

          const content = response.choices[0].message.content;
          const analysisData = JSON.parse(typeof content === 'string' ? content : '{}');
          
          // Update analysis with results
          await db.updateVideoAnalysis(analysisId, {
            hookAnalysis: analysisData.hookAnalysis,
            structureBreakdown: analysisData.structureBreakdown,
            viralityFactors: analysisData.viralityFactors,
            summary: analysisData.summary,
            overallScore: analysisData.overallScore,
            hookScore: analysisData.hookScore,
            pacingScore: analysisData.pacingScore,
            engagementScore: analysisData.engagementScore,
            status: "completed",
          });

          return {
            id: analysisId,
            videoId,
            ...analysisData,
          };
        } catch (error) {
          await db.updateVideoAnalysis(analysisId, {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      }),

    compareVideos: protectedProcedure
      .input(z.object({
        userVideoData: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        viralAnalysisId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get the viral analysis for reference
        const viralAnalysis = await db.getVideoAnalysisById(input.viralAnalysisId);
        if (!viralAnalysis) {
          throw new Error("Viral analysis not found");
        }

        // Upload user video
        const base64Data = input.userVideoData.split(",")[1] || input.userVideoData;
        const buffer = Buffer.from(base64Data, "base64");
        
        const fileKey = `videos/${ctx.user.id}/${nanoid()}-${input.fileName}`;
        const { url: videoUrl } = await storagePut(fileKey, buffer, input.mimeType);
        
        const videoId = await db.createVideo({
          userId: ctx.user.id,
          title: input.fileName,
          videoUrl,
          videoKey: fileKey,
          mimeType: input.mimeType,
          fileSize: buffer.length,
          videoType: "user_video",
        });

        const analysisId = await db.createVideoAnalysis({
          videoId,
          userId: ctx.user.id,
          analysisType: "comparison",
          comparisonVideoId: viralAnalysis.videoId,
          status: "processing",
        });

        try {
          const comparisonPrompt = `Eres un experto en análisis de vídeos virales. Compara el vídeo del usuario con el análisis del vídeo viral de referencia y proporciona recomendaciones específicas de mejora.

Análisis del vídeo viral de referencia:
- Hook Score: ${viralAnalysis.hookScore}%
- Pacing Score: ${viralAnalysis.pacingScore}%
- Engagement Score: ${viralAnalysis.engagementScore}%
- Overall Score: ${viralAnalysis.overallScore}%
- Resumen: ${viralAnalysis.summary}

Proporciona tu análisis comparativo en el siguiente formato JSON:
{
  "improvementPoints": [
    {
      "area": "Hook/Inicio",
      "current": "Descripción de cómo está actualmente en el vídeo del usuario",
      "recommendation": "Recomendación específica basada en el viral",
      "priority": "high"
    },
    {
      "area": "Ritmo de Edición",
      "current": "Estado actual",
      "recommendation": "Mejora sugerida",
      "priority": "medium"
    },
    {
      "area": "Llamada a la Acción",
      "current": "Estado actual",
      "recommendation": "Mejora sugerida",
      "priority": "low"
    }
  ],
  "cutRecommendations": [
    {
      "timestamp": "0:00-0:03",
      "action": "Acortar o cambiar",
      "reason": "El hook debe ser más impactante como en el viral"
    },
    {
      "timestamp": "0:05-0:08",
      "action": "Añadir corte rápido",
      "reason": "Mantener la atención del espectador"
    }
  ],
  "editingSuggestions": "Párrafo detallado con sugerencias de edición específicas, incluyendo transiciones, efectos, música, texto en pantalla, etc. Basado en lo que funciona en el vídeo viral.",
  "overallScore": 65
}

Responde SOLO con el JSON.`;

          const response = await invokeLLM({
            messages: [
              { role: "system", content: "Eres un experto en edición de vídeo viral. Responde en español y en JSON válido." },
              { role: "user", content: comparisonPrompt }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "video_comparison",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    improvementPoints: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          area: { type: "string" },
                          current: { type: "string" },
                          recommendation: { type: "string" },
                          priority: { type: "string", enum: ["high", "medium", "low"] }
                        },
                        required: ["area", "current", "recommendation", "priority"],
                        additionalProperties: false
                      }
                    },
                    cutRecommendations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          timestamp: { type: "string" },
                          action: { type: "string" },
                          reason: { type: "string" }
                        },
                        required: ["timestamp", "action", "reason"],
                        additionalProperties: false
                      }
                    },
                    editingSuggestions: { type: "string" },
                    overallScore: { type: "number" }
                  },
                  required: ["improvementPoints", "cutRecommendations", "editingSuggestions", "overallScore"],
                  additionalProperties: false
                }
              }
            }
          });

          const compContent = response.choices[0].message.content;
          const comparisonData = JSON.parse(typeof compContent === 'string' ? compContent : '{}');

          await db.updateVideoAnalysis(analysisId, {
            improvementPoints: comparisonData.improvementPoints,
            cutRecommendations: comparisonData.cutRecommendations,
            editingSuggestions: comparisonData.editingSuggestions,
            overallScore: comparisonData.overallScore,
            status: "completed",
          });

          return {
            id: analysisId,
            ...comparisonData,
          };
        } catch (error) {
          await db.updateVideoAnalysis(analysisId, {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      }),

    getUserVideos: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserVideos(ctx.user.id);
    }),

    getUserAnalyses: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserAnalyses(ctx.user.id);
    }),

    getAnalysis: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoAnalysisById(input.id);
      }),

    getLibraryVideos: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getLibraryVideos(input.limit);
      }),

    checkVideoIndexerStatus: protectedProcedure.query(async () => {
      try {
        const isAvailable = await videoIndexerTrial.checkTrialApiStatus();
        return {
          configured: true,
          connected: isAvailable,
          error: isAvailable ? undefined : "Azure Video Indexer Trial API not available",
        };
      } catch (error) {
        return {
          configured: false,
          connected: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
  }),

  // Support router
  support: router({
    createTicket: protectedProcedure
      .input(z.object({
        subject: z.string().min(5).max(255),
        message: z.string().min(10),
        category: z.enum(["analysis_help", "video_review", "technical", "general"]),
        videoData: z.string().optional(),
        fileName: z.string().optional(),
        mimeType: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let videoId: number | undefined;

        // Upload video if provided
        if (input.videoData && input.fileName && input.mimeType) {
          const base64Data = input.videoData.split(",")[1] || input.videoData;
          const buffer = Buffer.from(base64Data, "base64");
          
          const fileKey = `support/${ctx.user.id}/${nanoid()}-${input.fileName}`;
          const { url: videoUrl } = await storagePut(fileKey, buffer, input.mimeType);
          
          videoId = await db.createVideo({
            userId: ctx.user.id,
            title: input.fileName,
            videoUrl,
            videoKey: fileKey,
            mimeType: input.mimeType,
            fileSize: buffer.length,
            videoType: "user_video",
          });
        }

        const ticketId = await db.createSupportTicket({
          userId: ctx.user.id,
          videoId,
          subject: input.subject,
          message: input.message,
          category: input.category,
          status: "open",
          priority: input.category === "video_review" ? "high" : "medium",
        });

        // Notify owner
        await notifyOwner({
          title: `Nuevo ticket de soporte: ${input.subject}`,
          content: `Usuario: ${ctx.user.name || ctx.user.email || "Anónimo"}\nCategoría: ${input.category}\nMensaje: ${input.message.substring(0, 200)}...`,
        });

        return { ticketId };
      }),

    getUserTickets: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSupportTickets(ctx.user.id);
    }),

    getTicket: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const ticket = await db.getSupportTicketById(input.id);
        if (!ticket || ticket.userId !== ctx.user.id) {
          throw new Error("Ticket not found");
        }
        return ticket;
      }),

    getTicketMessages: protectedProcedure
      .input(z.object({ ticketId: z.number() }))
      .query(async ({ ctx, input }) => {
        const ticket = await db.getSupportTicketById(input.ticketId);
        if (!ticket || ticket.userId !== ctx.user.id) {
          throw new Error("Ticket not found");
        }
        return db.getTicketMessages(input.ticketId);
      }),

    addMessage: protectedProcedure
      .input(z.object({
        ticketId: z.number(),
        message: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const ticket = await db.getSupportTicketById(input.ticketId);
        if (!ticket || ticket.userId !== ctx.user.id) {
          throw new Error("Ticket not found");
        }

        await db.createTicketMessage({
          ticketId: input.ticketId,
          userId: ctx.user.id,
          message: input.message,
          isFromSupport: false,
        });

        // Update ticket status
        await db.updateSupportTicket(input.ticketId, {
          status: "waiting_response",
        });

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
