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
import { 
  analyzeVideoComplete, 
  extractFullAzureData,
  getThumbnailsBase64 
} from "./services/azureVideoIndexer";
import { compressVideo as ffmpegCompress, cleanupCompressedFile } from "./services/ffmpegService";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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
    // Get upload URL for direct S3 upload
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
        const chunkBuffer = Buffer.from(input.chunk, 'base64');
        const chunkKey = `${input.fileKey}.chunk${input.chunkIndex}`;
        
        try {
          await storagePut(chunkKey, chunkBuffer, input.mimeType);
          console.log(`[Upload] Chunk ${input.chunkIndex + 1}/${input.totalChunks} uploaded`);
          return { success: true, chunkIndex: input.chunkIndex };
        } catch (error) {
          console.error(`[Upload] Error uploading chunk ${input.chunkIndex}:`, error);
          throw new Error(`Failed to upload chunk ${input.chunkIndex}`);
        }
      }),

    // Finalize upload and start analysis with Azure Video Indexer + Gemini
    finalizeUploadAndAnalyze: protectedProcedure
      .input(z.object({
        fileKey: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
        analysisType: z.enum(["viral_analysis", "comparison", "expert_review"]),
      }))
      .mutation(async ({ ctx, input }) => {
        console.log('[Analysis] ====== STARTING FULL AZURE + GEMINI ANALYSIS ======');
        console.log('[Analysis] User:', ctx.user.id, '| File:', input.fileName);
        
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
        
        let compressedFilePath: string | null = null;
        
        try {
          // ===== STEP 0: FFMPEG VIDEO COMPRESSION =====
          let processedVideoUrl = videoUrl;
          
          // Download video chunks and combine them for compression
          console.log('[Analysis] Step 0: Preparing video for compression...');
          
          try {
            // Download all chunks and combine them
            const tempInputPath = path.join(os.tmpdir(), `input_${Date.now()}.mp4`);
            const chunks: Buffer[] = [];
            
            // Get all chunks
            let chunkIndex = 0;
            while (true) {
              try {
                const chunkKey = `${input.fileKey}.chunk${chunkIndex}`;
                const { url: chunkUrl } = await storageGet(chunkKey);
                const chunkResponse = await fetch(chunkUrl);
                if (!chunkResponse.ok) break;
                const chunkData = await chunkResponse.arrayBuffer();
                chunks.push(Buffer.from(chunkData));
                chunkIndex++;
              } catch {
                break;
              }
            }
            
            if (chunks.length > 0) {
              // Combine chunks and save to temp file
              const combinedBuffer = Buffer.concat(chunks);
              fs.writeFileSync(tempInputPath, combinedBuffer);
              console.log(`[Analysis] Combined ${chunks.length} chunks, total size: ${(combinedBuffer.length / 1024 / 1024).toFixed(2)} MB`);
              
              // Compress with FFmpeg
              console.log('[Analysis] Compressing video with FFmpeg...');
              const compressionResult = await ffmpegCompress(tempInputPath, (progress) => {
                console.log(`[FFmpeg] Compression progress: ${progress.percent}%`);
              });
              
              compressedFilePath = compressionResult.outputPath;
              console.log(`[Analysis] FFmpeg compression complete. ${(compressionResult.inputSize / 1024 / 1024).toFixed(2)} MB -> ${(compressionResult.outputSize / 1024 / 1024).toFixed(2)} MB (${compressionResult.compressionRatio.toFixed(1)}x)`);
              
              // Upload compressed video to S3
              const compressedBuffer = fs.readFileSync(compressedFilePath);
              const compressedKey = `videos/${ctx.user.id}/compressed_${nanoid()}.mp4`;
              const { url: compressedUrl } = await storagePut(compressedKey, compressedBuffer, 'video/mp4');
              processedVideoUrl = compressedUrl;
              console.log('[Analysis] Compressed video uploaded to S3:', compressedUrl);
              
              // Cleanup temp input file
              fs.unlinkSync(tempInputPath);
            }
          } catch (compressionError) {
            console.warn('[Analysis] FFmpeg compression failed, using original video:', compressionError);
            // Continue with original video if compression fails
          }
          
          // ===== STEP 1: AZURE VIDEO INDEXER =====
          console.log('[Analysis] Step 1: Starting Azure Video Indexer...');
          
          const { videoId: azureVideoId, indexResult, azureData, thumbnailsBase64 } = 
            await analyzeVideoComplete(
              processedVideoUrl,
              `${input.fileName}-${Date.now()}`,
              (message) => console.log(`[Azure] ${message}`)
            );
          
          console.log('[Analysis] Azure completed. Video ID:', azureVideoId);
          console.log('[Analysis] Transcript:', azureData.transcript.substring(0, 200) + '...');
          console.log('[Analysis] Topics:', azureData.topics.join(', '));
          console.log('[Analysis] Thumbnails downloaded:', thumbnailsBase64.length);
          
          // ===== STEP 2: GEMINI ANALYSIS WITH IMAGES =====
          console.log('[Analysis] Step 2: Starting Gemini analysis with images...');
          
          // Build content array with Azure data + images
          const contentParts: any[] = [];
          
          // Add Azure data as text
          const azureDataText = `
DATOS COMPLETOS DE AZURE VIDEO INDEXER:

INFORMACIÓN GENERAL:
- Duración: ${azureData.duration} segundos
- Idioma detectado: ${azureData.language}
- Resolución: ${azureData.resolution}

TRANSCRIPCIÓN COMPLETA:
${azureData.transcriptWithTimestamps}

TEMAS DETECTADOS:
${azureData.topics.join(', ') || 'Ninguno'}

PALABRAS CLAVE:
${azureData.keywords.join(', ') || 'Ninguna'}

PERSONAS MENCIONADAS:
${azureData.people.join(', ') || 'Ninguna'}

UBICACIONES:
${azureData.locations.join(', ') || 'Ninguna'}

MARCAS DETECTADAS:
${azureData.brands.join(', ') || 'Ninguna'}

OBJETOS DETECTADOS:
${azureData.objects.join(', ') || 'Ninguno'}

ETIQUETAS:
${azureData.labels.join(', ') || 'Ninguna'}

SENTIMIENTOS:
${azureData.sentiments.map(s => `${s.type}: ${s.score}`).join(', ') || 'Neutral'}

EMOCIONES DETECTADAS:
${azureData.emotions.map(e => `${e.type}: ${e.score}`).join(', ') || 'Ninguna'}

NÚMERO DE HABLANTES: ${azureData.speakers}

EFECTOS DE AUDIO:
${azureData.audioEffects.join(', ') || 'Ninguno'}

ESCENAS/SHOTS:
${azureData.shots.map((s, i) => `Shot ${i+1}: ${s.start} - ${s.end}`).join('\n')}
`;

          contentParts.push({ type: 'text', text: azureDataText });
          
          // Add thumbnails as images
          for (let i = 0; i < thumbnailsBase64.length; i++) {
            if (thumbnailsBase64[i]) {
              contentParts.push({
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${thumbnailsBase64[i]}`,
                  detail: 'high'
                }
              });
            }
          }
          
          // Add analysis request
          contentParts.push({
            type: 'text',
            text: `
Basándote en TODOS los datos de Azure Video Indexer anteriores Y las ${thumbnailsBase64.length} imágenes/frames del vídeo que te he proporcionado, genera un ANÁLISIS DE VIRALIDAD COMPLETO.

Debes analizar:
1. HOOK (primeros 3 segundos): ¿Qué técnica visual y auditiva usa para captar atención? Describe exactamente lo que ves en las primeras imágenes.
2. ESTRUCTURA: Divide el vídeo en segmentos con timestamps basándote en los shots y la transcripción.
3. ELEMENTOS VISUALES: Describe lo que ves en cada frame/imagen - colores, composición, texto en pantalla, expresiones faciales, etc.
4. FACTORES DE VIRALIDAD: Puntúa cada aspecto del 0 al 100.
5. RESUMEN COMPLETO: Explica por qué este vídeo funcionaría (o no) como contenido viral.

Responde en JSON con esta estructura exacta.
`
          });

          console.log('[Analysis] Sending to Gemini with', thumbnailsBase64.length, 'images...');
          
          const response = await invokeLLM({
            messages: [
              { 
                role: "system", 
                content: "Eres un experto analista de contenido viral. Analiza TODOS los datos de Azure Video Indexer Y las imágenes proporcionadas para dar un análisis completo y detallado. Responde siempre en español y en formato JSON válido." 
              },
              { role: "user", content: contentParts }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "viral_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    hookAnalysis: { type: "string", description: "Análisis detallado del hook basado en lo que VES en las imágenes" },
                    visualElements: { type: "string", description: "Descripción de los elementos visuales de cada frame" },
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
                  required: ["hookAnalysis", "visualElements", "structureBreakdown", "viralityFactors", "summary", "overallScore", "hookScore", "pacingScore", "engagementScore"],
                  additionalProperties: false
                }
              }
            }
          });
          
          console.log('[Analysis] Gemini response received');
          const content = response.choices[0].message.content;
          const analysisData = JSON.parse(typeof content === 'string' ? content : '{}');
          
          console.log('[Analysis] Overall Score:', analysisData.overallScore);
          console.log('[Analysis] Hook Score:', analysisData.hookScore);
          
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
          
          console.log('[Analysis] ====== ANALYSIS COMPLETED SUCCESSFULLY ======');
          
          // Cleanup compressed file if it exists
          if (compressedFilePath) {
            cleanupCompressedFile(compressedFilePath);
          }
          
          return {
            id: analysisId,
            videoId,
            azureVideoId,
            hookAnalysis: analysisData.hookAnalysis,
            visualElements: analysisData.visualElements,
            structureBreakdown: analysisData.structureBreakdown,
            viralityFactors: analysisData.viralityFactors,
            summary: analysisData.summary,
            overallScore: analysisData.overallScore,
            hookScore: analysisData.hookScore,
            pacingScore: analysisData.pacingScore,
            engagementScore: analysisData.engagementScore,
            // Include Azure data for reference
            azureAnalysis: {
              transcript: azureData.transcript,
              transcriptWithTimestamps: azureData.transcriptWithTimestamps,
              duration: azureData.duration,
              language: azureData.language,
              resolution: azureData.resolution,
              topics: azureData.topics,
              keywords: azureData.keywords,
              locations: azureData.locations,
              people: azureData.people,
              brands: azureData.brands,
              objects: azureData.objects,
              labels: azureData.labels,
              speakers: azureData.speakers,
              sentiments: azureData.sentiments,
              emotions: azureData.emotions,
              audioEffects: azureData.audioEffects,
              thumbnailCount: thumbnailsBase64.length,
            }
          };
        } catch (error) {
          console.error('[Analysis] Error during analysis:', error);
          await db.updateVideoAnalysis(analysisId, { status: "failed" });
          
          // Cleanup compressed file if it exists
          if (compressedFilePath) {
            cleanupCompressedFile(compressedFilePath);
          }
          
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
        await notifyOwner({
          title: `[ViralPro Support] ${input.category}: ${input.subject}`,
          content: `User: ${ctx.user.name} (${ctx.user.openId})\n\nCategory: ${input.category}\nSubject: ${input.subject}\n\nMessage:\n${input.message}`,
        });
        
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
