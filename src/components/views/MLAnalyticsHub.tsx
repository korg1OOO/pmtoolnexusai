import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, RefreshCw, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import RiskPredictionDashboard from "./MLAnalytics/RiskPredictionDashboard";
import CostForecastingPanel from "./MLAnalytics/CostForecastingPanel";
import ScheduleDelayPredictor from "./MLAnalytics/ScheduleDelayPredictor";
import ModelPerformanceDashboard from "./MLAnalytics/ModelPerformanceDashboard";
import { refreshPredictions } from "@/services/mlAnalyticsService";

export default function MLAnalyticsHub() {
    const { projectId } = useParams<{ projectId: string }>();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [activeTab, setActiveTab] = useState("risk");

    useEffect(() => {
        setLastUpdated(new Date());
    }, [projectId]);

    const handleRefresh = async () => {
        if (!projectId) return;

        setIsRefreshing(true);
        toast.info("Refreshing ML predictions...");

        try {
            await refreshPredictions(projectId);
            setLastUpdated(new Date());
            toast.success("Predictions refreshed successfully");
        } catch (error) {
            toast.error("Failed to refresh predictions");
        } finally {
            setIsRefreshing(false);
        }
    };

    const formatLastUpdated = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    if (!projectId) {
        return (
            <div className="container mx-auto py-8">
                <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Please select a project to view ML analytics</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between flex-wrap gap-4"
            >
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => window.history.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <Brain className="h-8 w-8 text-primary" />
                            <h1 className="text-3xl font-bold">ML Analytics</h1>
                        </div>
                        <p className="text-muted-foreground mt-1">
                            Advanced machine learning insights for your project
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Last updated</p>
                        <p className="text-sm font-medium">{formatLastUpdated(lastUpdated)}</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </motion.div>

            {/* Info Card */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-start gap-4">
                    <Brain className="h-6 w-6 text-blue-600 mt-1" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 mb-2">About ML Analytics</h3>
                        <p className="text-sm text-blue-800">
                            Our machine learning models analyze your project data to predict risks, forecast costs, and identify potential schedule delays.
                            Predictions are cached for 24 hours and confidence scores indicate the reliability of each prediction.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Main Content - Tabbed Interface */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 h-auto">
                    <TabsTrigger value="risk" className="flex flex-col gap-1 py-3">
                        <span className="font-semibold">Risk Prediction</span>
                        <span className="text-xs text-muted-foreground">Identify project risks</span>
                    </TabsTrigger>
                    <TabsTrigger value="cost" className="flex flex-col gap-1 py-3">
                        <span className="font-semibold">Cost Forecasting</span>
                        <span className="text-xs text-muted-foreground">Predict budget variance</span>
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="flex flex-col gap-1 py-3">
                        <span className="font-semibold">Schedule Delays</span>
                        <span className="text-xs text-muted-foreground">Predict task delays</span>
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="flex flex-col gap-1 py-3">
                        <span className="font-semibold">Model Performance</span>
                        <span className="text-xs text-muted-foreground">Monitor model health</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="risk" className="space-y-4">
                    <RiskPredictionDashboard projectId={projectId} />
                </TabsContent>

                <TabsContent value="cost" className="space-y-4">
                    <CostForecastingPanel projectId={projectId} />
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
                    <ScheduleDelayPredictor projectId={projectId} />
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                    <ModelPerformanceDashboard />
                </TabsContent>
            </Tabs>

            {/* Footer Note */}
            <Card className="p-4 bg-muted/50">
                <p className="text-xs text-muted-foreground text-center">
                    <Badge variant="outline" className="mr-2">Beta</Badge>
                    ML predictions are provided as guidance and should be validated with domain expertise.
                    Accuracy improves with more project data.
                </p>
            </Card>
        </div>
    );
}
