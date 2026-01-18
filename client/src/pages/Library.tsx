import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { 
  Library as LibraryIcon, 
  Search, 
  ArrowRight,
  Loader2,
  Video,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { useState } from "react";

export default function Library() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: sectors, isLoading } = trpc.sectors.list.useQuery();

  const filteredSectors = sectors?.filter(sector => 
    sector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sector.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12">
        <div className="container">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <LibraryIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Biblioteca de Reels</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Reels Virales por <span className="text-gradient">Sector</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Explora nuestra colección de reels virales organizados por industria. 
              Encuentra inspiración para tu sector específico.
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

          {/* Sectors Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredSectors && filteredSectors.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSectors.map((sector) => (
                <Link key={sector.id} href={`/library/${sector.slug}`}>
                  <Card className="group h-full bg-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 hover:glow-primary cursor-pointer overflow-hidden">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      {sector.imageUrl ? (
                        <img
                          src={sector.imageUrl}
                          alt={sector.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <Video className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Overlay Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-primary transition-colors">
                          {sector.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-white/70">
                          <TrendingUp className="w-4 h-4" />
                          <span>{sector.reelsCount} reels</span>
                        </div>
                      </div>

                      {/* Hover Badge */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
                          Ver más <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {sector.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <LibraryIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron sectores</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Intenta con otra búsqueda" : "No hay sectores disponibles"}
              </p>
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <div className="max-w-2xl mx-auto glass rounded-2xl p-8">
              <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3">
                ¿No encuentras tu sector?
              </h2>
              <p className="text-muted-foreground mb-6">
                Estamos añadiendo nuevos sectores constantemente. Contacta con soporte 
                para solicitar contenido específico para tu industria.
              </p>
              <Link href="/support">
                <Button className="gradient-primary glow-primary">
                  Solicitar Sector
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
