/**
 * Tenant, Workspace, Portfolio & Program Routes
 *
 * Tenant admin routes (/tenant/*) are protected by TenantRoute
 * which enforces both authentication AND tenant-level role (owner/admin).
 *
 * Workspace routes are protected by WorkspaceRoute (workspace_members).
 * Program routes are protected by ProgramRoute (program_members).
 * Portfolio/Workspace/Program routes require Business tier.
 *
 * See: src/routes/README.md for the full guard rule documentation.
 */

import { Route } from 'react-router-dom';
import { ProtectedProjectRoute } from '@/components/routing';
import { TenantRoute } from '@/components/auth/TenantRoute';
import { WorkspaceRoute } from '@/components/auth/WorkspaceRoute';
import { ProgramRoute } from '@/components/auth/ProgramRoute';
import { RequireTier } from '@/components/subscription/RequireTier';

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

            {/* ── Tenant Admin (requires owner/admin tenant role) ────────────── */}
            <Route path="/tenant" element={<ProtectedProjectRoute><TenantRoute><TenantDashboard /></TenantRoute></ProtectedProjectRoute>} />
            <Route path="/tenant/workspaces" element={<ProtectedProjectRoute><TenantRoute><WorkspaceManagement /></TenantRoute></ProtectedProjectRoute>} />
            <Route path="/tenant/settings" element={<ProtectedProjectRoute><TenantRoute><TenantSettings /></TenantRoute></ProtectedProjectRoute>} />
            <Route path="/tenant/users" element={<ProtectedProjectRoute><TenantRoute><TenantUserManagement /></TenantRoute></ProtectedProjectRoute>} />
            <Route path="/tenant/analytics" element={<ProtectedProjectRoute><TenantRoute><TenantAnalytics /></TenantRoute></ProtectedProjectRoute>} />
            <Route path="/tenant/departments" element={<ProtectedProjectRoute><TenantRoute><DepartmentManagement /></TenantRoute></ProtectedProjectRoute>} />
            <Route path="/tenant/licenses" element={<ProtectedProjectRoute><TenantRoute><LicenseAllocation /></TenantRoute></ProtectedProjectRoute>} />

            {/* ── Workspace Admin (requires membership + Business tier) ───── */}
            <Route path="/workspace/:workspaceId" element={<ProtectedProjectRoute><RequireTier minTier="business"><WorkspaceRoute><WorkspaceDashboard /></WorkspaceRoute></RequireTier></ProtectedProjectRoute>} />
            <Route path="/workspace/:workspaceId/portfolios" element={<ProtectedProjectRoute><RequireTier minTier="business"><WorkspaceRoute><PortfolioView /></WorkspaceRoute></RequireTier></ProtectedProjectRoute>} />
            <Route path="/workspace/:workspaceId/teams" element={<ProtectedProjectRoute><RequireTier minTier="business"><WorkspaceRoute><TeamAssignment /></WorkspaceRoute></RequireTier></ProtectedProjectRoute>} />
            <Route path="/workspace/:workspaceId/resources" element={<ProtectedProjectRoute><RequireTier minTier="business"><WorkspaceRoute><WorkspaceResourceAllocation /></WorkspaceRoute></RequireTier></ProtectedProjectRoute>} />
            <Route path="/workspace/:workspaceId/budget" element={<ProtectedProjectRoute><RequireTier minTier="business"><WorkspaceRoute><WorkspaceBudgetManagement /></WorkspaceRoute></RequireTier></ProtectedProjectRoute>} />
            <Route path="/workspace/:workspaceId/analytics" element={<ProtectedProjectRoute><RequireTier minTier="business"><WorkspaceRoute><WorkspaceAnalytics /></WorkspaceRoute></RequireTier></ProtectedProjectRoute>} />
            <Route path="/workspace/:workspaceId/analytics/performance" element={<ProtectedProjectRoute><RequireTier minTier="business"><WorkspaceRoute><ProjectPerformanceDetail /></WorkspaceRoute></RequireTier></ProtectedProjectRoute>} />
            <Route path="/workspace/:workspaceId/analytics/portfolio" element={<ProtectedProjectRoute><RequireTier minTier="business"><WorkspaceRoute><PortfolioDistributionDetail /></WorkspaceRoute></RequireTier></ProtectedProjectRoute>} />
            <Route path="/workspace/:workspaceId/analytics/portfolio/:portfolioId" element={<ProtectedProjectRoute><RequireTier minTier="business"><WorkspaceRoute><PortfolioDistributionDetail /></WorkspaceRoute></RequireTier></ProtectedProjectRoute>} />
            <Route path="/workspace/:workspaceId/analytics/resources" element={<ProtectedProjectRoute><RequireTier minTier="business"><WorkspaceRoute><ResourceUtilizationDetail /></WorkspaceRoute></RequireTier></ProtectedProjectRoute>} />

            {/* ── Portfolio Admin (requires Business tier) ────────────────── */}
            <Route path="/portfolio/:portfolioId" element={<ProtectedProjectRoute><RequireTier minTier="business"><PortfolioDashboard /></RequireTier></ProtectedProjectRoute>} />
            <Route path="/portfolio/:portfolioId/resources" element={<ProtectedProjectRoute><RequireTier minTier="business"><ResourcePlanningView /></RequireTier></ProtectedProjectRoute>} />
            <Route path="/portfolio/:portfolioId/budget" element={<ProtectedProjectRoute><RequireTier minTier="business"><PortfolioBudgetOverview /></RequireTier></ProtectedProjectRoute>} />
            <Route path="/portfolio/:portfolioId/roadmap" element={<ProtectedProjectRoute><RequireTier minTier="business"><StrategicRoadmap /></RequireTier></ProtectedProjectRoute>} />

            {/* ── Program Manager (requires membership + Business tier) ──── */}
            <Route path="/program/:programId/stakeholders" element={<ProtectedProjectRoute><RequireTier minTier="business"><ProgramRoute><StakeholderManagement /></ProgramRoute></RequireTier></ProtectedProjectRoute>} />
            <Route path="/program/:programId/resources" element={<ProtectedProjectRoute><RequireTier minTier="business"><ProgramRoute><AdvancedResourceAllocation /></ProgramRoute></RequireTier></ProtectedProjectRoute>} />
            <Route path="/program/:programId/budget" element={<ProtectedProjectRoute><RequireTier minTier="business"><ProgramRoute><ProgramBudgetManagement /></ProgramRoute></RequireTier></ProtectedProjectRoute>} />
        </>
    );
}

