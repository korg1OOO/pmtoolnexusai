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
import WorkspaceMindMap from '@/pages/WorkspaceMindMap';

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

    if (authed === null) return null;
    if (authed) return <Navigate to="/dashboard" replace />;
    return <LandingPage />;
}

export function PublicRoutes() {
    return (
        <>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/app" element={<ProtectedRoute><QueryParamRedirect /></ProtectedRoute>} />

            <Route path="/login" element={<Auth />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />

            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/faqs" element={<PublicFAQs />} />
            <Route path="/blog" element={<PublicBlog />} />
            <Route path="/blog/:slug" element={<BlogPostView />} />
            <Route path="/docs" element={<PublicDocs />} />
            <Route path="/product-tour" element={<ProductTour />} />

            {/* New clean Mind Map experience */}
            <Route path="/mind-map-demo" element={<MindMapDemo />} />
            <Route path="/workspace-demo" element={<WorkspaceMindMap />} />

            <Route path="/subscription/success" element={<ProtectedRoute><SubscriptionSuccessPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
        </>
    );
}
