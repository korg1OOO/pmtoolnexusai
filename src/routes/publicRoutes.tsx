import { Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { QueryParamRedirect } from '@/components/routing';
import { SubscriptionSuccessPage } from '@/pages/SubscriptionSuccessPage';
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
import LandingPage from '@/pages/LandingPage';
import MindMapDemo from '@/pages/MindMapDemo';

/**
 * Smart root redirect: authenticated users → /dashboard, guests → LandingPage.
 */
function RootRedirect() {
    const [authed, setAuthed] = useState<boolean | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setAuthed(!!session);
        });
    }, []);

    if (authed === null) return null; // brief flash-free wait
    if (authed) return <Navigate to="/dashboard" replace />;
    return <LandingPage />;
}

export function PublicRoutes() {
    return (
        <>
            {/* Root — LandingPage for guests, /dashboard for authenticated users */}
            <Route path="/" element={<RootRedirect />} />

            {/* Backward-compat: old ?view= URLs for authenticated users */}
            <Route path="/app" element={
                <ProtectedRoute>
                    <QueryParamRedirect />
                </ProtectedRoute>
            } />

            {/* Auth */}
            <Route path="/login" element={<Auth />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />

            {/* Marketing — fully public, no auth required */}
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/faqs" element={<PublicFAQs />} />
            <Route path="/blog" element={<PublicBlog />} />
            <Route path="/blog/:slug" element={<BlogPostView />} />
            <Route path="/docs" element={<PublicDocs />} />
            <Route path="/product-tour" element={<ProductTour />} />

            {/* Temporary Mind Map Demo - NEW CLEAN FOUNDATION */}
            <Route path="/mind-map-demo" element={<MindMapDemo />} />

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
