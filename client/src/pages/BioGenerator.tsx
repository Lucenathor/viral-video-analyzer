import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Instagram,
  Sparkles,
  Copy,
  Check,
  Loader2,
  Globe,
  Zap,
  Target,
  Lightbulb,
  Hash,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Clock,
  BadgeCheck,
  MessageSquare,
  Grid3x3,
  Heart,
  Bookmark,
  Send as SendIcon,
  MoreHorizontal,
  User,
  ChevronDown,
} from "lucide-react";

const SECTORS = [
  "Clínica Estética", "Inmobiliaria", "Abogados", "Marketing Digital",
  "Personal Trainer", "Micropigmentación", "Manicura", "Peluquería",
  "Restaurante", "Coaching", "Psicología", "Fisioterapia",
  "Dentista", "Veterinario", "Fotografía", "Arquitectura",
  "Contabilidad", "E-commerce", "Formación Online", "Nutrición",
  "Otro"
];

const TONES = [
  { value: "profesional", label: "Profesional", desc: "Serio, confiable, corporativo" },
  { value: "cercano", label: "Cercano", desc: "Amigable, accesible, humano" },
  { value: "premium", label: "Premium", desc: "Exclusivo, lujoso, aspiracional" },
  { value: "divertido", label: "Divertido", desc: "Desenfadado, creativo, fresco" },
];

type BioResult = {
  success: boolean;
  profileName: string;
  bio: string;
  ctaType: "lead_magnet" | "auditoria" | "consultoria";
  ctaText: string;
  ctaReason: string;
  websiteUrl: string;
  slot: string;
  hashtags: string[];
  category: string;
  tips: string[];
  alternativeBios: Array<{ style: string; bio: string }>;
  businessName: string;
  sector: string;
};

export default function BioGenerator() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [sector, setSector] = useState("");
  const [city, setCity] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState<string>("profesional");
  const [result, setResult] = useState<BioResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedBioIndex, setSelectedBioIndex] = useState<number>(-1); // -1 = main bio

  const generateMutation = trpc.bioGenerator.generate.useMutation({
    onSuccess: (data) => {
      setResult(data as BioResult);
      setSelectedBioIndex(-1);
      toast.success("¡Biografía generada con éxito!");
    },
    onError: (error) => {
      toast.error(error.message || "Error al generar la biografía");
    },
  });

  const handleGenerate = useCallback(() => {
    if (!businessName.trim() || !businessDescription.trim() || !sector) {
      toast.error("Rellena al menos el nombre, descripción y sector");
      return;
    }
    generateMutation.mutate({
      businessName: businessName.trim(),
      businessDescription: businessDescription.trim(),
      sector,
      city: city.trim() || undefined,
      targetAudience: targetAudience.trim() || undefined,
      tone: tone as "profesional" | "cercano" | "premium" | "divertido",
    });
  }, [businessName, businessDescription, sector, city, targetAudience, tone, generateMutation]);

  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copiado al portapapeles");
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const getCurrentBio = () => {
    if (!result) return "";
    if (selectedBioIndex === -1) return result.bio;
    return result.alternativeBios[selectedBioIndex]?.bio || result.bio;
  };

  const ctaTypeLabels: Record<string, { label: string; color: string; icon: string }> = {
    lead_magnet: { label: "Lead Magnet", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: "🧲" },
    auditoria: { label: "Auditoría Gratis", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: "🔍" },
    consultoria: { label: "Consultoría Gratis", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: "💬" },
  };

  // Not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container pt-24 pb-12">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Instagram className="w-16 h-16 text-pink-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Generador de Bios de Instagram</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Crea biografías profesionales que convierten seguidores en clientes.
              Inicia sesión para empezar.
            </p>
            <Link href="/login">
              <Button size="lg" className="gradient-primary glow-primary gap-2">
                <Zap className="w-5 h-5" />
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-pink-500/30 mb-4">
            <Instagram className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-medium text-pink-400">Bio Generator Pro</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Crea tu <span className="text-gradient">Bio Perfecta</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Describe tu negocio y nuestra IA generará una biografía de Instagram 
            profesional con CTA inteligente, enlace web y slot de urgencia.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left: Form */}
          <div className="space-y-6">
            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Datos del Negocio
                </CardTitle>
                <CardDescription>
                  Cuéntanos sobre tu negocio para generar la bio perfecta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Business Name */}
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-sm font-medium">
                    Nombre del Negocio *
                  </Label>
                  <Input
                    id="businessName"
                    placeholder="Ej: Clínica Estética Bella Vita"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="bg-card border-border/50 focus:border-primary/50"
                  />
                </div>

                {/* Sector */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sector *</Label>
                  <Select value={sector} onValueChange={setSector}>
                    <SelectTrigger className="bg-card border-border/50">
                      <SelectValue placeholder="Selecciona tu sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Descripción del Negocio *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Ej: Somos una clínica estética en Madrid especializada en tratamientos faciales y corporales. Ofrecemos botox, ácido hialurónico, liposucción y medicina estética avanzada. Nuestro equipo tiene 15 años de experiencia..."
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    className="bg-card border-border/50 focus:border-primary/50 min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cuanto más detallada sea la descripción, mejor será la bio generada
                  </p>
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    Ciudad / Zona
                  </Label>
                  <Input
                    id="city"
                    placeholder="Ej: Madrid, Barrio Salamanca"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-card border-border/50 focus:border-primary/50"
                  />
                </div>

                {/* Target Audience */}
                <div className="space-y-2">
                  <Label htmlFor="audience" className="text-sm font-medium">
                    Público Objetivo
                  </Label>
                  <Input
                    id="audience"
                    placeholder="Ej: Mujeres 25-50 años que buscan rejuvenecer"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="bg-card border-border/50 focus:border-primary/50"
                  />
                </div>

                {/* Tone */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Tono de la Bio</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {TONES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTone(t.value)}
                        className={`p-3 rounded-xl border text-left transition-all duration-300 ${
                          tone === t.value
                            ? "border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                            : "border-border/30 bg-card hover:border-primary/30"
                        }`}
                      >
                        <p className={`text-sm font-medium ${tone === t.value ? "text-primary" : ""}`}>
                          {t.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || !businessName.trim() || !businessDescription.trim() || !sector}
                  className="w-full h-14 text-lg gradient-primary text-white glow-primary gap-2 rounded-xl"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generando bio profesional...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generar Biografía
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Result / Preview */}
          <div className="space-y-6">
            {!result && !generateMutation.isPending && (
              <Card className="glass border-dashed border-muted-foreground/20">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 flex items-center justify-center mx-auto mb-6">
                    <Instagram className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Vista Previa</h3>
                  <p className="text-muted-foreground">
                    Rellena los datos de tu negocio y pulsa "Generar Biografía" 
                    para ver aquí la vista previa de tu perfil de Instagram.
                  </p>
                </CardContent>
              </Card>
            )}

            {generateMutation.isPending && (
              <Card className="glass border-primary/20">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Generando tu bio...</h3>
                  <p className="text-muted-foreground mb-4">
                    Analizando tu negocio, eligiendo el CTA perfecto y creando una bio que convierte.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-primary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Esto puede tardar unos segundos
                  </div>
                </CardContent>
              </Card>
            )}

            {result && (
              <>
                {/* Instagram Profile Preview */}
                <Card className="glass border-pink-500/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-orange-500/10 p-4 border-b border-border/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Instagram className="w-5 h-5 text-pink-400" />
                        <span className="font-semibold text-sm">Vista Previa Instagram</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerate}
                        disabled={generateMutation.isPending}
                        className="gap-1.5 text-xs"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
                        Regenerar
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-0">
                    {/* Instagram-style profile header */}
                    <div className="p-6 bg-black/20">
                      {/* Top bar */}
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-sm">{result.profileName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}</span>
                          <BadgeCheck className="w-4 h-4 text-blue-400" />
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-3">
                          <MoreHorizontal className="w-5 h-5" />
                        </div>
                      </div>
                      
                      {/* Profile row */}
                      <div className="flex items-start gap-5 mb-4">
                        {/* Avatar */}
                        <div className="shrink-0">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 p-[3px]">
                            <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                              <span className="text-2xl font-bold text-gradient">
                                {result.businessName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Stats */}
                        <div className="flex-1 flex items-center justify-around pt-2">
                          <div className="text-center">
                            <p className="font-bold text-lg">127</p>
                            <p className="text-xs text-muted-foreground">Posts</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-lg">2.4K</p>
                            <p className="text-xs text-muted-foreground">Seguidores</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-lg">348</p>
                            <p className="text-xs text-muted-foreground">Seguidos</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Name & Bio */}
                      <div className="mb-3">
                        <p className="font-bold text-sm mb-1">{result.profileName}</p>
                        <p className="text-xs text-muted-foreground mb-1">{result.category}</p>
                        <div className="text-sm whitespace-pre-line leading-relaxed">
                          {getCurrentBio()}
                        </div>
                      </div>
                      
                      {/* Slot */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <Clock className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-xs font-medium text-orange-400">{result.slot}</span>
                      </div>
                      
                      {/* Website Link */}
                      <a className="flex items-center gap-1 text-sm text-blue-400 font-medium mb-4 hover:underline cursor-pointer">
                        <Globe className="w-3.5 h-3.5" />
                        {result.websiteUrl}
                      </a>
                      
                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button className="flex-1 h-9 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
                          {result.ctaText}
                        </Button>
                        <Button variant="outline" className="h-9 text-sm rounded-lg bg-card/50 border-border/50">
                          <SendIcon className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Grid icons */}
                      <div className="flex items-center justify-around mt-5 pt-3 border-t border-border/30">
                        <Grid3x3 className="w-5 h-5 text-foreground" />
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* CTA Strategy */}
                <Card className="glass border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="w-5 h-5 text-primary" />
                      Estrategia CTA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{ctaTypeLabels[result.ctaType]?.icon}</span>
                      <Badge className={ctaTypeLabels[result.ctaType]?.color}>
                        {ctaTypeLabels[result.ctaType]?.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {result.ctaReason}
                    </p>
                  </CardContent>
                </Card>

                {/* Copy Sections */}
                <Card className="glass border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Copy className="w-5 h-5 text-primary" />
                      Copiar Elementos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Profile Name */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/30">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Nombre del Perfil</p>
                        <p className="text-sm font-medium">{result.profileName}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.profileName, "name")}
                        className="shrink-0"
                      >
                        {copiedField === "name" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>

                    {/* Bio */}
                    <div className="flex items-start justify-between p-3 rounded-lg bg-card/50 border border-border/30">
                      <div className="flex-1 mr-2">
                        <p className="text-xs text-muted-foreground mb-0.5">Biografía</p>
                        <p className="text-sm whitespace-pre-line">{getCurrentBio()}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(getCurrentBio(), "bio")}
                        className="shrink-0"
                      >
                        {copiedField === "bio" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>

                    {/* Website */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/30">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Enlace Web</p>
                        <p className="text-sm font-medium text-blue-400">{result.websiteUrl}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.websiteUrl, "url")}
                        className="shrink-0"
                      >
                        {copiedField === "url" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/30">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Botón CTA</p>
                        <p className="text-sm font-medium">{result.ctaText}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.ctaText, "cta")}
                        className="shrink-0"
                      >
                        {copiedField === "cta" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>

                    {/* Copy All */}
                    <Button
                      variant="outline"
                      className="w-full gap-2 mt-2"
                      onClick={() => {
                        const fullText = `📱 PERFIL DE INSTAGRAM\n\n👤 Nombre: ${result.profileName}\n📝 Categoría: ${result.category}\n\n✍️ Biografía:\n${getCurrentBio()}\n\n🔗 Enlace: ${result.websiteUrl}\n🎯 CTA: ${result.ctaText}\n⏰ Slot: ${result.slot}\n\n#️⃣ Hashtags: ${result.hashtags.map(h => '#' + h).join(' ')}`;
                        copyToClipboard(fullText, "all");
                      }}
                    >
                      {copiedField === "all" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      Copiar Todo
                    </Button>
                  </CardContent>
                </Card>

                {/* Alternative Bios */}
                {result.alternativeBios && result.alternativeBios.length > 0 && (
                  <Card className="glass border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <RefreshCw className="w-5 h-5 text-primary" />
                        Versiones Alternativas
                      </CardTitle>
                      <CardDescription>
                        Haz clic en una versión para verla en la vista previa
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <button
                        onClick={() => setSelectedBioIndex(-1)}
                        className={`w-full text-left p-3 rounded-lg border transition-all duration-300 ${
                          selectedBioIndex === -1
                            ? "border-primary/50 bg-primary/10"
                            : "border-border/30 bg-card/50 hover:border-primary/30"
                        }`}
                      >
                        <p className="text-xs font-medium text-primary mb-1">Original</p>
                        <p className="text-sm whitespace-pre-line">{result.bio}</p>
                      </button>
                      {result.alternativeBios.map((alt, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedBioIndex(idx)}
                          className={`w-full text-left p-3 rounded-lg border transition-all duration-300 ${
                            selectedBioIndex === idx
                              ? "border-primary/50 bg-primary/10"
                              : "border-border/30 bg-card/50 hover:border-primary/30"
                          }`}
                        >
                          <p className="text-xs font-medium text-primary mb-1">{alt.style}</p>
                          <p className="text-sm whitespace-pre-line">{alt.bio}</p>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Hashtags */}
                <Card className="glass border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Hash className="w-5 h-5 text-primary" />
                      Hashtags Recomendados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {result.hashtags.map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary/20 transition-colors"
                          onClick={() => copyToClipboard('#' + tag, `tag-${idx}`)}
                        >
                          #{tag}
                          {copiedField === `tag-${idx}` && <Check className="w-3 h-3 ml-1 text-green-400" />}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => copyToClipboard(result.hashtags.map(h => '#' + h).join(' '), "hashtags")}
                    >
                      {copiedField === "hashtags" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copiar todos los hashtags
                    </Button>
                  </CardContent>
                </Card>

                {/* Tips */}
                <Card className="glass border-yellow-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Lightbulb className="w-5 h-5 text-yellow-400" />
                      Consejos Pro
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.tips.map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                          <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-yellow-400">{idx + 1}</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
