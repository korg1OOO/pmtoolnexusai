/**
 * Subscription Analytics Dashboard
 * Displays MRR, ARR, churn rate, and tier breakdown
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Award } from 'lucide-react';
import { useSubscriptionAnalytics, useTierAnalytics, formatRevenue, calculateLTV } from '@/hooks/useSubscriptionAnalytics';

export function SubscriptionAnalyticsDashboard() {
    const { data: analytics } = useSubscriptionAnalytics();
    const { data: tierAnalytics = [] } = useTierAnalytics();

    if (!analytics) {
        return <div>Loading analytics...</div>;
    }

    const churnRate = analytics.churned_30d > 0
        ? Math.round((analytics.churned_30d / analytics.active_subscriptions) * 100 * 100) / 100
        : 0;

    const ltv = calculateLTV(analytics.avg_mrr, churnRate);

    return (
        <div className="space-y-6">
            {/* Top Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="MRR"
                    value={formatRevenue(analytics.total_mrr)}
                    subtitle="Monthly Recurring Revenue"
                    icon={DollarSign}
                    trend={analytics.new_subscriptions_30d > analytics.churned_30d ? 'up' : 'down'}
                />
                <MetricCard
                    title="ARR"
                    value={formatRevenue(analytics.total_arr)}
                    subtitle="Annual Recurring Revenue"
                    icon={Target}
                />
                <MetricCard
                    title="Active Subs"
                    value={analytics.active_subscriptions}
                    subtitle={`+${analytics.new_subscriptions_30d} this month`}
                    icon={Users}
                    trend="up"
                />
                <MetricCard
                    title="Churn Rate"
                    value={`${churnRate}%`}
                    subtitle="Last 30 days"
                    icon={TrendingDown}
                    trend={churnRate < 5 ? 'up' : 'down'}
                />
            </div>

            {/* Tier Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Subscription by Tier</CardTitle>
                    <CardDescription>Active subscriptions and MRR by plan</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {tierAnalytics.map((tier) => (
                            <div key={tier.tier} className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <Award className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="font-semibold capitalize">{tier.tier}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {tier.active_count} active • {formatRevenue(tier.tier_mrr)} MRR
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">{formatRevenue(tier.avg_mrr)}</p>
                                    <p className="text-sm text-muted-foreground">Avg MRR</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Additional Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Avg MRR/Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{formatRevenue(analytics.avg_mrr)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>LTV</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{formatRevenue(ltv)}</p>
                        <p className="text-sm text-muted-foreground mt-1">Customer Lifetime Value</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>New vs Churned</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-green-600">+{analytics.new_subscriptions_30d}</p>
                                <p className="text-sm text-muted-foreground">New</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-red-600">-{analytics.churned_30d}</p>
                                <p className="text-sm text-muted-foreground">Churned</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: 'up' | 'down';
}

function MetricCard({ title, value, subtitle, icon: Icon, trend }: MetricCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {subtitle && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                        {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                        {subtitle}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
