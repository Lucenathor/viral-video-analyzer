// Test script to analyze video directly using the uploaded S3 URL
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.im';
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_API_KEY) {
  console.error('BUILT_IN_FORGE_API_KEY not set');
  process.exit(1);
}

const VIDEO_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663288181369/lsTZUltsLMvbzDoc.MOV';

async function analyzeVideo() {
  console.log('Starting video analysis test...');
  console.log('Video URL:', VIDEO_URL);
  
  const analysisPrompt = `Eres un experto en análisis de vídeos virales de redes sociales. Analiza este vídeo y proporciona un análisis detallado en formato JSON.

El vídeo ha sido subido y necesito que analices su potencial viral basándote en las mejores prácticas de contenido viral en Instagram Reels y TikTok.

Proporciona tu análisis en el siguiente formato JSON exacto:
{
  "hookAnalysis": "Análisis detallado del hook (primeros 3 segundos). Describe qué técnica usa para captar atención, si hay texto en pantalla, movimiento de cámara, expresión facial, etc.",
  "structureBreakdown": {
    "segments": [
      {
        "startTime": 0,
        "endTime": 3,
        "type": "Hook",
        "description": "Descripción de lo que ocurre en este segmento"
      }
    ]
  },
  "viralityFactors": {
    "factors": [
      {
        "name": "Hook Efectivo",
        "score": 85,
        "description": "Explicación de por qué el hook funciona o no"
      }
    ]
  },
  "summary": "Resumen completo de 2-3 párrafos explicando qué hace el vídeo, por qué funciona, y las técnicas específicas que lo hacen viral.",
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
      { 
        role: "user", 
        content: [
          {
            type: "file_url",
            file_url: {
              url: VIDEO_URL,
              mime_type: "video/mp4"
            }
          },
          {
            type: "text",
            text: analysisPrompt
          }
        ]
      }
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

  console.log('Calling LLM API with video file...');
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('\n=== Full LLM Response ===');
    console.log(JSON.stringify(result, null, 2));
    
    const content = result.choices?.[0]?.message?.content;
    if (content) {
      console.log('\n=== Analysis Content ===');
      console.log(content);
      
      // Parse and validate
      try {
        const analysis = JSON.parse(content);
        console.log('\n=== Parsed Analysis ===');
        console.log('Hook Score:', analysis.hookScore);
        console.log('Pacing Score:', analysis.pacingScore);
        console.log('Engagement Score:', analysis.engagementScore);
        console.log('Overall Score:', analysis.overallScore);
        console.log('Summary:', analysis.summary?.substring(0, 200) + '...');
        console.log('\n✅ Analysis successful!');
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError.message);
      }
    } else {
      console.log('No content in response');
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

analyzeVideo();
