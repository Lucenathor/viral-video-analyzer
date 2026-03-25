import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Library, 
  Instagram, 
  Sparkles, 
  TrendingUp, 
  Zap,
  Target,
  BarChart3,
  ArrowRight,
  Play,
  CheckCircle2,
  Rocket,
  Crown,
  Star,
  Flame,
  Users,
  Clock,
  Shield,
  Award
} from "lucide-react";

const features = [
  {
    icon: Library,
    title: "Biblioteca de Reels Virales",
    description: "Explora cientos de reels virales organizados por sector: clínicas estéticas, inmobiliarias, abogados, personal trainers y más.",
    href: "/library",
    color: "gradient-primary",
    badge: "Popular"
  },
  {
    icon: Video,
    title: "Analizador de Tu Vídeo",
    description: "Sube tu vídeo y descubre su potencial viral: hooks, cortes, timing y estructura completa con recomendaciones de mejora.",
    href: "/analyzer",
    color: "gradient-accent",
    badge: "IA Avanzada"
  },
  {
    icon: Target,
    title: "Comparador con Virales",
    description: "Compara tu vídeo con uno viral de tu sector y recibe puntos de mejora específicos y recomendaciones de edición.",
    href: "/analyzer",
    color: "bg-gradient-to-br from-pink-500 to-rose-600",
    badge: "Nuevo"
  },
  {
    icon: Instagram,
    title: "Generador de Bios IG",
    description: "Crea biografías profesionales de Instagram con CTA inteligente, enlace web y slot de urgencia. La IA decide si usar lead magnet, auditoría o consultoría.",
    href: "/bio-generator",
    color: "bg-gradient-to-br from-pink-500 to-purple-600",
    badge: "Nuevo"
  }
];

const stats = [
  { value: "10K+", label: "Vídeos Analizados", icon: Video },
  { value: "500+", label: "Reels Virales", icon: Flame },
  { value: "98%", label: "Satisfacción", icon: Star },
  { value: "IA", label: "Bio Generator", icon: Instagram }
];

const benefits = [
  { text: "Análisis detallado de estructura viral", icon: BarChart3 },
  { text: "Puntos de mejora personalizados", icon: Target },
  { text: "Biblioteca de ejemplos por sector", icon: Library },
  { text: "Soporte de expertos en contenido", icon: Users },
  { text: "Recomendaciones de cortes y timing", icon: Clock },
  { text: "Historial de todos tus análisis", icon: Shield }
];

const sectors = [
  "Clínica Estética", "Inmobiliaria", "Abogados", "Marketing",
  "Personal Trainer", "Manicura", "Micropigmentación", "Peluquería",
  "Restaurantes", "Coaches"
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-4 h-4 rounded-full bg-primary/60 animate-float" />
        <div className="absolute top-40 right-20 w-3 h-3 rounded-full bg-accent/60 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-1/4 w-5 h-5 rounded-full bg-pink-500/40 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-60 right-1/3 w-2 h-2 rounded-full bg-primary/40 animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-20 right-10 w-3 h-3 rounded-full bg-accent/50 animate-float" style={{ animationDelay: '1.5s' }} />
        
        {/* Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/15 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
        
        <div className="container relative">
          <div className="max-w-5xl mx-auto text-center">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full badge-premium mb-8 animate-fade-in-scale">
              <Rocket className="w-4 h-4 text-primary animate-bounce-subtle" />
              <span className="text-sm font-semibold text-gradient">Potenciado por IA</span>
              <Sparkles className="w-4 h-4 text-accent animate-bounce-subtle" style={{ animationDelay: '0.5s' }} />
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-fade-in-up">
              Descubre el <span className="text-gradient">Secreto</span> de los{" "}
              <br className="hidden md:block" />
              <span className="text-gradient">Vídeos Virales</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Analiza cualquier vídeo viral, comprende su estructura y aplica las mismas técnicas 
              a tu contenido para multiplicar tu alcance.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              {isAuthenticated ? (
                <Link href="/analyzer">
                  <Button size="lg" className="btn-premium gradient-primary text-white gap-2 text-lg px-8 h-14 rounded-xl">
                    <Play className="w-5 h-5" />
                    Empezar a Analizar
                  </Button>
                </Link>
              ) : (
                <a href="/login">
                  <Button size="lg" className="btn-premium gradient-primary text-white gap-2 text-lg px-8 h-14 rounded-xl">
                    <Zap className="w-5 h-5" />
                    Comenzar Gratis
                  </Button>
                </a>
              )}
              <Link href="/library">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8 h-14 rounded-xl border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all">
                  <Library className="w-5 h-5" />
                  Ver Biblioteca
                </Button>
              </Link>
            </div>
            
            {/* Sector Tags */}
            <div className="mt-12 flex flex-wrap justify-center gap-2 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              {sectors.map((sector, index) => (
                <Badge 
                  key={sector} 
                  variant="outline" 
                  className="px-3 py-1.5 text-xs bg-card/30 border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all cursor-default"
                  style={{ animationDelay: `${400 + index * 50}ms` }}
                >
                  {sector}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center p-6 rounded-2xl glass-card hover-lift animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gradient mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        <div className="container relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 px-4 py-1.5">
              <Crown className="w-3 h-3 mr-2" />
              Funcionalidades Premium
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Todo lo que Necesitas para{" "}
              <span className="text-gradient">Crear Virales</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Herramientas profesionales de análisis de contenido viral para autónomos y pequeñas empresas.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Link key={index} href={feature.href}>
                <Card 
                  className="group h-full glass-card border-primary/10 hover:border-primary/30 transition-all duration-500 cursor-pointer hover-lift overflow-hidden"
                >
                  <CardContent className="p-8 relative">
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative">
                      <div className="flex items-start justify-between mb-6">
                        <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                          <feature.icon className="w-7 h-7 text-white" />
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            feature.badge === 'Popular' 
                              ? 'bg-primary/20 text-primary border-primary/30' 
                              : feature.badge === 'Premium'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : feature.badge === 'IA Avanzada'
                              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                              : feature.badge === 'Nuevo'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-muted/50 text-muted-foreground border-border/50'
                          }`}
                        >
                          {feature.badge}
                        </Badge>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-3 group-hover:text-gradient transition-all duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground mb-6 leading-relaxed">{feature.description}</p>
                      
                      <div className="flex items-center text-primary font-semibold group-hover:gap-3 gap-2 transition-all duration-300">
                        Explorar 
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-card/50 to-transparent" />
        <div className="container relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30 px-4 py-1.5">
              <Sparkles className="w-3 h-3 mr-2" />
              Fácil de Usar
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Cómo <span className="text-gradient">Funciona</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { 
                step: 1, 
                title: "Explora la Biblioteca", 
                desc: "Descubre vídeos virales de tu sector y aprende qué los hizo exitosos",
                gradient: "gradient-primary"
              },
              { 
                step: 2, 
                title: "Analiza tu Vídeo", 
                desc: "Sube tu contenido y recibe un análisis detallado con IA",
                gradient: "gradient-accent"
              },
              { 
                step: 3, 
                title: "Mejora y Triunfa", 
                desc: "Aplica las recomendaciones y multiplica tu alcance",
                gradient: "bg-gradient-to-br from-emerald-500 to-teal-500"
              }
            ].map((item, index) => (
              <div 
                key={index} 
                className="text-center group animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="relative mb-6">
                  <div className={`w-20 h-20 rounded-3xl ${item.gradient} flex items-center justify-center mx-auto text-3xl font-bold text-white shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    {item.step}
                  </div>
                  <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 gradient-mesh opacity-20" />
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in-up">
              <Badge className="mb-4 bg-pink-500/20 text-pink-400 border-pink-500/30 px-4 py-1.5">
                <Award className="w-3 h-3 mr-2" />
                Beneficios
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Lleva tu Contenido al{" "}
                <span className="text-gradient">Siguiente Nivel</span>
              </h2>
              <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
                Deja de adivinar qué funciona. Usa datos y análisis de IA para crear contenido 
                que realmente conecte con tu audiencia.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 rounded-xl bg-card/30 border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-pink-500/20 border border-primary/20 flex items-center justify-center p-8 relative overflow-hidden">
                {/* Animated rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[80%] h-[80%] rounded-full border border-primary/20 animate-spin-slow" />
                  <div className="absolute w-[60%] h-[60%] rounded-full border border-accent/20 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '12s' }} />
                  <div className="absolute w-[40%] h-[40%] rounded-full border border-pink-500/20 animate-spin-slow" style={{ animationDuration: '6s' }} />
                </div>
                
                <div className="text-center relative z-10">
                  <div className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce-subtle">
                    <BarChart3 className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-2xl font-bold mb-2">Análisis Detallado</p>
                  <p className="text-muted-foreground">Métricas y recomendaciones personalizadas</p>
                </div>
              </div>
              
              {/* Floating cards */}
              <div className="absolute -top-4 -right-4 p-4 rounded-2xl glass-card shadow-xl animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                    <p className="font-bold text-green-500">+245%</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 p-4 rounded-2xl glass-card shadow-xl animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Viralidad</p>
                    <p className="font-bold text-pink-500">92/100</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        
        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 px-4 py-1.5">
              <Rocket className="w-3 h-3 mr-2" />
              Empieza Ahora
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              ¿Listo para Crear{" "}
              <span className="text-gradient">Contenido Viral</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Únete a miles de creadores y negocios que ya están multiplicando su alcance con ViralPro.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link href="/library">
                  <Button size="lg" className="btn-premium gradient-primary text-white gap-2 text-lg px-10 h-14 rounded-xl">
                    <Library className="w-5 h-5" />
                    Explorar Biblioteca
                  </Button>
                </Link>
              ) : (
                <a href="/login">
                  <Button size="lg" className="btn-premium gradient-primary text-white gap-2 text-lg px-10 h-14 rounded-xl">
                    <Zap className="w-5 h-5" />
                    Comenzar Gratis
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/30">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gradient">ViralPro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 ViralPro. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
