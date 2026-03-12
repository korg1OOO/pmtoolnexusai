import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, FolderKanban, Building } from 'lucide-react';
import { getTenantOverview, getWorkspaces } from '@/services/tenantService';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function TenantAnalytics() {
    const { tenantId } = useTenant();
    const [timeRange, setTimeRange] = useState('30d');

    const { data: overview } = useQuery({
        queryKey: ['tenant-overview', tenantId],
        queryFn: () => getTenantOverview(tenantId)
    });

    const { data: workspaces } = useQuery({
        queryKey: ['tenant-workspaces', tenantId],
        queryFn: () => getWorkspaces(tenantId)
    });

    // Real growth data from projects created over time
    const { data: growthData = [] } = useQuery({
        queryKey: ['tenant-growth', tenantId],
        queryFn: async () => {
            const { data: projects } = await (supabase as any)
                .from('projects')
                .select('created_at')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: true });

            const { data: members } = await (supabase as any)
                .from('workspace_members')
                .select('joined_at')
                .order('joined_at', { ascending: true });

            // Group by month
            const months: Record<string, { users: number; projects: number }> = {};
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            for (const p of (projects || [])) {
                const d = new Date(p.created_at);
                const key = `${d.getFullYear()}-${d.getMonth()}`;
                if (!months[key]) months[key] = { users: 0, projects: 0 };
                months[key].projects++;
            }
            for (const m of (members || [])) {
                const d = new Date(m.joined_at);
                const key = `${d.getFullYear()}-${d.getMonth()}`;
                if (!months[key]) months[key] = { users: 0, projects: 0 };
                months[key].users++;
            }

            return Object.entries(months)
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(-6)
                .map(([key, val]) => {
                    const [, monthIdx] = key.split('-');
                    return {
                        month: monthNames[parseInt(monthIdx)],
                        users: val.users,
                        projects: val.projects,
                        workspaces: overview?.total_workspaces || 0,
                    };
                });
        },
        enabled: !!tenantId,
    });

    // Real activity counts
    const { data: activityData } = useQuery({
        queryKey: ['tenant-activity', tenantId],
        queryFn: async () => {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

            const { count: newUsers } = await (supabase as any)
                .from('workspace_members')
                .select('*', { count: 'exact', head: true })
                .gte('joined_at', thirtyDaysAgo);

            const { count: newProjects } = await (supabase as any)
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .gte('created_at', thirtyDaysAgo);

            const { count: newWorkspaces } = await (supabase as any)
                .from('workspaces')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .gte('created_at', thirtyDaysAgo);

            return {
                newUsers: newUsers || 0,
                newProjects: newProjects || 0,
                newWorkspaces: newWorkspaces || 0,
            };
        },
        enabled: !!tenantId,
    });

    const workspaceDistribution = workspaces?.map((w: any) => ({
        name: w.name,
        value: w.project_count || 0
    })) || [];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Company Analytics</h1>
                    <p className="text-muted-foreground">Insights and metrics across your organization</p>
                </div>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="border rounded-md p-2"
                    aria-label="Time range"
                >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="1y">Last year</option>
                </select>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard icon={Building} label="Total Workspaces" value={overview?.total_workspaces || 0} />
                <MetricCard icon={Users} label="Total Users" value={overview?.total_users || 0} />
                <MetricCard icon={FolderKanban} label="Active Projects" value={overview?.total_projects || 0} />
                <MetricCard icon={TrendingUp} label="Programs" value={overview?.active_programs || 0} />
            </div>

            {/* Growth Chart */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Growth Trends</h2>
                {growthData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">No historical data yet</div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={growthData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                            <Line type="monotone" dataKey="projects" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Workspace Distribution */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Projects by Workspace</h2>
                    {workspaceDistribution.length === 0 ? (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">No workspace data</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={workspaceDistribution} cx="50%" cy="50%" labelLine={false} label={(entry: any) => entry.name} outerRadius={80} fill="#8884d8" dataKey="value">
                                    {workspaceDistribution.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </Card>

                {/* Activity Summary */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Activity Summary (Last 30 days)</h2>
                    <div className="space-y-4">
                        <ActivityItem label="New users" value={activityData?.newUsers || 0} icon={Users} />
                        <ActivityItem label="Projects created" value={activityData?.newProjects || 0} icon={FolderKanban} />
                        <ActivityItem label="Workspaces added" value={activityData?.newWorkspaces || 0} icon={Building} />
                        <ActivityItem label="Active programs" value={overview?.active_programs || 0} icon={TrendingUp} />
                    </div>
                </Card>
            </div>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
                <Icon className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
        </Card>
    );
}

function ActivityItem({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
    return (
        <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">{label}</span>
            </div>
            <span className="text-lg font-semibold">{value}</span>
        </div>
    );
}