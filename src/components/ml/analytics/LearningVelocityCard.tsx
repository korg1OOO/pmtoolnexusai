/**
 * Learning Velocity Card
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Zap, Target, Activity } from 'lucide-react';

interface VelocityMetrics {
    patternsCreatedThisWeek: number;
    patternsCreatedLastWeek: number;
    patternsOptimizedThisWeek: number;
    patternsPrunedThisWeek: number;
    avgSuccessRate: number;
    improvementRate: number;
}

export function LearningVelocityCard() {
    const { data: metrics, isLoading } = useQuery({
        queryKey: ['learning-velocity'],
        queryFn: async (): Promise<VelocityMetrics> => {
            const now = new Date();
            const thisWeekStart = new Date(now);
            thisWeekStart.setDate(now.getDate() - 7);
            const lastWeekStart = new Date(now);
            lastWeekStart.setDate(now.getDate() - 14);

            const { data: thisWeek } = await (supabase as any)
                .from('ml_learning_velocity')
                .select('*')
                .gte('date', thisWeekStart.toISOString().split('T')[0]);

            const { data: lastWeek } = await (supabase as any)
                .from('ml_learning_velocity')
                .select('*')
                .gte('date', lastWeekStart.toISOString().split('T')[0])
                .lt('date', thisWeekStart.toISOString().split('T')[0]);

            const thisWeekData = thisWeek || [];
            const lastWeekData = lastWeek || [];

            const patternsCreatedThisWeek = thisWeekData.reduce((sum: number, d: any) => sum + (d.patterns_created || 0), 0);
            const patternsCreatedLastWeek = lastWeekData.reduce((sum: number, d: any) => sum + (d.patterns_created || 0), 0);
            const patternsOptimizedThisWeek = thisWeekData.reduce((sum: number, d: any) => sum + (d.patterns_optimized || 0), 0);
            const patternsPrunedThisWeek = thisWeekData.reduce((sum: number, d: any) => sum + (d.patterns_pruned || 0), 0);

            const successRates = thisWeekData
                .filter((d: any) => d.avg_success_rate !== null)
                .map((d: any) => d.avg_success_rate);
            const avgSuccessRate = successRates.length > 0
                ? successRates.reduce((a: number, b: number) => a + b, 0) / successRates.length
                : 0;

            const improvementRate = patternsCreatedLastWeek > 0
                ? ((patternsCreatedThisWeek - patternsCreatedLastWeek) / patternsCreatedLastWeek) * 100
                : 0;

            return { patternsCreatedThisWeek, patternsCreatedLastWeek, patternsOptimizedThisWeek, patternsPrunedThisWeek, avgSuccessRate, improvementRate };
        },
        refetchInterval: 60000,
    });

    if (isLoading) {
        return <Card><CardHeader><CardTitle>Learning Velocity</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Loading...</p></CardContent></Card>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-blue-500" />Learning Velocity</CardTitle>
                <CardDescription>System learning speed and improvement metrics</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" /><p className="text-sm font-medium">Patterns Created</p></div>
                        <p className="text-2xl font-bold">{metrics?.patternsCreatedThisWeek || 0}</p>
                        <p className="text-xs text-muted-foreground">This week</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2"><Target className="h-4 w-4 text-blue-500" /><p className="text-sm font-medium">Optimized</p></div>
                        <p className="text-2xl font-bold">{metrics?.patternsOptimizedThisWeek || 0}</p>
                        <p className="text-xs text-muted-foreground">This week</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500" /><p className="text-sm font-medium">Avg Success Rate</p></div>
                        <p className="text-2xl font-bold">{metrics ? Math.round(metrics.avgSuccessRate * 100) : 0}%</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-orange-500" /><p className="text-sm font-medium">Pruned</p></div>
                        <p className="text-2xl font-bold">{metrics?.patternsPrunedThisWeek || 0}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}