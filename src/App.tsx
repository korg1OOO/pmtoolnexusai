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
} from "@/components/admin/pages";

const queryClient = new QueryClient();

const App = () => (
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
              <Route path="users" element={<AdminUsers />} />
              <Route path="pro-users" element={<AdminProUsers />} />
              <Route path="content" element={<AdminContentManagement />} />
              <Route path="licenses" element={<AdminLicenseKeys />} />
              <Route path="security" element={<AdminSecurityAudit />} />
              <Route path="billing" element={<AdminBilling />} />
              <Route path="discounts" element={<AdminDiscountCodes />} />
              <Route path="management" element={<AdminManagement />} />
              <Route path="requests" element={<AdminRequests />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="marketing" element={<AdminMarketing />} />
              <Route path="email" element={<AdminEmailAutomation />} />
              <Route path="affiliates" element={<AdminAffiliates />} />
              <Route path="backups" element={<AdminBackups />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
