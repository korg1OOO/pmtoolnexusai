
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, Clock, MessageSquare, Star } from "lucide-react";

interface InteractionLog {
    id: string;
    agent_id: string | null;
    response_time_ms: number | null;
    feedback_score: number | null;
    feedback_text: string | null;
    query_summary: string | null;
    created_at: string;
}

export function AgentAnalytics() {
    const { data: analytics, isLoading } = useQuery({
        queryKey: ['ai-agent-analytics'],
        queryFn: async () => {
            // Fetch logs from ai_usage_logs as a proxy (ai_interaction_logs doesn't exist in schema)
            const supabaseAny = supabase as any;
            const { data, error } = await supabaseAny
                .from('ai_usage_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            // Map to expected shape
            const logs: InteractionLog[] = (data || []).map((log: any) => ({
                id: log.id,
                agent_id: log.provider,
                response_time_ms: log.latency_ms,
                feedback_score: null,
                feedback_text: null,
                query_summary: log.operation,
                created_at: log.created_at,
            }));

            // Calculate metrics
            const totalInteractions = logs.length;
            const avgResponseTime = logs.reduce((acc, log) => acc + (log.response_time_ms || 0), 0) / (totalInteractions || 1);
            const ratedLogs = logs.filter(l => l.feedback_score !== null);
            const avgRating = ratedLogs.reduce((acc, log) => acc + (log.feedback_score || 0), 0) / (ratedLogs.length || 1);

            // Group by Agent
            const agentStats: Record<string, number> = {};
            logs.forEach(log => {
                if (log.agent_id) {
                    agentStats[log.agent_id] = (agentStats[log.agent_id] || 0) + 1;
                }
            });

            return {
                totalInteractions,
                avgResponseTime: Math.round(avgResponseTime),
                avgRating: avgRating.toFixed(1),
                logs,
                agentStats
            };
        }
    });

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.totalInteractions}</div>
                        <p className="text-xs text-muted-foreground">Last 100 requests</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.avgResponseTime}ms</div>
                        <p className="text-xs text-muted-foreground">Response time</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.avgRating} / 5.0</div>
                        <p className="text-xs text-muted-foreground">Based on feedback</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Feedback</CardTitle>
                    <CardDescription>Latest user ratings and comments</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analytics?.logs.filter(l => l.feedback_score).map((log) => (
                            <div key={log.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-3 w-3 ${i < (log.feedback_score || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm mt-1">{log.feedback_text || "No comment"}</p>
                                    <p className="text-xs text-muted-foreground mt-1 italic">Query: "{log.query_summary}"</p>
                                </div>
                                <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                    {log.response_time_ms}ms
                                </div>
                            </div>
                        ))}
                        {(!analytics?.logs.some(l => l.feedback_score)) && (
                            <p className="text-sm text-muted-foreground text-center py-4">No feedback recorded yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
