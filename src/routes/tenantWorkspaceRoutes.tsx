/**
 * Tenant, Workspace, Portfolio & Program Routes
 *
 * These routes use bare <ProtectedRoute> because they have their own
 * full-page layouts (no AppShell sidebar). They manually wrap
 * ProjectProvider + PresenceProvider.
 *
 * See: src/routes/README.md for the full guard rule documentation.
 */

import { Route } from 'react-router-dom';
import { ProtectedProjectRoute } from '@/components/routing';

import MLAnalyticsHub from '@/components/views/MLAnalyticsHub';
import {
    TenantDashboard,
    WorkspaceManagement,
    TenantSettings,
    TenantUserManagement,
    TenantAnalytics,
    DepartmentManagement,
    LicenseAllocation,
} from '@/components/tenant';
import {
    WorkspaceDashboard,
    PortfolioView,
    TeamAssignment,
    WorkspaceResourceAllocation,
    WorkspaceBudgetManagement,
    WorkspaceAnalytics,
} from '@/components/workspace';
import {
    ProjectPerformanceDetail,
    PortfolioDistributionDetail,
    ResourceUtilizationDetail,
} from '@/components/analytics';
import {
    PortfolioDashboard,
    ResourcePlanningView,
    PortfolioBudgetOverview,
    StrategicRoadmap,
} from '@/components/portfolio';
import {
    StakeholderManagement,
    AdvancedResourceAllocation,
    ProgramBudgetManagement,
} from '@/components/program';
import { BillingPage } from '@/components/subscription/BillingPage';



export function TenantWorkspaceRoutes() {
    return (
        <>
            {/* ── Billing (own full-page layout) ───────────────────────────── */}
            <Route path="/billing" element={<ProtectedProjectRoute><BillingPage /></ProtectedProjectRoute>} />

            {/* ── ML Analytics (project-scoped, own full-page layout) ───────── */}
            <Route path="/ml-analytics/:projectId" element={<ProtectedProjectRoute><MLAnalyticsHub /></ProtectedProjectRoute>} />

            {/* ── Tenant Admin ─────────────────────────────────────────────── */}
            <Route path="/tenant" element={<ProtectedProjectRoute><TenantDashboard /></ProtectedProjectRoute>} />
            <Route path="/tenant/workspaces" element={<ProtectedProjectRoute><WorkspaceManagement /></ProtectedProjectRoute>} />
            <Route path="/tenant/settings" element={<ProtectedProjectRoute><TenantSettings /></ProtectedProjectRoute>} />
            <Route path="/tenant/users" element={<ProtectedProjectRoute><TenantUserManagement /></ProtectedProjectRoute>} />
            <Route path="/tenant/analytics" element={<ProtectedProjectRoute><TenantAnalytics /></ProtectedProjectRoute>} />
            <Route path="/tenant/departments" element={<ProtectedProjectRoute><DepartmentManagement /></ProtectedProjectRoute>} />
            <Route path="/tenant/licenses" element={<ProtectedProjectRoute><LicenseAllocation /></ProtectedProjectRoute>} />

            {/* ── Workspace Admin ───────────────────────────────────────────── */}
            <Route path="/workspace/:workspaceId" element={<ProtectedProjectRoute><WorkspaceDashboard /></ProtectedProjectRoute>} />
            <Route path="/workspace/:workspaceId/portfolios" element={<ProtectedProjectRoute><PortfolioView /></ProtectedProjectRoute>} />
            <Route path="/workspace/:workspaceId/teams" element={<ProtectedProjectRoute><TeamAssignment /></ProtectedProjectRoute>} />
            <Route path="/workspace/:workspaceId/resources" element={<ProtectedProjectRoute><WorkspaceResourceAllocation /></ProtectedProjectRoute>} />
            <Route path="/workspace/:workspaceId/budget" element={<ProtectedProjectRoute><WorkspaceBudgetManagement /></ProtectedProjectRoute>} />
            <Route path="/workspace/:workspaceId/analytics" element={<ProtectedProjectRoute><WorkspaceAnalytics /></ProtectedProjectRoute>} />
            <Route path="/workspace/:workspaceId/analytics/performance" element={<ProtectedProjectRoute><ProjectPerformanceDetail /></ProtectedProjectRoute>} />
            <Route path="/workspace/:workspaceId/analytics/portfolio" element={<ProtectedProjectRoute><PortfolioDistributionDetail /></ProtectedProjectRoute>} />
            <Route path="/workspace/:workspaceId/analytics/portfolio/:portfolioId" element={<ProtectedProjectRoute><PortfolioDistributionDetail /></ProtectedProjectRoute>} />
            <Route path="/workspace/:workspaceId/analytics/resources" element={<ProtectedProjectRoute><ResourceUtilizationDetail /></ProtectedProjectRoute>} />

            {/* ── Portfolio Admin ───────────────────────────────────────────── */}
            <Route path="/portfolio/:portfolioId" element={<ProtectedProjectRoute><PortfolioDashboard /></ProtectedProjectRoute>} />
            <Route path="/portfolio/:portfolioId/resources" element={<ProtectedProjectRoute><ResourcePlanningView /></ProtectedProjectRoute>} />
            <Route path="/portfolio/:portfolioId/budget" element={<ProtectedProjectRoute><PortfolioBudgetOverview /></ProtectedProjectRoute>} />
            <Route path="/portfolio/:portfolioId/roadmap" element={<ProtectedProjectRoute><StrategicRoadmap /></ProtectedProjectRoute>} />

            {/* ── Program Manager ───────────────────────────────────────────── */}
            <Route path="/program/:programId/stakeholders" element={<ProtectedProjectRoute><StakeholderManagement /></ProtectedProjectRoute>} />
            <Route path="/program/:programId/resources" element={<ProtectedProjectRoute><AdvancedResourceAllocation /></ProtectedProjectRoute>} />
            <Route path="/program/:programId/budget" element={<ProtectedProjectRoute><ProgramBudgetManagement /></ProtectedProjectRoute>} />
        </>
    );
}
