import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Calendar,
    Users,
    CheckCircle,
    TrendingUp,
    BarChart3,
    Clock
} from 'lucide-react';
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
    getMeetingStats,
    getMeetingTrends,
    getMeetingTypeDistribution,
    getActionItemCompletionRate,
    getRSVPAnalytics
} from '@/services/meetingAnalyticsService';
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

interface MeetingAnalyticsDashboardProps {
    programId: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function MeetingAnalyticsDashboard({ programId }: MeetingAnalyticsDashboardProps) {
    const [dateRange, setDateRange] = useState('30'); // days

    // Calculate date range
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

    // Fetch data
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['meeting-stats', programId, startDate, endDate],
        queryFn: () => getMeetingStats(programId, startDate, endDate)
    });

    const { data: trends = [], isLoading: trendsLoading } = useQuery({
        queryKey: ['meeting-trends', programId, startDate, endDate],
        queryFn: () => getMeetingTrends(programId, startDate, endDate)
    });

    const { data: typeDistribution = [], isLoading: typeLoading } = useQuery({
        queryKey: ['meeting-type-distribution', programId, startDate, endDate],
        queryFn: () => getMeetingTypeDistribution(programId, startDate, endDate)
    });

    const { data: actionItems, isLoading: actionItemsLoading } = useQuery({
        queryKey: ['action-item-completion', programId, startDate, endDate],
        queryFn: () => getActionItemCompletionRate(programId, startDate, endDate)
    });

    const { data: rsvpStats, isLoading: rsvpLoading } = useQuery({
        queryKey: ['rsvp-analytics', programId, startDate, endDate],
        queryFn: () => getRSVPAnalytics(programId, startDate, endDate)
    });

    const isLoading = statsLoading || trendsLoading || typeLoading || actionItemsLoading || rsvpLoading;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Meeting Analytics</h2>
                    <p className="text-muted-foreground">
                        Track meeting effectiveness and engagement
                    </p>
                </div>
                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                        <SelectItem value="180">Last 6 months</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Metric Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        icon={Calendar}
                        label="Total Meetings"
                        value={stats.total_meetings}
                        color="blue"
                    />
                    <MetricCard
                        icon={Users}
                        label="Avg Attendance"
                        value={`${stats.avg_attendance_rate.toFixed(1)}%`}
                        color="green"
                    />
                    <MetricCard
                        icon={CheckCircle}
                        label="Action Items"
                        value={`${stats.completed_action_items}/${stats.total_action_items}`}
                        color="purple"
                    />
                    <MetricCard
                        icon={TrendingUp}
                        label="Effectiveness"
                        value={`${stats.avg_effectiveness_score.toFixed(1)}%`}
                        color="orange"
                    />
                </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Meeting Trends */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Meeting Frequency</h3>
                    {trendsLoading ? (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                            Loading...
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={trends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="meetings_count"
                                    stroke="#3b82f6"
                                    name="Meetings"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </Card>

                {/* Meeting Type Distribution */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Meeting Types</h3>
                    {typeLoading ? (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                            Loading...
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={typeDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => entry.type}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {typeDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </Card>

                {/* Attendance Trends */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Attendance Trends</h3>
                    {trendsLoading ? (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                            Loading...
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={trends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="avg_attendance"
                                    stroke="#10b981"
                                    name="Attendance %"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="avg_effectiveness"
                                    stroke="#f59e0b"
                                    name="Effectiveness %"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </Card>

                {/* Action Item Completion */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Action Items</h3>
                    {actionItemsLoading ? (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                            Loading...
                        </div>
                    ) : actionItems ? (
                        <div className="space-y-4">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={[
                                    { name: 'Completed', value: actionItems.completed },
                                    { name: 'Pending', value: actionItems.pending },
                                    { name: 'Overdue', value: actionItems.overdue }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8b5cf6" />
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">
                                    {actionItems.completion_rate.toFixed(1)}%
                                </p>
                                <p className="text-sm text-muted-foreground">Completion Rate</p>
                            </div>
                        </div>
                    ) : null}
                </Card>
            </div>

            {/* RSVP Stats */}
            {rsvpStats && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">RSVP Analytics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{rsvpStats.total_invites}</p>
                            <p className="text-sm text-muted-foreground">Total Invites</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{rsvpStats.accepted}</p>
                            <p className="text-sm text-muted-foreground">Accepted</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{rsvpStats.declined}</p>
                            <p className="text-sm text-muted-foreground">Declined</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-600">{rsvpStats.tentative}</p>
                            <p className="text-sm text-muted-foreground">Tentative</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-600">{rsvpStats.no_response}</p>
                            <p className="text-sm text-muted-foreground">No Response</p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}

// Metric Card Component
interface MetricCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: 'blue' | 'green' | 'purple' | 'orange';
}

function MetricCard({ icon: Icon, label, value, color }: MetricCardProps) {
    const colorClasses = {
        blue: 'text-blue-500 bg-blue-100',
        green: 'text-green-500 bg-green-100',
        purple: 'text-purple-500 bg-purple-100',
        orange: 'text-orange-500 bg-orange-100'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border rounded-lg p-4"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </motion.div>
    );
}
