/**
 * Permission Matrix Tests
 *
 * Verifies the RBAC permission matrix used by usePermissions:
 * - Each role grants the correct permission set
 * - Hierarchical role checks (isOwnerOrAdmin, isAtLeastMember, etc.)
 * - can / canAny / canAll helpers
 * - Edge cases (unknown role, empty project ID)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// ── Mock useUserRole so we can inject roles without Supabase ──────────────
let mockRole = 'viewer';
let mockLoading = false;

vi.mock('@/hooks/useUserRole', () => ({
    useUserRole: vi.fn(() => ({
        data: mockRole,
        isLoading: mockLoading,
    })),
}));

vi.mock('sonner', () => ({
    toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

import { usePermissions, Permission } from '@/hooks/usePermissions';
import { toast } from 'sonner';

describe('usePermissions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRole = 'viewer';
        mockLoading = false;
    });

    // ─── Role-based permission grants ─────────────────────────────────

    describe('admin role', () => {
        beforeEach(() => { mockRole = 'admin'; });

        it('has all CRUD permissions', () => {
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.can('project.delete')).toBe(true);
            expect(result.current.can('project.settings')).toBe(true);
            expect(result.current.can('project.members.manage')).toBe(true);
            expect(result.current.can('task.create')).toBe(true);
            expect(result.current.can('task.delete')).toBe(true);
            expect(result.current.can('budget.view')).toBe(true);
            expect(result.current.can('budget.edit')).toBe(true);
            expect(result.current.can('ai.use')).toBe(true);
            expect(result.current.can('ai.configure')).toBe(true);
        });

        it('isOwnerOrAdmin is true', () => {
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.isOwnerOrAdmin).toBe(true);
        });

        it('isAtLeastMember is true', () => {
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.isAtLeastMember).toBe(true);
        });

        it('isAtLeastManager is true', () => {
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.isAtLeastManager).toBe(true);
        });

        it('canManagePortfolios and canManagePrograms are true', () => {
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.canManagePortfolios).toBe(true);
            expect(result.current.canManagePrograms).toBe(true);
            expect(result.current.hasManagementAccess).toBe(true);
        });
    });

    describe('pm role', () => {
        beforeEach(() => { mockRole = 'pm'; });

        it('can create and edit tasks', () => {
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.can('task.create')).toBe(true);
            expect(result.current.can('task.edit')).toBe(true);
            expect(result.current.can('task.assign')).toBe(true);
        });

        it('cannot delete project', () => {
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.can('project.delete')).toBe(false);
        });

        it('can view budget but not edit', () => {
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.can('budget.view')).toBe(true);
            expect(result.current.can('budget.edit')).toBe(false);
        });

        it('isAtLeastManager is true', () => {
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.isAtLeastManager).toBe(true);
        });

        it('isOwnerOrAdmin is false', () => {
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.isOwnerOrAdmin).toBe(false);
        });
    });

    describe('lead role', () => {
        beforeEach(() => { mockRole = 'lead'; });

        it('can create/edit/assign tasks', () => {
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.can('task.create')).toBe(true);
            expect(result.current.can('task.edit')).toBe(true);
            expect(result.current.can('task.assign')).toBe(true);
        });

        it('cannot manage reports', () => {
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.can('report.create')).toBe(false);
        });

        it('isAtLeastManager is true', () => {
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.isAtLeastManager).toBe(true);
        });
    });

    describe('developer role', () => {
        beforeEach(() => { mockRole = 'developer'; });

        it('can create tasks and documents', () => {
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.can('task.create')).toBe(true);
            expect(result.current.can('task.edit')).toBe(true);
            expect(result.current.can('document.create')).toBe(true);
            expect(result.current.can('ai.use')).toBe(true);
        });

        it('cannot delete tasks or manage budget', () => {
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.can('task.delete')).toBe(false);
            expect(result.current.can('budget.view')).toBe(false);
            expect(result.current.can('budget.edit')).toBe(false);
        });

        it('isAtLeastMember but not manager', () => {
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.isAtLeastMember).toBe(true);
            expect(result.current.isAtLeastManager).toBe(false);
        });
    });

    describe('viewer role', () => {
        beforeEach(() => { mockRole = 'viewer'; });

        it('has zero permissions', () => {
            const { result } = renderHook(() => usePermissions('proj_1'));
            const allPerms: Permission[] = [
                'project.delete', 'task.create', 'task.edit', 'task.delete',
                'budget.view', 'budget.edit', 'risk.create', 'document.create',
                'ai.use', 'ai.configure',
            ];
            allPerms.forEach(p => {
                expect(result.current.can(p)).toBe(false);
            });
        });

        it('all hierarchy flags are false', () => {
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.isOwnerOrAdmin).toBe(false);
            expect(result.current.isAtLeastMember).toBe(false);
            expect(result.current.isAtLeastManager).toBe(false);
        });
    });

    // ─── canAny / canAll helpers ─────────────────────────────────────

    describe('canAny', () => {
        it('returns true if at least one permission matches', () => {
            mockRole = 'developer';
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.canAny(['task.create', 'project.delete'])).toBe(true);
        });

        it('returns false if none match', () => {
            mockRole = 'viewer';
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.canAny(['task.create', 'budget.edit'])).toBe(false);
        });
    });

    describe('canAll', () => {
        it('returns true if all permissions match', () => {
            mockRole = 'admin';
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.canAll(['task.create', 'task.delete', 'budget.edit'])).toBe(true);
        });

        it('returns false if any permission is missing', () => {
            mockRole = 'pm';
            const { result } = renderHook(() => usePermissions('proj_1'));
            // pm can't delete tasks
            expect(result.current.canAll(['task.create', 'task.delete'])).toBe(false);
        });
    });

    // ─── require() with toast ────────────────────────────────────────

    describe('require', () => {
        it('returns true when user has permission', () => {
            mockRole = 'admin';
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.require('task.create')).toBe(true);
            expect(toast.error).not.toHaveBeenCalled();
        });

        it('returns false and shows toast when permission missing', () => {
            mockRole = 'viewer';
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.require('task.create')).toBe(false);
            expect(toast.error).toHaveBeenCalled();
        });

        it('shows custom message when provided', () => {
            mockRole = 'viewer';
            const { result } = renderHook(() => usePermissions('proj_1'));
            result.current.require('task.create', 'Custom deny message');
            expect(toast.error).toHaveBeenCalledWith('Custom deny message');
        });
    });

    // ─── Edge cases ──────────────────────────────────────────────────

    describe('edge cases', () => {
        it('handles null projectId gracefully', () => {
            mockRole = 'admin';
            const { result } = renderHook(() => usePermissions(null));
            expect(result.current.role).toBe('admin');
        });

        it('handles undefined projectId gracefully', () => {
            mockRole = 'pm';
            const { result } = renderHook(() => usePermissions(undefined));
            expect(result.current.role).toBe('pm');
        });

        it('returns loading state correctly', () => {
            mockLoading = true;
            const { result } = renderHook(() => usePermissions('proj_1'));
            expect(result.current.isLoading).toBe(true);
        });
    });
});
