/**
 * ML Analytics Page
 * Comprehensive visual analytics for ML Learning Loop
 */

import React from 'react';
import { AccuracyTrendChart } from '@/components/ml/analytics/charts/AccuracyTrendChart';
import { ConfidenceAccuracyPlot } from '@/components/ml/analytics/charts/ConfidenceAccuracyPlot';
import { PredictionVolumeChart } from '@/components/ml/analytics/charts/PredictionVolumeChart';
import { PatternPerformanceChart } from '@/components/ml/analytics/charts/PatternPerformanceChart';
import { InsightTypeBreakdown } from '@/components/ml/analytics/charts/InsightTypeBreakdown';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MLAnalyticsPage() {
    const navigate = useNavigate();

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/ml-dashboard')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Dashboard
                        </Button>
                    </div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        ML Analytics
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Visual insights into ML system performance and learning progress
                    </p>
                </div>
            </div>

            {/* Row 1: Accuracy & Confidence */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AccuracyTrendChart />
                <ConfidenceAccuracyPlot />
            </div>

            {/* Row 2: Volume & Patterns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PredictionVolumeChart />
                <PatternPerformanceChart />
            </div>

            {/* Row 3: Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InsightTypeBreakdown />

                {/* Placeholder for future chart */}
                <div className="border-2 border-dashed rounded-lg p-8 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">Additional Chart</p>
                        <p className="text-sm">Coming soon: Time-series heatmap</p>
                    </div>
                </div>
            </div>

            {/* Info Footer */}
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p>
                    <strong>Note:</strong> All charts update automatically every 60 seconds.
                    Data shown is from the last 30 days of ML predictions and patterns.
                </p>
            </div>
        </div>
    );
}
