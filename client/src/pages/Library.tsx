import { useState } from 'react';
import { Link } from 'wouter';
import { businessSectors, formatNumber, globalStats, type BusinessSector, type ViralVideo } from '../data/businessSectorVideos';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';
import { 
  ArrowLeft, 
  Play, 
  Heart, 
  MessageCircle, 
  Share2, 
  Eye,
  Clock,
  TrendingUp,
  Sparkles,
  ExternalLink,
  User,
  Search,
  Library as LibraryIcon,
  X
} from 'lucide-react';

export default function Library() {
  const [selectedSector, setSelectedSector] = useState<BusinessSector | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<ViralVideo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSectors = businessSectors.filter(sector =>
    sector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sector.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calcular engagement rate
  const calculateEngagement = (video: ViralVideo) => {
    const total = video.likes + video.comments + video.shares;
    const rate = video.plays > 0 ? (total / video.plays) * 100 : 0;
    return rate.toFixed(2);
  };

  // Construir URL de embed de TikTok
  const getTikTokEmbedUrl = (video: ViralVideo) => {
    return `https://www.tiktok.com/embed/v2/${video.id}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12">
        <div className="container">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <LibraryIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Biblioteca de Reels para Negocios</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Reels Virales por <span className="text-gradient">Sector de Negocio</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Explora nuestra colección de reels virales de TikTok organizados por industria. 
              Contenido real de negocios como el tuyo con más de 10,000 likes.
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 border-border/50"
              />
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{globalStats.totalSectors}</div>
              <div className="text-muted-foreground text-sm">Sectores</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-pink-500 mb-1">{globalStats.totalVideos}+</div>
              <div className="text-muted-foreground text-sm">Vídeos Virales</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-orange-500 mb-1">{formatNumber(globalStats.totalLikes)}+</div>
              <div className="text-muted-foreground text-sm">Likes Totales</div>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-green-500 mb-1">{formatNumber(globalStats.totalPlays)}+</div>
              <div className="text-muted-foreground text-sm">Reproducciones</div>
            </div>
          </div>

          {/* Sectors Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {filteredSectors.map((sector) => (
              <Card 
                key={sector.id}
                className="group cursor-pointer bg-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 hover:glow-primary overflow-hidden"
                onClick={() => setSelectedSector(sector)}
              >
                <div className="aspect-square relative overflow-hidden">
                  <img 
                    src={sector.image} 
                    alt={sector.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary transition-colors">
                      {sector.name}
                    </h3>
                    <p className="text-sm text-white/70 line-clamp-2">{sector.description}</p>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-black/50 text-white border-0 backdrop-blur-sm">
                      {sector.videos.length} vídeos
                    </Badge>
                  </div>
                  {/* Hover Badge */}
                  <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge className="bg-primary text-primary-foreground">
                      Ver todos
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-pink-500">
                      <Heart className="w-4 h-4" />
                      <span>{formatNumber(sector.totalLikes)} total</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      <span>{sector.avgEngagement.toFixed(1)}% eng</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No results */}
          {filteredSectors.length === 0 && (
            <div className="text-center py-20">
              <LibraryIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron sectores</h3>
              <p className="text-muted-foreground">
                Intenta con otra búsqueda
              </p>
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <div className="max-w-2xl mx-auto glass rounded-2xl p-8">
              <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3">
                ¿Quieres analizar tu propio vídeo?
              </h2>
              <p className="text-muted-foreground mb-6">
                Sube tu vídeo y obtén un análisis detallado de su potencial viral 
                comparado con los mejores de tu sector.
              </p>
              <Link href="/analyzer">
                <Button className="gradient-primary glow-primary">
                  Analizar Mi Vídeo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Sector Detail Modal */}
      <Dialog open={!!selectedSector} onOpenChange={() => setSelectedSector(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              {selectedSector && (
                <>
                  <img 
                    src={selectedSector.image} 
                    alt={selectedSector.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <span className="text-gradient">
                      {selectedSector.name}
                    </span>
                    <p className="text-sm text-muted-foreground font-normal mt-1">
                      {selectedSector.description}
                    </p>
                  </div>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Vídeos virales del sector {selectedSector?.name}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 mt-4">
              {selectedSector?.videos.map((video, index) => (
                <Card 
                  key={video.id}
                  className="bg-background/50 border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => setSelectedVideo(video)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Thumbnail placeholder */}
                      <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex-shrink-0 flex items-center justify-center relative overflow-hidden group">
                        <Play className="w-8 h-8 text-foreground/50 group-hover:text-primary group-hover:scale-110 transition-all" />
                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline" className="text-primary border-primary/30 text-xs">
                            #{index + 1} Top Viral
                          </Badge>
                        </div>
                        
                        <p className="text-foreground/90 text-sm line-clamp-2 mb-3">
                          {video.description}
                        </p>
                        
                        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-3">
                          <User className="w-3 h-3" />
                          <span>@{video.username}</span>
                          <span className="text-muted-foreground/40">•</span>
                          <span>{video.nickname}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 text-xs">
                          <div className="flex items-center gap-1 text-pink-500">
                            <Heart className="w-3 h-3" />
                            <span>{formatNumber(video.likes)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-500">
                            <MessageCircle className="w-3 h-3" />
                            <span>{formatNumber(video.comments)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-green-500">
                            <Share2 className="w-3 h-3" />
                            <span>{formatNumber(video.shares)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-orange-500">
                            <Eye className="w-3 h-3" />
                            <span>{formatNumber(video.plays)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-purple-500">
                            <TrendingUp className="w-3 h-3" />
                            <span>{calculateEngagement(video)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          
          <div className="flex justify-between items-center pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              {selectedSector?.videos.length} vídeos en este sector
            </div>
            <Button 
              variant="outline" 
              onClick={() => setSelectedSector(null)}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Detail Modal with TikTok Embed */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-lg bg-card border-border p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Reproductor de Vídeo</DialogTitle>
            <DialogDescription>
              Vídeo viral de TikTok
            </DialogDescription>
          </DialogHeader>
          
          {selectedVideo && (
            <div className="relative">
              {/* Close button */}
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-3 right-3 z-50 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>

              {/* TikTok Embed */}
              <div className="bg-black aspect-[9/16] max-h-[60vh] w-full flex items-center justify-center">
                <iframe
                  src={getTikTokEmbedUrl(selectedVideo)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={`TikTok video by ${selectedVideo.username}`}
                />
              </div>

              {/* Video Info */}
              <div className="p-5 bg-card">
                <h3 className="text-base font-semibold text-foreground mb-2">
                  Detalles del Vídeo
                </h3>
                
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {selectedVideo.description}
                </p>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {selectedVideo.nickname.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-foreground font-medium text-sm">{selectedVideo.nickname}</p>
                    <p className="text-muted-foreground text-xs">@{selectedVideo.username}</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-pink-500/10 rounded-lg p-2 text-center">
                    <Heart className="h-4 w-4 text-pink-500 mx-auto mb-1" />
                    <p className="text-foreground font-bold text-sm">{formatNumber(selectedVideo.likes)}</p>
                    <p className="text-muted-foreground text-[10px]">Me gusta</p>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-2 text-center">
                    <MessageCircle className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                    <p className="text-foreground font-bold text-sm">{formatNumber(selectedVideo.comments)}</p>
                    <p className="text-muted-foreground text-[10px]">Comentarios</p>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-2 text-center">
                    <Share2 className="h-4 w-4 text-green-500 mx-auto mb-1" />
                    <p className="text-foreground font-bold text-sm">{formatNumber(selectedVideo.shares)}</p>
                    <p className="text-muted-foreground text-[10px]">Compartidos</p>
                  </div>
                  <div className="bg-orange-500/10 rounded-lg p-2 text-center">
                    <Eye className="h-4 w-4 text-orange-500 mx-auto mb-1" />
                    <p className="text-foreground font-bold text-sm">{formatNumber(selectedVideo.plays)}</p>
                    <p className="text-muted-foreground text-[10px]">Reproducciones</p>
                  </div>
                </div>

                {/* Engagement Rate */}
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs">Tasa de Engagement</p>
                      <p className="text-xl font-bold text-primary">
                        {calculateEngagement(selectedVideo)}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gradient-primary"
                    onClick={() => window.open(selectedVideo.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver en TikTok
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedVideo(null)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
