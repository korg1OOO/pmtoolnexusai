import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, FileText, Calendar, CheckSquare, TrendingUp, Activity, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    getSpaceAnalytics, getMemberEngagement, getCrossProjectMetrics, getActivityTimeline, getTopSpaces
} from '@/services/collaborationAnalyticsService';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CollaborationMetricsViewProps {
    programId: string;
}

export function CollaborationMetricsView({ programId }: CollaborationMetricsViewProps) {
    const [dateRange, setDateRange] = useState('30');
    const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: spaces = [] } = useQuery({
        queryKey: ['collaboration-spaces', programId],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('collaboration_spaces')
                .select('id, name')
                .eq('program_id', programId);
            if (error) throw error;
            return (data || []) as Array<{ id: string; name: string }>;
        }
    });

    React.useEffect(() => {
        if (spaces.length > 0 && !selectedSpaceId) {
            setSelectedSpaceId(spaces[0].id);
        }
    }, [spaces, selectedSpaceId]);

    const { data: spaceMetrics, isLoading: metricsLoading } = useQuery({
        queryKey: ['space-analytics', selectedSpaceId, startDate, endDate],
        queryFn: () => getSpaceAnalytics(selectedSpaceId, startDate, endDate),
        enabled: !!selectedSpaceId
    });

    const { data: memberEngagement = [] } = useQuery({
        queryKey: ['member-engagement', selectedSpaceId, startDate, endDate],
        queryFn: () => getMemberEngagement(selectedSpaceId, startDate, endDate),
        enabled: !!selectedSpaceId
    });

    const { data: timeline = [] } = useQuery({
        queryKey: ['activity-timeline', selectedSpaceId, startDate, endDate],
        queryFn: () => getActivityTimeline(selectedSpaceId, startDate, endDate),
        enabled: !!selectedSpaceId
    });

    const { data: topSpaces = [] } = useQuery({
        queryKey: ['top-spaces', programId, startDate, endDate],
        queryFn: () => getTopSpaces(programId, startDate, endDate, 10)
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Collaboration Metrics</h2>
                    <p className="text-muted-foreground">Track collaboration space activity and engagement</p>
                </div>
                <div className="flex gap-2">
                    <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
                        <SelectTrigger className="w-64"><SelectValue placeholder="Select space" /></SelectTrigger>
                        <SelectContent>
                            {spaces.map(space => <SelectItem key={space.id} value={space.id}>{space.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {spaceMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <MetricCard icon={FileText} label="Documents" value={spaceMetrics.total_documents} color="blue" />
                    <MetricCard icon={Calendar} label="Meetings" value={spaceMetrics.total_meetings} color="green" />
                    <MetricCard icon={CheckSquare} label="Tasks" value={spaceMetrics.total_tasks} color="purple" />
                    <MetricCard icon={Users} label="Members" value={spaceMetrics.total_members} color="orange" />
                    <MetricCard icon={Activity} label="Active" value={spaceMetrics.active_members} color="cyan" />
                    <MetricCard icon={TrendingUp} label="Engagement" value={`${spaceMetrics.engagement_score.toFixed(0)}%`} color="pink" />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
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
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Top Performing Spaces</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={topSpaces.slice(0, 5)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="space_name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="engagement_score" fill="#8b5cf6" name="Engagement Score" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </div>
    );
}

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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}><Icon className="w-4 h-4" /></div>
                <p className="text-sm text-muted-foreground">{label}</p>
            </div>
            <p className="text-2xl font-bold">{value}</p>
        </motion.div>
    );
}