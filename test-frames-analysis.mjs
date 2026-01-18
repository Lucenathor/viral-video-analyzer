// Test video analysis using extracted frames
import { config } from 'dotenv';
import fs from 'fs';
config();

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

async function uploadFrame(framePath, fileKey) {
  const buffer = fs.readFileSync(framePath);
  
  const baseUrl = FORGE_API_URL.replace(/\/+$/, '') + '/';
  const uploadUrl = new URL('v1/storage/upload', baseUrl);
  uploadUrl.searchParams.set('path', fileKey);
  
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('file', blob, fileKey.split('/').pop());
  
  const response = await fetch(uploadUrl.toString(), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
  
  const result = await response.json();
  return result.url;
}

async function analyzeWithFrames(frameUrls) {
  console.log('\nAnalyzing video using', frameUrls.length, 'frames...');
  
  // Build content array with all frames
  const content = [
    { 
      type: 'text', 
      text: `Eres un experto en análisis de vídeos virales de redes sociales (Instagram Reels, TikTok, YouTube Shorts).

Te proporciono ${frameUrls.length} frames extraídos de un vídeo (1 frame por segundo). ANALIZA estos frames para entender el contenido del vídeo completo.

Debes analizar:
1. Los primeros 3 segundos (frames 1-3) - ¿Qué técnica usa para captar atención?
2. La estructura completa del vídeo - Divide en segmentos basándote en los cambios visuales
3. Los factores de viralidad - Puntúa cada aspecto del 0 al 100
4. Un resumen detallado de qué hace el vídeo y por qué funcionaría (o no) como contenido viral

Responde en formato JSON.`
    }
  ];
  
  // Add all frames as images
  for (let i = 0; i < frameUrls.length; i++) {
    content.push({
      type: 'image_url',
      image_url: { url: frameUrls[i], detail: 'low' }
    });
  }
  
  const payload = {
    model: 'gemini-2.5-flash',
    messages: [
      { role: 'system', content: 'Eres un experto analista de contenido viral. Analiza los frames del vídeo y describe lo que ves. Responde en español y en formato JSON.' },
      { role: 'user', content }
    ],
    max_tokens: 4096,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'viral_analysis',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            hookAnalysis: { type: 'string' },
            structureBreakdown: {
              type: 'object',
              properties: {
                segments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      startTime: { type: 'number' },
                      endTime: { type: 'number' },
                      type: { type: 'string' },
                      description: { type: 'string' }
                    },
                    required: ['startTime', 'endTime', 'type', 'description'],
                    additionalProperties: false
                  }
                }
              },
              required: ['segments'],
              additionalProperties: false
            },
            viralityFactors: {
              type: 'object',
              properties: {
                factors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      score: { type: 'number' },
                      description: { type: 'string' }
                    },
                    required: ['name', 'score', 'description'],
                    additionalProperties: false
                  }
                }
              },
              required: ['factors'],
              additionalProperties: false
            },
            summary: { type: 'string' },
            overallScore: { type: 'number' },
            hookScore: { type: 'number' },
            pacingScore: { type: 'number' },
            engagementScore: { type: 'number' }
          },
          required: ['hookAnalysis', 'structureBreakdown', 'viralityFactors', 'summary', 'overallScore', 'hookScore', 'pacingScore', 'engagementScore'],
          additionalProperties: false
        }
      }
    }
  };
  
  const response = await fetch(`${FORGE_API_URL.replace(/\/$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  
  console.log('LLM Response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM failed: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  if (result.error) {
    throw new Error(`LLM error: ${result.error.message}`);
  }
  
  return result.choices[0].message.content;
}

async function runTest() {
  try {
    console.log('=== FRAME-BASED VIDEO ANALYSIS TEST ===\n');
    
    // Upload frames to S3
    const frameUrls = [];
    const framesDir = '/tmp/frames';
    const files = fs.readdirSync(framesDir).filter(f => f.endsWith('.jpg')).sort();
    
    console.log(`Uploading ${files.length} frames to S3...`);
    
    for (const file of files) {
      const framePath = `${framesDir}/${file}`;
      const fileKey = `test/frames-${Date.now()}/${file}`;
      const url = await uploadFrame(framePath, fileKey);
      frameUrls.push(url);
      console.log(`  Uploaded: ${file}`);
    }
    
    // Analyze with LLM
    const content = await analyzeWithFrames(frameUrls);
    const analysisData = JSON.parse(typeof content === 'string' ? content : '{}');
    
    console.log('\n=== ANALYSIS RESULT ===');
    console.log('Overall Score:', analysisData.overallScore);
    console.log('Hook Score:', analysisData.hookScore);
    console.log('Pacing Score:', analysisData.pacingScore);
    console.log('Engagement Score:', analysisData.engagementScore);
    
    console.log('\nHook Analysis:');
    console.log(analysisData.hookAnalysis);
    
    console.log('\nSummary:');
    console.log(analysisData.summary);
    
    console.log('\n✅ FRAME-BASED ANALYSIS TEST PASSED!');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  }
}

runTest();
