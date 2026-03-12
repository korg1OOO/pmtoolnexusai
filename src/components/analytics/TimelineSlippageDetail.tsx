import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { AnalyticsBreadcrumb } from './AnalyticsBreadcrumb';
import {
    ArrowLeft,
    Calendar,
    AlertTriangle,
    Clock,
    TrendingUp,
    Filter,
    CheckCircle2,
} from 'lucide-react';
import type { TimelineSlippage, SlippedMilestone, RootCause } from '@/types/analytics';

interface TimelineSlippageDetailProps {
    workspaceId?: string;
    projectId?: string;
}

export function TimelineSlippageDetail({
    workspaceId,
    projectId,
}: TimelineSlippageDetailProps) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [slippageData, setSlippageData] = useState<TimelineSlippage | null>(null);
    const [severityFilter, setSeverityFilter] = useState<string>(searchParams.get('severity') || 'all');
    const [rootCauseFilter, setRootCauseFilter] = useState<string>(searchParams.get('rootCause') || 'all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTimelineSlippage();
    }, [projectId]);

    const loadTimelineSlippage = async () => {
        setLoading(true);
        try {
            // Fetch the project
            const { data: project } = await supabase
                .from('projects')
                .select('id, name, start_date, end_date, status, health, progress, budget, spent')
                .eq('id', projectId || '')
                .single();

            if (!project) {
                // Fallback: fetch first project
                const { data: firstProject } = await supabase
                    .from('projects')
                    .select('id, name, start_date, end_date, status, health, progress, budget, spent')
                    .limit(1)
                    .single();
                if (!firstProject) { setLoading(false); return; }
                Object.assign(project || {}, firstProject);
            }

            const pid = project?.id || projectId;

            // Fetch task baselines for slippage comparison
            const { data: tasks } = await supabase
                .from('tasks')
                .select('id, name, start_date, end_date, is_critical, status, baseline_start, baseline_end')
                .eq('project_id', pid!);

            // Fetch milestones
            const { data: milestones } = await supabase
                .from('timeline_milestones')
                .select('*')
                .eq('project_id', pid!);

            // Fetch task baselines
            const taskIds = (tasks || []).map(t => t.id);
            const { data: taskBaselines } = taskIds.length > 0
                ? await supabase
                    .from('task_baselines')
                    .select('*')
                    .in('task_id', taskIds)
                : { data: [] };

            // Calculate slippage from tasks with baselines
            const baselineStart = project?.start_date ? new Date(project.start_date) : new Date();
            const baselineEnd = project?.end_date ? new Date(project.end_date) : new Date();
            
            // Find actual current dates from tasks
            const taskDates = (tasks || []).filter(t => t.end_date).map(t => new Date(t.end_date!));
            const currentEnd = taskDates.length > 0 
                ? new Date(Math.max(...taskDates.map(d => d.getTime())))
                : baselineEnd;
            const currentStart = baselineStart;

            const slippageDays = Math.max(0, Math.round((currentEnd.getTime() - baselineEnd.getTime()) / (1000 * 60 * 60 * 24)));
            const hasCritical = (tasks || []).some(t => t.is_critical);

            // Build impacted milestones from task baselines
            const impactedMilestones: SlippedMilestone[] = (taskBaselines || [])
                .map(tb => {
                    const task = (tasks || []).find(t => t.id === tb.task_id);
                    if (!task || !task.end_date) return null;
                    const bEnd = new Date(tb.baseline_end);
                    const cEnd = new Date(task.end_date);
                    const slip = Math.round((cEnd.getTime() - bEnd.getTime()) / (1000 * 60 * 60 * 24));
                    if (slip <= 0) return null;
                    return {
                        id: tb.id,
                        name: task.name,
                        baselineDate: bEnd,
                        currentDate: cEnd,
                        slippageDays: slip,
                        impact: slip >= 45 ? 'high' as const : slip >= 20 ? 'medium' as const : 'low' as const,
                        dependencies: [],
                    };
                })
                .filter(Boolean) as SlippedMilestone[];

            // Also add timeline_milestones as indicators
            (milestones || []).forEach(m => {
                impactedMilestones.push({
                    id: m.id,
                    name: m.label,
                    baselineDate: new Date(m.created_at),
                    currentDate: new Date(m.created_at),
                    slippageDays: 0,
                    impact: 'low',
                    dependencies: [],
                });
            });

            // Determine root causes from change requests
            const { data: changeRequests } = await supabase
                .from('change_requests')
                .select('type, title, status')
                .eq('project_id', pid!);

            const rootCauses: RootCause[] = [];
            const crTypes: Record<string, number> = {};
            (changeRequests || []).forEach(cr => {
                const cat = cr.type || 'other';
                crTypes[cat] = (crTypes[cat] || 0) + 1;
            });
            Object.entries(crTypes).forEach(([cat, count]) => {
                const category = cat === 'scope' ? 'scope-change' : cat === 'resource' ? 'resource' : cat === 'technical' ? 'technical' : 'other';
                rootCauses.push({
                    category: category as RootCause['category'],
                    description: `${count} ${cat} change request(s)`,
                    impact: Math.round(slippageDays * (count / Math.max(1, (changeRequests || []).length))),
                });
            });
            if (rootCauses.length === 0) {
                rootCauses.push({ category: 'other', description: 'No change requests logged', impact: slippageDays });
            }

            const status: TimelineSlippage['status'] = slippageDays >= 45 ? 'severe' : slippageDays >= 20 ? 'moderate' : 'minor';

            const data: TimelineSlippage = {
                projectId: pid!,
                projectName: project?.name || 'Project',
                baselineStart,
                baselineEnd,
                currentStart,
                currentEnd,
                slippageDays,
                criticalPath: hasCritical,
                status,
                impactedMilestones: impactedMilestones.filter(m => m.slippageDays > 0),
                rootCauses,
            };
            setSlippageData(data);
        } catch (error) {
            console.error('Failed to load timeline slippage:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const config = {
            minor: { label: 'Minor Slippage', variant: 'secondary' as const, color: 'text-yellow-600' },
            moderate: { label: 'Moderate Slippage', variant: 'default' as const, color: 'text-orange-600' },
            severe: { label: 'Severe Slippage', variant: 'destructive' as const, color: 'text-red-600' },
        };
        return config[status as keyof typeof config] || config.minor;
    };

    const getImpactBadge = (impact: string) => {
        const config = {
            low: { variant: 'secondary' as const, label: 'Low' },
            medium: { variant: 'default' as const, label: 'Medium' },
            high: { variant: 'destructive' as const, label: 'High' },
        };
        return config[impact as keyof typeof config] || config.low;
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(date);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">Loading timeline slippage data...</div>
            </div>
        );
    }

    if (!slippageData) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">No timeline data available</div>
            </div>
        );
    }

    const statusConfig = getStatusBadge(slippageData.status);
    const COLORS = ['#ff7c7c', '#ffa07a', '#ffb347', '#82ca9d'];

    const handleFilterChange = (type: 'severity' | 'rootCause', value: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (value === 'all') {
            newParams.delete(type);
        } else {
            newParams.set(type, value);
        }
        setSearchParams(newParams);

        if (type === 'severity') setSeverityFilter(value);
        if (type === 'rootCause') setRootCauseFilter(value);
    };

    // Filter milestones based on severity
    const filteredMilestones = slippageData.impactedMilestones.filter((milestone) => {
        if (severityFilter !== 'all') {
            const severity = milestone.slippageDays >= 45 ? 'severe' : milestone.slippageDays >= 20 ? 'moderate' : 'minor';
            if (severity !== severityFilter) return false;
        }
        return true;
    });

    // Filter root causes
    const filteredRootCauses = slippageData.rootCauses.filter((cause) => {
        if (rootCauseFilter !== 'all' && cause.category !== rootCauseFilter) return false;
        return true;
    });

    // Prepare root cause chart data
    const rootCauseChartData = filteredRootCauses.map((cause) => ({
        name: cause.category.replace('-', ' ').toUpperCase(),
        value: cause.impact,
    }));

    return (
        <div className="space-y-6">
            {/* Breadcrumb Navigation */}
            <AnalyticsBreadcrumb
                items={[
                    { label: 'Analytics', path: `/workspace/${workspaceId}/analytics` },
                    { label: 'Timeline Slippage' },
                ]}
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold">Timeline Slippage Analysis</h1>
                    <p className="text-muted-foreground">{slippageData.projectName}</p>
                </div>
                <Badge variant={statusConfig.variant} className="h-8 px-4">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {statusConfig.label}
                </Badge>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex items-center gap-4">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Severity</label>
                            <Select value={severityFilter} onValueChange={(value) => handleFilterChange('severity', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All severities" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Severities</SelectItem>
                                    <SelectItem value="minor">Minor (&lt;20 days)</SelectItem>
                                    <SelectItem value="moderate">Moderate (20-44 days)</SelectItem>
                                    <SelectItem value="severe">Severe (45+ days)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Root Cause</label>
                            <Select value={rootCauseFilter} onValueChange={(value) => handleFilterChange('rootCause', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All causes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Causes</SelectItem>
                                    {slippageData.rootCauses.map((cause, idx) => (
                                        <SelectItem key={idx} value={cause.category}>
                                            {cause.category.replace('-', ' ').toUpperCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Baseline End</p>
                            <p className="text-lg font-bold">{formatDate(slippageData.baselineEnd)}</p>
                        </div>
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Current End</p>
                            <p className="text-lg font-bold">{formatDate(slippageData.currentEnd)}</p>
                        </div>
                        <Calendar className="h-8 w-8 text-orange-600" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Slippage</p>
                            <p className="text-2xl font-bold text-red-600">{slippageData.slippageDays} days</p>
                        </div>
                        <Clock className="h-8 w-8 text-red-600" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Critical Path</p>
                            <p className="text-lg font-bold">
                                {slippageData.criticalPath ? 'Yes' : 'No'}
                            </p>
                        </div>
                        {slippageData.criticalPath ? (
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        ) : (
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        )}
                    </div>
                </Card>
            </div>

            {/* Root Cause Analysis */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Root Cause Distribution</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={rootCauseChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {rootCauseChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>

                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Root Causes</h2>
                    <div className="space-y-3">
                        {filteredRootCauses.map((cause, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex-1">
                                    <p className="font-medium capitalize">{cause.category.replace('-', ' ')}</p>
                                    <p className="text-sm text-muted-foreground">{cause.description}</p>
                                </div>
                                <Badge variant="outline">{cause.impact} days</Badge>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Impacted Milestones */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Impacted Milestones</h2>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Milestone</TableHead>
                            <TableHead>Baseline Date</TableHead>
                            <TableHead>Current Date</TableHead>
                            <TableHead className="text-right">Slippage</TableHead>
                            <TableHead className="text-right">Impact</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMilestones.map((milestone) => {
                            const impactConfig = getImpactBadge(milestone.impact);
                            return (
                                <TableRow key={milestone.id}>
                                    <TableCell className="font-medium">{milestone.name}</TableCell>
                                    <TableCell>{formatDate(milestone.baselineDate)}</TableCell>
                                    <TableCell>{formatDate(milestone.currentDate)}</TableCell>
                                    <TableCell className="text-right text-red-600 font-semibold">
                                        +{milestone.slippageDays} days
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={impactConfig.variant}>{impactConfig.label}</Badge>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Card>

            {/* Recovery Plan */}
            {slippageData.recoveryPlan && (
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Recovery Plan</h2>
                        <Badge variant="default">{slippageData.recoveryPlan.status}</Badge>
                    </div>
                    <p className="text-muted-foreground mb-4">{slippageData.recoveryPlan.description}</p>
                    <div className="space-y-3">
                        {slippageData.recoveryPlan.actions.map((action) => (
                            <div key={action.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex-1">
                                    <p className="font-medium">{action.description}</p>
                                    <p className="text-sm text-muted-foreground">Assigned to: {action.assignedTo}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant="outline">-{action.daysToRecover} days</Badge>
                                    <Badge
                                        variant={
                                            action.status === 'completed'
                                                ? 'default'
                                                : action.status === 'in-progress'
                                                    ? 'secondary'
                                                    : 'outline'
                                        }
                                    >
                                        {action.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Target Recovery Date:</span>
                            <span className="text-lg font-bold">{formatDate(slippageData.recoveryPlan.targetDate)}</span>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
