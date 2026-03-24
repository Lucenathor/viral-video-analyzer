import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { 
  Video, 
  Library, 
  Headphones, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X,
  Sparkles,
  CalendarDays,
  Flame,
  CreditCard,
  Shield,
  Brain
} from "lucide-react";
import { useState } from "react";

// Navegación principal
const navItems = [
  { href: "/library", label: "Biblioteca", icon: Library },
  { href: "/calendar", label: "Calendario", icon: CalendarDays },
  { href: "/stories", label: "Lanzamientos", icon: Flame },
  { href: "/analyzer", label: "Analizador", icon: Video },
  { href: "/support", label: "Soporte 24h", icon: Headphones },
  { href: "/pricing", label: "Precios", icon: CreditCard },
];

// Navegación admin (solo visible para admins)
const adminItems = [
  { href: "/admin/training", label: "Training", icon: Brain },
  { href: "/admin/reels", label: "Admin Reels", icon: Shield },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isAdmin = user?.role === "admin";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-primary/10">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo con animación */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-primary/50 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
            </div>
            <span className="font-bold text-xl text-gradient">ViralPro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5 ml-6 flex-1 justify-center">
            {navItems.map((item, index) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={`
                      gap-1.5 relative overflow-hidden transition-all duration-300 text-xs
                      ${isActive 
                        ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]" 
                        : "hover:bg-primary/10 hover:text-primary"
                      }
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <item.icon className={`w-3.5 h-3.5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            
            {/* Admin items - solo visible para admins */}
            {isAdmin && (
              <>
                <div className="w-px h-6 bg-primary/20 mx-1" />
                {adminItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        size="sm"
                        className={`
                          gap-1.5 relative overflow-hidden transition-all duration-300 text-xs
                          ${isActive 
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" 
                            : "hover:bg-orange-500/10 hover:text-orange-400"
                          }
                        `}
                      >
                        <item.icon className="w-3.5 h-3.5" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </>
            )}
          </div>

          {/* Auth Section */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="gap-1.5 hover:bg-primary/10 hover:text-primary transition-all duration-300 text-xs"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Dashboard
                  </Button>
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/20 hover:border-primary/40 transition-all duration-300">
                  <div className="w-7 h-7 rounded-full gradient-accent flex items-center justify-center text-xs font-semibold text-white shadow-lg">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate">
                    {user?.name || "Usuario"}
                  </span>
                  {isAdmin && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      Admin
                    </span>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => logout()}
                  className="hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="btn-premium gradient-primary text-white border-0 shadow-lg shadow-primary/25">
                  Iniciar Sesión
                </Button>
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden relative overflow-hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <div className={`transition-all duration-300 ${mobileMenuOpen ? 'rotate-90 scale-110' : ''}`}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </div>
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className={`
          lg:hidden overflow-hidden transition-all duration-300 ease-out
          ${mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="py-4 border-t border-primary/10">
            <div className="flex flex-col gap-2">
              {navItems.map((item, index) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={`
                        w-full justify-start gap-2 transition-all duration-300
                        ${isActive ? "bg-primary/20 text-primary" : ""}
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ 
                        animationDelay: `${index * 50}ms`,
                        opacity: mobileMenuOpen ? 1 : 0,
                        transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-10px)'
                      }}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              
              {/* Admin items en mobile */}
              {isAdmin && (
                <>
                  <div className="h-px bg-orange-500/20 my-1" />
                  <p className="text-xs text-orange-400/70 px-4 font-medium">Panel Admin</p>
                  {adminItems.map((item) => {
                    const isActive = location === item.href;
                    return (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className={`
                            w-full justify-start gap-2 transition-all duration-300
                            ${isActive ? "bg-orange-500/20 text-orange-400" : "text-orange-400/70 hover:text-orange-400"}
                          `}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                </>
              )}
              
              {isAuthenticated && (
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              )}
              <div className="pt-2 border-t border-primary/10 mt-2">
                {isAuthenticated ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </Button>
                ) : (
                  <a href={getLoginUrl()} className="block">
                    <Button className="w-full gradient-primary text-white">
                      Iniciar Sesión
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
