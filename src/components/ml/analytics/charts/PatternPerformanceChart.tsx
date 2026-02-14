/**
 * Pattern Performance Chart
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Zap } from 'lucide-react';

export function PatternPerformanceChart() {
    const { data: patternData, isLoading } = useQuery({
        queryKey: ['ml-pattern-performance'],
        queryFn: async () => {
            const { data: patterns } = await (supabase as any)
                .from('ml_learning_patterns')
                .select('*')
                .eq('is_active', true)
                .order('success_rate', { ascending: false })
                .limit(10);

            if (!patterns) return [];

            return patterns.map((p: any) => ({
                name: (p.pattern_type || '').replace(/_/g, ' ').slice(0, 20),
                success_rate: Math.round((p.success_rate || 0) * 100),
                application_count: p.application_count || 0,
            }));
        },
        refetchInterval: 60000,
    });

    if (isLoading) {
        return <Card><CardHeader><CardTitle>Pattern Performance</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Loading...</p></CardContent></Card>;
    }

    const getColor = (count: number) => {
        if (count > 50) return '#10b981';
        if (count > 20) return '#3b82f6';
        if (count > 10) return '#f59e0b';
        return '#8b5cf6';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-500" />Pattern Performance</CardTitle>
                <CardDescription>Top 10 active patterns by success rate</CardDescription>
            </CardHeader>
            <CardContent>
                {patternData && patternData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={patternData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis type="category" dataKey="name" width={150} />
                            <Tooltip />
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
            </CardContent>
        </Card>
    );
}