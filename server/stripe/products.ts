/**
 * Stripe Products and Pricing Configuration
 * 
 * Plans are designed with margins for profitability:
 * - Basic: Entry level for small businesses
 * - Pro: Most popular, best value
 * - Enterprise: For agencies and large teams
 */

export interface PlanFeatures {
  analysisPerMonth: number;
  storiesPerMonth: number;
  libraryAccess: boolean;
  calendarAccess: boolean;
  prioritySupport: boolean;
  teamMembers: number;
  customBranding: boolean;
  apiAccess: boolean;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number; // in cents
  priceYearly: number; // in cents (annual price, not per month)
  features: PlanFeatures;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  popular?: boolean;
}

export const PLANS: Record<string, Plan> = {
  free: {
    id: 'free',
    name: 'Gratis',
    description: 'Perfecto para probar la plataforma',
    priceMonthly: 0,
    priceYearly: 0,
    features: {
      analysisPerMonth: 2,
      storiesPerMonth: 5,
      libraryAccess: true,
      calendarAccess: true,
      prioritySupport: false,
      teamMembers: 1,
      customBranding: false,
      apiAccess: false,
    },
  },
  basic: {
    id: 'basic',
    name: 'Básico',
    description: 'Para negocios que empiezan con el marketing viral',
    priceMonthly: 2900, // 29€/mes
    priceYearly: 29000, // 290€/año (2 meses gratis)
    features: {
      analysisPerMonth: 10,
      storiesPerMonth: 30,
      libraryAccess: true,
      calendarAccess: true,
      prioritySupport: false,
      teamMembers: 1,
      customBranding: false,
      apiAccess: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'El más popular para negocios en crecimiento',
    priceMonthly: 7900, // 79€/mes
    priceYearly: 79000, // 790€/año (2 meses gratis)
    popular: true,
    features: {
      analysisPerMonth: 50,
      storiesPerMonth: 100,
      libraryAccess: true,
      calendarAccess: true,
      prioritySupport: true,
      teamMembers: 3,
      customBranding: false,
      apiAccess: false,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para agencias y equipos grandes',
    priceMonthly: 19900, // 199€/mes
    priceYearly: 199000, // 1990€/año (2 meses gratis)
    features: {
      analysisPerMonth: -1, // unlimited
      storiesPerMonth: -1, // unlimited
      libraryAccess: true,
      calendarAccess: true,
      prioritySupport: true,
      teamMembers: 10,
      customBranding: true,
      apiAccess: true,
    },
  },
};

export const PLAN_LIMITS = {
  free: { analysis: 2, stories: 5, calendarMonths: 1, reelsPerDay: 1 },
  basic: { analysis: 10, stories: 30, calendarMonths: 1, reelsPerDay: 2 },
  pro: { analysis: 50, stories: 100, calendarMonths: 1, reelsPerDay: 2 },
  enterprise: { analysis: -1, stories: -1, calendarMonths: 12, reelsPerDay: 3 }, // -1 = unlimited
};

// Calendar visibility rules:
// - Monthly plans: Only current month visible
// - Annual plans: Full year visible
// - Free: Only current month, 1 reel per day
export const CALENDAR_CONFIG = {
  monthlySubscription: {
    visibleMonths: 1, // Only current month
    reelsPerDayByPlan: {
      free: 1,
      basic: 2,
      pro: 2,
      enterprise: 3,
    }
  },
  annualSubscription: {
    visibleMonths: 12, // Full year
    reelsPerDayByPlan: {
      free: 1,
      basic: 2,
      pro: 2,
      enterprise: 3,
    }
  }
};

export function getPlanById(planId: string): Plan | undefined {
  return PLANS[planId];
}

export function canUseFeature(
  plan: string,
  feature: keyof PlanFeatures,
  currentUsage?: number
): boolean {
  const planData = PLANS[plan];
  if (!planData) return false;

  const featureValue = planData.features[feature];
  
  // Boolean features
  if (typeof featureValue === 'boolean') {
    return featureValue;
  }
  
  // Numeric features (limits)
  if (typeof featureValue === 'number') {
    if (featureValue === -1) return true; // unlimited
    if (currentUsage === undefined) return featureValue > 0;
    return currentUsage < featureValue;
  }
  
  return false;
}
