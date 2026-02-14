/**
 * Insight Type Breakdown
 * Shows distribution of predictions by type
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PieChartIcon } from 'lucide-react';

interface TypeData {
    name: string;
    value: number;
    accuracy: number;
}

const COLORS = {
    'ai_insight': '#8b5cf6',
    'risk_assessment': '#f97316',
    'schedule_prediction': '#3b82f6',
    'budget_forecast': '#10b981',
};

export function InsightTypeBreakdown() {
    const { data: typeData, isLoading } = useQuery({
        queryKey: ['ml-type-breakdown'],
        queryFn: async () => {
            const now = new Date();
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Get predictions grouped by type
            const { data: predictions } = await supabase
                .from('ml_predictions')
                .select('*')
                .gte('created_at', last30Days.toISOString());

            if (!predictions) return [];

            // Group by type
            const grouped = new Map<string, { total: number; accepted: number }>();

            predictions.forEach(p => {
                if (!grouped.has(p.prediction_type)) {
                    grouped.set(p.prediction_type, { total: 0, accepted: 0 });
                }
                const stats = grouped.get(p.prediction_type)!;
                stats.total++;
                if (p.user_accepted) stats.accepted++;
            });

            // Convert to chart data
            const chartData: TypeData[] = [];
            const typeNames: Record<string, string> = {
                'ai_insight': 'AI Insights',
                'risk_assessment': 'Risk Assessment',
                'schedule_prediction': 'Schedule',
                'budget_forecast': 'Budget',
            };

            grouped.forEach((stats, type) => {
                chartData.push({
                    name: typeNames[type] || type,
                    value: stats.total,
                    accuracy: stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0,
                });
            });

            return chartData;
        },
        refetchInterval: 60000,
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Prediction Type Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>
        );
    }

    const total = typeData?.reduce((sum, d) => sum + d.value, 0) || 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-indigo-500" />
                    Prediction Type Breakdown
                </CardTitle>
                <CardDescription>Last 30 days - {total} total predictions</CardDescription>
            </CardHeader>
            <CardContent>
                {typeData && typeData.length > 0 ? (
                    <>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={typeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {typeData.map((entry, index) => {
                                        const colorKey = Object.keys(COLORS).find(k =>
                                            entry.name.toLowerCase().includes(k.replace('_', ' '))
                                        );
                                        return (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={colorKey ? COLORS[colorKey as keyof typeof COLORS] : '#8b5cf6'}
                                            />
                                        );
                                    })}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number, name: string, props: any) => [
                                        `${value} predictions (${props.payload.accuracy}% accuracy)`,
                                        name
                                    ]}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Stats Grid */}
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {typeData.map((item, index) => (
                                <div key={index} className="p-2 rounded border">
                                    <p className="text-xs font-medium">{item.name}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-sm text-muted-foreground">{item.value} predictions</span>
                                        <span className="text-sm font-bold">{item.accuracy}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <p>No data available yet</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
