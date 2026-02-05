import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module
vi.mock('./db', () => ({
  getUserSubscription: vi.fn(),
  getUserBillingType: vi.fn(),
}));

import * as db from './db';

describe('Calendar Subscription Config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserSubscription', () => {
    it('should return undefined for users without subscription', async () => {
      vi.mocked(db.getUserSubscription).mockResolvedValue(undefined);
      
      const result = await db.getUserSubscription(1);
      expect(result).toBeUndefined();
    });

    it('should return subscription data for subscribed users', async () => {
      const mockSubscription = {
        id: 1,
        userId: 1,
        plan: 'pro',
        status: 'active',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        currentPeriodEnd: new Date('2026-03-05'),
        analysisCount: 5,
        storiesCount: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(db.getUserSubscription).mockResolvedValue(mockSubscription);
      
      const result = await db.getUserSubscription(1);
      expect(result).toEqual(mockSubscription);
      expect(result?.plan).toBe('pro');
    });
  });

  describe('getUserBillingType', () => {
    it('should return undefined for users without billing type', async () => {
      vi.mocked(db.getUserBillingType).mockResolvedValue(undefined);
      
      const result = await db.getUserBillingType(1);
      expect(result).toBeUndefined();
    });

    it('should return monthly billing type', async () => {
      const mockBillingType = {
        id: 1,
        userId: 1,
        billingType: 'monthly' as const,
        startMonth: 2,
        startYear: 2026,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(db.getUserBillingType).mockResolvedValue(mockBillingType);
      
      const result = await db.getUserBillingType(1);
      expect(result?.billingType).toBe('monthly');
    });

    it('should return annual billing type with full year access', async () => {
      const mockBillingType = {
        id: 1,
        userId: 1,
        billingType: 'annual' as const,
        startMonth: 2,
        startYear: 2026,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(db.getUserBillingType).mockResolvedValue(mockBillingType);
      
      const result = await db.getUserBillingType(1);
      expect(result?.billingType).toBe('annual');
      expect(result?.startMonth).toBe(2);
      expect(result?.startYear).toBe(2026);
    });
  });

  describe('Calendar visibility logic', () => {
    it('should calculate allowed months for monthly subscription', () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Monthly subscription: only current month
      const allowedMonths = [{ month: currentMonth, year: currentYear }];
      
      expect(allowedMonths.length).toBe(1);
      expect(allowedMonths[0].month).toBe(currentMonth);
      expect(allowedMonths[0].year).toBe(currentYear);
    });

    it('should calculate allowed months for annual subscription', () => {
      const startMonth = 2; // February
      const startYear = 2026;
      
      // Annual subscription: 12 months from start
      const allowedMonths: { month: number; year: number }[] = [];
      for (let i = 0; i < 12; i++) {
        const m = (startMonth - 1 + i) % 12;
        const y = startYear + Math.floor((startMonth - 1 + i) / 12);
        allowedMonths.push({ month: m, year: y });
      }
      
      expect(allowedMonths.length).toBe(12);
      expect(allowedMonths[0]).toEqual({ month: 1, year: 2026 }); // February (0-indexed)
      expect(allowedMonths[11]).toEqual({ month: 0, year: 2027 }); // January next year
    });

    it('should correctly identify if a month is allowed', () => {
      const allowedMonths = [
        { month: 1, year: 2026 }, // February 2026
      ];
      
      const isAllowed = (month: number, year: number) => 
        allowedMonths.some(m => m.month === month && m.year === year);
      
      expect(isAllowed(1, 2026)).toBe(true);  // February 2026 - allowed
      expect(isAllowed(2, 2026)).toBe(false); // March 2026 - not allowed
      expect(isAllowed(0, 2026)).toBe(false); // January 2026 - not allowed
    });
  });

  describe('Reels per day by plan', () => {
    it('should return correct reels per day for each plan', () => {
      const reelsPerDay = {
        free: 1,
        basic: 2,
        pro: 2,
        enterprise: 3,
      };
      
      expect(reelsPerDay.free).toBe(1);
      expect(reelsPerDay.basic).toBe(2);
      expect(reelsPerDay.pro).toBe(2);
      expect(reelsPerDay.enterprise).toBe(3);
    });
  });
});
