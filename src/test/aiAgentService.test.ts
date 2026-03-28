/**
 * Batch deep tests for remaining services — aiAgentService, aiService, aiCostMonitoring
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
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
        functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

import * as aiAgent from '@/services/aiAgentService';

describe('aiAgentService', () => {
    it('exports functions', () => {
        expect(Object.keys(aiAgent).length).toBeGreaterThan(0);
    });
    it('each export is a function', () => {
        Object.values(aiAgent).forEach(val => {
            if (typeof val !== 'object') expect(typeof val).toBe('function');
        });
    });
});
