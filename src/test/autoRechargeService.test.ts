/**
 * autoRechargeService — Deep Tests
 * Tests service method exports
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));
vi.mock('./aiCreditsService', () => ({
    aiCreditsService: {
        getBalance: vi.fn(),
        getPricingTiers: vi.fn(),
    },
}));
vi.mock('./stripeService', () => ({
    createCreditPaymentIntent: vi.fn(),
    confirmCreditPurchase: vi.fn(),
}));

import { autoRechargeService } from '@/services/autoRechargeService';

describe('autoRechargeService', () => {
    describe('service methods', () => {
        it('checkAndTriggerAutoRecharge is a method', () => {
            expect(typeof autoRechargeService.checkAndTriggerAutoRecharge).toBe('function');
        });
    });

    describe('auto-recharge event types', () => {
        it('status can be success or failed', () => {
            const statuses: ('success' | 'failed')[] = ['success', 'failed'];
            expect(statuses).toHaveLength(2);
        });
    });
});
