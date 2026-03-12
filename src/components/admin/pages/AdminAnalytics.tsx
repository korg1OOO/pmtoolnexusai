/**
 * Admin Analytics Dashboard
 * MRR trends, churn analysis, revenue breakdown
 *
 * Wired to REAL data: uses subscriptions table via useSubscriptionMetrics
 * and useRevenueByPlan hooks (same as AdminBillingDashboard).
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Users, Percent, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { useSubscriptionMetrics } from '@/hooks/useSubscriptions';
import { useRevenueByPlan } from '@/hooks/useInvoices';

export function AdminAnalytics() {
    // ── Real data: subscription metrics ─────────────────────────────────
    const { data: metrics } = useSubscriptionMetrics();
    const { data: planRevenue = [] } = useRevenueByPlan();

    // Compute MRR trend data from subscriptions (group by created month)
    const { data: mrrTrendData = [] } = useQuery({
        queryKey: ['analytics-mrr-trend'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('subscriptions')
                .select('created_at, mrr, status')
                .eq('status', 'active')
                .order('created_at', { ascending: true });

            if (error) throw error;
            if (!data?.length) return [];

            // Group by month and accumulate MRR
            const monthMap = new Map<string, number>();
            let runningMRR = 0;
            for (const sub of data) {
                const month = new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                runningMRR += sub.mrr || 0;
                monthMap.set(month, runningMRR);
            }

            return Array.from(monthMap.entries()).map(([month, total_mrr]) => ({
                date: month,
                total_mrr,
            }));
        },
    });

    // Compute churn data from subscriptions (cancelled_at)
    const { data: churnData = [] } = useQuery({
        queryKey: ['analytics-churn-real'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('subscriptions')
                .select('cancelled_at, created_at')
                .not('cancelled_at', 'is', null);

            if (error) throw error;
            if (!data?.length) return [];

            // Group cancellations by month
            const monthMap = new Map<string, { churned_count: number; total_lifetime: number }>();
            for (const sub of data) {
                const month = new Date(sub.cancelled_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                const existing = monthMap.get(month) || { churned_count: 0, total_lifetime: 0 };
                const lifetimeDays = Math.round(
                    (new Date(sub.cancelled_at).getTime() - new Date(sub.created_at).getTime()) / (1000 * 60 * 60 * 24)
                );
                existing.churned_count++;
                existing.total_lifetime += lifetimeDays;
                monthMap.set(month, existing);
            }

            return Array.from(monthMap.entries()).map(([month, d]) => ({
                month,
                churned_count: d.churned_count,
                avg_lifetime_days: Math.round(d.total_lifetime / d.churned_count),
            }));
        },
    });

    // Calculate summary metrics from real data
    const totalMRR = metrics?.total_mrr || 0;
    const arr = totalMRR * 12;
    const totalChurn = churnData.reduce((sum, month) => sum + (month.churned_count || 0), 0);
    const churnRate = metrics?.churn_rate?.toFixed(1) || '0.0';
    const activeSubscriptions = metrics?.active_subscribers || 0;

    const PLAN_COLORS = ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-8 w-8 text-primary" />
                    Analytics Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                    Revenue trends, churn analysis, and performance metrics
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Monthly MRR</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-8 w-8 text-success" />
                            <div>
                                <div className="text-3xl font-bold">${totalMRR.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">
                                    ${arr.toLocaleString()} ARR
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Churn Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Users className="h-8 w-8 text-warning" />
                            <div>
                                <div className="text-3xl font-bold">{churnRate}%</div>
                                <p className="text-xs text-muted-foreground">
                                    {totalChurn} churned total
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-8 w-8 text-primary" />
                            <div>
                                <div className="text-3xl font-bold">{activeSubscriptions}</div>
                                <p className="text-xs text-muted-foreground">
                                    Across all tiers
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Revenue per Sub</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Percent className="h-8 w-8 text-info" />
                            <div>
                                <div className="text-3xl font-bold">
                                    ${activeSubscriptions > 0 ? (totalMRR / activeSubscriptions).toFixed(0) : '0'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    ARPU (monthly)
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Tabs */}
            <Tabs defaultValue="mrr" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="mrr">MRR Trends</TabsTrigger>
                    <TabsTrigger value="churn">Churn Analysis</TabsTrigger>
                    <TabsTrigger value="revenue">Revenue by Plan</TabsTrigger>
                </TabsList>

                {/* MRR Trends Tab */}
                <TabsContent value="mrr" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Monthly Recurring Revenue</CardTitle>
                            <CardDescription>Cumulative MRR growth over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {mrrTrendData.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No subscription data available yet
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={350}>
                                    <AreaChart data={mrrTrendData}>
                                        <defs>
                                            <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'MRR']} />
                                        <Area
                                            type="monotone"
                                            dataKey="total_mrr"
                                            stroke="#8b5cf6"
                                            fillOpacity={1}
                                            fill="url(#colorMRR)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Churn Analysis Tab */}
                <TabsContent value="churn" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Churn Analysis</CardTitle>
                            <CardDescription>Monthly churn trends and average customer lifetime</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {churnData.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No churn data — all customers retained 🎉
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={churnData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="churned_count" fill="#ef4444" name="Churned Users" />
                                        <Bar dataKey="avg_lifetime_days" fill="#3b82f6" name="Avg Lifetime (days)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Revenue by Plan Tab */}
                <TabsContent value="revenue" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Distribution by Plan</CardTitle>
                            <CardDescription>MRR breakdown across subscription tiers</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {planRevenue.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No active subscriptions found
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {planRevenue.map((plan, idx) => (
                                        <div key={plan.tier} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="h-4 w-4 rounded-full"
                                                    style={{ backgroundColor: PLAN_COLORS[idx % PLAN_COLORS.length] }}
                                                />
                                                <div>
                                                    <span className="font-medium capitalize">{plan.tier}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        ({plan.count} subscribers)
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold">${plan.mrr.toLocaleString()}</span>
                                                <span className="text-xs text-muted-foreground ml-2">{plan.pct.toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
