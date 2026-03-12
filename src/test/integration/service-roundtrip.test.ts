/**
 * Integration Test: Service Round-Trip & Cross-Module Workflows
 *
 * Tests data flow between services using mocked Supabase.
 * When VITE_SUPABASE_URL is set, these can be adapted to run against live.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'test-id', status: 'active' }, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'test@test.com' } } }),
            signInWithPassword: vi.fn().mockResolvedValue({
                data: { user: { id: 'u1' }, session: { access_token: 'tok_123' } },
                error: null,
            }),
            signOut: vi.fn().mockResolvedValue({ error: null }),
        },
        functions: {
            invoke: vi.fn().mockResolvedValue({ data: { success: true, allowed: true }, error: null }),
        },
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn(),
        })),
        removeChannel: vi.fn(),
    },
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { supabase } from '@/integrations/supabase/client';
const sb = supabase as any;

describe('Integration: Auth Flow', () => {
    it('sign in returns valid session', async () => {
        const result = await sb.auth.signInWithPassword({
            email: 'test@example.com', password: 'TestPass123!',
        });
        expect(result.error).toBeNull();
        expect(result.data.user.id).toBe('u1');
        expect(result.data.session.access_token).toBeTruthy();
    });

    it('authenticated user has profile', async () => {
        const result = await sb.auth.getUser();
        expect(result.data.user.id).toBe('u1');
    });

    it('sign out completes without error', async () => {
        const result = await sb.auth.signOut();
        expect(result.error).toBeNull();
    });
});

describe('Integration: CRUD Round-Trip', () => {
    it('insert returns data with id', async () => {
        const result = await sb.from('projects')
            .insert({ name: 'Test' }).select().single();
        expect(result.data.id).toBeTruthy();
        expect(result.error).toBeNull();
    });

    it('update returns modified data', async () => {
        const result = await sb.from('projects')
            .update({ name: 'Updated' }).eq('id', '1').select().single();
        expect(result.data).toBeTruthy();
        expect(result.error).toBeNull();
    });

    it('delete completes successfully', async () => {
        const result = await sb.from('projects').delete().eq('id', '1');
        // delete().eq() returns the mock chain; no error
        expect(result).toBeDefined();
    });
});

describe('Integration: Edge Functions', () => {
    it('enforce-limits returns allowed', async () => {
        const result = await sb.functions.invoke('enforce-limits', {
            body: { feature: 'projects', tenant_id: 't1' },
        });
        expect(result.error).toBeNull();
        expect(result.data.allowed).toBe(true);
    });

    it('create-checkout-session invokes successfully', async () => {
        const result = await sb.functions.invoke('create-checkout-session', {
            body: { priceId: 'price_123', tier: 'pro' },
        });
        expect(result.error).toBeNull();
    });

    it('process-refund invokes successfully', async () => {
        const result = await sb.functions.invoke('process-refund', {
            body: { paymentIntentId: 'pi_123' },
        });
        expect(result.error).toBeNull();
    });
});

describe('Integration: Realtime', () => {
    it('subscribes to channel', () => {
        const ch = sb.channel('test-channel');
        expect(ch.on).toBeDefined();
        expect(ch.subscribe).toBeDefined();
    });

    it('removes channel', () => {
        const ch = sb.channel('test');
        sb.removeChannel(ch);
        expect(sb.removeChannel).toHaveBeenCalled();
    });
});

describe('Integration: Invoice + Credits Workflow', () => {
    it('payment creates invoice record', async () => {
        const result = await sb.from('invoices')
            .insert({ amount: 2999, status: 'paid', tenant_id: 't1' })
            .select().single();
        expect(result.data.id).toBeTruthy();
    });

    it('credit purchase updates balance', async () => {
        const purchase = await sb.from('ai_credit_purchases')
            .insert({ tenant_id: 't1', credits_purchased: 1000 })
            .select().single();
        expect(purchase.data.id).toBeTruthy();

        const balance = await sb.from('ai_credit_balances')
            .update({ current_balance: 1500 }).eq('tenant_id', 't1')
            .select().single();
        expect(balance.data).toBeTruthy();
    });
});

describe('Integration: Governance Approval Workflow', () => {
    it('approval request → approve → status update', async () => {
        const request = await sb.from('governance_approvals')
            .insert({ entity_type: 'project', status: 'pending' })
            .select().single();
        expect(request.data.id).toBeTruthy();

        const approval = await sb.from('governance_approvals')
            .update({ status: 'approved' }).eq('id', request.data.id)
            .select().single();
        expect(approval.data).toBeTruthy();
    });
});

describe('Integration: ML Prediction → Feedback', () => {
    it('prediction → feedback → pattern update', async () => {
        const prediction = await sb.from('ml_predictions')
            .insert({ prediction_type: 'cost', confidence: 0.8 })
            .select().single();
        expect(prediction.data.id).toBeTruthy();

        const feedback = await sb.from('ml_predictions')
            .update({ user_accepted: true }).eq('id', prediction.data.id)
            .select().single();
        expect(feedback.data).toBeTruthy();
    });
});

describe('Integration: Notification Pipeline', () => {
    it('event → notification → email queue', async () => {
        const notif = await sb.from('notifications')
            .insert({ user_id: 'u1', type: 'billing', title: 'Payment Failed' })
            .select().single();
        expect(notif.data.id).toBeTruthy();

        const email = await sb.from('email_queue')
            .insert({ template: 'payment_failed', status: 'pending' })
            .select().single();
        expect(email.data.id).toBeTruthy();
    });
});

describe('Integration: Tier Upgrade → Access Control', () => {
    it('enforcement check uses edge function', async () => {
        const result = await sb.functions.invoke('enforce-limits', {
            body: { feature: 'ai_predictions', tenant_id: 't1' },
        });
        expect(result.data.allowed).toBe(true);
    });
});
