/**
 * Risk Assessment Analytics Card
 * Shows risk prediction performance metrics in ML Dashboard
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shield, TrendingUp, AlertTriangle, Target } from 'lucide-react';

export function RiskAnalyticsCard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['ml-risk-stats'],
        queryFn: async () => {
            const now = new Date();
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Get risk predictions with ML tracking
            const { data: predictions } = await supabase
                .from('ml_predictions')
                .select('*')
                .eq('prediction_type', 'risk_assessment')
                .gte('created_at', last30Days.toISOString());

            const preds = predictions || [];
            const accepted = preds.filter(p => p.user_accepted === true);
            const modified = preds.filter(p => p.user_modified === true);
            const withRating = preds.filter(p => p.user_rating !== null);

            // Calculate severity accuracy (how close predicted risk level was)
            const severityAccurate = preds.filter(p => {
                if (!p.user_accepted) return false;
                // If accepted without modification, severity was accurate
                return !p.user_modified;
            });

            return {
                total: preds.length,
                accepted: accepted.length,
                modified: modified.length,
                accuracy: preds.length > 0 ? accepted.length / preds.length : 0,
                severityAccuracy: preds.length > 0 ? severityAccurate.length / preds.length : 0,
                avgRating: withRating.length > 0
                    ? withRating.reduce((sum, p) => sum + p.user_rating, 0) / withRating.length
                    : 0,
                falsePositiveRate: preds.length > 0
                    ? preds.filter(p => p.user_accepted === false).length / preds.length
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
                        <Shield className="h-5 w-5" />
                        Risk Assessment Performance
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
                    <Shield className="h-5 w-5 text-orange-500" />
                    Risk Assessment Performance
                </CardTitle>
                <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Total Predictions */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Risk Predictions</span>
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

                    {/* Severity Accuracy */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">Severity Accuracy</span>
                        </div>
                        <span className="text-base font-medium">
                            {Math.round((stats?.severityAccuracy || 0) * 100)}%
                        </span>
                    </div>

                    {/* False Positive Rate */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">False Positive Rate</span>
                        </div>
                        <Badge
                            variant={(stats?.falsePositiveRate || 0) < 0.2 ? 'default' : 'destructive'}
                            className="text-base"
                        >
                            {Math.round((stats?.falsePositiveRate || 0) * 100)}%
                        </Badge>
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
