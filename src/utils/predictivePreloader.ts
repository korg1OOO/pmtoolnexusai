import { preloadRoutes } from './routePreloader';

/**
 * Predict likely next routes based on current route
 * Used for intelligent background preloading
 */
const routePredictions: Record<string, string[]> = {
    // Dashboard predictions
    '/dashboard': ['/gantt', '/sprint-board', '/planning', '/meetings'],
    '/dashboard/executive': ['/dashboard', '/reports', '/financials'],
    '/dashboard/strategic': ['/dashboard', '/scenarios', '/program-timeline'],

    // Project Management predictions
    '/gantt': ['/sprint-board', '/planning', '/milestones', '/tracking'],
    '/sprint-board': ['/backlog', '/planning', '/tracking', '/gantt'],
    '/planning': ['/gantt', '/sprint-board', '/scenarios', '/milestones'],
    '/backlog': ['/sprint-board', '/planning', '/issues'],
    '/milestones': ['/gantt', '/tracking', '/deliverables'],
    '/tracking': ['/gantt', '/sprint-board', '/reports'],

    // Financial predictions
    '/financials': ['/evm', '/reports', '/dashboard'],
    '/evm': ['/financials', '/tracking', '/reports'],

    // Collaboration predictions
    '/meetings': ['/calendar', '/actions', '/notes'],
    '/calendar': ['/meetings', '/planning', '/dashboard'],
    '/notes': ['/meetings', '/documents', '/knowledge-base'],
    '/communications': ['/communication-intelligence', '/team-chat', '/meetings'],
    '/communication-intelligence': ['/communications', '/meetings', '/actions'],
    '/team-chat': ['/communications', '/team-management', '/meetings'],

    // Documentation predictions
    '/presentations': ['/documents', '/reports', '/meetings'],
    '/documents': ['/knowledge-base', '/presentations', '/notes'],
    '/knowledge-base': ['/documents', '/notes', '/lessons-learned'],

    // Program Management predictions
    '/program-timeline': ['/child-plans', '/program-documents', '/gantt'],
    '/program-documents': ['/program-timeline', '/documents', '/collaboration-spaces'],
    '/collaboration-spaces': ['/program-documents', '/team-chat', '/meetings'],
    '/child-plans': ['/child-gantt', '/program-timeline', '/gantt'],
    '/child-gantt': ['/child-plans', '/gantt', '/program-timeline'],

    // Quality & Risk predictions
    '/issues': ['/actions', '/risks', '/change-requests'],
    '/actions': ['/issues', '/meetings', '/decisions'],
    '/risks': ['/issues', '/decisions', '/change-requests'],
    '/decisions': ['/actions', '/risks', '/meetings'],
    '/change-requests': ['/issues', '/risks', '/deliverables'],

    // Requirements & Deliverables predictions
    '/traceability': ['/deliverables', '/scenarios', '/requirements'],
    '/deliverables': ['/milestones', '/traceability', '/change-requests'],
    '/scenarios': ['/planning', '/traceability', '/dashboard/strategic'],

    // Reporting predictions
    '/reports': ['/dashboard', '/tracking', '/financials'],
    '/final-report': ['/reports', '/lessons-learned', '/deliverables'],
    '/lessons-learned': ['/final-report', '/knowledge-base', '/reports'],

    // Project Setup predictions
    '/project-charter': ['/stakeholder-register', '/planning', '/dashboard'],
    '/stakeholder-register': ['/project-charter', '/communications', '/team-management'],
    '/morning-briefing': ['/dashboard', '/actions', '/calendar'],

    // Resource Management predictions
    '/resources': ['/team-management', '/planning', '/financials'],
    '/team-management': ['/resources', '/team-chat', '/stakeholder-register'],

    // Admin predictions
    '/settings': ['/project-admin', '/dashboard'],
    '/project-admin': ['/settings', '/platform-admin', '/templates-admin'],
    '/platform-admin': ['/project-admin', '/settings'],
    '/templates-admin': ['/project-admin', '/project-creation'],
    '/project-creation': ['/project-charter', '/planning', '/dashboard'],
};

/**
 * Preload routes that are likely to be visited next based on current route
 * @param currentPath - The current route path
 */
export const preloadPredictedRoutes = (currentPath: string): void => {
    const predictions = routePredictions[currentPath];
    if (predictions && predictions.length > 0) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔮 Preloading predicted routes for ${currentPath}:`, predictions);
        }
        preloadRoutes(predictions);
    }
};

/**
 * Get predicted routes for a given path
 * @param currentPath - The current route path
 * @returns Array of predicted route paths
 */
export const getPredictedRoutes = (currentPath: string): string[] => {
    return routePredictions[currentPath] || [];
};

/**
 * Add or update route predictions
 * Useful for dynamic prediction updates based on user behavior
 * @param path - The route path
 * @param predictions - Array of predicted next routes
 */
export const updateRoutePredictions = (path: string, predictions: string[]): void => {
    routePredictions[path] = predictions;
};
