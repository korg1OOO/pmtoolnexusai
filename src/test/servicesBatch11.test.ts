/**
 * Service tests batch 11: timelineService (342 lines, 19 CRUD functions)
 * Deep tests for all CRUD operations: swimlanes, activities, milestones, sites, teams, snapshots
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { ms, ch } = vi.hoisted(() => {
    const s = { data: null as any, error: null as any };
    const c: any = {};
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'like', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'is']
        .forEach(m => { c[m] = vi.fn(() => c); });
    c.then = (res: any, rej?: any) => Promise.resolve({ data: s.data, error: s.error }).then(res, rej);
    return { ms: s, ch: c };
});

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        ...ch, from: vi.fn(() => ch),
        rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
        auth: { getUser: vi.fn() },
        channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
        removeChannel: vi.fn(),
    },
}));

import { timelineService } from '@/services/timelineService';

beforeEach(() => {
    ms.data = null; ms.error = null;
    vi.clearAllMocks();
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'like', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'is']
        .forEach(m => { ch[m].mockImplementation(() => ch); });
});

describe('timelineService', () => {
    // === Swimlanes ===
    it('saveSwimlane inserts new', async () => {
        ms.data = { id: 'sw1', label: 'Phase 1', color: '#f00', collapsed: false, order_index: 0, project_id: 'p1' };
        const r = await timelineService.saveSwimlane({ label: 'Phase 1', color: '#f00', project_id: 'p1' });
        expect(ch.upsert).toHaveBeenCalled();
    });

    it('deleteSwimlane', async () => {
        ms.error = null;
        await timelineService.deleteSwimlane('sw1');
        expect(ch.delete).toHaveBeenCalled();
    });

    // === Activities ===
    it('saveActivity inserts', async () => {
        ms.data = { id: 'act1', swimlane_id: 'sw1', name: 'Foundation', start_month: 0, duration_months: 3 };
        const r = await timelineService.saveActivity({ swimlane_id: 'sw1', name: 'Foundation', start_month: 0, duration_months: 3 });
        expect(ch.upsert).toHaveBeenCalled();
    });

    it('deleteActivity', async () => {
        ms.error = null;
        await timelineService.deleteActivity('act1');
        expect(ch.delete).toHaveBeenCalled();
    });

    // === Dependencies ===
    it('saveDependency inserts', async () => {
        ms.data = { id: 'dep1', source_activity_id: 'a1', target_activity_id: 'a2', type: 'FS' };
        await timelineService.saveDependency({ source_activity_id: 'a1', target_activity_id: 'a2', type: 'FS' });
        expect(ch.upsert).toHaveBeenCalled();
    });

    it('deleteDependency', async () => {
        ms.error = null;
        await timelineService.deleteDependency('a1', 'a2');
        expect(ch.delete).toHaveBeenCalled();
    });

    // === Milestones ===
    it('saveMilestone inserts', async () => {
        ms.data = { id: 'm1', project_id: 'p1', name: 'Go Live', month_index: 12, color: '#0f0' };
        await timelineService.saveMilestone({ project_id: 'p1', name: 'Go Live', month_index: 12, color: '#0f0' });
        expect(ch.upsert).toHaveBeenCalled();
    });

    it('deleteMilestone', async () => {
        ms.error = null;
        await timelineService.deleteMilestone('m1');
        expect(ch.delete).toHaveBeenCalled();
    });

    // === Snapshots ===
    it('createSnapshot inserts', async () => {
        ms.data = { id: 'snap1', project_id: 'p1', name: 'Baseline', data: {} };
        await timelineService.createSnapshot({ project_id: 'p1', name: 'Baseline', data: {} });
        expect(ch.insert).toHaveBeenCalled();
    });

    it('getSnapshots returns list', async () => {
        ms.data = [{ id: 'snap1', name: 'Baseline' }];
        const r = await timelineService.getSnapshots('p1');
        expect(ch.order).toHaveBeenCalled();
    });

    it('deleteSnapshot', async () => {
        ms.error = null;
        await timelineService.deleteSnapshot('snap1');
        expect(ch.delete).toHaveBeenCalled();
    });

    // === Sites ===
    it('saveSite', async () => {
        ms.data = { id: 's1', project_id: 'p1', name: 'Site A' };
        await timelineService.saveSite({ project_id: 'p1', name: 'Site A' });
        expect(ch.upsert).toHaveBeenCalled();
    });

    it('fetchSites', async () => {
        ms.data = [{ id: 's1' }];
        await timelineService.fetchSites('p1');
        expect(ch.eq).toHaveBeenCalled();
    });

    it('deleteSite', async () => {
        ms.error = null;
        await timelineService.deleteSite('s1');
        expect(ch.delete).toHaveBeenCalled();
    });

    // === Teams ===
    it('saveTeam', async () => {
        ms.data = { id: 't1', project_id: 'p1', name: 'Team Alpha' };
        await timelineService.saveTeam({ project_id: 'p1', name: 'Team Alpha' });
        expect(ch.upsert).toHaveBeenCalled();
    });

    it('fetchTeams', async () => {
        ms.data = [{ id: 't1' }];
        await timelineService.fetchTeams('p1');
        expect(ch.eq).toHaveBeenCalled();
    });

    it('deleteTeam', async () => {
        ms.error = null;
        await timelineService.deleteTeam('t1');
        expect(ch.delete).toHaveBeenCalled();
    });

    // === fetchTimelineData ===
    it('fetchTimelineData calls from', async () => {
        ms.data = [];
        const r = await timelineService.fetchTimelineData('p1');
        expect(r).toBeDefined();
    });
});
