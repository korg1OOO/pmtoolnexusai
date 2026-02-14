import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OAuthCallback from "./pages/OAuthCallback";
import Debug from "./pages/Debug";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import ProductTour from "./pages/ProductTour";
import MLAnalyticsHub from "./components/views/MLAnalyticsHub";
import PublicFAQs from "./pages/PublicFAQs";
import PublicBlog from "./pages/PublicBlog";
import BlogPostView from "./pages/BlogPostView";
import PublicDocs from "./pages/PublicDocs";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { PresenceProvider } from "@/contexts/PresenceContext";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { PurchaseCreditsPage } from "@/components/credits/PurchaseCreditsPage";
import { UsageDashboard } from "@/components/credits/UsageDashboard";
import { AutoRechargeSettings } from "@/components/credits/AutoRechargeSettings";
import {
  AdminDashboard,
  AdminUsers,
  AdminProUsers,
  AdminHealthCheck,
  AdminAIUsage,
  AdminAICredits,
  AdminContentManagement,
  AdminDocs,
  AdminMedia,
  AdminBlogPostEditor,
  AdminLicenseKeys,
  AdminSecurityAudit,
  AdminBilling,
  AdminDiscountCodes,
  AdminManagement,
  AdminRequests,
  AdminAnalytics,
  AdminMarketing,
  AdminEmailAutomation,
  AdminAffiliates,
  AdminBackups,
  AdminOrganizations,
  AdminSecurity,
  AdminAPIKeys,
  AdminAuditLogs,
  EmailTemplateManager,
  IMAPConfigurationManager,
  NotificationAnalyticsDashboard,
} from "@/components/admin/pages";
import MLDashboard from './components/ml/MLDashboard';
import { HelmetProvider } from 'react-helmet-async';
import { TicketDetail } from '@/components/admin/pages/TicketDetail';
import { EmailTemplateEditor } from '@/components/admin/pages/EmailTemplateEditor';
import { EmailCampaignBuilder } from '@/components/admin/pages/EmailCampaignBuilder';
import { EmailCampaignDetail } from '@/components/admin/pages/EmailCampaignDetail';
import { DatabaseMigrationPanel } from '@/components/admin/DatabaseMigrationPanel';
import { TenantDashboard, WorkspaceManagement, TenantSettings, TenantUserManagement, TenantAnalytics, DepartmentManagement, LicenseAllocation } from '@/components/tenant';
import { WorkspaceDashboard, PortfolioView, TeamAssignment, WorkspaceResourceAllocation, WorkspaceBudgetManagement, WorkspaceAnalytics } from '@/components/workspace';
import { PortfolioDashboard, ResourcePlanningView, PortfolioBudgetOverview, StrategicRoadmap } from '@/components/portfolio';
import { StakeholderManagement, AdvancedResourceAllocation, ProgramBudgetManagement } from '@/components/program';
import {
  MLModelsPage,
  MLAlertsPage,
  MLPredictionsPage,
  MLRetrainingPage,
  MLAccuracyPage,
  MLTrainingDataPage,
} from './components/ml/MLPages';
import { MLAnalyticsPage } from './components/ml/pages/MLAnalyticsPage';

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={
                <ProjectProvider>
                  <PresenceProvider>
                    <LandingPage />
                  </PresenceProvider>
                </ProjectProvider>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/product-tour" element={
                <ProjectProvider>
                  <PresenceProvider>
                    <ProductTour />
                  </PresenceProvider>
                </ProjectProvider>
              } />
              <Route path="/login" element={<Auth />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/faqs" element={<PublicFAQs />} />
              <Route path="/blog" element={<PublicBlog />} />
              <Route path="/blog/:slug" element={<BlogPostView />} />
              <Route path="/docs" element={<PublicDocs />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              <Route path="/debug" element={<Debug />} />
              <Route path="/ml-analytics/:projectId" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <MLAnalyticsHub />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              {/* Tenant Admin Routes */}
              <Route path="/tenant" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <TenantDashboard />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              <Route path="/tenant/workspaces" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <WorkspaceManagement />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              <Route path="/tenant/settings" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <TenantSettings />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              <Route path="/tenant/users" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <TenantUserManagement tenantId="default-tenant-id" />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              <Route path="/tenant/analytics" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <TenantAnalytics />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              <Route path="/tenant/departments" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <DepartmentManagement />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              <Route path="/tenant/licenses" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <LicenseAllocation />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              {/* Workspace Admin Routes */}
              <Route path="/workspace/:workspaceId" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <WorkspaceDashboard />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              <Route path="/workspace/:workspaceId/portfolios" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <PortfolioView />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              <Route path="/workspace/:workspaceId/teams" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <TeamAssignment />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              <Route path="/workspace/:workspaceId/resources" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <WorkspaceResourceAllocation />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              <Route path="/workspace/:workspaceId/budget" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <WorkspaceBudgetManagement />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              <Route path="/workspace/:workspaceId/analytics" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <WorkspaceAnalytics />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              {/* Portfolio Admin Routes */}
              <Route path="/portfolio/:portfolioId" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <PortfolioDashboard />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              <Route path="/portfolio/:portfolioId/resources" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <ResourcePlanningView />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              <Route path="/portfolio/:portfolioId/budget" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <PortfolioBudgetOverview />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              <Route path="/portfolio/:portfolioId/roadmap" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <StrategicRoadmap />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              {/* Program Manager Routes */}
              <Route path="/program/:programId/stakeholders" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <StakeholderManagement />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              <Route path="/program/:programId/resources" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <AdvancedResourceAllocation />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              <Route path="/program/:programId/budget" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <ProgramBudgetManagement />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              {/* AI Credits Routes */}
              <Route path="/purchase-credits" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <PurchaseCreditsPage />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              <Route path="/usage-dashboard" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <UsageDashboard />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              <Route path="/auto-recharge" element={
                <ProtectedRoute>
                  <ProjectProvider>
                    <PresenceProvider>
                      <AutoRechargeSettings />
                    </PresenceProvider>
                  </ProjectProvider>
                </ProtectedRoute>
              } />
              {/* Admin Panel Routes */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="health" element={<AdminHealthCheck />} />
                <Route path="ai-usage" element={<AdminAIUsage />} />
                <Route path="ai-credits" element={<AdminAICredits />} />
                <Route path="ml" element={<MLDashboard />} />
                <Route path="ml/models" element={<MLModelsPage />} />
                <Route path="ml/alerts" element={<MLAlertsPage />} />
                <Route path="ml/predictions" element={<MLPredictionsPage />} />
                <Route path="ml/retraining" element={<MLRetrainingPage />} />
                <Route path="ml/accuracy" element={<MLAccuracyPage />} />
                <Route path="ml/training-data" element={<MLTrainingDataPage />} />
                <Route path="ml/analytics" element={<MLAnalyticsPage />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="pro-users" element={<AdminProUsers />} />
                <Route path="content" element={<AdminContentManagement />} />
                <Route path="blog/new" element={<AdminBlogPostEditor />} />
                <Route path="blog/:id/edit" element={<AdminBlogPostEditor />} />
                <Route path="licenses" element={<AdminLicenseKeys />} />
                <Route path="security" element={<AdminSecurityAudit />} />
                <Route path="billing" element={<AdminBilling />} />
                <Route path="discounts" element={<AdminDiscountCodes />} />
                <Route path="management" element={<AdminManagement />} />
                <Route path="migration" element={<DatabaseMigrationPanel />} />
                <Route path="requests" element={<AdminRequests />} />
                <Route path="tickets/:id" element={<TicketDetail />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="marketing" element={<AdminMarketing />} />
                <Route path="email" element={<AdminEmailAutomation />} />
                <Route path="email/templates/new" element={<EmailTemplateEditor />} />
                <Route path="email/templates/:id" element={<EmailTemplateEditor />} />
                <Route path="email/campaigns/new" element={<EmailCampaignBuilder />} />
                <Route path="email/campaigns/:id" element={<EmailCampaignDetail />} />
                {/* Email Template Management System */}
                <Route path="email-templates" element={<EmailTemplateManager />} />
                <Route path="imap-config" element={<IMAPConfigurationManager />} />
                <Route path="notification-analytics" element={<NotificationAnalyticsDashboard />} />
                <Route path="affiliates" element={<AdminAffiliates />} />
                <Route path="backups" element={<AdminBackups />} />
                <Route path="organizations" element={<AdminOrganizations />} />
                <Route path="security" element={<AdminSecurity />} />
                <Route path="api-keys" element={<AdminAPIKeys />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
