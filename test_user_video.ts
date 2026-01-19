// Test completo con el vídeo MOV del usuario
import * as fs from 'fs';
import { performFullAnalysis, cleanupAnalysis } from './server/services/ffmpegAdvancedAnalysis';
import { transcribeAudioFile } from './server/services/audioTranscription';
import { invokeLLM } from './server/_core/llm';

const VIDEO_PATH = '/home/ubuntu/upload/copy_21FECC20-7C64-4BDF-A1D5-A8A03A005B76.MOV';

function formatTranscriptionWithTimestamps(segments: any[]): string {
  if (!segments || segments.length === 0) return '';
  return segments.map(s => `[${s.start.toFixed(1)}s] ${s.text}`).join('\n');
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
        text.includes('comenta') || text.includes('comparte') || text.includes('link') ||
        text.includes('clic') || text.includes('botón') || text.includes('enlace')) {
      keyMoments.push({ type: 'cta', timestamp: segment.start, text: segment.text });
    }
  });
  return keyMoments;
}

async function testUserVideo() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('    TEST COMPLETO CON VÍDEO MOV DEL USUARIO');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Step 1: FFmpeg analysis
  console.log('📹 PASO 1: Análisis FFmpeg completo...');
  const startTime = Date.now();
  const fullAnalysis = await performFullAnalysis(VIDEO_PATH);
  console.log(`✅ Completado en ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log(`   - ${fullAnalysis.frames.length} frames extraídos`);
  console.log(`   - ${fullAnalysis.sceneChanges.length} escenas detectadas`);
  console.log(`   - ${fullAnalysis.shotDurations?.length || 1} shots`);
  console.log(`   - Duración: ${fullAnalysis.metadata.duration.toFixed(1)}s`);
  console.log('');
  
  // Step 2: Transcription
  let transcription: any = { success: false };
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
      console.log(`✅ Transcripción: "${transcription.text?.substring(0, 100)}..."`);
      console.log(`   - Idioma: ${transcription.language}`);
      console.log(`   - Segmentos: ${transcription.segments?.length || 0}`);
      console.log(`   - Momentos clave: ${transcription.keyMoments?.length || 0}`);
    }
  }
  console.log('');
  
  // Step 3: Build content for Gemini
  console.log('📝 PASO 3: Preparando contenido para Gemini...');
  
  const contentParts: any[] = [];
  
  // Add comprehensive data text
  let dataText = `=== ANÁLISIS TÉCNICO DEL VÍDEO ===

📹 METADATOS:
- Duración: ${fullAnalysis.metadata.duration.toFixed(1)} segundos
- Resolución: ${fullAnalysis.metadata.width}x${fullAnalysis.metadata.height}
- FPS: ${fullAnalysis.metadata.fps}
- Codec: ${fullAnalysis.metadata.codec}

🔊 ANÁLISIS DE AUDIO:
- Volumen promedio: ${fullAnalysis.audioAnalysis.meanVolume.toFixed(1)} dB
- Volumen máximo: ${fullAnalysis.audioAnalysis.maxVolume.toFixed(1)} dB
- Silencios detectados: ${fullAnalysis.audioAnalysis.silences.length}

🖼️ FRAMES EXTRAÍDOS: ${fullAnalysis.frames.length}`;

  if (transcription.success) {
    dataText += `

🎤 TRANSCRIPCIÓN COMPLETA:
${transcription.formattedTranscript}

📍 MOMENTOS CLAVE:
${transcription.keyMoments?.map((km: any) => `- [${km.timestamp.toFixed(1)}s] ${km.type.toUpperCase()}: "${km.text}"`).join('\n') || 'Ninguno'}`;
  }
  
  contentParts.push({ type: 'text', text: dataText });
  
  // Add frames (limit to 20 for faster processing)
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
  
  console.log(`✅ ${contentParts.length} partes preparadas (${framesToSend.length} frames)`);
  console.log('');
  
  // Step 4: Call Gemini
  console.log('🤖 PASO 4: Llamando a Gemini...');
  const geminiStart = Date.now();
  
  const response = await invokeLLM({
    messages: [
      { 
        role: "system", 
        content: `Eres el analista de contenido viral más experto del mundo. Analiza este vídeo de forma EXHAUSTIVA.

TIENES ACCESO A:
- ${framesToSend.length} frames del vídeo
- Transcripción completa del audio con timestamps
- Análisis de audio (volumen, silencios)
- Metadatos técnicos

REGLAS ESTRICTAS:
1. Analiza TODOS los frames proporcionados
2. Correlaciona el audio con las imágenes
3. Identifica el HOOK de los primeros 3 segundos
4. Detecta el CTA (llamada a la acción) con timestamp exacto
5. Las puntuaciones DEBEN ser de 0 a 100
6. Responde SIEMPRE en español
7. Responde en formato JSON válido`
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
            frameByFrameAnalysis: { type: "string", description: "Descripción detallada de cada frame" },
            hookAnalysis: { type: "string", description: "Análisis del hook (primeros 3 segundos)" },
            editingAnalysis: { type: "string", description: "Análisis de la edición" },
            callToAction: { type: "string", description: "CTA detectado con timestamp" },
            audioAnalysis: { type: "string", description: "Análisis del audio y transcripción" },
            visualElements: { type: "string", description: "Elementos visuales destacados" },
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
            overallScore: { type: "number", description: "Puntuación general 0-100" },
            hookScore: { type: "number", description: "Puntuación del hook 0-100" },
            pacingScore: { type: "number", description: "Puntuación del ritmo 0-100" },
            engagementScore: { type: "number", description: "Puntuación de engagement 0-100" }
          },
          required: ["frameByFrameAnalysis", "hookAnalysis", "editingAnalysis", "callToAction", "audioAnalysis", "visualElements", "structureBreakdown", "viralityFactors", "summary", "overallScore", "hookScore", "pacingScore", "engagementScore"],
          additionalProperties: false
        }
      }
    }
  });
  
  console.log(`✅ Respuesta recibida en ${((Date.now() - geminiStart) / 1000).toFixed(1)}s`);
  console.log('');
  
  // Step 5: Parse response
  console.log('📊 PASO 5: Parseando respuesta...');
  
  const content = response.choices[0].message.content;
  let analysisData;
  
  if (typeof content === 'string') {
    try {
      analysisData = JSON.parse(content);
      console.log('✅ JSON parseado correctamente');
    } catch (e) {
      console.log('⚠️ Intentando extraer JSON de markdown...');
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/) ||
                       content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        console.log('✅ JSON extraído de markdown');
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
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    RESULTADOS DEL ANÁLISIS');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('📊 PUNTUACIONES (0-100):');
  console.log(`   ⭐ Overall Score: ${analysisData.overallScore}`);
  console.log(`   🎣 Hook Score: ${analysisData.hookScore}`);
  console.log(`   ⚡ Pacing Score: ${analysisData.pacingScore}`);
  console.log(`   💬 Engagement Score: ${analysisData.engagementScore}`);
  
  console.log('\n📝 RESUMEN:');
  console.log(`   ${analysisData.summary}`);
  
  console.log('\n🎣 ANÁLISIS DEL HOOK:');
  console.log(`   ${analysisData.hookAnalysis}`);
  
  console.log('\n📢 CTA DETECTADO:');
  console.log(`   ${analysisData.callToAction}`);
  
  console.log('\n🎬 ESTRUCTURA:');
  analysisData.structureBreakdown?.segments?.forEach((seg: any, i: number) => {
    console.log(`   ${i + 1}. [${seg.startTime}s - ${seg.endTime}s] ${seg.type}: ${seg.description}`);
  });
  
  console.log('\n⭐ FACTORES DE VIRALIDAD:');
  analysisData.viralityFactors?.factors?.forEach((f: any) => {
    console.log(`   - ${f.name}: ${f.score}/100 - ${f.description}`);
  });
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    ✅ TEST COMPLETADO EXITOSAMENTE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Cleanup
  cleanupAnalysis(fullAnalysis);
  
  return analysisData;
}

testUserVideo().catch(err => {
  console.error('❌ ERROR FATAL:', err.message);
  console.error(err.stack);
  process.exit(1);
});
