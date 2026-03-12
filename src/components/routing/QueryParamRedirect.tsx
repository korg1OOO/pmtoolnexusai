/**
 * Query Parameter Redirect Component
 * Provides backward compatibility for old ?view= URLs
 * Redirects to new nested route structure
 */

import { useEffect } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';

/**
 * Route mapping from old query parameter views to new nested routes
 */
const ROUTE_MAP: Record<string, string> = {
    // Dashboard & Overview
    'dashboard': '/dashboard',
    'morning-briefing': '/morning-briefing',
    'executive-dashboard': '/executive-dashboard',
    'strategic-dashboard': '/strategic-dashboard',

    // Portfolio & Program
    'portfolio': '/portfolio',
    'program-timeline': '/program-timeline',
    'program-documents': '/program-documents',

    // Planning & Tracking
    'project-plan': '/project-plan',
    'planning': '/planning',
    'child-plans': '/child-plans',
    'gantt': '/gantt',
    'child-gantt': '/child-gantt',
    'timeline-planner': '/timeline-planner',
    'milestones': '/milestones',
    'scenarios': '/scenarios',
    'tracking': '/tracking',

    // Agile & Sprints
    'sprints': '/sprints',
    'backlog': '/backlog',

    // Deliverables & Changes
    'deliverables': '/deliverables',
    'change-requests': '/change-requests',

    // Governance & Compliance
    'project-charter': '/project-charter',
    'stakeholders': '/stakeholders',
    'traceability': '/traceability',

    // Issues & Risks
    'actions': '/actions',
    'risks': '/risks',
    'issues': '/issues',
    'decisions': '/decisions',

    // Financial
    'financials': '/financials',
    'evm': '/evm',

    // Collaboration
    'meetings': '/meetings',
    'calendar': '/calendar',
    'team-chat': '/team-chat',
    'communications': '/communications',
    'communication-intelligence': '/communication-intelligence',
    'collaboration-spaces': '/collaboration-spaces',

    // Documents & Knowledge
    'notes': '/notes',
    'documents': '/documents',
    'knowledge-base': '/knowledge-base',
    'presentations': '/presentations',

    // Resources & Team
    'resources': '/resources',
    'team-management': '/team-management',

    // Reports & Closure
    'reports': '/reports',
    'final-report': '/final-report',
    'lessons-learned': '/lessons-learned',

    // Admin & Settings
    'admin-project': '/admin/project',
    'admin-platform': '/admin/platform',
    'admin-templates': '/admin/templates',
    'settings': '/settings',

    // Project Creation
    'create-project': '/create-project',
};

export function QueryParamRedirect() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const view = searchParams.get('view');

        if (view && ROUTE_MAP[view]) {
            // Redirect to new route structure
            console.log(`[QueryParamRedirect] Redirecting from ?view=${view} to ${ROUTE_MAP[view]}`);
            navigate(ROUTE_MAP[view], { replace: true });
        } else if (view) {
            // Unknown view parameter, redirect to dashboard
            console.warn(`[QueryParamRedirect] Unknown view parameter: ${view}, redirecting to dashboard`);
            navigate('/dashboard', { replace: true });
        }
        // If no view parameter, Navigate component will handle redirect to dashboard
    }, [searchParams, navigate]);

    // Default redirect to dashboard if no view parameter
    const view = searchParams.get('view');
    if (!view) {
        return <Navigate to="/dashboard" replace />;
    }

    // Show loading state while redirecting
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Redirecting...</p>
            </div>
        </div>
    );
}
