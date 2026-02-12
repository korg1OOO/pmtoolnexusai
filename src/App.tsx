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
import {
  AdminDashboard,
  AdminUsers,
  AdminProUsers,
  AdminHealthCheck,
  AdminAIUsage,
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
} from "@/components/admin/pages";
import { MLDashboard } from "@/components/ml";
import { HelmetProvider } from 'react-helmet-async';
import { TicketDetail } from '@/components/admin/pages/TicketDetail';
import { EmailTemplateEditor } from '@/components/admin/pages/EmailTemplateEditor';
import { EmailCampaignBuilder } from '@/components/admin/pages/EmailCampaignBuilder';
import { EmailCampaignDetail } from '@/components/admin/pages/EmailCampaignDetail';

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
              {/* Admin Panel Routes */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="health" element={<AdminHealthCheck />} />
                <Route path="ai-usage" element={<AdminAIUsage />} />
                <Route path="ml" element={<MLDashboard />} />
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
                <Route path="requests" element={<AdminRequests />} />
                <Route path="tickets/:id" element={<TicketDetail />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="marketing" element={<AdminMarketing />} />
                <Route path="email" element={<AdminEmailAutomation />} />
                <Route path="email/templates/new" element={<EmailTemplateEditor />} />
                <Route path="email/templates/:id" element={<EmailTemplateEditor />} />
                <Route path="email/campaigns/new" element={<EmailCampaignBuilder />} />
                <Route path="email/campaigns/:id" element={<EmailCampaignDetail />} />
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
