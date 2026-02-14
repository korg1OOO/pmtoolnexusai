import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Zap, Hash, Activity, TrendingUp } from 'lucide-react';
import { aiCreditsService } from '@/services/aiCreditsService';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export function UsageDashboard() {
    const [dateRange, setDateRange] = useState('30');

    // Fetch usage history
    const { data: usage, isLoading: usageLoading } = useQuery({
        queryKey: ['ai-usage', dateRange],
        queryFn: () => aiCreditsService.getUsageHistory(parseInt(dateRange))
    });

    // Fetch usage stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['ai-usage-stats', dateRange],
        queryFn: () => aiCreditsService.getUsageStats(parseInt(dateRange))
    });

    const isLoading = usageLoading || statsLoading;

    // Prepare chart data
    const dailyUsage = usage?.reduce((acc, log) => {
        const date = new Date(log.created_at).toLocaleDateString();
        const existing = acc.find(d => d.date === date);
        if (existing) {
            existing.credits += log.credits_used;
            existing.requests += 1;
        } else {
            acc.push({
                date,
                credits: log.credits_used,
                requests: 1
            });
        }
        return acc;
    }, [] as Array<{ date: string; credits: number; requests: number }>);

    const handleExport = () => {
        if (!usage) return;

        // Convert to CSV
        const headers = ['Date', 'Feature', 'Model', 'Tokens', 'Credits', 'Success'];
        const rows = usage.map(log => [
            new Date(log.created_at).toLocaleString(),
            log.feature_type,
            log.model_name,
            log.total_tokens,
            log.credits_used,
            log.success ? 'Yes' : 'No'
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-usage-${dateRange}days.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">AI Usage Analytics</h2>
                <div className="flex items-center gap-3">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleExport} disabled={!usage}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="p-6">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-8 w-16 mb-1" />
                            <Skeleton className="h-3 w-32" />
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatsCard
                        label="Total Credits Used"
                        value={stats?.total_credits_used.toFixed(2) || '0'}
                        icon={Zap}
                        color="text-purple-600"
                    />
                    <StatsCard
                        label="Total Tokens"
                        value={stats?.total_tokens.toLocaleString() || '0'}
                        icon={Hash}
                        color="text-blue-600"
                    />
                    <StatsCard
                        label="AI Requests"
                        value={stats?.total_requests.toLocaleString() || '0'}
                        icon={Activity}
                        color="text-green-600"
                    />
                    <StatsCard
                        label="Avg per Request"
                        value={stats?.avg_credits_per_request.toFixed(3) || '0'}
                        icon={TrendingUp}
                        color="text-orange-600"
                        suffix=" credits"
                    />
                </div>
            )}

            {/* Usage Over Time Chart */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Usage Over Time</h3>
                {isLoading ? (
                    <Skeleton className="h-[300px] w-full" />
                ) : dailyUsage && dailyUsage.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dailyUsage}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="credits"
                                stroke="#8b5cf6"
                                name="Credits Used"
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="requests"
                                stroke="#3b82f6"
                                name="Requests"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No usage data available for this period
                    </div>
                )}
            </Card>

            {/* Usage by Feature */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Credits by Feature</h3>
                    {isLoading ? (
                        <Skeleton className="h-[300px] w-full" />
                    ) : stats?.by_feature && stats.by_feature.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.by_feature}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="feature_type" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="credits" fill="#8b5cf6" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                            No feature usage data
                        </div>
                    )}
                </Card>

                {/* Pie Chart */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Request Distribution</h3>
                    {isLoading ? (
                        <Skeleton className="h-[300px] w-full" />
                    ) : stats?.by_feature && stats.by_feature.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats.by_feature}
                                    dataKey="count"
                                    nameKey="feature_type"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {stats.by_feature.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                            No request data
                        </div>
                    )}
                </Card>
            </div>

            {/* Detailed Usage Table */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Usage by Feature Type</h3>
                {isLoading ? (
                    <Skeleton className="h-[200px] w-full" />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Feature</TableHead>
                                <TableHead className="text-right">Requests</TableHead>
                                <TableHead className="text-right">Credits Used</TableHead>
                                <TableHead className="text-right">Avg Tokens</TableHead>
                                <TableHead className="text-right">Avg Credits</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats?.by_feature && stats.by_feature.length > 0 ? (
                                stats.by_feature.map((feature) => (
                                    <TableRow key={feature.feature_type}>
                                        <TableCell className="font-medium">
                                            {feature.feature_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </TableCell>
                                        <TableCell className="text-right">{feature.count}</TableCell>
                                        <TableCell className="text-right">{feature.credits.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            {Math.round(feature.avg_tokens).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {(feature.credits / feature.count).toFixed(3)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No usage data available
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}

interface StatsCardProps {
    label: string;
    value: string;
    icon: React.ElementType;
    color?: string;
    suffix?: string;
}

function StatsCard({ label, value, icon: Icon, color = 'text-primary', suffix = '' }: StatsCardProps) {
    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{label}</p>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-3xl font-bold">
                {value}
                {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
            </p>
        </Card>
    );
}
