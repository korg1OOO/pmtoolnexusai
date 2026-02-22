/**
 * Protected Project Route Wrapper
 * Combines ProtectedRoute, ProjectProvider, PresenceProvider, and AppShell
 * for routes that require authentication and project context with navigation
 */

import React, { startTransition } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
    '/project-plan': 'project-plan',
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
    '/meeting-analytics': 'meeting-analytics',
    '/timeline-slippage': 'timeline-slippage',
    '/collaboration-dashboard': 'collaboration-dashboard',
    '/purchase-credits': 'purchase-credits',
    '/usage-dashboard': 'usage-dashboard',
    '/auto-recharge': 'auto-recharge',
};

// Reverse mapping: view ID to route path
const viewToRouteMap: Record<string, string> = {
    'dashboard': '/dashboard',
    'morning-briefing': '/morning-briefing',
    'executive-dashboard': '/executive-dashboard',
    'strategic-dashboard': '/strategic-dashboard',
    'portfolio': '/portfolio',
    'program-timeline': '/program-timeline',
    'program-documents': '/program-documents',
    'planning': '/planning',
    'project-plan': '/project-plan',
    'child-plans': '/child-plans',
    'gantt': '/gantt',
    'child-gantt': '/child-gantt',
    'timeline-planner': '/timeline-planner',
    'milestones': '/milestones',
    'scenarios': '/scenarios',
    'tracking': '/tracking',
    'project-charter': '/project-charter',
    'sprints': '/sprints',
    'backlog': '/backlog',
    'deliverables': '/deliverables',
    'change-requests': '/change-requests',
    'stakeholders': '/stakeholders',
    'traceability': '/traceability',
    'actions': '/actions',
    'risks': '/risks',
    'issues': '/issues',
    'decisions': '/decisions',
    'financials': '/financials',
    'evm': '/evm',
    'meetings': '/meetings',
    'calendar': '/calendar',
    'team-chat': '/team-chat',
    'communications': '/communications',
    'communication-intelligence': '/communication-intelligence',
    'collaboration-spaces': '/collaboration-spaces',
    'notes': '/notes',
    'documents': '/documents',
    'knowledge-base': '/knowledge-base',
    'presentations': '/presentations',
    'resources': '/resources',
    'team-management': '/team-management',
    'reports': '/reports',
    'final-report': '/final-report',
    'lessons-learned': '/lessons-learned',
    'admin-project': '/admin/project',
    'admin-platform': '/admin/platform',
    'admin-templates': '/admin/templates',
    'settings': '/settings',
    'create-project': '/create-project',
    'meeting-analytics': '/meeting-analytics',
    'timeline-slippage': '/timeline-slippage',
    'collaboration-dashboard': '/collaboration-dashboard',
    'purchase-credits': '/purchase-credits',
    'usage-dashboard': '/usage-dashboard',
    'auto-recharge': '/auto-recharge',
};

export function ProtectedProjectRoute({ children }: ProtectedProjectRouteProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const activeView = routeToViewMap[location.pathname] || 'dashboard';

    const handleViewChange = (view: string) => {
        const route = viewToRouteMap[view];
        if (route) {
            startTransition(() => {
                navigate(route);
            });
        }
    };

    return (
        <ProtectedRoute>
            <ProjectProvider>
                <PresenceProvider>
                    <AppShell
                        activeView={activeView}
                        onViewChange={handleViewChange}
                    >
                        {children}
                    </AppShell>
                </PresenceProvider>
            </ProjectProvider>
        </ProtectedRoute>
    );
}
