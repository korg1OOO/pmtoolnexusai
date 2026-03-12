/**
 * Budget Forecasts Analytics Card
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, AlertCircle, Target } from 'lucide-react';

export function BudgetAnalyticsCard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['ml-budget-stats'],
        queryFn: async () => {
            const now = new Date();
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            const { data: predictions } = await supabase
                .from('ml_predictions')
                .select('*')
                .eq('prediction_type', 'budget_forecast')
                .gte('created_at', last30Days.toISOString());

            const preds = predictions || [];
            const accepted = preds.filter(p => p.user_accepted === true);
            const modified = preds.filter(p => p.user_modified === true);
            const withRating = preds.filter(p => p.user_rating !== null);

            const feedbackData = preds.filter(p => {
                const fd = p.user_feedback_data as any;
                const pred = p.prediction as any;
                return fd?.actual_amount && pred?.predicted_amount;
            });
            const avgVariance = feedbackData.length > 0
                ? feedbackData.reduce((sum, p) => {
                    const predicted = (p.prediction as any).predicted_amount;
                    const actual = (p.user_feedback_data as any).actual_amount;
                    return sum + Math.abs((predicted - actual) / actual);
                }, 0) / feedbackData.length
                : 0;

            return {
                total: preds.length,
                accepted: accepted.length,
                modified: modified.length,
                accuracy: preds.length > 0 ? accepted.length / preds.length : 0,
                avgRating: withRating.length > 0
                    ? withRating.reduce((sum, p) => sum + (p.user_rating || 0), 0) / withRating.length
                    : 0,
                avgVariance: Math.round(avgVariance * 1000) / 10,
                overrunDetectionRate: preds.length > 0
                    ? preds.filter(p => (p.prediction as any)?.detected_overrun === true).length / preds.length
                    : 0,
            };
        },
        refetchInterval: 30000,
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />Budget Forecasts Performance</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">Loading...</p></CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-500" />Budget Forecasts Performance</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between"><span className="text-sm font-medium">Total Predictions</span><Badge variant="outline" className="text-base">{stats?.total || 0}</Badge></div>
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500" /><span className="text-sm font-medium">Forecast Accuracy</span></div><Badge variant={(stats?.accuracy || 0) > 0.8 ? 'default' : 'secondary'} className="text-base">{Math.round((stats?.accuracy || 0) * 100)}%</Badge></div>
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Target className="h-4 w-4 text-blue-500" /><span className="text-sm font-medium">Avg Variance</span></div><Badge variant={(stats?.avgVariance || 0) < 10 ? 'default' : 'secondary'} className="text-base">±{stats?.avgVariance || 0}%</Badge></div>
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-500" /><span className="text-sm font-medium">Overrun Detection</span></div><span className="text-base font-medium">{Math.round((stats?.overrunDetectionRate || 0) * 100)}%</span></div>
                    <div className="flex items-center justify-between"><span className="text-sm font-medium">Avg Rating</span><span className="text-base font-medium">{(stats?.avgRating || 0).toFixed(1)}/5</span></div>
                    <div className="flex items-center justify-between"><span className="text-sm font-medium">Modified</span><Badge variant="secondary" className="text-base">{stats?.modified || 0}</Badge></div>
                </div>
            </CardContent>
        </Card>
    );
}