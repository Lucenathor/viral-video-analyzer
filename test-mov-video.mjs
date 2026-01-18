// Test with the user's MOV video
import { config } from 'dotenv';
import fs from 'fs';
config();

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

// Path to user's video
const userVideoPath = '/home/ubuntu/upload/copy_21FECC20-7C64-4BDF-A1D5-A8A03A005B76.MOV';

async function uploadToS3(buffer, fileKey, mimeType) {
  console.log(`Uploading to S3: ${fileKey} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
  
  const baseUrl = FORGE_API_URL.replace(/\/+$/, '') + '/';
  const uploadUrl = new URL('v1/storage/upload', baseUrl);
  uploadUrl.searchParams.set('path', fileKey);
  
  const blob = new Blob([buffer], { type: mimeType });
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
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  return result.url;
}

async function getDownloadUrl(fileKey) {
  const baseUrl = FORGE_API_URL.replace(/\/+$/, '') + '/';
  const downloadApiUrl = new URL('v1/storage/downloadUrl', baseUrl);
  downloadApiUrl.searchParams.set('path', fileKey);
  
  const response = await fetch(downloadApiUrl.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${FORGE_API_KEY}`,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Get download URL failed: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  return result.url;
}

async function analyzeWithLLM(videoUrl) {
  console.log('\nAnalyzing video with LLM...');
  
  const analysisPrompt = `Eres un experto en análisis de vídeos virales de redes sociales (Instagram Reels, TikTok, YouTube Shorts).

ANALIZA EL VÍDEO QUE TE PROPORCIONO y proporciona un análisis detallado basándote en LO QUE VES en el vídeo.

Debes analizar:
1. Los primeros 3 segundos (el "hook") - ¿Qué técnica usa para captar atención?
2. La estructura completa del vídeo - Divide en segmentos con timestamps reales
3. Los factores de viralidad - Puntúa cada aspecto del 0 al 100
4. Un resumen detallado de qué hace el vídeo y por qué funcionaría (o no) como contenido viral

Responde en formato JSON con esta estructura exacta.`;

  const payload = {
    model: 'gemini-2.5-flash',
    messages: [
      { role: "system", content: "Eres un experto analista de contenido viral. DEBES analizar el vídeo que se te proporciona y describir exactamente lo que ves. Responde siempre en español y en formato JSON válido." },
      { 
        role: "user", 
        content: [
          { type: "text", text: analysisPrompt },
          { 
            type: "file_url", 
            file_url: { 
              url: videoUrl,
              mime_type: "video/mp4"  // MOV is compatible with video/mp4
            } 
          }
        ]
      }
    ],
    max_tokens: 32768,
    thinking: { budget_tokens: 128 },
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
  return result.choices[0].message.content;
}

async function runTest() {
  try {
    console.log('=== USER MOV VIDEO TEST ===\n');
    
    // Check if file exists
    if (!fs.existsSync(userVideoPath)) {
      console.log('User video not found at:', userVideoPath);
      console.log('Listing /home/ubuntu/upload/...');
      const files = fs.readdirSync('/home/ubuntu/upload/');
      console.log('Files:', files);
      return;
    }
    
    // Read video file
    console.log('Reading video file...');
    const videoBuffer = fs.readFileSync(userVideoPath);
    console.log(`Video size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    // Upload to S3
    const fileKey = `test/user-video-test-${Date.now()}.mov`;
    const uploadedUrl = await uploadToS3(videoBuffer, fileKey, 'video/quicktime');
    console.log('Uploaded URL:', uploadedUrl);
    
    // Get download URL
    const downloadUrl = await getDownloadUrl(fileKey);
    console.log('Download URL:', downloadUrl);
    
    // Analyze with LLM
    const content = await analyzeWithLLM(downloadUrl);
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
    
    console.log('\n✅ USER VIDEO TEST PASSED!');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  }
}

runTest();
