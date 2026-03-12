/**
 * useAdminManagement Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createWrapper } from './testUtils';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(), insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(), neq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: (r) => r({ data: [], error: null, count: 0 }),
        })),
        channel: vi.fn().mockReturnValue({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
        }),
        removeChannel: vi.fn(),
        functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

vi.mock('@/hooks/use-toast', () => ({
    ToastVariant: vi.fn(),
    toast: vi.fn(),
    useToast: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
}));

import { usePermissions, useCreatePermission, useUpdatePermission, useDeletePermission, useAdminRoles, useCreateAdminRole, useUpdateAdminRole, useDeleteAdminRole, useAdminUsers, useGrantAdminAccess, useRevokeAdminAccess, useUpdateAdminRole_User, useAdminActivityLog, useAdminActivitySummary, useCheckPermission, useCurrentUserPermissions } from '@/hooks/useAdminManagement';

describe('useAdminManagement', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(usePermissions).toBeDefined();
            expect(useCreatePermission).toBeDefined();
            expect(useUpdatePermission).toBeDefined();
            expect(useDeletePermission).toBeDefined();
            expect(useAdminRoles).toBeDefined();
            expect(useCreateAdminRole).toBeDefined();
            expect(useUpdateAdminRole).toBeDefined();
            expect(useDeleteAdminRole).toBeDefined();
            expect(useAdminUsers).toBeDefined();
            expect(useGrantAdminAccess).toBeDefined();
            expect(useRevokeAdminAccess).toBeDefined();
            expect(useUpdateAdminRole_User).toBeDefined();
            expect(useAdminActivityLog).toBeDefined();
            expect(useAdminActivitySummary).toBeDefined();
            expect(useCheckPermission).toBeDefined();
            expect(useCurrentUserPermissions).toBeDefined();
        });
    });

    describe('usePermissions', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => usePermissions(), { wrapper: createWrapper() });
            expect(result.current).toBeDefined();
        });
    });
});
