import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TenantProvider } from "@/contexts/TenantContext";
import { SubscriptionSuccessPage } from "@/pages/SubscriptionSuccessPage";
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
  AdminSubscriptionsPage,
  AdminPlansPage,
  EmailTemplateManager,
  IMAPConfigurationManager,
  NotificationAnalyticsDashboard,
  AdminAIAgents,
} from "@/components/admin/pages";
import MLDashboard from './components/ml/MLDashboard';
import { HelmetProvider } from 'react-helmet-async';
import { DevErrorBoundary, DevBuildErrorOverlay } from '@/components/dev/DevErrorOverlay';
import { TicketDetail } from '@/components/admin/pages/TicketDetail';
import AIAgentDetailPage from '@/components/admin/ai-agents/AIAgentDetailPage';
import { EmailTemplateEditor } from '@/components/admin/pages/EmailTemplateEditor';
import { EmailCampaignBuilder } from '@/components/admin/pages/EmailCampaignBuilder';
import { EmailCampaignDetail } from '@/components/admin/pages/EmailCampaignDetail';
import { DatabaseMigrationPanel } from '@/components/admin/DatabaseMigrationPanel';
import { AIProviderAdminPage } from '@/components/admin/AIProviderAdminPage';
import { TenantDashboard, WorkspaceManagement, TenantSettings, TenantUserManagement, TenantAnalytics, DepartmentManagement, LicenseAllocation } from '@/components/tenant';
import { WorkspaceDashboard, PortfolioView, TeamAssignment, WorkspaceResourceAllocation, WorkspaceBudgetManagement, WorkspaceAnalytics } from '@/components/workspace';
import { ProjectPerformanceDetail, PortfolioDistributionDetail, ResourceUtilizationDetail } from '@/components/analytics';
import { PortfolioDashboard, ResourcePlanningView, PortfolioBudgetOverview, StrategicRoadmap } from '@/components/portfolio';
import { QueryParamRedirect, ProtectedProjectRoute, LoadingSpinner, RoutePreloader } from '@/components/routing';
import { StakeholderManagement, AdvancedResourceAllocation, ProgramBudgetManagement } from '@/components/program';
import { BillingPage } from '@/components/subscription/BillingPage';

// Lazy-loaded View Components for Code Splitting (all components now use default exports)
const DashboardHub = lazy(() => import('@/components/views/DashboardHub'));
const GanttView = lazy(() => import('@/components/views/GanttView'));
const SprintBoardView = lazy(() => import('@/components/views/SprintBoardView'));
const FinancialsView = lazy(() => import('@/components/views/FinancialsView'));
const NotesView = lazy(() => import('@/components/views/NotesView'));
const ResourcesView = lazy(() => import('@/components/views/ResourcesView'));
const PresentationsView = lazy(() => import('@/components/views/PresentationsView'));
const ProgramTimelineView = lazy(() => import('@/components/views/ProgramTimelineView'));
const ExecutiveDashboardView = lazy(() => import('@/components/views/ExecutiveDashboardView'));
const MilestonesView = lazy(() => import('@/components/views/MilestonesView'));
const BacklogView = lazy(() => import('@/components/views/BacklogView'));
const ReportsView = lazy(() => import('@/components/views/ReportsView'));
const EnhancedMeetingsView = lazy(() => import('@/components/views/EnhancedMeetingsView'));
const MeetingAnalyticsView = lazy(() => import('@/components/views/MeetingAnalyticsView'));
const CalendarView = lazy(() => import('@/components/views/CalendarView'));
const StrategicDashboardView = lazy(() => import('@/components/views/StrategicDashboardView'));
const CommunicationIntelligenceView = lazy(() => import('@/components/views/CommunicationIntelligenceView'));
const CommunicationsView = lazy(() => import('@/components/communications/CommunicationsView'));
const IssuesRegisterView = lazy(() => import('@/components/views/IssuesRegisterView'));
const ActionsView = lazy(() => import('@/components/views/ActionsView'));
const TraceabilityMatrixView = lazy(() => import('@/components/views/TraceabilityMatrixView'));
const ChildPlansView = lazy(() => import('@/components/views/ChildPlansView'));
const ChildGanttView = lazy(() => import('@/components/views/ChildGanttView'));
const UserSettingsView = lazy(() => import('@/components/views/UserSettingsView'));
const ProjectAdminView = lazy(() => import('@/components/views/ProjectAdminView'));
const PlatformAdminView = lazy(() => import('@/components/views/PlatformAdminView'));
const PlanningView = lazy(() => import('@/components/views/PlanningView'));
const ProjectCreationView = lazy(() => import('@/components/views/ProjectCreationView'));
const TemplatesAdminView = lazy(() => import('@/components/views/TemplatesAdminView'));
const MorningBriefingView = lazy(() => import('@/components/views/MorningBriefingView'));
const ProjectCharterView = lazy(() => import('@/components/views/ProjectCharterView'));
const StakeholderRegisterView = lazy(() => import('@/components/views/StakeholderRegisterView'));
const ScenariosView = lazy(() => import('@/components/views/ScenariosView'));
const DeliverablesView = lazy(() => import('@/components/views/DeliverablesView'));
const ChangeRequestsView = lazy(() => import('@/components/views/ChangeRequestsView'));
const EVMView = lazy(() => import('@/components/views/EVMView'));
const TimelineSlippageView = lazy(() => import('@/components/views/TimelineSlippageView'));
const DocumentCenterView = lazy(() => import('@/components/views/DocumentCenterView'));
const FinalReportView = lazy(() => import('@/components/views/FinalReportView'));
const LessonsLearnedView = lazy(() => import('@/components/views/LessonsLearnedView'));
const RisksView = lazy(() => import('@/components/views/RisksView'));
const DecisionsView = lazy(() => import('@/components/views/DecisionsView'));
const TeamChatView = lazy(() => import('@/components/views/TeamChatView'));
const TeamManagementView = lazy(() => import('@/components/views/TeamManagementView'));
const TrackingView = lazy(() => import('@/components/views/TrackingView'));
const TimelinePlannerTab = lazy(() => import('@/components/views/TimelinePlannerTab'));
const KnowledgeBaseView = lazy(() => import('@/components/views/KnowledgeBaseView'));
const ProgramDocumentsView = lazy(() => import('@/components/views/ProgramDocumentsView'));
const CollaborationSpacesView = lazy(() => import('@/components/views/CollaborationSpacesView'));
const CollaborationDashboardView = lazy(() => import('@/components/views/CollaborationDashboardView'));
const ProgramManagementView = lazy(() => import('@/components/views/ProgramManagementView'));
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
        <DevErrorBoundary>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <DevBuildErrorOverlay />
            <BrowserRouter>
              <RoutePreloader />
              <TenantProvider>
                <Routes>
                  {/* Landing page for non-authenticated users */}
                  <Route path="/" element={
                    <ProjectProvider>
                      <PresenceProvider>
                        <QueryParamRedirect />
                      </PresenceProvider>
                    </ProjectProvider>
                  } />


                  {/* Main Dashboard & Overview Routes */}
                  <Route path="/dashboard" element={<ProtectedProjectRoute><DashboardHub /></ProtectedProjectRoute>} />
                  <Route path="/morning-briefing" element={<ProtectedProjectRoute><MorningBriefingView /></ProtectedProjectRoute>} />
                  <Route path="/executive-dashboard" element={<ProtectedProjectRoute><ExecutiveDashboardView /></ProtectedProjectRoute>} />
                  <Route path="/strategic-dashboard" element={<ProtectedProjectRoute><StrategicDashboardView /></ProtectedProjectRoute>} />

                  {/* Portfolio & Program Routes */}
                  <Route path="/portfolio" element={<ProtectedProjectRoute><PortfolioView /></ProtectedProjectRoute>} />
                  <Route path="/program" element={<ProtectedRoute><ProjectProvider><PresenceProvider><ProgramManagementView /></PresenceProvider></ProjectProvider></ProtectedRoute>} />
                  <Route path="/program-timeline" element={<ProtectedProjectRoute><ProgramTimelineView /></ProtectedProjectRoute>} />
                  <Route path="/program-documents" element={<ProtectedProjectRoute><ProgramDocumentsView /></ProtectedProjectRoute>} />

                  {/* Planning & Tracking Routes */}
                  <Route path="/project-plan" element={<ProtectedProjectRoute><PlanningView /></ProtectedProjectRoute>} />
                  <Route path="/planning" element={<ProtectedProjectRoute><PlanningView /></ProtectedProjectRoute>} />
                  <Route path="/child-plans" element={<ProtectedProjectRoute><ChildPlansView /></ProtectedProjectRoute>} />
                  <Route path="/gantt" element={<ProtectedProjectRoute><GanttView /></ProtectedProjectRoute>} />
                  <Route path="/child-gantt" element={<ProtectedProjectRoute><ChildGanttView /></ProtectedProjectRoute>} />
                  <Route path="/timeline-planner" element={<ProtectedProjectRoute><TimelinePlannerTab /></ProtectedProjectRoute>} />
                  <Route path="/milestones" element={<ProtectedProjectRoute><MilestonesView /></ProtectedProjectRoute>} />
                  <Route path="/scenarios" element={<ProtectedProjectRoute><ScenariosView /></ProtectedProjectRoute>} />
                  <Route path="/tracking" element={<ProtectedProjectRoute><TrackingView /></ProtectedProjectRoute>} />
                  <Route path="/project-charter" element={<ProtectedProjectRoute><ProjectCharterView /></ProtectedProjectRoute>} />

                  {/* Agile & Sprints Routes */}
                  <Route path="/sprints" element={<ProtectedProjectRoute><SprintBoardView /></ProtectedProjectRoute>} />
                  <Route path="/backlog" element={<ProtectedProjectRoute><BacklogView /></ProtectedProjectRoute>} />

                  {/* Deliverables & Changes Routes */}
                  <Route path="/deliverables" element={<ProtectedProjectRoute><DeliverablesView /></ProtectedProjectRoute>} />
                  <Route path="/change-requests" element={<ProtectedProjectRoute><ChangeRequestsView /></ProtectedProjectRoute>} />

                  {/* Governance & Compliance Routes */}
                  <Route path="/stakeholders" element={<ProtectedProjectRoute><StakeholderRegisterView /></ProtectedProjectRoute>} />
                  <Route path="/traceability" element={<ProtectedProjectRoute><TraceabilityMatrixView /></ProtectedProjectRoute>} />

                  {/* Issues & Risks Routes */}
                  <Route path="/actions" element={<ProtectedProjectRoute><ActionsView /></ProtectedProjectRoute>} />
                  <Route path="/risks" element={<ProtectedProjectRoute><RisksView /></ProtectedProjectRoute>} />
                  <Route path="/issues" element={<ProtectedProjectRoute><IssuesRegisterView /></ProtectedProjectRoute>} />
                  <Route path="/decisions" element={<ProtectedProjectRoute><DecisionsView /></ProtectedProjectRoute>} />

                  {/* Financial Routes */}
                  <Route path="/financials" element={<ProtectedProjectRoute><FinancialsView /></ProtectedProjectRoute>} />
                  <Route path="/evm" element={<ProtectedProjectRoute><EVMView /></ProtectedProjectRoute>} />
                  <Route path="/timeline-slippage" element={<ProtectedProjectRoute><TimelineSlippageView /></ProtectedProjectRoute>} />

                  {/* Collaboration Routes */}
                  <Route path="/meetings" element={<ProtectedProjectRoute><EnhancedMeetingsView /></ProtectedProjectRoute>} />
                  <Route path="/meeting-analytics" element={<ProtectedProjectRoute><MeetingAnalyticsView /></ProtectedProjectRoute>} />
                  <Route path="/calendar" element={<ProtectedProjectRoute><CalendarView /></ProtectedProjectRoute>} />
                  <Route path="/team-chat" element={<ProtectedProjectRoute><TeamChatView /></ProtectedProjectRoute>} />
                  <Route path="/communications" element={<ProtectedProjectRoute><CommunicationsView /></ProtectedProjectRoute>} />
                  <Route path="/communication-intelligence" element={<ProtectedProjectRoute><CommunicationIntelligenceView /></ProtectedProjectRoute>} />
                  <Route path="/collaboration-spaces" element={<ProtectedProjectRoute><CollaborationSpacesView /></ProtectedProjectRoute>} />
                  <Route path="/collaboration-dashboard" element={<ProtectedProjectRoute><CollaborationDashboardView /></ProtectedProjectRoute>} />

                  {/* Documents & Knowledge Routes */}
                  <Route path="/notes" element={<ProtectedProjectRoute><NotesView /></ProtectedProjectRoute>} />
                  <Route path="/documents" element={<ProtectedProjectRoute><DocumentCenterView /></ProtectedProjectRoute>} />
                  <Route path="/knowledge-base" element={<ProtectedProjectRoute><KnowledgeBaseView /></ProtectedProjectRoute>} />
                  <Route path="/presentations" element={<ProtectedProjectRoute><PresentationsView /></ProtectedProjectRoute>} />

                  {/* Resources & Team Routes */}
                  <Route path="/resources" element={<ProtectedProjectRoute><ResourcesView /></ProtectedProjectRoute>} />
                  <Route path="/team-management" element={<ProtectedProjectRoute><TeamManagementView /></ProtectedProjectRoute>} />

                  {/* Reports & Closure Routes */}
                  <Route path="/reports" element={<ProtectedProjectRoute><ReportsView /></ProtectedProjectRoute>} />
                  <Route path="/final-report" element={<ProtectedProjectRoute><FinalReportView /></ProtectedProjectRoute>} />
                  <Route path="/lessons-learned" element={<ProtectedProjectRoute><LessonsLearnedView /></ProtectedProjectRoute>} />

                  {/* Admin Routes */}
                  <Route path="/admin/project" element={<ProtectedProjectRoute><ProjectAdminView /></ProtectedProjectRoute>} />
                  <Route path="/admin/platform" element={<ProtectedProjectRoute><PlatformAdminView /></ProtectedProjectRoute>} />
                  <Route path="/admin/templates" element={<ProtectedProjectRoute><TemplatesAdminView /></ProtectedProjectRoute>} />

                  {/* Settings & Creation Routes */}
                  <Route path="/settings" element={<ProtectedProjectRoute><UserSettingsView /></ProtectedProjectRoute>} />
                  <Route path="/billing" element={
                    <ProtectedRoute>
                      <ProjectProvider>
                        <PresenceProvider>
                          <BillingPage />
                        </PresenceProvider>
                      </ProjectProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/create-project" element={<ProtectedProjectRoute><ProjectCreationView /></ProtectedProjectRoute>} />

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
                  <Route path="/debug" element={<ProtectedRoute><Debug /></ProtectedRoute>} />
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
                          <TenantUserManagement />
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
                  <Route path="/workspace/:workspaceId/analytics/performance" element={
                    <ProtectedRoute>
                      <ProjectProvider>
                        <PresenceProvider>
                          <ProjectPerformanceDetail />
                        </PresenceProvider>
                      </ProjectProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/workspace/:workspaceId/analytics/portfolio" element={
                    <ProtectedRoute>
                      <ProjectProvider>
                        <PresenceProvider>
                          <PortfolioDistributionDetail />
                        </PresenceProvider>
                      </ProjectProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/workspace/:workspaceId/analytics/portfolio/:portfolioId" element={
                    <ProtectedRoute>
                      <ProjectProvider>
                        <PresenceProvider>
                          <PortfolioDistributionDetail />
                        </PresenceProvider>
                      </ProjectProvider>
                    </ProtectedRoute>
                  } />
                  <Route path="/workspace/:workspaceId/analytics/resources" element={
                    <ProtectedRoute>
                      <ProjectProvider>
                        <PresenceProvider>
                          <ResourceUtilizationDetail />
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
                    <Route path="ai-agents" element={<AdminAIAgents />} />
                    <Route path="ai-agents/:agentType" element={<AIAgentDetailPage />} />
                    <Route path="ai-providers" element={<AIProviderAdminPage />} />
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
                    <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
                    <Route path="plans" element={<AdminPlansPage />} />
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
                  <Route path="/subscription/success" element={
                    <ProtectedRoute>
                      <SubscriptionSuccessPage />
                    </ProtectedRoute>
                  } />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TenantProvider>
            </BrowserRouter>
          </TooltipProvider>
        </DevErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
