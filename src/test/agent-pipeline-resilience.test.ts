/**
 * Agent Pipeline — Resilience Module Unit Tests
 *
 * Tests retry logic, timeout handling, and circuit breaker.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    withResilience,
    getActionTimeout,
    getCircuitState,
    resetCircuit,
} from '@/lib/agent-pipeline/resilience';

describe('getActionTimeout', () => {
    it('returns correct timeout for fast actions', () => {
        expect(getActionTimeout('log_issue')).toBe(5000);
        expect(getActionTimeout('log_risk')).toBe(5000);
    });

    it('returns correct timeout for medium actions', () => {
        expect(getActionTimeout('create_phase')).toBe(10000);
        expect(getActionTimeout('create_sprint')).toBe(10000);
    });

    it('returns correct timeout for slow actions', () => {
        expect(getActionTimeout('create_project')).toBe(20000);
        expect(getActionTimeout('create_activities')).toBe(20000);
    });

    it('returns correct timeout for heavy actions', () => {
        expect(getActionTimeout('generate_final_report')).toBe(30000);
    });

    it('returns default timeout for unknown actions', () => {
        expect(getActionTimeout('unknown_action')).toBe(15000);
    });
});

describe('withResilience', () => {
    beforeEach(() => {
        resetCircuit();
    });

    it('returns result on success', async () => {
        const result = await withResilience('log_issue', async () => 'success');
        expect(result).toBe('success');
    });

    it('retries on retryable errors', async () => {
        let attempt = 0;
        const fn = async () => {
            attempt++;
            if (attempt < 2) throw new Error('network error');
            return 'recovered';
        };

        const result = await withResilience('log_issue', fn, {
            maxRetries: 2,
            baseDelayMs: 10, // Fast retries for test
            maxDelayMs: 50,
            jitter: 0,
        });

        expect(result).toBe('recovered');
        expect(attempt).toBe(2);
    });

    it('does not retry non-retryable errors', async () => {
        let attempt = 0;
        const fn = async () => {
            attempt++;
            throw new Error('JWT expired');
        };

        try {
            await withResilience('log_issue', fn, {
                maxRetries: 3,
                baseDelayMs: 10,
                maxDelayMs: 50,
                jitter: 0,
            });
        } catch (err: any) {
            expect(err.category).toBe('auth');
            expect(attempt).toBe(1); // No retries for auth errors
        }
    });

    it('throws after max retries exhausted', async () => {
        const fn = async () => {
            throw new Error('network error');
        };

        try {
            await withResilience('log_issue', fn, {
                maxRetries: 1,
                baseDelayMs: 10,
                maxDelayMs: 50,
                jitter: 0,
            });
            expect.unreachable();
        } catch (err: any) {
            expect(err.category).toBe('network');
        }
    });
});

describe('circuit breaker', () => {
    beforeEach(() => {
        resetCircuit();
    });

    it('starts in closed state', () => {
        expect(getCircuitState().state).toBe('closed');
        expect(getCircuitState().failures).toBe(0);
    });

    it('resets failures on success', async () => {
        await withResilience('log_issue', async () => 'ok');
        expect(getCircuitState().failures).toBe(0);
    });

    it('tracks failures', async () => {
        try {
            await withResilience('log_issue', async () => {
                throw new Error('JWT expired');
            }, { maxRetries: 0 });
        } catch { } // eslint-disable-line no-empty

        expect(getCircuitState().failures).toBe(1);
    });

    it('resetCircuit clears state', () => {
        resetCircuit();
        expect(getCircuitState().state).toBe('closed');
        expect(getCircuitState().failures).toBe(0);
    });
});
