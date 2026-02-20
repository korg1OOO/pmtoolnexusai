import { AdminRoute } from "@/components/auth/AdminRoute";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TenantProvider } from "@/contexts/TenantContext";
import { RoutePreloader } from "@/components/routing";
import { DevErrorBoundary, DevBuildErrorOverlay } from "@/components/dev/DevErrorOverlay";
import { HelmetProvider } from "react-helmet-async";
import Debug from "./pages/Debug";

// ── Route groups (see src/routes/README.md for the guard rule) ────────────────
import { PublicRoutes } from "@/routes/publicRoutes";
import { ProjectRoutes } from "@/routes/projectRoutes";
import { TenantWorkspaceRoutes } from "@/routes/tenantWorkspaceRoutes";
import { CreditsRoutes } from "@/routes/creditsRoutes";
import { AdminRoutes } from "@/routes/adminRoutes";

// ── QueryClient — smart retry: skip on auth/RLS failures (4xx) ───────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        const status = error?.status ?? error?.code;
        // Don't waste retries on auth or RLS denials
        if (status === 401 || status === 403 || status === "PGRST301") return false;
        return failureCount < 2;
      },
      staleTime: 30_000, // 30 s — reduce redundant refetches
    },
  },
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <DevErrorBoundary>
          <TooltipProvider>
            {/* Single toast system: Sonner; see src/hooks/use-toast.ts shim */}
            <Sonner />
            <DevBuildErrorOverlay />
            <BrowserRouter>
              <RoutePreloader />
              <TenantProvider>
                <Suspense fallback={null}>
                  <Routes>
                    <ProjectRoutes />
                    <TenantWorkspaceRoutes />
                    <CreditsRoutes />
                    {AdminRoutes()}
                    {/* Dev-only debug route — admin role required */}
                    {import.meta.env.DEV && (
                      <Route path="/debug" element={<AdminRoute><Debug /></AdminRoute>} />
                    )}
                    {/* Public & marketing routes (includes 404 catch-all) */}
                    <PublicRoutes />
                  </Routes>
                </Suspense>
              </TenantProvider>
            </BrowserRouter>
          </TooltipProvider>
        </DevErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
