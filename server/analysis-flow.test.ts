import { describe, expect, it } from "vitest";
import { invokeLLM } from "./_core/llm";

describe("Analysis Flow", () => {
  it("should successfully call LLM with full analysis schema", async () => {
    const analysisPrompt = `Eres un experto en análisis de vídeos virales de redes sociales. Analiza este vídeo y proporciona un análisis detallado en formato JSON.

INFORMACIÓN DEL VÍDEO:
- Nombre del archivo: test-video.mp4
- Tipo: video/mp4
- URL: https://example.com/test-video.mp4

El vídeo ha sido subido y necesito que analices su potencial viral basándote en las mejores prácticas de contenido viral en Instagram Reels y TikTok.

Proporciona tu análisis en el siguiente formato JSON exacto:
{
  "hookAnalysis": "Análisis detallado del hook (primeros 3 segundos).",
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
  "summary": "Resumen completo de 2-3 párrafos.",
  "overallScore": 84,
  "hookScore": 85,
  "pacingScore": 78,
  "engagementScore": 88
}

Responde SOLO con el JSON, sin texto adicional.`;

    console.log('[Test] Calling LLM with full analysis schema...');
    
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Eres un experto analista de contenido viral. Responde siempre en español y en formato JSON válido." },
        { role: "user", content: analysisPrompt }
      ],
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
    });

    console.log('[Test] LLM response received');
    console.log('[Test] Response:', JSON.stringify(response, null, 2));
    
    expect(response.choices).toBeDefined();
    expect(response.choices[0]).toBeDefined();
    expect(response.choices[0].message).toBeDefined();
    expect(response.choices[0].message.content).toBeDefined();
    
    const content = response.choices[0].message.content;
    console.log('[Test] Content:', content);
    
    const analysisData = JSON.parse(typeof content === 'string' ? content : '{}');
    console.log('[Test] Parsed analysis:', JSON.stringify(analysisData, null, 2));
    
    expect(analysisData.hookAnalysis).toBeDefined();
    expect(analysisData.structureBreakdown).toBeDefined();
    expect(analysisData.viralityFactors).toBeDefined();
    expect(analysisData.summary).toBeDefined();
    expect(analysisData.overallScore).toBeDefined();
  }, 60000);
});
