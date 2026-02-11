import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, AlertTriangle, Loader2, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { predictDelays } from "@/services/mlAnalyticsService";
import type { ScheduleDelayPrediction, RiskLevel } from "@/types/mlAnalytics";

interface ScheduleDelayPredictorProps {
    projectId: string;
}

export default function ScheduleDelayPredictor({ projectId }: ScheduleDelayPredictorProps) {
    const [prediction, setPrediction] = useState<ScheduleDelayPrediction | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [confidenceScore, setConfidenceScore] = useState(0);
    const [fromCache, setFromCache] = useState(false);

    useEffect(() => {
        loadPrediction();
    }, [projectId]);

    const loadPrediction = async () => {
        setIsLoading(true);
        setError(null);

        const response = await predictDelays(projectId);

        if (response.error) {
            setError(response.error);
        } else if (response.data) {
            setPrediction(response.data);
            setConfidenceScore(response.confidence_score);
            setFromCache(response.from_cache || false);
        }

        setIsLoading(false);
    };

    const getRiskLevelBadge = (level: RiskLevel) => {
        const colors = {
            critical: "destructive",
            high: "destructive",
            medium: "default",
            low: "secondary",
        };
        return colors[level] || "default";
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high": return "text-red-600 bg-red-50";
            case "medium": return "text-yellow-600 bg-yellow-50";
            case "low": return "text-green-600 bg-green-50";
            default: return "text-gray-600 bg-gray-50";
        }
    };

    if (isLoading) {
        return (
            <Card className="p-8">
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-muted-foreground">Predicting schedule delays...</p>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="p-8 border-red-200 bg-red-50">
                <div className="flex items-center gap-3 text-red-700">
                    <AlertTriangle className="h-6 w-6" />
                    <div>
                        <p className="font-semibold">Error loading schedule prediction</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            </Card>
        );
    }

    if (!prediction) {
        return (
            <Card className="p-8">
                <p className="text-muted-foreground text-center">No schedule prediction available</p>
            </Card>
        );
    }

    // Data for chart - top 10 tasks with highest delays
    const chartData = prediction.task_predictions
        .slice(0, 10)
        .map(task => ({
            name: task.task_name.length > 20 ? task.task_name.substring(0, 20) + '...' : task.task_name,
            planned: task.planned_duration_days,
            predicted: task.predicted_duration_days,
            delay: task.delay_days,
        }));

    const hasDelays = prediction.total_delay_days > 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Schedule Delay Prediction</h2>
                <div className="flex items-center gap-3">
                    {fromCache && (
                        <Badge variant="outline" className="text-xs">
                            Cached
                        </Badge>
                    )}
                    <Badge variant="secondary">
                        {(confidenceScore * 100).toFixed(0)}% Confidence
                    </Badge>
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <p className="text-sm font-medium">Planned Duration</p>
                        </div>
                        <p className="text-3xl font-bold">{prediction.total_planned_days}</p>
                        <p className="text-sm text-muted-foreground">days</p>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className={`p-6 border-2 ${hasDelays ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className={`h-4 w-4 ${hasDelays ? 'text-orange-600' : 'text-green-600'}`} />
                            <p className="text-sm font-medium">Predicted Duration</p>
                        </div>
                        <p className="text-3xl font-bold">{prediction.total_predicted_days}</p>
                        <p className="text-sm text-muted-foreground">days</p>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className={`p-6 ${hasDelays ? 'bg-red-50' : 'bg-green-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-medium">Total Delay</p>
                        </div>
                        <p className={`text-3xl font-bold ${hasDelays ? 'text-red-600' : 'text-green-600'}`}>
                            {hasDelays ? '+' : ''}{prediction.total_delay_days}
                        </p>
                        <p className="text-sm text-muted-foreground">days</p>
                        <div className="mt-2">
                            <p className="text-xs text-muted-foreground">On-time probability</p>
                            <Progress value={prediction.completion_probability_on_time} className="h-2 mt-1" />
                            <p className="text-xs mt-1">{prediction.completion_probability_on_time}%</p>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Timeline Visualization */}
            {chartData.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Top Tasks with Predicted Delays</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="planned" fill="#10b981" name="Planned" />
                            <Bar dataKey="predicted" fill="#f59e0b" name="Predicted" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}

            {/* Task-Level Details */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Task Delay Analysis</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {prediction.task_predictions.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No tasks analyzed</p>
                    ) : (
                        prediction.task_predictions.map((task, index) => (
                            <motion.div
                                key={task.task_id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(index * 0.03, 0.5) }}
                                className={`p-4 rounded-lg border ${task.is_critical ? 'border-red-300 bg-red-50' : 'bg-muted/30'}`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {task.is_critical && (
                                                <Badge variant="destructive" className="text-xs">Critical Path</Badge>
                                            )}
                                            <Badge variant={getRiskLevelBadge(task.delay_level) as any}>
                                                {task.delay_level}
                                            </Badge>
                                            <Badge variant="outline" className={getPriorityColor(task.mitigation_priority)}>
                                                {task.mitigation_priority} priority
                                            </Badge>
                                            <h4 className="font-semibold">{task.task_name}</h4>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Planned</p>
                                                <p className="font-medium">{task.planned_duration_days} days</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Predicted</p>
                                                <p className="font-medium">{task.predicted_duration_days} days</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Delay</p>
                                                <p className="font-medium text-red-600">+{task.delay_days} days</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Probability</p>
                                                <p className="font-medium">{task.delay_probability}%</p>
                                            </div>
                                        </div>

                                        {task.delay_factors.length > 0 && (
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground mb-1">Delay Factors:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {task.delay_factors.map((factor, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs">
                                                            {factor}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {task.impact_on_critical_path > 0 && (
                                            <p className="text-xs text-red-600">
                                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                                Critical path impact: +{task.impact_on_critical_path} days project delay
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </Card>

            {/* Recommended Actions */}
            <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="text-lg font-semibold mb-3">Recommended Actions</h3>
                {prediction.recommended_actions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No specific actions recommended</p>
                ) : (
                    <ul className="space-y-2">
                        {prediction.recommended_actions.map((action, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                                <span className="text-blue-600 font-bold">•</span>
                                <span>{action}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            {/* Summary */}
            <Card className="p-6 bg-muted/50">
                <h4 className="font-semibold mb-2">ML Analysis Summary</h4>
                <p className="text-sm text-muted-foreground">{prediction.summary}</p>
            </Card>
        </div>
    );
}
