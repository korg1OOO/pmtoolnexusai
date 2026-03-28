/**
 * Admin Dashboard
 * Main landing page for admin panel with key metrics and overview
 */

import React, { useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    DollarSign,
    Activity,
    FolderKanban,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdmin';
import { useRecentActivity, useSystemStatus } from '@/hooks/useAdminDashboard';
import { useSubscriptionMetrics } from '@/hooks/useSubscriptions';
import { useProjects } from '@/hooks/useProjects';
import { useAdminMetricsTrend } from '@/hooks/useAdminMetricsTrend';
import { SubscriptionAnalyticsDashboard } from '@/components/subscription/SubscriptionAnalyticsDashboard';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';

const supabase = _supabase as any;

export function AdminDashboard() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isSyncingStripe, setIsSyncingStripe] = useState(false);

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
        queryClient.invalidateQueries({ queryKey: ['system-status'] });
        queryClient.invalidateQueries({ queryKey: ['subscription-metrics'] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        queryClient.invalidateQueries({ queryKey: ['admin-metrics-trend'] });
        toast.success('Dashboard refreshed');
    };

    const handleStripeSync = async () => {
        setIsSyncingStripe(true);
        try {
            const { error } = await supabase.functions.invoke('stripe-sync', {});
            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['subscription-metrics'] });
            queryClient.invalidateQueries({ queryKey: ['admin-metrics-trend'] });
            toast.success('Stripe data synced successfully');
        } catch (err: any) {
            toast.error('Stripe sync failed: ' + (err?.message || 'Unknown error'));
        } finally {
            setIsSyncingStripe(false);
        }
    };
    const { data: users } = useAdminUsers();
    const { data: recentActivity = [], isLoading: activityLoading } = useRecentActivity(4);
    const { data: systemStatus = [], isLoading: statusLoading } = useSystemStatus();
    const { data: subscriptionMetrics } = useSubscriptionMetrics();
    const { data: allProjects } = useProjects();
    const { data: trend } = useAdminMetricsTrend();

    // Metrics — all derived from live DB data
    const metrics = {
        totalUsers: users?.length || 0,
        activeUsers: trend?.activeUsersCount ?? 0,          // real: updated_at within 7 days
        mrr: subscriptionMetrics?.total_mrr || 0,
        totalProjects: allProjects?.length || 0,
    };

    // Helper: format trend for MetricCard — shows null as undefined (card hides the badge)
    const fmtTrend = (val: number | null | undefined, label: string, positive = true) =>
        val != null
            ? { value: Math.abs(val), label, positive: val >= 0 ? positive : !positive }
            : undefined;

    // Format relative time for activity
    const formatRelativeTime = (timestamp: string) => {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now.getTime() - then.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return then.toLocaleDateString();
    };


    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Overview of platform metrics and activity
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Users"
                    value={metrics.totalUsers}
                    subtitle="All registered users"
                    icon={Users}
                    trend={fmtTrend(trend?.usersTrend, 'vs last 30 days')}
                />
                <MetricCard
                    title="Active Users (7d)"
                    value={metrics.activeUsers}
                    subtitle="Signed in within 7 days"
                    icon={Activity}
                    trend={fmtTrend(trend?.activeUsersTrend, 'vs prior 7 days')}
                />
                <MetricCard
                    title="Monthly Revenue"
                    value={`$${metrics.mrr.toLocaleString()}`}
                    subtitle="MRR from subscriptions"
                    icon={DollarSign}
                    trend={fmtTrend(trend?.mrrTrend, 'vs last 30 days')}
                />
                <MetricCard
                    title="Total Projects"
                    value={metrics.totalProjects}
                    subtitle="Projects created"
                    icon={FolderKanban}
                    trend={fmtTrend(trend?.projectsTrend, 'vs last 30 days')}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest user actions and events</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.map((activity, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <div
                                        className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${(activity as any).action_type === 'success'
                                            ? 'bg-success/20'
                                            : (activity as any).action_type === 'error'
                                                ? 'bg-destructive/20'
                                                : 'bg-primary/20'
                                            }`}
                                    >
                                        {(activity as any).action_type === 'success' ? (
                                            <CheckCircle className="h-4 w-4 text-success" />
                                        ) : (activity as any).action_type === 'error' ? (
                                            <AlertCircle className="h-4 w-4 text-destructive" />
                                        ) : (
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{(activity as any).user_email || 'System'}</p>
                                        <p className="text-sm text-muted-foreground">{activity.action}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                        {formatRelativeTime((activity as any).created_at)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* System Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>System Status</CardTitle>
                        <CardDescription>Service health and uptime</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {systemStatus.map((service, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`h-2 w-2 rounded-full ${service.status === 'operational'
                                                ? 'bg-success'
                                                : service.status === 'degraded'
                                                    ? 'bg-warning'
                                                    : 'bg-destructive'
                                                }`}
                                        />
                                        <span className="text-sm font-medium">{(service as any).service_name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground">{(service as any).uptime_percentage}%</span>
                                        <Badge
                                            variant="outline"
                                            className={`capitalize ${service.status === 'operational'
                                                ? 'bg-success/20 text-success border-success/30'
                                                : 'bg-warning/20 text-warning border-warning/30'
                                                }`}
                                        >
                                            {service.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Subscription Analytics */}
            <div className="col-span-2">
                <SubscriptionAnalyticsDashboard />
            </div>

            {/* Quick Actions */}
            <Card className="col-span-2">
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common admin tasks</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')}>
                            <Users className="h-4 w-4 mr-2" />
                            Add User
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleStripeSync} disabled={isSyncingStripe}>
                            {isSyncingStripe ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Sync Stripe
                        </Button>
                        <Button variant="outline" size="sm" onClick={async () => {
                            try {
                                const { supabase } = await import('@/integrations/supabase/client');
                                const { data, error } = await (supabase as any).functions.invoke('create-billing-portal-session', {
                                    body: { returnUrl: window.location.href },
                                });
                                if (error) throw error;
                                if (data?.url) { window.location.href = data.url; }
                                else { toast.info('Invoice creation — billing portal unavailable'); }
                            } catch {
                                toast.error('Failed to open billing portal');
                            }
                        }}>
                            <DollarSign className="h-4 w-4 mr-2" />
                            Create Invoice
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate('/admin/health')}>
                            <Activity className="h-4 w-4 mr-2" />
                            Run Health Check
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
