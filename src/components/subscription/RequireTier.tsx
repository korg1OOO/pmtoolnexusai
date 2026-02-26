/**
 * RequireTier — Subscription tier gate for routes.
 *
 * Wraps a route element and blocks access if the user's tier is below
 * the required minimum. Shows an upgrade prompt instead of the child content.
 *
 * Usage:
 *   <RequireTier minTier="pro">
 *     <EVMView />
 *   </RequireTier>
 */

import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserTier, isTierHigherOrEqual, type SubscriptionTier } from '@/hooks/useFeatureAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown, TrendingUp } from 'lucide-react';

interface RequireTierProps {
    /** Minimum tier required to access this content */
    minTier: SubscriptionTier;
    children: ReactNode;
    /** Optional custom fallback when blocked */
    fallback?: ReactNode;
}

const TIER_DISPLAY: Record<SubscriptionTier, { name: string; color: string }> = {
    free: { name: 'Free', color: 'text-gray-500' },
    pro: { name: 'Pro', color: 'text-green-500' },
    business: { name: 'Business', color: 'text-blue-500' },
    agency: { name: 'Agency', color: 'text-purple-500' },
};

export function RequireTier({ minTier, children, fallback }: RequireTierProps) {
    const { data: tier = 'free', isLoading } = useUserTier();
    const navigate = useNavigate();

    // While loading, render nothing (prevents flash of upgrade prompt)
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse space-y-3 text-center">
                    <div className="h-4 bg-muted rounded w-32 mx-auto" />
                    <div className="h-3 bg-muted rounded w-48 mx-auto" />
                </div>
            </div>
        );
    }

    // Check tier access
    if (isTierHigherOrEqual(tier, minTier)) {
        return <>{children}</>;
    }

    // Custom fallback
    if (fallback) {
        return <>{fallback}</>;
    }

    // Default upgrade prompt
    const required = TIER_DISPLAY[minTier];
    const current = TIER_DISPLAY[tier];

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
            <Card className="max-w-lg w-full border-2 border-dashed border-primary/30">
                <CardHeader className="text-center">
                    <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
                        <Lock className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="flex items-center justify-center gap-2 text-xl">
                        <Crown className="h-5 w-5 text-amber-500" />
                        {required.name} Plan Required
                    </CardTitle>
                    <CardDescription className="text-base">
                        This feature requires the <span className={`font-semibold ${required.color}`}>{required.name}</span> plan or higher.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        You're currently on the <span className={`font-semibold ${current.color}`}>{current.name}</span> plan.
                        Upgrade to unlock this feature and more.
                    </p>

                    <div className="flex gap-3 justify-center">
                        <Button onClick={() => navigate('/pricing')} size="lg">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            View Plans & Upgrade
                        </Button>
                        <Button variant="outline" onClick={() => navigate(-1 as any)} size="lg">
                            Go Back
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
