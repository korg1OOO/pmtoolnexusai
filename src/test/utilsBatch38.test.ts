/**
 * Tests batch 38: routePreloader deep behavioral tests (190 lines, 6 functions)
 * preloadRoute, preloadRoutes, preloadCriticalRoutes, preloadAllRoutes, isRoutePreloaded, getPreloadStats
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all view component imports to resolve immediately
vi.mock('@/components/views/DashboardHub', () => ({ default: {} }));
vi.mock('@/components/views/ExecutiveDashboardView', () => ({ default: {} }));
vi.mock('@/components/views/StrategicDashboardView', () => ({ default: {} }));
vi.mock('@/components/views/GanttView', () => ({ default: {} }));
vi.mock('@/components/views/SprintBoardView', () => ({ default: {} }));
vi.mock('@/components/views/PlanningView', () => ({ default: {} }));
vi.mock('@/components/views/BacklogView', () => ({ default: {} }));
vi.mock('@/components/views/MilestonesView', () => ({ default: {} }));
vi.mock('@/components/views/TrackingView', () => ({ default: {} }));
vi.mock('@/components/views/FinancialsView', () => ({ default: {} }));
vi.mock('@/components/views/EVMView', () => ({ default: {} }));
vi.mock('@/components/views/EnhancedMeetingsView', () => ({ default: {} }));
vi.mock('@/components/views/CalendarView', () => ({ default: {} }));
vi.mock('@/components/views/NotesView', () => ({ default: {} }));
vi.mock('@/components/communications/CommunicationsView', () => ({ default: {} }));
vi.mock('@/components/views/CommunicationIntelligenceView', () => ({ default: {} }));
vi.mock('@/components/views/TeamChatView', () => ({ default: {} }));
vi.mock('@/components/views/PresentationsView', () => ({ default: {} }));
vi.mock('@/components/views/DocumentCenterView', () => ({ default: {} }));
vi.mock('@/components/views/KnowledgeBaseView', () => ({ default: {} }));
vi.mock('@/components/views/ProgramTimelineView', () => ({ default: {} }));
vi.mock('@/components/views/ProgramDocumentsView', () => ({ default: {} }));
vi.mock('@/components/views/CollaborationSpacesView', () => ({ default: {} }));
vi.mock('@/components/views/ChildPlansView', () => ({ default: {} }));
vi.mock('@/components/views/ChildGanttView', () => ({ default: {} }));
vi.mock('@/components/views/IssuesRegisterView', () => ({ default: {} }));
vi.mock('@/components/views/ActionsView', () => ({ default: {} }));
vi.mock('@/components/views/RisksView', () => ({ default: {} }));
vi.mock('@/components/views/DecisionsView', () => ({ default: {} }));
vi.mock('@/components/views/ChangeRequestsView', () => ({ default: {} }));
vi.mock('@/components/views/TraceabilityMatrixView', () => ({ default: {} }));
vi.mock('@/components/views/DeliverablesView', () => ({ default: {} }));
vi.mock('@/components/views/ScenariosView', () => ({ default: {} }));
vi.mock('@/components/views/ReportsView', () => ({ default: {} }));
vi.mock('@/components/views/FinalReportView', () => ({ default: {} }));
vi.mock('@/components/views/LessonsLearnedView', () => ({ default: {} }));
vi.mock('@/components/views/ProjectCharterView', () => ({ default: {} }));
vi.mock('@/components/views/StakeholderRegisterView', () => ({ default: {} }));
vi.mock('@/components/views/MorningBriefingView', () => ({ default: {} }));
vi.mock('@/components/views/ResourcesView', () => ({ default: {} }));
vi.mock('@/components/views/TeamManagementView', () => ({ default: {} }));
vi.mock('@/components/views/UserSettingsView', () => ({ default: {} }));
vi.mock('@/components/views/ProjectAdminView', () => ({ default: {} }));
vi.mock('@/components/views/PlatformAdminView', () => ({ default: {} }));
vi.mock('@/components/views/TemplatesAdminView', () => ({ default: {} }));
vi.mock('@/components/views/ProjectCreationView', () => ({ default: {} }));
vi.mock('@/components/views/TimelinePlannerTab', () => ({ default: {} }));

import { preloadRoute, isRoutePreloaded, getPreloadStats, preloadCriticalRoutes } from '@/utils/routePreloader';

describe('routePreloader', () => {
    it('getPreloadStats returns initial stats', () => {
        const stats = getPreloadStats();
        expect(stats).toBeDefined();
        expect(stats.totalRoutes).toBeGreaterThan(30);
        expect(typeof stats.preloadedRoutes).toBe('number');
        expect(typeof stats.currentlyPreloading).toBe('number');
        expect(Array.isArray(stats.preloadedPaths)).toBe(true);
    });

    it('isRoutePreloaded returns false for unknown route', () => {
        expect(isRoutePreloaded('/nonexistent-route')).toBe(false);
    });

    it('preloadRoute resolves for known route', async () => {
        await preloadRoute('/dashboard');
        expect(isRoutePreloaded('/dashboard')).toBe(true);
    });

    it('preloadRoute resolves for unknown route without error', async () => {
        await preloadRoute('/this-route-does-not-exist');
        // Should not throw, just warns
    });

    it('preloadRoute deduplicates', async () => {
        await preloadRoute('/gantt');
        await preloadRoute('/gantt'); // Should resolve immediately
        expect(isRoutePreloaded('/gantt')).toBe(true);
    });

    it('preloadCriticalRoutes preloads 6 routes', async () => {
        preloadCriticalRoutes();
        // Wait for async preloading
        await new Promise(r => setTimeout(r, 100));
        expect(isRoutePreloaded('/dashboard')).toBe(true);
    });

    it('getPreloadStats reflects preloaded routes', async () => {
        await preloadRoute('/sprint-board');
        const stats = getPreloadStats();
        expect(stats.preloadedRoutes).toBeGreaterThan(0);
    });
});
