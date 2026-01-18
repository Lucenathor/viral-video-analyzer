import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { 
  LayoutDashboard, 
  Video, 
  BarChart3,
  MessageSquare,
  Loader2,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Play,
  Eye
} from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const { data: analyses, isLoading: analysesLoading } = trpc.video.getUserAnalyses.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const { data: videos, isLoading: videosLoading } = trpc.video.getUserVideos.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  // Tickets are not stored in DB, just sent to owner
  const tickets: { id: number; status: string }[] = [];
  const ticketsLoading = false;

  const isLoading = analysesLoading || videosLoading || ticketsLoading;

  // Stats
  const totalAnalyses = analyses?.length || 0;
  const completedAnalyses = analyses?.filter(a => a.status === "completed").length || 0;
  const totalVideos = videos?.length || 0;
  const openTickets = tickets?.filter((t: { status: string }) => t.status !== "resolved" && t.status !== "closed").length || 0;

  const getAnalysisTypeBadge = (type: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      viral_analysis: { bg: "bg-purple-500/20", text: "text-purple-400", label: "Análisis Viral" },
      comparison: { bg: "bg-cyan-500/20", text: "text-cyan-400", label: "Comparación" },
      expert_review: { bg: "bg-orange-500/20", text: "text-orange-400", label: "Revisión Experta" },
    };
    const style = styles[type] || styles.viral_analysis;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "Pendiente" },
      processing: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Procesando" },
      completed: { bg: "bg-green-500/20", text: "text-green-400", label: "Completado" },
      failed: { bg: "bg-red-500/20", text: "text-red-400", label: "Error" },
    };
    const style = styles[status] || styles.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 glow-primary">
                <LayoutDashboard className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Tu <span className="text-gradient">Dashboard</span>
              </h1>
              <p className="text-muted-foreground mb-8">
                Inicia sesión para acceder a tu dashboard y ver el historial 
                de tus análisis y tickets de soporte.
              </p>
              <a href={getLoginUrl()}>
                <Button size="lg" className="gradient-primary glow-primary gap-2">
                  <Zap className="w-5 h-5" />
                  Iniciar Sesión
                </Button>
              </a>
            </div>
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Hola, <span className="text-gradient">{user?.name || "Usuario"}</span>
            </h1>
            <p className="text-muted-foreground">
              Bienvenido a tu dashboard. Aquí puedes ver tu historial de análisis y soporte.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Análisis</p>
                    <p className="text-2xl font-bold">{totalAnalyses}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completados</p>
                    <p className="text-2xl font-bold text-green-400">{completedAnalyses}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Vídeos Subidos</p>
                    <p className="text-2xl font-bold">{totalVideos}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
                    <Video className="w-5 h-5 text-accent-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tickets Abiertos</p>
                    <p className="text-2xl font-bold text-yellow-400">{openTickets}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Link href="/analyzer">
              <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-all cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">Nuevo Análisis</h3>
                    <p className="text-sm text-muted-foreground">Analiza un vídeo viral</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/library">
              <Card className="bg-card/50 border-border/50 hover:border-accent/50 transition-all cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Play className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold group-hover:text-accent transition-colors">Biblioteca</h3>
                    <p className="text-sm text-muted-foreground">Explora reels virales</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/support">
              <Card className="bg-card/50 border-border/50 hover:border-green-500/50 transition-all cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold group-hover:text-green-400 transition-colors">Soporte</h3>
                    <p className="text-sm text-muted-foreground">Contacta con expertos</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="analyses" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="analyses" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Mis Análisis
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-2">
                <Video className="w-4 h-4" />
                Mis Vídeos
              </TabsTrigger>
            </TabsList>

            {/* Analyses Tab */}
            <TabsContent value="analyses">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle>Historial de Análisis</CardTitle>
                  <CardDescription>
                    Todos tus análisis de vídeos virales y comparaciones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : analyses && analyses.length > 0 ? (
                    <div className="space-y-3">
                      {analyses.map((analysis) => (
                        <div
                          key={analysis.id}
                          className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getAnalysisTypeBadge(analysis.analysisType)}
                                {getStatusBadge(analysis.status)}
                              </div>
                              {analysis.status === "completed" && (
                                <div className="grid grid-cols-4 gap-4 mt-3">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-primary">
                                      {analysis.overallScore || 0}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">General</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-accent">
                                      {analysis.hookScore || 0}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">Hook</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-green-400">
                                      {analysis.pacingScore || 0}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">Ritmo</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-orange-400">
                                      {analysis.engagementScore || 0}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">Engagement</div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(analysis.createdAt).toLocaleDateString("es-ES", {
                                  day: "numeric",
                                  month: "short"
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Sin análisis aún</h3>
                      <p className="text-muted-foreground mb-4">
                        Comienza analizando tu primer vídeo viral
                      </p>
                      <Link href="/analyzer">
                        <Button className="gradient-primary">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Analizar Vídeo
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle>Mis Vídeos</CardTitle>
                  <CardDescription>
                    Todos los vídeos que has subido para análisis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : videos && videos.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {videos.map((video) => (
                        <div
                          key={video.id}
                          className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="aspect-video rounded-lg bg-black/50 flex items-center justify-center mb-3">
                            {video.thumbnailUrl ? (
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title || "Video"}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Video className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                          <h4 className="font-medium text-sm mb-1 truncate">
                            {video.title || "Sin título"}
                          </h4>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="capitalize">{video.videoType.replace("_", " ")}</span>
                            <span>
                              {new Date(video.createdAt).toLocaleDateString("es-ES")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Sin vídeos aún</h3>
                      <p className="text-muted-foreground mb-4">
                        Sube tu primer vídeo para analizarlo
                      </p>
                      <Link href="/analyzer">
                        <Button className="gradient-primary">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Subir Vídeo
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
