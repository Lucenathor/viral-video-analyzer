// Test que simula el flujo completo de la API
import * as fs from 'fs';
import * as path from 'path';
import { performFullAnalysis, cleanupAnalysis } from './server/services/ffmpegAdvancedAnalysis';
import { transcribeAudioFile } from './server/services/audioTranscription';
import { invokeLLM } from './server/_core/llm';

const TEST_VIDEO = '/home/ubuntu/test_video.mp4';

// Helper functions from routers.ts
function formatTranscriptionWithTimestamps(segments: any[]): string {
  if (!segments || segments.length === 0) return '';
  return segments.map(s => `[${s.start.toFixed(1)}s] ${s.text}` || []).join('\n');
}

function extractKeyMoments(segments: any[]): any[] {
  if (!segments || segments.length === 0) return [];
  const keyMoments: any[] = [];
  segments.forEach((segment, index) => {
    const text = segment.text.toLowerCase();
    if (text.includes('?') || text.includes('¿')) {
      keyMoments.push({ type: 'question', timestamp: segment.start, text: segment.text });
    }
    if (text.includes('!') || text.includes('¡')) {
      keyMoments.push({ type: 'exclamation', timestamp: segment.start, text: segment.text });
    }
    if (index === 0) {
      keyMoments.push({ type: 'hook', timestamp: segment.start, text: segment.text });
    }
    if (text.includes('suscri') || text.includes('follow') || text.includes('like') || 
        text.includes('comenta') || text.includes('comparte') || text.includes('link')) {
      keyMoments.push({ type: 'cta', timestamp: segment.start, text: segment.text });
    }
  });
  return keyMoments;
}

function buildComprehensiveDataText(fullAnalysis: any, transcription: any): string {
  let text = `=== ANÁLISIS TÉCNICO DEL VÍDEO ===

📹 METADATOS:
- Duración: ${fullAnalysis.metadata.duration.toFixed(1)} segundos
- Resolución: ${fullAnalysis.metadata.width}x${fullAnalysis.metadata.height}
- FPS: ${fullAnalysis.metadata.fps}
- Codec de vídeo: ${fullAnalysis.metadata.videoCodec}
- Tiene audio: ${fullAnalysis.metadata.hasAudio ? 'Sí' : 'No'}
${fullAnalysis.metadata.hasAudio ? `- Codec de audio: ${fullAnalysis.metadata.audioCodec}
- Canales de audio: ${fullAnalysis.metadata.audioChannels}` : ''}

🎬 DETECCIÓN DE ESCENAS:
- Cortes de edición detectados: ${fullAnalysis.sceneChanges.length}
${fullAnalysis.sceneChanges.map((sc: any, i: number) => `  ${i + 1}. Corte en ${sc.timestamp.toFixed(2)}s (score: ${sc.score.toFixed(2)})` || []).join('\n')}

📊 ANÁLISIS DE SHOTS:
- Número de shots: ${fullAnalysis.shotDurations?.length || 0}
${fullAnalysis.shotDurations?.map((shot: any, i: number) => 
  `  Shot ${i + 1}: ${shot.start.toFixed(1)}s - ${shot.end.toFixed(1)}s (${shot.duration.toFixed(1)}s)`
 || []).join('\n')}
- Duración promedio de shot: ${(fullAnalysis.shotDurations?.reduce((acc: number, s: any) => acc + s.duration, 0) / fullAnalysis.shotDurations?.length || 0).toFixed(1)}s
- Ritmo de edición: ${(fullAnalysis.shotDurations?.length || 0 / (fullAnalysis.metadata.duration / 60)).toFixed(1)} cortes/minuto

🔊 ANÁLISIS DE AUDIO:
- Volumen promedio: ${fullAnalysis.audioAnalysis.meanVolume.toFixed(1)} dB
- Volumen máximo: ${fullAnalysis.audioAnalysis.maxVolume.toFixed(1)} dB
- Silencios detectados: ${fullAnalysis.audioAnalysis.silences.length}
- Picos de audio: ${fullAnalysis.audioAnalysis.loudPeaks.length}
${fullAnalysis.audioAnalysis.silences.length > 0 ? 
  `- Silencios en: ${fullAnalysis.audioAnalysis.silences.map((s: any) => `${s.start.toFixed(1)}s-${s.end.toFixed(1)}s`).join(', ')}` : ''}
${fullAnalysis.audioAnalysis.loudPeaks.length > 0 ? 
  `- Picos en: ${fullAnalysis.audioAnalysis.loudPeaks.map((p: any) => `${p.timestamp.toFixed(1)}s (${p.volume.toFixed(1)}dB)`).join(', ')}` : ''}

🖼️ FRAMES EXTRAÍDOS: ${fullAnalysis.frames.length}
${fullAnalysis.frames.map((f: any, i: number) => 
  `  Frame ${i + 1}: ${f.timestamp.toFixed(1)}s [${f.type}]`
 || []).join('\n')}`;

  if (transcription && transcription.success) {
    text += `

🎤 TRANSCRIPCIÓN COMPLETA:
${transcription.formattedTranscript || transcription.text}

📍 MOMENTOS CLAVE DETECTADOS:
${transcription.keyMoments?.map((km: any) => 
  `  - [${km.timestamp.toFixed(1)}s] ${km.type.toUpperCase()}: "${km.text}"`
 || []).join('\n') || 'Ninguno detectado'}`;
  }

  return text;
}

async function testAPIFlow() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('    TEST DEL FLUJO COMPLETO DE LA API');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Step 1: FFmpeg analysis
  console.log('📹 PASO 1: Análisis FFmpeg completo...');
  const fullAnalysis = await performFullAnalysis(TEST_VIDEO);
  console.log(`✅ ${fullAnalysis.frames.length} frames, ${fullAnalysis.sceneChanges.length} escenas, ${fullAnalysis.shotDurations?.length || 0} shots\n`);
  
  // Step 2: Transcription (if audio exists)
  let transcription: any = null;
  if (fullAnalysis.metadata.hasAudio && fullAnalysis.audioPath) {
    console.log('🎤 PASO 2: Transcripción de audio...');
    const transcriptionResult = await transcribeAudioFile(fullAnalysis.audioPath);
    if (transcriptionResult.success) {
      transcription = {
        success: true,
        text: transcriptionResult.text,
        language: transcriptionResult.language,
        duration: transcriptionResult.duration,
        segments: transcriptionResult.segments,
        formattedTranscript: formatTranscriptionWithTimestamps(transcriptionResult.segments || []),
        keyMoments: extractKeyMoments(transcriptionResult.segments || [])
      };
      console.log(`✅ Transcripción: ${transcription.text?.length || 0} chars\n`);
    } else {
      console.log(`⚠️ Transcripción fallida: ${transcriptionResult.error}\n`);
    }
  } else {
    console.log('⏭️ PASO 2: Sin audio, saltando transcripción\n');
  }
  
  // Step 3: Build content for Gemini
  console.log('📝 PASO 3: Construyendo contenido para Gemini...');
  const comprehensiveDataText = buildComprehensiveDataText(fullAnalysis, transcription);
  
  const contentParts: any[] = [];
  contentParts.push({ type: 'text', text: comprehensiveDataText });
  
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
  
  console.log(`✅ ${contentParts.length} partes de contenido preparadas\n`);
  
  // Step 4: Call Gemini with full schema
  console.log('🤖 PASO 4: Llamando a Gemini...');
  
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

Tu trabajo es proporcionar el análisis MÁS DETALLADO Y PRECISO posible.

REGLAS:
1. Analiza TODOS los frames, no solo los primeros
2. Correlaciona el audio con las imágenes
3. Identifica EXACTAMENTE dónde están los cortes de edición
4. Describe el CTA con timestamp exacto
5. Evalúa el hook de los primeros 3 segundos
6. Las puntuaciones DEBEN ser de 0 a 100

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
            frameByFrameAnalysis: { type: "string", description: "Descripción DETALLADA de CADA frame" },
            hookAnalysis: { type: "string", description: "Análisis del hook (primeros 3 segundos)" },
            editingAnalysis: { type: "string", description: "Análisis de los cortes de edición" },
            callToAction: { type: "string", description: "CTA detectado" },
            audioAnalysis: { type: "string", description: "Análisis del audio" },
            visualElements: { type: "string", description: "Elementos visuales" },
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
            overallScore: { type: "number", description: "Puntuación general de 0 a 100" },
            hookScore: { type: "number", description: "Puntuación del hook de 0 a 100" },
            pacingScore: { type: "number", description: "Puntuación del ritmo de 0 a 100" },
            engagementScore: { type: "number", description: "Puntuación de engagement de 0 a 100" }
          },
          required: ["frameByFrameAnalysis", "hookAnalysis", "editingAnalysis", "callToAction", "audioAnalysis", "visualElements", "structureBreakdown", "viralityFactors", "summary", "overallScore", "hookScore", "pacingScore", "engagementScore"],
          additionalProperties: false
        }
      }
    }
  });
  
  console.log('✅ Respuesta recibida\n');
  
  // Step 5: Parse and validate response
  console.log('📊 PASO 5: Parseando y validando respuesta...');
  
  const content = response.choices[0].message.content;
  let analysisData;
  
  if (typeof content === 'string') {
    try {
      analysisData = JSON.parse(content);
      console.log('✅ JSON parseado correctamente\n');
    } catch (e) {
      console.error('❌ Error parseando JSON');
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/) ||
                       content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        console.log('✅ JSON extraído de markdown\n');
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
  
  // Show results
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    RESULTADOS FINALES');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('📊 PUNTUACIONES (0-100):');
  console.log(`   ⭐ Overall Score: ${analysisData.overallScore}`);
  console.log(`   🎣 Hook Score: ${analysisData.hookScore}`);
  console.log(`   ⚡ Pacing Score: ${analysisData.pacingScore}`);
  console.log(`   💬 Engagement Score: ${analysisData.engagementScore}`);
  
  console.log('\n📝 RESUMEN:');
  console.log(`   ${analysisData.summary?.substring(0, 300)}...`);
  
  console.log('\n🎬 ESTRUCTURA:');
  console.log(`   Segmentos: ${analysisData.structureBreakdown?.segments?.length || 0}`);
  
  console.log('\n⭐ FACTORES DE VIRALIDAD:');
  analysisData.viralityFactors?.factors?.forEach((f: any) => {
    console.log(`   - ${f.name}: ${f.score}/100`);
  });
  
  console.log('\n🎣 ANÁLISIS DEL HOOK:');
  console.log(`   ${analysisData.hookAnalysis?.substring(0, 200)}...`);
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    ✅ TEST API EXITOSO');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Cleanup
  cleanupAnalysis(fullAnalysis);
}

testAPIFlow().catch(console.error);
