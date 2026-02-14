/**
 * ML Accuracy Tracking Page
 * Monitor model accuracy and performance metrics over time
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Target,
    Activity,
    Calendar,
    Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MLAccuracyPage() {
    const navigate = useNavigate();
    const [selectedPeriod, setSelectedPeriod] = useState('7d');

    // Mock accuracy data
    const accuracyMetrics = [
        { model: 'Sentiment Analysis v2.1', current: 94.2, previous: 93.8, trend: 'up', category: 'NLP' },
        { model: 'Image Classifier v3.0', current: 91.5, previous: 92.1, trend: 'down', category: 'Vision' },
        { model: 'Fraud Detection v1.5', current: 96.8, previous: 96.5, trend: 'up', category: 'Security' },
        { model: 'Recommendation Engine', current: 88.3, previous: 87.9, trend: 'up', category: 'Personalization' },
    ];

    const performanceHistory = [
        { date: '2024-02-07', accuracy: 92.1, precision: 91.5, recall: 90.8, f1Score: 91.1 },
        { date: '2024-02-08', accuracy: 92.5, precision: 92.0, recall: 91.2, f1Score: 91.6 },
        { date: '2024-02-09', accuracy: 93.2, precision: 92.8, recall: 91.9, f1Score: 92.3 },
        { date: '2024-02-10', accuracy: 93.8, precision: 93.2, recall: 92.5, f1Score: 92.8 },
        { date: '2024-02-11', accuracy: 94.2, precision: 93.7, recall: 93.1, f1Score: 93.4 },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <Button variant="ghost" onClick={() => navigate('/admin/ml')} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to ML Dashboard
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Accuracy Tracking</h1>
                        <p className="text-muted-foreground mt-1">
                            Monitor model accuracy and performance metrics
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export Report
                        </Button>
                    </div>
                </div>
            </div>

            {/* Period Selector */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Time Period:</span>
                        <div className="flex gap-2">
                            {['24h', '7d', '30d', '90d'].map((period) => (
                                <Button
                                    key={period}
                                    variant={selectedPeriod === period ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedPeriod(period)}
                                >
                                    {period}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Accuracy Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {accuracyMetrics.map((metric) => (
                    <Card key={metric.model}>
                        <CardHeader className="pb-3">
                            <CardDescription>{metric.category}</CardDescription>
                            <CardTitle className="text-lg">{metric.model}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-3xl font-bold">{metric.current}%</div>
                                    <div className="flex items-center gap-1 text-sm mt-1">
                                        {metric.trend === 'up' ? (
                                            <>
                                                <TrendingUp className="h-3 w-3 text-green-600" />
                                                <span className="text-green-600">
                                                    +{(metric.current - metric.previous).toFixed(1)}%
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <TrendingDown className="h-3 w-3 text-red-600" />
                                                <span className="text-red-600">
                                                    {(metric.current - metric.previous).toFixed(1)}%
                                                </span>
                                            </>
                                        )}
                                        <span className="text-muted-foreground">vs previous</span>
                                    </div>
                                </div>
                                <Target className="h-8 w-8 text-muted-foreground opacity-20" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Performance History */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance History</CardTitle>
                    <CardDescription>
                        Detailed metrics over the selected time period
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {performanceHistory.map((entry) => (
                            <div
                                key={entry.date}
                                className="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <Activity className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">{entry.date}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Daily performance snapshot
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground">Accuracy</p>
                                        <p className="text-sm font-semibold">{entry.accuracy}%</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground">Precision</p>
                                        <p className="text-sm font-semibold">{entry.precision}%</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground">Recall</p>
                                        <p className="text-sm font-semibold">{entry.recall}%</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground">F1 Score</p>
                                        <p className="text-sm font-semibold">{entry.f1Score}%</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Model Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>Model Comparison</CardTitle>
                    <CardDescription>
                        Compare accuracy across different model versions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {accuracyMetrics.map((metric) => (
                            <div key={metric.model} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{metric.model}</span>
                                        <Badge variant="outline">{metric.category}</Badge>
                                    </div>
                                    <span className="text-sm font-semibold">{metric.current}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-primary rounded-full h-2 transition-all"
                                        style={{ width: `${metric.current}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
