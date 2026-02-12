/**
 * Pricing Page Component
 * Public-facing pricing tiers with feature comparison
 */

import { useState } from 'react';
import { Check, X, Sparkles, Building2, Rocket, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { TIER_PRICING, type SubscriptionTier } from '@/hooks/useFeatureAccess';
import { upgradeToTier } from '@/services/stripeService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type BillingPeriod = 'monthly' | 'annual';

const TIER_CONFIG = {
    pro: {
        name: 'Pro',
        icon: Sparkles,
        description: 'Perfect for individuals and small teams',
        color: 'from-green-500 to-emerald-600',
        features: [
            'Unlimited projects',
            'AI-powered insights',
            'Cloud sync',
            'Advanced task management',
            'File uploads (100MB)',
            'Data export',
            'Email support',
        ],
    },
    business: {
        name: 'Business',
        icon: Building2,
        description: 'Advanced features for growing teams',
        color: 'from-blue-500 to-indigo-600',
        popular: true,
        features: [
            'Everything in Pro',
            'Up to 50 team members',
            'Advanced AI predictions',
            'Custom workflows',
            'Advanced analytics',
            'Third-party integrations',
            'SSO authentication',
            'Priority support 24/7',
        ],
    },
    agency: {
        name: 'Agency',
        icon: Rocket,
        description: 'Enterprise-grade for agencies',
        color: 'from-purple-500 to-pink-600',
        features: [
            'Everything in Business',
            'Unlimited team members',
            'White label branding',
            'Full API access',
            'SOC2 & HIPAA compliance',
            'Dedicated account manager',
            'Custom integrations',
            'Complete audit logs',
        ],
    },
};

export function PricingPage() {
    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
    const [loadingTier, setLoadingTier] = useState<string | null>(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleSelectTier = async (tier: SubscriptionTier) => {
        // Check if user is logged in
        if (!user) {
            // Navigate to signup with tier pre-selected
            navigate(`/signup?tier=${tier}`);
            return;
        }

        // For logged-in users, start Stripe checkout
        try {
            setLoadingTier(tier);
            await upgradeToTier(tier, billingPeriod);
        } catch (error) {
            console.error('Checkout error:', error);
            // Error handling is done in the service
        } finally {
            setLoadingTier(null);
        }
    };

    const getPrice = (tier: keyof typeof TIER_PRICING) => {
        return TIER_PRICING[tier][billingPeriod];
    };

    const getSavings = (tier: keyof typeof TIER_PRICING) => {
        const monthly = TIER_PRICING[tier].monthly * 12;
        const annual = TIER_PRICING[tier].annual;
        return Math.round(((monthly - annual) / monthly) * 100);
    };

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
                            <Badge variant="secondary" className="ml-2">
                                Save up to 17%
                            </Badge>
                        </Button>
                    </div>
                </div>

                {/* Pricing cards */}
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {(Object.keys(TIER_CONFIG) as Array<keyof typeof TIER_CONFIG>).map((tier) => {
                        const config = TIER_CONFIG[tier];
                        const Icon = config.icon;
                        const price = getPrice(tier);
                        const savings = billingPeriod === 'annual' ? getSavings(tier) : 0;

                        return (
                            <Card
                                key={tier}
                                className={`relative ${config.popular ? 'border-2 border-primary shadow-xl scale-105' : 'hover:shadow-lg'
                                    } transition-all duration-300`}
                            >
                                {config.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-gradient-to-r from-primary to-primary/80">
                                            Most Popular
                                        </Badge>
                                    </div>
                                )}

                                <CardHeader>
                                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center mb-4`}>
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <CardTitle className="text-2xl">{config.name}</CardTitle>
                                    <CardDescription>{config.description}</CardDescription>

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
                                        variant={config.popular ? 'default' : 'outline'}
                                        onClick={() => handleSelectTier(tier)}
                                        disabled={loadingTier !== null}
                                    >
                                        {loadingTier === tier && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {loadingTier === tier ? 'Processing...' : 'Get Started'}
                                    </Button>

                                    <ul className="space-y-3">
                                        {config.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                                <span className="text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Feature comparison table */}
                <div className="bg-card rounded-lg border p-8">
                    <h2 className="text-3xl font-bold mb-8">Feature Comparison</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-4 px-4 font-semibold">Feature</th>
                                    <th className="text-center py-4 px-4 font-semibold">Pro</th>
                                    <th className="text-center py-4 px-4 font-semibold">Business</th>
                                    <th className="text-center py-4 px-4 font-semibold">Agency</th>
                                </tr>
                            </thead>
                            <tbody>
                                <FeatureRow feature="Projects" pro="Unlimited" business="Unlimited" agency="Unlimited" />
                                <FeatureRow feature="Team Members" pro="Up to 10" business="Up to 50" agency="Unlimited" />
                                <FeatureRow feature="Storage" pro="10 GB" business="100 GB" agency="500 GB" />
                                <FeatureRow feature="AI Insights" pro={true} business={true} agency={true} />
                                <FeatureRow feature="Cloud Sync" pro={true} business={true} agency={true} />
                                <FeatureRow feature="Advanced Analytics" pro={false} business={true} agency={true} />
                                <FeatureRow feature="Custom Workflows" pro={false} business={true} agency={true} />
                                <FeatureRow feature="Integrations" pro={false} business={true} agency={true} />
                                <FeatureRow feature="SSO" pro={false} business={true} agency={true} />
                                <FeatureRow feature="White Label" pro={false} business={false} agency={true} />
                                <FeatureRow feature="API Access" pro={false} business={false} agency={true} />
                                <FeatureRow feature="Priority Support" pro={false} business={true} agency={true} />
                                <FeatureRow feature="Dedicated Manager" pro={false} business={false} agency={true} />
                            </tbody>
                        </table>
                    </div>
                </div>

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

interface FeatureRowProps {
    feature: string;
    pro: boolean | string;
    business: boolean | string;
    agency: boolean | string;
}

function FeatureRow({ feature, pro, business, agency }: FeatureRowProps) {
    const renderCell = (value: boolean | string) => {
        if (typeof value === 'boolean') {
            return value ? (
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
            ) : (
                <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
            );
        }
        return <span className="text-sm">{value}</span>;
    };

    return (
        <tr className="border-b last:border-0 hover:bg-muted/50">
            <td className="py-4 px-4">{feature}</td>
            <td className="text-center py-4 px-4">{renderCell(pro)}</td>
            <td className="text-center py-4 px-4">{renderCell(business)}</td>
            <td className="text-center py-4 px-4">{renderCell(agency)}</td>
        </tr>
    );
}
