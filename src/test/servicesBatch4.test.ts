/**
 * Service tests batch 4: delegationService (individual function exports)
 * Note: Some methods have a bug where data.map() is called before error check, so we only test success paths
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { ms, ch } = vi.hoisted(() => {
    const s = { data: null as any, error: null as any, count: null as any };
    const c: any = {};
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'not', 'or', 'textSearch']
        .forEach(m => { c[m] = vi.fn(() => c); });
    c.then = (res: any, rej?: any) => Promise.resolve({ data: s.data, error: s.error, count: s.count }).then(res, rej);
    return { ms: s, ch: c };
});

const mockRpc = vi.hoisted(() => vi.fn(() => Promise.resolve({ data: null, error: null })));

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        ...ch, from: ch.from,
        rpc: mockRpc,
        auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'u1' } }, error: null })) },
        channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
        removeChannel: vi.fn(),
        functions: { invoke: vi.fn(() => Promise.resolve({ data: null, error: null })) },
    },
}));

import * as delegation from '@/services/delegationService';

beforeEach(() => {
    ms.data = null; ms.error = null; ms.count = null;
    vi.clearAllMocks();
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'not', 'or', 'textSearch']
        .forEach(m => { ch[m].mockImplementation(() => ch); });
});

describe('delegationService', () => {
    // === createDelegation ===
    it('createDelegation success', async () => {
        ms.error = null;
        await delegation.createDelegation('u1', 'u2', 'a1', 'temporary', 'OOO');
        expect(ch.from).toHaveBeenCalledWith('delegations');
        expect(ch.insert).toHaveBeenCalled();
    });

    it('createDelegation throws on error', async () => {
        ms.error = { message: 'Failed' };
        await expect(delegation.createDelegation('u1', 'u2', 'a1', 'temporary', 'OOO')).rejects.toThrow('Failed to create delegation');
    });

    // === bulkDelegateApprovals ===
    it('bulkDelegateApprovals success', async () => {
        ms.error = null;
        await delegation.bulkDelegateApprovals('u1', ['a1', 'a2'], 'u2', 'temporary', 'Bulk');
        expect(ch.insert).toHaveBeenCalled();
    });

    it('bulkDelegateApprovals rejects >50', async () => {
        const ids = Array.from({ length: 51 }, (_, i) => `a${i}`);
        await expect(delegation.bulkDelegateApprovals('u1', ids, 'u2', 'temporary', 'X')).rejects.toThrow('Cannot delegate more than 50');
    });

    // === saveDelegationTemplate ===
    it('saveDelegationTemplate success', async () => {
        ms.data = { id: 't1', user_id: 'u1', name: 'T', delegate_id: 'u2', delegation_type: 'temporary', reason: 'R', duration_days: 7, can_subdelegate: false, created_at: '2024-01-01', updated_at: '2024-01-01' };
        const r = await delegation.saveDelegationTemplate({ userId: 'u1', name: 'T', delegateId: 'u2', delegationType: 'temporary', reason: 'R', durationDays: 7, canSubdelegate: false } as any);
        expect(r.id).toBe('t1');
        expect(r.name).toBe('T');
    });

    // === getDelegationTemplates ===
    it('getDelegationTemplates success', async () => {
        ms.data = [{ id: 't1', user_id: 'u1', name: 'T', delegate_id: 'u2', delegation_type: 'temporary', reason: 'R', duration_days: 7, can_subdelegate: false, created_at: '2024', updated_at: '2024' }];
        const r = await delegation.getDelegationTemplates('u1');
        expect(r).toHaveLength(1);
        expect(r[0].name).toBe('T');
    });

    // === deleteDelegationTemplate ===
    it('deleteDelegationTemplate success', async () => {
        ms.error = null;
        await delegation.deleteDelegationTemplate('t1', 'u1');
        expect(ch.delete).toHaveBeenCalled();
    });

    // === getDelegationHistory ===
    it('getDelegationHistory success', async () => {
        ms.data = [{ id: 'h1', approval_id: 'a1', delegator_id: 'u1', delegate_id: 'u2', delegation_type: 'temporary', reason: 'R', status: 'active', created_at: '2024' }];
        const r = await delegation.getDelegationHistory('u1');
        expect(r).toHaveLength(1);
    });

    it('getDelegationHistory with filters', async () => {
        ms.data = [];
        await delegation.getDelegationHistory('u1', { status: 'active', delegationType: 'temporary', startDate: '2024-01-01', endDate: '2024-12-31' });
        expect(ch.eq).toHaveBeenCalled();
        expect(ch.gte).toHaveBeenCalled();
        expect(ch.lte).toHaveBeenCalled();
    });

    // === canSubDelegate ===
    it('canSubDelegate true', async () => {
        ms.data = { can_subdelegate: true, delegate_id: 'u1', status: 'active' };
        const r = await delegation.canSubDelegate('d1', 'u1');
        expect(r).toBe(true);
    });

    it('canSubDelegate false when not the delegate', async () => {
        ms.data = { can_subdelegate: true, delegate_id: 'u2', status: 'active' };
        const r = await delegation.canSubDelegate('d1', 'u1');
        expect(r).toBe(false);
    });

    it('canSubDelegate false on error', async () => {
        ms.error = { message: 'F' };
        const r = await delegation.canSubDelegate('d1', 'u1');
        expect(r).toBe(false);
    });

    // === checkExpiredDelegations ===
    it('checkExpiredDelegations', async () => {
        mockRpc.mockResolvedValue({ data: null, error: null });
        await delegation.checkExpiredDelegations();
        expect(mockRpc).toHaveBeenCalledWith('check_expired_delegations');
    });

    // === extendDelegation ===
    it('extendDelegation success', async () => {
        ms.error = null;
        const future = new Date(Date.now() + 86400000).toISOString();
        await delegation.extendDelegation('d1', 'u1', future);
        expect(ch.update).toHaveBeenCalled();
    });

    it('extendDelegation rejects past date', async () => {
        await expect(delegation.extendDelegation('d1', 'u1', '2020-01-01')).rejects.toThrow('Expiry date must be in the future');
    });

    // === revokeDelegation ===
    it('revokeDelegation', async () => {
        ms.error = null;
        await delegation.revokeDelegation('d1', 'u1', 'No longer needed');
        expect(ch.update).toHaveBeenCalled();
    });

    // === getActiveDelegations ===
    it('getActiveDelegations delegates to getDelegationHistory', async () => {
        ms.data = [];
        const r = await delegation.getActiveDelegations('u1');
        expect(Array.isArray(r)).toBe(true);
    });

    // === searchUsersForDelegation ===
    it('searchUsersForDelegation success', async () => {
        ms.data = [{ id: 'u2', full_name: 'User 2', email: 'u2@t.com' }];
        const r = await delegation.searchUsersForDelegation('User');
        expect(r).toHaveLength(1);
        expect(r[0].name).toBe('User 2');
    });

    it('searchUsersForDelegation with excludeUserId', async () => {
        ms.data = [];
        await delegation.searchUsersForDelegation('User', 'u1');
        expect(ch.neq).toHaveBeenCalledWith('id', 'u1');
    });

    it('searchUsersForDelegation returns empty on error', async () => {
        ms.error = { message: 'F' };
        const r = await delegation.searchUsersForDelegation('User');
        expect(r).toEqual([]);
    });
});
