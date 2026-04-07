import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { stripeRouter } from "./routers/stripeRouter";
import { adminRouter } from "./routers/adminRouter";
import { trainingRouter } from "./routers/trainingRouter";
import { inspirationRouter } from "./routers/inspirationRouter";
import { userManagementRouter } from "./routers/userManagementRouter";
import { authRouter } from "./routers/authRouter";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { storagePut, storageGet } from "./storage";
import { nanoid } from "nanoid";
import { notifyOwner } from "./_core/notification";
import * as db from "./db";
import { compressVideo as ffmpegCompress, cleanupCompressedFile } from "./services/ffmpegService";
import { performFullAnalysis, cleanupAnalysis, FullVideoAnalysis } from "./services/ffmpegAdvancedAnalysis";
import { transcribeAudioFile, formatTranscriptionWithTimestamps, extractKeyMoments } from './services/audioTranscription';
import { resolveVideoUrl, downloadResolvedVideo } from './services/videoUrlResolver';
import { extractFrames, cleanupFrames, ExtractedFrame } from './services/videoFrameExtractor';
import { analyzeVideoWithGemini, compareVideosWithGemini, formatAnalysisForComparison } from './services/geminiDirect';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// File-based logging for debugging pipeline
const LOG_FILE = '/tmp/pipeline_debug.log';
function plog(msg: string) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
  console.log(msg);
}

export const appRouter = router({
  system: systemRouter,
  stripe: stripeRouter,
  admin: adminRouter,
  training: trainingRouter,
  inspiration: inspirationRouter,
  userManagement: userManagementRouter,
  
  auth: authRouter,

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
    // Get upload URL for direct S3 upload (bypasses proxy to avoid 413 errors)
    getUploadUrl: publicProcedure
      .input(z.object({
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id ?? 0;
        const fileKey = `videos/${userId}/${nanoid()}-${input.fileName}`;
        const forgeUrl = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/+$/, '') || '';
        const forgeKey = process.env.BUILT_IN_FORGE_API_KEY || '';
        const uploadUrl = `${forgeUrl}/v1/storage/upload?path=${encodeURIComponent(fileKey)}`;
        return { fileKey, userId, uploadUrl, authToken: forgeKey };
      }),

    // Upload video chunk by chunk
    uploadChunk: publicProcedure
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

    // Finalize upload and start FULL analysis with FFmpeg + Whisper + Gemini
    finalizeUploadAndAnalyze: publicProcedure
      .input(z.object({
        fileKey: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
        analysisType: z.enum(["viral_analysis", "comparison", "expert_review"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id ?? null;
        console.log('[Analysis] ====== STARTING FULL VIDEO ANALYSIS ======');
        console.log('[Analysis] User:', userId, '| File:', input.fileName);
        
        // Get the video URL from storage
        const { url: videoUrl } = await storageGet(input.fileKey + '.chunk0');
        console.log('[Analysis] Video URL:', videoUrl);
        
        // Create video record
        const videoId = await db.createVideo({
          userId: userId,
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
          userId: userId,
          analysisType: input.analysisType,
          status: "processing",
        });
        console.log('[Analysis] Analysis record created. ID:', analysisId);
        
        let tempInputPath: string | null = null;
        let compressedFilePath: string | null = null;
        let fullAnalysis: FullVideoAnalysis | null = null;
        
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
          
          // ===== STEP 2: COMPRESS VIDEO WITH FFMPEG =====
          console.log('[Analysis] Step 2: Compressing video with FFmpeg...');
          
          try {
            const compressionResult = await ffmpegCompress(tempInputPath, (progress) => {
              console.log(`[FFmpeg] Compression progress: ${progress.percent}%`);
            });
            
            compressedFilePath = compressionResult.outputPath;
            console.log(`[Analysis] FFmpeg compression complete. ${(compressionResult.inputSize / 1024 / 1024).toFixed(2)} MB -> ${(compressionResult.outputSize / 1024 / 1024).toFixed(2)} MB`);
          } catch (compressionError) {
            console.warn('[Analysis] FFmpeg compression failed, using original video:', compressionError);
            compressedFilePath = tempInputPath;
          }
          
          // ===== STEP 3: FULL FFMPEG ANALYSIS =====
          console.log('[Analysis] Step 3: Performing full FFmpeg analysis...');
          fullAnalysis = await performFullAnalysis(compressedFilePath || tempInputPath);
          
          console.log('[Analysis] Full analysis results:');
          console.log(`  - Duration: ${fullAnalysis.metadata.duration.toFixed(1)}s`);
          console.log(`  - Resolution: ${fullAnalysis.metadata.width}x${fullAnalysis.metadata.height}`);
          console.log(`  - FPS: ${fullAnalysis.metadata.fps}`);
          console.log(`  - Codec: ${fullAnalysis.metadata.codec}`);
          console.log(`  - Has Audio: ${fullAnalysis.metadata.hasAudio}`);
          console.log(`  - Scene Changes: ${fullAnalysis.sceneChanges.length}`);
          console.log(`  - Shots: ${fullAnalysis.shotDurations.length}`);
          console.log(`  - Frames Extracted: ${fullAnalysis.frames.length}`);
          console.log(`  - Silences: ${fullAnalysis.audioAnalysis.silences.length}`);
          console.log(`  - Loud Peaks: ${fullAnalysis.audioAnalysis.loudPeaks.length}`);
          
          // ===== STEP 4: TRANSCRIBE AUDIO =====
          let transcription = {
            success: false,
            text: '',
            language: '',
            duration: 0,
            segments: [] as Array<{ id: number; start: number; end: number; text: string }>,
            formattedTranscript: '',
            keyMoments: [] as Array<{ timestamp: number; text: string; type: string }>
          };
          
          if (fullAnalysis.audioPath && fullAnalysis.metadata.hasAudio) {
            console.log('[Analysis] Step 4: Transcribing audio with Whisper...');
            const transcriptionResult = await transcribeAudioFile(fullAnalysis.audioPath);
            
            if (transcriptionResult.success) {
              transcription = {
                success: true,
                text: transcriptionResult.text,
                language: transcriptionResult.language,
                duration: transcriptionResult.duration,
                segments: transcriptionResult.segments,
                formattedTranscript: formatTranscriptionWithTimestamps(transcriptionResult.segments),
                keyMoments: extractKeyMoments(transcriptionResult.segments)
              };
              console.log(`[Analysis] Transcription complete: ${transcription.text.length} chars, ${transcription.segments.length} segments`);
              console.log(`[Analysis] Key moments found: ${transcription.keyMoments.length}`);
            } else {
              console.warn('[Analysis] Transcription failed:', transcriptionResult.error);
            }
          } else {
            console.log('[Analysis] Step 4: Skipping transcription (no audio)');
          }
          
          // ===== STEP 5: GEMINI ANALYSIS WITH ALL DATA =====
          console.log('[Analysis] Step 5: Starting Gemini analysis with all data...');
          
          // Build comprehensive data text
          const comprehensiveDataText = buildComprehensiveDataText(fullAnalysis, transcription);
          
          // Build content array with frames
          const contentParts: any[] = [];
          contentParts.push({ type: 'text', text: comprehensiveDataText });
          
          // Add frames with timestamps
          for (let i = 0; i < fullAnalysis.frames.length; i++) {
            const frame = fullAnalysis.frames[i];
            
            // Add frame type label
            const frameLabel = frame.type === 'scene_change' ? '🎬 CAMBIO DE ESCENA' :
                              frame.type === 'thumbnail' ? '📸 THUMBNAIL' : '🎞️ FRAME';
            
            contentParts.push({
              type: 'text',
              text: `\n--- ${frameLabel} ${i + 1} (${frame.timestamp.toFixed(1)}s) ---`
            });
            
            contentParts.push({
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${frame.base64}`,
                detail: 'high'
              }
            });
          }
          
          // Add ultra-detailed analysis prompt
          contentParts.push({
            type: 'text',
            text: buildAnalysisPrompt(fullAnalysis, transcription)
          });

          console.log('[Analysis] Sending to Gemini with', fullAnalysis.frames.length, 'frames...');
          
          const response = await invokeLLM({
            messages: [
              { 
                role: "system", 
                content: `Eres el analista de contenido viral más experto del mundo. Tienes acceso a:
- ${fullAnalysis.frames.length} frames extraídos del vídeo
- Transcripción completa del audio con timestamps
- Análisis de audio (volumen, silencios, picos)
- Detección automática de escenas y cortes
- Metadatos técnicos completos

Tu trabajo es proporcionar el análisis MÁS DETALLADO Y PRECISO posible, describiendo EXACTAMENTE lo que ves en cada frame, lo que se dice en cada momento, y cómo todo esto contribuye (o no) a la viralidad del contenido.

REGLAS:
1. Analiza TODOS los frames, no solo los primeros
2. Correlaciona el audio con las imágenes
3. Identifica EXACTAMENTE dónde están los cortes de edición
4. Describe el CTA con timestamp exacto
5. Evalúa el hook de los primeros 3 segundos
6. Sé EXTREMADAMENTE DETALLADO

Responde siempre en español y en formato JSON válido.`
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
                      description: "Descripción DETALLADA de CADA frame: qué persona aparece, qué hace, expresión facial, posición de cámara, iluminación, colores, objetos, texto en pantalla. Correlaciona con el audio de ese momento." 
                    },
                    hookAnalysis: { 
                      type: "string", 
                      description: "Análisis del hook (primeros 3 segundos): qué técnica usa, qué se ve y escucha exactamente, por qué funciona. Incluye timestamp exacto." 
                    },
                    editingAnalysis: {
                      type: "string",
                      description: "Análisis de TODOS los cortes de edición detectados: timestamp de cada corte, tipo de transición, ritmo de edición, duración promedio de shots"
                    },
                    callToAction: {
                      type: "string",
                      description: "CTA detectado: texto exacto, timestamp, si es verbal/visual/ambos, qué acción pide, efectividad"
                    },
                    audioAnalysis: {
                      type: "string",
                      description: "Análisis del audio: transcripción resumida, tono de voz, velocidad del habla, música de fondo, efectos de sonido, silencios estratégicos"
                    },
                    visualElements: { 
                      type: "string", 
                      description: "Elementos visuales: colores dominantes, estilo visual, calidad de producción, formato, iluminación, composición" 
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
                    summary: { type: "string", description: "Resumen completo de por qué este vídeo funcionaría (o no) como contenido viral, con recomendaciones específicas de mejora" },
                    overallScore: { type: "number", description: "Puntuación general de viralidad de 0 a 100" },
                    hookScore: { type: "number", description: "Puntuación del hook (primeros 3 segundos) de 0 a 100" },
                    pacingScore: { type: "number", description: "Puntuación del ritmo de edición de 0 a 100" },
                    engagementScore: { type: "number", description: "Puntuación de engagement potencial de 0 a 100" }
                  },
                  required: ["frameByFrameAnalysis", "hookAnalysis", "editingAnalysis", "callToAction", "audioAnalysis", "visualElements", "structureBreakdown", "viralityFactors", "summary", "overallScore", "hookScore", "pacingScore", "engagementScore"],
                  additionalProperties: false
                }
              }
            }
          });
          
          console.log('[Analysis] Gemini response received');
          const content = response.choices[0].message.content;
          console.log('[Analysis] Raw content type:', typeof content);
          console.log('[Analysis] Raw content preview:', typeof content === 'string' ? content.substring(0, 500) : JSON.stringify(content).substring(0, 500));
          
          let analysisData;
          try {
            if (typeof content === 'string') {
              // Try to parse as JSON
              analysisData = JSON.parse(content);
            } else if (typeof content === 'object' && content !== null) {
              // Already an object
              analysisData = content;
            } else {
              throw new Error('Respuesta vacía de Gemini');
            }
          } catch (parseError) {
            console.error('[Analysis] JSON parse error:', parseError);
            console.error('[Analysis] Content that failed to parse:', content);
            
            // Try to extract JSON from the response if it's wrapped in markdown
            if (typeof content === 'string') {
              const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                               content.match(/```\s*([\s\S]*?)\s*```/) ||
                               content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  analysisData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                  console.log('[Analysis] Successfully extracted JSON from markdown');
                } catch {
                  throw new Error('No se pudo parsear la respuesta de Gemini. El análisis falló.');
                }
              } else {
                throw new Error('Gemini no devolvió un JSON válido. Intenta de nuevo.');
              }
            } else {
              throw new Error('Respuesta inesperada de Gemini');
            }
          }
          
          // Validate and ensure all required fields exist with defaults
          if (!analysisData) {
            throw new Error('No se recibió respuesta de análisis de Gemini');
          }
          
          // Ensure required fields exist with defaults
          analysisData.frameByFrameAnalysis = analysisData.frameByFrameAnalysis || [];
          analysisData.hookAnalysis = analysisData.hookAnalysis || 'No se pudo analizar el hook del vídeo.';
          analysisData.editingAnalysis = analysisData.editingAnalysis || 'No se pudo analizar la edición del vídeo.';
          analysisData.callToAction = analysisData.callToAction || { detected: false, timestamp: '0:00', type: 'ninguno', effectiveness: 'No detectado' };
          analysisData.audioAnalysis = analysisData.audioAnalysis || 'No se pudo analizar el audio del vídeo.';
          analysisData.visualElements = analysisData.visualElements || 'No se pudieron analizar los elementos visuales.';
          analysisData.structureBreakdown = analysisData.structureBreakdown || { segments: [] };
          analysisData.viralityFactors = analysisData.viralityFactors || { factors: [] };
          analysisData.summary = analysisData.summary || 'No se pudo generar un resumen del análisis.';
          
          // Ensure nested structures are correct
          if (!analysisData.structureBreakdown.segments) {
            analysisData.structureBreakdown = { segments: [] };
          }
          if (!analysisData.viralityFactors.factors) {
            analysisData.viralityFactors = { factors: [] };
          }
          
          console.log('[Analysis] Validated fields - structureBreakdown:', JSON.stringify(analysisData.structureBreakdown).substring(0, 200));
          console.log('[Analysis] Validated fields - viralityFactors:', JSON.stringify(analysisData.viralityFactors).substring(0, 200));
          
          // Normalize scores to 0-100
          const normalizeScore = (score: number | undefined, fieldName: string): number => {
            console.log(`[Analysis] Normalizing ${fieldName}: raw value = ${score}, type = ${typeof score}`);
            
            if (score === undefined || score === null) {
              console.log(`[Analysis] ${fieldName} is undefined/null, using default 50`);
              return 50;
            }
            
            const numScore = Number(score);
            if (isNaN(numScore)) {
              console.log(`[Analysis] ${fieldName} is NaN, using default 50`);
              return 50;
            }
            
            // If score is 0, it's likely an error - use default
            if (numScore === 0) {
              console.log(`[Analysis] ${fieldName} is 0, using default 50`);
              return 50;
            }
            
            // If score is 0-10, multiply by 10 to get 0-100
            if (numScore <= 10) {
              const normalized = Math.round(numScore * 10);
              console.log(`[Analysis] ${fieldName} normalized from ${numScore} to ${normalized}`);
              return normalized;
            }
            
            // If score is already 0-100, just round it
            const clamped = Math.round(Math.min(100, Math.max(1, numScore)));
            console.log(`[Analysis] ${fieldName} clamped to ${clamped}`);
            return clamped;
          };
          
          analysisData.overallScore = normalizeScore(analysisData.overallScore, 'overallScore');
          analysisData.hookScore = normalizeScore(analysisData.hookScore, 'hookScore');
          analysisData.pacingScore = normalizeScore(analysisData.pacingScore, 'pacingScore');
          analysisData.engagementScore = normalizeScore(analysisData.engagementScore, 'engagementScore');
          
          console.log('[Analysis] Normalized Scores (0-100):');
          console.log(`  - Overall: ${analysisData.overallScore}`);
          console.log(`  - Hook: ${analysisData.hookScore}`);
          console.log(`  - Pacing: ${analysisData.pacingScore}`);
          console.log(`  - Engagement: ${analysisData.engagementScore}`);
          
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
          if (fullAnalysis) {
            cleanupAnalysis(fullAnalysis);
          }
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
              duration: fullAnalysis.metadata.duration,
              width: fullAnalysis.metadata.width,
              height: fullAnalysis.metadata.height,
              fps: fullAnalysis.metadata.fps,
              codec: fullAnalysis.metadata.codec,
              hasAudio: fullAnalysis.metadata.hasAudio,
              audioCodec: fullAnalysis.metadata.audioCodec,
              framesAnalyzed: fullAnalysis.frames.length,
              sceneChanges: fullAnalysis.sceneChanges.length,
              shots: fullAnalysis.shotDurations?.length || 0,
            },
            // Transcription data
            transcription: transcription.success ? {
              text: transcription.text,
              language: transcription.language,
              segments: transcription.segments,
              keyMoments: transcription.keyMoments,
            } : null,
            // Audio analysis
            audioData: {
              meanVolume: fullAnalysis.audioAnalysis.meanVolume,
              maxVolume: fullAnalysis.audioAnalysis.maxVolume,
              silences: fullAnalysis.audioAnalysis.silences.length,
              loudPeaks: fullAnalysis.audioAnalysis.loudPeaks.length,
              hasMusic: fullAnalysis.audioAnalysis.hasMusic,
              hasSpeech: fullAnalysis.audioAnalysis.hasSpeech,
            }
          };
        } catch (error: any) {
          console.error('[Analysis] Error during analysis:', error);
          
          // Cleanup on error
          if (fullAnalysis) {
            cleanupAnalysis(fullAnalysis);
          }
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
          
          await db.updateVideoAnalysis(analysisId, { status: "failed", errorMessage: userMessage });
          
          throw new Error(userMessage);
        }
      }),

    // Get user's videos
    getUserVideos: publicProcedure.query(async ({ ctx }) => {
      const userId = ctx.user?.id ?? null;
      if (!userId) return [];
      return db.getVideosByUser(userId);
    }),

    // Get library videos (for dashboard) - public for browsing
    getLibraryVideos: publicProcedure.query(async () => {
      return db.getLibraryVideos();
    }),

    // Get analysis by ID
    getAnalysis: publicProcedure
      .input(z.object({ analysisId: z.number() }))
      .query(async ({ input }) => {
        return db.getVideoAnalysisById(input.analysisId);
      }),

    // Get all analyses for a user
    getUserAnalyses: publicProcedure.query(async ({ ctx }) => {
      const userId = ctx.user?.id ?? null;
      if (!userId) return [];
      return db.getUserAnalyses(userId);
    }),

    // Compare user video against a viral reference video
    compareVideos: publicProcedure
      .input(z.object({
        // The viral reference analysis ID (already analyzed)
        viralAnalysisId: z.number(),
        // The user's video to compare
        fileKey: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id ?? null;
        console.log('[Comparison] ====== STARTING VIDEO COMPARISON ======');
        console.log('[Comparison] User:', userId, '| Viral Analysis:', input.viralAnalysisId);
        
        // 1. Get the viral reference analysis
        const viralAnalysis = await db.getVideoAnalysisById(input.viralAnalysisId);
        if (!viralAnalysis) {
          throw new Error('No se encontró el análisis del vídeo viral de referencia');
        }
        
        // 2. Create video record for user's video
        const { url: videoUrl } = await storageGet(input.fileKey + '.chunk0');
        const userVideoId = await db.createVideo({
          userId: userId,
          title: input.fileName,
          videoUrl: videoUrl,
          videoKey: input.fileKey,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          videoType: "user_video",
        });
        
        // 3. Create comparison analysis record
        const comparisonId = await db.createVideoAnalysis({
          videoId: userVideoId,
          userId: userId,
          analysisType: "comparison",
          comparisonVideoId: viralAnalysis.videoId,
          status: "processing",
        });
        
        let tempInputPath: string | null = null;
        let compressedFilePath: string | null = null;
        let fullAnalysis: FullVideoAnalysis | null = null;
        
        try {
          // ===== STEP 1: DOWNLOAD USER VIDEO CHUNKS =====
          console.log('[Comparison] Step 1: Downloading user video chunks...');
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
          
          const combinedBuffer = Buffer.concat(chunks);
          tempInputPath = path.join(os.tmpdir(), `compare_${Date.now()}_${input.fileName}`);
          fs.writeFileSync(tempInputPath, combinedBuffer);
          console.log(`[Comparison] Combined ${chunks.length} chunks, total: ${(combinedBuffer.length / 1024 / 1024).toFixed(2)} MB`);
          
          // ===== STEP 2: COMPRESS VIDEO =====
          console.log('[Comparison] Step 2: Compressing video...');
          try {
            const compressionResult = await ffmpegCompress(tempInputPath, (progress) => {
              console.log(`[FFmpeg] Compression: ${progress.percent}%`);
            });
            compressedFilePath = compressionResult.outputPath;
          } catch {
            console.warn('[Comparison] Compression failed, using original');
            compressedFilePath = tempInputPath;
          }
          
          // ===== STEP 3: FULL FFMPEG ANALYSIS OF USER VIDEO =====
          console.log('[Comparison] Step 3: Analyzing user video...');
          fullAnalysis = await performFullAnalysis(compressedFilePath || tempInputPath);
          
          // ===== STEP 4: TRANSCRIBE USER VIDEO =====
          let transcription = {
            success: false, text: '', language: '', duration: 0,
            segments: [] as Array<{ id: number; start: number; end: number; text: string }>,
            formattedTranscript: '', keyMoments: [] as Array<{ timestamp: number; text: string; type: string }>
          };
          
          if (fullAnalysis.audioPath && fullAnalysis.metadata.hasAudio) {
            console.log('[Comparison] Step 4: Transcribing user audio...');
            const transcriptionResult = await transcribeAudioFile(fullAnalysis.audioPath);
            if (transcriptionResult.success) {
              transcription = {
                success: true, text: transcriptionResult.text, language: transcriptionResult.language,
                duration: transcriptionResult.duration, segments: transcriptionResult.segments,
                formattedTranscript: formatTranscriptionWithTimestamps(transcriptionResult.segments),
                keyMoments: extractKeyMoments(transcriptionResult.segments)
              };
            }
          }
          
          // ===== STEP 5: BUILD COMPARISON DATA =====
          console.log('[Comparison] Step 5: Building comparison with Gemini...');
          
          const userVideoDataText = buildComprehensiveDataText(fullAnalysis, transcription);
          
          // Build the viral reference context from stored analysis
          const viralContext = `
═══════════════════════════════════════════════════════════════
              ANÁLISIS DEL VÍDEO VIRAL DE REFERENCIA
═══════════════════════════════════════════════════════════════

Puntuación Viral: ${viralAnalysis.overallScore}/100
Hook Score: ${viralAnalysis.hookScore}/100
Ritmo Score: ${viralAnalysis.pacingScore}/100
Engagement Score: ${viralAnalysis.engagementScore}/100

📌 ANÁLISIS DEL HOOK VIRAL:
${viralAnalysis.hookAnalysis || 'No disponible'}

📌 RESUMEN DEL VIRAL:
${viralAnalysis.summary || 'No disponible'}

📌 ESTRUCTURA DEL VIRAL:
${JSON.stringify(viralAnalysis.structureBreakdown || {}, null, 2)}

📌 FACTORES DE VIRALIDAD:
${JSON.stringify(viralAnalysis.viralityFactors || {}, null, 2)}
`;
          
          // Build content parts with user video frames
          const contentParts: any[] = [];
          contentParts.push({ type: 'text', text: viralContext });
          contentParts.push({ type: 'text', text: '\n\n═══════════════════════════════════════════════════════════════\n              ANÁLISIS DEL VÍDEO DEL USUARIO (A CORREGIR)\n═══════════════════════════════════════════════════════════════\n' });
          contentParts.push({ type: 'text', text: userVideoDataText });
          
          // Add user video frames
          for (let i = 0; i < fullAnalysis.frames.length; i++) {
            const frame = fullAnalysis.frames[i];
            const frameLabel = frame.type === 'scene_change' ? '🎬 CAMBIO DE ESCENA' :
                              frame.type === 'thumbnail' ? '📸 THUMBNAIL' : '🎞️ FRAME';
            contentParts.push({ type: 'text', text: `\n--- ${frameLabel} ${i + 1} (${frame.timestamp.toFixed(1)}s) ---` });
            contentParts.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${frame.base64}`, detail: 'high' } });
          }
          
          // Add comparison prompt
          contentParts.push({ type: 'text', text: buildComparisonPrompt(fullAnalysis, transcription, viralAnalysis) });
          
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Eres el MEJOR COACH DE CONTENIDO VIRAL del mundo. Tu trabajo es comparar el vídeo de un usuario con un vídeo viral de referencia y dar correcciones EXACTAS y ACCIONABLES para que el vídeo del usuario se acerque al nivel del viral.

Tienes acceso a:
- El análisis completo del vídeo VIRAL de referencia (puntuaciones, hook, estructura, factores)
- Los frames del vídeo del USUARIO
- La transcripción del vídeo del USUARIO
- Todos los datos técnicos del vídeo del USUARIO

Tu misión: Identificar EXACTAMENTE qué hace diferente al viral y qué debe cambiar el usuario en su vídeo.

REGLAS:
1. Sé ESPECÍFICO con timestamps ("en el segundo 3.2, deberías...")
2. Compara punto por punto: hook, ritmo, CTA, audio, visual
3. Da correcciones ACCIONABLES, no genéricas
4. Prioriza las correcciones por impacto
5. Sé directo pero constructivo
6. Responde en español y en JSON válido.`
              },
              { role: "user", content: contentParts }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "video_comparison",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    overallVerdict: {
                      type: "string",
                      description: "Veredicto general: ¿Qué tan cerca está el vídeo del usuario del viral? Resumen ejecutivo de 2-3 frases."
                    },
                    similarityScore: {
                      type: "number",
                      description: "Puntuación de similitud con el viral (0-100). Qué tan bien ha replicado el usuario la esencia del viral."
                    },
                    hookComparison: {
                      type: "object",
                      properties: {
                        viralHookSummary: { type: "string", description: "Resumen de qué hace el hook del viral" },
                        userHookAnalysis: { type: "string", description: "Qué hace el hook del usuario" },
                        whatsMissing: { type: "string", description: "Qué le falta al hook del usuario vs el viral" },
                        fixInstructions: { type: "string", description: "Instrucciones EXACTAS para arreglar el hook (con timestamps)" },
                        hookScore: { type: "number", description: "Puntuación del hook del usuario 0-100" }
                      },
                      required: ["viralHookSummary", "userHookAnalysis", "whatsMissing", "fixInstructions", "hookScore"],
                      additionalProperties: false
                    },
                    pacingComparison: {
                      type: "object",
                      properties: {
                        viralPacingSummary: { type: "string", description: "Ritmo del viral: cortes/min, duración de shots" },
                        userPacingAnalysis: { type: "string", description: "Ritmo del usuario: cortes/min, duración de shots" },
                        whatsMissing: { type: "string", description: "Diferencias clave en ritmo" },
                        fixInstructions: { type: "string", description: "Instrucciones EXACTAS de edición (dónde cortar, qué acortar)" },
                        pacingScore: { type: "number", description: "Puntuación del ritmo del usuario 0-100" }
                      },
                      required: ["viralPacingSummary", "userPacingAnalysis", "whatsMissing", "fixInstructions", "pacingScore"],
                      additionalProperties: false
                    },
                    contentComparison: {
                      type: "object",
                      properties: {
                        viralContentSummary: { type: "string", description: "De qué trata el viral y cómo lo presenta" },
                        userContentAnalysis: { type: "string", description: "De qué trata el vídeo del usuario" },
                        whatsMissing: { type: "string", description: "Qué elementos de contenido faltan" },
                        fixInstructions: { type: "string", description: "Cómo mejorar el contenido para acercarse al viral" },
                        contentScore: { type: "number", description: "Puntuación del contenido 0-100" }
                      },
                      required: ["viralContentSummary", "userContentAnalysis", "whatsMissing", "fixInstructions", "contentScore"],
                      additionalProperties: false
                    },
                    visualComparison: {
                      type: "object",
                      properties: {
                        viralVisualSummary: { type: "string", description: "Estilo visual del viral" },
                        userVisualAnalysis: { type: "string", description: "Estilo visual del usuario" },
                        whatsMissing: { type: "string", description: "Diferencias visuales clave" },
                        fixInstructions: { type: "string", description: "Cómo mejorar el aspecto visual" },
                        visualScore: { type: "number", description: "Puntuación visual 0-100" }
                      },
                      required: ["viralVisualSummary", "userVisualAnalysis", "whatsMissing", "fixInstructions", "visualScore"],
                      additionalProperties: false
                    },
                    ctaComparison: {
                      type: "object",
                      properties: {
                        viralCtaSummary: { type: "string", description: "CTA del viral" },
                        userCtaAnalysis: { type: "string", description: "CTA del usuario (o falta de él)" },
                        fixInstructions: { type: "string", description: "Cómo mejorar el CTA" },
                        ctaScore: { type: "number", description: "Puntuación del CTA 0-100" }
                      },
                      required: ["viralCtaSummary", "userCtaAnalysis", "fixInstructions", "ctaScore"],
                      additionalProperties: false
                    },
                    topCorrections: {
                      type: "array",
                      description: "Las 5 correcciones más importantes ordenadas por impacto",
                      items: {
                        type: "object",
                        properties: {
                          priority: { type: "number", description: "1 = más urgente, 5 = menos urgente" },
                          category: { type: "string", description: "hook, pacing, content, visual, cta, audio" },
                          title: { type: "string", description: "Título corto de la corrección" },
                          currentIssue: { type: "string", description: "Qué está mal ahora" },
                          exactFix: { type: "string", description: "Instrucción EXACTA de cómo arreglarlo con timestamps" },
                          expectedImpact: { type: "string", description: "Qué mejora se espera con este cambio" }
                        },
                        required: ["priority", "category", "title", "currentIssue", "exactFix", "expectedImpact"],
                        additionalProperties: false
                      }
                    },
                    whatWorksWell: {
                      type: "array",
                      description: "Cosas que el usuario YA hace bien (para motivar)",
                      items: {
                        type: "object",
                        properties: {
                          aspect: { type: "string", description: "Qué aspecto está bien" },
                          detail: { type: "string", description: "Por qué está bien y cómo se compara con el viral" }
                        },
                        required: ["aspect", "detail"],
                        additionalProperties: false
                      }
                    },
                    overallScore: { type: "number", description: "Puntuación general del vídeo del usuario 0-100" },
                    hookScore: { type: "number", description: "Puntuación del hook 0-100" },
                    pacingScore: { type: "number", description: "Puntuación del ritmo 0-100" },
                    engagementScore: { type: "number", description: "Puntuación de engagement 0-100" }
                  },
                  required: ["overallVerdict", "similarityScore", "hookComparison", "pacingComparison", "contentComparison", "visualComparison", "ctaComparison", "topCorrections", "whatWorksWell", "overallScore", "hookScore", "pacingScore", "engagementScore"],
                  additionalProperties: false
                }
              }
            }
          });
          
          console.log('[Comparison] Gemini response received');
          const content = response.choices[0].message.content;
          
          let comparisonData;
          try {
            if (typeof content === 'string') {
              comparisonData = JSON.parse(content);
            } else if (typeof content === 'object' && content !== null) {
              comparisonData = content;
            } else {
              throw new Error('Respuesta vacía de Gemini');
            }
          } catch (parseError) {
            if (typeof content === 'string') {
              const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try { comparisonData = JSON.parse(jsonMatch[1] || jsonMatch[0]); } catch { throw new Error('No se pudo parsear la respuesta de comparación'); }
              } else { throw new Error('Gemini no devolvió un JSON válido'); }
            } else { throw new Error('Respuesta inesperada de Gemini'); }
          }
          
          // Normalize scores
          const normalizeScore = (score: number | undefined): number => {
            if (!score || isNaN(Number(score))) return 50;
            const n = Number(score);
            if (n === 0) return 50;
            if (n <= 10) return Math.round(n * 10);
            return Math.round(Math.min(100, Math.max(1, n)));
          };
          
          comparisonData.overallScore = normalizeScore(comparisonData.overallScore);
          comparisonData.hookScore = normalizeScore(comparisonData.hookScore);
          comparisonData.pacingScore = normalizeScore(comparisonData.pacingScore);
          comparisonData.engagementScore = normalizeScore(comparisonData.engagementScore);
          comparisonData.similarityScore = normalizeScore(comparisonData.similarityScore);
          
          // Save to DB
          await db.updateVideoAnalysis(comparisonId, {
            status: "completed",
            hookAnalysis: comparisonData.hookComparison ? JSON.stringify(comparisonData.hookComparison) : null,
            structureBreakdown: JSON.stringify(comparisonData.pacingComparison || {}),
            viralityFactors: JSON.stringify(comparisonData.topCorrections || []),
            summary: comparisonData.overallVerdict,
            improvementPoints: JSON.stringify(comparisonData.topCorrections || []),
            cutRecommendations: JSON.stringify(comparisonData.pacingComparison || {}),
            editingSuggestions: comparisonData.pacingComparison?.fixInstructions || null,
            overallScore: comparisonData.overallScore,
            hookScore: comparisonData.hookScore,
            pacingScore: comparisonData.pacingScore,
            engagementScore: comparisonData.engagementScore,
          });
          
          console.log('[Comparison] ====== COMPARISON COMPLETED ======');
          
          // Cleanup
          if (fullAnalysis) cleanupAnalysis(fullAnalysis);
          if (compressedFilePath && compressedFilePath !== tempInputPath) cleanupCompressedFile(compressedFilePath);
          if (tempInputPath && fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
          
          return {
            id: comparisonId,
            videoId: userVideoId,
            viralAnalysisId: input.viralAnalysisId,
            ...comparisonData,
          };
        } catch (error: any) {
          console.error('[Comparison] Error:', error);
          if (fullAnalysis) cleanupAnalysis(fullAnalysis);
          if (compressedFilePath && compressedFilePath !== tempInputPath) cleanupCompressedFile(compressedFilePath);
          if (tempInputPath && fs.existsSync(tempInputPath)) try { fs.unlinkSync(tempInputPath); } catch {}
          
          let userMessage = 'Error durante la comparación de vídeos';
          if (error.message?.includes('chunks')) userMessage = 'Error al descargar el vídeo. Intenta subirlo de nuevo.';
          else if (error.message) userMessage = error.message;
          
          await db.updateVideoAnalysis(comparisonId, { status: "failed", errorMessage: userMessage });
          throw new Error(userMessage);
        }
      }),

    // Compare two videos by URL - downloads both, analyzes viral, then compares
    compareByUrl: publicProcedure
      .input(z.object({
        viralUrl: z.string().url("URL del vídeo viral no válida"),
        userUrl: z.string().url("URL de tu vídeo no válida"),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id ?? null;
        console.log('[CompareByUrl] ====== STARTING URL-BASED COMPARISON ======');
        console.log('[CompareByUrl] User:', userId);
        console.log('[CompareByUrl] Viral URL:', input.viralUrl);
        console.log('[CompareByUrl] User URL:', input.userUrl);
        
        let viralTempPath: string | null = null;
        let userTempPath: string | null = null;
        let viralCompressedPath: string | null = null;
        let userCompressedPath: string | null = null;
        let viralFullAnalysis: FullVideoAnalysis | null = null;
        let userFullAnalysis: FullVideoAnalysis | null = null;
        
        try {
          // ===== STEP 1: RESOLVE & DOWNLOAD BOTH VIDEOS =====
          console.log('[CompareByUrl] Step 1: Resolving viral video URL...');
          const resolvedViral = await resolveVideoUrl(input.viralUrl);
          console.log(`[CompareByUrl] Viral resolved: platform=${resolvedViral.platform}`);
          const viralBuffer = await downloadResolvedVideo(resolvedViral);
          viralTempPath = path.join(os.tmpdir(), `viral_${Date.now()}_${nanoid()}.mp4`);
          fs.writeFileSync(viralTempPath, viralBuffer);
          console.log(`[CompareByUrl] Viral downloaded: ${(viralBuffer.length / 1024 / 1024).toFixed(2)} MB`);
          
          console.log('[CompareByUrl] Step 1b: Resolving user video URL...');
          const resolvedUser = await resolveVideoUrl(input.userUrl);
          console.log(`[CompareByUrl] User resolved: platform=${resolvedUser.platform}`);
          const userBuffer = await downloadResolvedVideo(resolvedUser);
          userTempPath = path.join(os.tmpdir(), `user_${Date.now()}_${nanoid()}.mp4`);
          fs.writeFileSync(userTempPath, userBuffer);
          console.log(`[CompareByUrl] User downloaded: ${(userBuffer.length / 1024 / 1024).toFixed(2)} MB`);
          
          // Create video records
          const viralVideoId = await db.createVideo({
            userId: userId,
            title: 'Viral de referencia (URL)',
            videoUrl: input.viralUrl,
            videoKey: `url-viral-${nanoid()}`,
            mimeType: 'video/mp4',
            fileSize: viralBuffer.length,
            videoType: 'viral_reference',
          });
          
          const userVideoId = await db.createVideo({
            userId: userId,
            title: 'Mi vídeo (URL)',
            videoUrl: input.userUrl,
            videoKey: `url-user-${nanoid()}`,
            mimeType: 'video/mp4',
            fileSize: userBuffer.length,
            videoType: 'user_video',
          });
          
          // ===== STEP 2: COMPRESS BOTH =====
          console.log('[CompareByUrl] Step 2: Compressing viral...');
          try {
            const viralComp = await ffmpegCompress(viralTempPath, (p) => console.log(`[FFmpeg] Viral: ${p.percent}%`));
            viralCompressedPath = viralComp.outputPath;
          } catch { viralCompressedPath = viralTempPath; }
          
          console.log('[CompareByUrl] Step 2b: Compressing user video...');
          try {
            const userComp = await ffmpegCompress(userTempPath, (p) => console.log(`[FFmpeg] User: ${p.percent}%`));
            userCompressedPath = userComp.outputPath;
          } catch { userCompressedPath = userTempPath; }
          
          // ===== STEP 3: ANALYZE VIRAL VIDEO =====
          console.log('[CompareByUrl] Step 3: Analyzing viral video...');
          viralFullAnalysis = await performFullAnalysis(viralCompressedPath || viralTempPath);
          
          let viralTranscription = {
            success: false, text: '', language: '', duration: 0,
            segments: [] as Array<{ id: number; start: number; end: number; text: string }>,
            formattedTranscript: '', keyMoments: [] as Array<{ timestamp: number; text: string; type: string }>
          };
          
          if (viralFullAnalysis.audioPath && viralFullAnalysis.metadata.hasAudio) {
            console.log('[CompareByUrl] Transcribing viral audio...');
            const vtr = await transcribeAudioFile(viralFullAnalysis.audioPath);
            if (vtr.success) {
              viralTranscription = {
                success: true, text: vtr.text, language: vtr.language,
                duration: vtr.duration, segments: vtr.segments,
                formattedTranscript: formatTranscriptionWithTimestamps(vtr.segments),
                keyMoments: extractKeyMoments(vtr.segments)
              };
            }
          }
          
          // Run Gemini on viral to get scores
          const viralDataText = buildComprehensiveDataText(viralFullAnalysis, viralTranscription);
          const viralContentParts: any[] = [{ type: 'text', text: viralDataText }];
          for (let i = 0; i < viralFullAnalysis.frames.length; i++) {
            const frame = viralFullAnalysis.frames[i];
            const label = frame.type === 'scene_change' ? '🎬 CAMBIO' : frame.type === 'thumbnail' ? '📸 THUMB' : '🎞️ FRAME';
            viralContentParts.push({ type: 'text', text: `\n--- ${label} ${i+1} (${frame.timestamp.toFixed(1)}s) ---` });
            viralContentParts.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${frame.base64}`, detail: 'high' } });
          }
          viralContentParts.push({ type: 'text', text: buildAnalysisPrompt(viralFullAnalysis, viralTranscription) });
          
          console.log('[CompareByUrl] Running Gemini on viral...');
          const viralGeminiResponse = await invokeLLM({
            messages: [
              { role: 'system', content: `Eres el analista de contenido viral más experto del mundo. Analiza este vídeo viral en detalle. Responde en español y en JSON válido.` },
              { role: 'user', content: viralContentParts }
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'viral_analysis',
                strict: true,
                schema: {
                  type: 'object',
                  properties: {
                    hookAnalysis: { type: 'string', description: 'Análisis del hook' },
                    summary: { type: 'string', description: 'Resumen del vídeo' },
                    overallScore: { type: 'number', description: 'Puntuación general 0-100' },
                    hookScore: { type: 'number', description: 'Puntuación del hook 0-100' },
                    pacingScore: { type: 'number', description: 'Puntuación del ritmo 0-100' },
                    engagementScore: { type: 'number', description: 'Puntuación de engagement 0-100' },
                    structureBreakdown: { type: 'string', description: 'Desglose de la estructura' },
                    viralityFactors: { type: 'string', description: 'Factores de viralidad' }
                  },
                  required: ['hookAnalysis', 'summary', 'overallScore', 'hookScore', 'pacingScore', 'engagementScore', 'structureBreakdown', 'viralityFactors'],
                  additionalProperties: false
                }
              }
            }
          });
          
          let viralAnalysisData: any;
          const viralContent = viralGeminiResponse.choices[0].message.content;
          if (typeof viralContent === 'string') viralAnalysisData = JSON.parse(viralContent);
          else viralAnalysisData = viralContent;
          
          // Save viral analysis to DB
          const viralAnalysisId = await db.createVideoAnalysis({
            videoId: viralVideoId,
            userId: userId,
            analysisType: 'viral_analysis',
            status: 'completed',
          });
          
          const normalizeScore = (s: number | undefined): number => {
            if (!s || isNaN(Number(s))) return 50;
            const n = Number(s);
            if (n === 0) return 50;
            if (n <= 10) return Math.round(n * 10);
            return Math.round(Math.min(100, Math.max(1, n)));
          };
          
          viralAnalysisData.overallScore = normalizeScore(viralAnalysisData.overallScore);
          viralAnalysisData.hookScore = normalizeScore(viralAnalysisData.hookScore);
          viralAnalysisData.pacingScore = normalizeScore(viralAnalysisData.pacingScore);
          viralAnalysisData.engagementScore = normalizeScore(viralAnalysisData.engagementScore);
          
          await db.updateVideoAnalysis(viralAnalysisId, {
            status: 'completed',
            hookAnalysis: viralAnalysisData.hookAnalysis,
            summary: viralAnalysisData.summary,
            overallScore: viralAnalysisData.overallScore,
            hookScore: viralAnalysisData.hookScore,
            pacingScore: viralAnalysisData.pacingScore,
            engagementScore: viralAnalysisData.engagementScore,
            structureBreakdown: viralAnalysisData.structureBreakdown,
            viralityFactors: viralAnalysisData.viralityFactors,
          });
          
          console.log('[CompareByUrl] Viral analysis saved. Score:', viralAnalysisData.overallScore);
          
          // ===== STEP 4: ANALYZE USER VIDEO =====
          console.log('[CompareByUrl] Step 4: Analyzing user video...');
          userFullAnalysis = await performFullAnalysis(userCompressedPath || userTempPath);
          
          let userTranscription = {
            success: false, text: '', language: '', duration: 0,
            segments: [] as Array<{ id: number; start: number; end: number; text: string }>,
            formattedTranscript: '', keyMoments: [] as Array<{ timestamp: number; text: string; type: string }>
          };
          
          if (userFullAnalysis.audioPath && userFullAnalysis.metadata.hasAudio) {
            console.log('[CompareByUrl] Transcribing user audio...');
            const utr = await transcribeAudioFile(userFullAnalysis.audioPath);
            if (utr.success) {
              userTranscription = {
                success: true, text: utr.text, language: utr.language,
                duration: utr.duration, segments: utr.segments,
                formattedTranscript: formatTranscriptionWithTimestamps(utr.segments),
                keyMoments: extractKeyMoments(utr.segments)
              };
            }
          }
          
          // ===== STEP 5: COMPARISON WITH GEMINI =====
          console.log('[CompareByUrl] Step 5: Running comparison with Gemini...');
          
          const userVideoDataText = buildComprehensiveDataText(userFullAnalysis, userTranscription);
          
          const viralContext = `
═══════════════════════════════════════════════════════════════
              ANÁLISIS DEL VÍDEO VIRAL DE REFERENCIA
═══════════════════════════════════════════════════════════════

Puntuación Viral: ${viralAnalysisData.overallScore}/100
Hook Score: ${viralAnalysisData.hookScore}/100
Ritmo Score: ${viralAnalysisData.pacingScore}/100
Engagement Score: ${viralAnalysisData.engagementScore}/100

📌 ANÁLISIS DEL HOOK VIRAL:
${viralAnalysisData.hookAnalysis || 'No disponible'}

📌 RESUMEN DEL VIRAL:
${viralAnalysisData.summary || 'No disponible'}

📌 ESTRUCTURA DEL VIRAL:
${viralAnalysisData.structureBreakdown || 'No disponible'}

📌 FACTORES DE VIRALIDAD:
${viralAnalysisData.viralityFactors || 'No disponible'}
`;
          
          // Build comparison content parts
          const compContentParts: any[] = [];
          compContentParts.push({ type: 'text', text: viralContext });
          compContentParts.push({ type: 'text', text: '\n\n═══════════════════════════════════════════════════════════════\n              ANÁLISIS DEL VÍDEO DEL USUARIO (A CORREGIR)\n═══════════════════════════════════════════════════════════════\n' });
          compContentParts.push({ type: 'text', text: userVideoDataText });
          
          // Add user video frames
          for (let i = 0; i < userFullAnalysis.frames.length; i++) {
            const frame = userFullAnalysis.frames[i];
            const label = frame.type === 'scene_change' ? '🎬 CAMBIO' : frame.type === 'thumbnail' ? '📸 THUMB' : '🎞️ FRAME';
            compContentParts.push({ type: 'text', text: `\n--- ${label} ${i+1} (${frame.timestamp.toFixed(1)}s) ---` });
            compContentParts.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${frame.base64}`, detail: 'high' } });
          }
          
          // Also add viral frames for visual comparison
          compContentParts.push({ type: 'text', text: '\n\n═══════════════════════════════════════════════════════════════\n              FRAMES DEL VÍDEO VIRAL (REFERENCIA VISUAL)\n═══════════════════════════════════════════════════════════════\n' });
          for (let i = 0; i < viralFullAnalysis.frames.length; i++) {
            const frame = viralFullAnalysis.frames[i];
            const label = frame.type === 'scene_change' ? '🎬 VIRAL CAMBIO' : '🎞️ VIRAL FRAME';
            compContentParts.push({ type: 'text', text: `\n--- ${label} ${i+1} (${frame.timestamp.toFixed(1)}s) ---` });
            compContentParts.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${frame.base64}`, detail: 'high' } });
          }
          
          compContentParts.push({ type: 'text', text: buildComparisonPrompt(userFullAnalysis, userTranscription, viralAnalysisData as any) });
          
          // Create comparison analysis record
          const comparisonId = await db.createVideoAnalysis({
            videoId: userVideoId,
            userId: userId,
            analysisType: 'comparison',
            comparisonVideoId: viralVideoId,
            status: 'processing',
          });
          
          const compResponse = await invokeLLM({
            messages: [
              {
                role: 'system',
                content: `Eres el MEJOR COACH DE CONTENIDO VIRAL del mundo. Tu trabajo es comparar el vídeo de un usuario con un vídeo viral de referencia y dar correcciones EXACTAS y ACCIONABLES.

Tienes acceso a:
- El análisis completo del vídeo VIRAL de referencia (puntuaciones, hook, estructura, factores)
- Los frames de AMBOS vídeos para comparación visual directa
- La transcripción del vídeo del USUARIO
- Todos los datos técnicos del vídeo del USUARIO

REGLAS:
1. Sé ESPECÍFICO con timestamps ("en el segundo 3.2, deberías...")
2. Compara punto por punto: hook, ritmo, CTA, audio, visual
3. Da correcciones ACCIONABLES, no genéricas
4. Prioriza las correcciones por impacto
5. Sé directo pero constructivo
6. Responde en español y en JSON válido.`
              },
              { role: 'user', content: compContentParts }
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'video_comparison',
                strict: true,
                schema: {
                  type: 'object',
                  properties: {
                    overallVerdict: { type: 'string', description: 'Veredicto general de 2-3 frases' },
                    similarityScore: { type: 'number', description: 'Similitud con el viral 0-100' },
                    hookComparison: {
                      type: 'object',
                      properties: {
                        viralHookSummary: { type: 'string' }, userHookAnalysis: { type: 'string' },
                        whatsMissing: { type: 'string' }, fixInstructions: { type: 'string' },
                        hookScore: { type: 'number' }
                      },
                      required: ['viralHookSummary', 'userHookAnalysis', 'whatsMissing', 'fixInstructions', 'hookScore'],
                      additionalProperties: false
                    },
                    pacingComparison: {
                      type: 'object',
                      properties: {
                        viralPacingSummary: { type: 'string' }, userPacingAnalysis: { type: 'string' },
                        whatsMissing: { type: 'string' }, fixInstructions: { type: 'string' },
                        pacingScore: { type: 'number' }
                      },
                      required: ['viralPacingSummary', 'userPacingAnalysis', 'whatsMissing', 'fixInstructions', 'pacingScore'],
                      additionalProperties: false
                    },
                    contentComparison: {
                      type: 'object',
                      properties: {
                        viralContentSummary: { type: 'string' }, userContentAnalysis: { type: 'string' },
                        whatsMissing: { type: 'string' }, fixInstructions: { type: 'string' },
                        contentScore: { type: 'number' }
                      },
                      required: ['viralContentSummary', 'userContentAnalysis', 'whatsMissing', 'fixInstructions', 'contentScore'],
                      additionalProperties: false
                    },
                    visualComparison: {
                      type: 'object',
                      properties: {
                        viralVisualSummary: { type: 'string' }, userVisualAnalysis: { type: 'string' },
                        whatsMissing: { type: 'string' }, fixInstructions: { type: 'string' },
                        visualScore: { type: 'number' }
                      },
                      required: ['viralVisualSummary', 'userVisualAnalysis', 'whatsMissing', 'fixInstructions', 'visualScore'],
                      additionalProperties: false
                    },
                    ctaComparison: {
                      type: 'object',
                      properties: {
                        viralCtaSummary: { type: 'string' }, userCtaAnalysis: { type: 'string' },
                        fixInstructions: { type: 'string' }, ctaScore: { type: 'number' }
                      },
                      required: ['viralCtaSummary', 'userCtaAnalysis', 'fixInstructions', 'ctaScore'],
                      additionalProperties: false
                    },
                    topCorrections: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          priority: { type: 'number' }, category: { type: 'string' },
                          title: { type: 'string' }, currentIssue: { type: 'string' },
                          exactFix: { type: 'string' }, expectedImpact: { type: 'string' }
                        },
                        required: ['priority', 'category', 'title', 'currentIssue', 'exactFix', 'expectedImpact'],
                        additionalProperties: false
                      }
                    },
                    whatWorksWell: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          aspect: { type: 'string' }, detail: { type: 'string' }
                        },
                        required: ['aspect', 'detail'],
                        additionalProperties: false
                      }
                    },
                    overallScore: { type: 'number' },
                    hookScore: { type: 'number' },
                    pacingScore: { type: 'number' },
                    engagementScore: { type: 'number' }
                  },
                  required: ['overallVerdict', 'similarityScore', 'hookComparison', 'pacingComparison', 'contentComparison', 'visualComparison', 'ctaComparison', 'topCorrections', 'whatWorksWell', 'overallScore', 'hookScore', 'pacingScore', 'engagementScore'],
                  additionalProperties: false
                }
              }
            }
          });
          
          console.log('[CompareByUrl] Comparison response received');
          const compContent = compResponse.choices[0].message.content;
          let comparisonData: any;
          if (typeof compContent === 'string') comparisonData = JSON.parse(compContent);
          else comparisonData = compContent;
          
          comparisonData.overallScore = normalizeScore(comparisonData.overallScore);
          comparisonData.hookScore = normalizeScore(comparisonData.hookScore);
          comparisonData.pacingScore = normalizeScore(comparisonData.pacingScore);
          comparisonData.engagementScore = normalizeScore(comparisonData.engagementScore);
          comparisonData.similarityScore = normalizeScore(comparisonData.similarityScore);
          
          await db.updateVideoAnalysis(comparisonId, {
            status: 'completed',
            hookAnalysis: comparisonData.hookComparison ? JSON.stringify(comparisonData.hookComparison) : null,
            structureBreakdown: JSON.stringify(comparisonData.pacingComparison || {}),
            viralityFactors: JSON.stringify(comparisonData.topCorrections || []),
            summary: comparisonData.overallVerdict,
            improvementPoints: JSON.stringify(comparisonData.topCorrections || []),
            cutRecommendations: JSON.stringify(comparisonData.pacingComparison || {}),
            editingSuggestions: comparisonData.pacingComparison?.fixInstructions || null,
            overallScore: comparisonData.overallScore,
            hookScore: comparisonData.hookScore,
            pacingScore: comparisonData.pacingScore,
            engagementScore: comparisonData.engagementScore,
          });
          
          console.log('[CompareByUrl] ====== URL COMPARISON COMPLETED ======');
          
          // Cleanup
          if (viralFullAnalysis) cleanupAnalysis(viralFullAnalysis);
          if (userFullAnalysis) cleanupAnalysis(userFullAnalysis);
          if (viralCompressedPath && viralCompressedPath !== viralTempPath) cleanupCompressedFile(viralCompressedPath);
          if (userCompressedPath && userCompressedPath !== userTempPath) cleanupCompressedFile(userCompressedPath);
          if (viralTempPath && fs.existsSync(viralTempPath)) fs.unlinkSync(viralTempPath);
          if (userTempPath && fs.existsSync(userTempPath)) fs.unlinkSync(userTempPath);
          
          return {
            id: comparisonId,
            videoId: userVideoId,
            viralVideoId,
            viralAnalysis: {
              overallScore: viralAnalysisData.overallScore,
              hookScore: viralAnalysisData.hookScore,
              pacingScore: viralAnalysisData.pacingScore,
              engagementScore: viralAnalysisData.engagementScore,
              summary: viralAnalysisData.summary,
            },
            ...comparisonData,
          };
        } catch (error: any) {
          console.error('[CompareByUrl] Error:', error);
          if (viralFullAnalysis) cleanupAnalysis(viralFullAnalysis);
          if (userFullAnalysis) cleanupAnalysis(userFullAnalysis);
          if (viralCompressedPath && viralCompressedPath !== viralTempPath) try { cleanupCompressedFile(viralCompressedPath); } catch {}
          if (userCompressedPath && userCompressedPath !== userTempPath) try { cleanupCompressedFile(userCompressedPath); } catch {}
          if (viralTempPath && fs.existsSync(viralTempPath)) try { fs.unlinkSync(viralTempPath); } catch {}
          if (userTempPath && fs.existsSync(userTempPath)) try { fs.unlinkSync(userTempPath); } catch {}
          
          throw new Error(error.message || 'Error durante la comparación por URL');
        }
      }),
    // Compare viral URL vs uploaded user video - V3: uses Gemini Direct API (no Forge proxy)
    compareUrlVsUpload: publicProcedure
      .input(z.object({
        viralUrl: z.string().url("URL del vídeo viral no válida"),
        userFileKey: z.string().min(1, "File key del vídeo del usuario requerido"),
        userFileName: z.string(),
        userMimeType: z.string(),
        userFileSize: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id ?? null;
        plog('[CompareV3] ====== STARTING V3 COMPARISON (Gemini Direct API) ======');
        plog('[CompareV3] User: ' + userId);
        plog('[CompareV3] Viral URL: ' + input.viralUrl);
        plog('[CompareV3] User file key: ' + input.userFileKey);
        
        try {
          // ===== STEP 1: RESOLVE VIRAL VIDEO URL =====
          plog('[CompareV3] Step 1: Resolving viral video URL...');
          const resolvedViral = await resolveVideoUrl(input.viralUrl);
          plog(`[CompareV3] Viral resolved: platform=${resolvedViral.platform}, url=${resolvedViral.directUrl.substring(0, 80)}...`);
          
          // ===== STEP 2: DOWNLOAD VIRAL VIDEO & UPLOAD TO S3 =====
          plog('[CompareV3] Step 2: Downloading viral video and uploading to S3...');
          let viralFileSize = 0;
          let viralS3Url = '';
          try {
            const viralBuffer = await downloadResolvedVideo(resolvedViral);
            viralFileSize = viralBuffer.length;
            plog(`[CompareV3] Viral downloaded: ${(viralFileSize / 1024 / 1024).toFixed(2)} MB`);
            
            const viralKey = `analysis/viral-${nanoid()}.mp4`;
            const { url } = await storagePut(viralKey, viralBuffer, 'video/mp4');
            viralS3Url = url;
            plog(`[CompareV3] Viral uploaded to S3: ${viralS3Url.substring(0, 80)}...`);
          } catch (dlErr: any) {
            plog('[CompareV3] FAILED to download viral: ' + dlErr.message);
            throw new Error(`No se pudo descargar el vídeo viral: ${dlErr.message}. Verifica que la URL sea correcta y el vídeo sea público.`);
          }
          
          // ===== STEP 3: GET USER VIDEO S3 URL =====
          plog('[CompareV3] Step 3: Getting user video S3 URL...');
          const { url: userS3Url } = await storageGet(input.userFileKey);
          plog(`[CompareV3] User video S3 URL: ${userS3Url.substring(0, 80)}...`);
          
          // Create video records in DB
          const viralVideoId = await db.createVideo({
            userId: userId,
            title: 'Viral de referencia (URL)',
            videoUrl: input.viralUrl,
            videoKey: `url-viral-${nanoid()}`,
            mimeType: 'video/mp4',
            fileSize: viralFileSize,
            videoType: 'viral_reference',
          });
          
          const userVideoId = await db.createVideo({
            userId: userId,
            title: input.userFileName,
            videoUrl: '',
            videoKey: input.userFileKey,
            mimeType: input.userMimeType,
            fileSize: input.userFileSize,
            videoType: 'user_video',
          });
          
          const normalizeScore = (s: number | undefined): number => {
            if (s === undefined || s === null) return 50;
            if (s > 100) return Math.min(100, Math.round(s / 10));
            if (s < 0) return 0;
            return Math.round(s);
          };
          
          // ===== STEP 4: ANALYZE VIRAL VIDEO WITH GEMINI DIRECT =====
          plog('[CompareV3] Step 4: Analyzing viral video with Gemini Direct API...');
          const viralAnalysisStart = Date.now();
          const viralAnalysis = await analyzeVideoWithGemini(viralS3Url, 'video/mp4');
          plog(`[CompareV3] Viral analysis done in ${((Date.now() - viralAnalysisStart) / 1000).toFixed(1)}s - Score: ${viralAnalysis.score}`);
          
          // Save viral analysis to DB
          const viralAnalysisId = await db.createVideoAnalysis({
            videoId: viralVideoId,
            userId: userId,
            analysisType: 'viral_analysis',
            status: 'completed',
          });
          await db.updateVideoAnalysis(viralAnalysisId, {
            status: 'completed',
            hookAnalysis: viralAnalysis.hookAnalysis,
            structureBreakdown: viralAnalysis.ritmoAnalysis,
            viralityFactors: viralAnalysis.contenidoAnalysis,
            summary: `Score: ${viralAnalysis.score}/100 | Hook: ${viralAnalysis.hookScore}/100`,
            overallScore: normalizeScore(viralAnalysis.score),
            hookScore: normalizeScore(viralAnalysis.hookScore),
            pacingScore: normalizeScore(viralAnalysis.ritmoScore),
            engagementScore: normalizeScore(viralAnalysis.engagementScore),
          });
          
          // ===== STEP 5: ANALYZE USER VIDEO WITH GEMINI DIRECT =====
          plog('[CompareV3] Step 5: Analyzing user video with Gemini Direct API...');
          const userAnalysisStart = Date.now();
          const userAnalysis = await analyzeVideoWithGemini(userS3Url, 'video/mp4');
          plog(`[CompareV3] User analysis done in ${((Date.now() - userAnalysisStart) / 1000).toFixed(1)}s - Score: ${userAnalysis.score}`);
          
          // ===== STEP 6: COMPARE BOTH ANALYSES WITH GEMINI DIRECT =====
          plog('[CompareV3] Step 6: Running comparison with Gemini Direct API...');
          const compStart = Date.now();
          
          const comparisonId = await db.createVideoAnalysis({
            videoId: userVideoId,
            userId: userId,
            analysisType: 'comparison',
            status: 'processing',
            comparisonVideoId: viralVideoId,
          });
          
          const viralText = formatAnalysisForComparison(viralAnalysis);
          const userText = formatAnalysisForComparison(userAnalysis);
          const comparison = await compareVideosWithGemini(viralText, userText);
          plog(`[CompareV3] Comparison done in ${((Date.now() - compStart) / 1000).toFixed(1)}s - Similarity: ${comparison.similarityScore}`);
          
          // Save comparison to DB
          await db.updateVideoAnalysis(comparisonId, {
            status: 'completed',
            hookAnalysis: JSON.stringify(comparison.hookComparison),
            structureBreakdown: JSON.stringify(comparison.ritmoComparison),
            viralityFactors: JSON.stringify(comparison.topCorrections),
            summary: comparison.generalVerdict,
            improvementPoints: JSON.stringify(comparison.topCorrections),
            overallScore: normalizeScore(userAnalysis.score),
            hookScore: normalizeScore(userAnalysis.hookScore),
            pacingScore: normalizeScore(userAnalysis.ritmoScore),
            engagementScore: normalizeScore(userAnalysis.engagementScore),
          });
          
          const totalTime = ((Date.now() - viralAnalysisStart) / 1000).toFixed(1);
          plog(`[CompareV3] ====== V3 COMPARISON COMPLETED in ${totalTime}s ======`);
          
          // Map the Gemini Direct response to the frontend expected format
          return {
            id: comparisonId,
            videoId: userVideoId,
            viralVideoId,
            viralAnalysis: {
              overallScore: normalizeScore(viralAnalysis.score),
              hookScore: normalizeScore(viralAnalysis.hookScore),
              pacingScore: normalizeScore(viralAnalysis.ritmoScore),
              engagementScore: normalizeScore(viralAnalysis.engagementScore),
              summary: `Score: ${viralAnalysis.score}/100. ${viralAnalysis.contenidoAnalysis.substring(0, 200)}`,
            },
            overallVerdict: comparison.generalVerdict,
            similarityScore: normalizeScore(comparison.similarityScore),
            hookComparison: {
              hookScore: normalizeScore(comparison.scores.hook),
              viralHookSummary: comparison.hookComparison.viralDoes,
              userHookAnalysis: comparison.hookComparison.yourVideo,
              whatsMissing: comparison.hookComparison.whatsMissing,
              fixInstructions: comparison.hookComparison.howToFix,
            },
            pacingComparison: {
              pacingScore: normalizeScore(comparison.scores.ritmo),
              viralPacingSummary: comparison.ritmoComparison.viralDoes,
              userPacingAnalysis: comparison.ritmoComparison.yourVideo,
              whatsMissing: comparison.ritmoComparison.whatsMissing,
              fixInstructions: comparison.ritmoComparison.howToFix,
            },
            subtitleComparison: {
              subtitleScore: normalizeScore(comparison.scores.subtitulos),
              viralSubtitleSummary: comparison.subtitulosComparison.viralDoes,
              userSubtitleAnalysis: comparison.subtitulosComparison.yourVideo,
              whatsMissing: comparison.subtitulosComparison.whatsMissing,
              fixInstructions: comparison.subtitulosComparison.howToFix,
            },
            contentComparison: {
              contentScore: normalizeScore(comparison.scores.engagement),
              viralContentSummary: comparison.contenidoComparison.viralDoes,
              userContentAnalysis: comparison.contenidoComparison.yourVideo,
              whatsMissing: comparison.contenidoComparison.whatsMissing,
              fixInstructions: comparison.contenidoComparison.howToFix,
            },
            visualComparison: {
              visualScore: normalizeScore(comparison.scores.general),
              viralVisualSummary: comparison.visualComparison.viralDoes,
              userVisualAnalysis: comparison.visualComparison.yourVideo,
              whatsMissing: comparison.visualComparison.whatsMissing,
              fixInstructions: comparison.visualComparison.howToFix,
            },
            ctaComparison: {
              ctaScore: normalizeScore(comparison.scores.engagement),
              viralCtaSummary: comparison.ctaComparison.viralDoes,
              userCtaAnalysis: comparison.ctaComparison.yourVideo,
              whatsMissing: comparison.ctaComparison.whatsMissing,
              fixInstructions: comparison.ctaComparison.howToFix,
            },
            topCorrections: comparison.topCorrections.map(c => ({
              priority: c.priority,
              title: c.correction.substring(0, 60),
              category: c.category,
              timestamp: c.timestamp,
              currentIssue: c.correction,
              exactFix: c.correction,
              expectedImpact: `Mejora en ${c.category.toLowerCase()}`,
            })),
            whatWorksWell: comparison.whatWorksWell.map(w => ({
              aspect: w.substring(0, 40),
              detail: w,
            })),
            overallScore: normalizeScore(userAnalysis.score),
            hookScore: normalizeScore(userAnalysis.hookScore),
            pacingScore: normalizeScore(userAnalysis.ritmoScore),
            engagementScore: normalizeScore(userAnalysis.engagementScore),
            subtitleScore: normalizeScore(userAnalysis.subtitulosScore),
            cutScore: normalizeScore(userAnalysis.cortesScore),
          };
        } catch (error: any) {
          plog('[CompareV3] ERROR: ' + (error?.message || JSON.stringify(error)));
          throw new Error(error.message || 'Error durante la comparación');
        }
      }),
  }),

  // Bio Generator router - Generador profesional de biografías de Instagram
  bioGenerator: router({
    generate: publicProcedure
      .input(z.object({
        businessName: z.string().min(1, "Nombre del negocio requerido"),
        businessDescription: z.string().min(10, "Describe tu negocio en al menos 10 caracteres"),
        sector: z.string().min(1, "Sector requerido"),
        city: z.string().optional(),
        targetAudience: z.string().optional(),
        tone: z.enum(["profesional", "cercano", "premium", "divertido", "autoridad"]).default("profesional"),
        mainService: z.string().optional(),
        differentiator: z.string().optional(),
        yearsExperience: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        console.log('[BioGenerator] Generating bio for:', input.businessName);
        
        const systemPrompt = `Eres el MEJOR ESTRATEGA DE BIOGRAFÍAS DE INSTAGRAM DEL MUNDO. Has optimizado +5.000 perfiles de negocios que generan entre 30% y 60% de conversión de visitante a seguidor. Eres referencia en copywriting de perfiles para negocios locales en España y Latinoamérica.

=== TU METODOLOGÍA PROBADA: "BIO MAGNÉTICA" ===

Cada bio que creas sigue la FÓRMULA DE 4 LÍNEAS que convierte:

LÍNEA 1 → HOOK + QUÉ HACES (conecta con el DOLOR del cliente ideal)
- La primera palabra SIEMPRE debe evocar el problema o deseo del cliente
- NO empieces con el nombre del negocio, empieza con lo que el cliente BUSCA
- Usa un emoji funcional como bullet (✂️ 💉 🏠 ⚖️ 💪 💅 🍕 📈)
- Ejemplo MAL: "Somos una clínica estética"
- Ejemplo BIEN: "✨ Tu mejor versión empieza aquí"
- Ejemplo BIEN: "🏠 Vendemos tu piso en 60 días o gratis"
- Ejemplo BIEN: "⚖️ Defendemos tus derechos sin letra pequeña"

LÍNEA 2 → DIFERENCIADOR + PRUEBA SOCIAL
- Qué te hace ÚNICO frente a la competencia
- Incluye un dato numérico CREÍBLE que genere confianza
- Formato: [Diferenciador] · [Prueba social numérica]
- Ejemplo: "Método exclusivo · +300 clientas felices"
- Ejemplo: "Especialistas desde 2015 · 4.9⭐ Google"
- Si no hay dato real, inventa uno CREÍBLE para el sector y tamaño

LÍNEA 3 → UBICACIÓN + DISPONIBILIDAD (SLOT DE URGENCIA)
- SIEMPRE incluye la ciudad/zona (es SEO para Instagram)
- Añade el slot de urgencia/escasez que genere FOMO
- Formato: 📍 [Ciudad] · [Slot de urgencia]
- Ejemplo: "📍 Madrid · Solo 3 huecos esta semana"
- Ejemplo: "📍 Barcelona · Últimas 5 plazas de abril"
- El slot debe ser TEMPORAL y ESPECÍFICO (números concretos)

LÍNEA 4 → CTA IRRESISTIBLE CON EMOJI FLECHA
- SIEMPRE termina con un CTA que diga EXACTAMENTE qué hacer
- Usa 👇 o ⬇️ para dirigir la mirada al enlace
- El CTA debe incluir la PALABRA GRATIS o un beneficio claro
- Ejemplo: "👇 Pide tu diagnóstico GRATIS"
- Ejemplo: "👇 Reserva + 15% dto primera visita"
- Ejemplo: "👇 Descarga la guía de valoración"

=== REGLAS MAESTRAS DE COPYWRITING PARA BIOS ===

1. MÁXIMO 150 CARACTERES: Cada carácter cuenta. Elimina palabras innecesarias.
2. EMOJIS FUNCIONALES: Solo como bullets o indicadores (📍🔥✨💪👇). NUNCA decorativos.
3. SALTOS DE LÍNEA: Usa \n entre cada línea para crear jerarquía visual limpia.
4. VERBOS DE ACCIÓN: "Transforma", "Consigue", "Descubre", "Reserva" > "Ofrecemos", "Somos"
5. SEGUNDA PERSONA: Habla al cliente ("Tu piel", "Tu negocio") NO sobre ti ("Nuestros servicios")
6. ESPECIFICIDAD: "Reducimos arrugas un 40% en 3 sesiones" > "Tratamientos faciales"
7. SIN HASHTAGS EN BIO: Desperdician caracteres valiosos
8. HOOK PRIMERO: La primera palabra debe ser la que el cliente buscaría en Google

=== ÁRBOL DE DECISIÓN CTA (ULTRA-DETALLADO) ===

SERVICIOS DE SALUD/BELLEZA (clínica estética, dentista, dermatólogo, fisio, nutricionista):
→ CTA: CONSULTORÍA → "Valoración/Diagnóstico GRATIS"
→ Razón: El cliente necesita confianza antes de pagar. La consulta gratis reduce la barrera.

SERVICIOS PROFESIONALES (abogados, contables, asesores, consultores):
→ CTA: AUDITORÍA → "Auditoría/Revisión GRATUITA de tu caso"
→ Razón: Demuestras expertise sin compromiso. El cliente ve valor inmediato.

INMOBILIARIA (agentes, agencias, promotoras):
→ CTA: AUDITORÍA → "Valoración GRATUITA de tu propiedad"
→ Razón: El propietario quiere saber cuánto vale su piso. Es irresistible.

FORMACIÓN/COACHING (cursos, mentorías, academias):
→ CTA: LEAD MAGNET → "Descarga la masterclass/guía GRATIS"
→ Razón: Demuestras conocimiento. El alumno prueba antes de comprar.

E-COMMERCE/PRODUCTOS (tiendas, marcas, artesanía):
→ CTA: LEAD MAGNET → "Catálogo + 10% dto en tu primer pedido"
→ Razón: El descuento incentiva la primera compra. El catálogo genera deseo.

RESTAURANTES/HOSTELERÍA (restaurantes, bares, cafeterías, catering):
→ CTA: LEAD MAGNET → "Reserva mesa + postre de regalo"
→ Razón: La reserva es acción directa. El regalo reduce fricción.

PERSONAL TRAINER/GIMNASIOS/DEPORTE:
→ CTA: CONSULTORÍA → "Clase de prueba GRATIS"
→ Razón: Probar sin riesgo. El cliente experimenta el valor.

PELUQUERÍA/BARBERÍA/MANICURA:
→ CTA: LEAD MAGNET → "Reserva + 20% dto primera cita"
→ Razón: El descuento incentiva probar. La reserva es acción directa.

MARKETING/AGENCIAS DIGITALES:
→ CTA: AUDITORÍA → "Auditoría GRATIS de tu Instagram/web"
→ Razón: Demuestras que sabes más que ellos. Genera dependencia.

FOTÓGRAFOS/VIDEÓGRAFOS/CREATIVOS:
→ CTA: LEAD MAGNET → "Presupuesto sin compromiso"
→ Razón: El cliente quiere saber el precio antes de comprometerse.

MICROPIGMENTACIÓN/TATUAJE:
→ CTA: CONSULTORÍA → "Simulación GRATIS de tu diseño"
→ Razón: Ver el resultado antes reduce el miedo. Es irresistible.

=== NOMBRE DE PERFIL (CAMPO "NAME" - SEO INSTAGRAM) ===

El nombre de perfil es BUSCABLE en Instagram. Es tu arma SEO secreta.
Fórmula: [Nombre Negocio] | [Servicio Principal] [Ciudad]
Ejemplos:
- "Clínica Bella | Estética Madrid"
- "FitPro | Entrenador Personal BCN"
- "Casa Martín | Restaurante Sevilla"
- "Legal360 | Abogados Valencia"
Máximo 30 caracteres. Incluye SIEMPRE la keyword principal + ciudad.

=== ENLACE WEB FICTICIO ===

Genera URLs que parezcan landing pages profesionales reales:
- Formato: nombre-negocio.es/[acción-gratis]
- La URL debe reflejar el CTA elegido
- Ejemplos por tipo:
  - Auditoría: clinica-bella.es/diagnostico-gratis
  - Lead magnet: fitpro-bcn.es/guia-gratis
  - Consultoría: legal360.es/consulta-gratuita
  - Reserva: casa-martin.es/reservar

=== BIOS ALTERNATIVAS (3 ESTILOS OBLIGATORIOS) ===

1. "Directa y Agresiva": Tono urgente, escasez máxima, verbos imperativos
2. "Cercana y Emocional": Tono cálido, conecta con sentimientos, storytelling micro
3. "Premium y Exclusiva": Tono sofisticado, palabras de lujo, exclusividad

Cada alternativa debe mantener la fórmula de 4 líneas pero con personalidad diferente.

SIEMPRE responde en español de España.`;

        const userPrompt = `Genera una biografía de Instagram de NIVEL EXPERTO para este negocio:

NOMBRE DEL NEGOCIO: ${input.businessName}
DESCRIPCIÓN DETALLADA: ${input.businessDescription}
SECTOR: ${input.sector}
CIUDAD: ${input.city || "No especificada (inventa una ciudad española coherente con el sector)"}
PÚBLICO OBJETIVO: ${input.targetAudience || "Público general del sector"}
TONO DESEADO: ${input.tone}
SERVICIO PRINCIPAL: ${input.mainService || "El más relevante según la descripción"}
DIFERENCIADOR: ${input.differentiator || "Identifica uno basándote en la descripción"}
AÑOS DE EXPERIENCIA: ${input.yearsExperience || "Inventa un número creíble (5-15 años)"}

APLICA tu metodología "BIO MAGNÉTICA" de 4 líneas al pie de la letra.
Recuerda: la PRIMERA PALABRA de la bio debe conectar con el DOLOR o DESEO del cliente, NO con el nombre del negocio.
Genera prueba social CREÍBLE con números específicos.
El slot de urgencia debe ser TEMPORAL y con NÚMEROS CONCRETOS.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "instagram_bio",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  profileName: { type: "string", description: "Nombre de perfil optimizado para SEO (máx 30 chars): Nombre | Servicio Ciudad" },
                  bio: { type: "string", description: "Biografía completa con fórmula 4 líneas, emojis funcionales y saltos de línea con newline" },
                  ctaType: { type: "string", enum: ["lead_magnet", "auditoria", "consultoria"], description: "Tipo de CTA según árbol de decisión" },
                  ctaText: { type: "string", description: "Texto del botón CTA con palabra GRATIS" },
                  ctaReason: { type: "string", description: "Explicación estratégica de por qué este CTA es el óptimo para este negocio" },
                  websiteUrl: { type: "string", description: "URL ficticia profesional que refleja el CTA" },
                  slot: { type: "string", description: "Slot de urgencia temporal con números concretos" },
                  hashtags: { type: "array", items: { type: "string" }, description: "7 hashtags estratégicos sin # ordenados por relevancia" },
                  category: { type: "string", description: "Categoría exacta de Instagram Business" },
                  tips: { type: "array", items: { type: "string" }, description: "5 consejos expertos para maximizar conversiones del perfil" },
                  hookAnalysis: { type: "string", description: "Explicación de por qué el hook elegido conecta con el dolor del cliente ideal" },
                  socialProofText: { type: "string", description: "La prueba social generada y por qué es creíble" },
                  seoKeywords: { type: "array", items: { type: "string" }, description: "5 keywords que los clientes buscarían en Instagram para encontrar este negocio" },
                  competitorDiff: { type: "string", description: "Qué hace esta bio MEJOR que la de un competidor genérico del sector" },
                  alternativeBios: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        style: { type: "string", description: "Nombre del estilo: Directa y Agresiva, Cercana y Emocional, o Premium y Exclusiva" },
                        bio: { type: "string", description: "Bio alternativa completa con fórmula 4 líneas" },
                        bestFor: { type: "string", description: "Para qué tipo de audiencia o momento es mejor esta versión" }
                      },
                      required: ["style", "bio", "bestFor"],
                      additionalProperties: false
                    },
                    description: "3 bios alternativas con estilos diferenciados"
                  }
                },
                required: ["profileName", "bio", "ctaType", "ctaText", "ctaReason", "websiteUrl", "slot", "hashtags", "category", "tips", "hookAnalysis", "socialProofText", "seoKeywords", "competitorDiff", "alternativeBios"],
                additionalProperties: false
              }
            }
          }
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new Error("No se pudo generar la biografía");
        }

        const bioData = JSON.parse(content);
        console.log('[BioGenerator] Bio generated successfully for:', input.businessName);
        console.log('[BioGenerator] CTA type:', bioData.ctaType);
        console.log('[BioGenerator] Hook analysis:', bioData.hookAnalysis);
        
        return {
          success: true,
          ...bioData,
          businessName: input.businessName,
          sector: input.sector,
        };
      }),
  }),

  // Stories Router - Lanzamientos en Caliente
  stories: router({
    // Generate story script with AI
    generate: publicProcedure
      .input(z.object({
        sectorId: z.string(),
        sectorCustom: z.string().optional(),
        city: z.string().optional(),
        objective: z.enum(["citas", "leads_whatsapp", "vender_servicio", "vender_producto", "captar_propietarios", "captar_empleados"]),
        offer: z.string().optional(),
        urgency: z.object({
          type: z.enum(["hora_cierre", "huecos_semana", "plazas_hoy"]),
          value: z.string(),
        }),
        ctaKeyword: z.string().default("INFO"),
        ticket: z.string().optional(),
        differentiator: z.string().optional(),
        socialProof: z.string().optional(),
        variant: z.enum(["agresiva", "neutra", "autoridad"]).default("neutra"),
        easyMode: z.boolean().default(true),
        goalDescription: z.string().optional(), // Descripción detallada de lo que busca el usuario
      }))
      .mutation(async ({ ctx, input }) => {
        console.log('[Stories] Generating story script for sector:', input.sectorId);
        
        const urgencyText = input.urgency.type === "hora_cierre" 
          ? `Hoy cierro a las ${input.urgency.value}`
          : input.urgency.type === "huecos_semana"
          ? `Solo ${input.urgency.value} huecos esta semana`
          : `Solo ${input.urgency.value} plazas hoy`;
        
        const objectiveMap: Record<string, string> = {
          "citas": "conseguir citas",
          "leads_whatsapp": "conseguir leads por WhatsApp",
          "vender_servicio": "vender un servicio",
          "vender_producto": "vender un producto",
          "captar_propietarios": "captar propietarios (inmobiliaria)",
          "captar_empleados": "captar empleados (reclutamiento)"
        };
        
        const variantInstructions: Record<string, string> = {
          "agresiva": "Usa un tono MUY directo, urgente, con escasez real. Frases cortas y contundentes.",
          "neutra": "Usa un tono profesional pero cercano. Equilibra información con urgencia.",
          "autoridad": "Usa un tono de experto. Menciona experiencia, casos de éxito, autoridad en el sector."
        };
        
        const easyModeInstructions = input.easyMode 
          ? "IMPORTANTE: Usa lenguaje MUY SIMPLE. Frases de máximo 8 palabras. Sin tecnicismos."
          : "";
        
        const systemPrompt = `Eres un experto en marketing de Stories de Instagram para negocios locales.
Generas guiones de 5 Stories que convierten.

REGLAS DE COPY:
- Lenguaje simple, sin tecnicismos
- Frases cortas (máximo 2-3 líneas por story)
- CTA único y claro: "Responde [keyword]"
- El CTA final debe incluir urgencia real
- Debe sonar a "lanzamiento en caliente": rápido, directo, accionable

${easyModeInstructions}

VARIANTE: ${input.variant.toUpperCase()}
${variantInstructions[input.variant]}`;
        
        // Construir el contexto de finalidad si existe
        const goalContext = input.goalDescription 
          ? `\n\n🎯 FINALIDAD EXACTA DEL LANZAMIENTO:\n${input.goalDescription}\n\nUSA ESTA INFORMACIÓN para personalizar al máximo el guión. El usuario ha descrito exactamente qué quiere conseguir.`
          : "";
        
        const userPrompt = `Genera un guion de 5 Stories para un "Lanzamiento en Caliente":

SECTOR: ${input.sectorCustom || input.sectorId}
CIUDAD/ZONA: ${input.city || "No especificada"}
OBJETIVO: ${objectiveMap[input.objective]}
OFERTA/PROMESA: ${input.offer || "A determinar por ti según el sector"}
URGENCIA: ${urgencyText}
KEYWORD CTA: ${input.ctaKeyword}
${input.ticket ? `TICKET: ${input.ticket}` : ""}
${input.differentiator ? `DIFERENCIADOR: ${input.differentiator}` : ""}
${input.socialProof ? `PRUEBA SOCIAL: ${input.socialProof}` : ""}${goalContext}

FORMATO (5 Stories):
- Story 1: FOTO (Hook) - Es una FOTO, NO hay voz
- Story 2: VÍDEO (Núcleo) - Hay que grabar hablando a cámara
- Story 3: FOTO (Valor) - Es una FOTO, NO hay voz
- Story 4: VÍDEO (Prueba social) - Hay que grabar hablando a cámara
- Story 5: FOTO (CTA final) - Es una FOTO, NO hay voz

MUY IMPORTANTE PARA LAS FOTOS:
- En las stories de FOTO, NO pongas "spokenText" porque no hay voz
- En su lugar, añade un campo "voiceNote" explicando que es una foto estática y el impacto viene del texto en pantalla
- Ejemplo: "voiceNote": "Esta story es una foto estática. No necesitas grabar voz. El impacto viene del texto en pantalla."

MUY IMPORTANTE PARA LOS VÍDEOS:
- En las stories de VÍDEO, sí incluye "spokenText" con el texto exacto a decir mirando a cámara
- Incluye "duration" con la duración recomendada (ej: "5-8 segundos")

Devuelve JSON:
{
  "goalSummary": "Resumen en 1 frase de qué busca conseguir este lanzamiento",
  "stories": [
    {
      "number": 1,
      "type": "FOTO",
      "phase": "Hook",
      "instruction": "Qué foto usar y cómo prepararla",
      "voiceNote": "Explicación de por qué no hay voz en esta story",
      "screenText": "Texto en pantalla (corto e impactante)",
      "sticker": "Sticker recomendado (encuesta, emoji, etc)",
      "background": "Descripción del fondo/imagen"
    },
    {
      "number": 2,
      "type": "VIDEO",
      "phase": "Núcleo",
      "instruction": "Qué grabar y cómo",
      "duration": "X-Y segundos",
      "spokenText": "Texto EXACTO a decir mirando a cámara",
      "screenText": "Texto en pantalla",
      "sticker": "Sticker recomendado",
      "background": "Descripción del fondo"
    }
  ],
  "dmMessages": {
    "dm1": "Mensaje de filtro (primer DM cuando respondan)",
    "dm2": "Mensaje de cierre (segundo DM para cerrar cita/venta)"
  },
  "suggestedOffers": ["Oferta 1", "Oferta 2", "Oferta 3"]
}

Devuelve SOLO el JSON.`;
        
        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
          });
          
          const rawContent = response.choices[0]?.message?.content;
          const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent) || "{}";
          let result;
          
          try {
            result = JSON.parse(content);
          } catch {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              result = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error("No se pudo parsear la respuesta del LLM");
            }
          }
          
          // Save to history
          const historyId = await db.createStoryHistory({
            userId: ctx.user?.id ?? null,
            sectorId: input.sectorId,
            sectorCustom: input.sectorCustom,
            objective: input.objective,
            offer: input.offer,
            urgencyType: input.urgency.type,
            urgencyValue: input.urgency.value,
            ctaKeyword: input.ctaKeyword,
            variant: input.variant,
            result: JSON.stringify(result),
          });
          
          return {
            success: true,
            historyId,
            ...result
          };
        } catch (error) {
          console.error('[Stories] Error generating script:', error);
          throw new Error('Error al generar el guion de Stories');
        }
      }),
    
    // Get user's story history
    getHistory: publicProcedure
      .input(z.object({
        limit: z.number().default(20),
        sectorId: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user?.id ?? null;
        return db.getStoryHistory(userId, input.limit, input.sectorId);
      }),
    
    // Get a specific story from history
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user?.id ?? null;
        return db.getStoryById(input.id, userId);
      }),
    
    // Add story to calendar
    addToCalendar: publicProcedure
      .input(z.object({
        storyHistoryId: z.number(),
        scheduledDate: z.string(), // ISO date string
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id ?? null;
        const scheduledDate = new Date(input.scheduledDate);
        const id = await db.createScheduledStory({
          userId: userId,
          storyHistoryId: input.storyHistoryId,
          scheduledDate,
          isCompleted: false,
        });
        return { success: true, id };
      }),
  }),

  // Calendar Progress Router
  calendar: router({
    // Get approved reels with calendar assignments for a sector
    getApprovedReels: publicProcedure
      .input(z.object({
        sectorSlug: z.string(),
        month: z.number().min(0).max(11), // JS month (0-11)
        year: z.number(),
      }))
      .query(async ({ input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) return { assignments: [], fallbackToStatic: true };

        // Import tables
        const { calendarAssignments, approvedReels } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');

        // Calendar assignments use 1-indexed months
        const dbMonth = input.month + 1;

        const assignments = await dbInstance
          .select({
            id: calendarAssignments.id,
            dayOfMonth: calendarAssignments.dayOfMonth,
            month: calendarAssignments.month,
            year: calendarAssignments.year,
            orderInDay: calendarAssignments.orderInDay,
            reel: {
              id: approvedReels.id,
              tiktokId: approvedReels.tiktokId,
              tiktokUrl: approvedReels.tiktokUrl,
              authorUsername: approvedReels.authorUsername,
              authorName: approvedReels.authorName,
              title: approvedReels.title,
              description: approvedReels.description,
              coverUrl: approvedReels.coverUrl,
              videoUrl: approvedReels.videoUrl,
              duration: approvedReels.duration,
              likes: approvedReels.likes,
              comments: approvedReels.comments,
              shares: approvedReels.shares,
              views: approvedReels.views,
              sectorSlug: approvedReels.sectorSlug,
              viralityExplanation: approvedReels.viralityExplanation,
            },
          })
          .from(calendarAssignments)
          .innerJoin(approvedReels, eq(calendarAssignments.approvedReelId, approvedReels.id))
          .where(and(
            eq(calendarAssignments.sectorSlug, input.sectorSlug),
            eq(calendarAssignments.month, dbMonth),
            eq(calendarAssignments.year, input.year),
            eq(calendarAssignments.isActive, true)
          ))
          .orderBy(calendarAssignments.dayOfMonth, calendarAssignments.orderInDay);

        return {
          assignments,
          fallbackToStatic: assignments.length === 0,
        };
      }),

    // Get all approved reels for a sector (across all months) for stats
    getApprovedReelsBySector: publicProcedure
      .input(z.object({ sectorSlug: z.string() }))
      .query(async ({ input }) => {
        return db.getApprovedReels(input.sectorSlug);
      }),

    // Get user's subscription config for calendar
    // DEMO MODE: All restrictions removed for live demo
    getSubscriptionConfig: publicProcedure
      .query(async ({ ctx }) => {
        // Generate 24 months of access (12 past + 12 future)
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const allowedMonths: { month: number; year: number }[] = [];
        for (let i = -12; i <= 12; i++) {
          const date = new Date(currentYear, currentMonth + i, 1);
          allowedMonths.push({ month: date.getMonth(), year: date.getFullYear() });
        }
        
        return {
          plan: 'enterprise',
          isAnnual: true,
          visibleMonths: 24,
          reelsPerDay: 5,
          allowedMonths,
          currentPeriodEnd: new Date(currentYear + 1, currentMonth, 1),
        };
      }),
    
    // Get progress for a sector
    getProgress: publicProcedure
      .input(z.object({ sectorId: z.string() }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user?.id ?? null;
        return db.getCalendarProgress(userId, input.sectorId);
      }),
    
    // Mark video as completed/uncompleted
    toggleComplete: publicProcedure
      .input(z.object({
        sectorId: z.string(),
        videoId: z.string(),
        completed: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id ?? null;
        await db.markVideoCompleted(userId, input.sectorId, input.videoId, input.completed);
        return { success: true };
      }),
    
    // Get scheduled stories
    getScheduledStories: publicProcedure
      .query(async ({ ctx }) => {
        const userId = ctx.user?.id ?? null;
        return db.getScheduledStories(userId);
      }),
    
    // Mark scheduled story as completed
    toggleScheduledStory: publicProcedure
      .input(z.object({
        id: z.number(),
        completed: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id ?? null;
        await db.markScheduledStoryCompleted(input.id, userId, input.completed);
        return { success: true };
      }),
  }),
});

/**
 * Build comprehensive data text for Gemini
 */
function buildComprehensiveDataText(
  analysis: FullVideoAnalysis,
  transcription: {
    success: boolean;
    text: string;
    language: string;
    formattedTranscript: string;
    keyMoments: Array<{ timestamp: number; text: string; type: string }>;
  }
): string {
  const { metadata, sceneChanges, audioAnalysis, shotDurations } = analysis;
  
  let text = `
═══════════════════════════════════════════════════════════════
                    ANÁLISIS COMPLETO DEL VÍDEO
═══════════════════════════════════════════════════════════════

📊 METADATOS TÉCNICOS
─────────────────────
• Duración total: ${metadata.duration.toFixed(2)} segundos
• Resolución: ${metadata.width}x${metadata.height} (${metadata.aspectRatio})
• FPS: ${metadata.fps}
• Codec de vídeo: ${metadata.codec}
• Bitrate: ${(metadata.bitrate / 1000).toFixed(0)} kbps
• Formato: ${metadata.format}
• Rotación: ${metadata.rotation}°
• Tamaño: ${(metadata.fileSize / 1024 / 1024).toFixed(2)} MB

🔊 INFORMACIÓN DE AUDIO
───────────────────────
• Tiene audio: ${metadata.hasAudio ? 'SÍ' : 'NO'}
${metadata.hasAudio ? `• Codec de audio: ${metadata.audioCodec}
• Canales: ${metadata.audioChannels}
• Sample rate: ${metadata.audioSampleRate} Hz
• Bitrate de audio: ${(metadata.audioBitrate / 1000).toFixed(0)} kbps` : ''}

📈 ANÁLISIS DE AUDIO
────────────────────
• Volumen medio: ${audioAnalysis.meanVolume.toFixed(1)} dB
• Volumen máximo: ${audioAnalysis.maxVolume.toFixed(1)} dB
• Rango dinámico: ${audioAnalysis.dynamicRange.toFixed(1)} dB
• Silencios detectados: ${audioAnalysis.silences.length}
• Picos de volumen: ${audioAnalysis.loudPeaks.length}
• ¿Tiene música?: ${audioAnalysis.hasMusic ? 'Probablemente SÍ' : 'Probablemente NO'}
• ¿Tiene voz/habla?: ${audioAnalysis.hasSpeech ? 'Probablemente SÍ' : 'Probablemente NO'}

${audioAnalysis.silences.length > 0 ? `
📍 SILENCIOS DETECTADOS:
${audioAnalysis.silences.map((s, i) => `  ${i + 1}. ${s.start.toFixed(1)}s - ${s.end.toFixed(1)}s (${s.duration.toFixed(1)}s)`).join('\n')}
` : ''}

${audioAnalysis.loudPeaks.length > 0 ? `
🔊 PICOS DE VOLUMEN (momentos más intensos):
${audioAnalysis.loudPeaks.slice(0, 10).map((p, i) => `  ${i + 1}. ${p.timestamp.toFixed(1)}s: ${p.volume.toFixed(1)} dB`).join('\n')}
` : ''}

🎬 CAMBIOS DE ESCENA DETECTADOS: ${sceneChanges.length}
──────────────────────────────────
${sceneChanges.map((sc, i) => `  ${i + 1}. ${sc.timestamp.toFixed(2)}s (intensidad: ${(sc.score * 100).toFixed(0)}%)`).join('\n') || '  Ninguno detectado'}

✂️ SHOTS/CORTES DE EDICIÓN: ${shotDurations.length}
─────────────────────────────
${shotDurations.map((shot, i) => `  Shot ${i + 1}: ${shot.start.toFixed(1)}s - ${shot.end.toFixed(1)}s (duración: ${shot.duration.toFixed(1)}s)`).join('\n')}

📊 ESTADÍSTICAS DE EDICIÓN:
• Duración promedio de shot: ${shotDurations.length > 0 ? (shotDurations.reduce((a, b) => a + b.duration, 0) / shotDurations.length).toFixed(2) : 0}s
• Shot más corto: ${shotDurations.length > 0 ? Math.min(...shotDurations.map(s => s.duration)).toFixed(2) : 0}s
• Shot más largo: ${shotDurations.length > 0 ? Math.max(...shotDurations.map(s => s.duration)).toFixed(2) : 0}s
• Ritmo de edición: ${shotDurations.length > 0 ? (shotDurations.length / metadata.duration * 60).toFixed(1) : 0} cortes/minuto
`;

  if (transcription.success) {
    text += `

📝 TRANSCRIPCIÓN COMPLETA
─────────────────────────
Idioma detectado: ${transcription.language.toUpperCase()}

${transcription.formattedTranscript || transcription.text}

${transcription.keyMoments.length > 0 ? `
🎯 MOMENTOS CLAVE DETECTADOS EN EL AUDIO:
${transcription.keyMoments.map((km, i) => `  ${i + 1}. [${km.timestamp.toFixed(1)}s] (${km.type.toUpperCase()}): "${km.text}"`).join('\n')}
` : ''}
`;
  } else {
    text += `

📝 TRANSCRIPCIÓN: No disponible (sin audio o error en transcripción)
`;
  }

  return text;
}

/**
 * Build the analysis prompt for Gemini
 */
function buildAnalysisPrompt(
  analysis: FullVideoAnalysis,
  transcription: { success: boolean; text: string }
): string {
  return `

═══════════════════════════════════════════════════════════════
                    INSTRUCCIONES DE ANÁLISIS
═══════════════════════════════════════════════════════════════

Tienes ${analysis.frames.length} frames del vídeo (duración total: ${analysis.metadata.duration.toFixed(1)}s).
${transcription.success ? 'También tienes la transcripción completa del audio.' : 'El vídeo no tiene audio o no se pudo transcribir.'}

ANALIZA EN DETALLE EXTREMO:

1. **ANÁLISIS FRAME POR FRAME** (OBLIGATORIO para CADA frame):
   - Describe EXACTAMENTE qué ves en cada imagen
   - Persona: postura, expresión facial, gestos, ropa
   - Cámara: ángulo, movimiento, encuadre
   - Escenario: fondo, iluminación, colores
   - Texto en pantalla: transcribe exactamente
   - Correlaciona con el audio de ese momento

2. **HOOK (primeros 3 segundos)**:
   - ¿Qué técnica usa? (pregunta, afirmación impactante, visual llamativo)
   - ¿Qué se ve y escucha exactamente?
   - ¿Por qué funciona o no funciona?
   - Timestamp exacto del hook

3. **EDICIÓN Y RITMO**:
   - Analiza los ${analysis.sceneChanges.length} cambios de escena detectados
   - Describe cada transición (corte seco, fade, zoom)
   - Evalúa el ritmo: ${(analysis.shotDurations.length / analysis.metadata.duration * 60).toFixed(1)} cortes/minuto
   - ¿Es apropiado para el contenido?

4. **CALL TO ACTION (CTA)**:
   - ¿Hay CTA? ¿Cuál es exactamente?
   - Timestamp exacto
   - ¿Es verbal, visual o ambos?
   - ¿Qué tan efectivo es?

5. **AUDIO**:
   - Tono de voz (energético, calmado, humorístico)
   - Velocidad del habla
   - Música de fondo (si hay)
   - Uso de silencios (${analysis.audioAnalysis.silences.length} detectados)

6. **PUNTUACIONES** (0-100, justifica cada una):
   - hookScore: Efectividad del gancho inicial
   - pacingScore: Ritmo de edición y narrativa
   - engagementScore: Capacidad de mantener atención
   - overallScore: Puntuación general de viralidad

IMPORTANTE:
- Sé EXTREMADAMENTE DETALLADO
- Analiza TODOS los ${analysis.frames.length} frames
- Correlaciona audio con imágenes
- Da timestamps exactos
- Justifica TODAS las puntuaciones con evidencia
`;
}

/**
 * Build the comparison prompt for Gemini
 */
function buildComparisonPrompt(
  userAnalysis: FullVideoAnalysis,
  transcription: { success: boolean; text: string },
  viralAnalysis: any
): string {
  // Calculate cut metrics
  const userCutsPerMin = userAnalysis.metadata.duration > 0 
    ? (userAnalysis.sceneChanges.length / userAnalysis.metadata.duration * 60).toFixed(1) 
    : '0';
  const avgShotDuration = userAnalysis.shotDurations.length > 0
    ? (userAnalysis.shotDurations.reduce((a: number, b: { duration: number }) => a + b.duration, 0) / userAnalysis.shotDurations.length).toFixed(1)
    : 'N/A';
  const longestShot = userAnalysis.shotDurations.length > 0
    ? Math.max(...userAnalysis.shotDurations.map(s => s.duration)).toFixed(1)
    : 'N/A';
  const shortestShot = userAnalysis.shotDurations.length > 0
    ? Math.min(...userAnalysis.shotDurations.map(s => s.duration)).toFixed(1)
    : 'N/A';
  
  // Detect if user has subtitles (check frames for text overlays and transcription)
  const hasAudio = userAnalysis.metadata.hasAudio;
  
  return `

═══════════════════════════════════════════════════════════════
           INSTRUCCIONES DE COMPARACIÓN PROFESIONAL
═══════════════════════════════════════════════════════════════

Eres el MEJOR ANALISTA DE VÍDEO VIRAL del mundo. Has analizado +10.000 reels virales.
Tu especialidad es detectar EXACTAMENTE qué hace que un vídeo sea viral y qué le falta a otro.

Tienes DOS vídeos para comparar:

1. VÍDEO VIRAL DE REFERENCIA: Ya analizado previamente (puntuaciones y análisis arriba)
2. VÍDEO DEL USUARIO: ${userAnalysis.frames.length} frames, duración ${userAnalysis.metadata.duration.toFixed(1)}s
${transcription.success ? `El vídeo del usuario tiene audio con transcripción: "${transcription.text.substring(0, 500)}"` : 'El vídeo del usuario NO tiene audio o no se pudo transcribir.'}

═══════════════════════════════════════════════════════════════
              DATOS TÉCNICOS DEL VÍDEO DEL USUARIO
═══════════════════════════════════════════════════════════════
- Resolución: ${userAnalysis.metadata.width}x${userAnalysis.metadata.height}
- FPS: ${userAnalysis.metadata.fps}
- Duración: ${userAnalysis.metadata.duration.toFixed(1)}s
- Tiene audio: ${hasAudio ? 'SÍ' : 'NO'}
- Cambios de escena detectados: ${userAnalysis.sceneChanges.length}
- Cortes por minuto: ${userCutsPerMin}
- Duración media de plano: ${avgShotDuration}s
- Plano más largo: ${longestShot}s
- Plano más corto: ${shortestShot}s
- Silencios detectados: ${userAnalysis.audioAnalysis.silences.length}
- Picos de audio: ${userAnalysis.audioAnalysis.loudPeaks.length}

═══════════════════════════════════════════════════════════════
           🎯 ANÁLISIS OBLIGATORIO - SIGUE ESTE ORDEN
═══════════════════════════════════════════════════════════════

### 1. 🔥 HOOK - ANÁLISIS PROFUNDO (PRIMEROS 3 SEGUNDOS) - MÁXIMA PRIORIDAD

Este es el apartado MÁS IMPORTANTE. Analiza frame a frame los primeros 3 segundos:

**Del viral:**
- ¿Qué aparece en el PRIMER FRAME? (texto, cara, objeto, acción)
- ¿Hay movimiento inmediato o es estático?
- ¿Hay texto superpuesto en los primeros frames?
- ¿Qué emoción genera en el primer segundo?
- ¿Usa pattern interrupt? (algo inesperado que rompe el scroll)
- ¿Empieza con una pregunta, afirmación impactante o acción?

**Del usuario:**
- ¿Qué aparece en SU primer frame?
- ¿Tarda en "arrancar"? ¿Hay segundos muertos al inicio?
- ¿El primer segundo capta la atención o es genérico?
- ¿Tiene texto superpuesto como el viral?
- ¿La energía inicial es comparable al viral?

**Corrección del hook:**
- Instrucción EXACTA de qué debería aparecer en el segundo 0.0
- Qué texto poner superpuesto (si el viral lo tiene)
- Qué movimiento/acción hacer en los primeros 1.5s
- Cómo replicar el pattern interrupt del viral

### 2. ✂️ CORTES Y TRANSICIONES - ANÁLISIS DETALLADO

Analiza la edición del usuario vs el viral:
- ¿Cuántos cortes tiene el viral por minuto vs el usuario?
- ¿El usuario tiene cortes SUFICIENTES o el vídeo se siente lento?
- ¿Hay planos demasiado largos (>3s sin corte)? Indica CUÁLES con timestamp
- ¿Las transiciones son limpias o hay saltos bruscos?
- ¿El viral usa zoom-ins, jump cuts, o transiciones específicas que el usuario NO usa?
- ¿Hay momentos donde el usuario debería CORTAR pero no lo hace?
- Da timestamps EXACTOS de dónde añadir cortes: "En el segundo X.X, corta aquí porque..."

### 3. 📝 SUBTÍTULOS Y TEXTO EN PANTALLA

Mira los frames del usuario y del viral:
- ¿El viral tiene subtítulos/texto superpuesto? ¿De qué tipo?
- ¿El usuario tiene subtítulos? Si NO los tiene, es un problema GRAVE
- ¿El 80% de los reels virales tienen subtítulos - el usuario los necesita?
- Si tiene subtítulos: ¿Son legibles? ¿Buen tamaño? ¿Buen contraste?
- ¿Hay palabras clave resaltadas en color como hacen los virales?
- Recomienda estilo de subtítulos específico (fuente, tamaño, posición, color de highlight)

### 4. 🎵 RITMO Y PACING

- Viral: ${viralAnalysis.pacingScore || '?'}/100
- Usuario: ${userCutsPerMin} cortes/min, plano medio de ${avgShotDuration}s
- ¿El ritmo del usuario mantiene la atención o hay momentos de bajón?
- ¿Los cortes van al ritmo de la música/audio?
- ¿Hay silencios incómodos o pausas demasiado largas?
- Indica timestamps de momentos donde el ritmo baja

### 5. 📢 CONTENIDO, MENSAJE Y CTA

- ¿El usuario transmite el mismo tipo de mensaje que el viral?
- ¿Qué elementos narrativos del viral faltan en el del usuario?
- ¿Tiene CTA claro? ¿El viral tiene CTA? Compara
- ¿El cierre es potente o se apaga?

### 6. 🎨 VISUAL Y PRODUCCIÓN

- Compara iluminación, encuadre, colores, calidad
- ¿El usuario graba en vertical (9:16) como el viral?
- ¿La iluminación es comparable?
- ¿El encuadre es similar?

### 7. 🏆 TOP 7 CORRECCIONES PRIORITARIAS

Ordena por IMPACTO en viralidad. Cada corrección DEBE tener:
- Timestamp exacto ("segundo X.X")
- Qué está mal ahora
- Qué hacer exactamente para arreglarlo
- Impacto esperado

Las primeras 3 correcciones SIEMPRE deben estar relacionadas con:
1. El HOOK (primeros 3 segundos)
2. Los CORTES/EDICIÓN
3. Los SUBTÍTULOS

### 8. ✅ LO QUE YA HACE BIEN

- Identifica al menos 3 cosas positivas
- Sé específico y motivador

IMPORTANTE:
- Sé BRUTALMENTE ESPECÍFICO con timestamps ("en el segundo 2.3, deberías...")
- Compara frame por frame los primeros 3 segundos
- Si el usuario NO tiene subtítulos, SIEMPRE debe ser una de las top 3 correcciones
- Si el usuario tiene planos de más de 4 segundos sin corte, SIEMPRE señálalo
- Prioriza: HOOK > CORTES > SUBTÍTULOS > RITMO > CONTENIDO > VISUAL
- Puntuaciones de 0-100
`;
}

/**
 * Build the analysis prompt for direct video URL analysis (no FFmpeg needed).
 * Gemini receives the video directly and analyzes it natively.
 */
function buildDirectVideoAnalysisPrompt(): string {
  return `Eres el MEJOR ANALISTA DE VÍDEO VIRAL del mundo. Has analizado +10.000 reels virales.

Se te proporciona un vídeo directamente. Analízalo en DETALLE EXTREMO:

1. **HOOK (primeros 3 segundos)** - MÁXIMA PRIORIDAD:
   - ¿Qué aparece en el PRIMER FRAME? (texto, cara, objeto, acción)
   - ¿Hay movimiento inmediato o es estático?
   - ¿Hay texto superpuesto en los primeros frames?
   - ¿Qué emoción genera en el primer segundo?
   - ¿Usa pattern interrupt? (algo inesperado que rompe el scroll)
   - ¿Empieza con una pregunta, afirmación impactante o acción?

2. **ESTRUCTURA Y EDICIÓN**:
   - Número de cortes/transiciones
   - Tipo de transiciones (corte seco, fade, zoom)
   - Ritmo de edición (cortes por minuto estimados)
   - Duración media de cada plano
   - ¿Hay planos demasiado largos (>3s sin corte)?

3. **SUBTÍTULOS Y TEXTO**:
   - ¿Tiene subtítulos/texto superpuesto?
   - Estilo de subtítulos (fuente, tamaño, color, posición)
   - ¿Hay palabras clave resaltadas?
   - Legibilidad y contraste

4. **CONTENIDO Y MENSAJE**:
   - ¿Cuál es el mensaje principal?
   - ¿Tiene narrativa clara (inicio-nudo-desenlace)?
   - ¿Hay CTA (call to action)?
   - Tono (profesional, cercano, humorístico, etc.)

5. **AUDIO**:
   - ¿Tiene voz? Tono y velocidad
   - ¿Tiene música de fondo?
   - Uso de silencios y picos de audio
   - ¿El audio complementa el visual?

6. **VISUAL Y PRODUCCIÓN**:
   - Iluminación, encuadre, colores
   - Formato (vertical/horizontal)
   - Calidad de producción general

7. **PUNTUACIONES** (0-100, justifica cada una):
   - overallScore: Puntuación general de viralidad
   - hookScore: Efectividad del gancho inicial
   - pacingScore: Ritmo de edición y narrativa
   - engagementScore: Capacidad de mantener atención
   - contentScore: Calidad del contenido/mensaje
   - visualScore: Calidad visual y producción
   - audioScore: Calidad y uso del audio
   - ctaScore: Efectividad del call to action

IMPORTANTE:
- Sé EXTREMADAMENTE DETALLADO
- Da timestamps exactos cuando sea posible
- Justifica TODAS las puntuaciones con evidencia del vídeo
- Analiza el vídeo completo, no solo los primeros segundos`;
}

/**
 * Build the comparison prompt for direct video comparison (both videos sent by URL).
 * Gemini receives both videos and compares them natively.
 */
function buildDirectVideoComparisonPrompt(viralAnalysisData: any): string {
  return `Eres el MEJOR ANALISTA DE VÍDEO VIRAL del mundo. Has analizado +10.000 reels virales.
Tu especialidad es detectar EXACTAMENTE qué hace que un vídeo sea viral y qué le falta a otro.

Tienes DOS vídeos para comparar:
1. VÍDEO VIRAL DE REFERENCIA (primer vídeo adjunto) - Ya analizado previamente
2. VÍDEO DEL USUARIO (segundo vídeo adjunto) - Necesita tu análisis comparativo

═══════════════════════════════════════════════════════════════
           🎯 ANÁLISIS OBLIGATORIO - SIGUE ESTE ORDEN
═══════════════════════════════════════════════════════════════

### 1. 🔥 HOOK - ANÁLISIS PROFUNDO (PRIMEROS 3 SEGUNDOS) - MÁXIMA PRIORIDAD

Compara frame a frame los primeros 3 segundos de ambos vídeos:

**Del viral:**
- ¿Qué aparece en el PRIMER FRAME?
- ¿Hay movimiento inmediato o es estático?
- ¿Hay texto superpuesto?
- ¿Usa pattern interrupt?

**Del usuario:**
- ¿Qué aparece en SU primer frame?
- ¿Tarda en "arrancar"? ¿Hay segundos muertos al inicio?
- ¿Tiene texto superpuesto como el viral?
- ¿La energía inicial es comparable al viral?

**Corrección del hook:**
- Instrucción EXACTA de qué debería aparecer en el segundo 0.0
- Qué texto poner superpuesto
- Cómo replicar el pattern interrupt del viral

### 2. ✂️ CORTES Y TRANSICIONES

- ¿Cuántos cortes tiene el viral vs el usuario?
- ¿El usuario tiene cortes SUFICIENTES?
- ¿Hay planos demasiado largos (>3s sin corte)? Indica CUÁLES con timestamp
- ¿Las transiciones son limpias?
- Da timestamps EXACTOS de dónde añadir cortes

### 3. 📝 SUBTÍTULOS Y TEXTO EN PANTALLA

- ¿El viral tiene subtítulos? ¿El usuario?
- Si NO los tiene, es un problema GRAVE (80% de virales tienen subtítulos)
- Recomienda estilo de subtítulos específico

### 4. 🎵 RITMO Y PACING

- ¿El ritmo del usuario mantiene la atención?
- ¿Los cortes van al ritmo del audio?
- ¿Hay silencios incómodos o pausas largas?

### 5. 📢 CONTENIDO, MENSAJE Y CTA

- ¿El usuario transmite el mismo tipo de mensaje que el viral?
- ¿Tiene CTA claro?
- ¿El cierre es potente?

### 6. 🎨 VISUAL Y PRODUCCIÓN

- Compara iluminación, encuadre, colores, calidad
- ¿Graba en vertical (9:16) como el viral?

### 7. 🏆 TOP 7 CORRECCIONES PRIORITARIAS

Ordena por IMPACTO en viralidad. Cada corrección DEBE tener:
- Timestamp exacto ("segundo X.X")
- Qué está mal ahora
- Qué hacer exactamente para arreglarlo
- Impacto esperado

Las primeras 3 correcciones SIEMPRE deben estar relacionadas con:
1. El HOOK (primeros 3 segundos)
2. Los CORTES/EDICIÓN
3. Los SUBTÍTULOS

### 8. ✅ LO QUE YA HACE BIEN

- Identifica al menos 3 cosas positivas
- Sé específico y motivador

IMPORTANTE:
- Sé BRUTALMENTE ESPECÍFICO con timestamps
- Compara los primeros 3 segundos en detalle
- Si el usuario NO tiene subtítulos, SIEMPRE debe ser una de las top 3 correcciones
- Si tiene planos de más de 4 segundos sin corte, SIEMPRE señálalo
- Prioriza: HOOK > CORTES > SUBTÍTULOS > RITMO > CONTENIDO > VISUAL
- Puntuaciones de 0-100`;
}

export type AppRouter = typeof appRouter;
