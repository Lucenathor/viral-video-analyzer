import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useCallback } from "react";
import { 
  Headphones, 
  Send, 
  Video,
  FileVideo,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  Zap,
  Users,
  Mail,
  X
} from "lucide-react";
import { toast } from "sonner";

const categories = [
  { value: "video_review", label: "Análisis de Vídeo por Experto", description: "Un experto analizará tu vídeo y te enviará un Loom" },
  { value: "analysis_help", label: "Ayuda con Análisis", description: "Dudas sobre los resultados del análisis" },
  { value: "technical", label: "Soporte Técnico", description: "Problemas técnicos con la plataforma" },
  { value: "general", label: "Consulta General", description: "Otras preguntas o sugerencias" },
];

export default function Support() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<string>("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const submitTicket = trpc.support.submit.useMutation();
  // Tickets are not stored in DB, just sent to owner
  const userTickets: { id: number; subject: string; message: string; status: string; createdAt: Date; loomVideoUrl?: string; expertResponse?: string }[] = [];
  const ticketsLoading = false;
  const refetchTickets = () => {};

  const handleVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande. Máximo 100MB.");
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  }, []);

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim() || !category) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setIsSubmitting(true);

    try {
      let videoData: string | undefined;
      
      if (videoFile) {
        const reader = new FileReader();
        videoData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(videoFile);
        });
      }

      await submitTicket.mutateAsync({
        subject,
        message: videoFile ? `${message}\n\n[Video adjunto: ${videoFile.name}]` : message,
        category: (category === "analysis_help" || category === "video_review") ? "question" : 
                  (category === "technical" ? "bug" : "other") as "bug" | "feature" | "question" | "other",
      });

      toast.success("¡Ticket enviado! Te responderemos lo antes posible.");
      
      // Reset form
      setSubject("");
      setMessage("");
      setCategory("");
      removeVideo();
      refetchTickets();
    } catch (error) {
      toast.error("Error al enviar el ticket. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      open: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Abierto" },
      in_progress: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "En Progreso" },
      waiting_response: { bg: "bg-purple-500/20", text: "text-purple-400", label: "Esperando Respuesta" },
      resolved: { bg: "bg-green-500/20", text: "text-green-400", label: "Resuelto" },
      closed: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Cerrado" },
    };
    const style = styles[status] || styles.open;
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
                <Headphones className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Soporte <span className="text-gradient">24 Horas</span>
              </h1>
              <p className="text-muted-foreground mb-8">
                Inicia sesión para acceder al soporte personalizado y recibir análisis 
                de expertos para tus vídeos.
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
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Headphones className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Soporte 24h</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Soporte <span className="text-gradient">Experto</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Envía tu vídeo y recibe un análisis personalizado de nuestros expertos 
              con un Loom explicativo.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Análisis de Vídeo</h3>
                <p className="text-sm text-muted-foreground">
                  Sube tu vídeo y un experto lo analizará en detalle
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Expertos Reales</h3>
                <p className="text-sm text-muted-foreground">
                  Profesionales con experiencia en contenido viral
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Loom Personalizado</h3>
                <p className="text-sm text-muted-foreground">
                  Recibe un vídeo explicativo con las recomendaciones
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Ticket Form */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Nuevo Ticket de Soporte
                </CardTitle>
                <CardDescription>
                  Describe tu consulta y adjunta tu vídeo si necesitas análisis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="bg-secondary/30">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div>
                              <div className="font-medium">{cat.label}</div>
                              <div className="text-xs text-muted-foreground">{cat.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Asunto *</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ej: Necesito ayuda con mi reel de restaurante"
                      className="bg-secondary/30"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Mensaje *</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe tu consulta en detalle..."
                      rows={4}
                      className="bg-secondary/30 resize-none"
                    />
                  </div>

                  {/* Video Upload */}
                  <div className="space-y-2">
                    <Label>Adjuntar Vídeo (opcional)</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoSelect}
                      className="hidden"
                    />
                    
                    {videoPreview ? (
                      <div className="relative">
                        <div className="aspect-video rounded-lg overflow-hidden bg-black">
                          <video
                            src={videoPreview}
                            controls
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={removeVideo}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <FileVideo className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Haz clic para subir un vídeo (máx. 100MB)
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full gradient-primary glow-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Ticket
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Tickets History */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  Mis Tickets
                </CardTitle>
                <CardDescription>
                  Historial de tus consultas de soporte
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ticketsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : userTickets && userTickets.length > 0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {userTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium text-sm line-clamp-1">
                            {ticket.subject}
                          </h4>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {ticket.message}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {new Date(ticket.createdAt).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </span>
                          {ticket.loomVideoUrl && (
                            <a
                              href={ticket.loomVideoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <Video className="w-3 h-3" />
                              Ver Loom
                            </a>
                          )}
                        </div>
                        {ticket.expertResponse && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-1 text-xs text-green-400 mb-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Respuesta del experto
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-3">
                              {ticket.expertResponse}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      No tienes tickets de soporte aún
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
