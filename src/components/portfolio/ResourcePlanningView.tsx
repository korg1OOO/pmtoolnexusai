import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, AlertCircle, TrendingUp, Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { supabase as _supabase } from '@/integrations/supabase/client';

const supabase = _supabase as any;

interface ProgramDemand {
    program_id: string;
    program_name: string;
    required: number;
    allocated: number;
    gap: number;
}

async function fetchPortfolioResources(portfolioId: string) {
    // 1. Programs in portfolio
    const { data: programs = [] } = await supabase
        .from('programs')
        .select('id, name')
        .eq('portfolio_id', portfolioId)
        .eq('is_active', true);

    const programIds = programs.map((p: any) => p.id);

    // 2. For each program, sum up resource max_units from their projects
    let total_capacity = 0;
    let total_allocated = 0;
    const demands: ProgramDemand[] = [];
    const conflicts: any[] = [];

    for (const program of programs) {
        const { data: projects = [] } = await supabase
            .from('projects')
            .select('id')
            .eq('program_id', program.id);

        const projectIds = projects.map((p: any) => p.id);

        let programCapacity = 0;
        let programAllocated = 0;

        if (projectIds.length > 0) {
            const { data: resources = [] } = await supabase
                .from('resources')
                .select('id, max_units')
                .in('project_id', projectIds);

            programCapacity = resources.reduce((s: number, r: any) => s + (r.max_units || 100), 0);

            // Also sum team_members allocation
            const { data: members = [] } = await supabase
                .from('team_members')
                .select('allocation_percentage')
                .in('project_id', projectIds);

            programAllocated = members.reduce((s: number, m: any) => s + (m.allocation_percentage || 0), 0);
        }

        total_capacity += programCapacity;
        total_allocated += programAllocated;

        const required = programCapacity || 150; // fallback planning target
        const gap = Math.max(0, required - programAllocated);

        demands.push({
            program_id: program.id,
            program_name: program.name,
            required,
            allocated: programAllocated,
            gap,
        });
    }

    const available = total_capacity - total_allocated;

    return { total_capacity, total_allocated, total_demand: demands.reduce((s, d) => s + d.required, 0), available, demands, conflicts };
}

export function ResourcePlanningView() {
    const { portfolioId } = useParams();

    const { data: resourceData, isLoading, refetch } = useQuery({
        queryKey: ['portfolio-resources-live', portfolioId],
        queryFn: () => fetchPortfolioResources(portfolioId!),
        enabled: !!portfolioId,
    });

    const utilizationRate = resourceData && resourceData.total_capacity > 0
        ? (resourceData.total_allocated / resourceData.total_capacity) * 100
        : 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Resource Planning</h1>
                    <p className="text-muted-foreground">Cross-program resource allocation and optimization</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                    <Button size="sm">What-If Scenario</Button>
                </div>
            </div>

            {/* Capacity Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Capacity</p>
                            <p className="text-2xl font-bold">{resourceData?.total_capacity ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">unit-hours across all programs</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Allocated</p>
                            <p className="text-2xl font-bold">{resourceData?.total_allocated ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">{utilizationRate.toFixed(0)}% utilized</p>
                            <Progress value={Math.min(100, utilizationRate)} className="mt-2 h-1" />
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-8 h-8 text-orange-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Available</p>
                            <p className="text-2xl font-bold">{resourceData?.available ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">unit-hours free</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Demand vs Capacity Chart */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Demand vs Capacity by Program</h2>
                {resourceData?.demands && resourceData.demands.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={resourceData.demands}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="program_name" tick={{ fontSize: 11 }} />
                            <YAxis label={{ value: 'Units', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="required" fill="#3b82f6" name="Required" />
                            <Bar dataKey="allocated" fill="#10b981" name="Allocated" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-center text-muted-foreground py-8">No programs found in this portfolio</p>
                )}
            </Card>

            {/* Resource Gaps */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Resource Gaps by Program</h2>
                <div className="space-y-3">
                    {resourceData?.demands && resourceData.demands.filter((d) => d.gap > 0).length > 0 ? (
                        resourceData.demands.filter((d) => d.gap > 0).map((demand) => (
                            <div
                                key={demand.program_id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div>
                                    <h4 className="font-medium">{demand.program_name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {demand.allocated} allocated / {demand.required} required
                                    </p>
                                </div>
                                <Badge variant="destructive">Gap: {demand.gap} units</Badge>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500 opacity-70" />
                            <p>No resource gaps detected</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Resource Conflicts */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Resource Conflicts</h2>
                <div className="space-y-3">
                    {resourceData?.conflicts && resourceData.conflicts.length > 0 ? (
                        resourceData.conflicts.map((conflict: any) => (
                            <div
                                key={conflict.id}
                                className="flex items-start gap-3 p-3 border rounded-lg border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20"
                            >
                                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-medium">{conflict.resource_name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Over-allocated across: {conflict.programs?.join(', ')}
                                    </p>
                                    <p className="text-sm text-orange-700 mt-1">
                                        Total allocation: {conflict.total_allocation}%
                                    </p>
                                </div>
                                <Button variant="outline" size="sm">Resolve</Button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500 opacity-70" />
                            <p>No cross-program conflicts detected</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
