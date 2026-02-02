import { useState, useEffect } from 'react';
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
  Play, 
  Heart, 
  MessageCircle, 
  Share2, 
  Eye,
  TrendingUp,
  Sparkles,
  ExternalLink,
  User,
  Search,
  Library as LibraryIcon,
  X,
  Flame,
  Crown,
  Zap,
  Star
} from 'lucide-react';

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  
  return count;
}

// Stat card component with animation
function AnimatedStat({ value, label, color, icon: Icon, delay }: { 
  value: string; 
  label: string; 
  color: string;
  icon: React.ElementType;
  delay: number;
}) {
  return (
    <div 
      className={`glass-card rounded-2xl p-6 text-center hover-lift opacity-0 animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mx-auto mb-3 animate-bounce-subtle`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className={`text-3xl md:text-4xl font-bold mb-1 text-gradient`}>
        {value}
      </div>
      <div className="text-muted-foreground text-sm">{label}</div>
    </div>
  );
}

export default function Library() {
  const [selectedSector, setSelectedSector] = useState<BusinessSector | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<ViralVideo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const filteredSectors = businessSectors.filter(sector =>
    sector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sector.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateEngagement = (video: ViralVideo) => {
    const total = video.likes + video.comments + video.shares;
    const rate = video.views > 0 ? (total / video.views) * 100 : 0;
    return rate.toFixed(2);
  };

  const getTikTokEmbedUrl = (video: ViralVideo) => {
    return `https://www.tiktok.com/embed/v2/${video.id}`;
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      
      {/* Hero Section with animated background */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 gradient-mesh" />
        
        {/* Floating particles */}
        <div className="absolute top-20 left-10 w-3 h-3 rounded-full bg-primary/50 animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 right-20 w-2 h-2 rounded-full bg-accent/50 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/4 w-4 h-4 rounded-full bg-pink-500/30 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-cyan-500/40 animate-float" style={{ animationDelay: '0.5s' }} />
        
        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        
        <div className="container relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Premium badge */}
            <div 
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full badge-premium mb-6 opacity-0 ${isLoaded ? 'animate-fade-in-scale' : ''}`}
              style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
            >
              <Crown className="w-4 h-4 text-primary animate-bounce-subtle" />
              <span className="text-sm font-semibold text-gradient">Biblioteca Premium de Reels Virales</span>
              <Sparkles className="w-4 h-4 text-accent animate-bounce-subtle" style={{ animationDelay: '0.5s' }} />
            </div>
            
            {/* Main heading with gradient animation */}
            <h1 
              className={`text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight opacity-0 ${isLoaded ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
            >
              <span className="text-foreground">Descubre los </span>
              <span className="text-gradient-rainbow">Secretos</span>
              <br />
              <span className="text-foreground">de tu </span>
              <span className="text-gradient">Sector</span>
            </h1>
            
            <p 
              className={`text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto opacity-0 ${isLoaded ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
            >
              Explora vídeos virales reales de negocios como el tuyo. 
              Aprende qué funciona y aplícalo a tu contenido.
            </p>
            
            {/* Explicación de la sección */}
            <div 
              className={`glass-card rounded-2xl p-6 max-w-3xl mx-auto mb-10 text-left opacity-0 ${isLoaded ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}
            >
              <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                ¿Para qué sirve esta sección?
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                La <strong className="text-foreground">Biblioteca Viral</strong> te permite ver qué contenido está funcionando en TikTok para negocios de tu mismo sector. 
                Cada vídeo tiene más de 4,000 likes y ha sido seleccionado por su alto engagement.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-400 text-xs">1</span>
                  </div>
                  <span className="text-muted-foreground"><strong className="text-foreground">Elige tu sector</strong> y mira los vídeos que más likes tienen</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 text-xs">2</span>
                  </div>
                  <span className="text-muted-foreground"><strong className="text-foreground">Analiza el patrón</strong>: hook, duración, estilo, CTA</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-400 text-xs">3</span>
                  </div>
                  <span className="text-muted-foreground"><strong className="text-foreground">Replica la estructura</strong> adaptándola a tu negocio</span>
                </div>
              </div>
            </div>

            {/* Search with glow effect */}
            <div 
              className={`max-w-lg mx-auto relative opacity-0 ${isLoaded ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="text"
                    placeholder="Buscar tu sector..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-6 text-lg bg-background/80 backdrop-blur-xl border-primary/20 rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with animations */}
      <section className="py-12 relative">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <AnimatedStat 
              value={globalStats.sectors}
              label="Sectores"
              color="bg-gradient-to-br from-purple-500 to-pink-500"
              icon={LibraryIcon}
              delay={100}
            />
            <AnimatedStat 
              value={globalStats.videos}
              label="Vídeos Virales"
              color="bg-gradient-to-br from-pink-500 to-rose-500"
              icon={Flame}
              delay={200}
            />
            <AnimatedStat 
              value={globalStats.likes}
              label="Likes Totales"
              color="bg-gradient-to-br from-orange-500 to-amber-500"
              icon={Heart}
              delay={300}
            />
            <AnimatedStat 
              value={globalStats.views}
              label="Reproducciones"
              color="bg-gradient-to-br from-emerald-500 to-teal-500"
              icon={Eye}
              delay={400}
            />
          </div>
        </div>
      </section>

      {/* Sectors Grid with premium cards */}
      <section className="py-12">
        <div className="container">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {filteredSectors.map((sector, index) => (
              <div
                key={sector.id}
                className={`opacity-0 ${isLoaded ? 'animate-fade-in-up' : ''}`}
                style={{ animationDelay: `${500 + index * 100}ms`, animationFillMode: 'forwards' }}
              >
                <Card 
                  className="group cursor-pointer card-premium overflow-hidden h-full"
                  onClick={() => setSelectedSector(sector)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    {/* Image with zoom effect */}
                    <img 
                      src={sector.image} 
                      alt={sector.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-gradient transition-all duration-300">
                        {sector.name}
                      </h3>
                      <p className="text-sm text-white/70 line-clamp-2">{sector.description}</p>
                    </div>
                    
                    {/* Video count badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-black/60 text-white border-0 backdrop-blur-md px-3 py-1">
                        <Play className="w-3 h-3 mr-1" />
                        {sector.videos.length} vídeos
                      </Badge>
                    </div>
                    
                    {/* Hover badge */}
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0">
                      <Badge className="bg-primary text-white border-0 shadow-lg shadow-primary/30">
                        <Zap className="w-3 h-3 mr-1" />
                        Ver todos
                      </Badge>
                    </div>
                    
                    {/* Play button on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="play-button">
                        <Play className="w-6 h-6 text-white ml-1" fill="white" />
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-4 bg-gradient-to-b from-card to-card/80">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-pink-500">
                        <Heart className="w-4 h-4" fill="currentColor" />
                        <span className="font-semibold">{formatNumber(sector.videos.reduce((acc, v) => acc + v.likes, 0))}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-500">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-semibold">{(sector.videos.reduce((acc, v) => acc + v.engagement, 0) / sector.videos.length).toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* No results */}
          {filteredSectors.length === 0 && (
            <div className="text-center py-20 animate-fade-in-up">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No se encontraron sectores</h3>
              <p className="text-muted-foreground">
                Intenta con otra búsqueda
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-3xl blur-xl opacity-30" />
              
              <div className="relative glass-card rounded-3xl p-10 text-center">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 animate-bounce-subtle">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  ¿Quieres analizar <span className="text-gradient">tu propio vídeo</span>?
                </h2>
                <p className="text-muted-foreground mb-8 text-lg">
                  Sube tu vídeo y obtén un análisis detallado de su potencial viral 
                  comparado con los mejores de tu sector.
                </p>
                <Link href="/analyzer">
                  <Button size="lg" className="btn-premium btn-glow gradient-primary text-white text-lg px-10 py-6">
                    <Play className="w-5 h-5 mr-2" />
                    Analizar Mi Vídeo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sector Detail Modal */}
      <Dialog open={!!selectedSector} onOpenChange={() => setSelectedSector(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-card/95 backdrop-blur-xl border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4 text-2xl">
              {selectedSector && (
                <>
                  <div className="relative">
                    <img 
                      src={selectedSector.image} 
                      alt={selectedSector.name}
                      className="w-14 h-14 rounded-xl object-cover ring-2 ring-primary/30"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Star className="w-3 h-3 text-white" fill="white" />
                    </div>
                  </div>
                  <div>
                    <span className="text-gradient">{selectedSector.name}</span>
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
                  className="bg-background/50 border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 cursor-pointer group"
                  onClick={() => setSelectedVideo(video)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Real Thumbnail */}
                      <div className={`w-28 h-28 md:w-36 md:h-36 rounded-xl flex-shrink-0 relative overflow-hidden ${!video.cover ? 'bg-gradient-to-br from-primary/30 to-accent/30' : ''}`}>
                        {video.cover && (
                          <img 
                            src={video.cover}
                            alt={video.description}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              // Fallback to gradient if image fails
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.classList.add('bg-gradient-to-br', 'from-primary/30', 'to-accent/30');
                            }}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                        
                        {/* Play overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                            <Play className="w-5 h-5 text-primary ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                        
                        {/* Duration badge */}
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded-md font-medium">
                          {video.duration}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30 text-xs">
                            <Crown className="w-3 h-3 mr-1" />
                            #{index + 1} Top Viral
                          </Badge>
                        </div>
                        
                        <p className="text-foreground/90 text-sm line-clamp-2 mb-3 group-hover:text-foreground transition-colors">
                          {video.description}
                        </p>
                        
                        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-3">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <User className="w-3 h-3 text-white" />
                          </div>
                          <span className="font-medium">@{video.username}</span>
                          <span className="text-muted-foreground/40">•</span>
                          <span>{video.authorName}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 text-xs">
                          <div className="flex items-center gap-1.5 text-pink-500 bg-pink-500/10 px-2 py-1 rounded-full">
                            <Heart className="w-3 h-3" fill="currentColor" />
                            <span className="font-semibold">{formatNumber(video.likes)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full">
                            <MessageCircle className="w-3 h-3" />
                            <span className="font-semibold">{formatNumber(video.comments)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                            <Share2 className="w-3 h-3" />
                            <span className="font-semibold">{formatNumber(video.shares)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full">
                            <Eye className="w-3 h-3" />
                            <span className="font-semibold">{formatNumber(video.views)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          
          <div className="flex justify-between items-center pt-4 border-t border-border/50">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Play className="w-4 h-4" />
              {selectedSector?.videos.length} vídeos en este sector
            </div>
            <Button 
              variant="outline" 
              onClick={() => setSelectedSector(null)}
              className="hover:bg-primary/10 hover:text-primary hover:border-primary/30"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Detail Modal with TikTok Embed */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-xl border-primary/20 p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Reproductor de Vídeo</DialogTitle>
            <DialogDescription>Vídeo viral de TikTok</DialogDescription>
          </DialogHeader>
          
          {selectedVideo && (
            <div className="relative">
              {/* Close button */}
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-3 right-3 z-50 bg-black/60 hover:bg-black/80 rounded-full p-2.5 transition-all duration-300 hover:scale-110"
              >
                <X className="h-4 w-4 text-white" />
              </button>

              {/* TikTok Embed */}
              <div className="bg-black aspect-[9/16] max-h-[55vh] w-full flex items-center justify-center">
                <iframe
                  src={getTikTokEmbedUrl(selectedVideo)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={`TikTok video by ${selectedVideo.username}`}
                />
              </div>

              {/* Video Info */}
              <div className="p-5 bg-gradient-to-b from-card to-card/90">
                <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Detalles del Vídeo
                </h3>
                
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {selectedVideo.description}
                </p>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center ring-2 ring-primary/30">
                    <span className="text-white font-bold text-sm">
                      {selectedVideo.authorName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-foreground font-medium text-sm">{selectedVideo.authorName}</p>
                    <p className="text-muted-foreground text-xs">{selectedVideo.username}</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-pink-500/10 rounded-xl p-3 text-center hover:bg-pink-500/20 transition-colors">
                    <Heart className="h-4 w-4 text-pink-500 mx-auto mb-1" fill="currentColor" />
                    <p className="text-foreground font-bold text-sm">{formatNumber(selectedVideo.likes)}</p>
                    <p className="text-muted-foreground text-[10px]">Me gusta</p>
                  </div>
                  <div className="bg-blue-500/10 rounded-xl p-3 text-center hover:bg-blue-500/20 transition-colors">
                    <MessageCircle className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                    <p className="text-foreground font-bold text-sm">{formatNumber(selectedVideo.comments)}</p>
                    <p className="text-muted-foreground text-[10px]">Comentarios</p>
                  </div>
                  <div className="bg-green-500/10 rounded-xl p-3 text-center hover:bg-green-500/20 transition-colors">
                    <Share2 className="h-4 w-4 text-green-500 mx-auto mb-1" />
                    <p className="text-foreground font-bold text-sm">{formatNumber(selectedVideo.shares)}</p>
                    <p className="text-muted-foreground text-[10px]">Compartidos</p>
                  </div>
                  <div className="bg-orange-500/10 rounded-xl p-3 text-center hover:bg-orange-500/20 transition-colors">
                    <Eye className="h-4 w-4 text-orange-500 mx-auto mb-1" />
                    <p className="text-foreground font-bold text-sm">{formatNumber(selectedVideo.views)}</p>
                    <p className="text-muted-foreground text-[10px]">Reproducciones</p>
                  </div>
                </div>

                {/* Engagement Rate */}
                <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Tasa de Engagement</p>
                      <p className="text-2xl font-bold text-gradient">
                        {calculateEngagement(selectedVideo)}%
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 btn-premium gradient-primary text-white"
                    onClick={() => window.open(selectedVideo.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver en TikTok
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedVideo(null)}
                    className="hover:bg-primary/10 hover:text-primary hover:border-primary/30"
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
