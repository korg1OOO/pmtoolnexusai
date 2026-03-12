/**
 * Service tests batch 28: trackedAIService + portfolioService + exportService module loads
 */
import { describe, it, expect, vi } from 'vitest';

const { ms, ch } = vi.hoisted(() => {
    const s = { data: null as any, error: null as any };
    const c: any = {};
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'in', 'like', 'or', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'gte', 'lte', 'gt', 'lt', 'not', 'is', 'contains', 'overlaps']
        .forEach(m => { c[m] = vi.fn(() => c); });
    c.then = (res: any, rej?: any) => Promise.resolve({ data: s.data, error: s.error }).then(res, rej);
    return { ms: s, ch: c };
});

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        ...ch, from: vi.fn(() => ch),
        rpc: vi.fn(() => Promise.resolve({ data: ms.data, error: ms.error })),
        auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'u1' } }, error: null })) },
        channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
        removeChannel: vi.fn(),
        functions: { invoke: vi.fn(() => Promise.resolve({ data: null, error: null })) },
    },
}));

// Mock aiService for trackedAIService
vi.mock('@/services/aiService', () => ({
    aiService: {
        processCommunication: vi.fn(() => Promise.resolve({ data: null, error: null })),
        analyzeRisks: vi.fn(() => Promise.resolve({ data: null, error: null })),
        generateExecutiveStatus: vi.fn(() => Promise.resolve({ data: null, error: null })),
        simulateScenarios: vi.fn(() => Promise.resolve({ data: null, error: null })),
        chat: vi.fn(() => Promise.resolve({ data: { reply: 'test' }, error: null })),
    },
    ChatMessage: {},
    AIResponse: {},
    AIChatResponse: {},
}));

import { TrackedAIService, aiService } from '@/services/trackedAIService';

describe('TrackedAIService', () => {
    it('class exists and is exported', () => {
        expect(TrackedAIService).toBeDefined();
        expect(typeof TrackedAIService).toBe('function');
    });

    it('has processCommunication static method', () => {
        expect(typeof TrackedAIService.processCommunication).toBe('function');
    });

    it('has analyzeRisks static method', () => {
        expect(typeof TrackedAIService.analyzeRisks).toBe('function');
    });

    it('has generateExecutiveStatus static method', () => {
        expect(typeof TrackedAIService.generateExecutiveStatus).toBe('function');
    });

    it('has simulateScenarios static method', () => {
        expect(typeof TrackedAIService.simulateScenarios).toBe('function');
    });

    it('has chat static method', () => {
        expect(typeof TrackedAIService.chat).toBe('function');
    });

    it('re-exports aiService', () => {
        expect(aiService).toBeDefined();
    });

    it('processCommunication calls underlying service', async () => {
        await TrackedAIService.processCommunication('proj1', 'Hello');
        expect(aiService.processCommunication).toHaveBeenCalledWith('proj1', 'Hello');
    });

    it('analyzeRisks calls underlying service', async () => {
        await TrackedAIService.analyzeRisks('proj1');
        expect(aiService.analyzeRisks).toHaveBeenCalledWith('proj1');
    });

    it('chat calls underlying service', async () => {
        await TrackedAIService.chat('proj1', 'Hi', []);
        expect(aiService.chat).toHaveBeenCalledWith('proj1', 'Hi', []);
    });
});

describe('portfolioService module', () => {
    it('imports successfully', async () => {
        const m = await import('@/services/portfolioService');
        expect(m).toBeDefined();
    });
    it('exports functions', async () => {
        const m = await import('@/services/portfolioService');
        const fns = Object.values(m).filter(v => typeof v === 'function');
        expect(fns.length).toBeGreaterThan(0);
    });
});
