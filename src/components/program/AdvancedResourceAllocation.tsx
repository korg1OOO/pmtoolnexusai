import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Users, AlertTriangle, CheckCircle, TrendingUp, Loader2, RefreshCw,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useProgramResources } from '@/hooks/useProgramResources';

export function AdvancedResourceAllocation() {
    const { programId } = useParams();
    const { data, isLoading, refetch } = useProgramResources(programId);

    const available = (data?.total_capacity || 0) - (data?.total_allocated || 0);
    const utilizationRate = data && data.total_capacity > 0
        ? (data.total_allocated / data.total_capacity) * 100
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
                    <h1 className="text-3xl font-bold">Advanced Resource Allocation</h1>
                    <p className="text-muted-foreground">Cross-project resource planning and conflict detection</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                    <Button size="sm">Optimize Allocation</Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Capacity</p>
                            <p className="text-2xl font-bold">{data?.total_capacity ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">unit-hours available</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Allocated</p>
                            <p className="text-2xl font-bold">{data?.total_allocated ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">{utilizationRate.toFixed(0)}% utilized</p>
                            <Progress value={Math.min(100, utilizationRate)} className="mt-2 h-1" />
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-purple-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Available</p>
                            <p className="text-2xl font-bold">{available}</p>
                            <p className="text-xs text-muted-foreground">unit-hours free</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-8 h-8 ${(data?.conflicts?.length || 0) > 0 ? 'text-orange-500' : 'text-green-600'}`} />
                        <div>
                            <p className="text-sm text-muted-foreground">Conflicts</p>
                            <p className={`text-2xl font-bold ${(data?.conflicts?.length || 0) > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                                {data?.conflicts?.length ?? 0}
                            </p>
                            <p className="text-xs text-muted-foreground">over-allocated resources</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Allocation Matrix Chart */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Project Allocation Matrix</h2>
                {data?.projects && data.projects.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.projects}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="project_name" tick={{ fontSize: 11 }} />
                            <YAxis label={{ value: 'Units', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="required" fill="#3b82f6" name="Required" />
                            <Bar dataKey="allocated" fill="#10b981" name="Allocated" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-muted-foreground text-center py-8">
                        No projects found in this program
                    </p>
                )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Resource Conflicts */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        Resource Conflicts
                        {(data?.conflicts?.length || 0) > 0 && (
                            <Badge variant="destructive">{data!.conflicts.length}</Badge>
                        )}
                    </h2>
                    <div className="space-y-3">
                        {data?.conflicts && data.conflicts.length > 0 ? (
                            data.conflicts.map((conflict) => (
                                <div
                                    key={conflict.resource_id}
                                    className="border rounded-lg p-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="font-medium">{conflict.resource_name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Assigned to: {conflict.projects.join(', ')}
                                            </p>
                                        </div>
                                        <Badge variant="destructive">{conflict.total_allocation}%</Badge>
                                    </div>
                                    <Progress value={Math.min(100, conflict.total_allocation)} className="h-1.5 [&>div]:bg-orange-500" />
                                    <div className="flex gap-2 mt-3">
                                        <Button variant="outline" size="sm">Resolve</Button>
                                        <Button variant="outline" size="sm">Reassign</Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500 opacity-70" />
                                <p>No resource conflicts detected</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Skill Gaps */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Skill Gaps</h2>
                    {data?.skillGaps && data.skillGaps.length > 0 ? (
                        <div className="space-y-4">
                            {data.skillGaps.map((skill, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">{skill.skill}</span>
                                        <span className={skill.gap > 0 ? 'text-red-600' : 'text-green-600'}>
                                            {skill.gap > 0 ? `Gap: ${skill.gap}` : 'Sufficient'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                        <span>Required: {skill.required}</span>
                                        <span>•</span>
                                        <span>Available: {skill.available}</span>
                                    </div>
                                    <Progress value={(skill.available / skill.required) * 100} className="h-2" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">Skill gap analysis requires skills data on resources</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Project Allocation Details */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Project Allocation Details</h2>
                {data?.projects && data.projects.length > 0 ? (
                    <div className="space-y-4">
                        {data.projects.map((project) => {
                            const gap = project.required - project.allocated;
                            const allocationPct = project.required > 0
                                ? Math.min(100, (project.allocated / project.required) * 100)
                                : 0;
                            return (
                                <div key={project.project_id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold">{project.project_name}</h3>
                                        {gap > 0 ? (
                                            <Badge variant="destructive">Gap: {gap} units</Badge>
                                        ) : (
                                            <Badge className="bg-green-100 text-green-700 border-green-200">Fully Allocated</Badge>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                                        <div><p className="text-muted-foreground text-xs">Required</p><p className="font-semibold">{project.required} units</p></div>
                                        <div><p className="text-muted-foreground text-xs">Allocated</p><p className="font-semibold">{project.allocated} units</p></div>
                                    </div>
                                    {project.skills_needed.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-sm text-muted-foreground mb-1">Skills Needed</p>
                                            <div className="flex flex-wrap gap-1">
                                                {project.skills_needed.map((skill, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-xs">{skill}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <Progress
                                        value={allocationPct}
                                        className={`h-2 ${gap > 0 ? '[&>div]:bg-orange-500' : '[&>div]:bg-green-500'}`}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">{allocationPct.toFixed(0)}% covered</p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">No project data available</p>
                )}
            </Card>
        </div>
    );
}
