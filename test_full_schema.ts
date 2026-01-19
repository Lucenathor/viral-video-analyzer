// Test con el schema COMPLETO de la aplicación
import * as fs from 'fs';
import { performFullAnalysis, cleanupAnalysis } from './server/services/ffmpegAdvancedAnalysis';
import { invokeLLM } from './server/_core/llm';

const TEST_VIDEO = '/home/ubuntu/test_video.mp4';

async function testWithFullSchema() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('    TEST CON SCHEMA COMPLETO DE LA APLICACIÓN');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Extraer frames
  console.log('🎬 Extrayendo frames...');
  const fullAnalysis = await performFullAnalysis(TEST_VIDEO);
  console.log(`✅ ${fullAnalysis.frames.length} frames extraídos\n`);
  
  // Preparar contenido
  const contentParts: any[] = [];
  contentParts.push({
    type: 'text',
    text: `ANÁLISIS DE VÍDEO VIRAL
Duración: ${fullAnalysis.metadata.duration.toFixed(1)}s
Resolución: ${fullAnalysis.metadata.width}x${fullAnalysis.metadata.height}
Escenas: ${fullAnalysis.sceneChanges.length}
Frames: ${fullAnalysis.frames.length}

Analiza TODOS los frames siguientes:`
  });
  
  for (let i = 0; i < fullAnalysis.frames.length; i++) {
    const frame = fullAnalysis.frames[i];
    contentParts.push({
      type: 'text',
      text: `\n--- Frame ${i + 1}/${fullAnalysis.frames.length} (${frame.timestamp.toFixed(1)}s) [${frame.type}] ---`
    });
    contentParts.push({
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${frame.base64}`,
        detail: 'high'
      }
    });
  }
  
  console.log('🤖 Llamando a Gemini con schema completo...\n');
  
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Eres el analista de contenido viral más experto del mundo. Analiza TODOS los frames proporcionados.
          
REGLAS:
1. Analiza TODOS los frames, no solo los primeros
2. Sé EXTREMADAMENTE DETALLADO
3. Responde en español y en formato JSON válido.`
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
                description: "Descripción DETALLADA de CADA frame" 
              },
              hookAnalysis: { 
                type: "string", 
                description: "Análisis del hook (primeros 3 segundos)" 
              },
              editingAnalysis: {
                type: "string",
                description: "Análisis de los cortes de edición"
              },
              callToAction: {
                type: "string",
                description: "CTA detectado"
              },
              audioAnalysis: {
                type: "string",
                description: "Análisis del audio"
              },
              visualElements: { 
                type: "string", 
                description: "Elementos visuales" 
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
    
    console.log('✅ Respuesta recibida\n');
    
    const content = response.choices[0].message.content;
    console.log('Tipo de contenido:', typeof content);
    
    let analysisData;
    if (typeof content === 'string') {
      console.log('Longitud:', content.length, 'chars');
      console.log('Preview:', content.substring(0, 300), '...\n');
      
      try {
        analysisData = JSON.parse(content);
        console.log('✅ JSON parseado correctamente\n');
      } catch (e: any) {
        console.error('❌ ERROR al parsear JSON:', e.message);
        console.log('\nContenido completo:');
        console.log(content);
        
        // Intentar extraer JSON de markdown
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         content.match(/```\s*([\s\S]*?)\s*```/) ||
                         content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            analysisData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            console.log('\n✅ JSON extraído de markdown');
          } catch {
            console.error('❌ No se pudo extraer JSON');
            return;
          }
        } else {
          return;
        }
      }
    } else {
      analysisData = content;
    }
    
    // Mostrar resultados
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    RESULTADOS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log(`📊 Puntuaciones:`);
    console.log(`   - Overall: ${analysisData.overallScore}/100`);
    console.log(`   - Hook: ${analysisData.hookScore}/100`);
    console.log(`   - Pacing: ${analysisData.pacingScore}/100`);
    console.log(`   - Engagement: ${analysisData.engagementScore}/100`);
    
    console.log(`\n📝 Resumen: ${analysisData.summary?.substring(0, 200)}...`);
    
    console.log(`\n🎬 Segmentos: ${analysisData.structureBreakdown?.segments?.length || 0}`);
    console.log(`⭐ Factores de viralidad: ${analysisData.viralityFactors?.factors?.length || 0}`);
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                    ✅ TEST EXITOSO');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    if (error.stack) console.error('Stack:', error.stack);
  } finally {
    cleanupAnalysis(fullAnalysis);
  }
}

testWithFullSchema().catch(console.error);
