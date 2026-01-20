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
  Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { Input } from "@/components/ui/input";

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
    
    // Convert chunk to base64
    const base64Chunk = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
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
    
    // Update progress (upload is 0-50% of total progress)
    const uploadProgress = ((i + 1) / totalChunks) * 50;
    onProgress(uploadProgress);
  }
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
  
  // Rotate tips every 5 seconds during analysis
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
  
  // Countdown timer
  useEffect(() => {
    if (isAnalyzing && analysisStartTime > 0) {
      const countdownInterval = setInterval(() => {
        setEstimatedTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(countdownInterval);
    }
  }, [isAnalyzing, analysisStartTime]);
  
  // Format seconds to mm:ss
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
    
    // Calculate estimated time based on file size
    const fileSizeMB = videoFile.size / (1024 * 1024);
    const uploadTimeEstimate = Math.ceil(fileSizeMB * 1.2);
    const processingTimeEstimate = 180;
    const geminiTimeEstimate = 30;
    const totalEstimate = uploadTimeEstimate + processingTimeEstimate + geminiTimeEstimate;
    
    setEstimatedTimeRemaining(totalEstimate);
    setAnalysisStartTime(Date.now());
    
    try {
      // Step 1: Get upload key from server
      setUploadStatus("Iniciando subida...");
      setAnalysisProgress(2);
      
      const { fileKey } = await getUploadUrl.mutateAsync({
        fileName: videoFile.name,
        mimeType: videoFile.type,
      });
      
      // Step 2: Upload file in chunks
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
      
      // Step 3: Finalize upload and start analysis
      setUploadStatus("Vídeo subido. Iniciando análisis...");
      setAnalysisProgress(55);
      
      // Progress simulation with detailed messages
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
      
      // The result is the analysis directly, not wrapped in success/analysis
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
    
    // Validate TikTok URL
    if (!tiktokUrl.includes("tiktok.com")) {
      toast.error("La URL debe ser de TikTok");
      return;
    }
    
    setIsDownloadingTiktok(true);
    toast.info("Descargando vídeo de TikTok...");
    
    try {
      // TODO: Implement TikTok download via RapidAPI
      // For now, show coming soon message
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20">
          <Card className="max-w-md mx-auto bg-card/50 border-border/50">
            <CardHeader className="text-center">
              <CardTitle>Acceso Requerido</CardTitle>
              <CardDescription>
                Inicia sesión para analizar tus vídeos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full gradient-primary" asChild>
                <a href={getLoginUrl()}>Iniciar Sesión</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gradient">
              Analizador de Viralidad
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Descubre el potencial viral de tu vídeo con análisis de IA avanzado.
              Obtén puntuaciones detalladas y recomendaciones para mejorar tu contenido.
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="analyze" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Analizar Tu Vídeo
              </TabsTrigger>
              <TabsTrigger value="viral-reference" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Analizar Vídeo Viral
              </TabsTrigger>
            </TabsList>

            {/* Analyze Your Video Tab */}
            <TabsContent value="analyze" className="space-y-6">
              {/* Upload Card */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    Sube Tu Vídeo
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
                      <div className="aspect-video rounded-xl overflow-hidden bg-black">
                        <video
                          src={videoPreview}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => videoInputRef.current?.click()}
                          disabled={isAnalyzing}
                        >
                          Cambiar Vídeo
                        </Button>
                        <Button
                          className="flex-1 gradient-primary"
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
                        <div className="space-y-4 p-4 rounded-xl bg-secondary/20 border border-border/30">
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
                            <div className="text-sm text-center text-muted-foreground bg-secondary/30 rounded-lg p-3 animate-pulse">
                              {currentTip}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => videoInputRef.current?.click()}
                      className="border-2 border-dashed border-border/50 rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">Haz clic para subir</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        O arrastra y suelta tu vídeo aquí
                      </p>
                      <p className="text-xs text-muted-foreground">
                        MP4, MOV, WebM • Máximo 100MB
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Analysis Results */}
              {analysisResult && (
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-primary" />
                          Resultados del Análisis
                        </CardTitle>
                        <CardDescription>
                          Análisis detallado del potencial viral de tu vídeo
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-gradient">
                          {analysisResult.overallScore}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Puntuación Viral
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Score Cards */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-secondary/30 text-center">
                        <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{analysisResult.hookScore}%</div>
                        <div className="text-xs text-muted-foreground">Hook</div>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/30 text-center">
                        <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{analysisResult.pacingScore}%</div>
                        <div className="text-xs text-muted-foreground">Ritmo</div>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/30 text-center">
                        <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{analysisResult.engagementScore}%</div>
                        <div className="text-xs text-muted-foreground">Engagement</div>
                      </div>
                    </div>

                    {/* Hook Analysis */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        Análisis del Hook
                      </h4>
                      <p className="text-sm text-muted-foreground bg-secondary/30 p-4 rounded-lg">
                        {analysisResult.hookAnalysis}
                      </p>
                    </div>

                    {/* Structure Breakdown */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        Estructura del Vídeo
                      </h4>
                      <div className="space-y-2">
                        {analysisResult.structureBreakdown?.segments?.map((segment, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                            <div className="flex-shrink-0 px-2 py-1 rounded bg-primary/20 text-primary text-xs font-mono">
                              {segment.startTime}s - {segment.endTime}s
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{segment.type}</div>
                              <div className="text-xs text-muted-foreground">{segment.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Virality Factors */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        Factores de Viralidad
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {analysisResult.viralityFactors?.factors?.map((factor, index) => (
                          <div key={index} className="p-4 rounded-lg bg-secondary/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{factor.name}</span>
                              <span className="text-primary font-bold">{factor.score}%</span>
                            </div>
                            <Progress value={factor.score} className="h-1.5 mb-2" />
                            <p className="text-xs text-muted-foreground">{factor.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        Resumen y Recomendaciones
                      </h4>
                      <div className="p-4 rounded-lg bg-secondary/30 prose prose-invert prose-sm max-w-none">
                        <Streamdown>{analysisResult.summary}</Streamdown>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Viral Reference Tab - Coming Soon */}
            <TabsContent value="viral-reference" className="space-y-6">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Analizar Vídeo Viral de Referencia
                  </CardTitle>
                  <CardDescription>
                    Analiza un vídeo viral de TikTok o Instagram para aprender de su estructura
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Coming Soon Banner */}
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 p-8 text-center border border-primary/30">
                    <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                    <div className="relative z-10">
                      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 border-2 border-primary/30">
                        <Lock className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">Disponible el 5 de Febrero</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        Esta función te permitirá analizar vídeos virales de TikTok e Instagram 
                        para descubrir qué técnicas usan y aplicarlas a tu contenido.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                        <Calendar className="w-5 h-5" />
                        <span>5 de Febrero, 2026</span>
                      </div>
                    </div>
                  </div>

                  {/* Preview of Features */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-secondary/20 border border-border/30 opacity-60">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <LinkIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Análisis por URL</h4>
                          <p className="text-xs text-muted-foreground">Pega el enlace del vídeo viral</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="https://tiktok.com/@user/video/..." 
                          disabled 
                          className="bg-background/50"
                        />
                        <Button disabled variant="outline">
                          <Lock className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-secondary/20 border border-border/30 opacity-60">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                          <Target className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Comparar Vídeos</h4>
                          <p className="text-xs text-muted-foreground">Compara tu vídeo con el viral</p>
                        </div>
                      </div>
                      <Button disabled className="w-full" variant="outline">
                        <Lock className="w-4 h-4 mr-2" />
                        Próximamente
                      </Button>
                    </div>
                  </div>

                  {/* What you'll get */}
                  <div className="p-4 rounded-lg bg-secondary/20 border border-border/30">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Lo que podrás hacer
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Analizar vídeos virales de TikTok e Instagram directamente por URL</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Comparar tu vídeo con el viral para identificar diferencias clave</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Obtener recomendaciones específicas de cortes y edición</span>
                      </li>
                      <li className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Aprender las técnicas exactas que hacen viral un vídeo</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
