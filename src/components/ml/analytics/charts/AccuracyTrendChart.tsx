/**
 * Accuracy Trend Chart
 * Shows ML prediction accuracy improvement over time
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface TrendDataPoint {
    date: string;
    ai_insights: number;
    risk_assessment: number;
    schedule_prediction: number;
    budget_forecast: number;
}

export function AccuracyTrendChart() {
    const { data: trendData, isLoading } = useQuery({
        queryKey: ['ml-accuracy-trend'],
        queryFn: async () => {
            const now = new Date();
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Get predictions grouped by date and type
            const { data: predictions } = await supabase
                .from('ml_predictions')
                .select('*')
                .gte('created_at', last30Days.toISOString());

            if (!predictions) return [];

            // Group by date and prediction type
            const grouped = new Map<string, Map<string, { total: number; accepted: number }>>();

            predictions.forEach(p => {
                const date = new Date(p.created_at).toISOString().split('T')[0];

                if (!grouped.has(date)) {
                    grouped.set(date, new Map());
                }

                const dateMap = grouped.get(date)!;
                if (!dateMap.has(p.prediction_type)) {
                    dateMap.set(p.prediction_type, { total: 0, accepted: 0 });
                }

                const stats = dateMap.get(p.prediction_type)!;
                stats.total++;
                if (p.user_accepted) stats.accepted++;
            });

            // Convert to chart data
            const chartData: TrendDataPoint[] = [];
            const sortedDates = Array.from(grouped.keys()).sort();

            sortedDates.forEach(date => {
                const dateMap = grouped.get(date)!;
                const point: any = { date };

                ['ai_insight', 'risk_assessment', 'schedule_prediction', 'budget_forecast'].forEach(type => {
                    const stats = dateMap.get(type);
                    if (stats && stats.total > 0) {
                        point[type] = Math.round((stats.accepted / stats.total) * 100);
                    }
                });

                chartData.push(point);
            });

            return chartData;
        },
        refetchInterval: 60000, // Refresh every minute
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Accuracy Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Accuracy Trend
                </CardTitle>
                <CardDescription>Last 30 days - Daily accuracy by feature</CardDescription>
            </CardHeader>
            <CardContent>
                {trendData && trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis
                                domain={[0, 100]}
                                tick={{ fontSize: 12 }}
                                label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                                formatter={(value: number) => `${value}%`}
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="ai_insight"
                                stroke="#8b5cf6"
                                name="AI Insights"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="risk_assessment"
                                stroke="#f97316"
                                name="Risk Assessment"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="schedule_prediction"
                                stroke="#3b82f6"
                                name="Schedule"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="budget_forecast"
                                stroke="#10b981"
                                name="Budget"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <p>No data available yet</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
