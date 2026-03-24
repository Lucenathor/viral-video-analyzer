import { useState, useMemo, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Sparkles, 
  ExternalLink, 
  TrendingUp, 
  Zap, 
  Globe, 
  ChevronRight,
  X,
  Play,
  ArrowRight,
  Star,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import { Link } from "wouter";

// ─── Types ───────────────────────────────────────────────────────────
type Sector = {
  id: number;
  name: string;
  slug: string;
  category: string;
  reelUrl: string;
  platform: "tiktok" | "instagram" | "other";
  categoryIcon: string;
  gradientFrom: string;
  gradientTo: string;
};

type CategoryInfo = {
  name: string;
  icon: string;
  gradientFrom: string;
  gradientTo: string;
  count: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────
function getTikTokEmbedUrl(url: string): string | null {
  // Extract video ID from TikTok URLs
  const videoMatch = url.match(/\/video\/(\d+)/);
  if (videoMatch) {
    return `https://www.tiktok.com/embed/v2/${videoMatch[1]}`;
  }
  return null;
}

function getInstagramEmbedUrl(url: string): string | null {
  const reelMatch = url.match(/\/reel\/([A-Za-z0-9_-]+)/);
  if (reelMatch) {
    return `https://www.instagram.com/reel/${reelMatch[1]}/embed`;
  }
  return null;
}

function fuzzyMatch(text: string, query: string): boolean {
  const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Split query into words and check if all words are present
  const words = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
  return words.every(word => normalizedText.includes(word));
}

// ─── Animated Counter ────────────────────────────────────────────────
function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || target === 0) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count}</span>;
}

// ─── Sector Card ─────────────────────────────────────────────────────
function SectorCard({ 
  sector, 
  onClick,
  index 
}: { 
  sector: Sector; 
  onClick: () => void;
  index: number;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-sm p-5 text-left transition-all duration-500 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-2xl hover:-translate-y-1"
      style={{ 
        animationDelay: `${index * 30}ms`,
        animation: 'fadeInUp 0.5s ease-out forwards',
        opacity: 0,
      }}
    >
      {/* Gradient glow on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl"
        style={{ background: `linear-gradient(135deg, ${sector.gradientFrom}, ${sector.gradientTo})` }}
      />
      
      {/* Category icon */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{sector.categoryIcon}</span>
        <div 
          className="w-2 h-2 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ background: sector.gradientFrom }}
        />
      </div>
      
      {/* Sector name */}
      <h3 className="font-semibold text-white/90 text-sm leading-tight mb-2 group-hover:text-white transition-colors line-clamp-2">
        {sector.name}
      </h3>
      
      {/* Category & platform */}
      <div className="flex items-center gap-2 mt-auto">
        <span 
          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ 
            background: `${sector.gradientFrom}20`,
            color: sector.gradientFrom,
          }}
        >
          {sector.category}
        </span>
        <span className="text-[10px] text-white/40 uppercase">
          {sector.platform === 'tiktok' ? '▶ TikTok' : '📷 Instagram'}
        </span>
      </div>
      
      {/* Hover arrow */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <ArrowRight className="w-4 h-4 text-white/60" />
      </div>
    </button>
  );
}

// ─── Category Pill ───────────────────────────────────────────────────
function CategoryPill({ 
  category, 
  isActive, 
  onClick 
}: { 
  category: CategoryInfo; 
  isActive: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap
        ${isActive 
          ? 'text-white shadow-lg scale-105' 
          : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-white/80 border border-white/5'
        }
      `}
      style={isActive ? { 
        background: `linear-gradient(135deg, ${category.gradientFrom}, ${category.gradientTo})`,
        boxShadow: `0 8px 32px ${category.gradientFrom}40`,
      } : undefined}
    >
      <span className="text-base">{category.icon}</span>
      <span>{category.name}</span>
      <span className={`text-xs px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20' : 'bg-white/10'}`}>
        {category.count}
      </span>
    </button>
  );
}

// ─── Sector Detail Modal ─────────────────────────────────────────────
function SectorModal({ 
  sector, 
  onClose 
}: { 
  sector: Sector | null; 
  onClose: () => void;
}) {
  if (!sector) return null;

  const embedUrl = sector.platform === 'tiktok' 
    ? getTikTokEmbedUrl(sector.reelUrl) 
    : getInstagramEmbedUrl(sector.reelUrl);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0a0a1a]/95 backdrop-blur-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{
          animation: 'modalIn 0.3s ease-out forwards',
        }}
      >
        {/* Header gradient */}
        <div 
          className="h-2 w-full rounded-t-3xl"
          style={{ background: `linear-gradient(90deg, ${sector.gradientFrom}, ${sector.gradientTo})` }}
        />
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>
        
        <div className="p-8">
          {/* Sector header */}
          <div className="flex items-start gap-4 mb-6">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ background: `linear-gradient(135deg, ${sector.gradientFrom}30, ${sector.gradientTo}30)` }}
            >
              {sector.categoryIcon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{sector.name}</h2>
              <div className="flex items-center gap-3">
                <span 
                  className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{ 
                    background: `${sector.gradientFrom}20`,
                    color: sector.gradientFrom,
                  }}
                >
                  {sector.category}
                </span>
                <span className="text-xs text-white/40 flex items-center gap-1">
                  {sector.platform === 'tiktok' ? (
                    <>▶ TikTok</>
                  ) : (
                    <>📷 Instagram</>
                  )}
                </span>
              </div>
            </div>
          </div>
          
          {/* Reel embed or link */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Play className="w-4 h-4" />
              Reel Viral de Referencia
            </h3>
            
            {embedUrl ? (
              <div className="relative rounded-2xl overflow-hidden bg-black/50 border border-white/5">
                <iframe
                  src={embedUrl}
                  className="w-full"
                  style={{ height: '500px' }}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            ) : (
              <a
                href={sector.reelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all group"
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${sector.gradientFrom}, ${sector.gradientTo})` }}
                >
                  <Play className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium mb-1">Ver Reel Viral</p>
                  <p className="text-white/40 text-sm truncate">{sector.reelUrl}</p>
                </div>
                <ExternalLink className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors shrink-0" />
              </a>
            )}
          </div>
          
          {/* Tips section */}
          <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] mb-6">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Tips para tu sector
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                Estudia la estructura del reel: gancho, desarrollo y cierre
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                Adapta el formato a tu marca manteniendo la esencia viral
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                Usa el Analizador de ViralPro para desglosar cada segundo
              </li>
            </ul>
          </div>
          
          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/analyzer" className="flex-1">
              <Button 
                className="w-full gap-2 h-12 rounded-xl text-white font-semibold"
                style={{ background: `linear-gradient(135deg, ${sector.gradientFrom}, ${sector.gradientTo})` }}
              >
                <Zap className="w-4 h-4" />
                Analizar este Reel
              </Button>
            </Link>
            <Link href="/stories" className="flex-1">
              <Button 
                variant="outline"
                className="w-full gap-2 h-12 rounded-xl border-white/10 text-white/80 hover:text-white hover:bg-white/5"
              >
                <Sparkles className="w-4 h-4" />
                Generar Stories
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
export default function InspirationViral() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = trpc.inspiration.getAll.useQuery();

  // Filter sectors based on search and category
  const filteredSectors = useMemo(() => {
    if (!data?.sectors) return [];
    
    let filtered = data.sectors as Sector[];
    
    if (activeCategory) {
      filtered = filtered.filter(s => s.category === activeCategory);
    }
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(s => 
        fuzzyMatch(s.name, searchQuery) || fuzzyMatch(s.category, searchQuery)
      );
    }
    
    return filtered;
  }, [data?.sectors, activeCategory, searchQuery]);

  const categories = useMemo(() => {
    return (data?.categories || []) as CategoryInfo[];
  }, [data?.categories]);

  // Keyboard shortcut: Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSelectedSector(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* CSS animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" style={{ animation: 'pulseGlow 4s ease-in-out infinite' }} />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px]" style={{ animation: 'pulseGlow 5s ease-in-out infinite 1s' }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-gradient-to-t from-primary/5 to-transparent blur-3xl" />
        </div>
        
        <div className="container relative z-10">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-white/70">
                <span className="text-white font-semibold">{data?.total || 136}</span> sectores con reels virales reales
              </span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-4 leading-tight">
            <span className="text-white">Inspiración </span>
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Viral
            </span>
          </h1>
          <p className="text-center text-white/50 text-lg max-w-2xl mx-auto mb-10">
            Encuentra tu sector y descubre el reel viral que está arrasando. 
            Estudia su estructura, adáptalo a tu marca y crea contenido que explote.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-white/30 pointer-events-none" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Busca tu sector... (ej: peluquería, fitness, inmobiliaria)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-24 rounded-xl bg-white/[0.05] border-white/10 text-white placeholder:text-white/30 text-base focus:border-purple-500/50 focus:ring-purple-500/20 transition-all"
              />
              <div className="absolute right-4 flex items-center gap-2">
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="p-1 rounded-md hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/30 font-mono">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>
          
          {/* Stats row */}
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                <AnimatedCounter target={data?.total || 136} />
              </div>
              <div className="text-xs text-white/40 mt-1">Sectores</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                <AnimatedCounter target={categories.length || 12} />
              </div>
              <div className="text-xs text-white/40 mt-1">Categorías</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-xs text-white/40 mt-1">Reels Reales</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="pb-6">
        <div className="container">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {/* All button */}
            <button
              onClick={() => setActiveCategory(null)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap
                ${!activeCategory 
                  ? 'bg-white/10 text-white border border-white/20' 
                  : 'bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white/70 border border-white/5'
                }
              `}
            >
              <Globe className="w-4 h-4" />
              Todos
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-white/10">{data?.total || 0}</span>
            </button>
            
            {categories.map(cat => (
              <CategoryPill
                key={cat.name}
                category={cat}
                isActive={activeCategory === cat.name}
                onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="pb-20">
        <div className="container">
          {/* Results header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-white/80">
                {searchQuery ? (
                  <>Resultados para "<span className="text-purple-400">{searchQuery}</span>"</>
                ) : activeCategory ? (
                  <>{activeCategory}</>
                ) : (
                  <>Todos los sectores</>
                )}
              </h2>
              <span className="text-sm text-white/40 bg-white/5 px-2.5 py-1 rounded-lg">
                {filteredSectors.length} {filteredSectors.length === 1 ? 'sector' : 'sectores'}
              </span>
            </div>
            
            <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-1 border border-white/5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Loading state */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-white/5 mb-3" />
                  <div className="h-4 w-3/4 bg-white/5 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          )}
          
          {/* Empty state */}
          {!isLoading && filteredSectors.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-lg font-semibold text-white/60 mb-2">No se encontraron sectores</h3>
              <p className="text-sm text-white/40 mb-4">
                Prueba con otra búsqueda o explora las categorías
              </p>
              <Button 
                variant="outline" 
                onClick={() => { setSearchQuery(""); setActiveCategory(null); }}
                className="border-white/10 text-white/60"
              >
                Ver todos los sectores
              </Button>
            </div>
          )}
          
          {/* Grid view */}
          {!isLoading && filteredSectors.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredSectors.map((sector, index) => (
                <SectorCard
                  key={sector.id}
                  sector={sector}
                  index={index}
                  onClick={() => setSelectedSector(sector)}
                />
              ))}
            </div>
          )}
          
          {/* List view */}
          {!isLoading && filteredSectors.length > 0 && viewMode === 'list' && (
            <div className="space-y-2">
              {filteredSectors.map((sector, index) => (
                <button
                  key={sector.id}
                  onClick={() => setSelectedSector(sector)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all group text-left"
                  style={{ 
                    animationDelay: `${index * 20}ms`,
                    animation: 'fadeInUp 0.3s ease-out forwards',
                    opacity: 0,
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: `linear-gradient(135deg, ${sector.gradientFrom}20, ${sector.gradientTo}20)` }}
                  >
                    {sector.categoryIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white/90 text-sm group-hover:text-white transition-colors truncate">
                      {sector.name}
                    </h3>
                    <p className="text-xs text-white/40">{sector.category}</p>
                  </div>
                  <span className="text-[10px] text-white/30 uppercase shrink-0">
                    {sector.platform === 'tiktok' ? 'TikTok' : 'Instagram'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="pb-20">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 p-10 text-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-purple-500/10 blur-[80px]" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 relative z-10">
              ¿No encuentras tu sector?
            </h2>
            <p className="text-white/50 mb-6 max-w-lg mx-auto relative z-10">
              Analiza cualquier vídeo viral con nuestro Analizador de IA y descubre qué lo hace funcionar
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10">
              <Link href="/analyzer">
                <Button className="gap-2 h-12 px-8 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90">
                  <Zap className="w-4 h-4" />
                  Ir al Analizador
                </Button>
              </Link>
              <Link href="/stories">
                <Button variant="outline" className="gap-2 h-12 px-8 rounded-xl border-white/10 text-white/80 hover:text-white hover:bg-white/5">
                  <TrendingUp className="w-4 h-4" />
                  Generar Stories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sector Detail Modal */}
      <SectorModal 
        sector={selectedSector} 
        onClose={() => setSelectedSector(null)} 
      />
    </div>
  );
}
