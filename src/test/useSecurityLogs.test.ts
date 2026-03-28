/**
 * useSecurityLogs Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createWrapper } from './testUtils';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), loading: vi.fn() }) }));

import { useSecurityLogs, useLoginAttempts, useSecurityStats, useLogSecurityEvent } from '@/hooks/useSecurityLogs';

describe('useSecurityLogs', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useSecurityLogs).toBeDefined();
            expect(useLoginAttempts).toBeDefined();
            expect(useSecurityStats).toBeDefined();
            expect(useLogSecurityEvent).toBeDefined();
        });
    });

    describe('useSecurityLogs', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useSecurityLogs(), { wrapper: createWrapper() });
            expect(result.current).toBeDefined();
        });
    });
});
