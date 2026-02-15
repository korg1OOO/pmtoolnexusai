import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import {
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    Users,
    Filter,
    Download,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    getApprovalAnalytics,
    type ApprovalAnalytics,
} from '@/services/approvalAnalyticsService';

interface ApprovalAnalyticsDashboardProps {
    entityId: string;
    entityType: string;
}

export default function ApprovalAnalyticsDashboard({
    entityId,
    entityType,
}: ApprovalAnalyticsDashboardProps) {
    const [dateRange, setDateRange] = useState<'30' | '60' | '90'>('30');

    const { data: analytics, isLoading, error, refetch } = useQuery({
        queryKey: ['approval-analytics', entityId, entityType, dateRange],
        queryFn: () => getApprovalAnalytics(entityId, entityType, parseInt(dateRange)),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    Failed to load analytics data. Please try again.
                </div>
                <Button onClick={() => refetch()} className="mt-4">
                    Retry
                </Button>
            </div>
        );
    }

    const { metrics, trends, bottlenecks, delegationPatterns, topApprovers, complianceMetrics } = analytics;

    // Metrics cards data
    const metricsCards = [
        {
            title: 'Avg Turnaround',
            value: `${metrics.avgTurnaroundHours.toFixed(1)}h`,
            subtitle: `Min: ${metrics.minTurnaroundHours.toFixed(1)}h | Max: ${metrics.maxTurnaroundHours.toFixed(1)}h`,
            icon: Clock,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Pending Approvals',
            value: metrics.pendingCount,
            subtitle: `${metrics.totalApprovals} total`,
            icon: AlertCircle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
        },
        {
            title: 'Approval Rate',
            value: `${metrics.approvalRate.toFixed(1)}%`,
            subtitle: `${metrics.approvedCount} approved`,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            title: 'Active Delegations',
            value: delegationPatterns.reduce((sum, p) => sum + p.activeDelegations, 0),
            subtitle: `${delegationPatterns.length} patterns`,
            icon: Users,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
    ];

    // Chart colors
    const COLORS = {
        approved: '#10b981',
        rejected: '#ef4444',
        pending: '#f59e0b',
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Approval Analytics</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Insights and metrics for approval workflows
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="60">Last 60 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metricsCards.map((card, index) => (
                    <Card key={index} className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                                <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${card.bgColor}`}>
                                <card.icon className={`w-5 h-5 ${card.color}`} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Approval Trends Chart */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="approved"
                            stroke={COLORS.approved}
                            strokeWidth={2}
                            name="Approved"
                        />
                        <Line
                            type="monotone"
                            dataKey="rejected"
                            stroke={COLORS.rejected}
                            strokeWidth={2}
                            name="Rejected"
                        />
                        <Line
                            type="monotone"
                            dataKey="pending"
                            stroke={COLORS.pending}
                            strokeWidth={2}
                            name="Pending"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bottleneck Analysis */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Approval Bottlenecks
                    </h3>
                    {bottlenecks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No bottlenecks detected
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {bottlenecks.slice(0, 5).map((bottleneck) => (
                                <div
                                    key={bottleneck.approvalId}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 text-sm">
                                            {bottleneck.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Approver: {bottleneck.approverName || bottleneck.approverEmail}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-orange-600">
                                            {bottleneck.hoursPending.toFixed(1)}h
                                        </p>
                                        <p className="text-xs text-gray-500">pending</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Compliance Progress */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Compliance Progress
                    </h3>
                    <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Completed', value: complianceMetrics.completedItems },
                                        { name: 'Remaining', value: complianceMetrics.totalItems - complianceMetrics.completedItems },
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill={COLORS.approved} />
                                    <Cell fill="#e5e7eb" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Completion Rate</span>
                            <span className="font-semibold text-gray-900">
                                {complianceMetrics.completionRate.toFixed(1)}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Overdue Items</span>
                            <span className="font-semibold text-red-600">
                                {complianceMetrics.overdueItems}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Total Checklists</span>
                            <span className="font-semibold text-gray-900">
                                {complianceMetrics.totalChecklists}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Top Approvers Table */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Approvers</h3>
                {topApprovers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No approver data available</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                                        Approver
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                                        Total
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                                        Avg Response
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                                        Approval Rate
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                                        Entities
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {topApprovers.map((approver) => (
                                    <tr key={approver.userId} className="border-b border-gray-100">
                                        <td className="py-3 px-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {approver.userName}
                                                </p>
                                                <p className="text-xs text-gray-500">{approver.userEmail}</p>
                                            </div>
                                        </td>
                                        <td className="text-right py-3 px-4 text-sm text-gray-900">
                                            {approver.totalApprovals}
                                        </td>
                                        <td className="text-right py-3 px-4 text-sm text-gray-900">
                                            {approver.avgResponseHours.toFixed(1)}h
                                        </td>
                                        <td className="text-right py-3 px-4">
                                            <span className="text-sm font-medium text-green-600">
                                                {approver.approvalRate.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="text-right py-3 px-4 text-sm text-gray-900">
                                            {approver.entitiesServed}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Delegation Patterns */}
            {delegationPatterns.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Delegation Patterns
                    </h3>
                    <div className="space-y-3">
                        {delegationPatterns.slice(0, 5).map((pattern, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        {pattern.delegatorName} → {pattern.delegateName}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {pattern.delegationType} • {pattern.delegationCount} delegations
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-purple-600">
                                        {pattern.activeDelegations} active
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Avg: {pattern.avgDurationDays.toFixed(1)} days
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
