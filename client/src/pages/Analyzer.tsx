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
  FileVideo
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { useVideoCompression } from "@/hooks/useVideoCompression";

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

interface ComparisonResult {
  id: number;
  improvementPoints: Array<{
    area: string;
    current: string;
    recommendation: string;
    priority: "high" | "medium" | "low";
  }>;
  cutRecommendations: Array<{
    timestamp: string;
    action: string;
    reason: string;
  }>;
  editingSuggestions: string;
  overallScore: number;
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
  
  // Viral video state
  const [viralVideoFile, setViralVideoFile] = useState<File | null>(null);
  const [viralVideoPreview, setViralVideoPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(0);
  const [analysisStartTime, setAnalysisStartTime] = useState<number>(0);
  const [currentTip, setCurrentTip] = useState<string>("");
  
  // Tips to show while waiting
  const analysisTips = [
    "💡 Tip: Los vídeos más cortos (15-30s) se procesan más rápido",
    "💡 Tip: Comprime tu vídeo antes de subirlo para acelerar el proceso",
    "💡 Tip: Los formatos MP4 y MOV son los más rápidos de procesar",
    "💡 Tip: Azure analiza audio, texto, caras y objetos automáticamente",
    "💡 Tip: Gemini analiza cada frame para detectar elementos visuales",
    "💡 Tip: El hook de los primeros 3 segundos es clave para la viralidad",
    "💡 Tip: Los vídeos con buena iluminación se analizan mejor",
    "💡 Tip: El análisis incluye transcripción, temas, personas y emociones",
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
  
  // User video state (for comparison)
  const [userVideoFile, setUserVideoFile] = useState<File | null>(null);
  const [userVideoPreview, setUserVideoPreview] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonProgress, setComparisonProgress] = useState(0);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  
  const viralInputRef = useRef<HTMLInputElement>(null);
  const userInputRef = useRef<HTMLInputElement>(null);

  // Video compression hook
  const { compressVideo, isCompressing, compressionProgress } = useVideoCompression();
  const [compressionEnabled, setCompressionEnabled] = useState(true);

  const getUploadUrl = trpc.video.getUploadUrl.useMutation();
  const uploadChunk = trpc.video.uploadChunk.useMutation();
  const finalizeUploadAndAnalyze = trpc.video.finalizeUploadAndAnalyze.useMutation();
  // const compareVideos = trpc.video.compareVideos.useMutation(); // TODO: Implement comparison feature

  const handleViralVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande. Máximo 100MB.");
        return;
      }
      setViralVideoFile(file);
      setViralVideoPreview(URL.createObjectURL(file));
      setAnalysisResult(null);
    }
  }, []);

  const handleUserVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande. Máximo 100MB.");
        return;
      }
      setUserVideoFile(file);
      setUserVideoPreview(URL.createObjectURL(file));
      setComparisonResult(null);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!viralVideoFile) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setUploadStatus("Preparando subida...");
    
    // Calculate estimated time based on file size
    // Base: 60s upload + 180s Azure processing + 30s Gemini = ~270s for 50MB
    const fileSizeMB = viralVideoFile.size / (1024 * 1024);
    const uploadTimeEstimate = Math.ceil(fileSizeMB * 1.2); // ~1.2s per MB
    const azureTimeEstimate = 180; // Azure processing ~3 minutes
    const geminiTimeEstimate = 30; // Gemini ~30 seconds
    const totalEstimate = uploadTimeEstimate + azureTimeEstimate + geminiTimeEstimate;
    
    setEstimatedTimeRemaining(totalEstimate);
    setAnalysisStartTime(Date.now());
    
    try {
      // Step 1: Get upload key from server
      setUploadStatus("Iniciando subida...");
      setAnalysisProgress(2);
      
      const { fileKey } = await getUploadUrl.mutateAsync({
        fileName: viralVideoFile.name,
        mimeType: viralVideoFile.type,
      });
      
      // Step 2: Upload file in chunks
      setUploadStatus("Subiendo vídeo...");
      
      await uploadFileInChunks(
        viralVideoFile,
        uploadChunk,
        fileKey,
        (progress) => {
          setAnalysisProgress(progress);
          setUploadStatus(`Subiendo vídeo... ${Math.round(progress)}%`);
        }
      );
      
      // Step 3: Finalize upload and start Azure + Gemini analysis
      setUploadStatus("Vídeo subido. Enviando a Azure Video Indexer...");
      setAnalysisProgress(55);
      
      // Progress simulation with detailed messages
      const analysisSteps = [
        { progress: 56, message: "Comprimiendo vídeo con FFmpeg..." },
        { progress: 58, message: "Optimizando para análisis (esto puede tardar 1-2 min)..." },
        { progress: 62, message: "Azure procesando vídeo..." },
        { progress: 66, message: "Azure extrayendo transcripción..." },
        { progress: 70, message: "Azure detectando temas y personas..." },
        { progress: 76, message: "Descargando frames del vídeo..." },
        { progress: 82, message: "Enviando datos a Gemini..." },
        { progress: 87, message: "Gemini analizando imágenes..." },
        { progress: 92, message: "Gemini generando análisis de viralidad..." },
        { progress: 97, message: "Finalizando análisis..." },
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
        fileName: viralVideoFile.name,
        mimeType: viralVideoFile.type,
        fileSize: viralVideoFile.size,
        analysisType: "viral_analysis",
      });
      
      clearInterval(analysisProgressInterval);
      setAnalysisProgress(100);
      setUploadStatus("¡Análisis completado!");
      setAnalysisResult(result as unknown as AnalysisResult);
      toast.success("¡Análisis completado!");
      
    } catch (error: any) {
      console.error('[Analysis Error]', error);
      
      let errorMessage = 'Error desconocido';
      if (error?.message) {
        errorMessage = error.message;
      }
      
      // Show more specific error messages based on backend responses
      if (errorMessage.includes('Error al subir el vídeo a Azure')) {
        errorMessage = 'Error al subir el vídeo a Azure. Intenta con un vídeo más pequeño o en formato MP4.';
      } else if (errorMessage.includes('Azure no pudo procesar')) {
        errorMessage = 'Azure no pudo procesar el vídeo. Asegúrate de que tenga audio y sea un formato compatible.';
      } else if (errorMessage.includes('duración') || errorMessage.includes('duration')) {
        errorMessage = 'No se pudo leer la duración del vídeo. El archivo puede estar corrupto.';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout') || errorMessage.includes('tardó demasiado')) {
        errorMessage = 'El análisis tardó demasiado tiempo. Intenta con un vídeo más corto (menos de 2 minutos).';
      } else if (errorMessage.includes('413') || errorMessage.includes('too large')) {
        errorMessage = 'El vídeo es demasiado grande. Máximo 100MB.';
      } else if (errorMessage.includes('network') || errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
      } else if (errorMessage.includes('Upload failed') || errorMessage.includes('Failed to upload')) {
        errorMessage = 'Error al subir el vídeo. Intenta de nuevo.';
      } else if (errorMessage.includes('indexing failed') || errorMessage.includes('Failed')) {
        errorMessage = 'Error al procesar el vídeo. Intenta con un formato diferente (MP4 recomendado).';
      } else if (errorMessage.includes('JSON') || errorMessage.includes('parsear') || errorMessage.includes('parse')) {
        errorMessage = 'Error al procesar la respuesta del análisis. Por favor, intenta de nuevo.';
      } else if (errorMessage.includes('Gemini')) {
        errorMessage = 'Error en el análisis de IA. Por favor, intenta de nuevo en unos segundos.';
      }
      
      toast.error(errorMessage);
      setUploadStatus(`Error: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCompare = async () => {
    if (!userVideoFile || !analysisResult) return;
    
    setIsComparing(true);
    setComparisonProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setComparisonProgress(prev => Math.min(prev + 5, 90));
      }, 500);

      const reader = new FileReader();
      reader.readAsDataURL(userVideoFile);
      
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        try {
          // TODO: Implement comparison feature
          toast.info("La función de comparación estará disponible próximamente");
          const result = { // Placeholder
            similarities: [],
            differences: [],
            recommendations: [],
            matchScore: 0
          };
          /* const result = await compareVideos.mutateAsync({
            userVideoData: base64,
            fileName: userVideoFile.name,
            mimeType: userVideoFile.type,
            viralAnalysisId: analysisResult.id
          }); */
          
          clearInterval(progressInterval);
          setComparisonProgress(100);
          setComparisonResult(result as unknown as ComparisonResult);
          toast.success("¡Comparación completada!");
        } catch (error) {
          clearInterval(progressInterval);
          toast.error("Error al comparar los vídeos. Inténtalo de nuevo.");
        } finally {
          setIsComparing(false);
        }
      };
    } catch (error) {
      setIsComparing(false);
      toast.error("Error al procesar el vídeo.");
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
        <div className="pt-32 pb-20">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 glow-primary">
                <Video className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Analizador de <span className="text-gradient">Vídeos Virales</span>
              </h1>
              <p className="text-muted-foreground mb-8">
                Inicia sesión para acceder al analizador de vídeos virales y descubrir 
                qué hace que un contenido se vuelva viral.
              </p>
              <a href={getLoginUrl()}>
                <Button size="lg" className="gradient-primary glow-primary gap-2">
                  <Zap className="w-5 h-5" />
                  Iniciar Sesión para Continuar
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
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Analizador de <span className="text-gradient">Vídeos Virales</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Sube un vídeo viral para analizar su estructura, luego compara con tu propio vídeo 
              para recibir recomendaciones personalizadas.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-5xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="analyze" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Analizar Viral
              </TabsTrigger>
              <TabsTrigger value="compare" className="gap-2" disabled={!analysisResult}>
                <Target className="w-4 h-4" />
                Comparar Vídeos
              </TabsTrigger>
            </TabsList>

            {/* Analyze Tab */}
            <TabsContent value="analyze" className="space-y-6">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    Sube un Vídeo Viral
                  </CardTitle>
                  <CardDescription>
                    Sube un reel o TikTok viral para analizar qué lo hace exitoso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <input
                    ref={viralInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleViralVideoSelect}
                    className="hidden"
                  />
                  
                  {viralVideoPreview ? (
                    <div className="space-y-4">
                      <div className="aspect-video rounded-xl overflow-hidden bg-black">
                        <video
                          src={viralVideoPreview}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => viralInputRef.current?.click()}
                          disabled={isAnalyzing}
                        >
                          Cambiar vídeo
                        </Button>
                        <Button
                          className="flex-1 gradient-primary glow-primary"
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
                              {analysisProgress < 50 ? 'Subiendo' : analysisProgress < 80 ? 'Azure procesando' : 'Gemini analizando'}
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
                      onClick={() => viralInputRef.current?.click()}
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
                          Análisis detallado del potencial viral
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
                        Resumen
                      </h4>
                      <div className="p-4 rounded-lg bg-secondary/30 prose prose-invert prose-sm max-w-none">
                        <Streamdown>{analysisResult.summary}</Streamdown>
                      </div>
                    </div>

                    {/* CTA to Compare */}
                    <div className="pt-4 border-t border-border/50">
                      <Button 
                        className="w-full gradient-accent"
                        onClick={() => setActiveTab("compare")}
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Comparar con tu Vídeo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Compare Tab */}
            <TabsContent value="compare" className="space-y-6">
              {!analysisResult ? (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Primero analiza un vídeo viral</h3>
                    <p className="text-muted-foreground mb-4">
                      Necesitas analizar un vídeo viral antes de poder comparar con tu contenido.
                    </p>
                    <Button onClick={() => setActiveTab("analyze")}>
                      Ir a Analizar Viral
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Reference Video */}
                    <Card className="bg-card/50 border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Video className="w-5 h-5 text-primary" />
                          Vídeo Viral de Referencia
                        </CardTitle>
                        <CardDescription>
                          Puntuación: {analysisResult.overallScore}%
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {viralVideoPreview && (
                          <div className="aspect-video rounded-lg overflow-hidden bg-black">
                            <video
                              src={viralVideoPreview}
                              controls
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* User Video Upload */}
                    <Card className="bg-card/50 border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Upload className="w-5 h-5 text-accent" />
                          Tu Vídeo
                        </CardTitle>
                        <CardDescription>
                          Sube tu vídeo para comparar con el viral
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <input
                          ref={userInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleUserVideoSelect}
                          className="hidden"
                        />
                        
                        {userVideoPreview ? (
                          <div className="space-y-4">
                            <div className="aspect-video rounded-lg overflow-hidden bg-black">
                              <video
                                src={userVideoPreview}
                                controls
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => userInputRef.current?.click()}
                              >
                                Cambiar
                              </Button>
                              <Button
                                className="flex-1 gradient-accent"
                                onClick={handleCompare}
                                disabled={isComparing}
                              >
                                {isComparing ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Comparando...
                                  </>
                                ) : (
                                  <>
                                    <Target className="w-4 h-4 mr-2" />
                                    Comparar
                                  </>
                                )}
                              </Button>
                            </div>
                            {isComparing && (
                              <div className="space-y-2">
                                <Progress value={comparisonProgress} className="h-2" />
                                <p className="text-sm text-muted-foreground text-center">
                                  Comparando vídeos... {comparisonProgress}%
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            onClick={() => userInputRef.current?.click()}
                            className="aspect-video border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-accent/50 transition-colors"
                          >
                            <FileVideo className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground">
                              Haz clic para subir tu vídeo
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Comparison Results */}
                  {comparisonResult && (
                    <Card className="bg-card/50 border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-accent" />
                          Resultado de la Comparación
                        </CardTitle>
                        <CardDescription>
                          Puntuación de tu vídeo: {comparisonResult.overallScore}%
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Improvement Points */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Puntos de Mejora
                          </h4>
                          <div className="space-y-3">
                            {comparisonResult.improvementPoints?.map((point, index) => (
                              <div key={index} className="p-4 rounded-lg bg-secondary/30 border-l-4 border-l-primary">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{point.area}</span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    point.priority === "high" ? "bg-red-500/20 text-red-400" :
                                    point.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                                    "bg-green-500/20 text-green-400"
                                  }`}>
                                    {point.priority === "high" ? "Alta" : point.priority === "medium" ? "Media" : "Baja"}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  <strong>Actual:</strong> {point.current}
                                </p>
                                <p className="text-sm">
                                  <strong className="text-primary">Recomendación:</strong> {point.recommendation}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cut Recommendations */}
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Scissors className="w-4 h-4 text-accent" />
                            Recomendaciones de Cortes
                          </h4>
                          <div className="space-y-2">
                            {comparisonResult.cutRecommendations?.map((cut, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                                <div className="flex-shrink-0 px-2 py-1 rounded bg-accent/20 text-accent text-xs font-mono">
                                  {cut.timestamp}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{cut.action}</div>
                                  <div className="text-xs text-muted-foreground">{cut.reason}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Editing Suggestions */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Play className="w-4 h-4 text-green-500" />
                            Sugerencias de Edición
                          </h4>
                          <div className="p-4 rounded-lg bg-secondary/30 prose prose-invert prose-sm max-w-none">
                            <Streamdown>{comparisonResult.editingSuggestions}</Streamdown>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
