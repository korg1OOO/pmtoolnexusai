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
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { PresenceProvider } from '@/contexts/PresenceContext';
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

/** Tiny helper: wraps children in ProtectedRoute + ProjectProvider + PresenceProvider */
const AuthedPage = ({ children }: { children: React.ReactNode }) => (
    <ProtectedRoute>
        <ProjectProvider>
            <PresenceProvider>
                {children}
            </PresenceProvider>
        </ProjectProvider>
    </ProtectedRoute>
);

export function TenantWorkspaceRoutes() {
    return (
        <>
            {/* ── Billing (own full-page layout) ───────────────────────────── */}
            <Route path="/billing" element={<AuthedPage><BillingPage /></AuthedPage>} />

            {/* ── ML Analytics (project-scoped, own full-page layout) ───────── */}
            <Route path="/ml-analytics/:projectId" element={<AuthedPage><MLAnalyticsHub /></AuthedPage>} />

            {/* ── Tenant Admin ─────────────────────────────────────────────── */}
            <Route path="/tenant" element={<AuthedPage><TenantDashboard /></AuthedPage>} />
            <Route path="/tenant/workspaces" element={<AuthedPage><WorkspaceManagement /></AuthedPage>} />
            <Route path="/tenant/settings" element={<AuthedPage><TenantSettings /></AuthedPage>} />
            <Route path="/tenant/users" element={<AuthedPage><TenantUserManagement /></AuthedPage>} />
            <Route path="/tenant/analytics" element={<AuthedPage><TenantAnalytics /></AuthedPage>} />
            <Route path="/tenant/departments" element={<AuthedPage><DepartmentManagement /></AuthedPage>} />
            <Route path="/tenant/licenses" element={<AuthedPage><LicenseAllocation /></AuthedPage>} />

            {/* ── Workspace Admin ───────────────────────────────────────────── */}
            <Route path="/workspace/:workspaceId" element={<AuthedPage><WorkspaceDashboard /></AuthedPage>} />
            <Route path="/workspace/:workspaceId/portfolios" element={<AuthedPage><PortfolioView /></AuthedPage>} />
            <Route path="/workspace/:workspaceId/teams" element={<AuthedPage><TeamAssignment /></AuthedPage>} />
            <Route path="/workspace/:workspaceId/resources" element={<AuthedPage><WorkspaceResourceAllocation /></AuthedPage>} />
            <Route path="/workspace/:workspaceId/budget" element={<AuthedPage><WorkspaceBudgetManagement /></AuthedPage>} />
            <Route path="/workspace/:workspaceId/analytics" element={<AuthedPage><WorkspaceAnalytics /></AuthedPage>} />
            <Route path="/workspace/:workspaceId/analytics/performance" element={<AuthedPage><ProjectPerformanceDetail /></AuthedPage>} />
            <Route path="/workspace/:workspaceId/analytics/portfolio" element={<AuthedPage><PortfolioDistributionDetail /></AuthedPage>} />
            <Route path="/workspace/:workspaceId/analytics/portfolio/:portfolioId" element={<AuthedPage><PortfolioDistributionDetail /></AuthedPage>} />
            <Route path="/workspace/:workspaceId/analytics/resources" element={<AuthedPage><ResourceUtilizationDetail /></AuthedPage>} />

            {/* ── Portfolio Admin ───────────────────────────────────────────── */}
            <Route path="/portfolio/:portfolioId" element={<AuthedPage><PortfolioDashboard /></AuthedPage>} />
            <Route path="/portfolio/:portfolioId/resources" element={<AuthedPage><ResourcePlanningView /></AuthedPage>} />
            <Route path="/portfolio/:portfolioId/budget" element={<AuthedPage><PortfolioBudgetOverview /></AuthedPage>} />
            <Route path="/portfolio/:portfolioId/roadmap" element={<AuthedPage><StrategicRoadmap /></AuthedPage>} />

            {/* ── Program Manager ───────────────────────────────────────────── */}
            <Route path="/program/:programId/stakeholders" element={<AuthedPage><StakeholderManagement /></AuthedPage>} />
            <Route path="/program/:programId/resources" element={<AuthedPage><AdvancedResourceAllocation /></AuthedPage>} />
            <Route path="/program/:programId/budget" element={<AuthedPage><ProgramBudgetManagement /></AuthedPage>} />
        </>
    );
}
