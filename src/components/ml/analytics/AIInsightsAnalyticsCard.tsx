/**
 * AI Insights Analytics Card
 * Shows AI Insights performance metrics in ML Dashboard
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tantml:parameter name="query';
import { supabase } from '@/integrations/supabase/client';
import { Brain, TrendingUp, Star, Edit } from 'lucide-react';

export function AIInsightsAnalyticsCard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['ml-ai-insights-stats'],
        queryFn: async () => {
            const now = new Date();
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Get AI insights with ML tracking
            const { data: predictions } = await supabase
                .from('ml_predictions')
                .select('*')
                .eq('prediction_type', 'ai_insight')
                .gte('created_at', last30Days.toISOString());

            const preds = predictions || [];
            const accepted = preds.filter(p => p.user_accepted === true);
            const modified = preds.filter(p => p.user_modified === true);
            const withRating = preds.filter(p => p.user_rating !== null);

            return {
                total: preds.length,
                accepted: accepted.length,
                modified: modified.length,
                accuracy: preds.length > 0 ? accepted.length / preds.length : 0,
                avgRating: withRating.length > 0
                    ? withRating.reduce((sum, p) => sum + p.user_rating, 0) / withRating.length
                    : 0,
                feedbackRate: preds.length > 0
                    ? preds.filter(p => p.user_accepted !== null).length / preds.length
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
                        <Brain className="h-5 w-5" />
                        AI Insights Performance
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
                    <Brain className="h-5 w-5 text-purple-500" />
                    AI Insights Performance
                </CardTitle>
                <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Total Insights */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Insights</span>
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

                    {/* Average Rating */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">Avg Rating</span>
                        </div>
                        <span className="text-base font-medium">
                            {(stats?.avgRating || 0).toFixed(1)}/5
                        </span>
                    </div>

                    {/* Modified */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Edit className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">Modified</span>
                        </div>
                        <Badge variant="secondary" className="text-base">
                            {stats?.modified || 0}
                        </Badge>
                    </div>

                    {/* Feedback Rate */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Feedback Rate</span>
                        <span className="text-base font-medium text-muted-foreground">
                            {Math.round((stats?.feedbackRate || 0) * 100)}%
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
