// Test LLM analysis without video file
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.im';
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_API_KEY) {
  console.error('BUILT_IN_FORGE_API_KEY not set');
  process.exit(1);
}

async function testLLMAnalysis() {
  console.log('Testing LLM analysis...');
  
  const analysisPrompt = `Eres un experto en análisis de vídeos virales de redes sociales. Analiza este vídeo y proporciona un análisis detallado en formato JSON.

INFORMACIÓN DEL VÍDEO:
- Nombre del archivo: test-video.mov
- Tipo: video/quicktime
- URL: https://example.com/video.mov

El vídeo ha sido subido y necesito que analices su potencial viral basándote en las mejores prácticas de contenido viral en Instagram Reels y TikTok.

Proporciona tu análisis en el siguiente formato JSON exacto:
{
  "hookAnalysis": "Análisis detallado del hook",
  "structureBreakdown": {
    "segments": [
      {
        "startTime": 0,
        "endTime": 3,
        "type": "Hook",
        "description": "Descripción"
      }
    ]
  },
  "viralityFactors": {
    "factors": [
      {
        "name": "Hook Efectivo",
        "score": 85,
        "description": "Explicación"
      }
    ]
  },
  "summary": "Resumen completo",
  "overallScore": 84,
  "hookScore": 85,
  "pacingScore": 78,
  "engagementScore": 88
}

Responde SOLO con el JSON, sin texto adicional.`;

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

  console.log('Calling LLM API...');
  const startTime = Date.now();
  
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
    console.log(`Response received in ${elapsed}ms`);
    console.log('Status:', response.status, response.statusText);

    const result = await response.json();
    console.log('\n=== Full Response ===');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.choices?.[0]?.message?.content) {
      const content = result.choices[0].message.content;
      console.log('\n=== Content ===');
      console.log(content);
      
      const analysis = JSON.parse(content);
      console.log('\n=== Parsed ===');
      console.log('Overall Score:', analysis.overallScore);
      console.log('✅ SUCCESS!');
    } else {
      console.log('No content in response');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testLLMAnalysis();
