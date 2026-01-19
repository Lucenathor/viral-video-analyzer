// Test completo del pipeline de análisis
import * as fs from 'fs';
import * as path from 'path';
import { performFullAnalysis, cleanupAnalysis } from './server/services/ffmpegAdvancedAnalysis';
import { invokeLLM } from './server/_core/llm';

const TEST_VIDEO = '/home/ubuntu/test_video.mp4';

async function testFullPipeline() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('       TEST COMPLETO DEL PIPELINE DE ANÁLISIS');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // PASO 1: Verificar que el vídeo existe
  console.log('📹 PASO 1: Verificando vídeo de prueba...');
  if (!fs.existsSync(TEST_VIDEO)) {
    console.error('❌ ERROR: No existe el vídeo de prueba en', TEST_VIDEO);
    return;
  }
  const stats = fs.statSync(TEST_VIDEO);
  console.log(`✅ Vídeo encontrado: ${(stats.size / 1024).toFixed(1)} KB\n`);
  
  // PASO 2: Extraer frames y análisis con FFmpeg
  console.log('🎬 PASO 2: Extrayendo frames con FFmpeg...');
  let fullAnalysis;
  try {
    fullAnalysis = await performFullAnalysis(TEST_VIDEO);
    console.log(`✅ Frames extraídos: ${fullAnalysis.frames.length}`);
    console.log(`   - Duración: ${fullAnalysis.metadata.duration.toFixed(1)}s`);
    console.log(`   - Resolución: ${fullAnalysis.metadata.width}x${fullAnalysis.metadata.height}`);
    console.log(`   - Escenas detectadas: ${fullAnalysis.sceneChanges.length}`);
    console.log(`   - Tiene audio: ${fullAnalysis.metadata.hasAudio}\n`);
    
    // Mostrar info de cada frame
    console.log('   Frames extraídos:');
    fullAnalysis.frames.forEach((f, i) => {
      console.log(`     ${i + 1}. ${f.timestamp.toFixed(1)}s [${f.type}] - ${f.base64.length} chars base64`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ ERROR en FFmpeg:', error);
    return;
  }
  
  // PASO 3: Preparar contenido para Gemini
  console.log('📝 PASO 3: Preparando contenido para Gemini...');
  const contentParts: any[] = [];
  
  // Añadir texto de contexto
  contentParts.push({
    type: 'text',
    text: `ANÁLISIS DE VÍDEO
Duración: ${fullAnalysis.metadata.duration.toFixed(1)} segundos
Resolución: ${fullAnalysis.metadata.width}x${fullAnalysis.metadata.height}
FPS: ${fullAnalysis.metadata.fps}
Escenas detectadas: ${fullAnalysis.sceneChanges.length}
Total de frames a analizar: ${fullAnalysis.frames.length}

A continuación se muestran TODOS los frames del vídeo. Analiza CADA UNO en detalle.`
  });
  
  // Añadir TODOS los frames
  for (let i = 0; i < fullAnalysis.frames.length; i++) {
    const frame = fullAnalysis.frames[i];
    const frameLabel = frame.type === 'scene_change' ? '🎬 CAMBIO DE ESCENA' :
                      frame.type === 'thumbnail' ? '📸 THUMBNAIL' : '🎞️ FRAME';
    
    contentParts.push({
      type: 'text',
      text: `\n--- ${frameLabel} ${i + 1}/${fullAnalysis.frames.length} (${frame.timestamp.toFixed(1)}s) ---`
    });
    
    contentParts.push({
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${frame.base64}`,
        detail: 'high'
      }
    });
  }
  
  // Añadir prompt final
  contentParts.push({
    type: 'text',
    text: `

INSTRUCCIONES:
Analiza TODOS los ${fullAnalysis.frames.length} frames mostrados arriba y proporciona un análisis completo en JSON.
Describe EXACTAMENTE lo que ves en cada frame.`
  });
  
  console.log(`✅ Contenido preparado: ${contentParts.length} partes (${fullAnalysis.frames.length} imágenes)\n`);
  
  // PASO 4: Llamar a Gemini
  console.log('🤖 PASO 4: Llamando a Gemini...');
  console.log('   (Esto puede tardar 30-60 segundos)\n');
  
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Eres un analista de vídeos experto. Analiza TODOS los frames proporcionados y responde en JSON válido.`
        },
        {
          role: "user",
          content: contentParts
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "video_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              framesAnalyzed: { 
                type: "number",
                description: "Número total de frames analizados"
              },
              frameDescriptions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    frameNumber: { type: "number" },
                    timestamp: { type: "string" },
                    description: { type: "string" }
                  },
                  required: ["frameNumber", "timestamp", "description"],
                  additionalProperties: false
                },
                description: "Descripción de cada frame analizado"
              },
              overallSummary: {
                type: "string",
                description: "Resumen general del contenido del vídeo"
              },
              viralScore: {
                type: "number",
                description: "Puntuación de viralidad de 0 a 100"
              }
            },
            required: ["framesAnalyzed", "frameDescriptions", "overallSummary", "viralScore"],
            additionalProperties: false
          }
        }
      }
    });
    
    console.log('✅ Respuesta recibida de Gemini\n');
    
    // Verificar la respuesta
    const content = response.choices[0].message.content;
    console.log('📊 PASO 5: Verificando respuesta...');
    console.log(`   - Tipo de contenido: ${typeof content}`);
    
    let analysisData;
    if (typeof content === 'string') {
      console.log(`   - Longitud del string: ${content.length} chars`);
      console.log(`   - Primeros 200 chars: ${content.substring(0, 200)}...`);
      
      try {
        analysisData = JSON.parse(content);
        console.log('✅ JSON parseado correctamente\n');
      } catch (e) {
        console.error('❌ ERROR al parsear JSON:', e);
        console.log('   Contenido completo:', content);
        return;
      }
    } else {
      analysisData = content;
      console.log('✅ Contenido ya es objeto\n');
    }
    
    // Mostrar resultados
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    RESULTADOS DEL ANÁLISIS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log(`📊 Frames analizados: ${analysisData.framesAnalyzed}`);
    console.log(`⭐ Puntuación viral: ${analysisData.viralScore}/100`);
    console.log(`\n📝 Resumen: ${analysisData.overallSummary}\n`);
    
    console.log('🎞️ Descripción de cada frame:');
    if (analysisData.frameDescriptions && Array.isArray(analysisData.frameDescriptions)) {
      analysisData.frameDescriptions.forEach((fd: any) => {
        console.log(`   Frame ${fd.frameNumber} (${fd.timestamp}): ${fd.description.substring(0, 100)}...`);
      });
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                    ✅ TEST COMPLETADO CON ÉXITO');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
  } catch (error: any) {
    console.error('❌ ERROR en Gemini:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    // Limpiar archivos temporales
    if (fullAnalysis) {
      cleanupAnalysis(fullAnalysis);
      console.log('🧹 Archivos temporales limpiados');
    }
  }
}

testFullPipeline().catch(console.error);
