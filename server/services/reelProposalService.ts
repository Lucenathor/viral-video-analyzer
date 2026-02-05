/**
 * Reel Proposal Service
 * 
 * This service automatically proposes viral reels for different sectors
 * based on a methodology that analyzes:
 * 1. Engagement metrics (likes, comments, shares, views)
 * 2. Content relevance to each sector
 * 3. Trending patterns and hashtags
 * 4. Video quality indicators
 */

import { invokeLLM } from "../_core/llm";
import * as db from "../db";

// Sector definitions with keywords for searching
export const SECTOR_SEARCH_CONFIG = {
  'clinica-estetica': {
    name: 'Clínica Estética',
    keywords: ['botox', 'filler', 'tratamiento facial', 'medicina estética', 'rejuvenecimiento', 'ácido hialurónico', 'lifting', 'dermapen'],
    hashtags: ['#medicinaestetica', '#botox', '#filler', '#clinicaestetica', '#rejuvenecimiento', '#belleza'],
    minLikes: 10000,
    contentTypes: ['before_after', 'procedure', 'testimonial', 'educational']
  },
  'inmobiliaria': {
    name: 'Inmobiliaria',
    keywords: ['casa en venta', 'apartamento', 'inmueble', 'tour casa', 'home tour', 'real estate', 'propiedad'],
    hashtags: ['#inmobiliaria', '#casaenventa', '#realestate', '#hometour', '#propiedades'],
    minLikes: 5000,
    contentTypes: ['property_tour', 'tips', 'market_update', 'success_story']
  },
  'abogados': {
    name: 'Abogados',
    keywords: ['abogado', 'derecho', 'legal', 'consejo legal', 'demanda', 'herencia', 'divorcio'],
    hashtags: ['#abogado', '#derecho', '#legal', '#consejosjuridicos', '#ley'],
    minLikes: 3000,
    contentTypes: ['legal_tips', 'case_study', 'myth_busting', 'educational']
  },
  'marketing': {
    name: 'Agencias de Marketing',
    keywords: ['marketing digital', 'redes sociales', 'publicidad', 'growth', 'ads', 'estrategia digital'],
    hashtags: ['#marketingdigital', '#socialmedia', '#publicidad', '#growth', '#emprendimiento'],
    minLikes: 8000,
    contentTypes: ['tips', 'case_study', 'tutorial', 'trend_analysis']
  },
  'personal-trainer': {
    name: 'Personal Trainer',
    keywords: ['entrenamiento', 'fitness', 'gym', 'ejercicio', 'rutina', 'transformación', 'workout'],
    hashtags: ['#fitness', '#gym', '#entrenamiento', '#workout', '#transformacion', '#personaltrainer'],
    minLikes: 15000,
    contentTypes: ['workout', 'transformation', 'tips', 'motivation']
  },
  'manicura': {
    name: 'Manicura y Uñas',
    keywords: ['uñas', 'manicura', 'nail art', 'diseño uñas', 'acrílicas', 'gel', 'nail design'],
    hashtags: ['#nailart', '#manicura', '#uñas', '#naildesign', '#nails'],
    minLikes: 20000,
    contentTypes: ['design_showcase', 'tutorial', 'transformation', 'trend']
  },
  'micropigmentacion': {
    name: 'Micropigmentación',
    keywords: ['micropigmentación', 'cejas', 'microblading', 'labios', 'permanente', 'PMU'],
    hashtags: ['#micropigmentacion', '#microblading', '#cejas', '#pmu', '#permanentmakeup'],
    minLikes: 10000,
    contentTypes: ['before_after', 'procedure', 'healing_process', 'educational']
  },
  'peluqueria': {
    name: 'Peluquería',
    keywords: ['corte pelo', 'peinado', 'color pelo', 'barbería', 'hair transformation', 'balayage'],
    hashtags: ['#peluqueria', '#hairstyle', '#haircolor', '#barberia', '#hairtransformation'],
    minLikes: 15000,
    contentTypes: ['transformation', 'tutorial', 'trend', 'technique']
  },
  'restaurantes': {
    name: 'Restaurantes',
    keywords: ['comida', 'restaurante', 'chef', 'receta', 'cocina', 'plato', 'gastronomía'],
    hashtags: ['#restaurante', '#comida', '#chef', '#gastronomia', '#foodie', '#receta'],
    minLikes: 25000,
    contentTypes: ['food_porn', 'recipe', 'behind_scenes', 'review']
  },
  'coaches': {
    name: 'Coaches y Consultores',
    keywords: ['coach', 'mentoría', 'desarrollo personal', 'emprendimiento', 'negocio', 'éxito'],
    hashtags: ['#coach', '#mentoria', '#desarrollopersonal', '#emprendimiento', '#exito'],
    minLikes: 5000,
    contentTypes: ['tips', 'motivation', 'case_study', 'educational']
  }
};

export interface ReelProposal {
  tiktokId: string;
  tiktokUrl: string;
  authorUsername: string;
  title: string;
  coverUrl: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  suggestedSector: string;
  viralityScore: number;
  viralityExplanation: string;
  contentType: string;
  hashtags: string[];
}

/**
 * Calculate virality score based on engagement metrics
 */
export function calculateViralityScore(
  likes: number,
  comments: number,
  shares: number,
  views: number
): number {
  // Engagement rate calculation
  const engagementRate = views > 0 ? ((likes + comments * 2 + shares * 3) / views) * 100 : 0;
  
  // Base score from engagement rate (0-40 points)
  let score = Math.min(engagementRate * 4, 40);
  
  // Bonus for high absolute numbers (0-30 points)
  if (likes >= 100000) score += 15;
  else if (likes >= 50000) score += 10;
  else if (likes >= 10000) score += 5;
  
  if (views >= 1000000) score += 15;
  else if (views >= 500000) score += 10;
  else if (views >= 100000) score += 5;
  
  // Bonus for comment-to-like ratio (indicates discussion) (0-15 points)
  const commentRatio = likes > 0 ? comments / likes : 0;
  if (commentRatio > 0.1) score += 15;
  else if (commentRatio > 0.05) score += 10;
  else if (commentRatio > 0.02) score += 5;
  
  // Bonus for share-to-like ratio (indicates shareability) (0-15 points)
  const shareRatio = likes > 0 ? shares / likes : 0;
  if (shareRatio > 0.05) score += 15;
  else if (shareRatio > 0.02) score += 10;
  else if (shareRatio > 0.01) score += 5;
  
  return Math.min(Math.round(score), 100);
}

/**
 * Analyze a reel with AI to determine sector fit and virality factors
 */
export async function analyzeReelWithAI(
  reel: {
    title: string;
    description?: string;
    hashtags: string[];
    authorUsername: string;
    likes: number;
    comments: number;
    shares: number;
    views: number;
  }
): Promise<{
  suggestedSector: string;
  viralityExplanation: string;
  contentType: string;
  confidence: number;
}> {
  const sectorList = Object.entries(SECTOR_SEARCH_CONFIG)
    .map(([slug, config]) => `- ${slug}: ${config.name} (keywords: ${config.keywords.slice(0, 3).join(', ')})`)
    .join('\n');

  const prompt = `Analiza este reel de TikTok y determina:
1. A qué sector de negocio sería más útil para replicar
2. Por qué es viral (factores clave)
3. Qué tipo de contenido es

DATOS DEL REEL:
- Título/Descripción: ${reel.title || reel.description || 'Sin título'}
- Autor: @${reel.authorUsername}
- Hashtags: ${reel.hashtags.join(', ') || 'Ninguno'}
- Métricas: ${reel.likes.toLocaleString()} likes, ${reel.comments.toLocaleString()} comentarios, ${reel.shares.toLocaleString()} compartidos, ${reel.views.toLocaleString()} vistas

SECTORES DISPONIBLES:
${sectorList}

Responde en JSON con este formato exacto:
{
  "suggestedSector": "slug-del-sector",
  "viralityExplanation": "Explicación breve de por qué es viral y útil para el sector (máx 150 palabras)",
  "contentType": "tipo de contenido (ej: tutorial, transformation, tips, etc)",
  "confidence": 0.0-1.0
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'Eres un experto en marketing viral y contenido de redes sociales. Analiza reels y determina su potencial para diferentes sectores de negocio. Responde siempre en JSON válido.' },
        { role: 'user', content: prompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'reel_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              suggestedSector: { type: 'string', description: 'Slug del sector sugerido' },
              viralityExplanation: { type: 'string', description: 'Explicación de por qué es viral' },
              contentType: { type: 'string', description: 'Tipo de contenido' },
              confidence: { type: 'number', description: 'Nivel de confianza 0-1' }
            },
            required: ['suggestedSector', 'viralityExplanation', 'contentType', 'confidence'],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch (error) {
    console.error('[ReelProposal] AI analysis failed:', error);
    // Fallback to basic analysis
    return {
      suggestedSector: 'marketing',
      viralityExplanation: 'Contenido con alto engagement que podría ser adaptado para múltiples sectores.',
      contentType: 'general',
      confidence: 0.3
    };
  }
}

/**
 * Process and propose a reel for admin review
 */
export async function proposeReelForReview(
  reelData: {
    tiktokId: string;
    tiktokUrl: string;
    authorUsername?: string;
    authorName?: string;
    title?: string;
    description?: string;
    coverUrl?: string;
    videoUrl?: string;
    duration?: number;
    likes: number;
    comments: number;
    shares: number;
    views: number;
    hashtags?: string[];
    searchQuery?: string;
  }
): Promise<{ success: boolean; reelId?: number; message: string }> {
  try {
    // Calculate virality score
    const viralityScore = calculateViralityScore(
      reelData.likes,
      reelData.comments,
      reelData.shares,
      reelData.views
    );

    // Skip if virality score is too low
    if (viralityScore < 30) {
      return {
        success: false,
        message: `Reel descartado: score de viralidad muy bajo (${viralityScore}/100)`
      };
    }

    // Analyze with AI
    const aiAnalysis = await analyzeReelWithAI({
      title: reelData.title || reelData.description || '',
      description: reelData.description,
      hashtags: reelData.hashtags || [],
      authorUsername: reelData.authorUsername || 'unknown',
      likes: reelData.likes,
      comments: reelData.comments,
      shares: reelData.shares,
      views: reelData.views
    });

    // Create pending reel in database
    const reelId = await db.createPendingReel({
      tiktokId: reelData.tiktokId,
      tiktokUrl: reelData.tiktokUrl,
      authorUsername: reelData.authorUsername,
      authorName: reelData.authorName,
      title: reelData.title,
      description: reelData.description,
      coverUrl: reelData.coverUrl,
      videoUrl: reelData.videoUrl,
      duration: reelData.duration,
      likes: reelData.likes,
      comments: reelData.comments,
      shares: reelData.shares,
      views: reelData.views,
      suggestedSector: aiAnalysis.suggestedSector,
      viralityExplanation: aiAnalysis.viralityExplanation,
      viralityScore,
      contentAnalysis: {
        contentType: aiAnalysis.contentType,
        confidence: aiAnalysis.confidence,
        analyzedAt: new Date().toISOString()
      },
      hashtags: reelData.hashtags,
      searchQuery: reelData.searchQuery,
      status: 'pending'
    });

    return {
      success: true,
      reelId,
      message: `Reel propuesto para sector "${aiAnalysis.suggestedSector}" con score ${viralityScore}/100`
    };
  } catch (error) {
    console.error('[ReelProposal] Failed to propose reel:', error);
    return {
      success: false,
      message: `Error al proponer reel: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get search queries for a specific sector
 */
export function getSearchQueriesForSector(sectorSlug: string): string[] {
  const config = SECTOR_SEARCH_CONFIG[sectorSlug as keyof typeof SECTOR_SEARCH_CONFIG];
  if (!config) return [];

  const queries: string[] = [];
  
  // Add keyword-based queries
  config.keywords.forEach(keyword => {
    queries.push(keyword);
    queries.push(`${keyword} viral`);
  });

  // Add hashtag-based queries (without #)
  config.hashtags.forEach(hashtag => {
    queries.push(hashtag.replace('#', ''));
  });

  return queries;
}

/**
 * Get minimum likes threshold for a sector
 */
export function getMinLikesForSector(sectorSlug: string): number {
  const config = SECTOR_SEARCH_CONFIG[sectorSlug as keyof typeof SECTOR_SEARCH_CONFIG];
  return config?.minLikes || 5000;
}
