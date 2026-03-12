/**
 * Prediction Volume Chart
 * Shows prediction activity trends over time
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

interface VolumeDataPoint {
    date: string;
    ai_insight: number;
    risk_assessment: number;
    schedule_prediction: number;
    budget_forecast: number;
    total: number;
}

export function PredictionVolumeChart() {
    const { data: volumeData, isLoading } = useQuery({
        queryKey: ['ml-prediction-volume'],
        queryFn: async () => {
            const now = new Date();
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Get all predictions
            const { data: predictions } = await supabase
                .from('ml_predictions')
                .select('*')
                .gte('created_at', last30Days.toISOString());

            if (!predictions) return [];

            // Group by date and type
            const grouped = new Map<string, Map<string, number>>();

            predictions.forEach(p => {
                const date = new Date(p.created_at).toISOString().split('T')[0];

                if (!grouped.has(date)) {
                    grouped.set(date, new Map());
                }

                const dateMap = grouped.get(date)!;
                const count = dateMap.get(p.prediction_type) || 0;
                dateMap.set(p.prediction_type, count + 1);
            });

            // Convert to chart data
            const chartData: VolumeDataPoint[] = [];
            const sortedDates = Array.from(grouped.keys()).sort();

            sortedDates.forEach(date => {
                const dateMap = grouped.get(date)!;
                const point: any = { date };
                let total = 0;

                ['ai_insight', 'risk_assessment', 'schedule_prediction', 'budget_forecast'].forEach(type => {
                    const count = dateMap.get(type) || 0;
                    point[type] = count;
                    total += count;
                });

                point.total = total;
                chartData.push(point);
            });

            return chartData;
        },
        refetchInterval: 60000,
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Prediction Volume</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>
        );
    }

    const totalPredictions = volumeData?.reduce((sum, d) => sum + d.total, 0) || 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    Prediction Volume
                </CardTitle>
                <CardDescription>
                    Last 30 days - {totalPredictions} total predictions
                </CardDescription>
            </CardHeader>
            <CardContent>
                {volumeData && volumeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={volumeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                label={{ value: 'Predictions', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="ai_insight"
                                stackId="1"
                                stroke="#8b5cf6"
                                fill="#8b5cf6"
                                name="AI Insights"
                            />
                            <Area
                                type="monotone"
                                dataKey="risk_assessment"
                                stackId="1"
                                stroke="#f97316"
                                fill="#f97316"
                                name="Risk Assessment"
                            />
                            <Area
                                type="monotone"
                                dataKey="schedule_prediction"
                                stackId="1"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                name="Schedule"
                            />
                            <Area
                                type="monotone"
                                dataKey="budget_forecast"
                                stackId="1"
                                stroke="#10b981"
                                fill="#10b981"
                                name="Budget"
                            />
                        </AreaChart>
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
