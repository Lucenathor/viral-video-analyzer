import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useCallback, useEffect } from "react";
import { 
  Upload, 
  Video, 
  Sparkles, 
  Clock, 
  Scissors, 
  Target,
  TrendingUp,
  Zap,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Play,
  ArrowRight,
  BarChart3,
  FileVideo,
  Lock,
  Calendar,
  Link as LinkIcon,
  Crown,
  Flame,
  Star,
  Rocket
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface AnalysisResult {
  id: number;
  hookAnalysis: string;
  structureBreakdown: {
    segments: Array<{
      startTime: number;
      endTime: number;
      type: string;
      description: string;
    }>;
  };
  viralityFactors: {
    factors: Array<{
      name: string;
      score: number;
      description: string;
    }>;
  };
  summary: string;
  overallScore: number;
  hookScore: number;
  pacingScore: number;
  engagementScore: number;
}

// Unlock dates
const UNLOCK_DATE_USER_VIDEO = new Date('2026-01-30T00:00:00');
const UNLOCK_DATE_VIRAL_VIDEO = new Date('2026-02-05T00:00:00');

// Check if feature is unlocked
function isFeatureUnlocked(unlockDate: Date): boolean {
  return new Date() >= unlockDate;
}

// Format date for display
function formatUnlockDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });
}

// Calculate days until unlock
function daysUntilUnlock(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Upload file in chunks through the server
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

async function uploadFileInChunks(
  file: File,
  uploadChunkMutation: any,
  fileKey: string,
  onProgress: (progress: number) => void
): Promise<void> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    
    const base64Chunk = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(chunk);
    });
    
    await uploadChunkMutation.mutateAsync({
      fileKey,
      chunk: base64Chunk,
      chunkIndex: i,
      totalChunks,
      mimeType: file.type,
      isLastChunk: i === totalChunks - 1,
    });
    
    const uploadProgress = ((i + 1) / totalChunks) * 50;
    onProgress(uploadProgress);
  }
}

// Locked Feature Card Component
function LockedFeatureCard({ 
  title, 
  description, 
  unlockDate, 
  icon: Icon,
  gradient 
}: { 
  title: string; 
  description: string; 
  unlockDate: Date;
  icon: React.ElementType;
  gradient: string;
}) {
  const days = daysUntilUnlock(unlockDate);
  
  return (
    <Card className="relative overflow-hidden bg-card/30 border-primary/20 backdrop-blur-xl">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      
      <CardContent className="relative p-8 text-center">
        {/* Lock icon with glow */}
        <div className="relative inline-block mb-6">
          <div className={`w-24 h-24 rounded-3xl ${gradient} flex items-center justify-center mx-auto shadow-2xl`}>
            <Lock className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur-xl -z-10 animate-pulse-glow" />
        </div>
        
        {/* Badge */}
        <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 px-4 py-1.5">
          <Calendar className="w-3 h-3 mr-2" />
          Se desbloquea el {formatUnlockDate(unlockDate)}
        </Badge>
        
        <h3 className="text-2xl font-bold mb-3 text-gradient">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
        
        {/* Countdown */}
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-background/50 border border-primary/20">
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient">{days}</div>
            <div className="text-xs text-muted-foreground">días</div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">para el desbloqueo</span>
          </div>
        </div>
        
        {/* Features preview */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="p-3 rounded-xl bg-background/30 border border-border/30">
            <Sparkles className="w-5 h-5 text-primary mx-auto mb-2" />
            <span className="text-xs text-muted-foreground">Análisis IA</span>
          </div>
          <div className="p-3 rounded-xl bg-background/30 border border-border/30">
            <BarChart3 className="w-5 h-5 text-accent mx-auto mb-2" />
            <span className="text-xs text-muted-foreground">Métricas</span>
          </div>
          <div className="p-3 rounded-xl bg-background/30 border border-border/30">
            <Target className="w-5 h-5 text-pink-500 mx-auto mb-2" />
            <span className="text-xs text-muted-foreground">Mejoras</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analyzer() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("analyze");
  
  // User video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(0);
  const [analysisStartTime, setAnalysisStartTime] = useState<number>(0);
  const [currentTip, setCurrentTip] = useState<string>("");
  
  // TikTok URL state
  const [tiktokUrl, setTiktokUrl] = useState<string>("");
  const [isDownloadingTiktok, setIsDownloadingTiktok] = useState(false);
  
  // Check unlock status
  const isUserVideoUnlocked = isFeatureUnlocked(UNLOCK_DATE_USER_VIDEO);
  const isViralVideoUnlocked = isFeatureUnlocked(UNLOCK_DATE_VIRAL_VIDEO);
  
  // Tips to show while waiting
  const analysisTips = [
    "💡 Tip: Los vídeos más cortos (15-30s) se procesan más rápido",
    "💡 Tip: Los formatos MP4 y MOV son los más rápidos de procesar",
    "💡 Tip: El hook de los primeros 3 segundos es clave para la viralidad",
    "💡 Tip: Los vídeos con buena iluminación se analizan mejor",
    "💡 Tip: El análisis incluye transcripción, temas y emociones",
    "💡 Tip: Gemini analiza cada frame para detectar elementos visuales",
    "💡 Tip: Un buen CTA al final aumenta el engagement",
    "💡 Tip: El ritmo de edición afecta la retención de audiencia",
  ];
  
  useEffect(() => {
    if (isAnalyzing) {
      setCurrentTip(analysisTips[0]);
      const tipInterval = setInterval(() => {
        setCurrentTip(prev => {
          const currentIndex = analysisTips.indexOf(prev);
          return analysisTips[(currentIndex + 1) % analysisTips.length];
        });
      }, 5000);
      return () => clearInterval(tipInterval);
    }
  }, [isAnalyzing]);
  
  useEffect(() => {
    if (isAnalyzing && analysisStartTime > 0) {
      const countdownInterval = setInterval(() => {
        setEstimatedTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(countdownInterval);
    }
  }, [isAnalyzing, analysisStartTime]);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const videoInputRef = useRef<HTMLInputElement>(null);

  const getUploadUrl = trpc.video.getUploadUrl.useMutation();
  const uploadChunk = trpc.video.uploadChunk.useMutation();
  const finalizeUploadAndAnalyze = trpc.video.finalizeUploadAndAnalyze.useMutation();

  const handleVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande. Máximo 100MB.");
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setAnalysisResult(null);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!videoFile) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setUploadStatus("Preparando subida...");
    
    const fileSizeMB = videoFile.size / (1024 * 1024);
    const uploadTimeEstimate = Math.ceil(fileSizeMB * 1.2);
    const processingTimeEstimate = 180;
    const geminiTimeEstimate = 30;
    const totalEstimate = uploadTimeEstimate + processingTimeEstimate + geminiTimeEstimate;
    
    setEstimatedTimeRemaining(totalEstimate);
    setAnalysisStartTime(Date.now());
    
    try {
      setUploadStatus("Iniciando subida...");
      setAnalysisProgress(2);
      
      const { fileKey } = await getUploadUrl.mutateAsync({
        fileName: videoFile.name,
        mimeType: videoFile.type,
      });
      
      setUploadStatus("Subiendo vídeo...");
      
      await uploadFileInChunks(
        videoFile,
        uploadChunk,
        fileKey,
        (progress) => {
          setAnalysisProgress(progress);
          setUploadStatus(`Subiendo vídeo... ${Math.round(progress)}%`);
        }
      );
      
      setUploadStatus("Vídeo subido. Iniciando análisis...");
      setAnalysisProgress(55);
      
      const analysisSteps = [
        { progress: 56, message: "Extrayendo frames del vídeo..." },
        { progress: 60, message: "Analizando audio y transcripción..." },
        { progress: 65, message: "Detectando escenas y cortes..." },
        { progress: 70, message: "Analizando niveles de audio..." },
        { progress: 75, message: "Procesando con IA..." },
        { progress: 80, message: "Analizando hook inicial..." },
        { progress: 85, message: "Evaluando factores de viralidad..." },
        { progress: 90, message: "Generando recomendaciones..." },
        { progress: 95, message: "Finalizando análisis..." },
      ];
      let stepIndex = 0;
      const analysisProgressInterval = setInterval(() => {
        if (stepIndex < analysisSteps.length) {
          setAnalysisProgress(analysisSteps[stepIndex].progress);
          setUploadStatus(analysisSteps[stepIndex].message);
          stepIndex++;
        }
      }, 3000);
      
      const result = await finalizeUploadAndAnalyze.mutateAsync({
        fileKey,
        fileName: videoFile.name,
        mimeType: videoFile.type,
        fileSize: videoFile.size,
        analysisType: "viral_analysis",
      });
      
      clearInterval(analysisProgressInterval);
      
      if (result && result.id) {
        setAnalysisResult(result as unknown as AnalysisResult);
        setAnalysisProgress(100);
        setUploadStatus("¡Análisis completado!");
        toast.success("¡Análisis completado con éxito!");
      } else {
        throw new Error("Error al procesar el análisis");
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      const errorMessage = error.message || "Error desconocido";
      
      if (errorMessage.includes("JSON")) {
        toast.error("Error al procesar la respuesta del análisis. Por favor, intenta de nuevo.");
      } else if (errorMessage.includes("Azure")) {
        toast.error("Azure no pudo procesar el vídeo. Asegúrate de que tenga audio y sea un formato compatible.");
      } else {
        toast.error(`Error: ${errorMessage}`);
      }
      setUploadStatus("");
    } finally {
      setIsAnalyzing(false);
      setEstimatedTimeRemaining(0);
    }
  };

  const handleTiktokDownload = async () => {
    if (!tiktokUrl.trim()) {
      toast.error("Por favor, ingresa una URL de TikTok válida");
      return;
    }
    
    if (!tiktokUrl.includes("tiktok.com")) {
      toast.error("La URL debe ser de TikTok");
      return;
    }
    
    setIsDownloadingTiktok(true);
    toast.info("Descargando vídeo de TikTok...");
    
    try {
      toast.info("Esta función estará disponible el 5 de febrero");
    } catch (error: any) {
      toast.error("Error al descargar el vídeo de TikTok");
    } finally {
      setIsDownloadingTiktok(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20">
          <Card className="max-w-md mx-auto glass-card border-primary/20">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-gradient">Acceso Requerido</CardTitle>
              <CardDescription>
                Inicia sesión para analizar tus vídeos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full btn-premium gradient-primary text-white" asChild>
                <a href={getLoginUrl()}>
                  <Zap className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-8 overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        
        {/* Floating particles */}
        <div className="absolute top-20 left-10 w-3 h-3 rounded-full bg-primary/50 animate-float" />
        <div className="absolute top-40 right-20 w-2 h-2 rounded-full bg-accent/50 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/4 w-4 h-4 rounded-full bg-pink-500/30 animate-float" style={{ animationDelay: '2s' }} />
        
        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Premium badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full badge-premium mb-6 animate-fade-in-scale">
              <Rocket className="w-4 h-4 text-primary animate-bounce-subtle" />
              <span className="text-sm font-semibold text-gradient">Analizador con IA Avanzada</span>
              <Sparkles className="w-4 h-4 text-accent animate-bounce-subtle" style={{ animationDelay: '0.5s' }} />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in-up">
              <span className="text-foreground">Analiza tu </span>
              <span className="text-gradient">Potencial Viral</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Descubre qué hace que un vídeo se vuelva viral. Obtén análisis detallados, 
              puntuaciones y recomendaciones personalizadas.
            </p>
            
            {/* Explicación de la sección */}
            <div className="glass-card rounded-2xl p-6 max-w-3xl mx-auto text-left animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                ¿Para qué sirve esta sección?
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                El <strong className="text-foreground">Analizador de Vídeos</strong> usa IA avanzada (Gemini) para analizar tus vídeos o vídeos virales de TikTok. 
                Te da una <strong className="text-foreground">puntuación de viralidad</strong> y recomendaciones específicas para mejorar tu contenido.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-400 text-xs">1</span>
                  </div>
                  <span className="text-muted-foreground"><strong className="text-foreground">Sube tu vídeo</strong> o pega la URL de un TikTok viral</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 text-xs">2</span>
                  </div>
                  <span className="text-muted-foreground"><strong className="text-foreground">La IA analiza</strong> hook, estructura, ritmo y engagement</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-400 text-xs">3</span>
                  </div>
                  <span className="text-muted-foreground"><strong className="text-foreground">Recibe puntuación</strong> y consejos para mejorar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-card/50 p-1.5 rounded-xl border border-border/50">
              <TabsTrigger 
                value="analyze" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg transition-all"
              >
                <Video className="w-4 h-4" />
                Analizar Tu Vídeo
                {!isUserVideoUnlocked && <Lock className="w-3 h-3 ml-1" />}
              </TabsTrigger>
              <TabsTrigger 
                value="viral-reference" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg transition-all"
              >
                <TrendingUp className="w-4 h-4" />
                Analizar Vídeo Viral
                {!isViralVideoUnlocked && <Lock className="w-3 h-3 ml-1" />}
              </TabsTrigger>
            </TabsList>

            {/* Analyze Your Video Tab */}
            <TabsContent value="analyze" className="space-y-6 animate-fade-in-up">
              {!isUserVideoUnlocked ? (
                <LockedFeatureCard
                  title="Analiza Tu Propio Vídeo"
                  description="Sube tu vídeo y obtén un análisis completo de su potencial viral con recomendaciones de mejora personalizadas."
                  unlockDate={UNLOCK_DATE_USER_VIDEO}
                  icon={Video}
                  gradient="gradient-primary"
                />
              ) : (
                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                      <span>Sube Tu Vídeo</span>
                    </CardTitle>
                    <CardDescription>
                      Sube tu vídeo para analizar su potencial viral y obtener recomendaciones de mejora
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoSelect}
                      className="hidden"
                    />
                    
                    {videoPreview ? (
                      <div className="space-y-4">
                        <div className="aspect-video rounded-xl overflow-hidden bg-black ring-2 ring-primary/20">
                          <video
                            src={videoPreview}
                            controls
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                            onClick={() => videoInputRef.current?.click()}
                            disabled={isAnalyzing}
                          >
                            Cambiar Vídeo
                          </Button>
                          <Button
                            className="flex-1 btn-premium gradient-primary text-white"
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                          >
                            {isAnalyzing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Procesando...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Analizar Vídeo
                              </>
                            )}
                          </Button>
                        </div>
                        {isAnalyzing && (
                          <div className="space-y-4 p-5 rounded-xl bg-primary/5 border border-primary/20">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{uploadStatus || 'Procesando...'}</span>
                              <span className="font-mono font-semibold text-primary">
                                {estimatedTimeRemaining > 0 ? (
                                  <>
                                    <Clock className="w-4 h-4 inline mr-1" />
                                    ~{formatTime(estimatedTimeRemaining)} restantes
                                  </>
                                ) : (
                                  'Finalizando...'
                                )}
                              </span>
                            </div>
                            <Progress value={analysisProgress} className="h-3" />
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{Math.round(analysisProgress)}% completado</span>
                              <span className="text-muted-foreground">
                                {analysisProgress < 50 ? 'Subiendo' : analysisProgress < 80 ? 'Procesando' : 'Analizando con IA'}
                              </span>
                            </div>
                            {currentTip && (
                              <div className="text-sm text-center text-muted-foreground bg-background/50 rounded-lg p-3">
                                {currentTip}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-primary/30 rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
                        onClick={() => videoInputRef.current?.click()}
                      >
                        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                          <FileVideo className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Arrastra tu vídeo aquí</h3>
                        <p className="text-muted-foreground mb-4">o haz clic para seleccionar</p>
                        <Badge variant="outline" className="text-xs">
                          MP4, MOV, AVI • Máx 100MB
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Analysis Results */}
              {analysisResult && (
                <Card className="glass-card border-primary/20 animate-fade-in-up">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <span>Resultados del Análisis</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Overall Score */}
                    <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                      <div className="text-6xl font-bold text-gradient mb-2">
                        {analysisResult.overallScore}
                      </div>
                      <p className="text-muted-foreground">Puntuación de Viralidad</p>
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 text-center">
                        <Zap className="w-6 h-6 text-pink-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-pink-500">{analysisResult.hookScore}</div>
                        <p className="text-xs text-muted-foreground">Hook</p>
                      </div>
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                        <Scissors className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-500">{analysisResult.pacingScore}</div>
                        <p className="text-xs text-muted-foreground">Ritmo</p>
                      </div>
                      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                        <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-green-500">{analysisResult.engagementScore}</div>
                        <p className="text-xs text-muted-foreground">Engagement</p>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Resumen
                      </h4>
                      <Streamdown>{analysisResult.summary}</Streamdown>
                    </div>

                    {/* Hook Analysis */}
                    <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-pink-500" />
                        Análisis del Hook
                      </h4>
                      <Streamdown>{analysisResult.hookAnalysis}</Streamdown>
                    </div>

                    {/* Virality Factors */}
                    {analysisResult.viralityFactors?.factors && (
                      <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          Factores de Viralidad
                        </h4>
                        <div className="space-y-3">
                          {analysisResult.viralityFactors.factors.map((factor, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">{factor.name}</span>
                                  <span className="text-sm text-primary font-semibold">{factor.score}/10</span>
                                </div>
                                <Progress value={factor.score * 10} className="h-2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Analyze Viral Video Tab */}
            <TabsContent value="viral-reference" className="space-y-6 animate-fade-in-up">
              {!isViralVideoUnlocked ? (
                <LockedFeatureCard
                  title="Analiza Vídeos Virales de TikTok"
                  description="Pega la URL de cualquier vídeo viral de TikTok y obtén un análisis detallado de por qué se volvió viral."
                  unlockDate={UNLOCK_DATE_VIRAL_VIDEO}
                  icon={TrendingUp}
                  gradient="gradient-accent"
                />
              ) : (
                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                        <LinkIcon className="w-5 h-5 text-white" />
                      </div>
                      <span>Analizar Vídeo de TikTok</span>
                    </CardTitle>
                    <CardDescription>
                      Pega la URL de un vídeo viral de TikTok para analizar qué lo hizo exitoso
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://www.tiktok.com/@usuario/video/..."
                        value={tiktokUrl}
                        onChange={(e) => setTiktokUrl(e.target.value)}
                        className="flex-1 bg-background/50 border-primary/20 focus:border-primary/50"
                      />
                      <Button
                        className="btn-premium gradient-accent text-white"
                        onClick={handleTiktokDownload}
                        disabled={isDownloadingTiktok}
                      >
                        {isDownloadingTiktok ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Analizar
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Copia la URL del vídeo de TikTok que quieres analizar
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Features Preview */}
          <div className="grid md:grid-cols-3 gap-4 mt-12">
            <Card className="glass-card border-primary/20 p-6 text-center hover-lift">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="font-semibold mb-2">Análisis de Hook</h3>
              <p className="text-sm text-muted-foreground">Evalúa los primeros 3 segundos críticos</p>
            </Card>
            <Card className="glass-card border-primary/20 p-6 text-center hover-lift">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Scissors className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-semibold mb-2">Estructura y Ritmo</h3>
              <p className="text-sm text-muted-foreground">Analiza cortes, transiciones y pacing</p>
            </Card>
            <Card className="glass-card border-primary/20 p-6 text-center hover-lift">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold mb-2">Recomendaciones</h3>
              <p className="text-sm text-muted-foreground">Mejoras específicas para tu contenido</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
