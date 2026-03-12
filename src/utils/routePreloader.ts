// Route Preloader Utility
// Provides intelligent preloading of lazy-loaded route components

// Map of route paths to their lazy component imports
const routePreloadMap: Record<string, () => Promise<any>> = {
    // Dashboard Routes
    '/dashboard': () => import('@/components/views/DashboardHub'),
    '/dashboard/executive': () => import('@/components/views/ExecutiveDashboardView'),
    '/dashboard/strategic': () => import('@/components/views/StrategicDashboardView'),

    // Project Management Routes
    '/gantt': () => import('@/components/views/GanttView'),
    '/sprint-board': () => import('@/components/views/SprintBoardView'),
    '/planning': () => import('@/components/views/PlanningView'),
    '/backlog': () => import('@/components/views/BacklogView'),
    '/milestones': () => import('@/components/views/MilestonesView'),
    '/tracking': () => import('@/components/views/TrackingView'),

    // Financial Routes
    '/financials': () => import('@/components/views/FinancialsView'),
    '/evm': () => import('@/components/views/EVMView'),

    // Collaboration Routes
    '/meetings': () => import('@/components/views/EnhancedMeetingsView'),
    '/calendar': () => import('@/components/views/CalendarView'),
    '/notes': () => import('@/components/views/NotesView'),
    '/communications': () => import('@/components/communications/CommunicationsView'),
    '/communication-intelligence': () => import('@/components/views/CommunicationIntelligenceView'),
    '/team-chat': () => import('@/components/views/TeamChatView'),

    // Documentation Routes
    '/presentations': () => import('@/components/views/PresentationsView'),
    '/documents': () => import('@/components/views/DocumentCenterView'),
    '/knowledge-base': () => import('@/components/views/KnowledgeBaseView'),

    // Program Management Routes
    '/program-timeline': () => import('@/components/views/ProgramTimelineView'),
    '/program-documents': () => import('@/components/views/ProgramDocumentsView'),
    '/collaboration-spaces': () => import('@/components/views/CollaborationSpacesView'),
    '/child-plans': () => import('@/components/views/ChildPlansView'),
    '/child-gantt': () => import('@/components/views/ChildGanttView'),

    // Quality & Risk Routes
    '/issues': () => import('@/components/views/IssuesRegisterView'),
    '/actions': () => import('@/components/views/ActionsView'),
    '/risks': () => import('@/components/views/RisksView'),
    '/decisions': () => import('@/components/views/DecisionsView'),
    '/change-requests': () => import('@/components/views/ChangeRequestsView'),

    // Requirements & Deliverables Routes
    '/traceability': () => import('@/components/views/TraceabilityMatrixView'),
    '/deliverables': () => import('@/components/views/DeliverablesView'),
    '/scenarios': () => import('@/components/views/ScenariosView'),

    // Reporting Routes
    '/reports': () => import('@/components/views/ReportsView'),
    '/final-report': () => import('@/components/views/FinalReportView'),
    '/lessons-learned': () => import('@/components/views/LessonsLearnedView'),

    // Project Setup Routes
    '/project-charter': () => import('@/components/views/ProjectCharterView'),
    '/stakeholder-register': () => import('@/components/views/StakeholderRegisterView'),
    '/morning-briefing': () => import('@/components/views/MorningBriefingView'),

    // Resource Management Routes
    '/resources': () => import('@/components/views/ResourcesView'),
    '/team-management': () => import('@/components/views/TeamManagementView'),

    // Admin Routes
    '/settings': () => import('@/components/views/UserSettingsView'),
    '/project-admin': () => import('@/components/views/ProjectAdminView'),
    '/platform-admin': () => import('@/components/views/PlatformAdminView'),
    '/templates-admin': () => import('@/components/views/TemplatesAdminView'),
    '/project-creation': () => import('@/components/views/ProjectCreationView'),

    // Timeline Routes
    '/timeline-planner': () => import('@/components/views/TimelinePlannerTab'),
};

// Track which routes have been preloaded to avoid duplicates
const preloadedRoutes = new Set<string>();

// Track preload promises to avoid race conditions
const preloadPromises = new Map<string, Promise<any>>();

/**
 * Preload a specific route's component chunk
 * @param path - The route path to preload
 * @returns Promise that resolves when the chunk is loaded
 */
export const preloadRoute = (path: string): Promise<void> => {
    // Already preloaded
    if (preloadedRoutes.has(path)) {
        return Promise.resolve();
    }

    // Currently preloading
    if (preloadPromises.has(path)) {
        return preloadPromises.get(path)!.then(() => { });
    }

    const preloadFn = routePreloadMap[path];
    if (!preloadFn) {
        console.warn(`⚠️ No preload function found for route: ${path}`);
        return Promise.resolve();
    }

    const promise = preloadFn()
        .then(() => {
            preloadedRoutes.add(path);
            preloadPromises.delete(path);
            if (process.env.NODE_ENV === 'development') {
                console.log(`✅ Preloaded route: ${path}`);
            }
        })
        .catch((err) => {
            preloadPromises.delete(path);
            console.warn(`⚠️ Failed to preload route: ${path}`, err);
        });

    preloadPromises.set(path, promise);
    return promise.then(() => { });
};

/**
 * Preload multiple routes
 * @param paths - Array of route paths to preload
 */
export const preloadRoutes = (paths: string[]): void => {
    paths.forEach(preloadRoute);
};

/**
 * Preload critical routes (most commonly accessed)
 * These are loaded immediately on app start
 */
export const preloadCriticalRoutes = (): void => {
    const criticalRoutes = [
        '/dashboard',
        '/gantt',
        '/sprint-board',
        '/planning',
        '/meetings',
        '/calendar',
    ];
    preloadRoutes(criticalRoutes);
};

/**
 * Preload all routes during browser idle time
 * Uses requestIdleCallback for optimal performance
 */
export const preloadAllRoutes = (): void => {
    const allRoutes = Object.keys(routePreloadMap);

    if ('requestIdleCallback' in window) {
        // Use idle callback for better performance
        requestIdleCallback(() => {
            preloadRoutes(allRoutes);
        }, { timeout: 5000 });
    } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
            preloadRoutes(allRoutes);
        }, 3000);
    }
};

/**
 * Check if a route has been preloaded
 * @param path - The route path to check
 * @returns true if the route has been preloaded
 */
export const isRoutePreloaded = (path: string): boolean => {
    return preloadedRoutes.has(path);
};

/**
 * Get preload statistics
 * @returns Object with preload stats
 */
export const getPreloadStats = () => {
    return {
        totalRoutes: Object.keys(routePreloadMap).length,
        preloadedRoutes: preloadedRoutes.size,
        currentlyPreloading: preloadPromises.size,
        preloadedPaths: Array.from(preloadedRoutes),
    };
};
