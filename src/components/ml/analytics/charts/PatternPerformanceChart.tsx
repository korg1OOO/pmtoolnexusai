/**
 * Pattern Performance Chart
 * Shows which ML patterns are most effective
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Zap } from 'lucide-react';

interface PatternData {
    name: string;
    success_rate: number;
    application_count: number;
}

export function PatternPerformanceChart() {
    const { data: patternData, isLoading } = useQuery({
        queryKey: ['ml-pattern-performance'],
        queryFn: async () => {
            // Get active patterns ordered by success rate
            const { data: patterns } = await supabase
                .from('ml_learning_patterns')
                .select('*')
                .eq('is_active', true)
                .order('success_rate', { ascending: false })
                .limit(10);

            if (!patterns) return [];

            return patterns.map(p => ({
                name: p.pattern_type.replace(/_/g, ' ').slice(0, 20),
                success_rate: Math.round(p.success_rate * 100),
                application_count: p.application_count,
            }));
        },
        refetchInterval: 60000,
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Pattern Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>
        );
    }

    // Color scale based on application count
    const getColor = (count: number) => {
        if (count > 50) return '#10b981'; // green
        if (count > 20) return '#3b82f6'; // blue
        if (count > 10) return '#f59e0b'; // amber
        return '#8b5cf6'; // purple
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Pattern Performance
                </CardTitle>
                <CardDescription>Top 10 active patterns by success rate</CardDescription>
            </CardHeader>
            <CardContent>
                {patternData && patternData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={patternData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                type="number"
                                domain={[0, 100]}
                                tick={{ fontSize: 12 }}
                                label={{ value: 'Success Rate (%)', position: 'insideBottom', offset: -5 }}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fontSize: 11 }}
                                width={150}
                            />
                            <Tooltip
                                formatter={(value: number, name: string) => {
                                    if (name === 'success_rate') return [`${value}%`, 'Success Rate'];
                                    return [value, 'Applications'];
                                }}
                            />
                            <Legend />
                            <Bar dataKey="success_rate" name="Success Rate" radius={[0, 4, 4, 0]}>
                                {patternData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getColor(entry.application_count)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <p>No patterns created yet</p>
                    </div>
                )}

                {patternData && patternData.length > 0 && (
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }} />
                            <span>50+ applications</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }} />
                            <span>20-50</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }} />
                            <span>10-20</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#8b5cf6' }} />
                            <span>\u003c10</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
