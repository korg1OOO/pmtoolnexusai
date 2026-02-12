/**
 * Feature Guard Component
 * Protects routes and components based on subscription tier and feature access
 */

import { ReactNode } from 'react';
import { useHasFeature, useUserTier } from '@/hooks/useFeatureAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeatureGuardProps {
    feature: string;
    children: ReactNode;
    fallback?: ReactNode;
    showUpgrade?: boolean;
}

/**
 * Component that conditionally renders children based on feature access
 */
export function FeatureGuard({ feature, children, fallback, showUpgrade = true }: FeatureGuardProps) {
    const hasAccess = useHasFeature(feature);
    const { data: tier = 'free' } = useUserTier();
    const navigate = useNavigate();

    if (hasAccess) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    if (!showUpgrade) {
        return null;
    }

    // Default upgrade prompt
    return (
        <Card className="border-2 border-dashed">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            Premium Feature
                            <Crown className="h-5 w-5 text-amber-500" />
                        </CardTitle>
                        <CardDescription>
                            Upgrade your plan to unlock this feature
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    This feature is not available on the {tier} plan. Upgrade to access advanced capabilities.
                </p>
                <Button onClick={() => navigate('/pricing')} className="w-full">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Plans & Upgrade
                </Button>
            </CardContent>
        </Card>
    );
}

/**
 * Hook for feature-based conditional rendering
 */
export function useRequireFeature(feature: string): { hasAccess: boolean; UpgradePrompt: () => JSX.Element } {
    const hasAccess = useHasFeature(feature);
    const navigate = useNavigate();
    const { data: tier = 'free' } = useUserTier();

    const UpgradePrompt = () => (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
                <Lock className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Premium Feature</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
                This feature is not available on your current {tier} plan. Upgrade to unlock advanced capabilities and boost your productivity.
            </p>
            <Button size="lg" onClick={() => navigate('/pricing')}>
                <Crown className="h-5 w-5 mr-2" />
                Upgrade Now
            </Button>
        </div>
    );

    return { hasAccess, UpgradePrompt };
}

/**
 * Route guard component for React Router
 */
interface RouteGuardProps {
    feature: string;
    children: ReactNode;
}

export function RouteGuard({ feature, children }: RouteGuardProps) {
    const { hasAccess, UpgradePrompt } = useRequireFeature(feature);

    if (!hasAccess) {
        return <UpgradePrompt />;
    }

    return <>{children}</>;
}
