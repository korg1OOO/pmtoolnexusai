/**
 * ProgramRoute — renders children only when the authenticated user is a member
 * of the program identified by `:programId` in the URL.
 *
 * Redirect logic:
 *  - not logged in         → /login
 *  - not a program member  → /dashboard (with toast)
 *  - insufficient role      → /dashboard (with toast)
 *  - authorized             → render children
 *
 * Follows the same pattern as TenantRoute / WorkspaceRoute.
 */

import { useEffect, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthLoadingScreen } from './AuthLoadingScreen';
import { toast } from 'sonner';

type ProgramAuthState =
    | { status: 'loading' }
    | { status: 'unauthenticated' }
    | { status: 'not-member' }
    | { status: 'insufficient-role' }
    | { status: 'authorized' };

/**
 * Roles allowed to access program admin routes.
 * 'viewer' is blocked by default.
 * Matches program_members.role CHECK constraint: manager, lead, member, viewer
 */
const ALLOWED_PROGRAM_ROLES = ['manager', 'lead', 'member'];

interface ProgramRouteProps {
    children: React.ReactNode;
    /** Override allowed roles (default: manager, lead, member) */
    allowedRoles?: string[];
}

export function ProgramRoute({ children, allowedRoles = ALLOWED_PROGRAM_ROLES }: ProgramRouteProps) {
    const [authState, setAuthState] = useState<ProgramAuthState>({ status: 'loading' });
    const location = useLocation();
    const { programId } = useParams<{ programId: string }>();

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            // 1. Check authentication
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                if (!cancelled) setAuthState({ status: 'unauthenticated' });
                return;
            }

            // 2. Verify programId exists in URL
            if (!programId) {
                if (!cancelled) setAuthState({ status: 'not-member' });
                return;
            }

            // 3. Check program membership + role
            const { data: membership, error } = await supabase
                .from('program_members')
                .select('role, is_active')
                .eq('program_id', programId)
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
    }, [programId, allowedRoles]);

    if (authState.status === 'loading') return <AuthLoadingScreen />;

    if (authState.status === 'unauthenticated') {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (authState.status === 'not-member') {
        toast.error('You are not a member of this program.');
        return <Navigate to="/dashboard" replace />;
    }

    if (authState.status === 'insufficient-role') {
        toast.error('You do not have permission to access program administration.');
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
