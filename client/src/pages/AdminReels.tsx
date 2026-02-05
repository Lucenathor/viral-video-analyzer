import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  CheckCircle2, XCircle, Clock, Eye, Heart, MessageCircle, 
  Share2, Plus, Search, TrendingUp, Sparkles, ExternalLink,
  ChevronLeft, ChevronRight, Play, Filter, RefreshCw
} from 'lucide-react';

export default function AdminReels() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedReel, setSelectedReel] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [addReelUrl, setAddReelUrl] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Queries
  const { data: stats, refetch: refetchStats } = trpc.admin.getStats.useQuery();
  const { data: sectors } = trpc.admin.getSectors.useQuery();
  const { data: pendingReels, refetch: refetchPending } = trpc.admin.getPendingReels.useQuery({ 
    status: selectedTab as 'pending' | 'approved' | 'rejected',
    limit: 50 
  });

  // Mutations
  const approveMutation = trpc.admin.approveReel.useMutation({
    onSuccess: () => {
      toast.success('Reel aprobado correctamente');
      refetchPending();
      refetchStats();
      setSelectedReel(null);
      setReviewNotes('');
      setSelectedSector('');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const rejectMutation = trpc.admin.rejectReel.useMutation({
    onSuccess: () => {
      toast.success('Reel rechazado');
      refetchPending();
      refetchStats();
      setSelectedReel(null);
      setReviewNotes('');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const searchReelsMutation = trpc.admin.searchViralReels.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        refetchPending();
        refetchStats();
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const runFullSearchMutation = trpc.admin.runFullSearchJob.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        refetchPending();
        refetchStats();
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const analyzeReelMutation = trpc.admin.analyzeAndAddReel.useMutation({
    onSuccess: (data) => {
      toast.success('Reel añadido a la cola de revisión');
      setAddReelUrl('');
      setIsAddDialogOpen(false);
      refetchPending();
      refetchStats();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Acceso Denegado</CardTitle>
            <CardDescription>
              Solo los administradores pueden acceder a esta sección.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleApprove = () => {
    if (!selectedReel || !selectedSector) {
      toast.error('Selecciona un sector antes de aprobar');
      return;
    }
    approveMutation.mutate({
      id: selectedReel.id,
      sectorSlug: selectedSector,
      notes: reviewNotes || undefined,
    });
  };

  const handleReject = () => {
    if (!selectedReel) return;
    rejectMutation.mutate({
      id: selectedReel.id,
      notes: reviewNotes || undefined,
    });
  };

  const handleAddReel = () => {
    if (!addReelUrl) {
      toast.error('Introduce una URL de TikTok');
      return;
    }
    
    // Extract TikTok ID from URL
    const tiktokIdMatch = addReelUrl.match(/video\/(\d+)/);
    const tiktokId = tiktokIdMatch?.[1] || `manual_${Date.now()}`;
    
    analyzeReelMutation.mutate({
      tiktokUrl: addReelUrl,
      tiktokId,
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Panel de Reels Virales</h1>
                <p className="text-sm text-slate-400">Gestión interna de contenido viral</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => { refetchPending(); refetchStats(); }}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => runFullSearchMutation.mutate()}
                disabled={runFullSearchMutation.isPending}
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              >
                <Search className="w-4 h-4 mr-2" />
                {runFullSearchMutation.isPending ? 'Buscando...' : 'Buscar Virales'}
              </Button>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir Reel
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700">
                  <DialogHeader>
                    <DialogTitle>Añadir Reel para Revisión</DialogTitle>
                    <DialogDescription>
                      Introduce la URL de TikTok del reel que quieres analizar y añadir a la cola de revisión.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>URL de TikTok</Label>
                      <Input 
                        placeholder="https://www.tiktok.com/@usuario/video/123456789"
                        value={addReelUrl}
                        onChange={(e) => setAddReelUrl(e.target.value)}
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleAddReel}
                      disabled={analyzeReelMutation.isPending}
                      className="bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      {analyzeReelMutation.isPending ? 'Analizando...' : 'Analizar y Añadir'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Pendientes</p>
                  <p className="text-2xl font-bold text-amber-400">{stats?.pending || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-400/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Aprobados</p>
                  <p className="text-2xl font-bold text-green-400">{stats?.approved || 0}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Rechazados</p>
                  <p className="text-2xl font-bold text-red-400">{stats?.rejected || 0}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-400/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Sectores</p>
                  <p className="text-2xl font-bold text-purple-400">{stats?.sectors || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reels List */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3">
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="bg-slate-800">
                    <TabsTrigger value="pending" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                      <Clock className="w-4 h-4 mr-2" />
                      Pendientes ({stats?.pending || 0})
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Aprobados
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
                      <XCircle className="w-4 h-4 mr-2" />
                      Rechazados
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {pendingReels?.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No hay reels en esta categoría</p>
                    </div>
                  ) : (
                    pendingReels?.map((reel: any) => (
                      <div 
                        key={reel.id}
                        onClick={() => setSelectedReel(reel)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedReel?.id === reel.id 
                            ? 'border-purple-500 bg-purple-500/10' 
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex gap-4">
                          {/* Thumbnail */}
                          <div className="relative w-20 h-28 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                            {reel.coverUrl ? (
                              <img 
                                src={reel.coverUrl} 
                                alt={reel.title || 'Reel'} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="w-8 h-8 text-slate-500" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                              <Play className="w-8 h-8 text-white" />
                            </div>
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-medium text-white truncate">
                                {reel.title || reel.authorUsername || 'Sin título'}
                              </p>
                              {reel.viralityScore && (
                                <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30 flex-shrink-0">
                                  {reel.viralityScore}%
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-slate-400 mb-2">
                              @{reel.authorUsername || 'desconocido'}
                            </p>
                            
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {formatNumber(reel.likes || 0)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                {formatNumber(reel.comments || 0)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Share2 className="w-3 h-3" />
                                {formatNumber(reel.shares || 0)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {formatNumber(reel.views || 0)}
                              </span>
                            </div>
                            
                            {reel.suggestedSector && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                Sugerido: {reel.suggestedSector}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Review Panel */}
          <div>
            <Card className="bg-slate-900/50 border-slate-800 sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Panel de Revisión</CardTitle>
                <CardDescription>
                  {selectedReel ? 'Revisa y clasifica el reel seleccionado' : 'Selecciona un reel para revisar'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedReel ? (
                  <div className="space-y-4">
                    {/* Preview */}
                    <div className="aspect-[9/16] rounded-lg overflow-hidden bg-slate-800 relative">
                      {selectedReel.coverUrl ? (
                        <img 
                          src={selectedReel.coverUrl} 
                          alt={selectedReel.title || 'Reel'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-16 h-16 text-slate-600" />
                        </div>
                      )}
                      <a 
                        href={selectedReel.tiktokUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="absolute bottom-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-white" />
                      </a>
                    </div>

                    {/* AI Analysis */}
                    {selectedReel.viralityExplanation && (
                      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-medium text-purple-300">Análisis IA</span>
                        </div>
                        <p className="text-sm text-slate-300">{selectedReel.viralityExplanation}</p>
                      </div>
                    )}

                    {/* Sector Selection */}
                    <div className="space-y-2">
                      <Label>Asignar a Sector</Label>
                      <Select value={selectedSector} onValueChange={setSelectedSector}>
                        <SelectTrigger className="bg-slate-800 border-slate-700">
                          <SelectValue placeholder="Selecciona un sector" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {sectors?.map((sector: any) => (
                            <SelectItem key={sector.slug} value={sector.slug}>
                              {sector.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label>Notas de Revisión (opcional)</Label>
                      <Textarea 
                        placeholder="Añade notas sobre por qué apruebas o rechazas este reel..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className="bg-slate-800 border-slate-700 min-h-[80px]"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                        onClick={handleReject}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rechazar
                      </Button>
                      <Button 
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        onClick={handleApprove}
                        disabled={approveMutation.isPending || !selectedSector}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Aprobar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Selecciona un reel de la lista para revisarlo</p>
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
