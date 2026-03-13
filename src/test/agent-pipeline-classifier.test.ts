/**
 * Agent Pipeline — Intent Classifier Unit Tests
 *
 * Tests the classifyIntent function: LLM-first classification with
 * regex fallback, confidence thresholds, and error handling.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock supabase before importing the classifier
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: { access_token: 'test-token' } },
            }),
        },
    },
}));

// Set env vars for import.meta.env (vitest auto-maps these)
(import.meta as any).env = {
    ...(import.meta as any).env,
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
};

import { classifyIntent } from '@/lib/agent-pipeline/intent-classifier';

// ─── Test helpers ───────────────────────────────────────────────────────────

const mockRegex = vi.fn<[string], string | null>();
const originalFetch = global.fetch;

function mockFetchSuccess(action: string | null, confidence: number, reasoning?: string) {
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ action, confidence, reasoning }),
    }) as any;
}

function mockFetchFailure() {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as any;
}

function mockFetchHTTPError(status: number) {
    global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status,
        text: vi.fn().mockResolvedValue('Internal Server Error'),
    }) as any;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('classifyIntent', () => {
    beforeEach(() => {
        mockRegex.mockReset();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    describe('LLM-first classification', () => {
        it('uses LLM result when confidence is high', async () => {
            mockFetchSuccess('create_project', 0.95, 'User wants to create a project');
            mockRegex.mockReturnValue('create_project');

            const result = await classifyIntent('Create a new project called MyApp', mockRegex);

            expect(result.action).toBe('create_project');
            expect(result.confidence).toBe(0.95);
            expect(result.source).toBe('llm');
            expect(result.reasoning).toBe('User wants to create a project');
        });

        it('boosts when LLM confidence is low but regex agrees', async () => {
            mockFetchSuccess('create_project', 0.3);
            mockRegex.mockReturnValue('create_project');

            const result = await classifyIntent('Maybe create something?', mockRegex);

            // LLM had low confidence, regex agreed — boosted
            expect(result.action).toBe('create_project');
            expect(result.confidence).toBeGreaterThanOrEqual(0.85);
        });

        it('falls back to regex when LLM returns no action', async () => {
            mockFetchSuccess(null, 0);
            mockRegex.mockReturnValue('log_issue');

            const result = await classifyIntent('Log an issue about the API', mockRegex);

            expect(result.action).toBe('log_issue');
            expect(result.source).toBe('regex');
        });
    });

    describe('regex-only mode', () => {
        it('skips LLM when regexOnly is true', async () => {
            mockRegex.mockReturnValue('create_sprint');

            const result = await classifyIntent('Create a sprint', mockRegex, { regexOnly: true });

            expect(result.action).toBe('create_sprint');
            expect(result.source).toBe('regex');
            expect(result.confidence).toBe(0.8);
        });

        it('returns none when regex finds nothing in regexOnly mode', async () => {
            mockRegex.mockReturnValue(null);

            const result = await classifyIntent('Hello world', mockRegex, { regexOnly: true });

            expect(result.action).toBeNull();
            expect(result.source).toBe('none');
        });
    });

    describe('error handling', () => {
        it('falls back to regex on network error', async () => {
            mockFetchFailure();
            mockRegex.mockReturnValue('log_risk');

            const result = await classifyIntent('Log a budget overrun risk', mockRegex);

            expect(result.action).toBe('log_risk');
            expect(result.source).toBe('regex');
        });

        it('falls back to regex on HTTP error', async () => {
            mockFetchHTTPError(500);
            mockRegex.mockReturnValue('create_phase');

            const result = await classifyIntent('Build 5 phases', mockRegex);

            expect(result.action).toBe('create_phase');
            expect(result.source).toBe('regex');
        });

        it('returns none when both LLM and regex fail', async () => {
            mockFetchFailure();
            mockRegex.mockReturnValue(null);

            const result = await classifyIntent('Hello, how are you?', mockRegex);

            expect(result.action).toBeNull();
            expect(result.source).toBe('none');
        });
    });

    describe('confidence boosting', () => {
        it('boosts confidence when LLM and regex agree', async () => {
            mockFetchSuccess('create_project', 0.6);
            mockRegex.mockReturnValue('create_project');

            const result = await classifyIntent('Set up a new project', mockRegex);

            expect(result.confidence).toBeGreaterThanOrEqual(0.85);
            expect(result.action).toBe('create_project');
        });

        it('uses LLM action when regex disagrees and LLM is confident', async () => {
            mockFetchSuccess('create_phases_and_activities', 0.85);
            mockRegex.mockReturnValue('create_phase');

            const result = await classifyIntent('Build a plan with phases and tasks', mockRegex);

            expect(result.action).toBe('create_phases_and_activities');
            expect(result.source).toBe('llm');
        });
    });

    describe('custom confidence threshold', () => {
        it('uses custom threshold when provided', async () => {
            mockFetchSuccess('log_expense', 0.6);
            mockRegex.mockReturnValue('log_expense');

            const result = await classifyIntent('Log an expense', mockRegex, {
                confidenceThreshold: 0.5,
            });

            expect(result.action).toBe('log_expense');
            expect(result.source).toBe('llm');
            expect(result.confidence).toBe(0.6);
        });
    });
});
