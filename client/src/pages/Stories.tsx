import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Flame, 
  Sparkles, 
  Camera, 
  Video, 
  MessageCircle, 
  Clock, 
  Target, 
  Zap,
  ChevronRight,
  Copy,
  Download,
  RefreshCw,
  History,
  Lightbulb,
  Send,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Smartphone,
  Eye,
  List,
  LayoutGrid
} from "lucide-react";
import { sectorsDatabase, SectorData, getObjectivesForSector } from "@/data/sectorsDatabase";
import StoryPreview from "@/components/StoryPreview";
import Navbar from "@/components/Navbar";

// Types for the generated stories
interface Story {
  number: number;
  type: "FOTO" | "VIDEO";
  phase: string;
  instruction: string;
  duration?: string;
  spokenText?: string;
  screenText: string;
  sticker?: string;
  background?: string;
  voiceNote?: string;
}

interface GeneratedResult {
  success: boolean;
  historyId: number;
  stories: Story[];
  dmMessages: {
    dm1: string;
    dm2: string;
  };
  suggestedOffers: string[];
  goalSummary?: string;
}

// Urgency types
const urgencyTypes = [
  { value: "hora_cierre", label: "Hora de cierre", placeholder: "Ej: 20:00" },
  { value: "huecos_semana", label: "Huecos esta semana", placeholder: "Ej: 3" },
  { value: "plazas_hoy", label: "Plazas hoy", placeholder: "Ej: 2" },
];

// Variants
const variants = [
  { value: "agresiva", label: "🔥 Agresiva", description: "Tono directo, urgente, presiona para acción" },
  { value: "neutra", label: "⚖️ Neutra", description: "Profesional pero cercano, equilibrado" },
  { value: "autoridad", label: "👑 Autoridad", description: "Tono experto, credibilidad, casos de éxito" },
];

// Colores de fondo para las stories
const storyBackgrounds = [
  "bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700",
  "bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700",
  "bg-gradient-to-br from-rose-900 via-red-800 to-orange-700",
  "bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700",
  "bg-gradient-to-br from-emerald-900 via-green-800 to-lime-700",
];

export default function Stories() {
  // Form state
  const [sectorId, setSectorId] = useState("");
  const [sectorCustom, setSectorCustom] = useState("");
  const [city, setCity] = useState("");
  const [objective, setObjective] = useState<string>("");
  const [offer, setOffer] = useState("");
  const [urgencyType, setUrgencyType] = useState("hora_cierre");
  const [urgencyValue, setUrgencyValue] = useState("");
  const [ctaKeyword, setCtaKeyword] = useState("INFO");
  const [ticket, setTicket] = useState("");
  const [differentiator, setDifferentiator] = useState("");
  const [socialProof, setSocialProof] = useState("");
  const [variant, setVariant] = useState<"agresiva" | "neutra" | "autoridad">("neutra");
  const [easyMode, setEasyMode] = useState(true);
  const [goalDescription, setGoalDescription] = useState("");
  
  // Result state
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [activeTab, setActiveTab] = useState("form");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "list">("preview");
  
  // Obtener objetivos filtrados por sector
  const filteredObjectives = useMemo(() => {
    if (!sectorId || sectorId === "otro") {
      return getObjectivesForSector("all");
    }
    return getObjectivesForSector(sectorId);
  }, [sectorId]);
  
  // Resetear objetivo si el sector cambia y el objetivo actual no está permitido
  useEffect(() => {
    if (sectorId && objective) {
      const isObjectiveAllowed = filteredObjectives.some(obj => obj.value === objective);
      if (!isObjectiveAllowed) {
        setObjective("");
      }
    }
  }, [sectorId, filteredObjectives]);
  
  // Generate mutation
  const generateMutation = trpc.stories.generate.useMutation({
    onSuccess: (data) => {
      setResult(data as GeneratedResult);
      setActiveTab("result");
    },
  });
  
  // History query
  const historyQuery = trpc.stories.getHistory.useQuery({ limit: 10 });
  
  // Handle generate
  const handleGenerate = () => {
    if (!sectorId || !objective || !urgencyValue) {
      return;
    }
    
    generateMutation.mutate({
      sectorId,
      sectorCustom: sectorCustom || undefined,
      city: city || undefined,
      objective: objective as any,
      offer: offer || undefined,
      urgency: {
        type: urgencyType as any,
        value: urgencyValue,
      },
      ctaKeyword,
      ticket: ticket || undefined,
      differentiator: differentiator || undefined,
      socialProof: socialProof || undefined,
      variant,
      easyMode,
      goalDescription: goalDescription || undefined,
    });
  };
  
  // Copy to clipboard
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };
  
  // Export to PDF
  const exportToPDF = (result: GeneratedResult) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Guión de Stories - ${selectedSector?.name || sectorCustom}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 10px; }
          h2 { color: #333; margin-top: 30px; }
          .goal { background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .story { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 15px; page-break-inside: avoid; }
          .story-header { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
          .story-number { background: #f97316; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; }
          .story-type { background: ${result.stories[0]?.type === 'FOTO' ? '#3b82f6' : '#ef4444'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
          .label { color: #666; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
          .content { margin-bottom: 15px; }
          .screen-text { background: #f3e8ff; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; }
          .dm-section { background: #ecfdf5; padding: 20px; border-radius: 8px; margin-top: 30px; }
          .dm-message { background: white; padding: 15px; border-radius: 8px; margin-top: 10px; border: 1px solid #d1fae5; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>🔥 Guión de Stories</h1>
        <p><strong>Sector:</strong> ${selectedSector?.name || sectorCustom}</p>
        <p><strong>Objetivo:</strong> ${objective}</p>
        <p><strong>Estilo:</strong> ${variant}</p>
        
        ${result.goalSummary ? `<div class="goal"><strong>🎯 Objetivo del lanzamiento:</strong> ${result.goalSummary}</div>` : ''}
        
        <h2>Stories</h2>
        ${result.stories.map((story, i) => `
          <div class="story">
            <div class="story-header">
              <div class="story-number">${story.number}</div>
              <span class="story-type" style="background: ${story.type === 'FOTO' ? '#3b82f6' : '#ef4444'}">${story.type}</span>
              <span style="color: #666;">${story.phase}</span>
            </div>
            <div class="content">
              <div class="label">Qué hacer:</div>
              <p>${story.instruction}</p>
            </div>
            ${story.type === 'VIDEO' && story.duration ? `<div class="content"><div class="label">Duración:</div><p>${story.duration}</p></div>` : ''}
            ${story.type === 'VIDEO' && story.spokenText ? `<div class="content"><div class="label">Texto a decir:</div><p style="font-style: italic;">"${story.spokenText}"</p></div>` : ''}
            ${story.type === 'FOTO' ? `<div class="content"><div class="label">Nota:</div><p>Esta story es una foto estática. No necesitas grabar voz.</p></div>` : ''}
            <div class="screen-text">
              <div class="label">Texto en pantalla:</div>
              ${story.screenText}
            </div>
            ${story.sticker ? `<p><strong>Sticker:</strong> ${story.sticker}</p>` : ''}
          </div>
        `).join('')}
        
        <div class="dm-section">
          <h2>💬 Mensajes de DM</h2>
          <div class="dm-message">
            <div class="label">DM 1 - Filtro:</div>
            <p>${result.dmMessages.dm1}</p>
          </div>
          <div class="dm-message">
            <div class="label">DM 2 - Cierre:</div>
            <p>${result.dmMessages.dm2}</p>
          </div>
        </div>
        
        ${result.suggestedOffers && result.suggestedOffers.length > 0 ? `
          <h2>💡 Ofertas Sugeridas</h2>
          <ul>
            ${result.suggestedOffers.map(offer => `<li>${offer}</li>`).join('')}
          </ul>
        ` : ''}
        
        <p style="margin-top: 40px; color: #999; font-size: 12px; text-align: center;">Generado con ViralPro - Lanzamientos en Caliente</p>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };
  
  // Get sector suggestions
  const selectedSector = sectorsDatabase.find((s: SectorData) => s.id === sectorId);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <Navbar />
      <div className="pt-24 pb-8 px-4">
      <div className="container max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 mb-6">
            <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
            <span className="text-orange-300 font-medium">Lanzamientos en Caliente</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
              Genera Guiones de Stories
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-6">
            Crea secuencias de 5 Stories que convierten. Guiones listos para grabar con IA.
          </p>
          
          {/* Explicación de la sección */}
          <div className="bg-slate-800/50 rounded-2xl p-6 max-w-3xl mx-auto text-left border border-slate-700/50">
            <h3 className="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              ¿Para qué sirve esta sección?
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Los <strong className="text-white">Lanzamientos en Caliente</strong> generan guiones completos de 5 Stories para vender tus servicios o productos de forma urgente. 
              La IA crea el guión con <strong className="text-white">texto exacto a decir, texto en pantalla, stickers y mensajes de DM</strong> listos para copiar.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-400 text-xs">1</span>
                </div>
                <span className="text-slate-400"><strong className="text-white">Rellena el formulario</strong> con tu sector, objetivo y urgencia real</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-400 text-xs">2</span>
                </div>
                <span className="text-slate-400"><strong className="text-white">La IA genera el guión</strong> con 5 Stories (FOTO/VÍDEO/FOTO/VÍDEO/FOTO)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-xs">3</span>
                </div>
                <span className="text-slate-400"><strong className="text-white">Graba y publica</strong> siguiendo las instrucciones exactas</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-slate-800/50 p-1 rounded-xl">
            <TabsTrigger value="form" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 rounded-lg">
              <Sparkles className="w-4 h-4 mr-2" />
              Crear
            </TabsTrigger>
            <TabsTrigger value="result" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 rounded-lg" disabled={!result}>
              <Smartphone className="w-4 h-4 mr-2" />
              Vista Previa
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 rounded-lg">
              <History className="w-4 h-4 mr-2" />
              Historial
            </TabsTrigger>
          </TabsList>
          
          {/* Form Tab */}
          <TabsContent value="form" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column - Main Inputs */}
              <div className="space-y-6">
                {/* Sector Selection */}
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-slate-700/50">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="w-5 h-5 text-orange-400" />
                      Tu Negocio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Sector</Label>
                      <Select value={sectorId} onValueChange={setSectorId}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-600">
                          <SelectValue placeholder="Selecciona tu sector" />
                        </SelectTrigger>
                        <SelectContent>
                          {sectorsDatabase.map((sector: SectorData) => (
                            <SelectItem key={sector.id} value={sector.id}>
                              {sector.icon} {sector.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="otro">✏️ Otro (personalizado)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {sectorId === "otro" && (
                      <div className="space-y-2">
                        <Label>Nombre del sector</Label>
                        <Input
                          value={sectorCustom}
                          onChange={(e) => setSectorCustom(e.target.value)}
                          placeholder="Ej: Tienda de mascotas"
                          className="bg-slate-800/50 border-slate-600"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label>Ciudad / Zona (opcional)</Label>
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ej: Madrid, Zona Norte"
                        className="bg-slate-800/50 border-slate-600"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Goal Description - NUEVO */}
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-b border-slate-700/50">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <HelpCircle className="w-5 h-5 text-yellow-400" />
                      ¿Qué buscas exactamente?
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Describe con detalle qué quieres conseguir con este lanzamiento. La IA usará esto para crear un guión más personalizado.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Textarea
                      value={goalDescription}
                      onChange={(e) => setGoalDescription(e.target.value)}
                      placeholder="Ej: Quiero llenar mi agenda de esta semana porque tengo 3 huecos libres. Mi tratamiento estrella es el botox y quiero atraer a mujeres de 35-50 años que quieren verse más jóvenes para un evento próximo..."
                      className="bg-slate-800/50 border-slate-600 min-h-[100px]"
                    />
                    <p className="text-xs text-yellow-400/70 mt-2 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      Cuanto más detalle des, mejor será el guión generado
                    </p>
                  </CardContent>
                </Card>
                
                {/* Objective */}
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-slate-700/50">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Zap className="w-5 h-5 text-green-400" />
                      Objetivo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {filteredObjectives.map((obj) => (
                        <button
                          key={obj.value}
                          onClick={() => setObjective(obj.value)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            objective === obj.value
                              ? "border-green-500 bg-green-500/20"
                              : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                          }`}
                        >
                          <div className="text-2xl mb-1">{obj.icon}</div>
                          <div className="font-medium text-sm">{obj.label}</div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Urgency */}
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-b border-slate-700/50">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="w-5 h-5 text-red-400" />
                      Urgencia (obligatorio)
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      La urgencia real es clave para convertir
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {urgencyTypes.map((u) => (
                        <button
                          key={u.value}
                          onClick={() => setUrgencyType(u.value)}
                          className={`p-3 rounded-lg border transition-all text-center ${
                            urgencyType === u.value
                              ? "border-red-500 bg-red-500/20"
                              : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                          }`}
                        >
                          <div className="text-xs font-medium">{u.label}</div>
                        </button>
                      ))}
                    </div>
                    <Input
                      value={urgencyValue}
                      onChange={(e) => setUrgencyValue(e.target.value)}
                      placeholder={urgencyTypes.find((u) => u.value === urgencyType)?.placeholder}
                      className="bg-slate-800/50 border-slate-600"
                    />
                  </CardContent>
                </Card>
              </div>
              
              {/* Right Column */}
              <div className="space-y-6">
                {/* CTA & Offer */}
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-slate-700/50">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageCircle className="w-5 h-5 text-purple-400" />
                      CTA y Oferta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Palabra clave para responder</Label>
                      <Input
                        value={ctaKeyword}
                        onChange={(e) => setCtaKeyword(e.target.value)}
                        placeholder="INFO"
                        className="bg-slate-800/50 border-slate-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Oferta / Gancho (opcional)</Label>
                      <Textarea
                        value={offer}
                        onChange={(e) => setOffer(e.target.value)}
                        placeholder="Ej: Diagnóstico gratuito, 20% descuento, Primera sesión gratis..."
                        className="bg-slate-800/50 border-slate-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Precio / Ticket (opcional)</Label>
                      <Input
                        value={ticket}
                        onChange={(e) => setTicket(e.target.value)}
                        placeholder="Ej: 50€, 200€, 1000€..."
                        className="bg-slate-800/50 border-slate-600"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Differentiators */}
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-slate-700/50">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                      Tu Diferenciación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Tu diferenciador</Label>
                      <Input
                        value={differentiator}
                        onChange={(e) => setDifferentiator(e.target.value)}
                        placeholder="Ej: 15 años de experiencia, único en la zona..."
                        className="bg-slate-800/50 border-slate-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prueba social</Label>
                      <Input
                        value={socialProof}
                        onChange={(e) => setSocialProof(e.target.value)}
                        placeholder="Ej: +500 clientes, 4.9 estrellas en Google..."
                        className="bg-slate-800/50 border-slate-600"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Style */}
                <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-b border-slate-700/50">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="w-5 h-5 text-pink-400" />
                      Estilo del Guión
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-3">
                      {variants.map((v) => (
                        <button
                          key={v.value}
                          onClick={() => setVariant(v.value as any)}
                          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                            variant === v.value
                              ? "border-pink-500 bg-pink-500/20"
                              : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                          }`}
                        >
                          <div className="font-medium">{v.label}</div>
                          <div className="text-xs text-slate-400">{v.description}</div>
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                      <div>
                        <div className="font-medium">Modo Fácil</div>
                        <div className="text-xs text-slate-400">Lenguaje súper simple, sin tecnicismos</div>
                      </div>
                      <Switch checked={easyMode} onCheckedChange={setEasyMode} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Sector Suggestions */}
            {selectedSector && (
              <Card className="bg-slate-900/30 border-slate-700/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="w-6 h-6 text-yellow-400" />
                    <span className="font-medium">Sugerencias para {selectedSector.name}</span>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-slate-400 mb-2">Problemas comunes:</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedSector.problems.slice(0, 3).map((p, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-2">Servicios:</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedSector.services.slice(0, 3).map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-2">Pruebas sociales:</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedSector.socialProofs.slice(0, 2).map((sp, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{sp}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Generate Button */}
            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={!sectorId || !objective || !urgencyValue || generateMutation.isPending}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-12 py-6 text-lg font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
              >
                {generateMutation.isPending ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Generando guión...
                  </>
                ) : (
                  <>
                    <Flame className="w-5 h-5 mr-2" />
                    Generar Guión de Stories
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          {/* Result Tab - NUEVO DISEÑO CON PREVIEW */}
          <TabsContent value="result" className="space-y-6">
            {result && (
              <>
                {/* Toggle de vista */}
                <div className="flex justify-center gap-2 mb-6">
                  <Button
                    variant={viewMode === "preview" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("preview")}
                    className={viewMode === "preview" ? "bg-gradient-to-r from-pink-500 to-purple-500" : "border-slate-600"}
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Vista Móvil
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-gradient-to-r from-pink-500 to-purple-500" : "border-slate-600"}
                  >
                    <List className="w-4 h-4 mr-2" />
                    Vista Lista
                  </Button>
                </div>

                {/* Goal Summary */}
                {result.goalSummary && (
                  <Card className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500/30 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <Target className="w-6 h-6 text-yellow-400 mt-1" />
                        <div>
                          <div className="font-medium text-yellow-300 mb-1">Objetivo de este lanzamiento</div>
                          <div className="text-white">{result.goalSummary}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Vista Preview (Mockup de móvil) */}
                {viewMode === "preview" && (
                  <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-8">
                      <StoryPreview 
                        stories={result.stories} 
                        sectorName={selectedSector?.name || sectorCustom}
                        onCopy={(text) => {
                          setCopiedIndex(-1);
                          setTimeout(() => setCopiedIndex(null), 2000);
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Vista Lista (Original mejorada) */}
                {viewMode === "list" && (
                  <div className="space-y-4">
                    {result.stories.map((story, index) => (
                      <Card key={index} className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm overflow-hidden hover:border-slate-600 transition-all">
                        <CardContent className="p-0">
                          <div className="flex">
                            {/* Story Number & Type */}
                            <div className={`w-24 flex-shrink-0 flex flex-col items-center justify-center p-4 ${
                              story.type === "FOTO" 
                                ? "bg-gradient-to-b from-blue-500/20 to-blue-600/20" 
                                : "bg-gradient-to-b from-red-500/20 to-red-600/20"
                            }`}>
                              <div className="text-4xl font-bold mb-2">{story.number}</div>
                              <Badge className={`${story.type === "FOTO" ? "bg-blue-500" : "bg-red-500"} px-3 py-1`}>
                                {story.type === "FOTO" ? <Camera className="w-3 h-3 mr-1" /> : <Video className="w-3 h-3 mr-1" />}
                                {story.type}
                              </Badge>
                              <div className="text-xs text-slate-400 mt-2 text-center">{story.phase}</div>
                            </div>
                            
                            {/* Story Content */}
                            <div className="flex-1 p-6 space-y-4">
                              {/* Instruction */}
                              <div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Qué hacer</div>
                                <div className="text-white font-medium">{story.instruction}</div>
                              </div>
                              
                              {/* Duration (for videos) */}
                              {story.type === "VIDEO" && story.duration && (
                                <div>
                                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Duración</div>
                                  <Badge variant="outline">{story.duration}</Badge>
                                </div>
                              )}
                              
                              {/* Voice Note for FOTO stories */}
                              {story.type === "FOTO" && (
                                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                  <div className="text-xs text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Camera className="w-3 h-3" /> Nota sobre el audio
                                  </div>
                                  <div className="text-slate-300 text-sm">
                                    {story.voiceNote || "Esta story es una foto estática. No necesitas grabar voz. El impacto viene del texto en pantalla y la imagen."}
                                  </div>
                                </div>
                              )}
                              
                              {/* Spoken Text (for videos) */}
                              {story.type === "VIDEO" && story.spokenText && (
                                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                                  <div className="text-xs text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Video className="w-3 h-3" /> Texto a decir (mirando a cámara)
                                  </div>
                                  <div className="text-white italic">"{story.spokenText}"</div>
                                </div>
                              )}
                              
                              {/* Screen Text */}
                              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                                <div className="text-xs text-purple-400 uppercase tracking-wider mb-1">Texto en pantalla</div>
                                <div className="text-white font-semibold text-lg">{story.screenText}</div>
                              </div>
                              
                              {/* Sticker & Background */}
                              <div className="flex gap-4 text-sm">
                                {story.sticker && (
                                  <div>
                                    <span className="text-slate-400">Sticker: </span>
                                    <Badge variant="outline">{story.sticker}</Badge>
                                  </div>
                                )}
                                {story.background && (
                                  <div>
                                    <span className="text-slate-400">Fondo: </span>
                                    <span className="text-white">{story.background}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Copy Button */}
                            <div className="p-4 flex items-start">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(
                                  `Story ${story.number} (${story.type}):\n${story.instruction}\n\nTexto en pantalla: ${story.screenText}${story.spokenText ? `\n\nTexto a decir: "${story.spokenText}"` : ""}`,
                                  index
                                )}
                                className="text-slate-400 hover:text-white"
                              >
                                {copiedIndex === index ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {/* DM Messages */}
                <Card className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-500/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5 text-green-400" />
                      Mensajes de DM (cuando respondan "{ctaKeyword}")
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">DM 1 - Filtro</div>
                      <div className="text-white">{result.dmMessages.dm1}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.dmMessages.dm1, 100)}
                        className="mt-2"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">DM 2 - Cierre</div>
                      <div className="text-white">{result.dmMessages.dm2}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.dmMessages.dm2, 101)}
                        className="mt-2"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Suggested Offers */}
                {result.suggestedOffers && result.suggestedOffers.length > 0 && (
                  <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-400" />
                        Ofertas Sugeridas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {result.suggestedOffers.map((offer, i) => (
                          <Badge key={i} variant="outline" className="px-4 py-2 text-sm">
                            {offer}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Actions */}
                <div className="flex justify-center gap-4 pt-4 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("form")}
                    className="border-slate-600"
                  >
                    <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                    Modificar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => exportToPDF(result)}
                    className="border-green-600 text-green-400 hover:bg-green-500/20"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                    className="bg-gradient-to-r from-orange-500 to-red-500"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${generateMutation.isPending ? "animate-spin" : ""}`} />
                    Regenerar
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
          
          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {historyQuery.isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                <p className="text-slate-400 mt-4">Cargando historial...</p>
              </div>
            ) : historyQuery.data && historyQuery.data.length > 0 ? (
              <div className="space-y-4">
                {historyQuery.data.map((item: any) => (
                  <Card key={item.id} className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-slate-600 transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{item.sectorCustom || item.sectorId}</div>
                          <div className="text-sm text-slate-400">
                            {item.objective} • {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="outline">{item.variant}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No tienes guiones generados aún</p>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("form")}
                  className="mt-4"
                >
                  Crear mi primer guión
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  );
}
