/**
 * TenantRoute — renders children only when the authenticated user belongs
 * to the current tenant and has a qualifying role (owner, admin).
 *
 * Redirect logic:
 *  - not logged in       → /login
 *  - not in any tenant   → /dashboard (with toast)
 *  - viewer / member role → /dashboard (with toast)
 *  - owner / admin role  → render children
 *
 * Relies on the TenantContext which must wrap this component in the tree.
 */

import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { AuthLoadingScreen } from './AuthLoadingScreen';
import { toast } from 'sonner';

type TenantAuthState =
    | { status: 'loading' }
    | { status: 'unauthenticated' }
    | { status: 'no-tenant' }
    | { status: 'insufficient-role' }
    | { status: 'authorized' };

/**
 * Roles allowed to access tenant admin routes.
 * 'member' and 'viewer' are blocked by default.
 */
const ALLOWED_TENANT_ROLES = ['owner', 'admin'];

interface TenantRouteProps {
    children: React.ReactNode;
    /** Optional: override allowed roles (default: owner, admin) */
    allowedRoles?: string[];
}

export function TenantRoute({ children, allowedRoles = ALLOWED_TENANT_ROLES }: TenantRouteProps) {
    const [authState, setAuthState] = useState<TenantAuthState>({ status: 'loading' });
    const location = useLocation();
    const { tenantId, role, loading: tenantLoading } = useTenant();

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            // 1. Check authentication
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                if (!cancelled) setAuthState({ status: 'unauthenticated' });
                return;
            }

            // 2. Wait for tenant context to finish loading
            if (tenantLoading) return;

            // 3. Check if user has a tenant
            if (!tenantId) {
                if (!cancelled) setAuthState({ status: 'no-tenant' });
                return;
            }

            // 4. Check tenant role
            if (!role || !allowedRoles.includes(role)) {
                if (!cancelled) setAuthState({ status: 'insufficient-role' });
                return;
            }

            if (!cancelled) setAuthState({ status: 'authorized' });
        };

        check();

        return () => { cancelled = true; };
    }, [tenantId, role, tenantLoading, allowedRoles]);

    if (authState.status === 'loading') return <AuthLoadingScreen />;

    if (authState.status === 'unauthenticated') {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (authState.status === 'no-tenant') {
        toast.error('You are not assigned to any organization.');
        return <Navigate to="/dashboard" replace />;
    }

    if (authState.status === 'insufficient-role') {
        toast.error('You do not have permission to access tenant administration.');
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
