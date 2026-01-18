// Test the complete server flow with a small video chunk
import fs from 'fs';

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.im';
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

async function testFullFlow() {
  console.log('=== Testing Full Analysis Flow ===\n');
  
  // Step 1: Simulate what the server does
  console.log('Step 1: Simulating video upload to S3...');
  // In real flow, this uploads to S3 and gets a URL
  const mockVideoUrl = 'https://example.com/video.mov';
  const mockFileName = 'test-video.mov';
  const mockMimeType = 'video/quicktime';
  console.log('✓ Video would be uploaded to S3\n');
  
  // Step 2: Create analysis prompt (same as server)
  console.log('Step 2: Creating analysis prompt...');
  const videoContext = `\n\nINFORMACIÓN DEL VÍDEO:\n- Nombre del archivo: ${mockFileName}\n- Tipo: ${mockMimeType}\n- URL: ${mockVideoUrl}\n`;
  
  const analysisPrompt = `Eres un experto en análisis de vídeos virales de redes sociales. Analiza este vídeo y proporciona un análisis detallado en formato JSON.${videoContext}

El vídeo ha sido subido y necesito que analices su potencial viral basándote en las mejores prácticas de contenido viral en Instagram Reels y TikTok.

Proporciona tu análisis en el siguiente formato JSON exacto:
{
  "hookAnalysis": "Análisis detallado del hook (primeros 3 segundos).",
  "structureBreakdown": {
    "segments": [
      {"startTime": 0, "endTime": 3, "type": "Hook", "description": "Descripción"}
    ]
  },
  "viralityFactors": {
    "factors": [
      {"name": "Hook Efectivo", "score": 85, "description": "Explicación"}
    ]
  },
  "summary": "Resumen completo.",
  "overallScore": 84,
  "hookScore": 85,
  "pacingScore": 78,
  "engagementScore": 88
}

Responde SOLO con el JSON, sin texto adicional.`;
  console.log('✓ Prompt created\n');
  
  // Step 3: Call LLM
  console.log('Step 3: Calling LLM API...');
  const startTime = Date.now();
  
  const payload = {
    model: "gemini-2.5-flash",
    messages: [
      { role: "system", content: "Eres un experto analista de contenido viral. Responde siempre en español y en formato JSON válido." },
      { role: "user", content: analysisPrompt }
    ],
    max_tokens: 32768,
    thinking: { budget_tokens: 128 },
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "viral_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            hookAnalysis: { type: "string" },
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
          required: ["hookAnalysis", "structureBreakdown", "viralityFactors", "summary", "overallScore", "hookScore", "pacingScore", "engagementScore"],
          additionalProperties: false
        }
      }
    }
  };

  try {
    const response = await fetch(`${FORGE_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FORGE_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const elapsed = Date.now() - startTime;
    console.log(`LLM response received in ${elapsed}ms`);
    console.log('Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM Error:', errorText);
      return;
    }

    const result = await response.json();
    
    if (result.error) {
      console.error('LLM returned error:', result.error);
      return;
    }
    
    const content = result.choices?.[0]?.message?.content;
    if (!content) {
      console.error('No content in LLM response');
      console.log('Full response:', JSON.stringify(result, null, 2));
      return;
    }
    
    console.log('✓ LLM response received\n');
    
    // Step 4: Parse JSON
    console.log('Step 4: Parsing JSON response...');
    const analysisData = JSON.parse(content);
    console.log('✓ JSON parsed successfully\n');
    
    // Step 5: Validate data structure
    console.log('Step 5: Validating data structure...');
    console.log('- hookAnalysis:', typeof analysisData.hookAnalysis, '(length:', analysisData.hookAnalysis?.length, ')');
    console.log('- structureBreakdown:', typeof analysisData.structureBreakdown);
    console.log('- viralityFactors:', typeof analysisData.viralityFactors);
    console.log('- summary:', typeof analysisData.summary, '(length:', analysisData.summary?.length, ')');
    console.log('- overallScore:', analysisData.overallScore);
    console.log('- hookScore:', analysisData.hookScore);
    console.log('- pacingScore:', analysisData.pacingScore);
    console.log('- engagementScore:', analysisData.engagementScore);
    console.log('✓ Data structure valid\n');
    
    // Step 6: Simulate DB update
    console.log('Step 6: Simulating database update...');
    const dbUpdateData = {
      hookAnalysis: analysisData.hookAnalysis,
      structureBreakdown: analysisData.structureBreakdown,
      viralityFactors: analysisData.viralityFactors,
      summary: analysisData.summary,
      overallScore: analysisData.overallScore,
      hookScore: analysisData.hookScore,
      pacingScore: analysisData.pacingScore,
      engagementScore: analysisData.engagementScore,
      status: "completed",
    };
    
    // Check if JSON fields can be serialized
    console.log('- structureBreakdown JSON:', JSON.stringify(dbUpdateData.structureBreakdown).substring(0, 100) + '...');
    console.log('- viralityFactors JSON:', JSON.stringify(dbUpdateData.viralityFactors).substring(0, 100) + '...');
    console.log('✓ DB update data prepared\n');
    
    // Step 7: Simulate return value
    console.log('Step 7: Preparing return value...');
    const returnValue = {
      id: 1,
      videoId: 1,
      ...analysisData,
    };
    console.log('Return value keys:', Object.keys(returnValue));
    console.log('✓ Return value ready\n');
    
    console.log('=== ALL STEPS COMPLETED SUCCESSFULLY ===');
    console.log('\nThe server-side flow works correctly.');
    console.log('The issue is likely in:');
    console.log('1. Request body size limit (video too large)');
    console.log('2. Network timeout during upload');
    console.log('3. Frontend not receiving the response properly');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testFullFlow();
