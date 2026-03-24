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
  // DEMO MODE: Return enterprise plan for all users
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    return {
      plan: 'enterprise',
      status: 'active',
      features: PLANS.enterprise.features,
      usage: {
        analysisCount: 0,
        storiesCount: 0,
      },
      limits: {
        analysisPerMonth: -1, // unlimited
        storiesPerMonth: -1, // unlimited
      },
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
  // DEMO MODE: Always return true - no restrictions
  canUseFeature: protectedProcedure
    .input(z.object({
      feature: z.enum(['analysisPerMonth', 'storiesPerMonth', 'prioritySupport', 'teamMembers', 'customBranding', 'apiAccess']),
    }))
    .query(async ({ ctx, input }) => {
      return true; // DEMO MODE: All features unlocked
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
