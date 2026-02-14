/**
 * Schedule Predictions Analytics Card
 * Shows schedule delay prediction performance metrics in ML Dashboard
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, TrendingUp, Clock, Target } from 'lucide-react';

export function ScheduleAnalyticsCard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['ml-schedule-stats'],
        queryFn: async () => {
            const now = new Date();
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Get schedule predictions with ML tracking
            const { data: predictions } = await supabase
                .from('ml_predictions')
                .select('*')
                .eq('prediction_type', 'schedule_prediction')
                .gte('created_at', last30Days.toISOString());

            const preds = predictions || [];
            const accepted = preds.filter(p => p.user_accepted === true);
            const modified = preds.filter(p => p.user_modified === true);
            const withRating = preds.filter(p => p.user_rating !== null);

            // Calculate average days off (from prediction metadata)
            const daysOffData = preds.filter(p =>
                p.user_feedback_data?.actual_days && p.prediction?.predicted_days
            );
            const avgDaysOff = daysOffData.length > 0
                ? daysOffData.reduce((sum, p) => {
                    const predicted = p.prediction.predicted_days;
                    const actual = p.user_feedback_data.actual_days;
                    return sum + Math.abs(predicted - actual);
                }, 0) / daysOffData.length
                : 0;

            return {
                total: preds.length,
                accepted: accepted.length,
                modified: modified.length,
                accuracy: preds.length > 0 ? accepted.length / preds.length : 0,
                avgRating: withRating.length > 0
                    ? withRating.reduce((sum, p) => sum + p.user_rating, 0) / withRating.length
                    : 0,
                avgDaysOff: Math.round(avgDaysOff * 10) / 10,
                slippageDetectionRate: preds.length > 0
                    ? preds.filter(p => p.prediction?.detected_slippage === true).length / preds.length
                    : 0,
            };
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Schedule Predictions Performance
                    </CardTitle>
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
                    <Calendar className="h-5 w-5 text-blue-500" />
                    Schedule Predictions Performance
                </CardTitle>
                <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Total Predictions */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Predictions</span>
                        <Badge variant="outline" className="text-base">
                            {stats?.total || 0}
                        </Badge>
                    </div>

                    {/* Accuracy */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Accuracy</span>
                        </div>
                        <Badge
                            variant={(stats?.accuracy || 0) > 0.8 ? 'default' : 'secondary'}
                            className="text-base"
                        >
                            {Math.round((stats?.accuracy || 0) * 100)}%
                        </Badge>
                    </div>

                    {/* Avg Days Off */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">Avg Days Off</span>
                        </div>
                        <Badge
                            variant={(stats?.avgDaysOff || 0) < 2 ? 'default' : 'secondary'}
                            className="text-base"
                        >
                            ±{stats?.avgDaysOff || 0}d
                        </Badge>
                    </div>

                    {/* Slippage Detection */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium">Slippage Detection</span>
                        </div>
                        <span className="text-base font-medium">
                            {Math.round((stats?.slippageDetectionRate || 0) * 100)}%
                        </span>
                    </div>

                    {/* Average Rating */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Avg Rating</span>
                        <span className="text-base font-medium">
                            {(stats?.avgRating || 0).toFixed(1)}/5
                        </span>
                    </div>

                    {/* Modified */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Modified</span>
                        <Badge variant="secondary" className="text-base">
                            {stats?.modified || 0}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
