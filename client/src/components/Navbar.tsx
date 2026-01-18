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
  Sparkles
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/analyzer", label: "Analizador", icon: Video },
  { href: "/library", label: "Biblioteca", icon: Library },
  { href: "/support", label: "Soporte 24h", icon: Headphones },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center glow-primary transition-all group-hover:scale-105">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gradient">ViralPro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`gap-2 ${isActive ? "bg-secondary/80" : ""}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50">
                  <div className="w-7 h-7 rounded-full gradient-accent flex items-center justify-center text-xs font-semibold text-accent-foreground">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate">
                    {user?.name || "Usuario"}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => logout()}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="gradient-primary glow-primary">
                  Iniciar Sesión
                </Button>
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
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
              <div className="pt-2 border-t border-border/50 mt-2">
                {isAuthenticated ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-destructive"
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
                    <Button className="w-full gradient-primary">
                      Iniciar Sesión
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
