import { describe, it, expect, vi } from 'vitest';
import { PLANS, getPlanById, canUseFeature } from './stripe/products';

describe('Stripe Products', () => {
  describe('PLANS', () => {
    it('should have all required plans', () => {
      expect(PLANS).toHaveProperty('free');
      expect(PLANS).toHaveProperty('basic');
      expect(PLANS).toHaveProperty('pro');
      expect(PLANS).toHaveProperty('enterprise');
    });

    it('should have correct pricing structure', () => {
      expect(PLANS.free.priceMonthly).toBe(0);
      expect(PLANS.basic.priceMonthly).toBe(2900); // 29€
      expect(PLANS.pro.priceMonthly).toBe(7900); // 79€
      expect(PLANS.enterprise.priceMonthly).toBe(19900); // 199€
    });

    it('should have yearly pricing with discount', () => {
      // Yearly should be ~10 months (2 months free)
      expect(PLANS.basic.priceYearly).toBe(29000);
      expect(PLANS.pro.priceYearly).toBe(79000);
      expect(PLANS.enterprise.priceYearly).toBe(199000);
    });

    it('should have correct features for each plan', () => {
      // Free plan
      expect(PLANS.free.features.analysisPerMonth).toBe(2);
      expect(PLANS.free.features.storiesPerMonth).toBe(5);
      expect(PLANS.free.features.prioritySupport).toBe(false);

      // Basic plan
      expect(PLANS.basic.features.analysisPerMonth).toBe(10);
      expect(PLANS.basic.features.storiesPerMonth).toBe(30);

      // Pro plan
      expect(PLANS.pro.features.analysisPerMonth).toBe(50);
      expect(PLANS.pro.features.storiesPerMonth).toBe(100);
      expect(PLANS.pro.features.prioritySupport).toBe(true);

      // Enterprise plan
      expect(PLANS.enterprise.features.analysisPerMonth).toBe(-1); // unlimited
      expect(PLANS.enterprise.features.storiesPerMonth).toBe(-1); // unlimited
      expect(PLANS.enterprise.features.apiAccess).toBe(true);
    });

    it('should mark pro plan as popular', () => {
      expect(PLANS.pro.popular).toBe(true);
      expect(PLANS.free.popular).toBeUndefined();
      expect(PLANS.basic.popular).toBeUndefined();
    });
  });

  describe('getPlanById', () => {
    it('should return correct plan by id', () => {
      expect(getPlanById('free')).toBe(PLANS.free);
      expect(getPlanById('basic')).toBe(PLANS.basic);
      expect(getPlanById('pro')).toBe(PLANS.pro);
      expect(getPlanById('enterprise')).toBe(PLANS.enterprise);
    });

    it('should return undefined for invalid plan id', () => {
      expect(getPlanById('invalid')).toBeUndefined();
      expect(getPlanById('')).toBeUndefined();
    });
  });

  describe('canUseFeature', () => {
    it('should return true for boolean features that are enabled', () => {
      expect(canUseFeature('pro', 'prioritySupport')).toBe(true);
      expect(canUseFeature('enterprise', 'apiAccess')).toBe(true);
      expect(canUseFeature('enterprise', 'customBranding')).toBe(true);
    });

    it('should return false for boolean features that are disabled', () => {
      expect(canUseFeature('free', 'prioritySupport')).toBe(false);
      expect(canUseFeature('basic', 'apiAccess')).toBe(false);
      expect(canUseFeature('pro', 'customBranding')).toBe(false);
    });

    it('should check usage limits correctly', () => {
      // Under limit
      expect(canUseFeature('free', 'analysisPerMonth', 1)).toBe(true);
      expect(canUseFeature('basic', 'analysisPerMonth', 5)).toBe(true);

      // At limit
      expect(canUseFeature('free', 'analysisPerMonth', 2)).toBe(false);
      expect(canUseFeature('basic', 'analysisPerMonth', 10)).toBe(false);

      // Over limit
      expect(canUseFeature('free', 'analysisPerMonth', 5)).toBe(false);
    });

    it('should always return true for unlimited features', () => {
      expect(canUseFeature('enterprise', 'analysisPerMonth', 1000)).toBe(true);
      expect(canUseFeature('enterprise', 'storiesPerMonth', 10000)).toBe(true);
    });

    it('should return false for invalid plan', () => {
      expect(canUseFeature('invalid', 'analysisPerMonth')).toBe(false);
    });
  });
});
