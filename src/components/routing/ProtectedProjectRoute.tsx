/**
 * Protected Project Route Wrapper
 * Combines ProtectedRoute, ProjectProvider, PresenceProvider, and AppShell
 * for routes that require authentication and project context with navigation
 */

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { PresenceProvider } from '@/contexts/PresenceContext';
import { AppShell } from '@/components/layout/AppShell';

interface ProtectedProjectRouteProps {
    children: React.ReactNode;
}

// Map routes to view IDs for sidebar active state
const routeToViewMap: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/morning-briefing': 'morning-briefing',
    '/executive-dashboard': 'executive-dashboard',
    '/strategic-dashboard': 'strategic-dashboard',
    '/portfolio': 'portfolio',
    '/program-timeline': 'program-timeline',
    '/program-documents': 'program-documents',
    '/planning': 'planning',
    '/project-plan': 'planning',
    '/child-plans': 'child-plans',
    '/gantt': 'gantt',
    '/child-gantt': 'child-gantt',
    '/timeline-planner': 'timeline-planner',
    '/milestones': 'milestones',
    '/scenarios': 'scenarios',
    '/tracking': 'tracking',
    '/project-charter': 'project-charter',
    '/sprints': 'sprints',
    '/backlog': 'backlog',
    '/deliverables': 'deliverables',
    '/change-requests': 'change-requests',
    '/stakeholders': 'stakeholders',
    '/traceability': 'traceability',
    '/actions': 'actions',
    '/risks': 'risks',
    '/issues': 'issues',
    '/decisions': 'decisions',
    '/financials': 'financials',
    '/evm': 'evm',
    '/meetings': 'meetings',
    '/calendar': 'calendar',
    '/team-chat': 'team-chat',
    '/communications': 'communications',
    '/communication-intelligence': 'communication-intelligence',
    '/collaboration-spaces': 'collaboration-spaces',
    '/notes': 'notes',
    '/documents': 'documents',
    '/knowledge-base': 'knowledge-base',
    '/presentations': 'presentations',
    '/resources': 'resources',
    '/team-management': 'team-management',
    '/reports': 'reports',
    '/final-report': 'final-report',
    '/lessons-learned': 'lessons-learned',
    '/admin/project': 'admin-project',
    '/admin/platform': 'admin-platform',
    '/admin/templates': 'admin-templates',
    '/settings': 'settings',
    '/create-project': 'create-project',
};

export function ProtectedProjectRoute({ children }: ProtectedProjectRouteProps) {
    const location = useLocation();
    const activeView = routeToViewMap[location.pathname] || 'dashboard';

    return (
        <ProtectedRoute>
            <ProjectProvider>
                <PresenceProvider>
                    <AppShell
                        activeView={activeView}
                        onViewChange={(view) => {
                            // Navigation is handled by React Router
                            // This is just for the sidebar active state
                        }}
                    >
                        {children}
                    </AppShell>
                </PresenceProvider>
            </ProjectProvider>
        </ProtectedRoute>
    );
}
