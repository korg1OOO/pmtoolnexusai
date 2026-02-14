/**
 * Confidence vs Accuracy Scatter Plot
 * Shows prediction calibration - ideal predictions fall on diagonal line
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { Target } from 'lucide-react';

interface ScatterDataPoint {
    confidence: number;
    accuracy: number;
    type: string;
}

export function ConfidenceAccuracyPlot() {
    const { data: scatterData, isLoading } = useQuery({
        queryKey: ['ml-confidence-accuracy'],
        queryFn: async () => {
            const now = new Date();
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Get predictions with feedback
            const { data: predictions } = await supabase
                .from('ml_predictions')
                .select('*')
                .gte('created_at', last30Days.toISOString())
                .not('user_accepted', 'is', null);

            if (!predictions) return { data: [], stats: { wellCalibrated: 0, overConfident: 0, underConfident: 0 } };

            // Convert to scatter points
            const points: ScatterDataPoint[] = predictions.map(p => ({
                confidence: Math.round(p.confidence * 100),
                accuracy: p.user_accepted ? 100 : 0,
                type: p.prediction_type,
            }));

            // Calculate calibration stats
            const wellCalibrated = points.filter(p => Math.abs(p.confidence - p.accuracy) <= 20).length;
            const overConfident = points.filter(p => p.confidence > p.accuracy + 20).length;
            const underConfident = points.filter(p => p.confidence < p.accuracy - 20).length;

            return {
                data: points,
                stats: {
                    wellCalibrated: Math.round((wellCalibrated / points.length) * 100),
                    overConfident: Math.round((overConfident / points.length) * 100),
                    underConfident: Math.round((underConfident / points.length) * 100),
                }
            };
        },
        refetchInterval: 60000,
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Confidence vs Accuracy</CardTitle>
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
                    <Target className="h-5 w-5 text-blue-500" />
                    Confidence vs Accuracy
                </CardTitle>
                <CardDescription>
                    Prediction calibration - Points on diagonal line are well-calibrated
                </CardDescription>
            </CardHeader>
            <CardContent>
                {scatterData && scatterData.data.length > 0 ? (
                    <>
                        <ResponsiveContainer width="100%" height={300}>
                            <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    type="number"
                                    dataKey="confidence"
                                    domain={[0, 100]}
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Predicted Confidence (%)', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="accuracy"
                                    domain={[0, 100]}
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Actual Accuracy (%)', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    formatter={(value: number) => `${value}%`}
                                />
                                <Legend />

                                {/* Ideal calibration line */}
                                <ReferenceLine
                                    segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]}
                                    stroke="#666"
                                    strokeDasharray="5 5"
                                    label="Perfect Calibration"
                                />

                                <Scatter
                                    name="Predictions"
                                    data={scatterData.data}
                                    fill="#8b5cf6"
                                    fillOpacity={0.6}
                                />
                            </ScatterChart>
                        </ResponsiveContainer>

                        {/* Calibration Stats */}
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded bg-green-100 dark:bg-green-900/20">
                                <p className="text-xs text-muted-foreground">Well-Calibrated</p>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                    {scatterData.stats.wellCalibrated}%
                                </p>
                            </div>
                            <div className="p-2 rounded bg-orange-100 dark:bg-orange-900/20">
                                <p className="text-xs text-muted-foreground">Over-Confident</p>
                                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                    {scatterData.stats.overConfident}%
                                </p>
                            </div>
                            <div className="p-2 rounded bg-blue-100 dark:bg-blue-900/20">
                                <p className="text-xs text-muted-foreground">Under-Confident</p>
                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {scatterData.stats.underConfident}%
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <p>No data available yet</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
