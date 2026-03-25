import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { 
  Users, 
  Shield, 
  ShieldCheck, 
  ShieldOff,
  Crown,
  UserPlus,
  UserMinus,
  Loader2,
  Search,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function AdminUsers() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ userId: number; action: 'promote' | 'demote'; userName: string } | null>(null);

  const isAdmin = user?.role === "admin";

  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.userManagement.getUsers.useQuery(
    undefined,
    { enabled: isAuthenticated && isAdmin }
  );

  const { data: stats, isLoading: statsLoading } = trpc.userManagement.getStats.useQuery(
    undefined,
    { enabled: isAuthenticated && isAdmin }
  );

  const promoteMutation = trpc.userManagement.promoteToAdmin.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchUsers();
      setConfirmAction(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setConfirmAction(null);
    },
  });

  const demoteMutation = trpc.userManagement.demoteToUser.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchUsers();
      setConfirmAction(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setConfirmAction(null);
    },
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(u => 
      u.name?.toLowerCase().includes(q) || 
      u.email?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const adminUsers = useMemo(() => filteredUsers.filter(u => u.role === 'admin'), [filteredUsers]);
  const regularUsers = useMemo(() => filteredUsers.filter(u => u.role === 'user'), [filteredUsers]);

  // Not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container pt-24 pb-12">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Shield className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground mb-6">Necesitas iniciar sesión para acceder a esta página.</p>
            <a href="/login">
              <Button className="gradient-primary text-white">Iniciar Sesión</Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Not admin
  if (!authLoading && isAuthenticated && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container pt-24 pb-12">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <ShieldOff className="w-16 h-16 text-destructive/50 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground mb-6">Solo los administradores pueden gestionar usuarios.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Nunca";
    return new Date(date).toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
              <p className="text-muted-foreground">Administra los roles y permisos de los usuarios de la plataforma</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="glass border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Usuarios</p>
                  <p className="text-3xl font-bold">{statsLoading ? '...' : stats?.totalUsers ?? 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Administradores</p>
                  <p className="text-3xl font-bold text-orange-400">{statsLoading ? '...' : stats?.adminCount ?? 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Usuarios Regulares</p>
                  <p className="text-3xl font-bold text-green-400">{statsLoading ? '...' : stats?.regularUsers ?? 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="glass border-blue-500/20 mb-8">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-blue-400 mb-1">Permisos de Administrador</p>
                <p className="text-sm text-muted-foreground">
                  Los administradores tienen acceso completo a: <strong>Training</strong> (entrenamiento de IA), 
                  <strong> Admin Reels</strong> (gestión de reels virales), <strong>Dashboard</strong> (panel de control), 
                  y <strong>Gestión de Usuarios</strong> (esta página). Los usuarios regulares solo ven las secciones públicas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
          />
        </div>

        {usersLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Cargando usuarios...</span>
          </div>
        ) : (
          <>
            {/* Admins Section */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-orange-400" />
                <h2 className="text-xl font-semibold">Administradores ({adminUsers.length})</h2>
              </div>
              
              {adminUsers.length === 0 ? (
                <Card className="glass border-dashed border-muted-foreground/20">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No hay administradores que coincidan con la búsqueda
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {adminUsers.map((u) => (
                    <Card key={u.id} className="glass border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {u.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">{u.name || "Sin nombre"}</span>
                                {u.isOwner && (
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1">
                                    <Crown className="w-3 h-3" />
                                    Propietario
                                  </Badge>
                                )}
                                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                  Admin
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                {u.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3.5 h-3.5" />
                                    {u.email}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  Último acceso: {formatDate(u.lastSignedIn)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!u.isOwner && u.id !== user?.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-1.5"
                                onClick={() => setConfirmAction({ userId: u.id, action: 'demote', userName: u.name || 'Usuario' })}
                              >
                                <UserMinus className="w-4 h-4" />
                                Quitar Admin
                              </Button>
                            )}
                            {u.isOwner && (
                              <span className="text-xs text-muted-foreground italic">No se puede modificar</span>
                            )}
                            {u.id === user?.id && !u.isOwner && (
                              <span className="text-xs text-muted-foreground italic">Eres tú</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Regular Users Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold">Usuarios ({regularUsers.length})</h2>
              </div>
              
              {regularUsers.length === 0 ? (
                <Card className="glass border-dashed border-muted-foreground/20">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    {searchQuery ? 'No hay usuarios que coincidan con la búsqueda' : 'No hay usuarios regulares registrados'}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {regularUsers.map((u) => (
                    <Card key={u.id} className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                              {u.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">{u.name || "Sin nombre"}</span>
                                <Badge variant="outline" className="text-muted-foreground">
                                  Usuario
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                {u.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3.5 h-3.5" />
                                    {u.email}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  Último acceso: {formatDate(u.lastSignedIn)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300 gap-1.5"
                            onClick={() => setConfirmAction({ userId: u.id, action: 'promote', userName: u.name || 'Usuario' })}
                          >
                            <UserPlus className="w-4 h-4" />
                            Hacer Admin
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Confirmation Modal */}
        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmAction(null)}>
            <Card className="w-full max-w-md mx-4 glass border-primary/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    confirmAction.action === 'promote' 
                      ? 'bg-green-500/10' 
                      : 'bg-red-500/10'
                  }`}>
                    {confirmAction.action === 'promote' ? (
                      <UserPlus className="w-6 h-6 text-green-400" />
                    ) : (
                      <UserMinus className="w-6 h-6 text-red-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {confirmAction.action === 'promote' ? 'Promover a Administrador' : 'Quitar Administrador'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {confirmAction.action === 'promote' 
                        ? `¿Dar acceso de administrador a ${confirmAction.userName}?`
                        : `¿Quitar acceso de administrador a ${confirmAction.userName}?`
                      }
                    </p>
                  </div>
                </div>

                <div className={`p-3 rounded-lg mb-6 ${
                  confirmAction.action === 'promote' 
                    ? 'bg-green-500/5 border border-green-500/20' 
                    : 'bg-red-500/5 border border-red-500/20'
                }`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${
                      confirmAction.action === 'promote' ? 'text-green-400' : 'text-red-400'
                    }`} />
                    <p className="text-sm text-muted-foreground">
                      {confirmAction.action === 'promote' 
                        ? 'Este usuario podrá ver y gestionar: Training, Admin Reels, Dashboard, y Gestión de Usuarios. Tendrá acceso completo a todas las funciones de administración.'
                        : 'Este usuario perderá acceso a: Training, Admin Reels, Dashboard, y Gestión de Usuarios. Solo podrá usar las funciones públicas de la plataforma.'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setConfirmAction(null)}
                    disabled={promoteMutation.isPending || demoteMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className={confirmAction.action === 'promote' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                    }
                    disabled={promoteMutation.isPending || demoteMutation.isPending}
                    onClick={() => {
                      if (confirmAction.action === 'promote') {
                        promoteMutation.mutate({ userId: confirmAction.userId });
                      } else {
                        demoteMutation.mutate({ userId: confirmAction.userId });
                      }
                    }}
                  >
                    {(promoteMutation.isPending || demoteMutation.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : confirmAction.action === 'promote' ? (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    {confirmAction.action === 'promote' ? 'Confirmar Promoción' : 'Confirmar Eliminación'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
