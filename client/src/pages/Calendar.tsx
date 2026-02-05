import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Play,
  Heart,
  Eye,
  MessageCircle,
  Share2,
  Sparkles,
  Target,
  Clock,
  CheckCircle2,
  X,
  ExternalLink,
  Lock,
  Crown
} from "lucide-react";
import { Link } from "wouter";
import { businessSectors } from "@/data/businessSectorVideos";

// Obtener el mes actual y año
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAYS_OF_WEEK = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Función para formatear números
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

// Función para obtener los días del mes
const getDaysInMonth = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  // Ajustar para que la semana empiece en lunes (0 = lunes, 6 = domingo)
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  
  const days: (number | null)[] = [];
  
  // Días vacíos al inicio
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  
  // Días del mes
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  return days;
};

// Función para distribuir vídeos en el calendario (2 por semana, martes y jueves, solo desde hoy)
const distributeVideosInCalendar = (videos: typeof businessSectors[0]["videos"], year: number, month: number) => {
  const schedule: { [day: number]: typeof videos[0] } = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  
  // Encontrar todos los martes y jueves del mes (solo desde hoy en adelante)
  const publishDays: number[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    
    // Solo incluir días desde hoy en adelante
    const isCurrentMonth = year === todayYear && month === todayMonth;
    const isFutureMonth = year > todayYear || (year === todayYear && month > todayMonth);
    const isFutureOrToday = isFutureMonth || (isCurrentMonth && day >= todayDay);
    
    // Martes (2) y Jueves (4), solo si es hoy o futuro
    if ((dayOfWeek === 2 || dayOfWeek === 4) && isFutureOrToday) {
      publishDays.push(day);
    }
  }
  
  // Asignar vídeos a los días de publicación
  videos.forEach((video, index) => {
    if (index < publishDays.length) {
      schedule[publishDays[index]] = video;
    }
  });
  
  return schedule;
};

export default function Calendar() {
  const today = new Date();
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Fetch subscription config
  const { data: subscriptionConfig } = trpc.calendar.getSubscriptionConfig.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Check if a month is allowed based on subscription
  const isMonthAllowed = useMemo(() => {
    if (!subscriptionConfig) return true; // Allow while loading
    
    const { allowedMonths } = subscriptionConfig;
    return allowedMonths.some(
      (m: { month: number; year: number }) => m.month === currentMonth && m.year === currentYear
    );
  }, [subscriptionConfig, currentMonth, currentYear]);

  // Fetch progress from database
  const { data: progressData, refetch: refetchProgress } = trpc.calendar.getProgress.useQuery(
    { sectorId: selectedSector || '' },
    { enabled: !!selectedSector && !!user }
  );

  // Toggle complete mutation
  const toggleCompleteMutation = trpc.calendar.toggleComplete.useMutation({
    onSuccess: () => {
      refetchProgress();
    }
  });

  // Update local state when progress data changes
  useEffect(() => {
    if (progressData) {
      const completed = new Set(progressData.filter(p => p.isCompleted).map(p => p.videoId));
      setCompletedVideos(completed);
    }
  }, [progressData]);

  // Function to toggle video completion
  const toggleVideoComplete = (videoId: string) => {
    if (!selectedSector || !user) return;
    const isCurrentlyCompleted = completedVideos.has(videoId);
    
    // Optimistic update
    setCompletedVideos(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyCompleted) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
    
    // Persist to database
    toggleCompleteMutation.mutate({
      sectorId: selectedSector,
      videoId,
      completed: !isCurrentlyCompleted
    });
  };

  // Obtener el sector seleccionado
  const sector = useMemo(() => {
    return businessSectors.find(s => s.id === selectedSector);
  }, [selectedSector]);

  // Obtener el calendario de vídeos para el sector seleccionado
  const videoSchedule = useMemo(() => {
    if (!sector) return {};
    return distributeVideosInCalendar(sector.videos, currentYear, currentMonth);
  }, [sector, currentYear, currentMonth]);

  // Obtener los días del mes actual
  const days = useMemo(() => {
    return getDaysInMonth(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Navegación del calendario con restricción de suscripción
  const canNavigateToPreviousMonth = useMemo(() => {
    if (!subscriptionConfig) return true;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    return subscriptionConfig.allowedMonths.some(
      (m: { month: number; year: number }) => m.month === prevMonth && m.year === prevYear
    );
  }, [subscriptionConfig, currentMonth, currentYear]);

  const canNavigateToNextMonth = useMemo(() => {
    if (!subscriptionConfig) return true;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    return subscriptionConfig.allowedMonths.some(
      (m: { month: number; year: number }) => m.month === nextMonth && m.year === nextYear
    );
  }, [subscriptionConfig, currentMonth, currentYear]);

  const goToPreviousMonth = () => {
    if (!canNavigateToPreviousMonth) {
      setShowUpgradeModal(true);
      return;
    }
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (!canNavigateToNextMonth) {
      setShowUpgradeModal(true);
      return;
    }
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Obtener el vídeo del día seleccionado
  const selectedVideo = selectedDay ? videoSchedule[selectedDay] : null;

  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
        
        <div className="container relative">
          {/* Badge */}
          <div className="flex justify-center mb-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Calendario de Contenido</span>
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Planifica tus{" "}
            <span className="text-gradient">Reels Virales</span>
          </h1>

          <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Selecciona tu sector y obtén un calendario personalizado con los mejores vídeos virales para replicar cada semana.
          </p>

          {/* Explicación de la sección */}
          <div className="glass rounded-2xl p-6 max-w-3xl mx-auto mb-12 text-left animate-fade-in" style={{ animationDelay: "0.25s" }}>
            <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" />
              ¿Para qué sirve esta sección?
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              El <strong className="text-foreground">Calendario de Contenido</strong> te organiza automáticamente los reels que deberías publicar cada semana. 
              Te asigna <strong className="text-foreground">2 vídeos por semana</strong> (martes y jueves) basados en los virales de tu sector.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-400 text-xs">1</span>
                </div>
                <span className="text-muted-foreground"><strong className="text-foreground">Elige tu sector</strong> y verás el calendario con los días de publicación</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-400 text-xs">2</span>
                </div>
                <span className="text-muted-foreground"><strong className="text-foreground">Haz clic en un día</strong> para ver qué vídeo viral debes replicar</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-xs">3</span>
                </div>
                <span className="text-muted-foreground"><strong className="text-foreground">Márcalo como completado</strong> cuando hayas grabado tu versión</span>
              </div>
            </div>
          </div>

          {/* Sector Selector */}
          <div className="max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h3 className="text-lg font-semibold text-center mb-4">Selecciona tu sector</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {businessSectors.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSector(s.id)}
                  className={`
                    relative p-4 rounded-xl border transition-all duration-300 group overflow-hidden
                    ${selectedSector === s.id 
                      ? "border-primary bg-primary/20 shadow-lg shadow-primary/20" 
                      : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
                    }
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Glow effect */}
                  {selectedSector === s.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 animate-shimmer" />
                  )}
                  
                  <div className="relative">
                    <div className="w-16 h-16 rounded-xl overflow-hidden mx-auto mb-3 ring-2 ring-border/30 group-hover:ring-primary/50 transition-all">
                      <img 
                        src={s.image} 
                        alt={s.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <p className="text-sm font-medium text-center truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground text-center">{s.videos.length} vídeos</p>
                  </div>
                  
                  {selectedSector === s.id && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Calendar Section */}
      {selectedSector && sector && (
        <section className="py-12 animate-fade-in">
          <div className="container">
            <Card className="glass border-primary/20 p-6 md:p-8">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6 text-primary" />
                    {MONTHS[currentMonth]} {currentYear}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Calendario de contenido para <span className="text-primary font-medium">{sector.name}</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={goToPreviousMonth}
                    className="hover:bg-primary/10 hover:border-primary/50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={goToNextMonth}
                    className="hover:bg-primary/10 hover:border-primary/50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  const hasVideo = day && videoSchedule[day];
                  const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                  const isPast = day && new Date(currentYear, currentMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  
                  return (
                    <div
                      key={index}
                      onClick={() => {
                        if (hasVideo) {
                          setSelectedDay(day);
                          setShowVideoModal(true);
                        }
                      }}
                      className={`
                        relative aspect-square rounded-xl border transition-all duration-300
                        ${!day ? "bg-transparent border-transparent" : ""}
                        ${day && !hasVideo ? "border-border/30 bg-background/50" : ""}
                        ${hasVideo ? "border-primary/50 bg-primary/10 cursor-pointer hover:bg-primary/20 hover:border-primary hover:scale-105 hover:shadow-lg hover:shadow-primary/20" : ""}
                        ${isToday ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}
                        ${isPast && !hasVideo ? "opacity-50" : ""}
                      `}
                    >
                      {day && (
                        <>
                          {/* Day number */}
                          <span className={`
                            absolute top-2 left-2 text-sm font-medium
                            ${isToday ? "text-accent" : hasVideo ? "text-primary" : "text-muted-foreground"}
                          `}>
                            {day}
                          </span>
                          
                          {/* Video indicator */}
                          {hasVideo && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="relative">
                                {/* Thumbnail */}
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 border-primary/50 shadow-lg">
                                  {videoSchedule[day]?.cover ? (
                                    <img 
                                      src={videoSchedule[day]?.cover} 
                                      alt="Video thumbnail"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.parentElement!.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center"><svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                                      <Play className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Play button overlay */}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                                  <Play className="w-6 h-6 text-white fill-white" />
                                </div>
                                
                                {/* Completed indicator - based on user progress */}
                                {videoSchedule[day] && completedVideos.has(videoSchedule[day]!.id) && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* "Publicar" label for video days */}
                          {hasVideo && (
                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                              Publicar
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary/20 border border-primary/50" />
                  <span className="text-sm text-muted-foreground">Día de publicación</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded ring-2 ring-accent ring-offset-2 ring-offset-background" />
                  <span className="text-sm text-muted-foreground">Hoy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-sm text-muted-foreground">Completado</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="text-center p-4 rounded-xl glass border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-primary">{Object.keys(videoSchedule).length}</p>
                  <p className="text-xs text-muted-foreground">Reels este mes</p>
                </div>
                <div className="text-center p-4 rounded-xl glass border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                  <p className="text-2xl font-bold text-accent">2</p>
                  <p className="text-xs text-muted-foreground">Por semana</p>
                </div>
                <div className="text-center p-4 rounded-xl glass border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-2">
                    <Heart className="w-5 h-5 text-pink-500" />
                  </div>
                  <p className="text-2xl font-bold text-pink-500">{formatNumber(sector.videos.reduce((sum, v) => sum + v.likes, 0))}</p>
                  <p className="text-xs text-muted-foreground">Likes referencia</p>
                </div>
                <div className="text-center p-4 rounded-xl glass border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                    <Eye className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-500">{formatNumber(sector.videos.reduce((sum, v) => sum + v.views, 0))}</p>
                  <p className="text-xs text-muted-foreground">Views referencia</p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowVideoModal(false)}
        >
          <div 
            className="relative w-full max-w-2xl glass border border-primary/30 rounded-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">
                  {selectedDay} de {MONTHS[currentMonth]} - Día de publicación
                </span>
              </div>
              <h3 className="text-xl font-bold">Reel a replicar</h3>
            </div>

            {/* Video Content */}
            <div className="p-6">
              <div className="flex gap-6">
                {/* Thumbnail */}
                <div className="relative w-32 h-48 rounded-xl overflow-hidden flex-shrink-0 border border-primary/30">
                  {selectedVideo.cover ? (
                    <img 
                      src={selectedVideo.cover} 
                      alt={selectedVideo.description}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>
                  {selectedVideo.duration && (
                    <span className="absolute bottom-2 left-2 text-xs bg-black/70 px-2 py-0.5 rounded">
                      {selectedVideo.duration}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h4 className="font-semibold mb-2 line-clamp-2">{selectedVideo.description}</h4>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent" />
                    <span className="text-sm text-muted-foreground">
                      @{selectedVideo.username} • {selectedVideo.authorName}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Heart className="w-4 h-4 text-pink-500" />
                      <span>{formatNumber(selectedVideo.likes)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      <span>{formatNumber(selectedVideo.comments)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Share2 className="w-4 h-4 text-green-500" />
                      <span>{formatNumber(selectedVideo.shares)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="w-4 h-4 text-purple-500" />
                      <span>{formatNumber(selectedVideo.views)}</span>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Tips para replicar
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Analiza el hook de los primeros 3 segundos</li>
                      <li>• Adapta el contenido a tu marca personal</li>
                      <li>• Usa trending sounds similares</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <a 
                  href={selectedVideo.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full gradient-primary text-white gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Ver en TikTok
                  </Button>
                </a>
                <Button 
                  variant={completedVideos.has(selectedVideo.id) ? "default" : "outline"}
                  className={`flex-1 gap-2 ${completedVideos.has(selectedVideo.id) ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  onClick={() => {
                    toggleVideoComplete(selectedVideo.id);
                  }}
                  disabled={toggleCompleteMutation.isPending}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {completedVideos.has(selectedVideo.id) ? '¡Completado!' : 'Marcar como hecho'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      {!selectedSector && (
        <section className="py-16">
          <div className="container">
            <Card className="glass border-primary/20 p-8 text-center">
              <CalendarIcon className="w-16 h-16 text-primary/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Selecciona tu sector</h3>
              <p className="text-muted-foreground mb-6">
                Elige tu sector de negocio arriba para ver tu calendario de contenido personalizado
              </p>
            </Card>
          </div>
        </section>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowUpgradeModal(false)}
        >
          <div 
            className="relative w-full max-w-md glass border border-primary/30 rounded-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-8 text-center">
              {/* Icon */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6">
                <Crown className="w-10 h-10 text-white" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold mb-3">Desbloquea el Calendario Completo</h3>
              
              {/* Description */}
              <p className="text-muted-foreground mb-6">
                Tu plan actual solo te permite ver el mes actual. 
                <strong className="text-foreground"> Actualiza a un plan anual</strong> para acceder a los 12 meses del año y planificar tu contenido con antelación.
              </p>

              {/* Current plan info */}
              {subscriptionConfig && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Tu plan actual: <span className="text-primary capitalize">{subscriptionConfig.plan}</span></span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {subscriptionConfig.isAnnual 
                      ? `Tienes acceso a ${subscriptionConfig.visibleMonths} meses`
                      : 'Plan mensual - Solo mes actual visible'
                    }
                  </p>
                </div>
              )}

              {/* Benefits */}
              <div className="text-left mb-6 space-y-2">
                <p className="text-sm font-medium text-primary mb-2">Con el plan anual obtienes:</p>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Acceso a los 12 meses del calendario</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>2 meses gratis (paga 10, usa 12)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Planifica tu contenido con antelación</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Más reels por día según tu plan</span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowUpgradeModal(false)}
                >
                  Ahora no
                </Button>
                <Link href="/pricing" className="flex-1">
                  <Button className="w-full gradient-primary text-white gap-2">
                    <Crown className="w-4 h-4" />
                    Ver Planes
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
