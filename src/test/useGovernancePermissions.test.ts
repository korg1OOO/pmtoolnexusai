/**
 * useGovernancePermissions Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
}));

import { useGovernancePermissions } from '@/hooks/useGovernancePermissions';

describe('useGovernancePermissions', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useGovernancePermissions).toBeDefined();
        });
    });

    describe('useGovernancePermissions', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useGovernancePermissions());
            expect(result.current).toBeDefined();
        });
    });
});
