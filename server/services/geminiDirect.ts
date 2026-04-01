/**
 * Direct Gemini API integration for video analysis.
 * Bypasses the Forge LLM proxy to avoid 503/timeout errors.
 * Uses @google/genai SDK with Gemini 2.5 Flash for video understanding.
 */
import { GoogleGenAI, Type } from "@google/genai";
import { ENV } from "../_core/env";

const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VideoAnalysisResult {
  score: number;
  hookScore: number;
  ritmoScore: number;
  engagementScore: number;
  subtitulosScore: number;
  cortesScore: number;
  hookAnalysis: string;
  subtitulosAnalysis: string;
  ritmoAnalysis: string;
  contenidoAnalysis: string;
  visualAnalysis: string;
  ctaAnalysis: string;
}

export interface VideoComparisonResult {
  similarityScore: number;
  generalVerdict: string;
  scores: {
    general: number;
    hook: number;
    ritmo: number;
    engagement: number;
    subtitulos: number;
    cortes: number;
    viralGeneral: number;
    viralHook: number;
    viralRitmo: number;
    viralEngagement: number;
  };
  hookComparison: {
    viralDoes: string;
    yourVideo: string;
    whatsMissing: string;
    howToFix: string;
  };
  subtitulosComparison: {
    viralDoes: string;
    yourVideo: string;
    whatsMissing: string;
    howToFix: string;
  };
  ritmoComparison: {
    viralDoes: string;
    yourVideo: string;
    whatsMissing: string;
    howToFix: string;
  };
  contenidoComparison: {
    viralDoes: string;
    yourVideo: string;
    whatsMissing: string;
    howToFix: string;
  };
  visualComparison: {
    viralDoes: string;
    yourVideo: string;
    whatsMissing: string;
    howToFix: string;
  };
  ctaComparison: {
    viralDoes: string;
    yourVideo: string;
    whatsMissing: string;
    howToFix: string;
  };
  topCorrections: Array<{
    priority: number;
    category: string;
    correction: string;
    timestamp: string;
  }>;
  whatWorksWell: string[];
}

// ─── Analysis Schemas ───────────────────────────────────────────────────────

const videoAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "Overall viral score 0-100" },
    hookScore: { type: Type.NUMBER, description: "Hook effectiveness 0-100" },
    ritmoScore: { type: Type.NUMBER, description: "Pacing/editing rhythm 0-100" },
    engagementScore: { type: Type.NUMBER, description: "Engagement potential 0-100" },
    subtitulosScore: { type: Type.NUMBER, description: "Subtitles/text overlay quality 0-100" },
    cortesScore: { type: Type.NUMBER, description: "Cuts/transitions quality 0-100" },
    hookAnalysis: { type: Type.STRING, description: "Detailed hook analysis (first 3 seconds)" },
    subtitulosAnalysis: { type: Type.STRING, description: "Detailed subtitles/text overlay analysis" },
    ritmoAnalysis: { type: Type.STRING, description: "Detailed pacing and cuts analysis" },
    contenidoAnalysis: { type: Type.STRING, description: "Content and message analysis" },
    visualAnalysis: { type: Type.STRING, description: "Visual production quality analysis" },
    ctaAnalysis: { type: Type.STRING, description: "Call to action analysis" },
  },
  required: ["score", "hookScore", "ritmoScore", "engagementScore", "subtitulosScore", "cortesScore",
    "hookAnalysis", "subtitulosAnalysis", "ritmoAnalysis", "contenidoAnalysis", "visualAnalysis", "ctaAnalysis"],
};

const comparisonItemSchema = {
  type: Type.OBJECT,
  properties: {
    viralDoes: { type: Type.STRING, description: "What the viral video does in this category" },
    yourVideo: { type: Type.STRING, description: "What the user's video does" },
    whatsMissing: { type: Type.STRING, description: "What's missing or different" },
    howToFix: { type: Type.STRING, description: "Specific actionable correction with timestamps" },
  },
  required: ["viralDoes", "yourVideo", "whatsMissing", "howToFix"],
};

const correctionSchema = {
  type: Type.OBJECT,
  properties: {
    priority: { type: Type.NUMBER, description: "Priority 1-7 (1 = highest)" },
    category: { type: Type.STRING, description: "Category: HOOK, SUBTITULOS, RITMO, CONTENIDO, VISUAL, CTA" },
    correction: { type: Type.STRING, description: "Specific correction with exact timestamp and action" },
    timestamp: { type: Type.STRING, description: "Timestamp where to apply (e.g. '0:00-0:03')" },
  },
  required: ["priority", "category", "correction", "timestamp"],
};

const comparisonSchema = {
  type: Type.OBJECT,
  properties: {
    similarityScore: { type: Type.NUMBER, description: "Similarity score 0-100" },
    generalVerdict: { type: Type.STRING, description: "General verdict paragraph in Spanish" },
    scores: {
      type: Type.OBJECT,
      properties: {
        general: { type: Type.NUMBER },
        hook: { type: Type.NUMBER },
        ritmo: { type: Type.NUMBER },
        engagement: { type: Type.NUMBER },
        subtitulos: { type: Type.NUMBER },
        cortes: { type: Type.NUMBER },
        viralGeneral: { type: Type.NUMBER },
        viralHook: { type: Type.NUMBER },
        viralRitmo: { type: Type.NUMBER },
        viralEngagement: { type: Type.NUMBER },
      },
      required: ["general", "hook", "ritmo", "engagement", "subtitulos", "cortes",
        "viralGeneral", "viralHook", "viralRitmo", "viralEngagement"],
    },
    hookComparison: comparisonItemSchema,
    subtitulosComparison: comparisonItemSchema,
    ritmoComparison: comparisonItemSchema,
    contenidoComparison: comparisonItemSchema,
    visualComparison: comparisonItemSchema,
    ctaComparison: comparisonItemSchema,
    topCorrections: { type: Type.ARRAY, items: correctionSchema },
    whatWorksWell: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["similarityScore", "generalVerdict", "scores",
    "hookComparison", "subtitulosComparison", "ritmoComparison",
    "contenidoComparison", "visualComparison", "ctaComparison",
    "topCorrections", "whatWorksWell"],
};

// ─── Prompts ────────────────────────────────────────────────────────────────

const ANALYZE_VIDEO_PROMPT = `Eres un experto mundial en vídeos virales de Instagram Reels y TikTok. Analiza este vídeo en profundidad.

ANALIZA CADA DETALLE:
1. HOOK (primeros 3 segundos): ¿Qué aparece en el primer frame? ¿Hay texto? ¿Pattern interrupt? ¿Emoción? ¿Promesa?
2. SUBTÍTULOS/TEXTO: ¿Hay texto superpuesto? ¿Estilo? ¿Colores? ¿Animaciones? ¿Legibilidad? ¿Palabras clave resaltadas?
3. RITMO Y CORTES: ¿Cuántos cortes hay? ¿Duración media de cada plano? ¿Hay zooms, glitches, transiciones?
4. CONTENIDO: ¿Cuál es el mensaje? ¿Estructura problema-solución? ¿Autoridad? ¿Prueba social?
5. VISUAL: ¿Formato? ¿Iluminación? ¿Encuadre? ¿Calidad? ¿Estética?
6. CTA: ¿Hay llamada a la acción? ¿Cuándo aparece? ¿Es efectiva?

Sé MUY específico con timestamps (0:00, 0:01, 0:02...) y detalles visuales exactos.
Responde SIEMPRE en español.`;

function buildComparisonPrompt(viralAnalysis: string, userAnalysis: string): string {
  return `Eres un experto mundial en vídeos virales. Has analizado dos vídeos por separado. Ahora compáralos.

=== ANÁLISIS DEL VÍDEO VIRAL (REFERENCIA) ===
${viralAnalysis}

=== ANÁLISIS DEL VÍDEO DEL USUARIO ===
${userAnalysis}

INSTRUCCIONES DE COMPARACIÓN:
1. Compara CADA categoría: Hook, Subtítulos, Ritmo/Cortes, Contenido, Visual, CTA
2. Para cada categoría explica: qué hace el viral, qué hace el usuario, qué falta, cómo corregirlo con timestamps exactos
3. Da un score de similitud 0-100 (100 = idéntico)
4. Lista las 7 correcciones más importantes ordenadas por prioridad
5. Lista 3-5 cosas que el usuario ya hace bien

Sé EXTREMADAMENTE específico. Usa timestamps exactos. Cada corrección debe ser accionable.
El veredicto general debe ser un párrafo completo explicando la comparación.
Responde SIEMPRE en español.`;
}

// ─── API Functions ──────────────────────────────────────────────────────────

/**
 * Analyze a single video using Gemini 2.5 Flash with file_url.
 * Returns structured analysis with scores and detailed text.
 */
export async function analyzeVideoWithGemini(
  videoUrl: string,
  mimeType: string = "video/mp4"
): Promise<VideoAnalysisResult> {
  console.log(`[GeminiDirect] Analyzing video: ${videoUrl.substring(0, 80)}...`);
  const start = Date.now();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { fileData: { fileUri: videoUrl, mimeType } },
          { text: ANALYZE_VIDEO_PROMPT },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: videoAnalysisSchema,
    },
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[GeminiDirect] Video analyzed in ${elapsed}s`);

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned empty response for video analysis");
  }

  const parsed = JSON.parse(text) as VideoAnalysisResult;
  console.log(`[GeminiDirect] Score: ${parsed.score}, Hook: ${parsed.hookScore}`);
  return parsed;
}

/**
 * Compare two videos by combining their individual analyses.
 * Uses text-only comparison (no file_url limit issue).
 */
export async function compareVideosWithGemini(
  viralAnalysisText: string,
  userAnalysisText: string
): Promise<VideoComparisonResult> {
  console.log(`[GeminiDirect] Running comparison...`);
  const start = Date.now();

  const prompt = buildComparisonPrompt(viralAnalysisText, userAnalysisText);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: comparisonSchema,
    },
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[GeminiDirect] Comparison done in ${elapsed}s`);

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned empty response for comparison");
  }

  const parsed = JSON.parse(text) as VideoComparisonResult;
  console.log(`[GeminiDirect] Similarity: ${parsed.similarityScore}`);
  return parsed;
}

/**
 * Format a VideoAnalysisResult into a text summary for comparison input.
 */
export function formatAnalysisForComparison(analysis: VideoAnalysisResult): string {
  return `Score General: ${analysis.score}/100
Hook: ${analysis.hookScore}/100 - ${analysis.hookAnalysis}
Subtítulos: ${analysis.subtitulosScore}/100 - ${analysis.subtitulosAnalysis}
Ritmo/Cortes: ${analysis.ritmoScore}/100 - ${analysis.ritmoAnalysis}
Contenido: ${analysis.contenidoAnalysis}
Visual: ${analysis.visualAnalysis}
CTA: ${analysis.ctaAnalysis}`;
}
