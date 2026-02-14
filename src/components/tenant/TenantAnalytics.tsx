import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, FolderKanban, Building } from 'lucide-react';
import { getTenantOverview, getWorkspaces } from '@/services/tenantService';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function TenantAnalytics() {
    const [tenantId] = useState('default-tenant-id');
    const [timeRange, setTimeRange] = useState('30d');

    const { data: overview } = useQuery({
        queryKey: ['tenant-overview', tenantId],
        queryFn: () => getTenantOverview(tenantId)
    });

    const { data: workspaces } = useQuery({
        queryKey: ['tenant-workspaces', tenantId],
        queryFn: () => getWorkspaces(tenantId)
    });

    // Mock data for charts
    const growthData = [
        { month: 'Jan', users: 45, projects: 12, workspaces: 3 },
        { month: 'Feb', users: 52, projects: 15, workspaces: 3 },
        { month: 'Mar', users: 61, projects: 18, workspaces: 4 },
        { month: 'Apr', users: 70, projects: 22, workspaces: 4 },
        { month: 'May', users: 85, projects: 28, workspaces: 5 },
        { month: 'Jun', users: overview?.total_users || 95, projects: overview?.total_projects || 32, workspaces: overview?.total_workspaces || 5 },
    ];

    const workspaceDistribution = workspaces?.map(w => ({
        name: w.name,
        value: w.project_count
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
                <MetricCard
                    icon={Building}
                    label="Total Workspaces"
                    value={overview?.total_workspaces || 0}
                    change="+12%"
                    trend="up"
                />
                <MetricCard
                    icon={Users}
                    label="Total Users"
                    value={overview?.total_users || 0}
                    change="+8%"
                    trend="up"
                />
                <MetricCard
                    icon={FolderKanban}
                    label="Active Projects"
                    value={overview?.total_projects || 0}
                    change="+15%"
                    trend="up"
                />
                <MetricCard
                    icon={TrendingUp}
                    label="Programs"
                    value={overview?.active_programs || 0}
                    change="+5%"
                    trend="up"
                />
            </div>

            {/* Growth Chart */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Growth Trends</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={growthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="projects" stroke="#10b981" strokeWidth={2} />
                        <Line type="monotone" dataKey="workspaces" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Workspace Distribution */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Projects by Workspace</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={workspaceDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => entry.name}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {workspaceDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>

                {/* Activity Summary */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Activity Summary</h2>
                    <div className="space-y-4">
                        <ActivityItem
                            label="New users this month"
                            value={15}
                            icon={Users}
                        />
                        <ActivityItem
                            label="Projects created"
                            value={8}
                            icon={FolderKanban}
                        />
                        <ActivityItem
                            label="Workspaces added"
                            value={2}
                            icon={Building}
                        />
                        <ActivityItem
                            label="Active programs"
                            value={overview?.active_programs || 0}
                            icon={TrendingUp}
                        />
                    </div>
                </Card>
            </div>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, change, trend }: {
    icon: any;
    label: string;
    value: number;
    change: string;
    trend: 'up' | 'down';
}) {
    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
                <Icon className="w-8 h-8 text-muted-foreground" />
                <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {change}
                </span>
            </div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
        </Card>
    );
}

function ActivityItem({ label, value, icon: Icon }: {
    label: string;
    value: number;
    icon: any;
}) {
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
