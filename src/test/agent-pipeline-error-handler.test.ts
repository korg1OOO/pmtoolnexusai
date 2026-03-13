/**
 * Agent Pipeline — Error Handler Unit Tests
 *
 * Tests error classification, user-safe message generation,
 * and recovery suggestion mapping.
 */
import { describe, it, expect } from 'vitest';
import { classifyError, formatErrorForChat } from '@/lib/agent-pipeline/error-handler';

describe('classifyError', () => {
    describe('auth errors', () => {
        it('classifies JWT expired', () => {
            const result = classifyError(new Error('JWT expired'));
            expect(result.category).toBe('auth');
            expect(result.statusCode).toBe(401);
            expect(result.retryable).toBe(false);
        });

        it('classifies invalid token', () => {
            const result = classifyError(new Error('invalid token'));
            expect(result.category).toBe('auth');
        });
    });

    describe('permission errors', () => {
        it('classifies RLS violation', () => {
            const result = classifyError(new Error('row level security policy violation'));
            expect(result.category).toBe('permission');
            expect(result.statusCode).toBe(403);
            expect(result.retryable).toBe(false);
        });

        it('classifies permission denied', () => {
            const result = classifyError(new Error('permission denied for table tasks'));
            expect(result.category).toBe('permission');
        });
    });

    describe('conflict errors', () => {
        it('classifies duplicate key', () => {
            const result = classifyError(new Error('duplicate key value violates unique constraint'));
            expect(result.category).toBe('conflict');
            expect(result.statusCode).toBe(409);
        });
    });

    describe('validation errors', () => {
        it('classifies null constraint', () => {
            const result = classifyError(new Error('not-null constraint on column "name"'));
            expect(result.category).toBe('validation');
            expect(result.statusCode).toBe(400);
        });
    });

    describe('network errors', () => {
        it('classifies network failure', () => {
            const result = classifyError(new Error('network error: ECONNREFUSED'));
            expect(result.category).toBe('network');
            expect(result.retryable).toBe(true);
        });

        it('classifies fetch failure', () => {
            const result = classifyError(new Error('Failed to fetch'));
            expect(result.category).toBe('network');
        });

        it('classifies timeout', () => {
            const result = classifyError(new Error('request timed out'));
            expect(result.category).toBe('network');
            expect(result.retryable).toBe(true);
        });
    });

    describe('rate limit errors', () => {
        it('classifies rate limit', () => {
            const result = classifyError(new Error('rate limit exceeded'));
            expect(result.category).toBe('rate_limit');
            expect(result.retryable).toBe(true);
            expect(result.statusCode).toBe(429);
        });
    });

    describe('quota errors', () => {
        it('classifies insufficient credits', () => {
            const result = classifyError(new Error('insufficient credits'));
            expect(result.category).toBe('quota');
            expect(result.statusCode).toBe(402);
        });
    });

    describe('unknown errors', () => {
        it('classifies unknown errors with context', () => {
            const result = classifyError(new Error('something weird happened'), 'create_project');
            expect(result.category).toBe('unknown');
            expect(result.userMessage).toContain('create project');
            expect(result.retryable).toBe(true);
        });

        it('handles string errors', () => {
            const result = classifyError('plain string error');
            expect(result.internalMessage).toBe('plain string error');
        });

        it('handles Supabase error objects', () => {
            const result = classifyError({ message: 'JWT expired', code: '401' });
            expect(result.category).toBe('auth');
        });

        it('handles null/undefined', () => {
            const result = classifyError(null);
            expect(result.category).toBe('unknown');
            expect(result.internalMessage).toBe('Unknown error');
        });
    });
});

describe('formatErrorForChat', () => {
    it('formats auth error with emoji and recovery', () => {
        const structured = classifyError(new Error('JWT expired'));
        const formatted = formatErrorForChat(structured);
        expect(formatted).toContain('🔒');
        expect(formatted).toContain('expired');
        expect(formatted).toContain('💡');
    });

    it('marks retryable errors', () => {
        const structured = classifyError(new Error('network error'));
        const formatted = formatErrorForChat(structured);
        expect(formatted).toContain('retried');
    });

    it('does not mark non-retryable errors as retryable', () => {
        const structured = classifyError(new Error('RLS policy violation'));
        const formatted = formatErrorForChat(structured);
        expect(formatted).not.toContain('retried');
    });
});
