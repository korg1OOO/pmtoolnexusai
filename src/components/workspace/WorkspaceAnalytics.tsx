import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Users, Briefcase } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function WorkspaceAnalytics() {
    const { workspaceId } = useParams();
    const [timeRange, setTimeRange] = useState('6m');

    const { data: analytics } = useQuery({
        queryKey: ['workspace-analytics', workspaceId, timeRange],
        queryFn: async () => {
            return {
                portfolios: 3,
                programs: 8,
                projects: 24,
                members: 45,
                performanceTrend: [
                    { month: 'Jan', onTrack: 18, atRisk: 4, delayed: 2 },
                    { month: 'Feb', onTrack: 19, atRisk: 3, delayed: 2 },
                    { month: 'Mar', onTrack: 20, atRisk: 3, delayed: 1 },
                    { month: 'Apr', onTrack: 21, atRisk: 2, delayed: 1 },
                    { month: 'May', onTrack: 22, atRisk: 2, delayed: 0 },
                    { month: 'Jun', onTrack: 23, atRisk: 1, delayed: 0 }
                ],
                portfolioDistribution: [
                    { name: 'Digital Transformation', value: 12 },
                    { name: 'Product Innovation', value: 8 },
                    { name: 'Infrastructure', value: 4 }
                ],
                resourceUtilization: [
                    { role: 'Portfolio Mgr', utilization: 95 },
                    { role: 'Program Mgr', utilization: 88 },
                    { role: 'Project Mgr', utilization: 92 },
                    { role: 'Team Member', utilization: 78 }
                ]
            };
        }
    });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Workspace Analytics</h1>
                    <p className="text-muted-foreground">Performance insights and metrics</p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="border rounded-md px-3 py-2"
                    >
                        <option value="1m">Last Month</option>
                        <option value="3m">Last 3 Months</option>
                        <option value="6m">Last 6 Months</option>
                        <option value="1y">Last Year</option>
                    </select>
                    <Button variant="outline">Export Report</Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Portfolios</p>
                            <p className="text-2xl font-bold">{analytics?.portfolios}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Programs</p>
                            <p className="text-2xl font-bold">{analytics?.programs}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Projects</p>
                            <p className="text-2xl font-bold">{analytics?.projects}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-orange-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Team Members</p>
                            <p className="text-2xl font-bold">{analytics?.members}</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Trend */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Project Performance Trend</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={analytics?.performanceTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="onTrack" fill="#10b981" name="On Track" />
                            <Bar dataKey="atRisk" fill="#f59e0b" name="At Risk" />
                            <Bar dataKey="delayed" fill="#ef4444" name="Delayed" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* Portfolio Distribution */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Project Distribution by Portfolio</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={analytics?.portfolioDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => `${entry.name}: ${entry.value}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {analytics?.portfolioDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Resource Utilization */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Resource Utilization by Role</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analytics?.resourceUtilization} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="role" type="category" />
                        <Tooltip />
                        <Bar dataKey="utilization" fill="#3b82f6" name="Utilization %" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
    );
}
