import { performFullAnalysis, cleanupAnalysis } from './server/services/ffmpegAdvancedAnalysis';
import { transcribeAudioFile, formatTranscriptionWithTimestamps, extractKeyMoments } from './server/services/audioTranscription';
import { invokeLLM } from './server/_core/llm';
import * as fs from 'fs';
import * as path from 'path';

const VIDEO_PATH = '/home/ubuntu/upload/copy_21FECC20-7C64-4BDF-A1D5-A8A03A005B76.MOV';

async function testStructure() {
  console.log('Testing structure...');
  
  // Perform analysis
  const fullAnalysis = await performFullAnalysis(VIDEO_PATH);
  console.log('Full analysis complete');
  
  // Transcribe
  const transcription = await transcribeAudioFile(fullAnalysis.audioPath!);
  console.log('Transcription complete');
  
  // Prepare content for Gemini (simplified - just a few frames)
  const content: any[] = [
    { type: "text", text: "Analiza este vídeo. Responde en JSON con la estructura exacta especificada." }
  ];
  
  // Add just 3 frames for speed
  for (let i = 0; i < Math.min(3, fullAnalysis.frames.length); i++) {
    const frame = fullAnalysis.frames[i];
    const imageData = fs.readFileSync(frame.path);
    content.push({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${imageData.toString('base64')}`,
        detail: "low"
      }
    });
  }
  
  // Call Gemini with the same schema as the router
  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Eres un experto en análisis de vídeos virales. Responde SOLO con JSON válido." },
      { role: "user", content }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "video_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            frameByFrameAnalysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  frameNumber: { type: "number" },
                  timestamp: { type: "string" },
                  description: { type: "string" },
                  visualElements: { type: "array", items: { type: "string" } },
                  textOnScreen: { type: "string" },
                  emotionalTone: { type: "string" },
                  cameraMovement: { type: "string" },
                  editingTechnique: { type: "string" }
                },
                required: ["frameNumber", "timestamp", "description", "visualElements", "textOnScreen", "emotionalTone", "cameraMovement", "editingTechnique"],
                additionalProperties: false
              }
            },
            hookAnalysis: { type: "string" },
            editingAnalysis: { type: "string" },
            callToAction: {
              type: "object",
              properties: {
                detected: { type: "boolean" },
                timestamp: { type: "string" },
                type: { type: "string" },
                effectiveness: { type: "string" }
              },
              required: ["detected", "timestamp", "type", "effectiveness"],
              additionalProperties: false
            },
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
  
  console.log('\n=== RAW RESPONSE ===');
  const rawContent = response.choices[0].message.content;
  console.log('Type:', typeof rawContent);
  console.log('Content:', JSON.stringify(rawContent, null, 2).substring(0, 2000));
  
  // Parse
  let analysisData: any;
  if (typeof rawContent === 'string') {
    analysisData = JSON.parse(rawContent);
  } else {
    analysisData = rawContent;
  }
  
  console.log('\n=== PARSED STRUCTURE ===');
  console.log('structureBreakdown:', JSON.stringify(analysisData.structureBreakdown, null, 2));
  console.log('viralityFactors:', JSON.stringify(analysisData.viralityFactors, null, 2));
  console.log('overallScore:', analysisData.overallScore);
  console.log('hookScore:', analysisData.hookScore);
  console.log('pacingScore:', analysisData.pacingScore);
  console.log('engagementScore:', analysisData.engagementScore);
  
  // Cleanup
  cleanupAnalysis(fullAnalysis);
  
  console.log('\n=== TEST COMPLETE ===');
}

testStructure().catch(console.error);
