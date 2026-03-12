/**
 * ML Dashboard Overview Page
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, Target, Zap, ThumbsUp, Activity, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { AIInsightsAnalyticsCard } from '@/components/ml/analytics/AIInsightsAnalyticsCard';
import { RiskAnalyticsCard } from '@/components/ml/analytics/RiskAnalyticsCard';
import { ScheduleAnalyticsCard } from '@/components/ml/analytics/ScheduleAnalyticsCard';
import { BudgetAnalyticsCard } from '@/components/ml/analytics/BudgetAnalyticsCard';
import { AutoLearningSettings } from '@/components/ml/AutoLearningSettings';
import { LearningVelocityCard } from '@/components/ml/analytics/LearningVelocityCard';
import { AdvancedMLFeatures } from '@/components/ml/AdvancedMLFeatures';

interface DashboardStats {
    totalPredictions: number;
    predictions24h: number;
    predictions7d: number;
    avgAccuracy: number;
    activePatterns: number;
    feedbackRate: number;
    avgRating: number;
    topPredictionType: string;
}

export function MLDashboardPage() {
    const navigate = useNavigate();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['ml-dashboard-stats'],
        queryFn: async (): Promise<DashboardStats> => {
            const now = new Date();
            const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const { data: predictions } = await supabase
                .from('ml_predictions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1000);

            const { data: patterns } = await (supabase as any)
                .from('ml_learning_patterns')
                .select('*');

            const preds = predictions || [];
            const pats = patterns || [];

            const withFeedback = preds.filter(p => p.user_accepted !== null);
            const accepted = preds.filter(p => p.user_accepted === true);
            const ratings = preds.filter(p => p.user_rating !== null);

            const typeCounts: Record<string, number> = {};
            preds.forEach(p => { typeCounts[p.prediction_type] = (typeCounts[p.prediction_type] || 0) + 1; });
            const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

            return {
                totalPredictions: preds.length,
                predictions24h: preds.filter(p => new Date(p.created_at) > last24h).length,
                predictions7d: preds.filter(p => new Date(p.created_at) > last7d).length,
                avgAccuracy: preds.length > 0 ? accepted.length / preds.length : 0,
                activePatterns: pats.filter((p: any) => p.is_active).length,
                feedbackRate: preds.length > 0 ? withFeedback.length / preds.length : 0,
                avgRating: ratings.length > 0
                    ? ratings.reduce((sum, p) => sum + (p.user_rating || 0), 0) / ratings.length
                    : 0,
                topPredictionType: topType,
            };
        },
        refetchInterval: 30000,
    });

    const { data: recentPredictions } = useQuery({
        queryKey: ['ml-recent-predictions'],
        queryFn: async () => {
            const { data } = await supabase.from('ml_predictions').select('*').order('created_at', { ascending: false }).limit(5);
            return data || [];
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Activity className="h-8 w-8 animate-pulse mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading ML Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2"><Brain className="h-8 w-8 text-purple-500" />ML Learning Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Monitor AI prediction accuracy and learning patterns</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/admin/ml/analytics')}>
                    <BarChart3 className="h-4 w-4 mr-2" />View Analytics
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Predictions</CardTitle><Target className="h-5 w-5" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats?.totalPredictions || 0}</div><p className="text-xs text-muted-foreground mt-1">{stats?.predictions24h || 0} in last 24h</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle><TrendingUp className="h-5 w-5" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{Math.round((stats?.avgAccuracy || 0) * 100)}%</div><p className="text-xs text-muted-foreground mt-1">Predictions accepted</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Patterns</CardTitle><Zap className="h-5 w-5" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats?.activePatterns || 0}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">User Feedback</CardTitle><ThumbsUp className="h-5 w-5" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{Math.round((stats?.feedbackRate || 0) * 100)}%</div><p className="text-xs text-muted-foreground mt-1">Avg rating: {(stats?.avgRating || 0).toFixed(1)}/5</p></CardContent>
                </Card>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">AI Features Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <AIInsightsAnalyticsCard />
                    <RiskAnalyticsCard />
                    <ScheduleAnalyticsCard />
                    <BudgetAnalyticsCard />
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Auto-Learning System</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <LearningVelocityCard />
                    <AutoLearningSettings />
                </div>
            </div>

            <AdvancedMLFeatures />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Recent Predictions</CardTitle>
                    <CardDescription>Latest AI predictions with feedback status</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {recentPredictions?.map((pred) => (
                            <div key={pred.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{pred.prediction_type}</Badge>
                                        <span className="text-sm text-muted-foreground">{new Date(pred.created_at).toLocaleString()}</span>
                                    </div>
                                    {pred.confidence && <p className="text-sm mt-1">Confidence: {Math.round(pred.confidence * 100)}%</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    {pred.user_accepted === true && <Badge className="bg-green-500">Accepted</Badge>}
                                    {pred.user_modified === true && <Badge className="bg-yellow-500">Modified</Badge>}
                                    {pred.user_accepted === null && <Badge variant="secondary">Pending</Badge>}
                                </div>
                            </div>
                        ))}
                        {(!recentPredictions || recentPredictions.length === 0) && (
                            <p className="text-center text-muted-foreground py-8">No predictions yet</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}