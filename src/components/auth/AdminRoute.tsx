import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthLoadingScreen } from "./AuthLoadingScreen";

type AuthState =
    | { status: 'loading' }
    | { status: 'unauthenticated' }
    | { status: 'unauthorized' }   // authenticated but not admin
    | { status: 'authorized' };

/**
 * AdminRoute — renders children only when the authenticated user has
 * the 'admin' role on their profile row.  All other cases redirect:
 *  - not logged in  → /login
 *  - not admin      → /dashboard
 */
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const [state, setState] = useState<AuthState>({ status: 'loading' });
    const location = useLocation();

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                if (!cancelled) setState({ status: 'unauthenticated' });
                return;
            }

            // Check profile role — same table used by useAdminUsers
            const { data } = await (supabase as any)
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .maybeSingle();

            if (!cancelled) {
                const role = data?.role;
                setState(role === 'admin' || role === 'super_admin'
                    ? { status: 'authorized' }
                    : { status: 'unauthorized' });
            }
        };

        check();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            if (!cancelled) setState({ status: 'loading' });
            check();
        });

        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, []);

    if (state.status === 'loading') return <AuthLoadingScreen />;
    if (state.status === 'unauthenticated') {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (state.status === 'unauthorized') {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};
