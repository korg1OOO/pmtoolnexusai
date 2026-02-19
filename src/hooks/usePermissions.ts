import { useCallback } from 'react';
import { useUserRole } from './useUserRole';
import type { ProjectRole } from '@/types/ai-agents';
import { toast } from 'sonner';

// Permission matrix — what each role can do
const ROLE_PERMISSIONS: Record<ProjectRole, Permission[]> = {
    owner: [
        'project.delete', 'project.settings', 'project.members.manage',
        'task.create', 'task.edit', 'task.delete', 'task.assign',
        'budget.view', 'budget.edit',
        'risk.create', 'risk.edit', 'risk.delete',
        'document.create', 'document.edit', 'document.delete',
        'milestone.create', 'milestone.edit', 'milestone.delete',
        'report.create', 'report.edit', 'report.delete',
        'deliverable.create', 'deliverable.edit', 'deliverable.delete',
        'stakeholder.create', 'stakeholder.edit', 'stakeholder.delete',
        'ai.use', 'ai.configure',
        'timeline.edit',
    ],
    admin: [
        'project.settings', 'project.members.manage',
        'task.create', 'task.edit', 'task.delete', 'task.assign',
        'budget.view', 'budget.edit',
        'risk.create', 'risk.edit', 'risk.delete',
        'document.create', 'document.edit', 'document.delete',
        'milestone.create', 'milestone.edit', 'milestone.delete',
        'report.create', 'report.edit', 'report.delete',
        'deliverable.create', 'deliverable.edit', 'deliverable.delete',
        'stakeholder.create', 'stakeholder.edit', 'stakeholder.delete',
        'ai.use', 'ai.configure',
        'timeline.edit',
    ],
    manager: [
        'task.create', 'task.edit', 'task.assign',
        'budget.view',
        'risk.create', 'risk.edit',
        'document.create', 'document.edit',
        'milestone.create', 'milestone.edit',
        'report.create', 'report.edit',
        'deliverable.create', 'deliverable.edit',
        'stakeholder.create', 'stakeholder.edit',
        'ai.use',
        'timeline.edit',
    ],
    member: [
        'task.create', 'task.edit',
        'document.create',
        'risk.create',
        'deliverable.create',
        'ai.use',
    ],
    viewer: [],
};

export type Permission =
    | 'project.delete' | 'project.settings' | 'project.members.manage'
    | 'task.create' | 'task.edit' | 'task.delete' | 'task.assign'
    | 'budget.view' | 'budget.edit'
    | 'risk.create' | 'risk.edit' | 'risk.delete'
    | 'document.create' | 'document.edit' | 'document.delete'
    | 'milestone.create' | 'milestone.edit' | 'milestone.delete'
    | 'report.create' | 'report.edit' | 'report.delete'
    | 'deliverable.create' | 'deliverable.edit' | 'deliverable.delete'
    | 'stakeholder.create' | 'stakeholder.edit' | 'stakeholder.delete'
    | 'ai.use' | 'ai.configure'
    | 'timeline.edit';

export interface UsePermissionsReturn {
    role: ProjectRole;
    isLoading: boolean;
    can: (permission: Permission) => boolean;
    canAny: (permissions: Permission[]) => boolean;
    canAll: (permissions: Permission[]) => boolean;
    /** Call before a guarded action — returns false and shows a toast if not permitted */
    require: (permission: Permission, message?: string) => boolean;
    isOwnerOrAdmin: boolean;
    isAtLeastMember: boolean;
    isAtLeastManager: boolean;
    /** Backwards-compat: portfolio/program ownership check */
    canManagePortfolios: boolean;
    canManagePrograms: boolean;
    hasManagementAccess: boolean;
}

/**
 * usePermissions — role-based permission checks for a project.
 *
 * @example
 * const { can, require } = usePermissions(projectId);
 *
 * // Guard a render:
 * {can('task.delete') && <DeleteButton />}
 *
 * // Guard an action:
 * const handleDelete = () => {
 *   if (!require('task.delete')) return;
 *   // safe to proceed
 * };
 */
export function usePermissions(projectId?: string | null): UsePermissionsReturn {
    const { data: role = 'viewer', isLoading } = useUserRole(projectId ?? null);

    const permissions = ROLE_PERMISSIONS[role] ?? [];

    const can = useCallback(
        (permission: Permission) => permissions.includes(permission),
        [permissions]
    );

    const canAny = useCallback(
        (perms: Permission[]) => perms.some((p) => permissions.includes(p)),
        [permissions]
    );

    const canAll = useCallback(
        (perms: Permission[]) => perms.every((p) => permissions.includes(p)),
        [permissions]
    );

    const require = useCallback(
        (permission: Permission, message?: string): boolean => {
            if (permissions.includes(permission)) return true;
            toast.error(message ?? "You don't have permission to perform this action.");
            return false;
        },
        [permissions]
    );

    const isOwnerOrAdmin = role === 'owner' || role === 'admin';

    return {
        role,
        isLoading,
        can,
        canAny,
        canAll,
        require,
        isOwnerOrAdmin,
        isAtLeastMember: ['owner', 'admin', 'manager', 'member'].includes(role),
        isAtLeastManager: ['owner', 'admin', 'manager'].includes(role),
        // backwards-compat with old portfolio/program check callers
        canManagePortfolios: isOwnerOrAdmin,
        canManagePrograms: isOwnerOrAdmin,
        hasManagementAccess: isOwnerOrAdmin,
    };
}
