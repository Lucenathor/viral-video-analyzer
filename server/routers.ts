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
          
          // Read the compressed video buffer to upload directly to Azure
          let videoBufferForAzure: Buffer | undefined;
          if (compressedFilePath && fs.existsSync(compressedFilePath)) {
            videoBufferForAzure = fs.readFileSync(compressedFilePath);
            console.log(`[Analysis] Using compressed video buffer for Azure upload: ${(videoBufferForAzure.length / 1024 / 1024).toFixed(2)} MB`);
          }
          
          const { videoId: azureVideoId, indexResult, azureData, thumbnailsBase64 } = 
            await analyzeVideoComplete(
              processedVideoUrl,
              `${input.fileName}-${Date.now()}`,
              (message) => console.log(`[Azure] ${message}`),
              videoBufferForAzure // Pass buffer for direct upload
            );
          
          console.log('[Analysis] Azure completed. Video ID:', azureVideoId);
          console.log('[Analysis] Transcript:', azureData.transcript.substring(0, 200) + '...');
          console.log('[Analysis] Topics:', azureData.topics.join(', '));
          console.log('[Analysis] Thumbnails downloaded:', thumbnailsBase64.length);
          
          // ===== STEP 2: GEMINI ANALYSIS WITH IMAGES =====
          console.log('[Analysis] Step 2: Starting Gemini analysis with images...');
          
          // Build content array with Azure data + images
          const contentParts: any[] = [];
          
          // Add Azure data as text with ALL available information
          const azureDataText = `
DATOS COMPLETOS DE AZURE VIDEO INDEXER:

=== INFORMACIÓN GENERAL ===
- Duración total: ${azureData.duration} segundos
- Idioma detectado: ${azureData.language}
- Resolución: ${azureData.resolution}

=== TRANSCRIPCIÓN COMPLETA CON TIMESTAMPS ===
${azureData.transcriptWithTimestamps || 'Sin transcripción'}

=== TEMAS DETECTADOS ===
${azureData.topics.join(', ') || 'Ninguno'}

=== PALABRAS CLAVE ===
${azureData.keywords.join(', ') || 'Ninguna'}

=== PERSONAS MENCIONADAS ===
${azureData.people.join(', ') || 'Ninguna'}

=== UBICACIONES ===
${azureData.locations.join(', ') || 'Ninguna'}

=== MARCAS DETECTADAS ===
${azureData.brands.join(', ') || 'Ninguna'}

=== OBJETOS DETECTADOS ===
${azureData.objects.join(', ') || 'Ninguno'}

=== ETIQUETAS VISUALES ===
${azureData.labels.join(', ') || 'Ninguna'}

=== SENTIMIENTOS DEL AUDIO ===
${azureData.sentiments.map(s => `${s.type}: ${(s.score * 100).toFixed(0)}%`).join(', ') || 'Neutral'}

=== EMOCIONES DETECTADAS ===
${azureData.emotions.map(e => `${e.type}: ${(e.score * 100).toFixed(0)}%`).join(', ') || 'Ninguna'}

=== NÚMERO DE HABLANTES ===
${azureData.speakers}

=== EFECTOS DE AUDIO ===
${azureData.audioEffects.join(', ') || 'Ninguno'}

=== TEXTO EN PANTALLA (OCR) ===
${(azureData as any).ocr?.map((o: any) => `[${o.timestamp}] "${o.text}"`).join('\n') || 'Ninguno'}

=== CARAS/PERSONAS DETECTADAS ===
${(azureData as any).faces?.map((f: any) => `${f.name}: aparece en ${f.appearances.join(', ')}`).join('\n') || 'Ninguna'}

=== ESCENAS ===
${(azureData as any).scenes?.map((s: any, i: number) => `Escena ${i+1}: ${s.start} - ${s.end}`).join('\n') || 'Ninguna'}

=== SHOTS/CORTES DE EDICIÓN ===
${azureData.shots.map((s: any, i: number) => `Shot ${i+1}: ${s.start} - ${s.end} (duración: ${s.duration || 'N/A'})`).join('\n') || 'Ninguno'}
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
          
          // Add analysis request with ultra-detailed instructions
          contentParts.push({
            type: 'text',
            text: `
ANALIZA ESTE VÍDEO EN DETALLE EXTREMO. Tienes ${thumbnailsBase64.length} frames/imágenes del vídeo y todos los datos de Azure Video Indexer.

DEBES DESCRIBIR EXACTAMENTE:

1. **DESCRIPCIÓN FRAME POR FRAME**: Para CADA imagen que ves, describe:
   - Qué persona aparece y qué está haciendo exactamente
   - Expresión facial y lenguaje corporal
   - Posición de la cámara (primer plano, plano medio, plano general)
   - Movimiento de cámara (estático, zoom, pan, tilt)
   - Iluminación y colores dominantes
   - Objetos y fondo visible
   - Texto en pantalla (si hay)

2. **CORTES DE EDICIÓN**: Identifica TODOS los cortes/transiciones:
   - Timestamp exacto de cada corte
   - Tipo de transición (corte seco, fade, zoom, etc.)
   - Ritmo de edición (rápido, lento, variable)

3. **CALL TO ACTION (CTA)**: 
   - ¿Hay CTA? ¿Cuál es exactamente?
   - ¿En qué momento aparece? (timestamp)
   - ¿Es verbal, visual o ambos?
   - ¿Qué acción pide al espectador?

4. **HOOK (primeros 3 segundos)**:
   - ¿Qué técnica usa para captar atención?
   - ¿Qué se ve y se escucha exactamente?
   - ¿Por qué funciona (o no) como gancho?

5. **AUDIO Y VOZ**:
   - Tono de voz (energético, calmado, humorístico)
   - Velocidad del habla
   - Música de fondo (si hay)
   - Efectos de sonido

6. **ESTRUCTURA NARRATIVA**:
   - Introducción/Hook
   - Desarrollo/Contenido principal
   - Clímax/Momento clave
   - Cierre/CTA

7. **FACTORES DE VIRALIDAD**: Puntúa del 0-100 y justifica:
   - Hook Score
   - Pacing Score (ritmo)
   - Engagement Score
   - Overall Score

Responde en JSON. Sé EXTREMADAMENTE DETALLADO. No omitas nada de lo que ves en las imágenes.
`
          });

          console.log('[Analysis] Sending to Gemini with', thumbnailsBase64.length, 'images...');
          
          const response = await invokeLLM({
            messages: [
              { 
                role: "system", 
                content: "Eres un experto analista de contenido viral con experiencia en TikTok, Instagram Reels y YouTube Shorts. Tu trabajo es analizar vídeos frame por frame, identificando CADA detalle visual, cada corte de edición, cada CTA, y todo lo que ocurre en el vídeo. Debes ser EXTREMADAMENTE DETALLADO y describir exactamente lo que ves en cada imagen. Responde siempre en español y en formato JSON válido." 
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
                      description: "Descripción DETALLADA de CADA frame/imagen: qué persona aparece, qué hace, expresión facial, posición de cámara, iluminación, colores, objetos, texto en pantalla. Debe ser muy largo y detallado." 
                    },
                    hookAnalysis: { 
                      type: "string", 
                      description: "Análisis del hook (primeros 3 segundos): qué técnica usa, qué se ve y escucha exactamente, por qué funciona" 
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
                      description: "Análisis del audio: tono de voz, velocidad del habla, música de fondo, efectos de sonido"
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
                    summary: { type: "string", description: "Resumen completo de por qué este vídeo funcionaría (o no) como contenido viral" },
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
            // New ultra-detailed analysis fields
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
              shots: azureData.shots,
              ocr: (azureData as any).ocr,
              faces: (azureData as any).faces,
              scenes: (azureData as any).scenes,
              thumbnailCount: thumbnailsBase64.length,
            }
          };
        } catch (error: any) {
          console.error('[Analysis] Error during analysis:', error);
          
          // Determine user-friendly error message
          let userMessage = 'Error durante el análisis del vídeo';
          
          if (error.message?.includes('Failed to upload video')) {
            userMessage = 'Error al subir el vídeo a Azure. Por favor, intenta con un vídeo más pequeño o en formato MP4.';
          } else if (error.message?.includes('Video indexing failed')) {
            userMessage = 'Azure no pudo procesar el vídeo. Asegúrate de que el vídeo tenga audio y sea un formato compatible (MP4, MOV, AVI).';
          } else if (error.message?.includes('Timeout')) {
            userMessage = 'El análisis tardó demasiado tiempo. Por favor, intenta con un vídeo más corto (menos de 2 minutos).';
          } else if (error.message?.includes('duration') || error.message?.includes('durationInSeconds')) {
            userMessage = 'Azure no pudo leer la duración del vídeo. El archivo puede estar corrupto o en un formato no compatible.';
          }
          
          await db.updateVideoAnalysis(analysisId, { status: "failed" });
          
          // Cleanup compressed file if it exists
          if (compressedFilePath) {
            cleanupCompressedFile(compressedFilePath);
          }
          
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
