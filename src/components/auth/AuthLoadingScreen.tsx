import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * AuthLoadingScreen — full-page loading state shown while
 * Supabase resolves the initial session.
 *
 * Usage in App.tsx or a protected route:
 * ```tsx
 * const { loading } = useAuth();
 * if (loading) return <AuthLoadingScreen />;
 * ```
 */
export function AuthLoadingScreen() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground">
            <div className="relative">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 opacity-20 blur-xl animate-pulse" />
                <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-indigo-600 to-pink-600 flex items-center justify-center shadow-lg">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
            </div>
            <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">Authenticating…</p>
                <p className="text-xs text-muted-foreground">Verifying your session</p>
            </div>
        </div>
    );
}
