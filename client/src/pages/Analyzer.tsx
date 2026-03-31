import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { 
  GitCompareArrows, Link2, Loader2, AlertCircle, CheckCircle2, 
  XCircle, ArrowRight, Trophy, Target, Zap, Eye, MessageSquare,
  TrendingUp, Lightbulb, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Analyzer() {
  const { user, loading: authLoading } = useAuth();

  
  const [viralUrl, setViralUrl] = useState("");
  const [userUrl, setUserUrl] = useState("");
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const compareByUrl = trpc.video.compareByUrl.useMutation({
    onSuccess: (data) => {
      setComparisonResult(data);
      toast.success("Comparacion completada! Revisa las correcciones abajo");
    },
    onError: (error) => {
      toast.error(error.message || "Error en la comparacion");
    },
  });

  const handleCompare = () => {
    if (!viralUrl.trim() || !userUrl.trim()) {
      toast.error("Introduce ambas URLs para comparar");
      return;
    }
    setComparisonResult(null);
    compareByUrl.mutate({ viralUrl: viralUrl.trim(), userUrl: userUrl.trim() });
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
              Pega la URL del video viral de referencia y la URL de tu video. 
              La IA analizara ambos y te dara correcciones exactas para mejorar.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8 max-w-4xl">
        {/* URL Inputs */}
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
                    disabled={compareByUrl.isPending}
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

              {/* User URL */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  URL de Tu Video (a corregir)
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="https://... URL de tu video grabado"
                    value={userUrl}
                    onChange={(e) => setUserUrl(e.target.value)}
                    className="bg-[#1a1a2e] border-gray-700 text-white pl-10 h-12 placeholder:text-gray-600"
                    disabled={compareByUrl.isPending}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Pega el enlace de tu video inspirado en el viral</p>
              </div>

              {/* Compare Button */}
              <Button
                onClick={handleCompare}
                disabled={compareByUrl.isPending || !viralUrl.trim() || !userUrl.trim()}
                className="w-full h-14 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold text-lg rounded-xl"
              >
                {compareByUrl.isPending ? (
                  <span className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analizando y comparando... (puede tardar 1-3 min)
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
        {compareByUrl.isPending && (
          <Card className="bg-[#12121a] border-gray-800 mb-8">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
                  <div className="absolute inset-0 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
                  <GitCompareArrows className="absolute inset-0 m-auto w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Analizando ambos videos...</h3>
                <p className="text-gray-400 mb-6">La IA esta descargando, analizando y comparando frame a frame</p>
                <div className="space-y-3 max-w-md mx-auto text-left">
                  {[
                    "Descargando video viral...",
                    "Descargando tu video...",
                    "Comprimiendo con FFmpeg...",
                    "Extrayendo frames y audio...",
                    "Transcribiendo audio...",
                    "Analizando viral con IA...",
                    "Comparando ambos videos...",
                    "Generando correcciones..."
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-cyan-400/30 animate-pulse" />
                      <span className="text-gray-500">{step}</span>
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

            {/* Score Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "General", score: comparisonResult.overallScore, icon: TrendingUp, viralScore: comparisonResult.viralAnalysis?.overallScore },
                { label: "Hook", score: comparisonResult.hookScore, icon: Zap, viralScore: comparisonResult.viralAnalysis?.hookScore },
                { label: "Ritmo", score: comparisonResult.pacingScore, icon: Target, viralScore: comparisonResult.viralAnalysis?.pacingScore },
                { label: "Engagement", score: comparisonResult.engagementScore, icon: Eye, viralScore: comparisonResult.viralAnalysis?.engagementScore },
              ].map((item) => (
                <Card key={item.label} className="bg-[#12121a] border-gray-800">
                  <CardContent className="p-4 text-center">
                    <item.icon className={`w-5 h-5 mx-auto mb-2 ${getScoreColor(item.score)}`} />
                    <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                    <div className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                      {item.score} {getScoreEmoji(item.score)}
                    </div>
                    {item.viralScore && (
                      <div className="text-xs text-gray-500 mt-1">
                        Viral: <span className="text-yellow-400">{item.viralScore}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Category Comparisons */}
            {[
              { key: "hookComparison", title: "Hook (Primeros 3 segundos)", icon: Zap, color: "text-yellow-400" },
              { key: "pacingComparison", title: "Ritmo y Edicion", icon: Target, color: "text-cyan-400" },
              { key: "contentComparison", title: "Contenido y Mensaje", icon: MessageSquare, color: "text-purple-400" },
              { key: "visualComparison", title: "Visual y Produccion", icon: Eye, color: "text-emerald-400" },
              { key: "ctaComparison", title: "Call to Action", icon: TrendingUp, color: "text-orange-400" },
            ].map((category) => {
              const data = comparisonResult[category.key];
              if (!data) return null;
              const score = data.hookScore || data.pacingScore || data.contentScore || data.visualScore || data.ctaScore;
              return (
                <Card key={category.key} className="bg-[#12121a] border-gray-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-white">
                        <category.icon className={`w-5 h-5 ${category.color}`} />
                        {category.title}
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
                        {data.viralHookSummary || data.viralPacingSummary || data.viralContentSummary || data.viralVisualSummary || data.viralCtaSummary}
                      </p>
                    </div>

                    {/* User Analysis */}
                    <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-medium text-cyan-400">Tu video:</span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {data.userHookAnalysis || data.userPacingAnalysis || data.userContentAnalysis || data.userVisualAnalysis || data.userCtaAnalysis}
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

            {/* Top 5 Corrections */}
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
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white">{correction.title}</h4>
                            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{correction.category}</span>
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
                  setUserUrl("");
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
        {!comparisonResult && !compareByUrl.isPending && (
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
                    title: "Pega tu video",
                    desc: "Introduce la URL de tu video grabado inspirado en el viral",
                    icon: Target,
                    color: "text-cyan-400",
                    bg: "bg-cyan-500/10",
                  },
                  {
                    step: "3",
                    title: "Recibe correcciones",
                    desc: "La IA analiza ambos y te da correcciones exactas con timestamps",
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
