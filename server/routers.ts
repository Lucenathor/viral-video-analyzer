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
import { compressVideo as ffmpegCompress, cleanupCompressedFile } from "./services/ffmpegService";
import { extractFrames, getVideoMetadata, cleanupFrames, ExtractedFrame } from "./services/videoFrameExtractor";
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

    // Finalize upload and start analysis with FFmpeg + Gemini (NO AZURE)
    finalizeUploadAndAnalyze: protectedProcedure
      .input(z.object({
        fileKey: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
        analysisType: z.enum(["viral_analysis", "comparison", "expert_review"]),
      }))
      .mutation(async ({ ctx, input }) => {
        console.log('[Analysis] ====== STARTING FFMPEG + GEMINI ANALYSIS (NO AZURE) ======');
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
        
        let tempInputPath: string | null = null;
        let compressedFilePath: string | null = null;
        let extractedFrames: ExtractedFrame[] = [];
        
        try {
          // ===== STEP 1: DOWNLOAD AND COMBINE CHUNKS =====
          console.log('[Analysis] Step 1: Downloading video chunks...');
          
          const chunks: Buffer[] = [];
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
          
          if (chunks.length === 0) {
            throw new Error('No se pudieron descargar los chunks del vídeo');
          }
          
          // Combine chunks and save to temp file
          const combinedBuffer = Buffer.concat(chunks);
          tempInputPath = path.join(os.tmpdir(), `input_${Date.now()}_${input.fileName}`);
          fs.writeFileSync(tempInputPath, combinedBuffer);
          console.log(`[Analysis] Combined ${chunks.length} chunks, total size: ${(combinedBuffer.length / 1024 / 1024).toFixed(2)} MB`);
          
          // ===== STEP 2: GET VIDEO METADATA =====
          console.log('[Analysis] Step 2: Getting video metadata...');
          const metadata = await getVideoMetadata(tempInputPath);
          console.log(`[Analysis] Video metadata: ${metadata.duration}s, ${metadata.width}x${metadata.height}, codec: ${metadata.codec}`);
          
          if (metadata.duration <= 0) {
            throw new Error('No se pudo leer la duración del vídeo. El archivo puede estar corrupto.');
          }
          
          // ===== STEP 3: COMPRESS VIDEO WITH FFMPEG =====
          console.log('[Analysis] Step 3: Compressing video with FFmpeg...');
          
          try {
            const compressionResult = await ffmpegCompress(tempInputPath, (progress) => {
              console.log(`[FFmpeg] Compression progress: ${progress.percent}%`);
            });
            
            compressedFilePath = compressionResult.outputPath;
            console.log(`[Analysis] FFmpeg compression complete. ${(compressionResult.inputSize / 1024 / 1024).toFixed(2)} MB -> ${(compressionResult.outputSize / 1024 / 1024).toFixed(2)} MB`);
          } catch (compressionError) {
            console.warn('[Analysis] FFmpeg compression failed, using original video:', compressionError);
            // Use original file if compression fails
            compressedFilePath = tempInputPath;
          }
          
          // ===== STEP 4: EXTRACT FRAMES WITH FFMPEG =====
          console.log('[Analysis] Step 4: Extracting frames with FFmpeg...');
          
          // Calculate frame interval based on video duration
          // For short videos (<30s): extract every 1 second
          // For medium videos (30-120s): extract every 2 seconds
          // For long videos (>120s): extract every 3-4 seconds
          let frameInterval = 1;
          let maxFrames = 30;
          
          if (metadata.duration > 120) {
            frameInterval = Math.ceil(metadata.duration / 30); // Aim for ~30 frames
            maxFrames = 30;
          } else if (metadata.duration > 30) {
            frameInterval = 2;
            maxFrames = Math.min(60, Math.ceil(metadata.duration / 2));
          } else {
            frameInterval = 1;
            maxFrames = Math.min(30, Math.ceil(metadata.duration));
          }
          
          extractedFrames = await extractFrames(compressedFilePath || tempInputPath, frameInterval, maxFrames);
          console.log(`[Analysis] Extracted ${extractedFrames.length} frames from video`);
          
          if (extractedFrames.length === 0) {
            throw new Error('No se pudieron extraer frames del vídeo');
          }
          
          // ===== STEP 5: GEMINI ANALYSIS WITH FRAMES =====
          console.log('[Analysis] Step 5: Starting Gemini analysis with', extractedFrames.length, 'frames...');
          
          // Build content array with frames
          const contentParts: any[] = [];
          
          // Add video info as text
          const videoInfoText = `
INFORMACIÓN DEL VÍDEO:
- Nombre del archivo: ${input.fileName}
- Duración total: ${metadata.duration.toFixed(1)} segundos
- Resolución: ${metadata.width}x${metadata.height}
- Codec original: ${metadata.codec}
- FPS: ${metadata.fps}
- Tamaño: ${(input.fileSize / 1024 / 1024).toFixed(2)} MB

FRAMES EXTRAÍDOS: ${extractedFrames.length} frames (cada ${frameInterval} segundo${frameInterval > 1 ? 's' : ''})
Timestamps de los frames: ${extractedFrames.map(f => f.timestamp.toFixed(1) + 's').join(', ')}
`;
          
          contentParts.push({ type: 'text', text: videoInfoText });
          
          // Add frames as images with timestamps
          for (let i = 0; i < extractedFrames.length; i++) {
            const frame = extractedFrames[i];
            
            // Add timestamp label before each frame
            contentParts.push({
              type: 'text',
              text: `\n--- FRAME ${i + 1} (${frame.timestamp.toFixed(1)}s) ---`
            });
            
            contentParts.push({
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${frame.base64}`,
                detail: 'high'
              }
            });
          }
          
          // Add analysis request
          contentParts.push({
            type: 'text',
            text: `
ANALIZA ESTE VÍDEO EN DETALLE EXTREMO. Tienes ${extractedFrames.length} frames extraídos del vídeo completo de ${metadata.duration.toFixed(1)} segundos.

IMPORTANTE: Analiza TODO el vídeo basándote en TODOS los frames proporcionados. No te bases solo en los primeros frames.

DEBES DESCRIBIR EXACTAMENTE:

1. **DESCRIPCIÓN FRAME POR FRAME**: Para CADA frame/imagen que ves, describe:
   - Qué persona aparece y qué está haciendo exactamente
   - Expresión facial y lenguaje corporal
   - Posición de la cámara (primer plano, plano medio, plano general)
   - Movimiento de cámara (estático, zoom, pan, tilt)
   - Iluminación y colores dominantes
   - Objetos y fondo visible
   - Texto en pantalla (si hay)

2. **CORTES DE EDICIÓN**: Identifica TODOS los cortes/transiciones entre frames:
   - Timestamp aproximado de cada corte
   - Tipo de transición (corte seco, fade, zoom, etc.)
   - Ritmo de edición (rápido, lento, variable)

3. **CALL TO ACTION (CTA)**: 
   - ¿Hay CTA? ¿Cuál es exactamente?
   - ¿En qué momento aparece? (timestamp)
   - ¿Es verbal, visual o ambos?
   - ¿Qué acción pide al espectador?

4. **HOOK (primeros 3 segundos)**:
   - ¿Qué técnica usa para captar atención?
   - ¿Qué se ve exactamente en los primeros frames?
   - ¿Por qué funciona (o no) como gancho?

5. **AUDIO Y VOZ** (infiere del contexto visual):
   - ¿Parece que hay narración/voz?
   - ¿Qué tipo de contenido parece ser?
   - ¿Hay texto en pantalla que sugiera el audio?

6. **ESTRUCTURA NARRATIVA**:
   - Introducción/Hook (primeros segundos)
   - Desarrollo/Contenido principal
   - Clímax/Momento clave
   - Cierre/CTA

7. **FACTORES DE VIRALIDAD**: Puntúa del 0-100 y justifica BASÁNDOTE EN TODO EL VÍDEO:
   - Hook Score (qué tan efectivo es el gancho inicial)
   - Pacing Score (ritmo de edición y narrativa)
   - Engagement Score (qué tan atractivo es el contenido)
   - Overall Score (puntuación general de viralidad)

IMPORTANTE: 
- Sé EXTREMADAMENTE DETALLADO
- Analiza TODOS los ${extractedFrames.length} frames, no solo los primeros
- Justifica tus puntuaciones con evidencia de los frames
- Si el vídeo es largo, asegúrate de describir qué pasa en cada sección
`
          });

          console.log('[Analysis] Sending to Gemini...');
          
          const response = await invokeLLM({
            messages: [
              { 
                role: "system", 
                content: "Eres un experto analista de contenido viral con experiencia en TikTok, Instagram Reels y YouTube Shorts. Tu trabajo es analizar vídeos frame por frame, identificando CADA detalle visual, cada corte de edición, cada CTA, y todo lo que ocurre en el vídeo. Debes ser EXTREMADAMENTE DETALLADO y describir exactamente lo que ves en CADA imagen proporcionada. Analiza TODO el vídeo, no solo los primeros segundos. Responde siempre en español y en formato JSON válido." 
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
                    frameByFrameAnalysis: { 
                      type: "string", 
                      description: "Descripción DETALLADA de CADA frame/imagen: qué persona aparece, qué hace, expresión facial, posición de cámara, iluminación, colores, objetos, texto en pantalla. Debe ser muy largo y detallado, cubriendo TODOS los frames." 
                    },
                    hookAnalysis: { 
                      type: "string", 
                      description: "Análisis del hook (primeros 3 segundos): qué técnica usa, qué se ve exactamente, por qué funciona" 
                    },
                    editingAnalysis: {
                      type: "string",
                      description: "Análisis de TODOS los cortes de edición: timestamp de cada corte, tipo de transición (corte seco, fade, zoom), ritmo de edición"
                    },
                    callToAction: {
                      type: "string",
                      description: "¿Hay CTA? ¿Cuál es exactamente? ¿En qué momento aparece (timestamp)? ¿Es verbal, visual o ambos? ¿Qué acción pide?"
                    },
                    audioAnalysis: {
                      type: "string",
                      description: "Análisis del audio inferido del contexto visual: tipo de contenido, posible narración, texto en pantalla"
                    },
                    visualElements: { 
                      type: "string", 
                      description: "Elementos visuales generales: colores dominantes, estilo visual, calidad de producción, formato (vertical/horizontal)" 
                    },
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
                    summary: { type: "string", description: "Resumen completo de por qué este vídeo funcionaría (o no) como contenido viral, basado en TODO el contenido analizado" },
                    overallScore: { type: "number" },
                    hookScore: { type: "number" },
                    pacingScore: { type: "number" },
                    engagementScore: { type: "number" }
                  },
                  required: ["frameByFrameAnalysis", "hookAnalysis", "editingAnalysis", "callToAction", "audioAnalysis", "visualElements", "structureBreakdown", "viralityFactors", "summary", "overallScore", "hookScore", "pacingScore", "engagementScore"],
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
          console.log('[Analysis] Pacing Score:', analysisData.pacingScore);
          console.log('[Analysis] Engagement Score:', analysisData.engagementScore);
          
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
          
          // Cleanup
          cleanupFrames(extractedFrames);
          if (compressedFilePath && compressedFilePath !== tempInputPath) {
            cleanupCompressedFile(compressedFilePath);
          }
          if (tempInputPath && fs.existsSync(tempInputPath)) {
            fs.unlinkSync(tempInputPath);
          }
          
          return {
            id: analysisId,
            videoId,
            // Analysis results
            frameByFrameAnalysis: analysisData.frameByFrameAnalysis,
            hookAnalysis: analysisData.hookAnalysis,
            editingAnalysis: analysisData.editingAnalysis,
            callToAction: analysisData.callToAction,
            audioAnalysis: analysisData.audioAnalysis,
            visualElements: analysisData.visualElements,
            structureBreakdown: analysisData.structureBreakdown,
            viralityFactors: analysisData.viralityFactors,
            summary: analysisData.summary,
            overallScore: analysisData.overallScore,
            hookScore: analysisData.hookScore,
            pacingScore: analysisData.pacingScore,
            engagementScore: analysisData.engagementScore,
            // Video metadata
            videoMetadata: {
              duration: metadata.duration,
              width: metadata.width,
              height: metadata.height,
              fps: metadata.fps,
              codec: metadata.codec,
              framesAnalyzed: extractedFrames.length,
            }
          };
        } catch (error: any) {
          console.error('[Analysis] Error during analysis:', error);
          
          // Cleanup on error
          cleanupFrames(extractedFrames);
          if (compressedFilePath && compressedFilePath !== tempInputPath) {
            cleanupCompressedFile(compressedFilePath);
          }
          if (tempInputPath && fs.existsSync(tempInputPath)) {
            try { fs.unlinkSync(tempInputPath); } catch {}
          }
          
          // Determine user-friendly error message
          let userMessage = 'Error durante el análisis del vídeo';
          
          if (error.message?.includes('chunks')) {
            userMessage = 'Error al descargar el vídeo. Por favor, intenta subirlo de nuevo.';
          } else if (error.message?.includes('duración') || error.message?.includes('corrupto')) {
            userMessage = 'No se pudo leer el vídeo. El archivo puede estar corrupto o en un formato no compatible.';
          } else if (error.message?.includes('frames')) {
            userMessage = 'No se pudieron extraer frames del vídeo. Intenta con un formato diferente (MP4 recomendado).';
          } else if (error.message?.includes('Timeout') || error.message?.includes('timeout')) {
            userMessage = 'El análisis tardó demasiado tiempo. Por favor, intenta con un vídeo más corto.';
          } else if (error.message) {
            userMessage = error.message;
          }
          
          await db.updateVideoAnalysis(analysisId, { status: "failed" });
          
          throw new Error(userMessage);
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
