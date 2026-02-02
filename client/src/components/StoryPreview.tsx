import { useState, useEffect } from "react";
import { Camera, Video, Play, Pause, ChevronLeft, ChevronRight, Copy, CheckCircle2, Smartphone, Heart, Send, Bookmark, MoreHorizontal, X, MessageCircle, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

interface StoryPreviewProps {
  stories: Story[];
  sectorName?: string;
  onCopy?: (text: string) => void;
}

// Gradientes de fondo para cada story - más vibrantes y tipo Instagram
const storyGradients = [
  "from-[#833AB4] via-[#FD1D1D] to-[#FCB045]", // Instagram clásico
  "from-[#405DE6] via-[#5851DB] to-[#833AB4]", // Púrpura Instagram
  "from-[#F77737] via-[#FD1D1D] to-[#E1306C]", // Naranja a rosa
  "from-[#C13584] via-[#833AB4] to-[#5851DB]", // Rosa a púrpura
  "from-[#FCAF45] via-[#F77737] to-[#FD1D1D]", // Amarillo a rojo
];

// Fondos para las stories
const storyBackgrounds = [
  "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCB045]",
  "bg-gradient-to-br from-[#405DE6] via-[#5851DB] to-[#833AB4]",
  "bg-gradient-to-br from-[#F77737] via-[#FD1D1D] to-[#E1306C]",
  "bg-gradient-to-br from-[#C13584] via-[#833AB4] to-[#5851DB]",
  "bg-gradient-to-br from-[#FCAF45] via-[#F77737] to-[#FD1D1D]",
];

// Ejemplos de contenido visual para cada tipo de story
const visualExamples = {
  FOTO: [
    "📸 Imagen de alta calidad",
    "🖼️ Fondo limpio y profesional",
    "✨ Texto grande y legible",
  ],
  VIDEO: [
    "🎬 Grábate a cámara",
    "⏱️ Duración corta y directa",
    "🎤 Habla con energía",
  ],
};

export default function StoryPreview({ stories, sectorName, onCopy }: StoryPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  // Auto-avance cuando está reproduciendo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (currentIndex < stories.length - 1) {
              setCurrentIndex((i) => i + 1);
              return 0;
            } else {
              setIsPlaying(false);
              return 100;
            }
          }
          return prev + 2;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, stories.length]);

  // Reset progress cuando cambia la story
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  const currentStory = stories[currentIndex];
  
  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const copyStoryContent = (story: Story, index: number) => {
    const text = `Story ${story.number} (${story.type}):\n${story.instruction}\n\nTexto en pantalla: ${story.screenText}${story.spokenText ? `\n\nTexto a decir: "${story.spokenText}"` : ""}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    onCopy?.(text);
  };

  if (!stories || stories.length === 0) return null;

  return (
    <div className="w-full">
      {/* Header con indicador de dispositivo */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full border border-pink-500/30">
          <Smartphone className="w-5 h-5 text-pink-400" />
          <span className="text-sm text-slate-300 font-medium">Vista previa de Stories</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
        {/* Mockup del teléfono - Estilo iPhone más realista */}
        <div className="relative mx-auto lg:mx-0">
          {/* Marco del teléfono - iPhone style */}
          <div className="relative w-[300px] h-[620px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-[50px] p-3 shadow-2xl shadow-purple-500/30 border border-slate-700">
            {/* Dynamic Island */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-30 flex items-center justify-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-800" />
              <div className="w-2 h-2 rounded-full bg-slate-700" />
            </div>
            
            {/* Botones laterales */}
            <div className="absolute -left-1 top-32 w-1 h-8 bg-slate-700 rounded-l-full" />
            <div className="absolute -left-1 top-44 w-1 h-12 bg-slate-700 rounded-l-full" />
            <div className="absolute -left-1 top-60 w-1 h-12 bg-slate-700 rounded-l-full" />
            <div className="absolute -right-1 top-40 w-1 h-16 bg-slate-700 rounded-r-full" />
            
            {/* Pantalla */}
            <div className={`relative w-full h-full rounded-[42px] overflow-hidden ${storyBackgrounds[currentIndex % storyBackgrounds.length]}`}>
              {/* Overlay de gradiente para mejor legibilidad */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-[1]" />
              
              {/* Barras de progreso - Estilo Instagram */}
              <div className="absolute top-12 left-4 right-4 flex gap-1.5 z-20">
                {stories.map((_, idx) => (
                  <div key={idx} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                      style={{
                        width: idx < currentIndex ? "100%" : idx === currentIndex ? `${progress}%` : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Header de la story - Estilo Instagram */}
              <div className="absolute top-16 left-4 right-4 flex items-center gap-3 z-20">
                {/* Avatar con borde de gradiente */}
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr ${storyGradients[currentIndex % storyGradients.length]}`}>
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {sectorName?.charAt(0) || "V"}
                      </span>
                    </div>
                  </div>
                  {/* Indicador de verificado */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="text-white text-sm font-semibold truncate flex items-center gap-1">
                    {sectorName || "Tu Negocio"}
                  </div>
                  <div className="text-white/60 text-xs">hace 2h</div>
                </div>
                
                {/* Botones de acción */}
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Badge de tipo de story */}
              <div className="absolute top-28 right-4 z-20">
                <Badge 
                  className={`text-xs font-bold px-3 py-1 ${
                    currentStory.type === "FOTO" 
                      ? "bg-blue-500 text-white" 
                      : "bg-red-500 text-white"
                  }`}
                >
                  {currentStory.type === "FOTO" ? (
                    <Camera className="w-3.5 h-3.5 mr-1.5" />
                  ) : (
                    <Video className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {currentStory.type}
                </Badge>
              </div>

              {/* Contenido de la story */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pt-36 pb-32 z-10">
                {/* Número de story con animación */}
                <div className="absolute top-36 left-4 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <span className="text-white font-bold text-xl">{currentStory.number}</span>
                </div>

                {/* Fase de la story */}
                <div className="mb-6">
                  <Badge variant="outline" className="bg-black/30 backdrop-blur-sm border-white/30 text-white text-sm px-4 py-1.5">
                    {currentStory.phase}
                  </Badge>
                </div>

                {/* Icono central con animación de pulso */}
                <div className={`relative w-24 h-24 rounded-full flex items-center justify-center mb-8 ${
                  currentStory.type === "FOTO" 
                    ? "bg-blue-500/40" 
                    : "bg-red-500/40"
                }`}>
                  <div className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
                    currentStory.type === "FOTO" ? "bg-blue-500" : "bg-red-500"
                  }`} />
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${
                    currentStory.type === "FOTO" 
                      ? "border-blue-400/60 bg-blue-500/30" 
                      : "border-red-400/60 bg-red-500/30"
                  }`}>
                    {currentStory.type === "FOTO" ? (
                      <Camera className="w-10 h-10 text-white" />
                    ) : (
                      <Video className="w-10 h-10 text-white" />
                    )}
                  </div>
                </div>

                {/* Texto en pantalla - Estilo Instagram */}
                <div className="text-center px-4 max-w-full">
                  <p className="text-white font-bold text-xl leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    {currentStory.screenText}
                  </p>
                </div>

                {/* Sticker */}
                {currentStory.sticker && (
                  <div className="mt-6 px-4 py-2 bg-white/20 rounded-full backdrop-blur-md border border-white/20">
                    <span className="text-white text-sm font-medium">{currentStory.sticker}</span>
                  </div>
                )}
              </div>

              {/* Footer con instrucción - Estilo Instagram */}
              <div className="absolute bottom-16 left-4 right-4 z-20">
                <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                  <p className="text-white/90 text-sm leading-relaxed line-clamp-2">
                    {currentStory.instruction}
                  </p>
                </div>
              </div>

              {/* Barra de respuesta - Estilo Instagram */}
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2.5 border border-white/20">
                    <span className="text-white/50 text-sm">Enviar mensaje...</span>
                  </div>
                  <button 
                    onClick={() => setShowReactions(!showReactions)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Heart className="w-6 h-6 text-white" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <Send className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Áreas táctiles para navegación */}
              <button
                onClick={goToPrev}
                className="absolute left-0 top-0 w-1/3 h-full z-[5] cursor-pointer"
                disabled={currentIndex === 0}
              />
              <button
                onClick={goToNext}
                className="absolute right-0 top-0 w-1/3 h-full z-[5] cursor-pointer"
                disabled={currentIndex === stories.length - 1}
              />
            </div>
          </div>

          {/* Controles externos */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="border-slate-600 hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`border-slate-600 px-6 ${isPlaying ? "bg-gradient-to-r from-pink-500 to-purple-500 border-transparent text-white" : "hover:bg-slate-800"}`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Reproducir
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              disabled={currentIndex === stories.length - 1}
              className="border-slate-600 hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Indicador de story actual */}
          <div className="text-center mt-3">
            <span className="text-slate-400 text-sm">
              Story {currentIndex + 1} de {stories.length}
            </span>
          </div>
        </div>

        {/* Panel de detalles de la story actual */}
        <div className="flex-1 max-w-md space-y-4">
          {/* Título con badge de tipo */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              currentStory.type === "FOTO" 
                ? "bg-gradient-to-br from-blue-500 to-blue-600" 
                : "bg-gradient-to-br from-red-500 to-red-600"
            }`}>
              {currentStory.type === "FOTO" ? (
                <Camera className="w-7 h-7 text-white" />
              ) : (
                <Video className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">Story {currentStory.number}</h3>
              <p className="text-slate-400">{currentStory.phase}</p>
            </div>
          </div>

          {/* Instrucción */}
          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3 font-medium">Qué hacer</p>
            <p className="text-white leading-relaxed">{currentStory.instruction}</p>
          </div>

          {/* Duración (solo para vídeos) */}
          {currentStory.type === "VIDEO" && currentStory.duration && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30">
              <p className="text-xs text-red-400 uppercase tracking-wider mb-3 font-medium">Duración</p>
              <p className="text-white font-semibold text-lg">{currentStory.duration}</p>
            </div>
          )}

          {/* Texto a decir (solo para vídeos) */}
          {currentStory.type === "VIDEO" && currentStory.spokenText && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30">
              <p className="text-xs text-orange-400 uppercase tracking-wider mb-3 font-medium flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Texto a decir (mirando a cámara)
              </p>
              <p className="text-white italic text-lg leading-relaxed">"{currentStory.spokenText}"</p>
            </div>
          )}

          {/* Nota para fotos */}
          {currentStory.type === "FOTO" && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
              <p className="text-xs text-blue-400 uppercase tracking-wider mb-3 font-medium">ⓘ Nota sobre el audio</p>
              <p className="text-slate-300 leading-relaxed">
                {currentStory.voiceNote || "Esta story es una foto estática. No necesitas grabar voz. El impacto viene del texto en pantalla."}
              </p>
            </div>
          )}

          {/* Texto en pantalla */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
            <p className="text-xs text-purple-400 uppercase tracking-wider mb-3 font-medium">Texto en pantalla</p>
            <p className="text-white font-bold text-xl">{currentStory.screenText}</p>
          </div>

          {/* Sticker y Fondo */}
          <div className="flex gap-4">
            {currentStory.sticker && (
              <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <span className="text-slate-400 text-sm">Sticker:</span>
                <Badge variant="outline" className="border-slate-600 bg-slate-700/50">{currentStory.sticker}</Badge>
              </div>
            )}
            {currentStory.background && (
              <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <span className="text-slate-400 text-sm">Fondo:</span>
                <span className="text-white text-sm">{currentStory.background}</span>
              </div>
            )}
          </div>

          {/* Botón de copiar */}
          <Button
            variant="outline"
            onClick={() => copyStoryContent(currentStory, currentIndex)}
            className="w-full border-slate-600 hover:bg-slate-800 py-6"
          >
            {copiedIndex === currentIndex ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2 text-green-400" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 mr-2" />
                Copiar contenido de esta story
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Miniaturas de todas las stories - Estilo Instagram */}
      <div className="mt-10 flex justify-center gap-4 flex-wrap">
        {stories.map((story, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentIndex(idx);
              setProgress(0);
            }}
            className={`group relative w-20 h-32 rounded-xl overflow-hidden transition-all duration-300 ${
              idx === currentIndex 
                ? "ring-2 ring-pink-500 ring-offset-2 ring-offset-slate-900 scale-105 shadow-lg shadow-pink-500/30" 
                : "opacity-70 hover:opacity-100 hover:scale-102"
            } ${storyBackgrounds[idx % storyBackgrounds.length]}`}
          >
            {/* Overlay de gradiente */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
            
            {/* Número */}
            <div className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <span className="text-white text-xs font-bold">{story.number}</span>
            </div>
            
            {/* Icono central */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                story.type === "FOTO" ? "bg-blue-500/40" : "bg-red-500/40"
              }`}>
                {story.type === "FOTO" ? (
                  <Camera className="w-5 h-5 text-white" />
                ) : (
                  <Video className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
            
            {/* Tipo */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
              <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded ${
                story.type === "FOTO" ? "bg-blue-500" : "bg-red-500"
              }`}>
                {story.type}
              </span>
            </div>
            
            {/* Indicador de selección */}
            {idx === currentIndex && (
              <div className="absolute inset-0 border-2 border-white/50 rounded-xl" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
