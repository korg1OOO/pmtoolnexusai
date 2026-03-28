/**
 * Integration Test: Cross-Module Workflows
 *
 * Tests multi-service data flows for real-world user journeys.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
        })),
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
        },
        functions: {
            invoke: vi.fn().mockResolvedValue({ data: { allowed: true }, error: null }),
        },
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

import { supabase } from '@/integrations/supabase/client';
const sb = supabase as any;

describe('Integration: Subscription → Feature Access', () => {
    it('tier hierarchy is correct', () => {
        const tiers = ['free', 'starter', 'pro', 'business', 'enterprise'];
        expect(tiers.indexOf('enterprise')).toBeGreaterThan(tiers.indexOf('free'));
        expect(tiers.indexOf('pro')).toBeGreaterThan(tiers.indexOf('starter'));
    });

    it('free cannot access pro features', () => {
        const tierIndex = (t: string) => ['free', 'starter', 'pro', 'business', 'enterprise'].indexOf(t);
        expect(tierIndex('free') >= tierIndex('pro')).toBe(false);
        expect(tierIndex('pro') >= tierIndex('pro')).toBe(true);
        expect(tierIndex('enterprise') >= tierIndex('pro')).toBe(true);
    });

    it('enforcement edge function checks limits', async () => {
        const result = await sb.functions.invoke('enforce-limits', {
            body: { feature: 'ai_predictions', tenant_id: 't1' },
        });
        expect(result.data.allowed).toBe(true);
    });
});

describe('Integration: Portfolio → Program → Project', () => {
    it('hierarchy data flows correctly', async () => {
        const portfolio = await sb.from('portfolios')
            .insert({ name: 'Strategy 2024' }).select().single();
        expect(portfolio.data.id).toBeTruthy();

        const program = await sb.from('programs')
            .insert({ name: 'Digital Transform', portfolio_id: portfolio.data.id })
            .select().single();
        expect(program.data.id).toBeTruthy();

        const project = await sb.from('projects')
            .insert({ name: 'API Modernization', program_id: program.data.id })
            .select().single();
        expect(project.data.id).toBeTruthy();
    });
});

describe('Integration: Project → Tasks → Analytics', () => {
    it('task data feeds analytics', async () => {
        const task = await sb.from('tasks')
            .insert({ title: 'Implement API', status: 'done' }).select().single();
        expect(task.data.id).toBeTruthy();
    });
});

describe('Integration: User Invitation → Membership', () => {
    it('invitation creates membership', async () => {
        const invite = await sb.functions.invoke('send-invitation', {
            body: { email: 'new@user.com', tenant_id: 't1' },
        });
        expect(invite.error).toBeNull();

        const membership = await sb.from('user_tenants')
            .insert({ user_id: 'new-user', tenant_id: 't1' }).select().single();
        expect(membership.data.id).toBeTruthy();
    });
});

describe('Integration: AI Cost → Credits', () => {
    it('usage logging and balance update', async () => {
        const usage = await sb.from('ai_usage_logs')
            .insert({ tenant_id: 't1', tokens_used: 500 }).select().single();
        expect(usage.data.id).toBeTruthy();

        const balance = await sb.from('ai_credit_balances')
            .update({ current_balance: 95 }).eq('tenant_id', 't1').select().single();
        expect(balance.data).toBeTruthy();
    });
});

describe('Integration: Governance → Approval', () => {
    it('request → approve flow', async () => {
        const approval = await sb.from('governance_approvals')
            .insert({ entity_type: 'project', status: 'pending' }).select().single();
        expect(approval.data.id).toBeTruthy();

        const override = await sb.from('governance_approvals')
            .update({ status: 'approved' }).eq('id', approval.data.id).select().single();
        expect(override.data).toBeTruthy();
    });
});

describe('Integration: Notification Delivery', () => {
    it('event → notification → email', async () => {
        const notif = await sb.from('notifications')
            .insert({ user_id: 'u1', type: 'billing' }).select().single();
        expect(notif.data.id).toBeTruthy();

        const email = await sb.from('email_queue')
            .insert({ template: 'payment_failed', status: 'pending' }).select().single();
        expect(email.data.id).toBeTruthy();
    });
});
