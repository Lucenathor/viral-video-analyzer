import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { 
  Video, 
  Library, 
  Headphones, 
  Sparkles, 
  TrendingUp, 
  Zap,
  Target,
  BarChart3,
  ArrowRight,
  Play,
  CheckCircle2
} from "lucide-react";

const features = [
  {
    icon: Video,
    title: "Analizador de Virales",
    description: "Sube un vídeo viral y descubre exactamente qué lo hizo explotar: hooks, cortes, timing y estructura completa.",
    href: "/analyzer",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Target,
    title: "Comparador de Vídeos",
    description: "Compara tu vídeo con uno viral y recibe puntos de mejora específicos, recomendaciones de cortes y edición.",
    href: "/analyzer",
    color: "from-cyan-500 to-blue-500"
  },
  {
    icon: Library,
    title: "Biblioteca de Reels",
    description: "Explora cientos de reels virales organizados por sector: restaurantes, fitness, abogados y más.",
    href: "/library",
    color: "from-emerald-500 to-teal-500"
  },
  {
    icon: Headphones,
    title: "Soporte 24h",
    description: "Envía tu vídeo y recibe análisis personalizado de expertos con un Loom explicativo.",
    href: "/support",
    color: "from-orange-500 to-red-500"
  }
];

const stats = [
  { value: "10K+", label: "Vídeos Analizados" },
  { value: "500+", label: "Reels Virales" },
  { value: "98%", label: "Satisfacción" },
  { value: "24/7", label: "Soporte Experto" }
];

const benefits = [
  "Análisis detallado de estructura viral",
  "Puntos de mejora personalizados",
  "Biblioteca de ejemplos por sector",
  "Soporte de expertos en contenido",
  "Recomendaciones de cortes y timing",
  "Historial de todos tus análisis"
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Potenciado por IA</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Descubre el <span className="text-gradient">Secreto</span> de los{" "}
              <span className="text-gradient">Vídeos Virales</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Analiza cualquier vídeo viral, comprende su estructura y aplica las mismas técnicas 
              a tu contenido para multiplicar tu alcance.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link href="/analyzer">
                  <Button size="lg" className="gradient-primary glow-primary gap-2 text-lg px-8">
                    <Play className="w-5 h-5" />
                    Empezar a Analizar
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="gradient-primary glow-primary gap-2 text-lg px-8">
                    <Zap className="w-5 h-5" />
                    Comenzar Gratis
                  </Button>
                </a>
              )}
              <Link href="/library">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8">
                  <Library className="w-5 h-5" />
                  Ver Biblioteca
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
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
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Todo lo que Necesitas para <span className="text-gradient">Crear Virales</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Herramientas profesionales de análisis de contenido viral para autónomos y pequeñas empresas.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Link key={index} href={feature.href}>
                <Card className="group h-full bg-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 hover:glow-primary cursor-pointer">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">{feature.description}</p>
                    <div className="flex items-center text-primary font-medium">
                      Explorar <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-card/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Cómo <span className="text-gradient">Funciona</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Sube el Vídeo Viral</h3>
              <p className="text-muted-foreground text-sm">
                Carga cualquier vídeo viral que quieras analizar
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-accent-foreground">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Recibe el Análisis</h3>
              <p className="text-muted-foreground text-sm">
                La IA analiza estructura, hooks, cortes y timing
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Mejora tu Contenido</h3>
              <p className="text-muted-foreground text-sm">
                Aplica las técnicas a tus propios vídeos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Lleva tu Contenido al <span className="text-gradient">Siguiente Nivel</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Deja de adivinar qué funciona. Usa datos y análisis de IA para crear contenido 
                que realmente conecte con tu audiencia.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-border/50 flex items-center justify-center">
                <div className="text-center p-8">
                  <BarChart3 className="w-16 h-16 text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">Análisis Detallado</p>
                  <p className="text-sm text-muted-foreground">Métricas y recomendaciones personalizadas</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-xl gradient-primary glow-primary flex items-center justify-center">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center glass rounded-3xl p-12">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Listo para Crear <span className="text-gradient">Contenido Viral</span>?
            </h2>
            <p className="text-muted-foreground mb-8">
              Únete a miles de creadores que ya están usando ViralPro para multiplicar su alcance.
            </p>
            {isAuthenticated ? (
              <Link href="/analyzer">
                <Button size="lg" className="gradient-primary glow-primary gap-2 text-lg px-8">
                  <Play className="w-5 h-5" />
                  Ir al Analizador
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="gradient-primary glow-primary gap-2 text-lg px-8">
                  <Zap className="w-5 h-5" />
                  Empezar Ahora
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gradient">ViralPro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 ViralPro. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
