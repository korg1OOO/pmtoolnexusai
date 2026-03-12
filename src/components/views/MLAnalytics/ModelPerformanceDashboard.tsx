import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Activity,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    Zap,
    RefreshCw,
    GitBranch,
    Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
    getModelPerformance,
    getModelVersions,
    getActiveModel,
    checkModelDrift,
    activateModelVersion,
    type ModelVersion,
    type ModelPerformance,
    type DriftMetrics,
} from "@/services/mlModelOperations";
import type { PredictionType } from "@/types/mlAnalytics";

export default function ModelPerformanceDashboard() {
    const [activeTab, setActiveTab] = useState<PredictionType>("risk");
    const [performance, setPerformance] = useState<ModelPerformance | null>(null);
    const [versions, setVersions] = useState<ModelVersion[]>([]);
    const [activeModel, setActiveModel] = useState<ModelVersion | null>(null);
    const [driftMetrics, setDriftMetrics] = useState<DriftMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, [activeTab]);

    const loadDashboardData = async () => {
        setIsLoading(true);

        const [perfResult, versionsResult, activeModelResult, driftResult] = await Promise.all([
            getModelPerformance(activeTab),
            getModelVersions(activeTab),
            getActiveModel(activeTab),
            checkModelDrift(activeTab),
        ]);

        if (perfResult.data) setPerformance(perfResult.data);
        if (versionsResult.data) setVersions(versionsResult.data);
        if (activeModelResult.data) setActiveModel(activeModelResult.data);
        if (driftResult.data) setDriftMetrics(driftResult.data);

        setIsLoading(false);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadDashboardData();
        setIsRefreshing(false);
        toast.success("Dashboard refreshed");
    };

    const handleActivateVersion = async (modelId: string) => {
        const result = await activateModelVersion(modelId, activeTab);
        if (result.success) {
            toast.success("Model version activated");
            await loadDashboardData();
        } else {
            toast.error("Failed to activate model version");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <Card className="p-8">
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading performance metrics...</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Activity className="h-6 w-6" />
                        Model Performance Dashboard
                    </h2>
                    <p className="text-muted-foreground mt-1">Monitor model health and performance metrics</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Model Type Selector */}
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="risk">Risk Prediction</TabsTrigger>
                    <TabsTrigger value="cost">Cost Forecasting</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule Delays</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-6 mt-6">
                    {/* Performance Metrics */}
                    {performance && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Performance Metrics (Last 24h)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                    <Card className="p-6">
                                        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                                            <Zap className="h-4 w-4" />
                                            <p className="text-sm font-medium">Predictions</p>
                                        </div>
                                        <p className="text-3xl font-bold">{performance.prediction_count}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Total generated</p>
                                    </Card>
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                    <Card className="p-6">
                                        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                                            <TrendingUp className="h-4 w-4" />
                                            <p className="text-sm font-medium">Avg Confidence</p>
                                        </div>
                                        <p className="text-3xl font-bold">{(performance.average_confidence * 100).toFixed(1)}%</p>
                                        <Progress value={performance.average_confidence * 100} className="mt-2 h-2" />
                                    </Card>
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                    <Card className="p-6">
                                        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <p className="text-sm font-medium">Cache Hit Rate</p>
                                        </div>
                                        <p className="text-3xl font-bold">{(performance.cache_hit_rate * 100).toFixed(0)}%</p>
                                        <p className="text-xs text-muted-foreground mt-1">{performance.avg_execution_time_ms}ms avg</p>
                                    </Card>
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                    <Card className={`p-6 ${performance.low_confidence_count > 0 ? 'border-yellow-200 bg-yellow-50' : ''}`}>
                                        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                                            <AlertTriangle className="h-4 w-4" />
                                            <p className="text-sm font-medium">Low Confidence</p>
                                        </div>
                                        <p className="text-3xl font-bold">{performance.low_confidence_count}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Below 70% threshold</p>
                                    </Card>
                                </motion.div>
                            </div>
                        </div>
                    )}

                    {/* Drift Detection */}
                    {driftMetrics && (
                        <Card className={`p-6 ${driftMetrics.is_drifting ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        {driftMetrics.is_drifting ? (
                                            <AlertTriangle className="h-5 w-5 text-red-600" />
                                        ) : (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        )}
                                        <h3 className="text-lg font-semibold">
                                            {driftMetrics.is_drifting ? 'Model Drift Detected' : 'Model Performance Stable'}
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Data Drift Score</p>
                                            <p className="text-2xl font-bold">{driftMetrics.data_drift_score.toFixed(3)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Prediction Drift Score</p>
                                            <p className="text-2xl font-bold">{driftMetrics.prediction_drift_score.toFixed(3)}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Recommendations:</p>
                                        {driftMetrics.recommendations.map((rec, idx) => (
                                            <p key={idx} className="text-sm flex items-start gap-2">
                                                <span className="font-bold">•</span>
                                                <span>{rec}</span>
                                            </p>
                                        ))}
                                    </div>
                                </div>
                                <Badge variant={driftMetrics.is_drifting ? "destructive" : "secondary"}>
                                    Threshold: {(driftMetrics.alert_threshold * 100).toFixed(0)}%
                                </Badge>
                            </div>
                        </Card>
                    )}

                    {/* Model Versions */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <GitBranch className="h-5 w-5" />
                            Model Versions
                        </h3>
                        {versions.length === 0 ? (
                            <Card className="p-8 text-center text-muted-foreground">
                                <p>No model versions found</p>
                                <p className="text-sm mt-2">Model versions will appear here after training</p>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {versions.map((version, idx) => (
                                    <motion.div
                                        key={version.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <Card className={`p-6 ${version.is_active ? 'border-2 border-primary' : ''}`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-semibold">{version.model_version}</h4>
                                                        {version.is_active && (
                                                            <Badge variant="default">Active</Badge>
                                                        )}
                                                        <Badge variant="outline">{version.algorithm}</Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-3">
                                                        Trained {formatDate(version.training_date)}
                                                        {version.training_data_size && ` • ${version.training_data_size.toLocaleString()} samples`}
                                                    </p>
                                                    {version.accuracy_metrics && (
                                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                                            {version.accuracy_metrics.precision !== undefined && (
                                                                <div>
                                                                    <p className="text-muted-foreground">Precision</p>
                                                                    <p className="font-medium">{(version.accuracy_metrics.precision * 100).toFixed(1)}%</p>
                                                                </div>
                                                            )}
                                                            {version.accuracy_metrics.recall !== undefined && (
                                                                <div>
                                                                    <p className="text-muted-foreground">Recall</p>
                                                                    <p className="font-medium">{(version.accuracy_metrics.recall * 100).toFixed(1)}%</p>
                                                                </div>
                                                            )}
                                                            {version.accuracy_metrics.f1 !== undefined && (
                                                                <div>
                                                                    <p className="text-muted-foreground">F1 Score</p>
                                                                    <p className="font-medium">{(version.accuracy_metrics.f1 * 100).toFixed(1)}%</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {version.notes && (
                                                        <p className="text-sm text-muted-foreground mt-2">
                                                            <span className="font-medium">Notes:</span> {version.notes}
                                                        </p>
                                                    )}
                                                </div>
                                                {!version.is_active && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleActivateVersion(version.id)}
                                                    >
                                                        Activate
                                                    </Button>
                                                )}
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Active Model Info */}
                    {activeModel && (
                        <Card className="p-6 bg-muted/50">
                            <h4 className="font-semibold mb-2">Current Active Model</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Version</p>
                                    <p className="font-medium">{activeModel.model_version}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Algorithm</p>
                                    <p className="font-medium">{activeModel.algorithm}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Trained</p>
                                    <p className="font-medium">{formatDate(activeModel.training_date)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Status</p>
                                    <Badge variant="default">Active</Badge>
                                </div>
                            </div>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
