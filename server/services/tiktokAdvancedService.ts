/**
 * TikTok Advanced Service - Using TIKWM API with filters
 * Supports: publish_time filter (6 months), sort by likes
 * 
 * Keywords optimizadas para encontrar contenido VIRAL:
 * - Tutoriales (paso a paso, cómo hacer)
 * - Transformaciones (antes y después)
 * - Tendencias (viral, trending)
 * - Trucos y tips
 * - Contenido satisfactorio (ASMR)
 * - Humor del sector
 */

import { ENV } from "../_core/env";

const RAPIDAPI_HOST = "tiktok-scraper7.p.rapidapi.com";

// Actual API response structure
interface TikTokVideoRaw {
  aweme_id: string;
  video_id: string;
  region: string;
  title: string;
  content_desc?: string[];
  cover: string;
  ai_dynamic_cover?: string;
  origin_cover?: string;
  duration: number;
  play: string;
  wmplay?: string;
  size?: number;
  music?: string;
  music_info?: {
    id: string;
    title: string;
    author: string;
    cover: string;
  };
  play_count: number;
  digg_count: number;
  comment_count: number;
  share_count: number;
  download_count?: number;
  create_time: number;
  author: {
    id: string;
    unique_id: string;
    nickname: string;
    avatar: string;
  };
  is_ad?: boolean;
}

interface SearchResponse {
  code: number;
  msg: string;
  data: {
    videos: TikTokVideoRaw[];
    cursor: number;
    has_more: boolean;
    search_id?: string;
  };
}

export interface SearchParams {
  keywords: string;
  region?: string; // es, us, br, etc.
  count?: number; // max 30
  cursor?: number;
  publishTime?: 0 | 1 | 7 | 30 | 90 | 180; // 0=all, 180=6 months
  sortType?: 0 | 1 | 3; // 0=relevance, 1=likes, 3=date
}

export interface ProcessedVideo {
  tiktokId: string;
  tiktokUrl: string;
  authorUsername: string;
  authorName: string;
  authorAvatar: string;
  description: string;
  coverUrl: string;
  videoUrl: string;
  duration: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  hashtags: string[];
  publishTime: Date;
  musicTitle?: string;
  musicAuthor?: string;
  // Calculated metrics
  engagementRate: number;
  likeToViewRatio: number;
}

/**
 * Search TikTok videos with advanced filters
 */
export async function searchTikTokVideos(params: SearchParams): Promise<{
  videos: ProcessedVideo[];
  cursor: number;
  hasMore: boolean;
}> {
  const apiKey = ENV.RAPIDAPI_TIKTOK_KEY;
  
  if (!apiKey) {
    throw new Error("RAPIDAPI_TIKTOK_KEY not configured");
  }

  const queryParams = new URLSearchParams({
    keywords: params.keywords,
    region: params.region || "es",
    count: String(params.count || 30),
    cursor: String(params.cursor || 0),
    publish_time: String(params.publishTime ?? 180), // Default: last 6 months
    sort_type: String(params.sortType ?? 1), // Default: sort by likes
  });

  const response = await fetch(
    `https://${RAPIDAPI_HOST}/feed/search?${queryParams}`,
    {
      method: "GET",
      headers: {
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`TikTok API error: ${response.status} ${response.statusText}`);
  }

  const data: SearchResponse = await response.json();

  if (data.code !== 0) {
    throw new Error(`TikTok API error: ${data.msg}`);
  }

  const videos = (data.data?.videos || []).map(processVideo);

  return {
    videos,
    cursor: data.data?.cursor || 0,
    hasMore: data.data?.has_more || false,
  };
}

/**
 * Process raw TikTok video data into our format
 */
function processVideo(video: TikTokVideoRaw): ProcessedVideo {
  const likes = video.digg_count || 0;
  const comments = video.comment_count || 0;
  const shares = video.share_count || 0;
  const views = video.play_count || 0;

  // Calculate engagement metrics
  const engagementRate = views > 0 
    ? ((likes + comments + shares) / views) * 100 
    : 0;
  const likeToViewRatio = views > 0 ? (likes / views) * 100 : 0;

  // Extract hashtags from title
  const hashtagRegex = /#(\w+)/g;
  const hashtags: string[] = [];
  let match;
  const fullText = video.title || "";
  while ((match = hashtagRegex.exec(fullText)) !== null) {
    hashtags.push(match[1]);
  }

  // Get description - combine title and content_desc
  const description = video.title || (video.content_desc?.join(" ") || "");

  return {
    tiktokId: video.aweme_id || video.video_id,
    tiktokUrl: `https://www.tiktok.com/@${video.author?.unique_id}/video/${video.video_id || video.aweme_id}`,
    authorUsername: video.author?.unique_id || "",
    authorName: video.author?.nickname || "",
    authorAvatar: video.author?.avatar || "",
    description,
    coverUrl: video.cover || video.origin_cover || video.ai_dynamic_cover || "",
    videoUrl: video.play || video.wmplay || "",
    duration: video.duration || 0,
    likes,
    comments,
    shares,
    views,
    hashtags,
    publishTime: new Date(video.create_time * 1000),
    musicTitle: video.music_info?.title,
    musicAuthor: video.music_info?.author,
    engagementRate,
    likeToViewRatio,
  };
}

/**
 * Get trending videos for a sector using ALL keywords
 */
export async function getTrendingForSector(
  sectorSlug: string,
  options: {
    region?: string;
    publishTime?: 0 | 1 | 7 | 30 | 90 | 180;
    maxResults?: number;
  } = {}
): Promise<ProcessedVideo[]> {
  const keywords = SECTOR_KEYWORDS[sectorSlug];
  if (!keywords) {
    throw new Error(`Unknown sector: ${sectorSlug}`);
  }

  const allVideos: ProcessedVideo[] = [];
  const seen = new Set<string>();

  // Search with ALL keywords for this sector
  for (const keyword of keywords) {
    try {
      const result = await searchTikTokVideos({
        keywords: keyword,
        region: options.region || "es",
        publishTime: options.publishTime ?? 180,
        sortType: 1, // Sort by likes
        count: 30,
      });

      for (const video of result.videos) {
        if (!seen.has(video.tiktokId)) {
          seen.add(video.tiktokId);
          allVideos.push(video);
        }
      }
    } catch (error) {
      console.error(`Error searching for "${keyword}":`, error);
    }
  }

  // Sort by likes and return top results
  return allVideos
    .sort((a, b) => b.likes - a.likes)
    .slice(0, options.maxResults || 100);
}

/**
 * SECTOR KEYWORDS - Optimizadas para contenido VIRAL
 * 
 * Cada sector tiene keywords de:
 * 1. Tutoriales y educación
 * 2. Transformaciones y resultados
 * 3. Tendencias y viral
 * 4. Trucos y tips profesionales
 * 5. Contenido satisfactorio/ASMR
 * 6. Humor del sector
 * 7. Términos genéricos del sector
 */
export const SECTOR_KEYWORDS: Record<string, string[]> = {
  "peluqueria": [
    // Tutoriales
    "tutorial corte pelo",
    "como hacer fade",
    "tutorial barberia",
    "paso a paso corte",
    "aprende cortar pelo",
    // Transformaciones
    "transformacion pelo",
    "antes despues corte",
    "cambio de look",
    "transformacion barberia",
    // Tendencias
    "corte tendencia 2025",
    "peinado viral",
    "corte viral tiktok",
    "tendencia barberia",
    // Trucos y tips
    "truco peluqueria",
    "secreto barbero",
    "tip corte pelo",
    "hack peluquero",
    // Satisfactorio/ASMR
    "ASMR barberia",
    "corte satisfactorio",
    "fade satisfactorio",
    // Humor
    "barbero gracioso",
    "cliente dificil peluqueria",
    "humor barberia",
    // Genéricos
    "peluqueria",
    "barberia",
    "corte pelo",
    "fade",
    "estilista",
  ],

  "clinica-estetica": [
    // Tutoriales
    "tutorial botox",
    "como aplicar acido hialuronico",
    "paso a paso relleno labios",
    "tutorial medicina estetica",
    // Transformaciones
    "antes despues botox",
    "transformacion facial",
    "resultado acido hialuronico",
    "antes despues labios",
    // Tendencias
    "tratamiento viral",
    "tendencia estetica 2025",
    "tratamiento facial viral",
    // Trucos y tips
    "secreto medicina estetica",
    "tip rejuvenecimiento",
    "consejo estetica",
    // Satisfactorio
    "ASMR estetica",
    "tratamiento satisfactorio",
    // Genéricos
    "clinica estetica",
    "medicina estetica",
    "botox",
    "acido hialuronico",
    "relleno labios",
    "rejuvenecimiento facial",
  ],

  "inmobiliaria": [
    // Tutoriales
    "como vender casa rapido",
    "tutorial inmobiliaria",
    "consejos comprar casa",
    "guia vender piso",
    // Transformaciones
    "antes despues casa",
    "transformacion piso",
    "reforma casa viral",
    "home staging antes despues",
    // Tendencias
    "casa viral tiktok",
    "piso increible",
    "mansion viral",
    "casa de lujo tour",
    // Trucos y tips
    "truco vender casa",
    "secreto inmobiliario",
    "tip agente inmobiliario",
    "hack venta casa",
    // Tours
    "tour casa lujo",
    "tour apartamento",
    "visita piso",
    // Genéricos
    "inmobiliaria",
    "agente inmobiliario",
    "venta casa",
    "comprar piso",
    "real estate españa",
  ],

  "abogados": [
    // Tutoriales
    "tutorial legal",
    "como demandar",
    "guia divorcio",
    "paso a paso herencia",
    // Educación viral
    "derecho explicado",
    "ley viral",
    "caso legal viral",
    "abogado explica",
    // Trucos y tips
    "consejo legal gratis",
    "tip abogado",
    "secreto legal",
    "hack juridico",
    // Casos reales
    "caso real abogado",
    "historia legal",
    "juicio viral",
    // Humor
    "abogado gracioso",
    "humor legal",
    "meme abogado",
    // Genéricos
    "abogado",
    "abogado tiktok",
    "derecho",
    "consejos legales",
    "bufete abogados",
  ],

  "marketing": [
    // Tutoriales
    "tutorial marketing digital",
    "como crecer instagram",
    "guia tiktok negocio",
    "paso a paso ads",
    // Estrategias virales
    "estrategia viral",
    "hack crecimiento",
    "secreto algoritmo",
    "truco instagram",
    // Tendencias
    "tendencia marketing 2025",
    "marketing viral",
    "estrategia tiktok viral",
    // Tips
    "tip marketing",
    "consejo redes sociales",
    "hack social media",
    // Casos de éxito
    "caso exito marketing",
    "como consegui seguidores",
    "de 0 a 100k",
    // Genéricos
    "marketing digital",
    "redes sociales negocio",
    "publicidad",
    "growth hacking",
    "community manager",
  ],

  "personal-trainer": [
    // Tutoriales
    "tutorial ejercicio",
    "como hacer sentadilla",
    "guia gym principiante",
    "paso a paso rutina",
    // Transformaciones
    "transformacion fisica",
    "antes despues gym",
    "perdida peso",
    "ganancia muscular",
    // Tendencias
    "ejercicio viral",
    "rutina viral tiktok",
    "reto fitness",
    // Tips
    "tip entrenador",
    "secreto fitness",
    "hack gym",
    "consejo musculacion",
    // Motivación
    "motivacion gym",
    "fitness motivation",
    // Genéricos
    "personal trainer",
    "entrenador personal",
    "fitness",
    "gym",
    "rutina gimnasio",
    "ejercicios casa",
  ],

  "manicura": [
    // Tutoriales
    "tutorial uñas",
    "como hacer manicura",
    "paso a paso nail art",
    "guia uñas acrilicas",
    // Transformaciones
    "transformacion uñas",
    "antes despues manicura",
    "uñas rotas a perfectas",
    // Tendencias
    "uñas tendencia 2025",
    "nail art viral",
    "diseño uñas viral",
    // Satisfactorio
    "ASMR uñas",
    "manicura satisfactoria",
    "quitar esmalte satisfactorio",
    // Tips
    "truco manicura",
    "secreto uñas perfectas",
    "hack nail art",
    // Genéricos
    "manicura",
    "uñas",
    "nail art",
    "diseño uñas",
    "uñas acrilicas",
    "manicurista",
  ],

  "micropigmentacion": [
    // Tutoriales
    "tutorial micropigmentacion",
    "como hacer microblading",
    "paso a paso cejas",
    "guia micropigmentacion labios",
    // Transformaciones
    "antes despues cejas",
    "transformacion microblading",
    "cejas perfectas resultado",
    // Tendencias
    "micropigmentacion viral",
    "cejas tendencia 2025",
    "microblading viral",
    // Satisfactorio
    "ASMR micropigmentacion",
    "proceso satisfactorio cejas",
    // Tips
    "consejo micropigmentacion",
    "secreto cejas perfectas",
    // Genéricos
    "micropigmentacion",
    "microblading",
    "cejas perfectas",
    "maquillaje permanente",
    "micropigmentacion labios",
  ],

  "restaurantes": [
    // Tutoriales
    "receta viral",
    "como hacer receta",
    "tutorial cocina",
    "paso a paso plato",
    // Transformaciones
    "plato increible",
    "comida espectacular",
    // Tendencias
    "comida viral tiktok",
    "restaurante viral",
    "plato tendencia",
    "food viral",
    // Satisfactorio
    "ASMR comida",
    "cocina satisfactoria",
    "cortar comida satisfactorio",
    // Behind the scenes
    "cocina restaurante",
    "chef trabajando",
    "detras escenas restaurante",
    // Genéricos
    "restaurante",
    "chef",
    "cocina profesional",
    "gastronomia",
    "comida española",
  ],

  "coaches": [
    // Tutoriales
    "tutorial desarrollo personal",
    "como mejorar vida",
    "guia productividad",
    "paso a paso exito",
    // Contenido viral
    "consejo viral",
    "motivacion viral",
    "mentalidad ganadora",
    // Tips
    "tip coach",
    "secreto exito",
    "hack productividad",
    "consejo vida",
    // Historias
    "historia exito",
    "de fracaso a exito",
    "transformacion personal",
    // Genéricos
    "coach",
    "coaching",
    "desarrollo personal",
    "mentalidad",
    "motivacion",
    "emprendedor",
  ],
};

/**
 * Get all available sectors
 */
export function getAvailableSectors(): Array<{
  slug: string;
  name: string;
  keywordCount: number;
  keywords: string[];
}> {
  return Object.entries(SECTOR_KEYWORDS).map(([slug, keywords]) => ({
    slug,
    name: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    keywordCount: keywords.length,
    keywords,
  }));
}
