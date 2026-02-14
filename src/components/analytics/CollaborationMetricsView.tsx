import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Users,
    FileText,
    Calendar,
    CheckSquare,
    TrendingUp,
    Activity,
    Award
} from 'lucide-react';
import { Card } from '@/components/ui/card';
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
import {
    getSpaceAnalytics,
    getMemberEngagement,
    getCrossProjectMetrics,
    getActivityTimeline,
    getTopSpaces
} from '@/services/collaborationAnalyticsService';
import { supabase } from '@/integrations/supabase/client';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface CollaborationMetricsViewProps {
    programId: string;
}

export function CollaborationMetricsView({ programId }: CollaborationMetricsViewProps) {
    const [dateRange, setDateRange] = useState('30');
    const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');

    // Calculate date range
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

    // Fetch collaboration spaces
    const { data: spaces = [] } = useQuery({
        queryKey: ['collaboration-spaces', programId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('collaboration_spaces')
                .select('id, name')
                .eq('program_id', programId);

            if (error) throw error;
            return data || [];
        }
    });

    // Set default space if not selected
    React.useEffect(() => {
        if (spaces.length > 0 && !selectedSpaceId) {
            setSelectedSpaceId(spaces[0].id);
        }
    }, [spaces, selectedSpaceId]);

    // Fetch analytics data
    const { data: spaceMetrics, isLoading: metricsLoading } = useQuery({
        queryKey: ['space-analytics', selectedSpaceId, startDate, endDate],
        queryFn: () => getSpaceAnalytics(selectedSpaceId, startDate, endDate),
        enabled: !!selectedSpaceId
    });

    const { data: memberEngagement = [], isLoading: engagementLoading } = useQuery({
        queryKey: ['member-engagement', selectedSpaceId, startDate, endDate],
        queryFn: () => getMemberEngagement(selectedSpaceId, startDate, endDate),
        enabled: !!selectedSpaceId
    });

    const { data: crossProject = [], isLoading: crossProjectLoading } = useQuery({
        queryKey: ['cross-project-metrics', programId, startDate, endDate],
        queryFn: () => getCrossProjectMetrics(programId, startDate, endDate)
    });

    const { data: timeline = [], isLoading: timelineLoading } = useQuery({
        queryKey: ['activity-timeline', selectedSpaceId, startDate, endDate],
        queryFn: () => getActivityTimeline(selectedSpaceId, startDate, endDate),
        enabled: !!selectedSpaceId
    });

    const { data: topSpaces = [], isLoading: topSpacesLoading } = useQuery({
        queryKey: ['top-spaces', programId, startDate, endDate],
        queryFn: () => getTopSpaces(programId, startDate, endDate, 10)
    });

    // Fetch user details for engagement
    const { data: userDetails = [] } = useQuery({
        queryKey: ['user-details-engagement', memberEngagement],
        queryFn: async () => {
            if (memberEngagement.length === 0) return [];

            const userIds = memberEngagement.map(e => e.user_id);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds);

            if (error) throw error;
            return data || [];
        },
        enabled: memberEngagement.length > 0
    });

    // Merge engagement with user details
    const engagementWithDetails = memberEngagement.map(engagement => {
        const user = userDetails.find(u => u.id === engagement.user_id);
        return {
            ...engagement,
            name: user?.full_name || 'Unknown User',
            email: user?.email || ''
        };
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Collaboration Metrics</h2>
                    <p className="text-muted-foreground">
                        Track collaboration space activity and engagement
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
                        <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select space" />
                        </SelectTrigger>
                        <SelectContent>
                            {spaces.map(space => (
                                <SelectItem key={space.id} value={space.id}>
                                    {space.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                </div>
            </div>

            {/* Metric Cards */}
            {spaceMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <MetricCard
                        icon={FileText}
                        label="Documents"
                        value={spaceMetrics.total_documents}
                        color="blue"
                    />
                    <MetricCard
                        icon={Calendar}
                        label="Meetings"
                        value={spaceMetrics.total_meetings}
                        color="green"
                    />
                    <MetricCard
                        icon={CheckSquare}
                        label="Tasks"
                        value={spaceMetrics.total_tasks}
                        color="purple"
                    />
                    <MetricCard
                        icon={Users}
                        label="Members"
                        value={spaceMetrics.total_members}
                        color="orange"
                    />
                    <MetricCard
                        icon={Activity}
                        label="Active"
                        value={spaceMetrics.active_members}
                        color="cyan"
                    />
                    <MetricCard
                        icon={TrendingUp}
                        label="Engagement"
                        value={`${spaceMetrics.engagement_score.toFixed(0)}%`}
                        color="pink"
                    />
                </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Timeline */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
                    {timelineLoading ? (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                            Loading...
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={timeline}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="documents" stroke="#3b82f6" name="Documents" />
                                <Line type="monotone" dataKey="meetings" stroke="#10b981" name="Meetings" />
                                <Line type="monotone" dataKey="tasks" stroke="#8b5cf6" name="Tasks" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </Card>

                {/* Top Spaces */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Top Performing Spaces</h3>
                    {topSpacesLoading ? (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                            Loading...
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={topSpaces.slice(0, 5)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="space_name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="engagement_score" fill="#8b5cf6" name="Engagement Score" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Card>
            </div>

            {/* Member Engagement Table */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Member Engagement</h3>
                {engagementLoading ? (
                    <div className="text-center py-12 text-muted-foreground">
                        Loading engagement data...
                    </div>
                ) : engagementWithDetails.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No engagement data available</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rank</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="text-right">Documents</TableHead>
                                <TableHead className="text-right">Meetings</TableHead>
                                <TableHead className="text-right">Tasks</TableHead>
                                <TableHead className="text-right">Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {engagementWithDetails.slice(0, 10).map((member, index) => (
                                <TableRow key={member.user_id}>
                                    <TableCell className="font-medium">
                                        {index === 0 && '🥇'}
                                        {index === 1 && '🥈'}
                                        {index === 2 && '🥉'}
                                        {index > 2 && index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell className="text-right">{member.documents_shared}</TableCell>
                                    <TableCell className="text-right">{member.meetings_attended}</TableCell>
                                    <TableCell className="text-right">{member.tasks_completed}</TableCell>
                                    <TableCell className="text-right">
                                        <span className="font-bold text-purple-600">
                                            {member.engagement_score}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* Cross-Project Collaboration */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Cross-Project Collaboration</h3>
                {crossProjectLoading ? (
                    <div className="text-center py-12 text-muted-foreground">
                        Loading cross-project data...
                    </div>
                ) : crossProject.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No cross-project collaboration data</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Project</TableHead>
                                <TableHead className="text-right">Collaborations</TableHead>
                                <TableHead className="text-right">Documents</TableHead>
                                <TableHead className="text-right">Meetings</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {crossProject.map((project) => (
                                <TableRow key={project.project_id}>
                                    <TableCell className="font-medium">{project.project_name}</TableCell>
                                    <TableCell className="text-right">{project.collaboration_count}</TableCell>
                                    <TableCell className="text-right">{project.shared_documents}</TableCell>
                                    <TableCell className="text-right">{project.joint_meetings}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}

// Metric Card Component
interface MetricCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'pink';
}

function MetricCard({ icon: Icon, label, value, color }: MetricCardProps) {
    const colorClasses = {
        blue: 'text-blue-500 bg-blue-100',
        green: 'text-green-500 bg-green-100',
        purple: 'text-purple-500 bg-purple-100',
        orange: 'text-orange-500 bg-orange-100',
        cyan: 'text-cyan-500 bg-cyan-100',
        pink: 'text-pink-500 bg-pink-100'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border rounded-lg p-4"
        >
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <p className="text-sm text-muted-foreground">{label}</p>
            </div>
            <p className="text-2xl font-bold">{value}</p>
        </motion.div>
    );
}
