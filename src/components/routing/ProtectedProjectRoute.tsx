/**
 * Protected Project Route Wrapper
 * Combines ProtectedRoute, ProjectProvider, and PresenceProvider
 * for routes that require authentication and project context
 */

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { PresenceProvider } from '@/contexts/PresenceContext';

interface ProtectedProjectRouteProps {
    children: React.ReactNode;
}

export function ProtectedProjectRoute({ children }: ProtectedProjectRouteProps) {
    return (
        <ProtectedRoute>
            <ProjectProvider>
                <PresenceProvider>
                    {children}
                </PresenceProvider>
            </ProjectProvider>
        </ProtectedRoute>
    );
}
