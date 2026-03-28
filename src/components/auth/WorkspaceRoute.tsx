/**
 * WorkspaceRoute — renders children only when the authenticated user is a member
 * of the workspace identified by `:workspaceId` in the URL.
 *
 * Redirect logic:
 *  - not logged in         → /login
 *  - not a workspace member → /dashboard (with toast)
 *  - insufficient role      → /dashboard (with toast)
 *  - authorized             → render children
 *
 * Follows the same pattern as TenantRoute.
 */

import { useEffect, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthLoadingScreen } from './AuthLoadingScreen';
import { toast } from 'sonner';

type WorkspaceAuthState =
    | { status: 'loading' }
    | { status: 'unauthenticated' }
    | { status: 'not-member' }
    | { status: 'insufficient-role' }
    | { status: 'authorized' };

/**
 * Roles allowed to access workspace admin routes.
 * 'viewer' is blocked by default — they can see workspace data
 * via project views but not workspace administration pages.
 */
const ALLOWED_WORKSPACE_ROLES = ['admin', 'manager', 'member'];

interface WorkspaceRouteProps {
    children: React.ReactNode;
    /** Override allowed roles (default: admin, manager, member) */
    allowedRoles?: string[];
}

export function WorkspaceRoute({ children, allowedRoles = ALLOWED_WORKSPACE_ROLES }: WorkspaceRouteProps) {
    const [authState, setAuthState] = useState<WorkspaceAuthState>({ status: 'loading' });
    const location = useLocation();
    const { workspaceId } = useParams<{ workspaceId: string }>();

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            // 1. Check authentication
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                if (!cancelled) setAuthState({ status: 'unauthenticated' });
                return;
            }

            // 2. Verify workspaceId exists in URL
            if (!workspaceId) {
                if (!cancelled) setAuthState({ status: 'not-member' });
                return;
            }

            // 3. Check workspace membership + role
            const { data: membership, error } = await supabase
                .from('workspace_members')
                .select('role, is_active')
                .eq('workspace_id', workspaceId)
                .eq('user_id', session.user.id)
                .eq('is_active', true)
                .maybeSingle();

            if (error || !membership) {
                if (!cancelled) setAuthState({ status: 'not-member' });
                return;
            }

            // 4. Check role authorisation
            if (!allowedRoles.includes(membership.role)) {
                if (!cancelled) setAuthState({ status: 'insufficient-role' });
                return;
            }

            if (!cancelled) setAuthState({ status: 'authorized' });
        };

        check();

        return () => { cancelled = true; };
    }, [workspaceId, allowedRoles]);

    if (authState.status === 'loading') return <AuthLoadingScreen />;

    if (authState.status === 'unauthenticated') {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (authState.status === 'not-member') {
        toast.error('You are not a member of this workspace.');
        return <Navigate to="/dashboard" replace />;
    }

    if (authState.status === 'insufficient-role') {
        toast.error('You do not have permission to access workspace administration.');
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
