import Stripe from 'stripe';
import { ENV } from '../_core/env';

// Initialize Stripe with the secret key
export const stripe = new Stripe(ENV.STRIPE_SECRET_KEY, {
  // @ts-ignore - Using latest API version
  apiVersion: '2024-12-18.acacia' as const,
});

// Product IDs - these will be created in Stripe Dashboard or via API
export const STRIPE_PRODUCTS = {
  basic: {
    monthly: 'price_basic_monthly',
    yearly: 'price_basic_yearly',
  },
  pro: {
    monthly: 'price_pro_monthly',
    yearly: 'price_pro_yearly',
  },
  enterprise: {
    monthly: 'price_enterprise_monthly',
    yearly: 'price_enterprise_yearly',
  },
};

/**
 * Create a Stripe Checkout Session for subscription
 */
export async function createCheckoutSession({
  userId,
  userEmail,
  userName,
  planId,
  billingPeriod,
  origin,
}: {
  userId: number;
  userEmail: string;
  userName: string;
  planId: 'basic' | 'pro' | 'enterprise';
  billingPeriod: 'monthly' | 'yearly';
  origin: string;
}): Promise<string> {
  // Get the price ID based on plan and billing period
  const priceId = STRIPE_PRODUCTS[planId]?.[billingPeriod];
  
  if (!priceId) {
    throw new Error(`Invalid plan: ${planId} with billing period: ${billingPeriod}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: userEmail,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      customer_email: userEmail,
      customer_name: userName,
      plan_id: planId,
      billing_period: billingPeriod,
    },
    allow_promotion_codes: true,
    success_url: `${origin}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?payment=cancelled`,
    subscription_data: {
      metadata: {
        user_id: userId.toString(),
        plan_id: planId,
      },
    },
  });

  return session.url!;
}

/**
 * Create a Stripe Customer Portal session for managing subscriptions
 */
export async function createPortalSession({
  customerId,
  origin,
}: {
  customerId: string;
  origin: string;
}): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/dashboard`,
  });

  return session.url;
}

/**
 * Get subscription details from Stripe
 */
export async function getSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Reactivate a cancelled subscription
 */
export async function reactivateSubscription(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}
