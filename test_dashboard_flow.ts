// Test que simula el flujo completo del dashboard
import * as fs from 'fs';
import * as path from 'path';
import { storagePut, storageGet } from './server/storage';
import { performFullAnalysis, cleanupAnalysis } from './server/services/ffmpegAdvancedAnalysis';
import { transcribeAudioFile } from './server/services/audioTranscription';
import { invokeLLM } from './server/_core/llm';

const VIDEO_PATH = '/home/ubuntu/upload/copy_21FECC20-7C64-4BDF-A1D5-A8A03A005B76.MOV';
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

async function simulateDashboardFlow() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('    SIMULACIÓN DEL FLUJO COMPLETO DEL DASHBOARD');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Step 1: Read file and split into chunks (like frontend does)
  console.log('📤 PASO 1: Leyendo archivo y dividiendo en chunks...');
  const videoBuffer = fs.readFileSync(VIDEO_PATH);
  const fileSize = videoBuffer.length;
  const fileName = path.basename(VIDEO_PATH);
  const fileKey = `test_${Date.now()}_${fileName}`;
  
  console.log(`   - Archivo: ${fileName}`);
  console.log(`   - Tamaño: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
  
  const numChunks = Math.ceil(fileSize / CHUNK_SIZE);
  console.log(`   - Chunks a subir: ${numChunks}`);
  
  // Step 2: Upload chunks to storage (like uploadChunk mutation)
  console.log('\n📤 PASO 2: Subiendo chunks a storage...');
  for (let i = 0; i < numChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, fileSize);
    const chunk = videoBuffer.slice(start, end);
    const chunkKey = `${fileKey}.chunk${i}`;
    
    await storagePut(chunkKey, chunk, 'application/octet-stream');
    console.log(`   ✅ Chunk ${i + 1}/${numChunks} subido (${(chunk.length / 1024 / 1024).toFixed(2)} MB)`);
  }
  
  // Step 3: Download and combine chunks (like finalizeUploadAndAnalyze does)
  console.log('\n📥 PASO 3: Descargando y combinando chunks...');
  const chunks: Buffer[] = [];
  let chunkIndex = 0;
  while (true) {
    try {
      const chunkKey = `${fileKey}.chunk${chunkIndex}`;
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
  const tempInputPath = path.join('/tmp', `input_${Date.now()}_${fileName}`);
  fs.writeFileSync(tempInputPath, combinedBuffer);
  console.log(`   ✅ Combinados ${chunks.length} chunks, total: ${(combinedBuffer.length / 1024 / 1024).toFixed(2)} MB`);
  
  // Step 4: Full FFmpeg analysis
  console.log('\n🎬 PASO 4: Análisis FFmpeg completo...');
  const startAnalysis = Date.now();
  const fullAnalysis = await performFullAnalysis(tempInputPath);
  console.log(`   ✅ Completado en ${((Date.now() - startAnalysis) / 1000).toFixed(1)}s`);
  console.log(`   - Duración: ${fullAnalysis.metadata.duration.toFixed(1)}s`);
  console.log(`   - Resolución: ${fullAnalysis.metadata.width}x${fullAnalysis.metadata.height}`);
  console.log(`   - Frames: ${fullAnalysis.frames.length}`);
  console.log(`   - Audio: ${fullAnalysis.metadata.hasAudio ? 'Sí' : 'No'}`);
  
  // Step 5: Transcription
  let transcription = { success: false, text: '', language: '', segments: [] as any[], keyMoments: [] as any[] };
  if (fullAnalysis.audioPath && fullAnalysis.metadata.hasAudio) {
    console.log('\n🎤 PASO 5: Transcripción de audio...');
    const transcriptionResult = await transcribeAudioFile(fullAnalysis.audioPath);
    if (transcriptionResult.success) {
      transcription = {
        success: true,
        text: transcriptionResult.text || '',
        language: transcriptionResult.language || '',
        segments: transcriptionResult.segments || [],
        keyMoments: []
      };
      console.log(`   ✅ Transcripción: "${transcription.text.substring(0, 80)}..."`);
    }
  }
  
  // Step 6: Build content for Gemini
  console.log('\n📝 PASO 6: Preparando contenido para Gemini...');
  const contentParts: any[] = [];
  
  let dataText = `=== ANÁLISIS TÉCNICO DEL VÍDEO ===

📹 METADATOS:
- Duración: ${fullAnalysis.metadata.duration.toFixed(1)} segundos
- Resolución: ${fullAnalysis.metadata.width}x${fullAnalysis.metadata.height}
- FPS: ${fullAnalysis.metadata.fps}

🔊 ANÁLISIS DE AUDIO:
- Volumen promedio: ${fullAnalysis.audioAnalysis.meanVolume.toFixed(1)} dB
- Silencios detectados: ${fullAnalysis.audioAnalysis.silences.length}

🖼️ FRAMES EXTRAÍDOS: ${fullAnalysis.frames.length}`;

  if (transcription.success) {
    dataText += `\n\n🎤 TRANSCRIPCIÓN:\n${transcription.text}`;
  }
  
  contentParts.push({ type: 'text', text: dataText });
  
  // Add frames (limit to 20)
  const framesToSend = fullAnalysis.frames.slice(0, 20);
  for (let i = 0; i < framesToSend.length; i++) {
    const frame = framesToSend[i];
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
  console.log(`   ✅ ${contentParts.length} partes preparadas (${framesToSend.length} frames)`);
  
  // Step 7: Call Gemini
  console.log('\n🤖 PASO 7: Llamando a Gemini...');
  const geminiStart = Date.now();
  
  const response = await invokeLLM({
    messages: [
      { 
        role: "system", 
        content: `Eres el analista de contenido viral más experto del mundo. Analiza este vídeo de forma EXHAUSTIVA.
REGLAS: Puntuaciones de 0 a 100. Responde en español. Formato JSON válido.`
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
  
  console.log(`   ✅ Respuesta recibida en ${((Date.now() - geminiStart) / 1000).toFixed(1)}s`);
  
  // Step 8: Parse response
  console.log('\n📊 PASO 8: Parseando respuesta...');
  const content = response.choices[0].message.content;
  let analysisData;
  
  if (typeof content === 'string') {
    try {
      analysisData = JSON.parse(content);
      console.log('   ✅ JSON parseado correctamente');
    } catch (e) {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        console.log('   ✅ JSON extraído de markdown');
      } else {
        throw new Error('No se pudo parsear JSON');
      }
    }
  } else {
    analysisData = content;
  }
  
  // Normalize scores
  const normalizeScore = (score: number | undefined): number => {
    if (score === undefined || score === null) return 50;
    if (score <= 10) return Math.round(score * 10);
    return Math.round(Math.min(100, Math.max(0, score)));
  };
  
  analysisData.overallScore = normalizeScore(analysisData.overallScore);
  analysisData.hookScore = normalizeScore(analysisData.hookScore);
  analysisData.pacingScore = normalizeScore(analysisData.pacingScore);
  analysisData.engagementScore = normalizeScore(analysisData.engagementScore);
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    RESULTADOS DEL ANÁLISIS');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('📊 PUNTUACIONES (0-100):');
  console.log(`   ⭐ Overall Score: ${analysisData.overallScore}`);
  console.log(`   🎣 Hook Score: ${analysisData.hookScore}`);
  console.log(`   ⚡ Pacing Score: ${analysisData.pacingScore}`);
  console.log(`   💬 Engagement Score: ${analysisData.engagementScore}`);
  
  console.log('\n📝 RESUMEN:');
  console.log(`   ${analysisData.summary.substring(0, 200)}...`);
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    ✅ SIMULACIÓN COMPLETADA');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Cleanup
  cleanupAnalysis(fullAnalysis);
  fs.unlinkSync(tempInputPath);
  
  return analysisData;
}

simulateDashboardFlow().catch(err => {
  console.error('❌ ERROR FATAL:', err.message);
  console.error(err.stack);
  process.exit(1);
});
