/**
 * Script para buscar vídeos virales con miniaturas reales
 * Usa la API de Manus Data para obtener vídeos de TikTok
 */

import { callDataApi } from "../server/_core/dataApi";
import * as fs from 'fs';
import * as path from 'path';

interface ViralVideo {
  id: string;
  url: string;
  username: string;
  authorName: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  cover: string;
  duration: string;
  engagement: number;
}

interface BusinessSector {
  id: string;
  name: string;
  description: string;
  image: string;
  videoCount: number;
  videos: ViralVideo[];
}

const sectorKeywords: Record<string, { name: string; description: string; keywords: string[] }> = {
  'clinica-estetica': {
    name: 'Clínica Estética',
    description: 'Tratamientos faciales, botox, ácido hialurónico y rejuvenecimiento',
    keywords: ['clinica estetica viral', 'botox viral', 'medicina estetica tiktok']
  },
  'inmobiliaria': {
    name: 'Inmobiliaria',
    description: 'Venta de casas, pisos, propiedades y tours virtuales',
    keywords: ['inmobiliaria viral', 'tour casa viral', 'real estate tiktok español']
  },
  'abogados': {
    name: 'Abogados',
    description: 'Asesoría legal, derecho, casos legales y consultas jurídicas',
    keywords: ['abogado viral', 'derecho tiktok', 'abogado tiktok español']
  },
  'marketing': {
    name: 'Agencias de Marketing',
    description: 'Marketing digital, redes sociales, publicidad y estrategias',
    keywords: ['marketing digital viral', 'agencia marketing tiktok', 'social media tips']
  },
  'personal-trainer': {
    name: 'Personal Trainer',
    description: 'Fitness, entrenamiento, ejercicios, gimnasio y nutrición',
    keywords: ['personal trainer viral', 'fitness viral español', 'entrenador personal tiktok']
  },
  'manicura': {
    name: 'Manicura y Uñas',
    description: 'Nail art, diseño de uñas, manicura y pedicura',
    keywords: ['nail art viral', 'uñas viral', 'manicura tiktok']
  },
  'micropigmentacion': {
    name: 'Micropigmentación',
    description: 'Cejas, labios, microblading y maquillaje permanente',
    keywords: ['micropigmentacion viral', 'microblading viral', 'cejas permanentes tiktok']
  },
  'peluqueria': {
    name: 'Peluquería',
    description: 'Cortes de pelo, peinados, coloración y estilismo',
    keywords: ['peluqueria viral', 'corte pelo viral', 'hair transformation tiktok']
  },
  'restaurantes': {
    name: 'Restaurantes',
    description: 'Comida, recetas, cocina, gastronomía y platos',
    keywords: ['restaurante viral', 'comida viral', 'chef tiktok español']
  },
  'coaches': {
    name: 'Coaches y Consultores',
    description: 'Coaching, mentoría, desarrollo personal y negocios',
    keywords: ['coach viral', 'coaching tiktok', 'desarrollo personal viral']
  }
};

async function searchVideos(keyword: string): Promise<ViralVideo[]> {
  try {
    console.log(`Searching for: ${keyword}`);
    
    const result = await callDataApi("Tiktok/search_tiktok_video_general", {
      query: { 
        keyword,
        cursor: '0'
      },
    }) as any;
    
    if (!result || !result.data) {
      console.log('No results found');
      return [];
    }
    
    const videos: ViralVideo[] = result.data
      .filter((item: any) => item.item)
      .filter((item: any) => {
        const likes = item.item.stats?.diggCount || item.item.statsV2?.diggCount || 0;
        return likes >= 4000; // Mínimo 4000 likes
      })
      .map((item: any) => {
        const video = item.item;
        const likes = video.stats?.diggCount || video.statsV2?.diggCount || 0;
        const comments = video.stats?.commentCount || video.statsV2?.commentCount || 0;
        const shares = video.stats?.shareCount || video.statsV2?.shareCount || 0;
        const views = video.stats?.playCount || video.statsV2?.playCount || 0;
        const engagement = views > 0 ? ((likes + comments + shares) / views) * 100 : 0;
        
        const duration = video.video?.duration || 0;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        
        return {
          id: video.id || '',
          url: `https://www.tiktok.com/@${video.author?.uniqueId || ''}/video/${video.id}`,
          username: `@${video.author?.uniqueId || ''}`,
          authorName: video.author?.nickname || '',
          description: video.desc || '',
          likes,
          comments,
          shares,
          views,
          cover: video.video?.cover || video.video?.originCover || video.video?.dynamicCover || '',
          duration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
          engagement: parseFloat(engagement.toFixed(2))
        };
      });
    
    console.log(`Found ${videos.length} videos with 4K+ likes`);
    return videos;
  } catch (error: any) {
    console.error('Error searching:', error.message);
    return [];
  }
}

async function main() {
  const sectors: BusinessSector[] = [];
  
  for (const [sectorId, sectorInfo] of Object.entries(sectorKeywords)) {
    console.log(`\n=== Processing sector: ${sectorInfo.name} ===`);
    
    let allVideos: ViralVideo[] = [];
    
    for (const keyword of sectorInfo.keywords) {
      const videos = await searchVideos(keyword);
      allVideos = [...allVideos, ...videos];
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }
    
    // Remove duplicates by ID
    const uniqueVideos = allVideos.filter((video, index, self) =>
      index === self.findIndex(v => v.id === video.id)
    );
    
    // Sort by likes and take top 5
    const topVideos = uniqueVideos
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 5);
    
    sectors.push({
      id: sectorId,
      name: sectorInfo.name,
      description: sectorInfo.description,
      image: `/sectors/${sectorId}.jpg`,
      videoCount: topVideos.length,
      videos: topVideos
    });
    
    console.log(`Sector ${sectorInfo.name}: ${topVideos.length} videos`);
  }
  
  // Generate TypeScript file
  const output = `// Biblioteca de Vídeos Virales por Sector de Negocios
// Todos los vídeos tienen mínimo 4,000 likes
// Generado automáticamente desde búsqueda en TikTok

export interface ViralVideo {
  id: string;
  url: string;
  username: string;
  authorName: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  cover: string;
  duration: string;
  engagement: number;
}

export interface BusinessSector {
  id: string;
  name: string;
  description: string;
  image: string;
  videoCount: number;
  videos: ViralVideo[];
}

export const businessSectors: BusinessSector[] = ${JSON.stringify(sectors, null, 2)};

// Función para formatear números
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Estadísticas globales
export const globalStats = {
  sectors: '${sectors.length}',
  videos: '${sectors.reduce((acc, s) => acc + s.videos.length, 0)}+',
  likes: formatNumber(${sectors.reduce((acc, s) => acc + s.videos.reduce((a, v) => a + v.likes, 0), 0)}),
  views: formatNumber(${sectors.reduce((acc, s) => acc + s.videos.reduce((a, v) => a + v.views, 0), 0)})
};
`;
  
  fs.writeFileSync(
    path.join(__dirname, '../client/src/data/businessSectorVideos.ts'),
    output
  );
  
  console.log('\n=== Done! ===');
  console.log(`Total sectors: ${sectors.length}`);
  console.log(`Total videos: ${sectors.reduce((acc, s) => acc + s.videos.length, 0)}`);
}

main().catch(console.error);
