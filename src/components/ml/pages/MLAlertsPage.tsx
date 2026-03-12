/**
 * ML Alerts Page
 * Monitor and acknowledge ML model alerts
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, ArrowLeft, CheckCircle2, Info, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnacknowledgedAlerts, useCriticalAlerts } from '@/hooks/useMLAlerts';

export function MLAlertsPage() {
    const navigate = useNavigate();
    const { data: alerts = [] } = useUnacknowledgedAlerts();
    const { data: criticalAlerts = [] } = useCriticalAlerts();
    const [severityFilter, setSeverityFilter] = useState('all');

    const filteredAlerts = alerts.filter((alert) =>
        severityFilter === 'all' || alert.severity === severityFilter
    );

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'critical':
                return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
            case 'warning':
                return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Warning</Badge>;
            case 'info':
                return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Info</Badge>;
            default:
                return <Badge variant="secondary">{severity}</Badge>;
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical':
                return <XCircle className="h-5 w-5 text-red-400" />;
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
            case 'info':
                return <Info className="h-5 w-5 text-blue-400" />;
            default:
                return <AlertTriangle className="h-5 w-5" />;
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <Button variant="ghost" onClick={() => navigate('/admin/ml')} className="mb-2">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to ML Dashboard
                </Button>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                    ML Alerts
                </h1>
                <p className="text-muted-foreground mt-1">
                    Monitor and acknowledge ML model alerts
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{alerts.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Critical Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Warnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {alerts.filter(a => a.severity === 'warning').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Active Alerts</CardTitle>
                        <Select value={severityFilter} onValueChange={setSeverityFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Severity</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                                <SelectItem value="info">Info</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredAlerts.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-2" />
                            <p className="text-muted-foreground">No active alerts</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredAlerts.map((alert) => (
                                <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            {getSeverityIcon(alert.severity)}
                                            <div className="flex-1">
                                                <AlertTitle className="flex items-center gap-2">
                                                    {alert.title}
                                                    {getSeverityBadge(alert.severity)}
                                                </AlertTitle>
                                                <AlertDescription className="mt-2">
                                                    {alert.message}
                                                </AlertDescription>
                                                <div className="text-xs text-muted-foreground mt-2">
                                                    {new Date(alert.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            Acknowledge
                                        </Button>
                                    </div>
                                </Alert>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
