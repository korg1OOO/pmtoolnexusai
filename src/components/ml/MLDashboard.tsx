import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, AlertTriangle, RefreshCw, Activity } from "lucide-react";
import { useMLModels } from "@/hooks/useMLModels";
import { usePredictionStats } from "@/hooks/useMLPredictions";
import { useRetrainingJobStats, useActiveRetrainingJobs } from "@/hooks/useMLRetraining";
import { useUnacknowledgedAlerts, useCriticalAlerts, useMLAlertsRealtime } from "@/hooks/useMLAlerts";
import { ModelMetadataCard } from "./ModelMetadataCard";
import { RetrainingJobCard } from "./RetrainingJobCard";
import { useNavigate } from "react-router-dom";

/**
 * Main ML Dashboard Component
 * Provides overview of all ML models, predictions, retraining jobs, and alerts
 */
export const MLDashboard = () => {
    const navigate = useNavigate();

    // Fetch data
    const { data: models = [], isLoading: modelsLoading } = useMLModels(undefined, false);
    const { data: predictionStats } = usePredictionStats();
    const { data: retrainingStats } = useRetrainingJobStats();
    const { data: activeJobs = [] } = useActiveRetrainingJobs();
    const { data: unacknowledgedAlerts = [] } = useUnacknowledgedAlerts();
    const { data: criticalAlerts = [] } = useCriticalAlerts();

    // Subscribe to real-time alert updates
    useMLAlertsRealtime();

    const activeModels = models.filter(m => m.is_active);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Brain className="h-8 w-8 text-purple-600" />
                        ML Model Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor and manage machine learning models for risk, cost, and schedule predictions
                    </p>
                </div>
            </div>

            {/* Critical Alerts */}
            {criticalAlerts.length > 0 && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Critical ML Alerts</AlertTitle>
                    <AlertDescription>
                        You have {criticalAlerts.length} critical {criticalAlerts.length === 1 ? 'alert' : 'alerts'} requiring immediate attention.
                        <Button variant="link" size="sm" onClick={() => navigate('/admin/ml/alerts')} className="ml-2">
                            View All Alerts
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Active Models */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Active Models</p>
                            <p className="text-3xl font-bold mt-2">{activeModels.length}/3</p>
                        </div>
                        <Activity className="h-10 w-10 text-green-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Risk, Cost, Schedule
                    </p>
                </Card>

                {/* Total Predictions */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Predictions (24h)</p>
                            <p className="text-3xl font-bold mt-2">{predictionStats?.last24h || 0}</p>
                        </div>
                        <TrendingUp className="h-10 w-10 text-blue-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Avg confidence: {((predictionStats?.avgConfidence || 0) * 100).toFixed(1)}%
                    </p>
                </Card>

                {/* Active Retraining Jobs */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Retraining Jobs</p>
                            <p className="text-3xl font-bold mt-2">{retrainingStats?.active || 0}</p>
                        </div>
                        <RefreshCw className={`h-10 w-10 text-purple-600 ${retrainingStats?.active ? 'animate-spin' : ''}`} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {retrainingStats?.completed || 0} completed this month
                    </p>
                </Card>

                {/* Unacknowledged Alerts */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                            <p className="text-3xl font-bold mt-2">{unacknowledgedAlerts.length}</p>
                        </div>
                        <AlertTriangle className="h-10 w-10 text-orange-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {criticalAlerts.length} critical
                    </p>
                </Card>
            </div>

            {/* Active Models Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold">Active Models</h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/admin/ml/models')}
                    >
                        View All Models
                    </Button>
                </div>

                {modelsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <Card key={i} className="p-6 animate-pulse">
                                <div className="h-24 bg-muted rounded" />
                            </Card>
                        ))}
                    </div>
                ) : activeModels.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {activeModels.map(model => (
                            <ModelMetadataCard key={model.id} model={model} />
                        ))}
                    </div>
                ) : (
                    <Card className="p-8 text-center">
                        <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No active models found</p>
                        <p className="text-sm text-muted-foreground">Train your first model to get started</p>
                    </Card>
                )}
            </div>

            {/* Active Retraining Jobs */}
            {activeJobs.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold">Active Retraining Jobs</h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/admin/ml/retraining')}
                        >
                            View All Jobs
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeJobs.map(job => (
                            <RetrainingJobCard key={job.id} job={job} />
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Unacknowledged Alerts */}
            {unacknowledgedAlerts.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold">Recent Alerts</h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/admin/ml/alerts')}
                        >
                            View All Alerts
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {unacknowledgedAlerts.slice(0, 5).map(alert => (
                            <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                                <AlertTriangle className="h-4 w-4" />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <AlertTitle>{alert.title}</AlertTitle>
                                        <AlertDescription className="mt-1">{alert.message}</AlertDescription>
                                    </div>
                                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                                        {alert.severity}
                                    </Badge>
                                </div>
                            </Alert>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => navigate('/admin/ml/predictions')}>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        View Predictions
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/admin/ml/retraining')}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Manage Retraining
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/admin/ml/accuracy')}>
                        <Activity className="mr-2 h-4 w-4" />
                        Accuracy Tracking
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/admin/ml/training-data')}>
                        <Brain className="mr-2 h-4 w-4" />
                        Training Data
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default MLDashboard;
