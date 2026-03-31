import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
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
  Link as LinkIcon,
  Crown,
  Flame,
  Star,
  Rocket,
  GitCompare,
  ArrowLeftRight,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  ChevronRight,
  Copy
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

interface ComparisonResult {
  id: number;
  overallVerdict: string;
  similarityScore: number;
  hookComparison: {
    viralHookSummary: string;
    userHookAnalysis: string;
    whatsMissing: string;
    fixInstructions: string;
    hookScore: number;
  };
  pacingComparison: {
    viralPacingSummary: string;
    userPacingAnalysis: string;
    whatsMissing: string;
    fixInstructions: string;
    pacingScore: number;
  };
  contentComparison: {
    viralContentSummary: string;
    userContentAnalysis: string;
    whatsMissing: string;
    fixInstructions: string;
    contentScore: number;
  };
  visualComparison: {
    viralVisualSummary: string;
    userVisualAnalysis: string;
    whatsMissing: string;
    fixInstructions: string;
    visualScore: number;
  };
  ctaComparison: {
    viralCtaSummary: string;
    userCtaAnalysis: string;
    fixInstructions: string;
    ctaScore: number;
  };
  topCorrections: Array<{
    priority: number;
    category: string;
    title: string;
    currentIssue: string;
    exactFix: string;
    expectedImpact: string;
  }>;
  whatWorksWell: Array<{
    aspect: string;
    detail: string;
  }>;
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

function ScoreCircle({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="6" className="text-border/30" />
          <circle cx="40" cy="40" r="36" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

function ComparisonSection({ title, icon, viralLabel, viralText, userLabel, userText, missingText, fixText, score, color }: {
  title: string; icon: React.ReactNode; viralLabel: string; viralText: string; userLabel: string; userText: string;
  missingText?: string; fixText: string; score: number; color: string;
}) {
  return (
    <Card className="glass-card border-border/30 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">{icon}{title}</CardTitle>
          <Badge variant="outline" className="text-sm font-bold" style={{ borderColor: color, color }}>{score}/100</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-green-500" />
              <span className="text-xs font-semibold text-green-500 uppercase">{viralLabel}</span>
            </div>
            <p className="text-sm text-muted-foreground">{viralText}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Video className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-blue-500 uppercase">{userLabel}</span>
            </div>
            <p className="text-sm text-muted-foreground">{userText}</p>
          </div>
        </div>
        {missingText && (
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-amber-500 uppercase">Qué falta</span>
            </div>
            <p className="text-sm text-muted-foreground">{missingText}</p>
          </div>
        )}
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase">Cómo arreglarlo</span>
          </div>
          <p className="text-sm text-muted-foreground">{fixText}</p>
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
  
  // Viral reference state (for comparison)
  const [viralVideoFile, setViralVideoFile] = useState<File | null>(null);
  const [viralVideoPreview, setViralVideoPreview] = useState<string | null>(null);
  const [isAnalyzingViral, setIsAnalyzingViral] = useState(false);
  const [viralAnalysisProgress, setViralAnalysisProgress] = useState(0);
  const [viralAnalysisResult, setViralAnalysisResult] = useState<AnalysisResult | null>(null);
  const [viralUploadStatus, setViralUploadStatus] = useState<string>("");
  const [viralEstimatedTime, setViralEstimatedTime] = useState<number>(0);
  const [viralStartTime, setViralStartTime] = useState<number>(0);
  
  // Comparison state
  const [comparisonVideoFile, setComparisonVideoFile] = useState<File | null>(null);
  const [comparisonVideoPreview, setComparisonVideoPreview] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonProgress, setComparisonProgress] = useState(0);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [comparisonUploadStatus, setComparisonUploadStatus] = useState<string>("");
  const [comparisonEstimatedTime, setComparisonEstimatedTime] = useState<number>(0);
  const [comparisonStartTime, setComparisonStartTime] = useState<number>(0);
  
  // TikTok URL state
  const [tiktokUrl, setTiktokUrl] = useState<string>("");
  const [isDownloadingTiktok, setIsDownloadingTiktok] = useState(false);
  
  // Tips to show while waiting
  const analysisTips = useMemo(() => [
    "Los videos mas cortos (15-30s) se procesan mas rapido",
    "Los formatos MP4 y MOV son los mas rapidos de procesar",
    "El hook de los primeros 3 segundos es clave para la viralidad",
    "Los videos con buena iluminacion se analizan mejor",
    "El analisis incluye transcripcion, temas y emociones",
    "Gemini analiza cada frame para detectar elementos visuales",
    "Un buen CTA al final aumenta el engagement",
    "El ritmo de edicion afecta la retencion de audiencia",
  ], []);
  
  useEffect(() => {
    const anyAnalyzing = isAnalyzing || isAnalyzingViral || isComparing;
    if (anyAnalyzing) {
      setCurrentTip(analysisTips[0]);
      const tipInterval = setInterval(() => {
        setCurrentTip(prev => {
          const currentIndex = analysisTips.indexOf(prev);
          return analysisTips[(currentIndex + 1) % analysisTips.length];
        });
      }, 5000);
      return () => clearInterval(tipInterval);
    }
  }, [isAnalyzing, isAnalyzingViral, isComparing, analysisTips]);
  
  useEffect(() => {
    if (isAnalyzing && analysisStartTime > 0) {
      const interval = setInterval(() => setEstimatedTimeRemaining(prev => Math.max(0, prev - 1)), 1000);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing, analysisStartTime]);
  
  useEffect(() => {
    if (isAnalyzingViral && viralStartTime > 0) {
      const interval = setInterval(() => setViralEstimatedTime(prev => Math.max(0, prev - 1)), 1000);
      return () => clearInterval(interval);
    }
  }, [isAnalyzingViral, viralStartTime]);
  
  useEffect(() => {
    if (isComparing && comparisonStartTime > 0) {
      const interval = setInterval(() => setComparisonEstimatedTime(prev => Math.max(0, prev - 1)), 1000);
      return () => clearInterval(interval);
    }
  }, [isComparing, comparisonStartTime]);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const viralInputRef = useRef<HTMLInputElement>(null);
  const comparisonInputRef = useRef<HTMLInputElement>(null);

  const getUploadUrl = trpc.video.getUploadUrl.useMutation();
  const uploadChunk = trpc.video.uploadChunk.useMutation();
  const finalizeUploadAndAnalyze = trpc.video.finalizeUploadAndAnalyze.useMutation();
  const compareVideos = trpc.video.compareVideos.useMutation();

  const handleVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { toast.error("El archivo es demasiado grande. Maximo 100MB."); return; }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setAnalysisResult(null);
    }
  }, []);
  
  const handleViralVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { toast.error("El archivo es demasiado grande. Maximo 100MB."); return; }
      setViralVideoFile(file);
      setViralVideoPreview(URL.createObjectURL(file));
      setViralAnalysisResult(null);
    }
  }, []);
  
  const handleComparisonVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { toast.error("El archivo es demasiado grande. Maximo 100MB."); return; }
      setComparisonVideoFile(file);
      setComparisonVideoPreview(URL.createObjectURL(file));
      setComparisonResult(null);
    }
  }, []);

  const runAnalysis = async (
    file: File,
    setProgress: (p: number) => void,
    setStatus: (s: string) => void,
    setEstTime: (t: number) => void,
    setStartTime: (t: number) => void,
  ): Promise<AnalysisResult> => {
    const fileSizeMB = file.size / (1024 * 1024);
    const totalEstimate = Math.ceil(fileSizeMB * 1.2) + 180 + 30;
    setEstTime(totalEstimate);
    setStartTime(Date.now());
    
    setStatus("Iniciando subida...");
    setProgress(2);
    
    const { fileKey } = await getUploadUrl.mutateAsync({ fileName: file.name, mimeType: file.type });
    setStatus("Subiendo video...");
    
    await uploadFileInChunks(file, uploadChunk, fileKey, (progress) => {
      setProgress(progress);
      setStatus(`Subiendo video... ${Math.round(progress)}%`);
    });
    
    setStatus("Video subido. Iniciando analisis...");
    setProgress(55);
    
    const analysisSteps = [
      { progress: 56, message: "Extrayendo frames del video..." },
      { progress: 60, message: "Analizando audio y transcripcion..." },
      { progress: 65, message: "Detectando escenas y cortes..." },
      { progress: 70, message: "Analizando niveles de audio..." },
      { progress: 75, message: "Procesando con IA..." },
      { progress: 80, message: "Analizando hook inicial..." },
      { progress: 85, message: "Evaluando factores de viralidad..." },
      { progress: 90, message: "Generando recomendaciones..." },
      { progress: 95, message: "Finalizando analisis..." },
    ];
    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < analysisSteps.length) {
        setProgress(analysisSteps[stepIndex].progress);
        setStatus(analysisSteps[stepIndex].message);
        stepIndex++;
      }
    }, 3000);
    
    const result = await finalizeUploadAndAnalyze.mutateAsync({
      fileKey, fileName: file.name, mimeType: file.type, fileSize: file.size, analysisType: "viral_analysis",
    });
    
    clearInterval(progressInterval);
    
    if (result && result.id) {
      setProgress(100);
      setStatus("Analisis completado!");
      return result as unknown as AnalysisResult;
    } else {
      throw new Error("Error al procesar el analisis");
    }
  };

  const handleAnalyze = async () => {
    if (!videoFile) return;
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setUploadStatus("Preparando subida...");
    try {
      const result = await runAnalysis(videoFile, setAnalysisProgress, setUploadStatus, setEstimatedTimeRemaining, setAnalysisStartTime);
      setAnalysisResult(result);
      toast.success("Analisis completado con exito!");
    } catch (error: any) {
      console.error("Analysis error:", error);
      const msg = error.message || "Error desconocido";
      if (msg.includes("JSON")) toast.error("Error al procesar la respuesta. Intenta de nuevo.");
      else toast.error(`Error: ${msg}`);
      setUploadStatus("");
    } finally {
      setIsAnalyzing(false);
      setEstimatedTimeRemaining(0);
    }
  };
  
  const handleAnalyzeViral = async () => {
    if (!viralVideoFile) return;
    setIsAnalyzingViral(true);
    setViralAnalysisProgress(0);
    setViralUploadStatus("Preparando subida del viral...");
    try {
      const result = await runAnalysis(viralVideoFile, setViralAnalysisProgress, setViralUploadStatus, setViralEstimatedTime, setViralStartTime);
      setViralAnalysisResult(result);
      toast.success("Viral analizado! Ahora sube tu video para comparar.");
    } catch (error: any) {
      console.error("Viral analysis error:", error);
      toast.error(`Error: ${error.message || "Error desconocido"}`);
      setViralUploadStatus("");
    } finally {
      setIsAnalyzingViral(false);
      setViralEstimatedTime(0);
    }
  };
  
  const handleCompare = async () => {
    if (!comparisonVideoFile || !viralAnalysisResult) return;
    setIsComparing(true);
    setComparisonProgress(0);
    setComparisonUploadStatus("Preparando comparacion...");
    
    const fileSizeMB = comparisonVideoFile.size / (1024 * 1024);
    const totalEstimate = Math.ceil(fileSizeMB * 1.2) + 200 + 40;
    setComparisonEstimatedTime(totalEstimate);
    setComparisonStartTime(Date.now());
    
    try {
      setComparisonUploadStatus("Subiendo tu video...");
      setComparisonProgress(2);
      
      const { fileKey } = await getUploadUrl.mutateAsync({ fileName: comparisonVideoFile.name, mimeType: comparisonVideoFile.type });
      
      await uploadFileInChunks(comparisonVideoFile, uploadChunk, fileKey, (progress) => {
        setComparisonProgress(progress);
        setComparisonUploadStatus(`Subiendo video... ${Math.round(progress)}%`);
      });
      
      setComparisonUploadStatus("Video subido. Comparando con el viral...");
      setComparisonProgress(55);
      
      const comparisonSteps = [
        { progress: 56, message: "Extrayendo frames de tu video..." },
        { progress: 60, message: "Analizando audio y transcripcion..." },
        { progress: 65, message: "Detectando escenas y cortes..." },
        { progress: 70, message: "Comparando hooks..." },
        { progress: 75, message: "Comparando ritmo de edicion..." },
        { progress: 80, message: "Analizando diferencias visuales..." },
        { progress: 85, message: "Evaluando contenido vs viral..." },
        { progress: 90, message: "Generando correcciones..." },
        { progress: 95, message: "Finalizando comparacion..." },
      ];
      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < comparisonSteps.length) {
          setComparisonProgress(comparisonSteps[stepIndex].progress);
          setComparisonUploadStatus(comparisonSteps[stepIndex].message);
          stepIndex++;
        }
      }, 4000);
      
      const result = await compareVideos.mutateAsync({
        viralAnalysisId: viralAnalysisResult.id,
        fileKey,
        fileName: comparisonVideoFile.name,
        mimeType: comparisonVideoFile.type,
        fileSize: comparisonVideoFile.size,
      });
      
      clearInterval(progressInterval);
      
      if (result && result.id) {
        setComparisonResult(result as unknown as ComparisonResult);
        setComparisonProgress(100);
        setComparisonUploadStatus("Comparacion completada!");
        toast.success("Comparacion completada!");
      } else {
        throw new Error("Error al procesar la comparacion");
      }
    } catch (error: any) {
      console.error("Comparison error:", error);
      toast.error(`Error: ${error.message || "Error desconocido"}`);
      setComparisonUploadStatus("");
    } finally {
      setIsComparing(false);
      setComparisonEstimatedTime(0);
    }
  };

  const handleTiktokDownload = async () => {
    if (!tiktokUrl.trim()) { toast.error("Ingresa una URL de TikTok valida"); return; }
    if (!tiktokUrl.includes("tiktok.com")) { toast.error("La URL debe ser de TikTok"); return; }
    setIsDownloadingTiktok(true);
    toast.info("Descargando video de TikTok...");
    try {
      toast.info("Funcion proximamente disponible. Estamos trabajando en la integracion con TikTok.");
    } catch { toast.error("Error al descargar el video de TikTok"); }
    finally { setIsDownloadingTiktok(false); }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#eab308";
    if (score >= 40) return "#f97316";
    return "#ef4444";
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
              <CardDescription>Inicia sesion para analizar tus videos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full btn-premium gradient-primary text-white" asChild>
                <a href="/login"><Zap className="w-4 h-4 mr-2" />Iniciar Sesion</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const ProgressPanel = ({ status, progress, estimatedTime, tip }: { status: string; progress: number; estimatedTime: number; tip: string }) => (
    <div className="space-y-4 p-5 rounded-xl bg-primary/5 border border-primary/20">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{status || 'Procesando...'}</span>
        <span className="font-mono font-semibold text-primary">
          {estimatedTime > 0 ? (<><Clock className="w-4 h-4 inline mr-1" />~{formatTime(estimatedTime)} restantes</>) : 'Finalizando...'}
        </span>
      </div>
      <Progress value={progress} className="h-3" />
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{Math.round(progress)}% completado</span>
        <span className="text-muted-foreground">
          {progress < 50 ? 'Subiendo' : progress < 80 ? 'Procesando' : 'Analizando con IA'}
        </span>
      </div>
      {tip && (
        <div className="text-sm text-center text-muted-foreground bg-background/50 rounded-lg p-3">{tip}</div>
      )}
    </div>
  );

  const UploadZone = ({ inputRef, onSelect, label, disabled }: { inputRef: React.RefObject<HTMLInputElement | null>; onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void; label: string; disabled?: boolean }) => (
    <div>
      <input ref={inputRef} type="file" accept="video/*" onChange={onSelect} className="hidden" />
      <div
        className={`border-2 border-dashed border-primary/30 rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => inputRef.current?.click()}
      >
        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
          <FileVideo className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{label}</h3>
        <p className="text-muted-foreground mb-4">o haz clic para seleccionar</p>
        <Badge variant="outline" className="text-xs">MP4, MOV, AVI - Max 100MB</Badge>
      </div>
    </div>
  );

  const VideoPreviewPanel = ({ preview, inputRef, onAnalyze, isProcessing, analyzeLabel }: {
    preview: string; inputRef: React.RefObject<HTMLInputElement | null>; onAnalyze: () => void; isProcessing: boolean; analyzeLabel: string;
  }) => (
    <div className="space-y-4">
      <div className="aspect-video rounded-xl overflow-hidden bg-black ring-2 ring-primary/20">
        <video src={preview} controls className="w-full h-full object-contain" />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
          onClick={() => inputRef.current?.click()} disabled={isProcessing}>Cambiar Video</Button>
        <Button className="flex-1 btn-premium gradient-primary text-white" onClick={onAnalyze} disabled={isProcessing}>
          {isProcessing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</>) : (<><Sparkles className="w-4 h-4 mr-2" />{analyzeLabel}</>)}
        </Button>
      </div>
    </div>
  );

  const AnalysisResultPanel = ({ result }: { result: AnalysisResult }) => (
    <Card className="glass-card border-primary/20 animate-fade-in-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center"><BarChart3 className="w-5 h-5 text-white" /></div>
          <span>Resultados del Analisis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
          <div className="text-6xl font-bold text-gradient mb-2">{result.overallScore}</div>
          <p className="text-muted-foreground">Puntuacion de Viralidad</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 text-center">
            <Zap className="w-6 h-6 text-pink-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-pink-500">{result.hookScore}</div>
            <p className="text-xs text-muted-foreground">Hook</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <Scissors className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-500">{result.pacingScore}</div>
            <p className="text-xs text-muted-foreground">Ritmo</p>
          </div>
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
            <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-500">{result.engagementScore}</div>
            <p className="text-xs text-muted-foreground">Engagement</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-background/50 border border-border/50">
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />Resumen</h4>
          <Streamdown>{result.summary}</Streamdown>
        </div>
        <div className="p-4 rounded-xl bg-background/50 border border-border/50">
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-pink-500" />Analisis del Hook</h4>
          <Streamdown>{result.hookAnalysis}</Streamdown>
        </div>
        {result.viralityFactors?.factors && (
          <div className="p-4 rounded-xl bg-background/50 border border-border/50">
            <h4 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" />Factores de Viralidad</h4>
            <div className="space-y-3">
              {result.viralityFactors.factors.map((factor, index) => (
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
  );

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-8 overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="absolute top-20 left-10 w-3 h-3 rounded-full bg-primary/50 animate-float" />
        <div className="absolute top-40 right-20 w-2 h-2 rounded-full bg-accent/50 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/4 w-4 h-4 rounded-full bg-pink-500/30 animate-float" style={{ animationDelay: '2s' }} />
        
        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
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
              Analiza videos virales, tu propio contenido, o compara ambos para descubrir exactamente que mejorar.
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-card/50 p-1.5 rounded-xl border border-border/50">
              <TabsTrigger value="analyze" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg transition-all text-xs sm:text-sm">
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Analizar</span> Tu Video
              </TabsTrigger>
              <TabsTrigger value="viral-reference" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg transition-all text-xs sm:text-sm">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Analizar</span> Viral
              </TabsTrigger>
              <TabsTrigger value="compare" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white rounded-lg transition-all text-xs sm:text-sm">
                <GitCompare className="w-4 h-4" />
                Comparar
              </TabsTrigger>
            </TabsList>

            {/* ==================== TAB 1: Analyze Your Video ==================== */}
            <TabsContent value="analyze" className="space-y-6 animate-fade-in-up">
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center"><Upload className="w-5 h-5 text-white" /></div>
                    <span>Sube Tu Video</span>
                  </CardTitle>
                  <CardDescription>Sube tu video para analizar su potencial viral y obtener recomendaciones de mejora</CardDescription>
                </CardHeader>
                <CardContent>
                  {videoPreview ? (
                    <>
                      <VideoPreviewPanel preview={videoPreview} inputRef={videoInputRef} onAnalyze={handleAnalyze} isProcessing={isAnalyzing} analyzeLabel="Analizar Video" />
                      {isAnalyzing && <ProgressPanel status={uploadStatus} progress={analysisProgress} estimatedTime={estimatedTimeRemaining} tip={currentTip} />}
                    </>
                  ) : (
                    <UploadZone inputRef={videoInputRef} onSelect={handleVideoSelect} label="Arrastra tu video aqui" />
                  )}
                </CardContent>
              </Card>
              {analysisResult && <AnalysisResultPanel result={analysisResult} />}
            </TabsContent>

            {/* ==================== TAB 2: Analyze Viral Video ==================== */}
            <TabsContent value="viral-reference" className="space-y-6 animate-fade-in-up">
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center"><LinkIcon className="w-5 h-5 text-white" /></div>
                    <span>Analizar Video de TikTok</span>
                  </CardTitle>
                  <CardDescription>Pega la URL de un video viral de TikTok para analizar que lo hizo exitoso</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder="https://www.tiktok.com/@usuario/video/..." value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)}
                      className="flex-1 bg-background/50 border-primary/20 focus:border-primary/50" />
                    <Button className="btn-premium gradient-accent text-white" onClick={handleTiktokDownload} disabled={isDownloadingTiktok}>
                      {isDownloadingTiktok ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" />Analizar</>}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Copia la URL del video de TikTok que quieres analizar</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ==================== TAB 3: Compare ==================== */}
            <TabsContent value="compare" className="space-y-6 animate-fade-in-up">
              {/* Explanation */}
              <Card className="glass-card border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <ArrowLeftRight className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2">Comparador Viral vs Tu Video</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Sube un video viral de referencia, analizado, y despues sube tu video inspirado en el. 
                        La IA comparara ambos y te dira <strong className="text-foreground">exactamente que cambiar</strong> para acercarte al nivel del viral.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">Paso 1: Sube el viral</Badge>
                        <ChevronRight className="w-4 h-4" />
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Paso 2: Sube tu video</Badge>
                        <ChevronRight className="w-4 h-4" />
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Paso 3: Correcciones</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 1: Upload & Analyze Viral */}
              <Card className={`glass-card overflow-hidden ${viralAnalysisResult ? 'border-green-500/30' : 'border-primary/20'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${viralAnalysisResult ? 'bg-green-500/20' : 'gradient-accent'}`}>
                        {viralAnalysisResult ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Crown className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <span>Paso 1: Video Viral de Referencia</span>
                        {viralAnalysisResult && <Badge className="ml-2 bg-green-500/20 text-green-500 border-green-500/30">Analizado</Badge>}
                      </div>
                    </CardTitle>
                    {viralAnalysisResult && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gradient">{viralAnalysisResult.overallScore}/100</div>
                        <p className="text-xs text-muted-foreground">Puntuacion viral</p>
                      </div>
                    )}
                  </div>
                  <CardDescription>Sube el video viral que quieres usar como referencia</CardDescription>
                </CardHeader>
                <CardContent>
                  {viralVideoPreview ? (
                    <>
                      <VideoPreviewPanel preview={viralVideoPreview} inputRef={viralInputRef} onAnalyze={handleAnalyzeViral} isProcessing={isAnalyzingViral} analyzeLabel="Analizar Viral" />
                      {isAnalyzingViral && <ProgressPanel status={viralUploadStatus} progress={viralAnalysisProgress} estimatedTime={viralEstimatedTime} tip={currentTip} />}
                    </>
                  ) : (
                    <UploadZone inputRef={viralInputRef} onSelect={handleViralVideoSelect} label="Sube el video VIRAL de referencia" />
                  )}
                </CardContent>
              </Card>

              {/* Step 2: Upload User Video for Comparison */}
              <Card className={`glass-card overflow-hidden ${!viralAnalysisResult ? 'opacity-50' : 'border-blue-500/20'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${!viralAnalysisResult ? 'bg-muted' : 'bg-blue-500/20'}`}>
                      <Video className={`w-5 h-5 ${!viralAnalysisResult ? 'text-muted-foreground' : 'text-blue-500'}`} />
                    </div>
                    <span>Paso 2: Tu Video (a corregir)</span>
                  </CardTitle>
                  <CardDescription>
                    {viralAnalysisResult 
                      ? "Sube tu video inspirado en el viral para recibir correcciones exactas" 
                      : "Primero analiza el video viral de referencia (Paso 1)"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!viralAnalysisResult ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Completa el Paso 1 primero</p>
                    </div>
                  ) : comparisonVideoPreview ? (
                    <div className="space-y-4">
                      <div className="aspect-video rounded-xl overflow-hidden bg-black ring-2 ring-blue-500/20">
                        <video src={comparisonVideoPreview} controls className="w-full h-full object-contain" />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => comparisonInputRef.current?.click()} disabled={isComparing}>Cambiar Video</Button>
                        <Button className="flex-1 btn-premium bg-gradient-to-r from-primary to-accent text-white" onClick={handleCompare} disabled={isComparing}>
                          {isComparing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Comparando...</>) : (<><GitCompare className="w-4 h-4 mr-2" />Comparar con Viral</>)}
                        </Button>
                      </div>
                      {isComparing && <ProgressPanel status={comparisonUploadStatus} progress={comparisonProgress} estimatedTime={comparisonEstimatedTime} tip={currentTip} />}
                    </div>
                  ) : (
                    <UploadZone inputRef={comparisonInputRef} onSelect={handleComparisonVideoSelect} label="Sube TU video para comparar" disabled={!viralAnalysisResult} />
                  )}
                </CardContent>
              </Card>

              {/* ==================== COMPARISON RESULTS ==================== */}
              {comparisonResult && (
                <div className="space-y-6 animate-fade-in-up">
                  {/* Overall Verdict */}
                  <Card className="glass-card border-primary/20 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-primary via-accent to-pink-500" />
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <GitCompare className="w-5 h-5 text-white" />
                        </div>
                        Resultado de la Comparacion
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Similarity Score */}
                      <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                        <div className="text-6xl font-bold text-gradient mb-2">{comparisonResult.similarityScore}%</div>
                        <p className="text-muted-foreground mb-4">Similitud con el Viral</p>
                        <p className="text-sm text-muted-foreground max-w-xl mx-auto">{comparisonResult.overallVerdict}</p>
                      </div>
                      
                      {/* Score Circles */}
                      <div className="flex justify-center gap-6 flex-wrap">
                        <ScoreCircle score={comparisonResult.overallScore} label="General" color={getScoreColor(comparisonResult.overallScore)} />
                        <ScoreCircle score={comparisonResult.hookScore} label="Hook" color={getScoreColor(comparisonResult.hookScore)} />
                        <ScoreCircle score={comparisonResult.pacingScore} label="Ritmo" color={getScoreColor(comparisonResult.pacingScore)} />
                        <ScoreCircle score={comparisonResult.engagementScore} label="Engagement" color={getScoreColor(comparisonResult.engagementScore)} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* What Works Well */}
                  {comparisonResult.whatWorksWell && comparisonResult.whatWorksWell.length > 0 && (
                    <Card className="glass-card border-green-500/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-500">
                          <ThumbsUp className="w-5 h-5" />
                          Lo que ya haces bien
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3">
                          {comparisonResult.whatWorksWell.map((item, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium text-sm">{item.aspect}</p>
                                <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Top Corrections */}
                  {comparisonResult.topCorrections && comparisonResult.topCorrections.length > 0 && (
                    <Card className="glass-card border-amber-500/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-500">
                          <AlertTriangle className="w-5 h-5" />
                          Top {comparisonResult.topCorrections.length} Correcciones (por impacto)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {comparisonResult.topCorrections.sort((a, b) => a.priority - b.priority).map((correction, i) => (
                            <div key={i} className="p-4 rounded-xl bg-background/50 border border-border/50 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                  i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-500' : i === 2 ? 'bg-amber-500' : 'bg-blue-500'
                                }`}>
                                  {correction.priority}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm">{correction.title}</h4>
                                  <Badge variant="outline" className="text-xs mt-1">{correction.category}</Badge>
                                </div>
                              </div>
                              <div className="grid md:grid-cols-2 gap-3 ml-11">
                                <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                                  <p className="text-xs font-semibold text-red-500 mb-1">Problema actual</p>
                                  <p className="text-xs text-muted-foreground">{correction.currentIssue}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                                  <p className="text-xs font-semibold text-green-500 mb-1">Como arreglarlo</p>
                                  <p className="text-xs text-muted-foreground">{correction.exactFix}</p>
                                </div>
                              </div>
                              <div className="ml-11 p-2 rounded-lg bg-primary/5 border border-primary/10">
                                <p className="text-xs font-semibold text-primary mb-1">Impacto esperado</p>
                                <p className="text-xs text-muted-foreground">{correction.expectedImpact}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Detailed Comparisons */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Comparacion Detallada
                    </h3>
                    
                    <ComparisonSection
                      title="Hook (primeros 3s)" icon={<Zap className="w-4 h-4 text-pink-500" />}
                      viralLabel="Hook del Viral" viralText={comparisonResult.hookComparison.viralHookSummary}
                      userLabel="Tu Hook" userText={comparisonResult.hookComparison.userHookAnalysis}
                      missingText={comparisonResult.hookComparison.whatsMissing}
                      fixText={comparisonResult.hookComparison.fixInstructions}
                      score={comparisonResult.hookComparison.hookScore} color="#ec4899"
                    />
                    
                    <ComparisonSection
                      title="Ritmo de Edicion" icon={<Scissors className="w-4 h-4 text-blue-500" />}
                      viralLabel="Ritmo del Viral" viralText={comparisonResult.pacingComparison.viralPacingSummary}
                      userLabel="Tu Ritmo" userText={comparisonResult.pacingComparison.userPacingAnalysis}
                      missingText={comparisonResult.pacingComparison.whatsMissing}
                      fixText={comparisonResult.pacingComparison.fixInstructions}
                      score={comparisonResult.pacingComparison.pacingScore} color="#3b82f6"
                    />
                    
                    <ComparisonSection
                      title="Contenido y Mensaje" icon={<Target className="w-4 h-4 text-green-500" />}
                      viralLabel="Contenido del Viral" viralText={comparisonResult.contentComparison.viralContentSummary}
                      userLabel="Tu Contenido" userText={comparisonResult.contentComparison.userContentAnalysis}
                      missingText={comparisonResult.contentComparison.whatsMissing}
                      fixText={comparisonResult.contentComparison.fixInstructions}
                      score={comparisonResult.contentComparison.contentScore} color="#22c55e"
                    />
                    
                    <ComparisonSection
                      title="Visual" icon={<Star className="w-4 h-4 text-amber-500" />}
                      viralLabel="Visual del Viral" viralText={comparisonResult.visualComparison.viralVisualSummary}
                      userLabel="Tu Visual" userText={comparisonResult.visualComparison.userVisualAnalysis}
                      missingText={comparisonResult.visualComparison.whatsMissing}
                      fixText={comparisonResult.visualComparison.fixInstructions}
                      score={comparisonResult.visualComparison.visualScore} color="#eab308"
                    />
                    
                    <ComparisonSection
                      title="CTA (Call to Action)" icon={<Rocket className="w-4 h-4 text-purple-500" />}
                      viralLabel="CTA del Viral" viralText={comparisonResult.ctaComparison.viralCtaSummary}
                      userLabel="Tu CTA" userText={comparisonResult.ctaComparison.userCtaAnalysis}
                      fixText={comparisonResult.ctaComparison.fixInstructions}
                      score={comparisonResult.ctaComparison.ctaScore} color="#a855f7"
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Features Preview */}
          <div className="grid md:grid-cols-3 gap-4 mt-12">
            <Card className="glass-card border-primary/20 p-6 text-center hover-lift">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="font-semibold mb-2">Analisis de Hook</h3>
              <p className="text-sm text-muted-foreground">Evalua los primeros 3 segundos criticos</p>
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
                <GitCompare className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-semibold mb-2">Comparador Viral</h3>
              <p className="text-sm text-muted-foreground">Compara tu video con un viral y recibe correcciones</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
