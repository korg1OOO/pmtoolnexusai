import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { preloadCriticalRoutes, preloadAllRoutes } from '@/utils/routePreloader';
import { preloadPredictedRoutes } from '@/utils/predictivePreloader';

/**
 * RoutePreloader Component
 * Handles intelligent preloading of route chunks:
 * 1. Preloads critical routes on mount
 * 2. Preloads all routes during idle time
 * 3. Preloads predicted routes based on current location
 */
export function RoutePreloader() {
    const location = useLocation();

    // Preload critical routes and setup idle preloading on mount
    useEffect(() => {
        // Preload critical routes immediately (dashboard, gantt, etc.)
        preloadCriticalRoutes();

        // Preload all routes during browser idle time
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                preloadAllRoutes();
            }, { timeout: 5000 });
        } else {
            // Fallback for browsers without requestIdleCallback
            setTimeout(() => {
                preloadAllRoutes();
            }, 3000);
        }
    }, []);

    // Preload predicted routes when location changes
    useEffect(() => {
        preloadPredictedRoutes(location.pathname);
    }, [location.pathname]);

    return null; // This component doesn't render anything
}
