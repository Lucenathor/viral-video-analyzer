import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { 
  ArrowLeft, 
  Loader2, 
  Video,
  Play,
  Eye,
  Clock,
  TrendingUp,
  Sparkles
} from "lucide-react";

export default function SectorDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  
  const { data: sector, isLoading: sectorLoading } = trpc.sectors.getBySlug.useQuery({ slug });
  const { data: videos, isLoading: videosLoading } = trpc.sectors.getVideos.useQuery(
    { sectorId: sector?.id || 0 },
    { enabled: !!sector?.id }
  );

  const isLoading = sectorLoading || videosLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!sector) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20">
          <div className="container text-center">
            <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sector no encontrado</h1>
            <p className="text-muted-foreground mb-6">
              El sector que buscas no existe o ha sido eliminado.
            </p>
            <Link href="/library">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a la Biblioteca
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12">
        <div className="container">
          {/* Back Button */}
          <Link href="/library">
            <Button variant="ghost" className="mb-6 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver a la Biblioteca
            </Button>
          </Link>

          {/* Header */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Sector Image */}
            <div className="aspect-video rounded-2xl overflow-hidden bg-card/50">
              {sector.imageUrl ? (
                <img
                  src={sector.imageUrl}
                  alt={sector.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Video className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Sector Info */}
            <div className="flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit mb-4">
                <TrendingUp className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-primary">{sector.reelsCount} reels virales</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {sector.name}
              </h1>
              
              <p className="text-muted-foreground mb-6">
                {sector.description}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/analyzer">
                  <Button className="gradient-primary glow-primary gap-2">
                    <Sparkles className="w-4 h-4" />
                    Analizar mi Vídeo
                  </Button>
                </Link>
                <Link href="/support">
                  <Button variant="outline" className="gap-2">
                    Solicitar Análisis Experto
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Videos Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">
              Reels Virales de <span className="text-gradient">{sector.name}</span>
            </h2>

            {videos && videos.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video) => (
                  <Card key={video.id} className="group bg-card/50 border-border/50 hover:border-primary/50 transition-all overflow-hidden">
                    <div className="aspect-[9/16] relative overflow-hidden bg-black">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title || "Video"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <Video className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Play Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                      </div>

                      {/* Duration Badge */}
                      {video.duration && (
                        <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-sm mb-2 line-clamp-2">
                        {video.title || "Reel Viral"}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {video.viewCount.toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 glass rounded-2xl">
                <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Próximamente</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Estamos preparando una colección de reels virales para este sector. 
                  ¡Vuelve pronto para ver los ejemplos!
                </p>
                <Link href="/support">
                  <Button variant="outline">
                    Solicitar Contenido
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Tips Section */}
          <div className="glass rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Consejos para {sector.name}
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-4 rounded-xl bg-secondary/30">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center mb-3">
                  <span className="text-white font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Hook Impactante</h4>
                <p className="text-sm text-muted-foreground">
                  Los primeros 3 segundos son cruciales. Muestra algo sorprendente o plantea una pregunta.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30">
                <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center mb-3">
                  <span className="text-accent-foreground font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Valor Inmediato</h4>
                <p className="text-sm text-muted-foreground">
                  Ofrece información útil o entretenimiento desde el primer momento.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-3">
                  <span className="text-white font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">CTA Claro</h4>
                <p className="text-sm text-muted-foreground">
                  Termina con una llamada a la acción que invite a interactuar o seguirte.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
