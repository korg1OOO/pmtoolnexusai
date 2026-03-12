import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Minus,
    DollarSign,
    Clock,
    Users,
    Shield,
    Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { predictRisks } from "@/services/mlAnalyticsService";
import type { RiskPrediction, RiskLevel } from "@/types/mlAnalytics";

interface RiskPredictionDashboardProps {
    projectId: string;
}

export default function RiskPredictionDashboard({ projectId }: RiskPredictionDashboardProps) {
    const [prediction, setPrediction] = useState<RiskPrediction | null>(null);
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

        const response = await predictRisks(projectId);

        if (response.error) {
            setError(response.error);
        } else if (response.data) {
            setPrediction(response.data);
            setConfidenceScore(response.confidence_score);
            setFromCache(response.from_cache || false);
        }

        setIsLoading(false);
    };

    const getRiskLevelColor = (level: RiskLevel) => {
        switch (level) {
            case "critical": return "text-red-600 bg-red-50 border-red-200";
            case "high": return "text-orange-600 bg-orange-50 border-orange-200";
            case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
            case "low": return "text-green-600 bg-green-50 border-green-200";
            default: return "text-gray-600 bg-gray-50 border-gray-200";
        }
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

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case "increasing": return <TrendingUp className="h-4 w-4 text-red-500" />;
            case "decreasing": return <TrendingDown className="h-4 w-4 text-green-500" />;
            default: return <Minus className="h-4 w-4 text-gray-500" />;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "financial": return <DollarSign className="h-5 w-5" />;
            case "schedule": return <Clock className="h-5 w-5" />;
            case "resource": return <Users className="h-5 w-5" />;
            default: return <Shield className="h-5 w-5" />;
        }
    };

    if (isLoading) {
        return (
            <Card className="p-8">
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-muted-foreground">Analyzing project risks...</p>
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
                        <p className="font-semibold">Error loading risk prediction</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            </Card>
        );
    }

    if (!prediction) {
        return (
            <Card className="p-8">
                <p className="text-muted-foreground text-center">No risk prediction available</p>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with confidence indicator */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Risk Prediction</h2>
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

            {/* Overall Risk Score */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className={`p-8 border-2 ${getRiskLevelColor(prediction.risk_level)}`}>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <AlertTriangle className="h-8 w-8" />
                            <p className="text-lg font-semibold uppercase tracking-wide">
                                {prediction.risk_level} Risk
                            </p>
                        </div>
                        <div className="text-6xl font-bold mb-2">{prediction.overall_score}</div>
                        <p className="text-sm opacity-80">Overall Risk Score (0-200)</p>
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <span className="text-sm">Trend:</span>
                            {getTrendIcon(prediction.trend)}
                            <span className="text-sm capitalize">{prediction.trend}</span>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Category Breakdown */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Risk by Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {prediction.categories.map((category, index) => (
                        <motion.div
                            key={category.category}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <Card className="p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    {getCategoryIcon(category.category)}
                                    <h4 className="font-semibold capitalize">{category.category}</h4>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-baseline gap-2">
                                        <div className="text-3xl font-bold">{category.score}%</div>
                                        {getTrendIcon(category.trend)}
                                    </div>
                                    <Progress value={category.score} className="h-2" />
                                    <div className="space-y-1">
                                        {category.contributing_factors.map((factor, i) => (
                                            <p key={i} className="text-xs text-muted-foreground">
                                                • {factor}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Risk Factors */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Identified Risk Factors</h3>
                {prediction.risk_factors.length === 0 ? (
                    <Card className="p-6 text-center text-muted-foreground">
                        No specific risk factors identified
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {prediction.risk_factors.map((factor, index) => (
                            <motion.div
                                key={factor.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <Card className="p-6 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <Badge variant={getRiskLevelBadge(factor.impact) as any}>
                                                    {factor.impact}
                                                </Badge>
                                                <h4 className="font-semibold">{factor.title}</h4>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{factor.description}</p>
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium">Probability:</span>
                                                    <span className="text-muted-foreground">{factor.probability}%</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium">Category:</span>
                                                    <span className="text-muted-foreground capitalize">{factor.category}</span>
                                                </div>
                                                {factor.estimated_cost_impact && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium">Impact:</span>
                                                        <span className="text-muted-foreground">
                                                            ${factor.estimated_cost_impact.toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
                                                {factor.estimated_delay_days && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium">Delay:</span>
                                                        <span className="text-muted-foreground">
                                                            {factor.estimated_delay_days} days
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-24 text-right">
                                            <Badge variant={factor.mitigation_status === "none" ? "destructive" : "secondary"}>
                                                {factor.mitigation_status === "none" ? "No mitigation" : factor.mitigation_status}
                                            </Badge>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Summary */}
            <Card className="p-6 bg-muted/50">
                <h4 className="font-semibold mb-2">ML Analysis Summary</h4>
                <p className="text-sm text-muted-foreground">{prediction.summary}</p>
            </Card>
        </div>
    );
}
