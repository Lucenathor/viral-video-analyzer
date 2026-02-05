import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Search, ThumbsUp, ThumbsDown, Clock, Eye, Heart, MessageCircle, 
  Share2, Play, ExternalLink, Brain, TrendingUp, Filter, Loader2,
  CheckCircle, XCircle, BarChart3, CalendarPlus
} from "lucide-react";

interface VideoResult {
  tiktokId: string;
  tiktokUrl: string;
  authorUsername: string;
  authorName: string;
  description: string;
  coverUrl: string;
  videoUrl: string;
  duration: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  hashtags: string[];
  publishTime: string | Date;
  engagementRate: number;
  likeToViewRatio: number;
}

export default function AdminTraining() {
  const { user, loading: authLoading } = useAuth();
  const [searchKeywords, setSearchKeywords] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [publishTime, setPublishTime] = useState("180");
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoResult | null>(null);
  const [labelNotes, setLabelNotes] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const { data: sectors } = trpc.training.getAvailableSectors.useQuery();
  const { data: allStats } = trpc.training.getAllSectorStats.useQuery();
  const { data: labeledReels } = trpc.training.getLabeledReels.useQuery({ limit: 20 });

  const searchMutation = trpc.training.searchVideos.useMutation({
    onSuccess: (data) => {
      setVideos(prev => cursor === 0 ? data.videos : [...prev, ...data.videos]);
      setCursor(data.cursor);
      setHasMore(data.hasMore);
      setIsSearching(false);
      toast.success(`Encontrados ${data.videos.length} vídeos`);
    },
    onError: (error) => {
      setIsSearching(false);
      toast.error(error.message);
    },
  });

  const searchBySectorMutation = trpc.training.searchBySector.useMutation({
    onSuccess: (data) => {
      setVideos(data.videos);
      setIsSearching(false);
      toast.success(`Encontrados ${data.videos.length} vídeos para ${data.sectorSlug}`);
    },
    onError: (error) => {
      setIsSearching(false);
      toast.error(error.message);
    },
  });

  const labelMutation = trpc.training.labelVideo.useMutation({
    onSuccess: () => {
      toast.success("Vídeo etiquetado correctamente");
      setSelectedVideo(null);
      setLabelNotes("");
      // Remove from list
      setVideos(prev => prev.filter(v => v.tiktokId !== selectedVideo?.tiktokId));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const acceptForCalendarMutation = trpc.training.acceptForCalendar.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setSelectedVideo(null);
      setLabelNotes("");
      // Remove from list
      setVideos(prev => prev.filter(v => v.tiktokId !== selectedVideo?.tiktokId));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAcceptForCalendar = () => {
    if (!selectedVideo || !selectedSector) {
      toast.error("Selecciona un vídeo y un sector");
      return;
    }
    acceptForCalendarMutation.mutate({
      video: {
        ...selectedVideo,
        publishTime: selectedVideo.publishTime,
      },
      sectorSlug: selectedSector,
      notes: labelNotes,
    });
  };

  const handleSearch = () => {
    if (!searchKeywords.trim()) {
      toast.error("Introduce palabras clave para buscar");
      return;
    }
    setIsSearching(true);
    setCursor(0);
    searchMutation.mutate({
      keywords: searchKeywords,
      publishTime: parseInt(publishTime),
      cursor: 0,
    });
  };

  const handleSearchBySector = () => {
    if (!selectedSector) {
      toast.error("Selecciona un sector");
      return;
    }
    setIsSearching(true);
    searchBySectorMutation.mutate({
      sectorSlug: selectedSector,
      publishTime: parseInt(publishTime),
    });
  };

  const handleLoadMore = () => {
    if (!hasMore || isSearching) return;
    setIsSearching(true);
    searchMutation.mutate({
      keywords: searchKeywords,
      publishTime: parseInt(publishTime),
      cursor,
    });
  };

  const handleLabel = (isViral: boolean) => {
    if (!selectedVideo || !selectedSector) {
      toast.error("Selecciona un vídeo y un sector");
      return;
    }
    labelMutation.mutate({
      video: {
        ...selectedVideo,
        publishTime: selectedVideo.publishTime,
      },
      sectorSlug: selectedSector,
      isViral,
      notes: labelNotes,
      searchQuery: searchKeywords,
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Acceso Denegado</CardTitle>
            <CardDescription>
              Solo los administradores pueden acceder a esta sección.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-400" />
            Entrenamiento de Viralidad
          </h1>
          <p className="text-slate-400 mt-2">
            Busca vídeos de TikTok, etiquétalos como virales o no virales, y entrena el sistema de IA
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {sectors?.slice(0, 5).map((sector) => (
            <Card key={sector.slug} className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="text-sm text-slate-400">{sector.name}</div>
                <div className="text-2xl font-bold text-white">
                  {allStats?.[sector.slug]?.totalLabeled || 0}
                </div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-green-400 border-green-400/30 text-xs">
                    {allStats?.[sector.slug]?.viralCount || 0} viral
                  </Badge>
                  <Badge variant="outline" className="text-red-400 border-red-400/30 text-xs">
                    {allStats?.[sector.slug]?.notViralCount || 0} no
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="bg-slate-900/50">
            <TabsTrigger value="search">Buscar Vídeos</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Search Panel */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Búsqueda
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Sector</Label>
                    <Select value={selectedSector} onValueChange={setSelectedSector}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Selecciona sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors?.map((sector) => (
                          <SelectItem key={sector.slug} value={sector.slug}>
                            {sector.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-300">Tiempo de publicación</Label>
                    <Select value={publishTime} onValueChange={setPublishTime}>
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Últimas 24h</SelectItem>
                        <SelectItem value="7">Última semana</SelectItem>
                        <SelectItem value="30">Último mes</SelectItem>
                        <SelectItem value="90">Últimos 3 meses</SelectItem>
                        <SelectItem value="180">Últimos 6 meses</SelectItem>
                        <SelectItem value="0">Todo el tiempo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleSearchBySector}
                    disabled={!selectedSector || isSearching}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <TrendingUp className="w-4 h-4 mr-2" />
                    )}
                    Buscar por Sector
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-slate-900 px-2 text-slate-500">o búsqueda manual</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300">Palabras clave</Label>
                    <Input
                      value={searchKeywords}
                      onChange={(e) => setSearchKeywords(e.target.value)}
                      placeholder="ej: peluquería transformación"
                      className="bg-slate-800 border-slate-700"
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>

                  <Button 
                    onClick={handleSearch}
                    disabled={!searchKeywords.trim() || isSearching}
                    variant="outline"
                    className="w-full"
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Buscar Manual
                  </Button>
                </CardContent>
              </Card>

              {/* Results Panel */}
              <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Resultados ({videos.length})
                    </span>
                    {hasMore && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isSearching}
                      >
                        Cargar más
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {videos.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Busca vídeos para empezar a etiquetar</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                      {videos.map((video) => (
                        <div
                          key={video.tiktokId}
                          onClick={() => setSelectedVideo(video)}
                          className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                            selectedVideo?.tiktokId === video.tiktokId
                              ? "ring-2 ring-purple-500"
                              : "hover:ring-1 hover:ring-slate-600"
                          }`}
                        >
                          <div className="aspect-[9/16] relative">
                            <img
                              src={video.coverUrl}
                              alt={video.description}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            
                            {/* Stats overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <div className="flex items-center gap-3 text-white text-sm mb-2">
                                <span className="flex items-center gap-1">
                                  <Heart className="w-4 h-4 text-red-400" />
                                  {formatNumber(video.likes)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-4 h-4 text-blue-400" />
                                  {formatNumber(video.views)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-green-400" />
                                  {video.duration}s
                                </span>
                              </div>
                              <p className="text-white text-xs line-clamp-2">
                                {video.description}
                              </p>
                            </div>

                            {/* Engagement badge */}
                            <div className="absolute top-2 right-2">
                              <Badge className={`${
                                video.engagementRate >= 10 
                                  ? "bg-green-500" 
                                  : video.engagementRate >= 5 
                                    ? "bg-yellow-500" 
                                    : "bg-slate-500"
                              }`}>
                                {video.engagementRate.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Label Panel */}
            {selectedVideo && (
              <Card className="bg-slate-900/50 border-slate-800 border-purple-500/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Filter className="w-5 h-5 text-purple-400" />
                    Etiquetar Vídeo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Video Preview */}
                    <div className="space-y-4">
                      <div className="aspect-video rounded-lg overflow-hidden bg-slate-800">
                        <img
                          src={selectedVideo.coverUrl}
                          alt={selectedVideo.description}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={selectedVideo.tiktokUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button variant="outline" className="w-full">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Ver en TikTok
                          </Button>
                        </a>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-slate-800 rounded-lg p-2">
                          <Heart className="w-4 h-4 mx-auto text-red-400 mb-1" />
                          <div className="text-white font-bold">{formatNumber(selectedVideo.likes)}</div>
                          <div className="text-xs text-slate-400">Likes</div>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-2">
                          <Eye className="w-4 h-4 mx-auto text-blue-400 mb-1" />
                          <div className="text-white font-bold">{formatNumber(selectedVideo.views)}</div>
                          <div className="text-xs text-slate-400">Views</div>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-2">
                          <MessageCircle className="w-4 h-4 mx-auto text-green-400 mb-1" />
                          <div className="text-white font-bold">{formatNumber(selectedVideo.comments)}</div>
                          <div className="text-xs text-slate-400">Comments</div>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-2">
                          <Share2 className="w-4 h-4 mx-auto text-purple-400 mb-1" />
                          <div className="text-white font-bold">{formatNumber(selectedVideo.shares)}</div>
                          <div className="text-xs text-slate-400">Shares</div>
                        </div>
                      </div>
                    </div>

                    {/* Label Form */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-300">Descripción</Label>
                        <p className="text-white text-sm bg-slate-800 p-3 rounded-lg max-h-24 overflow-y-auto">
                          {selectedVideo.description}
                        </p>
                      </div>

                      <div>
                        <Label className="text-slate-300">Hashtags</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedVideo.hashtags.slice(0, 10).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-slate-300">Métricas</Label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="bg-slate-800 p-2 rounded">
                            <span className="text-xs text-slate-400">Engagement Rate</span>
                            <div className="text-white font-bold">{selectedVideo.engagementRate.toFixed(2)}%</div>
                          </div>
                          <div className="bg-slate-800 p-2 rounded">
                            <span className="text-xs text-slate-400">Like/View Ratio</span>
                            <div className="text-white font-bold">{selectedVideo.likeToViewRatio.toFixed(2)}%</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-slate-300">Notas (opcional)</Label>
                        <Textarea
                          value={labelNotes}
                          onChange={(e) => setLabelNotes(e.target.value)}
                          placeholder="¿Por qué es viral o no viral?"
                          className="bg-slate-800 border-slate-700"
                          rows={3}
                        />
                      </div>

                      {/* Botón principal: Aceptar para Calendario */}
                      <Button
                        onClick={handleAcceptForCalendar}
                        disabled={acceptForCalendarMutation.isPending || !selectedSector}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3"
                      >
                        {acceptForCalendarMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                          <CalendarPlus className="w-5 h-5 mr-2" />
                        )}
                        ACEPTAR PARA CALENDARIO
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-slate-700" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-slate-900 px-2 text-slate-500">o solo etiquetar</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleLabel(true)}
                          disabled={labelMutation.isPending || !selectedSector}
                          variant="outline"
                          className="flex-1 border-green-600 text-green-400 hover:bg-green-600/20"
                        >
                          {labelMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <ThumbsUp className="w-4 h-4 mr-2" />
                          )}
                          Viral
                        </Button>
                        <Button
                          onClick={() => handleLabel(false)}
                          disabled={labelMutation.isPending || !selectedSector}
                          variant="outline"
                          className="flex-1 border-red-600 text-red-400 hover:bg-red-600/20"
                        >
                          {labelMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <ThumbsDown className="w-4 h-4 mr-2" />
                          )}
                          No Viral
                        </Button>
                      </div>
                      
                      {!selectedSector && (
                        <p className="text-amber-400 text-sm text-center">
                          ⚠️ Selecciona un sector antes de etiquetar
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Historial de Etiquetado</CardTitle>
              </CardHeader>
              <CardContent>
                {!labeledReels || labeledReels.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay reels etiquetados todavía</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {labeledReels.map((reel) => (
                      <div
                        key={reel.id}
                        className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg"
                      >
                        <img
                          src={reel.coverUrl || ""}
                          alt=""
                          className="w-16 h-24 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm line-clamp-2">
                            {reel.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {reel.sectorSlug}
                            </Badge>
                            {reel.isViral ? (
                              <Badge className="bg-green-500 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Viral
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500 text-xs">
                                <XCircle className="w-3 h-3 mr-1" />
                                No Viral
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-white">{formatNumber(reel.likes)} likes</div>
                          <div className="text-slate-400">{formatNumber(reel.views)} views</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectors?.map((sector) => {
                const stats = allStats?.[sector.slug];
                return (
                  <Card key={sector.slug} className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">{sector.name}</CardTitle>
                      <CardDescription>
                        Keywords: {sector.keywords.slice(0, 3).join(", ")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total etiquetados</span>
                          <span className="text-white font-bold">{stats?.totalLabeled || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-400">Virales</span>
                          <span className="text-white font-bold">{stats?.viralCount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-400">No virales</span>
                          <span className="text-white font-bold">{stats?.notViralCount || 0}</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          {stats && stats.totalLabeled > 0 && (
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-green-400"
                              style={{
                                width: `${(stats.viralCount / stats.totalLabeled) * 100}%`,
                              }}
                            />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 text-center">
                          {stats && stats.totalLabeled >= 10
                            ? "✅ Datos suficientes para predicción"
                            : `Necesitas ${10 - (stats?.totalLabeled || 0)} más para predicción`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
