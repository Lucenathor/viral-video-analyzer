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

    // New endpoint: Upload video chunk by chunk
    uploadChunk: protectedProcedure
      .input(z.object({
        fileKey: z.string(),
        chunk: z.string(), // base64 chunk
        chunkIndex: z.number(),
        totalChunks: z.number(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Store chunk temporarily (in real implementation, would use multipart upload)
        // For now, we'll handle this differently
        return { success: true, chunkIndex: input.chunkIndex };
      }),

    // New endpoint: Analyze video by URL (after upload)
    analyzeByUrl: protectedProcedure
      .input(z.object({
        videoUrl: z.string(),
        videoKey: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
        analysisType: z.enum(["viral_analysis", "comparison", "expert_review"]),
      }))
      .mutation(async ({ ctx, input }) => {
        console.log('[Analysis] ====== STARTING ANALYSIS BY URL ======');
        console.log('[Analysis] User ID:', ctx.user.id);
        console.log('[Analysis] File name:', input.fileName);
        console.log('[Analysis] Video URL:', input.videoUrl);
        
        // Create video record
        const videoId = await db.createVideo({
          userId: ctx.user.id,
          title: input.fileName,
          videoUrl: input.videoUrl,
          videoKey: input.videoKey,
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
        
        // Perform AI analysis
        try {
          const videoContext = `\n\nINFORMACIÓN DEL VÍDEO:\n- Nombre del archivo: ${input.fileName}\n- Tipo: ${input.mimeType}\n- URL: ${input.videoUrl}\n`;
          
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

          console.log('[Analysis] Calling LLM for analysis...');
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

          console.log('[Analysis] LLM response received');
          const content = response.choices[0].message.content;
          const analysisData = JSON.parse(typeof content === 'string' ? content : '{}');
          console.log('[Analysis] Parsed successfully, overallScore:', analysisData.overallScore);
          
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
          console.log('[Analysis] DB update successful');

          return {
            id: analysisId,
            videoId,
            ...analysisData,
          };
        } catch (error) {
          console.error('[Analysis Error]', error);
          await db.updateVideoAnalysis(analysisId, {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      }),

    // Original endpoint (kept for backwards compatibility with smaller files)
    uploadAndAnalyze: protectedProcedure
      .input(z.object({
        videoData: z.string(), // base64
        fileName: z.string(),
        mimeType: z.string(),
        analysisType: z.enum(["viral_analysis", "comparison", "expert_review"]),
      }))
      .mutation(async ({ ctx, input }) => {
        console.log('[Analysis] ====== STARTING ANALYSIS ======');
        console.log('[Analysis] User ID:', ctx.user.id);
        console.log('[Analysis] File name:', input.fileName);
        console.log('[Analysis] Video data length:', input.videoData.length);
        
        // Extract base64 data
        const base64Data = input.videoData.split(",")[1] || input.videoData;
        const buffer = Buffer.from(base64Data, "base64");
        console.log('[Analysis] Buffer size:', buffer.length, 'bytes');
        
        // Upload to S3
        console.log('[Analysis] Uploading to S3...');
        const fileKey = `videos/${ctx.user.id}/${nanoid()}-${input.fileName}`;
        const { url: videoUrl } = await storagePut(fileKey, buffer, input.mimeType);
        console.log('[Analysis] S3 upload complete. URL:', videoUrl);
        
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
        console.log('[Analysis] Video record created. ID:', videoId);
        
        // Create analysis record
        const analysisId = await db.createVideoAnalysis({
          videoId,
          userId: ctx.user.id,
          analysisType: input.analysisType,
          status: "processing",
        });
        console.log('[Analysis] Analysis record created. ID:', analysisId);
        
        // Perform AI analysis
        try {
          const videoContext = `\n\nINFORMACIÓN DEL VÍDEO:\n- Nombre del archivo: ${input.fileName}\n- Tipo: ${input.mimeType}\n- URL: ${videoUrl}\n`;
          
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

          console.log('[Analysis] Calling LLM for analysis...');
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

          console.log('[Analysis] LLM response received');
          const content = response.choices[0].message.content;
          const analysisData = JSON.parse(typeof content === 'string' ? content : '{}');
          console.log('[Analysis] Parsed successfully');
          
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
          console.log('[Analysis] DB update successful');

          return {
            id: analysisId,
            videoId,
            ...analysisData,
          };
        } catch (error) {
          console.error('[Analysis Error]', error);
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
      "action": "Acortar/Eliminar/Mantener",
      "reason": "Explicación"
    }
  ],
  "editingSuggestions": "Párrafo con sugerencias detalladas de edición",
  "overallScore": 65
}

Responde SOLO con el JSON.`;

          const response = await invokeLLM({
            messages: [
              { role: "system", content: "Eres un experto analista de contenido viral. Responde siempre en español y en formato JSON válido." },
              { role: "user", content: comparisonPrompt }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "comparison_analysis",
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
                          priority: { type: "string" }
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

          const content = response.choices[0].message.content;
          const comparisonData = JSON.parse(typeof content === 'string' ? content : '{}');

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

    getUserAnalyses: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserAnalyses(ctx.user.id);
    }),

    getUserVideos: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserVideos(ctx.user.id);
    }),

    getLibraryVideos: publicProcedure
      .input(z.object({}).optional())
      .query(async () => {
        return db.getLibraryVideos();
      }),

    getAnalysisById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const analysis = await db.getVideoAnalysisById(input.id);
        if (!analysis || analysis.userId !== ctx.user.id) {
          throw new Error("Analysis not found");
        }
        return analysis;
      }),
  }),

  // Support router
  support: router({
    createTicket: protectedProcedure
      .input(z.object({
        subject: z.string().min(1).max(255),
        message: z.string().min(1),
        category: z.enum(["analysis_help", "video_review", "technical", "general"]),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        videoData: z.string().optional(), // base64 video for expert review
        videoFileName: z.string().optional(),
        videoMimeType: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let videoId: number | undefined;

        // If video is provided, upload it
        if (input.videoData && input.videoFileName && input.videoMimeType) {
          const base64Data = input.videoData.split(",")[1] || input.videoData;
          const buffer = Buffer.from(base64Data, "base64");
          
          const fileKey = `support/${ctx.user.id}/${nanoid()}-${input.videoFileName}`;
          const { url: videoUrl } = await storagePut(fileKey, buffer, input.videoMimeType);
          
          videoId = await db.createVideo({
            userId: ctx.user.id,
            title: input.videoFileName,
            videoUrl,
            videoKey: fileKey,
            mimeType: input.videoMimeType,
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
          priority: input.priority || "medium",
          status: "open",
        });

        // Notify owner about new ticket
        await notifyOwner({
          title: `Nuevo ticket de soporte: ${input.subject}`,
          content: `Usuario: ${ctx.user.name || ctx.user.email || 'Usuario'}\nCategoría: ${input.category}\nPrioridad: ${input.priority || 'medium'}\n\nMensaje:\n${input.message}`,
        });

        return { ticketId };
      }),

    getUserTickets: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSupportTickets(ctx.user.id);
    }),

    getTicketById: protectedProcedure
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
