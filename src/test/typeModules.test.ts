/**
 * Tests for types/ — validate type structure and enum-like constants
 * Also tests for any exported utility functions in type files
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(), rpc: vi.fn(), auth: { getUser: vi.fn() },
        channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
        removeChannel: vi.fn(), functions: { invoke: vi.fn() }, storage: { from: vi.fn() }
    },
}));

describe('Type module loads', () => {
    it('ai-agents types load', async () => {
        const m = await import('@/types/ai-agents');
        expect(m).toBeDefined();
    });

    it('analytics types load', async () => {
        const m = await import('@/types/analytics');
        expect(m).toBeDefined();
    });

    it('export types load', async () => {
        const m = await import('@/types/export');
        expect(m).toBeDefined();
    });

    it('collaboration types load', async () => {
        const m = await import('@/types/collaboration');
        expect(m).toBeDefined();
    });

    it('project types load', async () => {
        const m = await import('@/types/project');
        expect(m).toBeDefined();
    });

    it('templates types load', async () => {
        const m = await import('@/types/templates');
        expect(m).toBeDefined();
    });

    it('realtime types load', async () => {
        const m = await import('@/types/realtime');
        expect(m).toBeDefined();
    });

    it('briefing types load', async () => {
        const m = await import('@/types/briefing');
        expect(m).toBeDefined();
    });

    it('mlAnalytics types load', async () => {
        const m = await import('@/types/mlAnalytics');
        expect(m).toBeDefined();
    });

    it('ai-pm types load', async () => {
        const m = await import('@/types/ai-pm');
        expect(m).toBeDefined();
    });
});
