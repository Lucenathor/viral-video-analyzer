import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getLoginUrl } from '@/const';
import { 
  Check, X, Sparkles, Zap, Crown, Building2, 
  Video, Calendar, MessageSquare, Users, Palette, Code,
  ArrowRight, Loader2
} from 'lucide-react';

const FEATURES = [
  { key: 'analysisPerMonth', label: 'Análisis de vídeos/mes', icon: Video },
  { key: 'storiesPerMonth', label: 'Guiones de Stories/mes', icon: Calendar },
  { key: 'libraryAccess', label: 'Acceso a Biblioteca Viral', icon: Sparkles },
  { key: 'calendarAccess', label: 'Calendario de Contenido', icon: Calendar },
  { key: 'prioritySupport', label: 'Soporte Prioritario 24h', icon: MessageSquare },
  { key: 'teamMembers', label: 'Miembros del equipo', icon: Users },
  { key: 'customBranding', label: 'Branding Personalizado', icon: Palette },
  { key: 'apiAccess', label: 'Acceso API', icon: Code },
];

const PLAN_ICONS = {
  free: Sparkles,
  basic: Zap,
  pro: Crown,
  enterprise: Building2,
};

const PLAN_COLORS = {
  free: 'from-slate-500 to-slate-600',
  basic: 'from-blue-500 to-cyan-500',
  pro: 'from-purple-500 to-pink-500',
  enterprise: 'from-amber-500 to-orange-500',
};

export default function Pricing() {
  const { user, loading: authLoading } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { data: plans } = trpc.stripe.getPlans.useQuery();
  const { data: subscription } = trpc.stripe.getSubscription.useQuery(undefined, {
    enabled: !!user,
  });

  const createCheckoutMutation = trpc.stripe.createCheckout.useMutation({
    onSuccess: (data) => {
      window.open(data.url, '_blank');
      toast.success('Redirigiendo a la página de pago...');
      setLoadingPlan(null);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setLoadingPlan(null);
    }
  });

  const handleSubscribe = (planId: string) => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    
    if (planId === 'free') {
      toast.info('Ya tienes acceso al plan gratuito');
      return;
    }

    setLoadingPlan(planId);
    createCheckoutMutation.mutate({
      planId: planId as 'basic' | 'pro' | 'enterprise',
      billingPeriod: isYearly ? 'yearly' : 'monthly',
    });
  };

  const formatPrice = (priceMonthly: number, priceYearly: number) => {
    if (priceMonthly === 0) return '0';
    const price = isYearly ? priceYearly / 12 : priceMonthly;
    return (price / 100).toFixed(0);
  };

  const formatFeatureValue = (key: string, value: any) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-400" />
      ) : (
        <X className="w-5 h-5 text-slate-500" />
      );
    }
    if (value === -1) return 'Ilimitado';
    return value.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="container py-16 text-center">
        <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
          <Sparkles className="w-3 h-3 mr-1" />
          Planes y Precios
        </Badge>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="text-white">Elige el plan perfecto para</span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            tu negocio
          </span>
        </h1>
        
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
          Desbloquea todo el potencial del marketing viral con nuestras herramientas de análisis 
          impulsadas por IA. Cancela cuando quieras.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Label className={`text-sm ${!isYearly ? 'text-white' : 'text-slate-400'}`}>
            Mensual
          </Label>
          <Switch 
            checked={isYearly} 
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-purple-600"
          />
          <Label className={`text-sm ${isYearly ? 'text-white' : 'text-slate-400'}`}>
            Anual
          </Label>
          {isYearly && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              2 meses gratis
            </Badge>
          )}
        </div>

        {/* Current Plan Badge */}
        {subscription && subscription.plan !== 'free' && (
          <div className="mb-8 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 max-w-md mx-auto">
            <p className="text-sm text-purple-300">
              Tu plan actual: <span className="font-bold">{subscription.plan.toUpperCase()}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Uso este mes: {subscription.usage?.analysisCount || 0}/{subscription.limits?.analysisPerMonth || 0} análisis, {subscription.usage?.storiesCount || 0}/{subscription.limits?.storiesPerMonth || 0} stories
            </p>
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="container pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans?.map((plan: any) => {
            const Icon = PLAN_ICONS[plan.id as keyof typeof PLAN_ICONS] || Sparkles;
            const gradient = PLAN_COLORS[plan.id as keyof typeof PLAN_COLORS] || PLAN_COLORS.free;
            const isCurrentPlan = subscription?.plan === plan.id;
            const isPopular = plan.popular;

            return (
              <Card 
                key={plan.id}
                className={`relative bg-slate-900/50 border-slate-800 overflow-hidden transition-all hover:border-slate-700 ${
                  isPopular ? 'ring-2 ring-purple-500 scale-105' : ''
                } ${isCurrentPlan ? 'border-green-500/50' : ''}`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-xs font-medium text-white rounded-bl-lg">
                    Más Popular
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute top-0 left-0 px-3 py-1 bg-green-500/20 text-xs font-medium text-green-400 rounded-br-lg">
                    Tu Plan
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-400">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="pb-4">
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      €{formatPrice(plan.priceMonthly, plan.priceYearly)}
                    </span>
                    <span className="text-slate-400">/mes</span>
                    {isYearly && plan.priceMonthly > 0 && (
                      <p className="text-sm text-slate-500 mt-1">
                        Facturado anualmente (€{(plan.priceYearly / 100).toFixed(0)}/año)
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {FEATURES.map((feature) => {
                      const value = plan.features[feature.key];
                      const FeatureIcon = feature.icon;
                      
                      return (
                        <li key={feature.key} className="flex items-center gap-3">
                          <FeatureIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <span className="text-sm text-slate-300 flex-1">{feature.label}</span>
                          <span className="text-sm font-medium text-white">
                            {formatFeatureValue(feature.key, value)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button 
                    className={`w-full ${
                      isCurrentPlan 
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                        : plan.id === 'free'
                        ? 'bg-slate-700 hover:bg-slate-600'
                        : `bg-gradient-to-r ${gradient} hover:opacity-90`
                    }`}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrentPlan || loadingPlan === plan.id}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : isCurrentPlan ? (
                      'Plan Actual'
                    ) : plan.id === 'free' ? (
                      'Empezar Gratis'
                    ) : (
                      <>
                        Suscribirse
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container pb-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Preguntas Frecuentes</h2>
          
          <div className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">¿Puedo cambiar de plan en cualquier momento?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">
                  Sí, puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplicarán 
                  inmediatamente y se prorrateará el coste.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">¿Qué métodos de pago aceptan?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">
                  Aceptamos todas las tarjetas de crédito y débito principales (Visa, Mastercard, American Express) 
                  a través de Stripe, nuestra plataforma de pagos segura.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">¿Hay período de prueba?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">
                  Ofrecemos un plan gratuito con funcionalidades limitadas para que puedas probar la plataforma. 
                  Además, todos los planes de pago tienen garantía de devolución de 14 días.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">¿Cómo cancelo mi suscripción?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">
                  Puedes cancelar tu suscripción en cualquier momento desde tu panel de control. 
                  Seguirás teniendo acceso hasta el final de tu período de facturación actual.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
