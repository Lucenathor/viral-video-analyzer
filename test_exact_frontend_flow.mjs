/**
 * Test que simula EXACTAMENTE lo que hace el frontend
 * Usando el vídeo MOV real del usuario
 */
import { storagePut, storageGet } from './server/storage.ts';
import { compressVideo as ffmpegCompress, cleanupCompressedFile } from './server/services/ffmpegService.ts';
import { performFullAnalysis, cleanupAnalysis } from './server/services/ffmpegAdvancedAnalysis.ts';
import { transcribeAudioFile, formatTranscriptionWithTimestamps, extractKeyMoments } from './server/services/audioTranscription.ts';
import { invokeLLM } from './server/_core/llm.ts';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const VIDEO_PATH = '/home/ubuntu/upload/copy_21FECC20-7C64-4BDF-A1D5-A8A03A005B76.MOV';

async function testExactFrontendFlow() {
  console.log('=== TEST: SIMULACIÓN EXACTA DEL FLUJO DEL FRONTEND ===\n');
  
  let tempInputPath = null;
  let compressedFilePath = null;
  let fullAnalysis = null;
  
  try {
    // ===== STEP 1: SIMULAR DESCARGA DE CHUNKS =====
    console.log('[STEP 1] Simulando descarga de chunks...');
    const videoBuffer = fs.readFileSync(VIDEO_PATH);
    console.log(`  - Tamaño del vídeo: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    tempInputPath = path.join(os.tmpdir(), `test_input_${Date.now()}.mov`);
    fs.writeFileSync(tempInputPath, videoBuffer);
    console.log(`  - Archivo temporal creado: ${tempInputPath}`);
    
    // ===== STEP 2: COMPRIMIR CON FFMPEG =====
    console.log('\n[STEP 2] Comprimiendo con FFmpeg...');
    try {
      const compressionResult = await ffmpegCompress(tempInputPath, (progress) => {
        if (progress.percent % 20 === 0) {
          console.log(`  - Progreso: ${progress.percent}%`);
        }
      });
      compressedFilePath = compressionResult.outputPath;
      console.log(`  - Compresión completada: ${(compressionResult.inputSize / 1024 / 1024).toFixed(2)} MB -> ${(compressionResult.outputSize / 1024 / 1024).toFixed(2)} MB`);
    } catch (compressionError) {
      console.warn('  - Compresión falló, usando original:', compressionError.message);
      compressedFilePath = tempInputPath;
    }
    
    // ===== STEP 3: ANÁLISIS COMPLETO CON FFMPEG =====
    console.log('\n[STEP 3] Análisis completo con FFmpeg...');
    fullAnalysis = await performFullAnalysis(compressedFilePath || tempInputPath);
    
    console.log(`  - Duración: ${fullAnalysis.metadata.duration.toFixed(1)}s`);
    console.log(`  - Resolución: ${fullAnalysis.metadata.width}x${fullAnalysis.metadata.height}`);
    console.log(`  - FPS: ${fullAnalysis.metadata.fps}`);
    console.log(`  - Frames extraídos: ${fullAnalysis.frames.length}`);
    console.log(`  - Cambios de escena: ${fullAnalysis.sceneChanges.length}`);
    console.log(`  - Tiene audio: ${fullAnalysis.metadata.hasAudio}`);
    
    // ===== STEP 4: TRANSCRIPCIÓN =====
    let transcription = {
      success: false,
      text: '',
      language: '',
      duration: 0,
      segments: [],
      formattedTranscript: '',
      keyMoments: []
    };
    
    if (fullAnalysis.audioPath && fullAnalysis.metadata.hasAudio) {
      console.log('\n[STEP 4] Transcribiendo audio con Whisper...');
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
        console.log(`  - Transcripción: ${transcription.text.length} caracteres`);
        console.log(`  - Segmentos: ${transcription.segments.length}`);
        console.log(`  - Momentos clave: ${transcription.keyMoments.length}`);
      } else {
        console.warn('  - Transcripción falló:', transcriptionResult.error);
      }
    } else {
      console.log('\n[STEP 4] Sin audio, saltando transcripción');
    }
    
    // ===== STEP 5: LLAMADA A GEMINI =====
    console.log('\n[STEP 5] Llamando a Gemini con', fullAnalysis.frames.length, 'frames...');
    
    // Construir los content parts exactamente como el router
    const contentParts = [];
    
    // Añadir texto de datos
    contentParts.push({
      type: 'text',
      text: `
ANÁLISIS COMPLETO DEL VÍDEO
═══════════════════════════

📊 METADATOS:
• Duración: ${fullAnalysis.metadata.duration.toFixed(2)}s
• Resolución: ${fullAnalysis.metadata.width}x${fullAnalysis.metadata.height}
• FPS: ${fullAnalysis.metadata.fps}
• Codec: ${fullAnalysis.metadata.codec}
• Tiene audio: ${fullAnalysis.metadata.hasAudio}

🎬 ESCENAS DETECTADAS: ${fullAnalysis.sceneChanges.length}
${fullAnalysis.sceneChanges.map((sc, i) => `  ${i+1}. ${sc.timestamp.toFixed(1)}s (score: ${sc.score.toFixed(2)})`).join('\n')}

🔊 ANÁLISIS DE AUDIO:
• Volumen medio: ${fullAnalysis.audioAnalysis.meanVolume.toFixed(1)} dB
• Silencios: ${fullAnalysis.audioAnalysis.silences.length}
• Picos de volumen: ${fullAnalysis.audioAnalysis.loudPeaks.length}
• Tiene música: ${fullAnalysis.audioAnalysis.hasMusic}
• Tiene voz: ${fullAnalysis.audioAnalysis.hasSpeech}

📝 TRANSCRIPCIÓN:
${transcription.success ? transcription.text : 'No disponible'}

🎯 MOMENTOS CLAVE:
${transcription.keyMoments.map(km => `  • ${km.timestamp.toFixed(1)}s: [${km.type}] ${km.text}`).join('\n') || 'No detectados'}

A continuación se muestran ${fullAnalysis.frames.length} frames del vídeo con sus timestamps:
`
    });
    
    // Añadir frames
    for (let i = 0; i < fullAnalysis.frames.length; i++) {
      const frame = fullAnalysis.frames[i];
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
    
    // Añadir prompt de análisis
    contentParts.push({
      type: 'text',
      text: `

INSTRUCCIONES DE ANÁLISIS:
Analiza TODOS los ${fullAnalysis.frames.length} frames mostrados arriba y proporciona un análisis detallado en formato JSON.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "frameByFrameAnalysis": "Descripción detallada de cada frame...",
  "hookAnalysis": "Análisis del hook (primeros 3 segundos)...",
  "editingAnalysis": "Análisis de los cortes de edición...",
  "callToAction": "CTA detectado...",
  "audioAnalysis": "Análisis del audio...",
  "visualElements": "Elementos visuales...",
  "structureBreakdown": {
    "segments": [
      {"startTime": 0, "endTime": 3, "type": "hook", "description": "..."},
      {"startTime": 3, "endTime": 10, "type": "content", "description": "..."}
    ]
  },
  "viralityFactors": {
    "factors": [
      {"name": "Hook efectivo", "score": 85, "description": "..."},
      {"name": "Ritmo de edición", "score": 70, "description": "..."}
    ]
  },
  "summary": "Resumen completo...",
  "overallScore": 85,
  "hookScore": 90,
  "pacingScore": 75,
  "engagementScore": 88
}

IMPORTANTE: Las puntuaciones deben ser de 0 a 100.
`
    });
    
    console.log('  - Enviando', contentParts.length, 'partes a Gemini...');
    
    const response = await invokeLLM({
      messages: [
        { 
          role: "system", 
          content: `Eres el analista de contenido viral más experto del mundo. Analiza TODOS los frames proporcionados y responde en español con un JSON válido. Las puntuaciones deben ser de 0 a 100.`
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
              frameByFrameAnalysis: { type: "string" },
              hookAnalysis: { type: "string" },
              editingAnalysis: { type: "string" },
              callToAction: { type: "string" },
              audioAnalysis: { type: "string" },
              visualElements: { type: "string" },
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
            required: ["frameByFrameAnalysis", "hookAnalysis", "editingAnalysis", "callToAction", "audioAnalysis", "visualElements", "structureBreakdown", "viralityFactors", "summary", "overallScore", "hookScore", "pacingScore", "engagementScore"],
            additionalProperties: false
          }
        }
      }
    });
    
    console.log('  - Respuesta recibida de Gemini');
    
    const content = response.choices[0].message.content;
    console.log('  - Tipo de contenido:', typeof content);
    
    let analysisData;
    if (typeof content === 'string') {
      console.log('  - Parseando JSON string...');
      console.log('  - Preview:', content.substring(0, 300));
      analysisData = JSON.parse(content);
    } else if (typeof content === 'object' && content !== null) {
      console.log('  - Contenido ya es objeto');
      analysisData = content;
    } else {
      throw new Error('Respuesta vacía de Gemini');
    }
    
    // Normalizar puntuaciones
    const normalizeScore = (score) => {
      if (score === undefined || score === null || isNaN(score)) return 50;
      if (score <= 10) return Math.round(score * 10);
      return Math.round(Math.min(100, Math.max(0, score)));
    };
    
    analysisData.overallScore = normalizeScore(analysisData.overallScore);
    analysisData.hookScore = normalizeScore(analysisData.hookScore);
    analysisData.pacingScore = normalizeScore(analysisData.pacingScore);
    analysisData.engagementScore = normalizeScore(analysisData.engagementScore);
    
    console.log('\n=== RESULTADOS DEL ANÁLISIS ===');
    console.log('Overall Score:', analysisData.overallScore);
    console.log('Hook Score:', analysisData.hookScore);
    console.log('Pacing Score:', analysisData.pacingScore);
    console.log('Engagement Score:', analysisData.engagementScore);
    console.log('\nHook Analysis (preview):', analysisData.hookAnalysis?.substring(0, 200));
    console.log('\nSummary (preview):', analysisData.summary?.substring(0, 200));
    console.log('\nStructure Segments:', analysisData.structureBreakdown?.segments?.length || 0);
    console.log('Virality Factors:', analysisData.viralityFactors?.factors?.length || 0);
    
    console.log('\n=== TEST EXITOSO ===');
    
  } catch (error) {
    console.error('\n=== ERROR EN EL TEST ===');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Cleanup
    if (fullAnalysis) {
      cleanupAnalysis(fullAnalysis);
    }
    if (compressedFilePath && compressedFilePath !== tempInputPath) {
      try { fs.unlinkSync(compressedFilePath); } catch {}
    }
    if (tempInputPath && fs.existsSync(tempInputPath)) {
      try { fs.unlinkSync(tempInputPath); } catch {}
    }
  }
}

testExactFrontendFlow();
