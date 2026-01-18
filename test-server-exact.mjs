// Test exactly what the server does
import { config } from 'dotenv';
config();

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

// Use the URL from a previously uploaded video
const videoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663288181369/YpkX7UBRCFyoNjYW5eCLWn/test/video-test-1768778364914.mp4';

async function testServerExact() {
  console.log('=== Testing exact server LLM call ===\n');
  console.log('Video URL:', videoUrl);
  
  const llmMimeType = "video/mp4";
  
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
              mime_type: llmMimeType
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
  
  console.log('\nCalling LLM...');
  
  const response = await fetch(`${FORGE_API_URL.replace(/\/$/, '')}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  
  console.log('Response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error:', errorText);
    return;
  }
  
  const result = await response.json();
  const content = result.choices[0].message.content;
  const analysisData = JSON.parse(typeof content === 'string' ? content : '{}');
  
  console.log('\n=== ANALYSIS RESULT ===');
  console.log('Overall Score:', analysisData.overallScore);
  console.log('Hook Score:', analysisData.hookScore);
  console.log('\nHook Analysis (first 300 chars):');
  console.log(analysisData.hookAnalysis?.substring(0, 300) + '...');
  
  console.log('\nSummary (first 500 chars):');
  console.log(analysisData.summary?.substring(0, 500) + '...');
  
  // Check if it mentions specific content from the Chromecast video
  const mentionsSpecific = 
    analysisData.hookAnalysis?.toLowerCase().includes('chromecast') ||
    analysisData.hookAnalysis?.toLowerCase().includes('hbo') ||
    analysisData.hookAnalysis?.toLowerCase().includes('tablet') ||
    analysisData.hookAnalysis?.toLowerCase().includes('dragon') ||
    analysisData.summary?.toLowerCase().includes('chromecast') ||
    analysisData.summary?.toLowerCase().includes('hbo') ||
    analysisData.summary?.toLowerCase().includes('game of thrones');
  
  console.log('\n=== VERIFICATION ===');
  console.log('Mentions specific video content:', mentionsSpecific ? '✅ YES' : '❌ NO');
  
  if (mentionsSpecific) {
    console.log('\n✅ SERVER FLOW TEST PASSED!');
  } else {
    console.log('\n❌ SERVER FLOW TEST FAILED - LLM did not analyze the actual video');
  }
}

testServerExact();
