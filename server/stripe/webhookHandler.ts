import { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe } from './stripe';
import { ENV } from '../_core/env';
import * as db from '../db';

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  
  if (!sig) {
    console.error('[Stripe Webhook] No signature provided');
    return res.status(400).json({ error: 'No signature provided' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      ENV.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  // Handle test events
  if (event.id.startsWith('evt_test_')) {
    console.log('[Stripe Webhook] Test event detected, returning verification response');
    return res.json({ verified: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('[Stripe] Checkout completed:', session.id);
  
  const userId = parseInt(session.client_reference_id || session.metadata?.user_id || '0');
  if (!userId) {
    console.error('[Stripe] No user ID found in session');
    return;
  }

  const planId = session.metadata?.plan_id || 'basic';
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Create or update subscription record
  await db.createOrUpdateSubscription(userId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    plan: planId as 'basic' | 'pro' | 'enterprise',
    status: 'active',
    analysisCount: 0,
    storiesCount: 0,
  });

  console.log(`[Stripe] Subscription created for user ${userId}, plan: ${planId}`);
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('[Stripe] Subscription updated:', subscription.id);
  
  const planId = subscription.metadata?.plan_id || 'basic';
  
  // Map Stripe status to our status
  let status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' = 'active';
  switch (subscription.status) {
    case 'active':
      status = 'active';
      break;
    case 'canceled':
      status = 'canceled';
      break;
    case 'past_due':
      status = 'past_due';
      break;
    case 'trialing':
      status = 'trialing';
      break;
    default:
      status = 'incomplete';
  }

  await db.updateSubscriptionByStripeId(subscription.id, {
    status,
    plan: planId as 'basic' | 'pro' | 'enterprise',
    currentPeriodEnd: new Date(((subscription as any).current_period_end || 0) * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  console.log(`[Stripe] Subscription ${subscription.id} updated to status: ${status}`);
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('[Stripe] Subscription deleted:', subscription.id);
  
  await db.updateSubscriptionByStripeId(subscription.id, {
    status: 'canceled',
    plan: 'free',
  });

  console.log(`[Stripe] Subscription ${subscription.id} marked as canceled`);
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('[Stripe] Invoice paid:', invoice.id);
  
  // Reset monthly usage counters on successful payment
  const subscriptionId = (invoice as any).subscription;
  if (subscriptionId) {
    const subscription = await db.getSubscriptionByStripeCustomerId(invoice.customer as string);
    if (subscription) {
      // Reset usage counters for the new billing period
      await db.createOrUpdateSubscription(subscription.userId, {
        analysisCount: 0,
        storiesCount: 0,
      });
      console.log(`[Stripe] Reset usage counters for subscription ${subscriptionId}`);
    }
  }
}

/**
 * Handle failed invoice payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('[Stripe] Payment failed for invoice:', invoice.id);
  
  const subscriptionId = (invoice as any).subscription;
  if (subscriptionId) {
    await db.updateSubscriptionByStripeId(subscriptionId as string, {
      status: 'past_due',
    });
    console.log(`[Stripe] Subscription ${subscriptionId} marked as past_due`);
  }
}
