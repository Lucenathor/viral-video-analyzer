import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { stripe, createCheckoutSession, createPortalSession } from "../stripe/stripe";
import { PLANS, getPlanById, canUseFeature } from "../stripe/products";
import * as db from "../db";

/**
 * Stripe Router - Handles all payment and subscription related endpoints
 */
export const stripeRouter = router({
  // Get available plans
  getPlans: publicProcedure.query(() => {
    return Object.values(PLANS);
  }),

  // Get current user's subscription status
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await db.getUserSubscription(ctx.user.id);
    
    if (!subscription) {
      // Return free plan by default
      return {
        plan: 'free',
        status: 'active',
        features: PLANS.free.features,
        usage: {
          analysisCount: 0,
          storiesCount: 0,
        },
        limits: {
          analysisPerMonth: PLANS.free.features.analysisPerMonth,
          storiesPerMonth: PLANS.free.features.storiesPerMonth,
        },
      };
    }

    const planData = getPlanById(subscription.plan);
    
    return {
      plan: subscription.plan,
      status: subscription.status,
      features: planData?.features || PLANS.free.features,
      usage: {
        analysisCount: subscription.analysisCount,
        storiesCount: subscription.storiesCount,
      },
      limits: {
        analysisPerMonth: planData?.features.analysisPerMonth || 2,
        storiesPerMonth: planData?.features.storiesPerMonth || 5,
      },
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      stripeCustomerId: subscription.stripeCustomerId,
    };
  }),

  // Create checkout session for subscription
  createCheckout: protectedProcedure
    .input(z.object({
      planId: z.enum(['basic', 'pro', 'enterprise']),
      billingPeriod: z.enum(['monthly', 'yearly']),
    }))
    .mutation(async ({ ctx, input }) => {
      const origin = ctx.req.headers.origin || 'http://localhost:3000';
      
      const checkoutUrl = await createCheckoutSession({
        userId: ctx.user.id,
        userEmail: ctx.user.email || '',
        userName: ctx.user.name || '',
        planId: input.planId,
        billingPeriod: input.billingPeriod,
        origin,
      });

      return { url: checkoutUrl };
    }),

  // Create customer portal session for managing subscription
  createPortal: protectedProcedure.mutation(async ({ ctx }) => {
    const subscription = await db.getUserSubscription(ctx.user.id);
    
    if (!subscription?.stripeCustomerId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No tienes una suscripción activa',
      });
    }

    const origin = ctx.req.headers.origin || 'http://localhost:3000';
    const portalUrl = await createPortalSession({
      customerId: subscription.stripeCustomerId,
      origin,
    });

    return { url: portalUrl };
  }),

  // Check if user can use a feature based on their plan
  canUseFeature: protectedProcedure
    .input(z.object({
      feature: z.enum(['analysisPerMonth', 'storiesPerMonth', 'prioritySupport', 'teamMembers', 'customBranding', 'apiAccess']),
    }))
    .query(async ({ ctx, input }) => {
      const subscription = await db.getUserSubscription(ctx.user.id);
      const plan = subscription?.plan || 'free';
      
      let currentUsage: number | undefined;
      if (input.feature === 'analysisPerMonth') {
        currentUsage = subscription?.analysisCount || 0;
      } else if (input.feature === 'storiesPerMonth') {
        currentUsage = subscription?.storiesCount || 0;
      }

      return canUseFeature(plan, input.feature, currentUsage);
    }),

  // Increment usage counter
  incrementUsage: protectedProcedure
    .input(z.object({
      type: z.enum(['analysis', 'stories']),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.incrementSubscriptionUsage(ctx.user.id, input.type);
      return { success: true };
    }),
});
