import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
    TrendingUp,
    TrendingDown,
    Activity,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    LineChart as LineChartIcon,
    Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
    onTrackScore: number;
    budgetVariance: number;
    resourceUtilization: number;
    activeRisksCount: number;
    overdueTasksCount: number;
    predictedDeliveryDate?: string;
    trends: any[];
}

export function PredictiveDashboard({ projectId }: { projectId: string }) {
    const { data, isLoading } = useQuery<DashboardData>({
        queryKey: [`/api/project-copilot/${projectId}/predictive-dashboard`],
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!data) return null;

    const healthStatus = data.onTrackScore >= 80 ? "Healthy" : data.onTrackScore >= 50 ? "At Risk" : "Critical";
    const healthColor = data.onTrackScore >= 80 ? "text-green-600" : data.onTrackScore >= 50 ? "text-orange-600" : "text-red-600";

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">On-Track Score</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex items-center justify-between">
                        <div className={`text-2xl font-bold ${healthColor}`}>{Math.round(data.onTrackScore)}%</div>
                        <Badge variant="outline" className={`${healthColor} border-current opacity-80`}>{healthStatus}</Badge>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-sm">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Predicted Delivery</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div className="text-sm font-bold">
                            {data.predictedDeliveryDate ? format(new Date(data.predictedDeliveryDate), "MMM dd, yyyy") : "TBD"}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500 shadow-sm">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Active Risks</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <div className="text-2xl font-bold">{data.activeRisksCount}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm overflow-hidden">
                <CardHeader className="p-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-500" />
                                Health Trend (Last 7 Days)
                            </CardTitle>
                            <CardDescription className="text-[10px]">Daily On-Track Score variations</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="h-[180px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.trends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="snapshotDate"
                                    tick={{ fontSize: 10 }}
                                    tickFormatter={(str) => format(new Date(str), "MM/dd")}
                                    stroke="#888888"
                                />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#888888" />
                                <Tooltip
                                    labelFormatter={(label) => format(new Date(label), "MMM dd, yyyy")}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="onTrackScore"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#3b82f6" }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Execution Metrics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex flex-col gap-1">
                        <span className="text-[10px] text-red-600 font-bold uppercase">Overdue Tasks</span>
                        <span className="text-xl font-bold text-red-700">{data.overdueTasksCount}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 flex flex-col gap-1">
                        <span className="text-[10px] text-blue-600 font-bold uppercase">Resource Utilization</span>
                        <span className="text-xl font-bold text-blue-700">{Math.round(data.resourceUtilization * 100)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
