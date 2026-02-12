/**
 * Subscription Widget Component
 * Shows current tier, features, and usage stats on user dashboard
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, TrendingUp, Zap, ArrowRight, Check } from 'lucide-react';
import { useUserTier, useUserFeatures, TIER_LIMITS, TIER_PRICING } from '@/hooks/useFeatureAccess';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SubscriptionWidgetProps {
    compact?: boolean;
}

export function SubscriptionWidget({ compact = false }: SubscriptionWidgetProps) {
    const { data: tier = 'free', isLoading } = useUserTier();
    const { data: features = [] } = useUserFeatures();
    const navigate = useNavigate();

    const tierConfig = {
        free: {
            name: 'Free',
            color: 'text-gray-600',
            bgColor: 'bg-gray-100 dark:bg-gray-800',
            borderColor: 'border-gray-300',
        },
        pro: {
            name: 'Pro',
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            borderColor: 'border-green-300',
        },
        business: {
            name: 'Business',
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-300',
        },
        agency: {
            name: 'Agency',
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
            borderColor: 'border-purple-300',
        },
    };

    const config = tierConfig[tier];
    const limits = TIER_LIMITS[tier];
    const pricing = TIER_PRICING[tier];

    // Mock usage data - replace with real data from backend
    const usage = {
        projects: 2,
        teamMembers: 1,
        storage: 45, // MB
    };

    const getUsagePercentage = (used: number, limit: number) => {
        if (limit === -1) return 0; // Unlimited
        return Math.min((used / limit) * 100, 100);
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-3 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (compact) {
        return (
            <Card className={cn('border-2', config.borderColor)}>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn('p-2 rounded-lg', config.bgColor)}>
                                <Crown className={cn('h-5 w-5', config.color)} />
                            </div>
                            <div>
                                <p className="font-semibold">{config.name} Plan</p>
                                <p className="text-sm text-muted-foreground">
                                    {tier === 'free' ? 'Free Forever' : `$${pricing.monthly}/mo`}
                                </p>
                            </div>
                        </div>
                        {tier !== 'agency' && (
                            <Button size="sm" onClick={() => navigate('/pricing')}>
                                Upgrade
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('border-2', config.borderColor)}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn('p-3 rounded-xl', config.bgColor)}>
                            <Crown className={cn('h-6 w-6', config.color)} />
                        </div>
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                {config.name} Plan
                                <Badge variant="outline" className={config.color}>
                                    Active
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                {tier === 'free' ? 'Free Forever' : `$${pricing.monthly}/month`}
                            </CardDescription>
                        </div>
                    </div>
                    {tier !== 'agency' && (
                        <Button onClick={() => navigate('/pricing')}>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Upgrade
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Usage Stats */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Usage & Limits
                    </h3>

                    {/* Projects */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Projects</span>
                            <span className="font-medium">
                                {usage.projects} / {limits.projects === -1 ? '∞' : limits.projects}
                            </span>
                        </div>
                        {limits.projects !== -1 && (
                            <Progress value={getUsagePercentage(usage.projects, limits.projects)} />
                        )}
                    </div>

                    {/* Team Members */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Team Members</span>
                            <span className="font-medium">
                                {usage.teamMembers} / {limits.teamMembers === -1 ? '∞' : limits.teamMembers}
                            </span>
                        </div>
                        {limits.teamMembers !== -1 && (
                            <Progress value={getUsagePercentage(usage.teamMembers, limits.teamMembers)} />
                        )}
                    </div>

                    {/* Storage */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Storage</span>
                            <span className="font-medium">
                                {usage.storage} MB / {(limits.storage / 1000).toFixed(1)} GB
                            </span>
                        </div>
                        <Progress value={getUsagePercentage(usage.storage, limits.storage)} />
                    </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Your Features</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {features.slice(0, 6).map((feature) => (
                            <div key={feature.feature_key} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                                <span className="text-sm">{feature.feature_name}</span>
                            </div>
                        ))}
                    </div>
                    {features.length > 6 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/pricing')}
                            className="w-full justify-between"
                        >
                            View all {features.length} features
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Manage Billing Button for paid tiers */}
                {tier !== 'free' && (
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={async () => {
                            const { openCustomerPortal } = await import('@/services/stripeService');
                            openCustomerPortal();
                        }}
                    >
                        Manage Billing
                    </Button>
                )}

                {/* Upgrade CTA for non-agency tiers */}
                {tier !== 'agency' && (
                    <div className={cn('p-4 rounded-lg  border', config.bgColor)}>
                        <h4 className="font-semibold mb-1">Need more power?</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                            {tier === 'free' && 'Upgrade to Pro for unlimited projects and AI insights.'}
                            {tier === 'pro' && 'Upgrade to Business for advanced teams and workflows.'}
                            {tier === 'business' && 'Upgrade to Agency for white label and API access.'}
                        </p>
                        <Button className="w-full" onClick={() => navigate('/pricing')}>
                            View Plans
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
