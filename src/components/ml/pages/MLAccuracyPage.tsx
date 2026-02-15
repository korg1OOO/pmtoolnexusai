/**
 * ML Accuracy Tracking Page
 * Monitor model accuracy and performance metrics over time
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Target,
    Activity,
    Calendar,
    Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function MLAccuracyPage() {
    const navigate = useNavigate();
    const [selectedPeriod, setSelectedPeriod] = useState('7d');

    const periodDays: Record<string, number> = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 };

    const { data: accuracyMetrics = [], isLoading: metricsLoading } = useQuery({
        queryKey: ['ml-accuracy-metrics'],
        queryFn: async () => {
            const { data: models } = await (supabase as any)
                .from('ml_model_metadata')
                .select('*')
                .order('training_date', { ascending: false });

            if (!models || models.length === 0) return [];

            // Group by model_type and get latest + previous
            const byType: Record<string, any[]> = {};
            for (const m of models) {
                const t = m.model_type || 'unknown';
                if (!byType[t]) byType[t] = [];
                byType[t].push(m);
            }

            return Object.entries(byType).map(([type, versions]) => {
                const current = versions[0];
                const previous = versions[1];
                const currentAcc = current.accuracy_metrics?.f1 ?? current.accuracy_metrics?.precision ?? 0;
                const prevAcc = previous?.accuracy_metrics?.f1 ?? previous?.accuracy_metrics?.precision ?? currentAcc;
                return {
                    model: `${current.model_version || type}`,
                    current: Math.round(currentAcc * 1000) / 10,
                    previous: Math.round(prevAcc * 1000) / 10,
                    trend: currentAcc >= prevAcc ? 'up' : 'down',
                    category: type,
                };
            });
        },
        refetchInterval: 60000,
    });

    const { data: performanceHistory = [], isLoading: historyLoading } = useQuery({
        queryKey: ['ml-accuracy-history', selectedPeriod],
        queryFn: async () => {
            const days = periodDays[selectedPeriod] || 7;
            const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

            const { data: predictions } = await (supabase as any)
                .from('ml_predictions')
                .select('confidence_score, user_accepted, user_rating, created_at')
                .gte('created_at', cutoff)
                .order('created_at', { ascending: true });

            if (!predictions || predictions.length === 0) return [];

            // Group by date
            const byDate: Record<string, any[]> = {};
            for (const p of predictions) {
                const date = p.created_at.split('T')[0];
                if (!byDate[date]) byDate[date] = [];
                byDate[date].push(p);
            }

            return Object.entries(byDate).map(([date, preds]) => {
                const avgConf = preds.reduce((s: number, p: any) => s + (p.confidence_score || 0), 0) / preds.length;
                const accepted = preds.filter((p: any) => p.user_accepted === true).length;
                const rated = preds.filter((p: any) => p.user_rating !== null);
                const avgRating = rated.length > 0
                    ? rated.reduce((s: number, p: any) => s + (p.user_rating || 0), 0) / rated.length
                    : 0;

                return {
                    date,
                    accuracy: Math.round(avgConf * 1000) / 10,
                    precision: Math.round((accepted / preds.length) * 1000) / 10,
                    recall: Math.round(avgConf * 950) / 10, // approximation
                    f1Score: Math.round(avgRating * 20 * 10) / 10,
                };
            });
        },
        refetchInterval: 60000,
    });

    const isLoading = metricsLoading || historyLoading;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <Button variant="ghost" onClick={() => navigate('/admin/ml')} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to ML Dashboard
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Accuracy Tracking</h1>
                        <p className="text-muted-foreground mt-1">
                            Monitor model accuracy and performance metrics
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export Report
                        </Button>
                    </div>
                </div>
            </div>

            {/* Period Selector */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Time Period:</span>
                        <div className="flex gap-2">
                            {['24h', '7d', '30d', '90d'].map((period) => (
                                <Button
                                    key={period}
                                    variant={selectedPeriod === period ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedPeriod(period)}
                                >
                                    {period}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Accuracy Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Loading models...</p></CardContent></Card>
                ) : accuracyMetrics.length === 0 ? (
                    <Card className="col-span-full"><CardContent className="p-6 text-center text-muted-foreground">No model data available yet</CardContent></Card>
                ) : (
                    accuracyMetrics.map((metric) => (
                        <Card key={metric.model}>
                            <CardHeader className="pb-3">
                                <CardDescription>{metric.category}</CardDescription>
                                <CardTitle className="text-lg">{metric.model}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <div className="text-3xl font-bold">{metric.current}%</div>
                                        <div className="flex items-center gap-1 text-sm mt-1">
                                            {metric.trend === 'up' ? (
                                                <>
                                                    <TrendingUp className="h-3 w-3 text-green-600" />
                                                    <span className="text-green-600">
                                                        +{(metric.current - metric.previous).toFixed(1)}%
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <TrendingDown className="h-3 w-3 text-red-600" />
                                                    <span className="text-red-600">
                                                        {(metric.current - metric.previous).toFixed(1)}%
                                                    </span>
                                                </>
                                            )}
                                            <span className="text-muted-foreground">vs previous</span>
                                        </div>
                                    </div>
                                    <Target className="h-8 w-8 text-muted-foreground opacity-20" />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Performance History */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance History</CardTitle>
                    <CardDescription>
                        Detailed metrics over the selected time period
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {performanceHistory.length === 0 ? (
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                            No prediction data for this period
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {performanceHistory.map((entry) => (
                                <div
                                    key={entry.date}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <Activity className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{entry.date}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Daily performance snapshot
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground">Confidence</p>
                                            <p className="text-sm font-semibold">{entry.accuracy}%</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground">Acceptance</p>
                                            <p className="text-sm font-semibold">{entry.precision}%</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground">Avg Rating</p>
                                            <p className="text-sm font-semibold">{entry.f1Score}%</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Model Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>Model Comparison</CardTitle>
                    <CardDescription>
                        Compare accuracy across different model versions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {accuracyMetrics.length === 0 ? (
                        <div className="h-[100px] flex items-center justify-center text-muted-foreground">
                            No models to compare
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {accuracyMetrics.map((metric) => (
                                <div key={metric.model} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{metric.model}</span>
                                            <Badge variant="outline">{metric.category}</Badge>
                                        </div>
                                        <span className="text-sm font-semibold">{metric.current}%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-primary rounded-full h-2 transition-all"
                                            style={{ width: `${metric.current}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}