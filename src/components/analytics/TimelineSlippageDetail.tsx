import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import type { TimelineSlippage, SlippedMilestone } from '@/types/analytics';

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
            // TODO: Replace with actual API call
            const mockData: TimelineSlippage = {
                projectId: projectId || 'proj-001',
                projectName: 'Digital Transformation Initiative',
                baselineStart: new Date('2024-01-01'),
                baselineEnd: new Date('2024-12-31'),
                currentStart: new Date('2024-01-15'),
                currentEnd: new Date('2025-02-28'),
                slippageDays: 59,
                criticalPath: true,
                status: 'severe',
                impactedMilestones: [
                    {
                        id: 'm1',
                        name: 'Requirements Complete',
                        baselineDate: new Date('2024-03-31'),
                        currentDate: new Date('2024-04-15'),
                        slippageDays: 15,
                        impact: 'medium',
                        dependencies: ['Phase 1 Kickoff'],
                    },
                    {
                        id: 'm2',
                        name: 'Design Approval',
                        baselineDate: new Date('2024-06-30'),
                        currentDate: new Date('2024-07-20'),
                        slippageDays: 20,
                        impact: 'high',
                        dependencies: ['Requirements Complete'],
                    },
                    {
                        id: 'm3',
                        name: 'Development Complete',
                        baselineDate: new Date('2024-10-31'),
                        currentDate: new Date('2024-12-15'),
                        slippageDays: 45,
                        impact: 'high',
                        dependencies: ['Design Approval'],
                    },
                    {
                        id: 'm4',
                        name: 'UAT Complete',
                        baselineDate: new Date('2024-11-30'),
                        currentDate: new Date('2025-01-31'),
                        slippageDays: 62,
                        impact: 'high',
                        dependencies: ['Development Complete'],
                    },
                ],
                rootCauses: [
                    {
                        category: 'resource',
                        description: 'Key developer unavailability',
                        impact: 25,
                    },
                    {
                        category: 'scope-change',
                        description: 'Additional features requested',
                        impact: 20,
                    },
                    {
                        category: 'technical',
                        description: 'Integration complexity underestimated',
                        impact: 14,
                    },
                ],
                recoveryPlan: {
                    id: 'rp-001',
                    description: 'Accelerated development with additional resources',
                    actions: [
                        {
                            id: 'a1',
                            description: 'Add 2 senior developers',
                            daysToRecover: 15,
                            status: 'in-progress',
                            assignedTo: 'Resource Manager',
                        },
                        {
                            id: 'a2',
                            description: 'Reduce scope for v1.0',
                            daysToRecover: 20,
                            status: 'pending',
                            assignedTo: 'Product Owner',
                        },
                        {
                            id: 'a3',
                            description: 'Parallel testing approach',
                            daysToRecover: 10,
                            status: 'completed',
                            assignedTo: 'QA Lead',
                        },
                    ],
                    targetDate: new Date('2025-01-31'),
                    status: 'in-progress',
                    owner: 'Project Manager',
                },
            };
            setSlippageData(mockData);
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
