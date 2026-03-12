/**
 * Admin Health Check Page
 * Real-time system health monitoring dashboard
 */

import React, { useState } from 'react';
import {
    useServiceStatus,
    useRecentMetricsSummary,
    useThresholdViolations,
    usePerformanceThresholds,
    useOverallHealth,
} from '@/hooks/useHealthMonitoring';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Activity,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Clock,
    TrendingUp,
    Server,
    Gauge,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function AdminHealthCheck() {
    const { status, services, violations } = useOverallHealth();
    const { data: metricsSummary, isLoading: metricsLoading } = useRecentMetricsSummary();
    const { data: thresholds } = usePerformanceThresholds();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'text-green-500';
            case 'degraded':
                return 'text-yellow-500';
            case 'down':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'degraded':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case 'down':
                return <XCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Activity className="h-5 w-5 text-gray-500" />;
        }
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'critical':
                return <Badge variant="destructive">Critical</Badge>;
            case 'warning':
                return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Warning</Badge>;
            default:
                return <Badge variant="outline">Normal</Badge>;
        }
    };

    const healthyServices = services?.filter(s => s.status === 'healthy').length || 0;
    const totalServices = services?.length || 0;
    const criticalViolations = violations?.filter(v => v.severity === 'critical').length || 0;
    const warningViolations = violations?.filter(v => v.severity === 'warning').length || 0;

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        Health Monitoring
                        {getStatusIcon(status)}
                    </h1>
                    <p className="text-muted-foreground">
                        Real-time system health and performance metrics
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-muted-foreground">Overall Status</div>
                    <div className={cn('text-2xl font-bold capitalize', getStatusColor(status))}>
                        {status}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Services</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {healthyServices}/{totalServices}
                        </div>
                        <Progress
                            value={(healthyServices / totalServices) * 100}
                            className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            {healthyServices} healthy services
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Metrics</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metricsSummary?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Tracked metrics</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Warnings</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{warningViolations}</div>
                        <p className="text-xs text-muted-foreground">Threshold warnings</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Critical</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{criticalViolations}</div>
                        <p className="text-xs text-muted-foreground">Critical alerts</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="services">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="services">Services</TabsTrigger>
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                    <TabsTrigger value="alerts">Alerts</TabsTrigger>
                    <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
                </TabsList>

                {/* Services Tab */}
                <TabsContent value="services" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Service Status</CardTitle>
                            <CardDescription>Current health status of all services</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {services?.map((service) => (
                                    <Card key={service.id}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="font-semibold">{service.service_name}</div>
                                                {getStatusIcon(service.status)}
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Status:</span>
                                                    <Badge variant={service.status === 'healthy' ? 'default' : 'destructive'}>
                                                        {service.status}
                                                    </Badge>
                                                </div>
                                                {service.response_time && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Response:</span>
                                                        <span>{service.response_time}ms</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Last Check:</span>
                                                    <span className="text-xs">
                                                        {formatDistanceToNow(new Date(service.last_check_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                {service.error_message && (
                                                    <div className="text-xs text-red-500 mt-2">
                                                        {service.error_message}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Metrics Tab */}
                <TabsContent value="metrics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Metrics</CardTitle>
                            <CardDescription>Last 24 hours summary</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {metricsLoading ? (
                                <div className="text-center py-8 text-muted-foreground">Loading metrics...</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Metric</TableHead>
                                            <TableHead>Samples</TableHead>
                                            <TableHead>Avg</TableHead>
                                            <TableHead>Min</TableHead>
                                            <TableHead>Max</TableHead>
                                            <TableHead>P95</TableHead>
                                            <TableHead>P99</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {metricsSummary?.map((metric) => (
                                            <TableRow key={metric.metric_type}>
                                                <TableCell className="font-medium">{metric.metric_type}</TableCell>
                                                <TableCell>{metric.sample_count}</TableCell>
                                                <TableCell>{metric.avg_value.toFixed(2)}</TableCell>
                                                <TableCell>{metric.min_value.toFixed(2)}</TableCell>
                                                <TableCell>{metric.max_value.toFixed(2)}</TableCell>
                                                <TableCell>{metric.p95_value.toFixed(2)}</TableCell>
                                                <TableCell>{metric.p99_value.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Alerts Tab */}
                <TabsContent value="alerts" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Threshold Violations</CardTitle>
                            <CardDescription>Recent violations in the last hour</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Metric</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead>Thresholds</TableHead>
                                        <TableHead>Severity</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {violations?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                                No threshold violations in the last hour
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        violations?.map((violation) => (
                                            <TableRow key={violation.id}>
                                                <TableCell>
                                                    {formatDistanceToNow(new Date(violation.recorded_at), { addSuffix: true })}
                                                </TableCell>
                                                <TableCell className="font-medium">{violation.metric_type}</TableCell>
                                                <TableCell>
                                                    {violation.value.toFixed(2)} {violation.unit}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <div>⚠️ {violation.warning_threshold}</div>
                                                    <div className="text-red-500">🔴 {violation.critical_threshold}</div>
                                                </TableCell>
                                                <TableCell>{getSeverityBadge(violation.severity)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Thresholds Tab */}
                <TabsContent value="thresholds" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Thresholds</CardTitle>
                            <CardDescription>Warning and critical thresholds for metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Metric</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Warning</TableHead>
                                        <TableHead>Critical</TableHead>
                                        <TableHead>Unit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {thresholds?.map((threshold) => (
                                        <TableRow key={threshold.metric_type}>
                                            <TableCell className="font-medium">{threshold.metric_type}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {threshold.description}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                                                    {threshold.warning_threshold}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="destructive">
                                                    {threshold.critical_threshold}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{threshold.unit}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
