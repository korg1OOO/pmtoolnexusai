/**
 * useIMAP Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createWrapper } from './testUtils';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), loading: vi.fn() }) }));

import { useIMAPAccounts, useIMAPPresets, useCreateIMAPAccount, useUpdateIMAPAccount, useDeleteIMAPAccount, useTestIMAPConnection, useSyncIMAPAccount } from '@/hooks/useIMAP';

describe('useIMAP', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useIMAPAccounts).toBeDefined();
            expect(useIMAPPresets).toBeDefined();
            expect(useCreateIMAPAccount).toBeDefined();
            expect(useUpdateIMAPAccount).toBeDefined();
            expect(useDeleteIMAPAccount).toBeDefined();
            expect(useTestIMAPConnection).toBeDefined();
            expect(useSyncIMAPAccount).toBeDefined();
        });
    });

    describe('useIMAPAccounts', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useIMAPAccounts(), { wrapper: createWrapper() });
            expect(result.current).toBeDefined();
        });
    });
});
