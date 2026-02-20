/**
 * Public Routes — no authentication required.
 * Use these for marketing pages, auth flows, and OAuth callbacks.
 */

import { Route } from 'react-router-dom';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { PresenceProvider } from '@/contexts/PresenceContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { QueryParamRedirect } from '@/components/routing';
import { SubscriptionSuccessPage } from '@/pages/SubscriptionSuccessPage';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import OAuthCallback from '@/pages/OAuthCallback';
import AboutUs from '@/pages/AboutUs';
import ContactUs from '@/pages/ContactUs';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Auth from '@/pages/Auth';
import ProductTour from '@/pages/ProductTour';
import PublicFAQs from '@/pages/PublicFAQs';
import PublicBlog from '@/pages/PublicBlog';
import BlogPostView from '@/pages/BlogPostView';
import PublicDocs from '@/pages/PublicDocs';

export function PublicRoutes() {
    return (
        <>
            {/* Root — redirects based on auth state */}
            <Route path="/" element={
                <ProjectProvider>
                    <PresenceProvider>
                        <QueryParamRedirect />
                    </PresenceProvider>
                </ProjectProvider>
            } />

            {/* Auth */}
            <Route path="/login" element={<Auth />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />

            {/* Marketing */}
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/faqs" element={<PublicFAQs />} />
            <Route path="/blog" element={<PublicBlog />} />
            <Route path="/blog/:slug" element={<BlogPostView />} />
            <Route path="/docs" element={<PublicDocs />} />

            {/* Product tour (no auth needed) */}
            <Route path="/product-tour" element={
                <ProjectProvider>
                    <PresenceProvider>
                        <ProductTour />
                    </PresenceProvider>
                </ProjectProvider>
            } />

            {/* Post-payment landing */}
            <Route path="/subscription/success" element={
                <ProtectedRoute>
                    <SubscriptionSuccessPage />
                </ProtectedRoute>
            } />

            {/* 404 catch-all — MUST be last in the combined <Routes> */}
            <Route path="*" element={<NotFound />} />
        </>
    );
}
