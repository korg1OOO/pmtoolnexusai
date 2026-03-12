/**
 * Service tests batch 14: tenantService (512 lines, 20+ functions)
 * Tenant CRUD, workspace CRUD, department CRUD, license CRUD, ML config, settings
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { ms, ch } = vi.hoisted(() => {
    const s = { data: null as any, error: null as any, count: null as any };
    const c: any = {};
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'like', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'gte', 'lte', 'gt', 'lt', 'not', 'is']
        .forEach(m => { c[m] = vi.fn(() => c); });
    c.then = (res: any, rej?: any) => Promise.resolve({ data: s.data, error: s.error, count: s.count }).then(res, rej);
    return { ms: s, ch: c };
});

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        ...ch, from: vi.fn(() => ch),
        rpc: vi.fn(() => Promise.resolve({ data: ms.data, error: ms.error })),
        auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'u1' } }, error: null })) },
        channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
        removeChannel: vi.fn(),
    },
}));

import * as tenantService from '@/services/tenantService';

beforeEach(() => {
    ms.data = null; ms.error = null; ms.count = null;
    vi.clearAllMocks();
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'like', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'gte', 'lte', 'gt', 'lt', 'not', 'is']
        .forEach(m => { ch[m].mockImplementation(() => ch); });
});

const sampleTenant = { id: 't1', name: 'Acme Corp', slug: 'acme', ml_config: { enabled: true }, subscription_tier: 'business', max_workspaces: 10, max_projects: 50, max_users: 100, created_at: '2024-01-01', updated_at: '2024-01-01', is_active: true };

describe('tenantService', () => {
    // === Tenant CRUD ===
    it('getTenant returns tenant', async () => {
        ms.data = sampleTenant;
        const r = await tenantService.getTenant('t1');
        expect(ch.eq).toHaveBeenCalled();
    });

    it('getTenantBySlug', async () => {
        ms.data = sampleTenant;
        const r = await tenantService.getTenantBySlug('acme');
        expect(ch.eq).toHaveBeenCalled();
    });

    it('createTenant', async () => {
        ms.data = sampleTenant;
        const r = await tenantService.createTenant({ name: 'Acme', slug: 'acme' });
        expect(ch.insert).toHaveBeenCalled();
    });

    it('createTenant throws on error', async () => {
        ms.error = { message: 'err' };
        await expect(tenantService.createTenant({ name: 'X', slug: 'x' })).rejects.toBeDefined();
    });

    it('getDefaultTenant', async () => {
        ms.data = sampleTenant;
        const r = await tenantService.getDefaultTenant();
        expect(r).toBeDefined();
    });

    // === ML Config ===
    it('getTenantMLConfig', async () => {
        ms.data = sampleTenant;
        const r = await tenantService.getTenantMLConfig('t1');
        expect(r).toBeDefined();
    });

    it('updateTenantMLConfig', async () => {
        ms.data = sampleTenant; ms.error = null;
        await tenantService.updateTenantMLConfig('t1', { enabled: false });
        expect(ch.update).toHaveBeenCalled();
    });

    // === Workspaces ===
    it('getWorkspaces', async () => {
        ms.data = [{ id: 'w1', name: 'Default' }];
        const r = await tenantService.getWorkspaces('t1');
        expect(ch.eq).toHaveBeenCalled();
    });

    it('createWorkspace', async () => {
        ms.data = { id: 'w1', name: 'New WS' };
        await tenantService.createWorkspace('t1', { name: 'New WS', slug: 'new-ws' });
        expect(ch.insert).toHaveBeenCalled();
    });

    it('updateWorkspace', async () => {
        ms.error = null;
        await tenantService.updateWorkspace('w1', { name: 'Updated' });
        expect(ch.update).toHaveBeenCalled();
    });

    it('deleteWorkspace', async () => {
        ms.error = null;
        await tenantService.deleteWorkspace('w1');
        expect(ch.delete).toHaveBeenCalled();
    });

    // === Settings ===
    it('getTenantSettings', async () => {
        ms.data = { theme: 'dark' };
        await tenantService.getTenantSettings('t1');
        expect(ch.eq).toHaveBeenCalled();
    });

    it('updateTenantSettings', async () => {
        ms.error = null;
        await tenantService.updateTenantSettings('t1', { theme: 'light' });
        expect(ch.update).toHaveBeenCalled();
    });

    // === Departments ===
    it('getDepartments', async () => {
        ms.data = [{ id: 'd1', name: 'Engineering' }];
        const r = await tenantService.getDepartments('t1');
        expect(ch.eq).toHaveBeenCalled();
    });

    it('createDepartment', async () => {
        ms.data = { id: 'd1', name: 'Engineering' };
        await tenantService.createDepartment('t1', { name: 'Engineering', member_count: 10 } as any);
        expect(ch.insert).toHaveBeenCalled();
    });

    it('updateDepartment', async () => {
        ms.data = { id: 'd1', name: 'Updated' };
        await tenantService.updateDepartment('d1', { name: 'Updated' });
        expect(ch.update).toHaveBeenCalled();
    });

    it('deleteDepartment', async () => {
        ms.error = null;
        await tenantService.deleteDepartment('d1');
        expect(ch.delete).toHaveBeenCalled();
    });

    // === Licenses ===
    it('getLicenses', async () => {
        ms.data = [{ id: 'l1', license_type: 'pro' }];
        const r = await tenantService.getLicenses('t1');
        expect(ch.eq).toHaveBeenCalled();
    });

    it('createLicense', async () => {
        ms.data = { id: 'l1' };
        await tenantService.createLicense('t1', { license_type: 'pro', total_licenses: 100, allocated_licenses: 0, status: 'active' } as any);
        expect(ch.insert).toHaveBeenCalled();
    });

    // === Overview ===
    it('getTenantOverview', async () => {
        ms.data = { total_workspaces: 3, total_users: 25 };
        const r = await tenantService.getTenantOverview('t1');
        expect(r).toBeDefined();
    });
});
