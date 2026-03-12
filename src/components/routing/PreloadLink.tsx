import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { preloadRoute } from '@/utils/routePreloader';

export interface PreloadLinkProps extends LinkProps {
    /**
     * Whether to preload the route on mouse hover
     * @default true
     */
    preloadOnHover?: boolean;

    /**
     * Whether to preload the route on keyboard focus
     * @default true
     */
    preloadOnFocus?: boolean;

    /**
     * Delay in milliseconds before preloading on hover
     * Useful to avoid preloading when user is just moving mouse across
     * @default 0
     */
    preloadDelay?: number;
}

/**
 * Enhanced Link component that preloads route chunks on hover/focus
 * Provides instant navigation by loading chunks before user clicks
 */
export function PreloadLink({
    to,
    preloadOnHover = true,
    preloadOnFocus = true,
    preloadDelay = 0,
    children,
    onMouseEnter,
    onFocus,
    ...props
}: PreloadLinkProps) {
    const path = typeof to === 'string' ? to : to.pathname || '';
    const preloadTimeoutRef = React.useRef<NodeJS.Timeout>();

    const handlePreload = () => {
        if (preloadDelay > 0) {
            preloadTimeoutRef.current = setTimeout(() => {
                preloadRoute(path);
            }, preloadDelay);
        } else {
            preloadRoute(path);
        }
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (preloadOnHover) {
            handlePreload();
        }
        onMouseEnter?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLAnchorElement>) => {
        if (preloadOnFocus) {
            handlePreload();
        }
        onFocus?.(e);
    };

    const handleMouseLeave = () => {
        // Clear timeout if user moves away before delay completes
        if (preloadTimeoutRef.current) {
            clearTimeout(preloadTimeoutRef.current);
        }
    };

    // Cleanup timeout on unmount
    React.useEffect(() => {
        return () => {
            if (preloadTimeoutRef.current) {
                clearTimeout(preloadTimeoutRef.current);
            }
        };
    }, []);

    return (
        <Link
            to={to}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleFocus}
            {...props}
        >
            {children}
        </Link>
    );
}
