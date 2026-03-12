import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Download,
    Calendar,
    Users,
    CheckCircle,
    AlertTriangle,
    Award,
    Activity
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
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import {
    getProgramInsights,
    generateExecutiveSummary,
    getKPIMetrics,
    exportExecutiveSummaryPDF
} from '@/services/programInsightsService';

interface ProgramInsightsDashboardProps {
    programId: string;
}

export function ProgramInsightsDashboard({ programId }: ProgramInsightsDashboardProps) {
    const [dateRange, setDateRange] = useState('30');

    // Calculate date range
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

    // Fetch data
    const { data: insights, isLoading: insightsLoading } = useQuery({
        queryKey: ['program-insights', programId, startDate, endDate],
        queryFn: () => getProgramInsights(programId, startDate, endDate)
    });

    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['executive-summary', programId, startDate, endDate],
        queryFn: () => generateExecutiveSummary(programId, startDate, endDate)
    });

    const { data: kpis = [], isLoading: kpisLoading } = useQuery({
        queryKey: ['kpi-metrics', programId, startDate, endDate],
        queryFn: () => getKPIMetrics(programId, startDate, endDate)
    });

    const handleExport = async () => {
        await exportExecutiveSummaryPDF(programId, startDate, endDate);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Program Insights</h2>
                    <p className="text-muted-foreground">
                        Executive-level analytics and recommendations
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                            <SelectItem value="180">Last 6 months</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            {!kpisLoading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {kpis.map((kpi, index) => (
                        <KPICard key={index} kpi={kpi} />
                    ))}
                </div>
            )}

            {/* Executive Summary */}
            {summary && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Highlights */}
                    {summary.highlights.length > 0 && (
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Award className="w-5 h-5 text-green-600" />
                                <h3 className="text-lg font-semibold">Highlights</h3>
                            </div>
                            <ul className="space-y-2">
                                {summary.highlights.map((highlight, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm">{highlight}</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    {/* Concerns */}
                    {summary.concerns.length > 0 && (
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                <h3 className="text-lg font-semibold">Concerns</h3>
                            </div>
                            <ul className="space-y-2">
                                {summary.concerns.map((concern, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm">{concern}</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </div>
            )}

            {/* Recommendations */}
            {summary && summary.recommendations.length > 0 && (
                <Alert>
                    <Activity className="h-4 w-4" />
                    <AlertTitle>Recommendations</AlertTitle>
                    <AlertDescription>
                        <ul className="mt-2 space-y-1">
                            {summary.recommendations.map((rec, index) => (
                                <li key={index} className="text-sm">• {rec}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            {/* Detailed Metrics */}
            {insights && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <MetricCard
                        title="Meeting Performance"
                        metrics={[
                            { label: 'Total Meetings', value: insights.total_meetings },
                            { label: 'Avg Effectiveness', value: `${insights.avg_meeting_effectiveness.toFixed(1)}%` },
                            { label: 'Avg Attendance', value: `${insights.avg_attendance_rate.toFixed(1)}%` }
                        ]}
                        icon={Calendar}
                        color="blue"
                    />
                    <MetricCard
                        title="Action Items"
                        metrics={[
                            { label: 'Total Items', value: insights.total_action_items },
                            { label: 'Completion Rate', value: `${insights.action_completion_rate.toFixed(1)}%` },
                            { label: 'Overdue', value: insights.overdue_actions }
                        ]}
                        icon={CheckCircle}
                        color="green"
                    />
                    <MetricCard
                        title="Collaboration"
                        metrics={[
                            { label: 'Active Spaces', value: insights.active_spaces },
                            { label: 'Total Collaborations', value: insights.total_collaborations },
                            { label: 'Active Users', value: insights.active_users }
                        ]}
                        icon={Users}
                        color="purple"
                    />
                </div>
            )}
        </div>
    );
}

// KPI Card Component
interface KPICardProps {
    kpi: {
        label: string;
        value: number | string;
        trend: 'up' | 'down' | 'stable';
        status: 'good' | 'warning' | 'critical';
    };
}

function KPICard({ kpi }: KPICardProps) {
    const statusColors = {
        good: 'border-green-500 bg-green-50',
        warning: 'border-yellow-500 bg-yellow-50',
        critical: 'border-red-500 bg-red-50'
    };

    const trendIcons = {
        up: <TrendingUp className="w-4 h-4 text-green-600" />,
        down: <TrendingDown className="w-4 h-4 text-red-600" />,
        stable: <Minus className="w-4 h-4 text-gray-600" />
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border-2 rounded-lg p-4 ${statusColors[kpi.status]}`}
        >
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                {trendIcons[kpi.trend]}
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
        </motion.div>
    );
}

// Metric Card Component
interface MetricCardProps {
    title: string;
    metrics: { label: string; value: number | string }[];
    icon: React.ElementType;
    color: 'blue' | 'green' | 'purple';
}

function MetricCard({ title, metrics, icon: Icon, color }: MetricCardProps) {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-100',
        green: 'text-green-600 bg-green-100',
        purple: 'text-purple-600 bg-purple-100'
    };

    return (
        <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">{title}</h3>
            </div>
            <div className="space-y-3">
                {metrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{metric.label}</span>
                        <span className="text-sm font-semibold">{metric.value}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
}
