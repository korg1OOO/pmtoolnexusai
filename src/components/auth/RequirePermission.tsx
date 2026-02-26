/**
 * RequirePermission — wraps project-level pages/components that need
 * a specific permission to be accessed.  Shows an access-denied message
 * (instead of silently rendering) when the user's project role is
 * insufficient.
 *
 * Usage:
 *   <RequirePermission permission="budget.view">
 *     <FinancialsPage />
 *   </RequirePermission>
 *
 * This differs from the `usePermissions().can()` approach which hides
 * individual UI elements — this component blocks the entire page.
 */

import React from 'react';
import { usePermissions, Permission } from '@/hooks/usePermissions';
import { useProjectContext } from '@/contexts/ProjectContext';
import { Card } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RequirePermissionProps {
    children: React.ReactNode;
    /** The permission required to render children */
    permission: Permission;
    /** Optional: fallback component (default: built-in access denied card) */
    fallback?: React.ReactNode;
}

export function RequirePermission({ children, permission, fallback }: RequirePermissionProps) {
    const { settings } = useProjectContext();
    const projectId = settings?.id;
    const { can, isLoading, role } = usePermissions(projectId);
    const navigate = useNavigate();

    // While loading role data, show nothing (prevent flash)
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-muted-foreground">Checking permissions...</div>
            </div>
        );
    }

    // No project selected — let the page handle this
    if (!projectId) return <>{children}</>;

    // Has the required permission — render children
    if (can(permission)) return <>{children}</>;

    // Blocked — render fallback or default access denied
    if (fallback) return <>{fallback}</>;

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
            <Card className="p-8 max-w-md text-center space-y-4">
                <ShieldAlert className="w-12 h-12 mx-auto text-destructive" />
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p className="text-muted-foreground">
                    Your current role (<span className="font-medium capitalize">{role}</span>) does
                    not have the <code className="text-xs bg-muted px-1 py-0.5 rounded">{permission}</code> permission
                    required to view this page.
                </p>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                </Button>
            </Card>
        </div>
    );
}
