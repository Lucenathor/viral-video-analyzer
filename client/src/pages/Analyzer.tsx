import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { 
  GitCompareArrows, Link2, Loader2, AlertCircle, CheckCircle2, 
  XCircle, ArrowRight, Trophy, Target, Zap, Eye, MessageSquare,
  TrendingUp, Lightbulb, Copy, Check, Upload, FileVideo, X,
  Subtitles, Scissors
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const ACCEPTED_FORMATS = [
  "video/mp4", "video/quicktime", "video/x-msvideo", "video/webm",
  "video/x-matroska", "video/mpeg", "video/3gpp", "video/x-flv",
  "video/ogg", "video/x-ms-wmv"
];

const FORMAT_LABELS: Record<string, string> = {
  "video/mp4": "MP4", "video/quicktime": "MOV", "video/x-msvideo": "AVI",
  "video/webm": "WebM", "video/x-matroska": "MKV", "video/mpeg": "MPEG",
  "video/3gpp": "3GP", "video/x-flv": "FLV", "video/ogg": "OGG",
  "video/x-ms-wmv": "WMV"
};

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
// Direct upload via FormData to /api/upload-video (no base64 chunks)

export default function Analyzer() {
  const { user, loading: authLoading } = useAuth();

  const [viralUrl, setViralUrl] = useState("");
  const [userFile, setUserFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState("");
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compareUrlVsUpload = trpc.video.compareUrlVsUpload.useMutation({
    onSuccess: (data) => {
      setComparisonResult(data);
      setIsComparing(false);
      setUploadPhase("");
      toast.success("Comparacion completada! Revisa las correcciones abajo");
    },
    onError: (error) => {
      setIsComparing(false);
      setUploadPhase("");
      toast.error(error.message || "Error en la comparacion");
    },
  });

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  }, []);

  const validateAndSetFile = (file: File) => {
    if (!ACCEPTED_FORMATS.includes(file.type) && !file.name.match(/\.(mp4|mov|avi|webm|mkv|mpeg|mpg|3gp|flv|ogg|wmv)$/i)) {
      toast.error("Formato no soportado. Usa MP4, MOV, AVI, WebM, MKV, etc.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("El archivo es demasiado grande. Maximo 500MB.");
      return;
    }
    setUserFile(file);
    toast.success(`Video seleccionado: ${file.name}`);
  };

  const handleCompare = async () => {
    if (!viralUrl.trim()) {
      toast.error("Introduce la URL del video viral");
      return;
    }
    if (!userFile) {
      toast.error("Sube tu video para comparar");
      return;
    }

    setIsComparing(true);
    setComparisonResult(null);
    setUploadProgress(0);

    try {
      // Step 1: Upload file directly via FormData (much more robust than base64 chunks)
      setUploadPhase("Subiendo tu video...");
      
      const formData = new FormData();
      formData.append('video', userFile);

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      const uploadResult = await new Promise<{fileKey: string; url: string; fileName: string; fileSize: number; mimeType: string}>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(pct);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error('Respuesta invalida del servidor'));
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error || `Error ${xhr.status}`));
            } catch {
              reject(new Error(`Error al subir: ${xhr.status}`));
            }
          }
        });
        
        xhr.addEventListener('error', () => reject(new Error('Error de red al subir el video. Verifica tu conexion.')));
        xhr.addEventListener('timeout', () => reject(new Error('Timeout al subir el video. Intenta con un archivo mas pequeno.')));
        
        xhr.open('POST', '/api/upload-video');
        xhr.timeout = 5 * 60 * 1000; // 5 min timeout
        xhr.send(formData);
      });

      // Step 2: Compare
      setUploadPhase("Analizando y comparando videos con IA...");
      setUploadProgress(100);

      await compareUrlVsUpload.mutateAsync({
        viralUrl: viralUrl.trim(),
        userFileKey: uploadResult.fileKey,
        userFileName: uploadResult.fileName,
        userMimeType: uploadResult.mimeType,
        userFileSize: uploadResult.fileSize,
      });
    } catch (error: any) {
      setIsComparing(false);
      setUploadPhase("");
      if (!compareUrlVsUpload.isError) {
        toast.error(error.message || "Error al subir el video");
      }
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast.success(`${label} copiado al portapapeles`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500/20 border-emerald-500/30";
    if (score >= 60) return "bg-yellow-500/20 border-yellow-500/30";
    if (score >= 40) return "bg-orange-500/20 border-orange-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return "\u{1F525}";
    if (score >= 60) return "\u{1F44D}";
    if (score >= 40) return "\u26A0\uFE0F";
    return "\u274C";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <Card className="bg-[#12121a] border-gray-800 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <GitCompareArrows className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Comparador de Videos</h2>
            <p className="text-gray-400 mb-6">Inicia sesion para comparar tu video con un viral de referencia</p>
            <Link href="/login">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold w-full">
                Iniciar Sesion
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#0f0f1a] to-[#0a0a0f] border-b border-gray-800/50">
        <div className="container py-8 md:py-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-4">
              <GitCompareArrows className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium">Comparador IA</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Compara tu video con un <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">viral</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Pega la URL del viral de referencia y sube tu video. 
              La IA analizara cortes, subtitulos, hook y te dara correcciones exactas.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8 max-w-4xl">
        {/* Input Section */}
        <Card className="bg-[#12121a] border-gray-800 mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="space-y-6">
              {/* Viral URL */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  URL del Video Viral (referencia)
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="https://www.instagram.com/reel/... o URL directa del video"
                    value={viralUrl}
                    onChange={(e) => setViralUrl(e.target.value)}
                    className="bg-[#1a1a2e] border-gray-700 text-white pl-10 h-12 placeholder:text-gray-600"
                    disabled={isComparing}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Pega el enlace del reel viral que quieres usar como referencia</p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-800" />
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-full p-2">
                  <ArrowRight className="w-4 h-4 text-cyan-400 rotate-90" />
                </div>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              {/* User Video Upload */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  Tu Video (sube el archivo)
                </label>

                {!userFile ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                      ${isDragging 
                        ? "border-cyan-400 bg-cyan-500/10" 
                        : "border-gray-700 bg-[#1a1a2e] hover:border-gray-600 hover:bg-[#1a1a2e]/80"
                      }
                      ${isComparing ? "pointer-events-none opacity-50" : ""}
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".mp4,.mov,.avi,.webm,.mkv,.mpeg,.mpg,.3gp,.flv,.ogg,.wmv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-cyan-400" : "text-gray-500"}`} />
                    <p className="text-gray-300 font-medium mb-1">
                      {isDragging ? "Suelta tu video aqui" : "Arrastra tu video aqui o haz clic para seleccionar"}
                    </p>
                    <p className="text-xs text-gray-500">
                      MP4, MOV, AVI, WebM, MKV, MPEG, 3GP, FLV, OGG, WMV (max 500MB)
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <FileVideo className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{userFile.name}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{formatFileSize(userFile.size)}</span>
                          <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-400">
                            {FORMAT_LABELS[userFile.type] || userFile.name.split('.').pop()?.toUpperCase() || "VIDEO"}
                          </span>
                        </div>
                      </div>
                      {!isComparing && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setUserFile(null); }}
                          className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-800 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {isComparing && uploadPhase && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{uploadPhase}</span>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <span className="text-cyan-400 font-medium">{uploadProgress}%</span>
                    )}
                  </div>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <Progress value={uploadProgress} className="h-2" />
                  )}
                </div>
              )}

              {/* Compare Button */}
              <Button
                onClick={handleCompare}
                disabled={isComparing || !viralUrl.trim() || !userFile}
                className="w-full h-14 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold text-lg rounded-xl"
              >
                {isComparing ? (
                  <span className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {uploadPhase || "Procesando..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <GitCompareArrows className="w-5 h-5" />
                    Comparar Videos
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isComparing && uploadProgress === 100 && (
          <Card className="bg-[#12121a] border-gray-800 mb-8">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
                  <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
                  <GitCompareArrows className="absolute inset-0 m-auto w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Analizando ambos videos con IA...</h3>
                <p className="text-gray-400 mb-6">Esto puede tardar 1-3 minutos. Estamos analizando cada detalle.</p>
                <div className="space-y-3 max-w-md mx-auto text-left">
                  {[
                    { text: "Descargando video viral de referencia...", icon: Trophy },
                    { text: "Comprimiendo ambos videos con FFmpeg...", icon: Scissors },
                    { text: "Extrayendo frames clave y audio...", icon: Eye },
                    { text: "Transcribiendo audio con Whisper...", icon: MessageSquare },
                    { text: "Detectando cortes y transiciones...", icon: Scissors },
                    { text: "Analizando subtitulos...", icon: Subtitles },
                    { text: "Analizando HOOK (primeros 3 seg)...", icon: Zap },
                    { text: "Comparando ambos videos con Gemini...", icon: GitCompareArrows },
                    { text: "Generando correcciones priorizadas...", icon: Lightbulb },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <step.icon className="w-4 h-4 text-cyan-400/40 animate-pulse" />
                      <span className="text-gray-500">{step.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {comparisonResult && (
          <div className="space-y-6">
            {/* Overall Verdict */}
            <Card className="bg-[#12121a] border-gray-800 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className={`flex-shrink-0 w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center ${getScoreBg(comparisonResult.similarityScore)}`}>
                    <span className="text-3xl font-bold text-white">{comparisonResult.similarityScore}</span>
                    <span className="text-xs text-gray-400">similitud</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-2">Veredicto General</h2>
                    <p className="text-gray-300 leading-relaxed">{comparisonResult.overallVerdict}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Score Cards - now with 6 scores including subtitles and cuts */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "General", score: comparisonResult.overallScore, icon: TrendingUp, viralScore: comparisonResult.viralAnalysis?.overallScore },
                { label: "Hook", score: comparisonResult.hookScore, icon: Zap, viralScore: comparisonResult.viralAnalysis?.hookScore },
                { label: "Ritmo", score: comparisonResult.pacingScore, icon: Target, viralScore: comparisonResult.viralAnalysis?.pacingScore },
                { label: "Engagement", score: comparisonResult.engagementScore, icon: Eye, viralScore: comparisonResult.viralAnalysis?.engagementScore },
                { label: "Subtitulos", score: comparisonResult.subtitleScore, icon: Subtitles },
                { label: "Cortes", score: comparisonResult.cutScore, icon: Scissors },
              ].map((item) => (
                <Card key={item.label} className="bg-[#12121a] border-gray-800">
                  <CardContent className="p-3 text-center">
                    <item.icon className={`w-4 h-4 mx-auto mb-1 ${getScoreColor(item.score)}`} />
                    <div className="text-[10px] text-gray-500 mb-0.5">{item.label}</div>
                    <div className={`text-xl font-bold ${getScoreColor(item.score)}`}>
                      {item.score} {getScoreEmoji(item.score)}
                    </div>
                    {item.viralScore && (
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        Viral: <span className="text-yellow-400">{item.viralScore}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Category Comparisons - now includes subtitles */}
            {[
              { key: "hookComparison", title: "HOOK (Primeros 3 segundos)", icon: Zap, color: "text-yellow-400", emphasis: true },
              { key: "subtitleComparison", title: "Subtitulos", icon: Subtitles, color: "text-pink-400" },
              { key: "pacingComparison", title: "Ritmo, Cortes y Edicion", icon: Scissors, color: "text-cyan-400" },
              { key: "contentComparison", title: "Contenido y Mensaje", icon: MessageSquare, color: "text-purple-400" },
              { key: "visualComparison", title: "Visual y Produccion", icon: Eye, color: "text-emerald-400" },
              { key: "ctaComparison", title: "Call to Action", icon: TrendingUp, color: "text-orange-400" },
            ].map((category) => {
              const data = comparisonResult[category.key];
              if (!data) return null;
              const score = data.hookScore || data.subtitleScore || data.pacingScore || data.contentScore || data.visualScore || data.ctaScore;
              return (
                <Card key={category.key} className={`bg-[#12121a] ${category.emphasis ? "border-yellow-500/30 ring-1 ring-yellow-500/10" : "border-gray-800"}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-white">
                        <category.icon className={`w-5 h-5 ${category.color}`} />
                        {category.title}
                        {category.emphasis && (
                          <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-normal">
                            CRITICO
                          </span>
                        )}
                      </span>
                      {score !== undefined && (
                        <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                          {score}/100
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Viral Reference */}
                    <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium text-yellow-400">El viral hace:</span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {data.viralHookSummary || data.viralSubtitleSummary || data.viralPacingSummary || data.viralContentSummary || data.viralVisualSummary || data.viralCtaSummary}
                      </p>
                    </div>

                    {/* User Analysis */}
                    <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-medium text-cyan-400">Tu video:</span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {data.userHookAnalysis || data.userSubtitleAnalysis || data.userPacingAnalysis || data.userContentAnalysis || data.userVisualAnalysis || data.userCtaAnalysis}
                      </p>
                    </div>

                    {/* What's Missing */}
                    {data.whatsMissing && (
                      <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="text-sm font-medium text-red-400">Lo que falta:</span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">{data.whatsMissing}</p>
                      </div>
                    )}

                    {/* Fix Instructions */}
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-400">Como corregirlo:</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(data.fixInstructions, category.title)}
                          className="text-gray-500 hover:text-white transition-colors"
                        >
                          {copied === category.title ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{data.fixInstructions}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Top Corrections */}
            {comparisonResult.topCorrections && comparisonResult.topCorrections.length > 0 && (
              <Card className="bg-[#12121a] border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    Top {comparisonResult.topCorrections.length} Correcciones Prioritarias
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {comparisonResult.topCorrections.map((correction: any, i: number) => (
                    <div key={i} className="bg-[#1a1a2e] rounded-lg p-4 border border-gray-800">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                          <span className="text-sm font-bold text-red-400">#{correction.priority || i + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-white">{correction.title}</h4>
                            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{correction.category}</span>
                            {correction.timestamp && (
                              <span className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full">{correction.timestamp}</span>
                            )}
                          </div>
                          <p className="text-sm text-red-300 mb-2">
                            <span className="font-medium">Problema:</span> {correction.currentIssue}
                          </p>
                          <p className="text-sm text-emerald-300 mb-2">
                            <span className="font-medium">Correccion:</span> {correction.exactFix}
                          </p>
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Impacto esperado:</span> {correction.expectedImpact}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* What Works Well */}
            {comparisonResult.whatWorksWell && comparisonResult.whatWorksWell.length > 0 && (
              <Card className="bg-[#12121a] border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Lo que ya haces bien
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {comparisonResult.whatWorksWell.map((item: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-emerald-300 text-sm">{item.aspect}:</span>
                          <span className="text-gray-300 text-sm ml-1">{item.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* New Comparison Button */}
            <div className="text-center pt-4">
              <Button
                onClick={() => {
                  setComparisonResult(null);
                  setViralUrl("");
                  setUserFile(null);
                  setUploadProgress(0);
                }}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:text-white hover:border-cyan-500"
              >
                <GitCompareArrows className="w-4 h-4 mr-2" />
                Nueva Comparacion
              </Button>
            </div>
          </div>
        )}

        {/* Empty State - How it works */}
        {!comparisonResult && !isComparing && (
          <Card className="bg-[#12121a] border-gray-800">
            <CardContent className="p-8">
              <h3 className="text-lg font-semibold text-white mb-6 text-center">Como funciona?</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    step: "1",
                    title: "Pega el viral",
                    desc: "Introduce la URL del video viral que quieres usar como referencia",
                    icon: Trophy,
                    color: "text-yellow-400",
                    bg: "bg-yellow-500/10",
                  },
                  {
                    step: "2",
                    title: "Sube tu video",
                    desc: "Arrastra o selecciona tu video grabado (MP4, MOV, AVI, WebM, MKV...)",
                    icon: Upload,
                    color: "text-cyan-400",
                    bg: "bg-cyan-500/10",
                  },
                  {
                    step: "3",
                    title: "Recibe correcciones",
                    desc: "La IA analiza hook, cortes, subtitulos y te da correcciones exactas",
                    icon: Lightbulb,
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10",
                  },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className={`w-14 h-14 rounded-xl ${item.bg} flex items-center justify-center mx-auto mb-3`}>
                      <item.icon className={`w-7 h-7 ${item.color}`} />
                    </div>
                    <div className="text-xs text-gray-500 mb-1">Paso {item.step}</div>
                    <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Supported Formats */}
              <div className="mt-8 pt-6 border-t border-gray-800">
                <p className="text-xs text-gray-500 text-center mb-3">Formatos soportados para subida</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {["MP4", "MOV", "AVI", "WebM", "MKV", "MPEG", "3GP", "FLV", "OGG", "WMV"].map((fmt) => (
                    <span key={fmt} className="text-[10px] bg-gray-800/50 text-gray-400 px-2 py-1 rounded">
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
