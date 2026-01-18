import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useCallback } from "react";
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

export default function Analyzer() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("analyze");
  
  // Viral video state
  const [viralVideoFile, setViralVideoFile] = useState<File | null>(null);
  const [viralVideoPreview, setViralVideoPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // User video state (for comparison)
  const [userVideoFile, setUserVideoFile] = useState<File | null>(null);
  const [userVideoPreview, setUserVideoPreview] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonProgress, setComparisonProgress] = useState(0);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  
  const viralInputRef = useRef<HTMLInputElement>(null);
  const userInputRef = useRef<HTMLInputElement>(null);

  const uploadAndAnalyze = trpc.video.uploadAndAnalyze.useMutation();
  const compareVideos = trpc.video.compareVideos.useMutation();

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
    
    try {
      // Simulate progress while uploading and analyzing
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 5, 90));
      }, 500);

      const reader = new FileReader();
      reader.readAsDataURL(viralVideoFile);
      
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        try {
          const result = await uploadAndAnalyze.mutateAsync({
            videoData: base64,
            fileName: viralVideoFile.name,
            mimeType: viralVideoFile.type,
            analysisType: "viral_analysis"
          });
          
          clearInterval(progressInterval);
          setAnalysisProgress(100);
          setAnalysisResult(result as unknown as AnalysisResult);
          toast.success("¡Análisis completado!");
        } catch (error) {
          clearInterval(progressInterval);
          toast.error("Error al analizar el vídeo. Inténtalo de nuevo.");
        } finally {
          setIsAnalyzing(false);
        }
      };
    } catch (error) {
      setIsAnalyzing(false);
      toast.error("Error al procesar el vídeo.");
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
          const result = await compareVideos.mutateAsync({
            userVideoData: base64,
            fileName: userVideoFile.name,
            mimeType: userVideoFile.type,
            viralAnalysisId: analysisResult.id
          });
          
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
              <div className="grid md:grid-cols-2 gap-6">
                {/* Upload Section */}
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-primary" />
                      Subir Vídeo Viral
                    </CardTitle>
                    <CardDescription>
                      Sube el vídeo viral que quieres analizar (máx. 100MB)
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
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                          <video
                            src={viralVideoPreview}
                            controls
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => viralInputRef.current?.click()}
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
                                Analizando...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Analizar
                              </>
                            )}
                          </Button>
                        </div>
                        {isAnalyzing && (
                          <div className="space-y-2">
                            <Progress value={analysisProgress} className="h-2" />
                            <p className="text-sm text-muted-foreground text-center">
                              Analizando estructura viral... {analysisProgress}%
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => viralInputRef.current?.click()}
                        className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <FileVideo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Arrastra un vídeo aquí o haz clic para seleccionar
                        </p>
                        <p className="text-xs text-muted-foreground">
                          MP4, MOV, WebM • Máximo 100MB
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Analysis Preview */}
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-accent" />
                      Resultado del Análisis
                    </CardTitle>
                    <CardDescription>
                      Estructura y factores de viralidad detectados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysisResult ? (
                      <div className="space-y-4">
                        {/* Scores */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-secondary/50">
                            <div className="text-2xl font-bold text-primary">
                              {analysisResult.overallScore}%
                            </div>
                            <div className="text-xs text-muted-foreground">Puntuación General</div>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary/50">
                            <div className="text-2xl font-bold text-accent">
                              {analysisResult.hookScore}%
                            </div>
                            <div className="text-xs text-muted-foreground">Hook Score</div>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary/50">
                            <div className="text-2xl font-bold text-green-500">
                              {analysisResult.pacingScore}%
                            </div>
                            <div className="text-xs text-muted-foreground">Ritmo</div>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary/50">
                            <div className="text-2xl font-bold text-orange-500">
                              {analysisResult.engagementScore}%
                            </div>
                            <div className="text-xs text-muted-foreground">Engagement</div>
                          </div>
                        </div>

                        {/* Continue to Compare */}
                        <Button
                          className="w-full gradient-accent"
                          onClick={() => setActiveTab("compare")}
                        >
                          Continuar a Comparación
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Sube un vídeo viral para ver el análisis
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analysis */}
              {analysisResult && (
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle>Análisis Detallado</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Hook Analysis */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        Análisis del Hook (Primeros 3 segundos)
                      </h4>
                      <div className="p-4 rounded-lg bg-secondary/30 prose prose-invert prose-sm max-w-none">
                        <Streamdown>{analysisResult.hookAnalysis}</Streamdown>
                      </div>
                    </div>

                    {/* Structure Breakdown */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-accent" />
                        Estructura del Vídeo
                      </h4>
                      <div className="space-y-2">
                        {analysisResult.structureBreakdown?.segments?.map((segment, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                            <div className="flex-shrink-0 w-20 text-xs text-muted-foreground">
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
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        Factores de Viralidad
                      </h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {analysisResult.viralityFactors?.factors?.map((factor, index) => (
                          <div key={index} className="p-3 rounded-lg bg-secondary/30">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{factor.name}</span>
                              <span className="text-sm text-primary">{factor.score}%</span>
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
