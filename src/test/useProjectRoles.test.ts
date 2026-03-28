/**
 * useProjectRoles Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createWrapper } from './testUtils';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), loading: vi.fn() }) }));

import { useProjectRoles, useCreateCustomRole, useUpdateProjectRole, useDeleteCustomRole, useResetStandardRole } from '@/hooks/useProjectRoles';

describe('useProjectRoles', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useProjectRoles).toBeDefined();
            expect(useCreateCustomRole).toBeDefined();
            expect(useUpdateProjectRole).toBeDefined();
            expect(useDeleteCustomRole).toBeDefined();
            expect(useResetStandardRole).toBeDefined();
        });
    });

    describe('useProjectRoles', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useProjectRoles(), { wrapper: createWrapper() });
            expect(result.current).toBeDefined();
        });
    });
});
