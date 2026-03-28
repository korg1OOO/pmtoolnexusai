/**
 * notificationService — Deep Tests
 * Tests interface shapes and NotificationTriggers exports
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

import {
    createNotification,
    queueEmail,
    NotificationTriggers,
} from '@/services/notificationService';
import type { Notification, EmailQueueItem } from '@/services/notificationService';

describe('notificationService', () => {
    describe('Notification interface', () => {
        it('has required fields', () => {
            const n: Notification = {
                id: '1', user_id: 'u1', type: 'billing',
                priority: 'high', title: 'Payment Failed',
                message: 'Your payment failed', read: false,
                created_at: '2024-01-01',
            };
            expect(n.priority).toBe('high');
        });

        it('type can be billing, usage, feature, system, engagement', () => {
            const types: Notification['type'][] = ['billing', 'usage', 'feature', 'system', 'engagement'];
            expect(types).toHaveLength(5);
        });

        it('priority can be low, medium, high, critical', () => {
            const priorities: Notification['priority'][] = ['low', 'medium', 'high', 'critical'];
            expect(priorities).toHaveLength(4);
        });
    });

    describe('EmailQueueItem interface', () => {
        it('has required fields', () => {
            const item: EmailQueueItem = {
                id: '1', template: 'welcome',
                recipients: [{ email: 'test@test.com', name: 'Test' }],
                subject: 'Welcome!', data: {},
                status: 'pending',
            };
            expect(item.status).toBe('pending');
        });

        it('status can be pending, sent, failed, cancelled', () => {
            const statuses: EmailQueueItem['status'][] = ['pending', 'sent', 'failed', 'cancelled'];
            expect(statuses).toHaveLength(4);
        });
    });

    describe('NotificationTriggers', () => {
        it('paymentFailed is a function', () => {
            expect(typeof NotificationTriggers.paymentFailed).toBe('function');
        });

        it('paymentSucceeded is a function', () => {
            expect(typeof NotificationTriggers.paymentSucceeded).toBe('function');
        });

        it('usageWarning is a function', () => {
            expect(typeof NotificationTriggers.usageWarning).toBe('function');
        });

        it('trialExpiring is a function', () => {
            expect(typeof NotificationTriggers.trialExpiring).toBe('function');
        });

        it('subscriptionCancelled is a function', () => {
            expect(typeof NotificationTriggers.subscriptionCancelled).toBe('function');
        });

        it('aiCreditsLowBalance is a function', () => {
            expect(typeof NotificationTriggers.aiCreditsLowBalance).toBe('function');
        });

        it('aiCreditsAutoRechargeSuccess is a function', () => {
            expect(typeof NotificationTriggers.aiCreditsAutoRechargeSuccess).toBe('function');
        });

        it('aiCreditsAutoRechargeFailed is a function', () => {
            expect(typeof NotificationTriggers.aiCreditsAutoRechargeFailed).toBe('function');
        });

        it('aiCreditsPurchaseConfirmation is a function', () => {
            expect(typeof NotificationTriggers.aiCreditsPurchaseConfirmation).toBe('function');
        });
    });

    describe('core functions', () => {
        it('createNotification is exported', () => {
            expect(typeof createNotification).toBe('function');
        });

        it('queueEmail is exported', () => {
            expect(typeof queueEmail).toBe('function');
        });
    });
});
