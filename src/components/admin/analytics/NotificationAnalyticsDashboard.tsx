/**
 * Notification Analytics Dashboard
 * Admin dashboard for monitoring notification performance
 */

import React, { useState } from 'react';
import { BarChart3, TrendingUp, Mail, MessageSquare, Smartphone, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    useNotificationMetrics,
    useChannelPerformance,
    useTemplatePerformance,
    useNotificationTimeSeries,
} from '@/hooks/useNotificationAnalytics';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function NotificationAnalyticsDashboard() {
    const [dateRange, setDateRange] = useState('7d');

    // Calculate date range
    const getDateRange = () => {
        const end = new Date();
        const start = new Date();

        switch (dateRange) {
            case '7d':
                start.setDate(start.getDate() - 7);
                break;
            case '30d':
                start.setDate(start.getDate() - 30);
                break;
            case '90d':
                start.setDate(start.getDate() - 90);
                break;
            default:
                start.setDate(start.getDate() - 7);
        }

        return {
            start: start.toISOString(),
            end: end.toISOString(),
        };
    };

    const { start, end } = getDateRange();

    const { data: metrics, isLoading: metricsLoading } = useNotificationMetrics(start, end);
    const { data: channelPerf } = useChannelPerformance(start, end);
    const { data: templatePerf } = useTemplatePerformance(start, end);
    const { data: timeSeries } = useNotificationTimeSeries(start, end);

    const formatPercent = (value: number) => `${value.toFixed(1)}%`;
    const formatNumber = (value: number) => value.toLocaleString();

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'email':
                return <Mail className="h-4 w-4" />;
            case 'in_app':
                return <Bell className="h-4 w-4" />;
            case 'sms':
                return <MessageSquare className="h-4 w-4" />;
            case 'push':
                return <Smartphone className="h-4 w-4" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Notification Analytics</h1>
                    <p className="text-muted-foreground">Monitor notification performance and engagement</p>
                </div>
                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Sent</CardDescription>
                        <CardTitle className="text-3xl">
                            {metricsLoading ? '...' : formatNumber(metrics?.total_sent || 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            All notification channels
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Delivery Rate</CardDescription>
                        <CardTitle className="text-3xl text-green-600">
                            {metricsLoading ? '...' : formatPercent(metrics?.delivery_rate || 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            {formatNumber(metrics?.total_delivered || 0)} delivered
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Open Rate</CardDescription>
                        <CardTitle className="text-3xl text-blue-600">
                            {metricsLoading ? '...' : formatPercent(metrics?.open_rate || 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            {formatNumber(metrics?.total_opened || 0)} opened
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Click Rate</CardDescription>
                        <CardTitle className="text-3xl text-purple-600">
                            {metricsLoading ? '...' : formatPercent(metrics?.click_rate || 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            {formatNumber(metrics?.total_clicked || 0)} clicked
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Time Series Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Notification Trends</CardTitle>
                    <CardDescription>Daily notification volume and engagement</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={timeSeries || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                            <YAxis />
                            <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString()} />
                            <Legend />
                            <Line type="monotone" dataKey="sent" stroke="#8b5cf6" name="Sent" />
                            <Line type="monotone" dataKey="delivered" stroke="#10b981" name="Delivered" />
                            <Line type="monotone" dataKey="opened" stroke="#3b82f6" name="Opened" />
                            <Line type="monotone" dataKey="clicked" stroke="#f59e0b" name="Clicked" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Channel Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Channel Performance</CardTitle>
                        <CardDescription>Breakdown by notification channel</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {channelPerf?.map(channel => (
                                <div key={channel.channel} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {getChannelIcon(channel.channel)}
                                            <span className="font-semibold capitalize">{channel.channel}</span>
                                        </div>
                                        <Badge variant="secondary">
                                            {formatNumber(channel.metrics.total_sent)} sent
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div>
                                            <div className="text-muted-foreground text-xs">Delivery</div>
                                            <div className="font-semibold text-green-600">
                                                {formatPercent(channel.metrics.delivery_rate)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground text-xs">Open</div>
                                            <div className="font-semibold text-blue-600">
                                                {formatPercent(channel.metrics.open_rate)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground text-xs">Click</div>
                                            <div className="font-semibold text-purple-600">
                                                {formatPercent(channel.metrics.click_rate)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Template Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Templates</CardTitle>
                        <CardDescription>Best performing email templates</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {templatePerf?.map((template, index) => (
                                <div key={template.template_key} className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                        {index + 1}
                                    </div>

                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{template.template_name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {formatNumber(template.metrics.total_sent)} sent • {formatPercent(template.metrics.open_rate)} open
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-sm font-semibold text-green-600">
                                            {formatPercent(template.metrics.delivery_rate)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">delivered</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Stats */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={channelPerf || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="channel" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="metrics.delivery_rate" fill="#10b981" name="Delivery %" />
                            <Bar dataKey="metrics.open_rate" fill="#3b82f6" name="Open %" />
                            <Bar dataKey="metrics.click_rate" fill="#8b5cf6" name="Click %" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
