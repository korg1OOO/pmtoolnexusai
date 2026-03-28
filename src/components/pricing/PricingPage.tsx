/**
 * Pricing Page Component
 * Public-facing pricing tiers with feature comparison.
 * Data is loaded from the pricing cache (Edge Function) so admins can
 * update pricing on the Admin Subscriptions page and publish via "Refresh Pricing Cache".
 */

import { useState } from 'react';
import { Check, X, Sparkles, Building2, Rocket, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { type SubscriptionTier } from '@/hooks/useFeatureAccess';
import { upgradeToTier } from '@/services/stripeService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { usePricingCache } from '@/hooks/usePricingCache';
import type { PlanConfig } from '@/hooks/usePlanConfigs';

type BillingPeriod = 'monthly' | 'annual';

// Fallback icon map for tier display
const TIER_ICONS: Record<string, React.ElementType> = {
    free: Sparkles,
    pro: Sparkles,
    business: Building2,
    agency: Rocket,
};

// Fallback colour gradients
const TIER_COLORS: Record<string, string> = {
    free: 'from-gray-400 to-gray-500',
    pro: 'from-green-500 to-emerald-600',
    business: 'from-blue-500 to-indigo-600',
    agency: 'from-purple-500 to-pink-600',
};

export function PricingPage() {
    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
    const [loadingTier, setLoadingTier] = useState<string | null>(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: pricingCache, isLoading, isError, refetch } = usePricingCache();

    const plans: PlanConfig[] = pricingCache?.plans ?? [];
    const featuresByTier = pricingCache?.features ?? {};

    const handleSelectTier = async (tier: SubscriptionTier) => {
        if (!user) {
            navigate(`/signup?tier=${tier}`);
            return;
        }
        try {
            setLoadingTier(tier);
            await upgradeToTier(tier, billingPeriod);
        } catch (error) {
            console.error('Checkout error:', error);
        } finally {
            setLoadingTier(null);
        }
    };

    const getPrice = (plan: PlanConfig) =>
        billingPeriod === 'monthly' ? plan.price_monthly : plan.price_annual;

    const getSavings = (plan: PlanConfig) => {
        const monthly = plan.price_monthly * 12;
        const annual = plan.price_annual;
        if (monthly === 0 || annual === 0) return 0;
        return Math.round(((monthly - annual) / monthly) * 100);
    };

    // All featured tiers (exclude free from main cards if desired; currently shows all active)
    const displayPlans = plans.filter(p => p.tier !== 'free' || plans.length <= 2);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-16 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Choose Your Plan
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8">
                        Start free, upgrade anytime. No credit card required.
                    </p>

                    {/* Billing toggle */}
                    <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-full">
                        <Button
                            variant={billingPeriod === 'monthly' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setBillingPeriod('monthly')}
                            className="rounded-full"
                        >
                            Monthly
                        </Button>
                        <Button
                            variant={billingPeriod === 'annual' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setBillingPeriod('annual')}
                            className="rounded-full"
                        >
                            Annual
                            <Badge variant="secondary" className="ml-2">Save up to 17%</Badge>
                        </Button>
                    </div>
                </div>

                {/* Loading / Error */}
                {isLoading && (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}
                {isError && (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">Failed to load pricing data.</p>
                        <Button variant="outline" onClick={() => refetch()}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Retry
                        </Button>
                    </div>
                )}

                {/* Pricing cards */}
                {!isLoading && displayPlans.length > 0 && (
                    <div className="grid md:grid-cols-3 gap-8 mb-16">
                        {displayPlans.map(plan => {
                            const Icon = TIER_ICONS[plan.tier] ?? Sparkles;
                            const color = TIER_COLORS[plan.tier] ?? TIER_COLORS.pro;
                            const price = getPrice(plan);
                            const savings = billingPeriod === 'annual' ? getSavings(plan) : 0;
                            const tierFeatures = featuresByTier[plan.tier] ?? [];

                            return (
                                <Card
                                    key={plan.tier}
                                    className={`relative ${plan.is_popular
                                        ? 'border-2 border-primary shadow-xl scale-105'
                                        : 'hover:shadow-lg'
                                        } transition-all duration-300`}
                                >
                                    {plan.is_popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                            <Badge className="bg-gradient-to-r from-primary to-primary/80">
                                                Most Popular
                                            </Badge>
                                        </div>
                                    )}

                                    <CardHeader>
                                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <CardTitle className="text-2xl">{plan.display_name}</CardTitle>
                                        {plan.description && (
                                            <CardDescription>{plan.description}</CardDescription>
                                        )}

                                        <div className="mt-4">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-bold">${price}</span>
                                                <span className="text-muted-foreground">
                                                    /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                                                </span>
                                            </div>
                                            {savings > 0 && (
                                                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                                    Save {savings}% with annual billing
                                                </p>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        <Button
                                            className="w-full mb-6"
                                            variant={plan.is_popular ? 'default' : 'outline'}
                                            onClick={() => handleSelectTier(plan.tier as SubscriptionTier)}
                                            disabled={loadingTier !== null}
                                        >
                                            {loadingTier === plan.tier && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {loadingTier === plan.tier ? 'Processing...' : 'Get Started'}
                                        </Button>

                                        {/* Plan limits summary */}
                                        <div className="mb-4 p-3 rounded-md bg-muted/40 space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Projects</span>
                                                <span className="font-medium">{plan.max_projects === -1 ? 'Unlimited' : plan.max_projects}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Members</span>
                                                <span className="font-medium">{plan.max_members === -1 ? 'Unlimited' : plan.max_members}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Storage</span>
                                                <span className="font-medium">
                                                    {plan.max_storage_mb === -1 ? 'Unlimited' : plan.max_storage_mb >= 1000 ? `${plan.max_storage_mb / 1000} GB` : `${plan.max_storage_mb} MB`}
                                                </span>
                                            </div>
                                            {plan.max_ai_credits !== 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">AI Credits</span>
                                                    <span className="font-medium">{plan.max_ai_credits === -1 ? 'Unlimited' : plan.max_ai_credits.toLocaleString()}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-xs">
                                                <span className="text-green-600 dark:text-green-400">✨ 1,000 free credits/mo included</span>
                                            </div>
                                        </div>

                                        {/* Features from cache */}
                                        {tierFeatures.length > 0 && (
                                            <ul className="space-y-3">
                                                {tierFeatures.map(f => (
                                                    <li key={f.key} className="flex items-start gap-2">
                                                        <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                                        <span className="text-sm">{f.name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Feature comparison table (dynamic) */}
                {!isLoading && displayPlans.length > 0 && (
                    <div className="bg-card rounded-lg border p-8">
                        <h2 className="text-3xl font-bold mb-8">Plan Limits</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-4 px-4 font-semibold">Limit</th>
                                        {displayPlans.map(p => (
                                            <th key={p.tier} className="text-center py-4 px-4 font-semibold capitalize">{p.display_name}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { label: 'Projects', key: 'max_projects' as const },
                                        { label: 'Team Members', key: 'max_members' as const },
                                        { label: 'Storage', key: 'max_storage_mb' as const, fmt: (v: number) => v === -1 ? 'Unlimited' : v >= 1000 ? `${v / 1000} GB` : `${v} MB` },
                                        { label: 'AI Credits', key: 'max_ai_credits' as const },
                                        { label: 'File Size Limit', key: 'max_file_size_mb' as const, fmt: (v: number) => v === -1 ? 'Unlimited' : `${v} MB` },
                                    ].map(row => (
                                        <tr key={row.label} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="py-4 px-4">{row.label}</td>
                                            {displayPlans.map(p => {
                                                const val = p[row.key] as number;
                                                const text = row.fmt ? row.fmt(val) : val === -1 ? 'Unlimited' : val.toLocaleString();
                                                return (
                                                    <td key={p.tier} className="text-center py-4 px-4 text-sm">{text}</td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* FAQ Section */}
                <div className="mt-16 text-center">
                    <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
                    <p className="text-muted-foreground mb-8">
                        Have questions? <a href="/contact" className="text-primary hover:underline">Contact us</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
