/**
 * Viral Reel Finder Service
 * Automatically searches for viral reels across sectors and adds them to the pending queue
 */

import { searchTikTokVideos, TikTokVideo } from './tiktokService';
import { invokeLLM } from '../_core/llm';
import * as db from '../db';

// Sector-specific search keywords
const SECTOR_KEYWORDS: Record<string, string[]> = {
  'clinica-estetica': [
    'clinica estetica viral',
    'botox viral',
    'tratamiento facial viral',
    'antes y despues estetica',
    'medicina estetica',
    'rejuvenecimiento facial',
    'acido hialuronico',
  ],
  'inmobiliaria': [
    'inmobiliaria viral',
    'vender casa viral',
    'agente inmobiliario',
    'tour casa viral',
    'real estate viral',
    'home tour',
    'property tour',
  ],
  'abogados': [
    'abogado viral',
    'consejos legales viral',
    'lawyer viral',
    'legal tips',
    'derecho viral',
    'abogado tiktok',
  ],
  'marketing': [
    'marketing viral',
    'marketing tips',
    'social media tips',
    'estrategia marketing',
    'growth hacking',
    'marketing digital',
  ],
  'personal-trainer': [
    'entrenador personal viral',
    'fitness viral',
    'gym motivation',
    'workout viral',
    'personal trainer tips',
    'ejercicio viral',
  ],
  'manicura': [
    'manicura viral',
    'nail art viral',
    'uñas viral',
    'nail design',
    'manicure viral',
    'nail tutorial',
  ],
  'micropigmentacion': [
    'micropigmentacion viral',
    'microblading viral',
    'cejas perfectas',
    'permanent makeup',
    'micropigmentacion cejas',
  ],
  'peluqueria': [
    'peluqueria viral',
    'corte de pelo viral',
    'hair transformation',
    'barberia viral',
    'haircut viral',
    'hair color viral',
  ],
  'restaurantes': [
    'restaurante viral',
    'comida viral',
    'food viral',
    'chef viral',
    'receta viral',
    'cocina viral',
  ],
  'coaches': [
    'coach viral',
    'coaching viral',
    'motivacion viral',
    'desarrollo personal',
    'life coach',
    'business coach',
  ],
};

// Minimum engagement thresholds for viral content
const VIRAL_THRESHOLDS = {
  minLikes: 5000,
  minViews: 50000,
  minEngagementRate: 0.03, // 3% engagement rate
};

export interface ViralReelCandidate {
  tiktokId: string;
  tiktokUrl: string;
  authorUsername: string;
  authorName: string;
  title: string;
  description: string;
  coverUrl: string;
  videoUrl: string;
  duration: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  hashtags: string[];
  suggestedSector: string;
  viralityScore: number;
  viralityExplanation: string;
}

/**
 * Calculate virality score based on engagement metrics
 */
function calculateViralityScore(video: TikTokVideo): number {
  const { likeCount, commentCount, shareCount, playCount } = video.stats;
  
  // Engagement rate
  const engagementRate = playCount > 0 
    ? (likeCount + commentCount * 2 + shareCount * 3) / playCount 
    : 0;
  
  // Base score from engagement rate (0-40 points)
  let score = Math.min(40, engagementRate * 1000);
  
  // Bonus for high absolute numbers (0-30 points)
  if (likeCount > 100000) score += 15;
  else if (likeCount > 50000) score += 10;
  else if (likeCount > 10000) score += 5;
  
  if (playCount > 1000000) score += 15;
  else if (playCount > 500000) score += 10;
  else if (playCount > 100000) score += 5;
  
  // Bonus for share ratio (0-15 points) - shares indicate high value content
  const shareRatio = likeCount > 0 ? shareCount / likeCount : 0;
  score += Math.min(15, shareRatio * 100);
  
  // Bonus for comment ratio (0-15 points) - comments indicate engagement
  const commentRatio = likeCount > 0 ? commentCount / likeCount : 0;
  score += Math.min(15, commentRatio * 50);
  
  return Math.min(100, Math.round(score));
}

/**
 * Check if a video meets viral thresholds
 */
function isViral(video: TikTokVideo): boolean {
  const { likeCount, playCount } = video.stats;
  
  if (likeCount < VIRAL_THRESHOLDS.minLikes) return false;
  if (playCount < VIRAL_THRESHOLDS.minViews) return false;
  
  const engagementRate = playCount > 0 
    ? (likeCount + video.stats.commentCount + video.stats.shareCount) / playCount 
    : 0;
  
  return engagementRate >= VIRAL_THRESHOLDS.minEngagementRate;
}

/**
 * Extract hashtags from video description
 */
function extractHashtags(description: string): string[] {
  const hashtagRegex = /#[\w\u00C0-\u024F]+/g;
  const matches = description.match(hashtagRegex) || [];
  return matches.map(tag => tag.toLowerCase());
}

/**
 * Analyze a video with AI to determine sector and virality explanation
 */
async function analyzeVideoWithAI(video: TikTokVideo, searchSector: string): Promise<{
  suggestedSector: string;
  viralityExplanation: string;
}> {
  const prompt = `
Analiza este vídeo de TikTok y determina:
1. ¿Para qué sector de negocio sería útil como ejemplo viral?
2. ¿Por qué es viral este vídeo? (técnicas de hook, edición, CTA, etc.)

Datos del vídeo:
- Descripción: ${video.description || 'No disponible'}
- Autor: ${video.author.nickname} (@${video.author.uniqueId})
- Likes: ${video.stats.likeCount.toLocaleString()}
- Comentarios: ${video.stats.commentCount.toLocaleString()}
- Compartidos: ${video.stats.shareCount.toLocaleString()}
- Vistas: ${video.stats.playCount.toLocaleString()}
- Duración: ${video.duration}s

Sector de búsqueda original: ${searchSector}

Sectores disponibles:
- clinica-estetica: Clínica Estética
- inmobiliaria: Inmobiliaria
- abogados: Abogados
- marketing: Agencias de Marketing
- personal-trainer: Personal Trainer
- manicura: Manicura / Uñas
- micropigmentacion: Micropigmentación
- peluqueria: Peluquería / Barbería
- restaurantes: Restaurantes
- coaches: Coaches / Consultores

Responde en JSON con este formato exacto:
{
  "suggestedSector": "slug-del-sector",
  "viralityExplanation": "Explicación breve de por qué es viral y cómo puede ser útil para el sector..."
}
`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'Eres un experto en marketing viral. Responde siempre en JSON válido.' },
        { role: 'user', content: prompt },
      ],
    });

    const rawContent = response.choices[0]?.message?.content || '{}';
    const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
    const analysis = JSON.parse(jsonMatch[1] || content);

    return {
      suggestedSector: analysis.suggestedSector || searchSector,
      viralityExplanation: analysis.viralityExplanation || 'Contenido viral con alto engagement',
    };
  } catch (error) {
    console.error('[ViralFinder] Error analyzing video with AI:', error);
    return {
      suggestedSector: searchSector,
      viralityExplanation: 'Contenido viral con alto engagement',
    };
  }
}

/**
 * Search for viral reels in a specific sector
 */
export async function findViralReelsForSector(
  sectorSlug: string,
  maxResults: number = 10
): Promise<ViralReelCandidate[]> {
  console.log(`[ViralFinder] Searching viral reels for sector: ${sectorSlug}`);
  
  const keywords = SECTOR_KEYWORDS[sectorSlug] || [sectorSlug];
  const candidates: ViralReelCandidate[] = [];
  
  for (const keyword of keywords) {
    if (candidates.length >= maxResults) break;
    
    try {
      console.log(`[ViralFinder] Searching with keyword: ${keyword}`);
      const result = await searchTikTokVideos(keyword);
      
      for (const video of result.videos) {
        if (candidates.length >= maxResults) break;
        if (!isViral(video)) continue;
        
        // Check if already in database
        const existingReel = await db.getPendingReels('pending', 1);
        const alreadyExists = existingReel.some(r => r.tiktokId === video.id);
        if (alreadyExists) continue;
        
        // Analyze with AI
        const analysis = await analyzeVideoWithAI(video, sectorSlug);
        
        candidates.push({
          tiktokId: video.id,
          tiktokUrl: `https://www.tiktok.com/@${video.author.uniqueId}/video/${video.id}`,
          authorUsername: video.author.uniqueId,
          authorName: video.author.nickname,
          title: video.description.substring(0, 100),
          description: video.description,
          coverUrl: video.coverUrl,
          videoUrl: video.downloadUrl || video.playUrl,
          duration: video.duration,
          likes: video.stats.likeCount,
          comments: video.stats.commentCount,
          shares: video.stats.shareCount,
          views: video.stats.playCount,
          hashtags: extractHashtags(video.description),
          suggestedSector: analysis.suggestedSector,
          viralityScore: calculateViralityScore(video),
          viralityExplanation: analysis.viralityExplanation,
        });
      }
    } catch (error) {
      console.error(`[ViralFinder] Error searching with keyword ${keyword}:`, error);
    }
  }
  
  // Sort by virality score
  candidates.sort((a, b) => b.viralityScore - a.viralityScore);
  
  console.log(`[ViralFinder] Found ${candidates.length} viral reel candidates for ${sectorSlug}`);
  return candidates;
}

/**
 * Search for viral reels across all sectors
 */
export async function findViralReelsAllSectors(
  maxPerSector: number = 5
): Promise<{ sector: string; candidates: ViralReelCandidate[] }[]> {
  console.log('[ViralFinder] Starting search across all sectors');
  
  const results: { sector: string; candidates: ViralReelCandidate[] }[] = [];
  
  for (const sectorSlug of Object.keys(SECTOR_KEYWORDS)) {
    try {
      const candidates = await findViralReelsForSector(sectorSlug, maxPerSector);
      results.push({ sector: sectorSlug, candidates });
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`[ViralFinder] Error searching sector ${sectorSlug}:`, error);
      results.push({ sector: sectorSlug, candidates: [] });
    }
  }
  
  return results;
}

/**
 * Add viral reel candidates to the pending queue
 */
export async function addCandidatesToPendingQueue(
  candidates: ViralReelCandidate[]
): Promise<{ added: number; skipped: number }> {
  let added = 0;
  let skipped = 0;
  
  for (const candidate of candidates) {
    try {
      await db.createPendingReel({
        tiktokId: candidate.tiktokId,
        tiktokUrl: candidate.tiktokUrl,
        authorUsername: candidate.authorUsername,
        authorName: candidate.authorName,
        title: candidate.title,
        description: candidate.description,
        coverUrl: candidate.coverUrl,
        videoUrl: candidate.videoUrl,
        duration: candidate.duration,
        likes: candidate.likes,
        comments: candidate.comments,
        shares: candidate.shares,
        views: candidate.views,
        suggestedSector: candidate.suggestedSector,
        viralityExplanation: candidate.viralityExplanation,
        viralityScore: candidate.viralityScore,
        hashtags: candidate.hashtags,
        searchQuery: candidate.suggestedSector,
        status: 'pending',
      });
      added++;
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        skipped++;
      } else {
        console.error('[ViralFinder] Error adding candidate:', error);
      }
    }
  }
  
  console.log(`[ViralFinder] Added ${added} candidates, skipped ${skipped} duplicates`);
  return { added, skipped };
}

/**
 * Run a full search job across all sectors
 */
export async function runViralSearchJob(): Promise<{
  totalFound: number;
  totalAdded: number;
  totalSkipped: number;
  bySector: { sector: string; found: number; added: number }[];
}> {
  console.log('[ViralFinder] Starting viral search job');
  
  const results = await findViralReelsAllSectors(5);
  
  let totalFound = 0;
  let totalAdded = 0;
  let totalSkipped = 0;
  const bySector: { sector: string; found: number; added: number }[] = [];
  
  for (const { sector, candidates } of results) {
    totalFound += candidates.length;
    
    const { added, skipped } = await addCandidatesToPendingQueue(candidates);
    totalAdded += added;
    totalSkipped += skipped;
    
    bySector.push({
      sector,
      found: candidates.length,
      added,
    });
  }
  
  console.log(`[ViralFinder] Job complete: ${totalFound} found, ${totalAdded} added, ${totalSkipped} skipped`);
  
  return {
    totalFound,
    totalAdded,
    totalSkipped,
    bySector,
  };
}
