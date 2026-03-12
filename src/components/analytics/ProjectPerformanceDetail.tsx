/**
 * Project Performance Detail View
 * Detailed drill-down view for project performance metrics
 */

import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download, BarChart3 } from 'lucide-react';
import { DrillDownLayout } from './DrillDownLayout';
import { GovernanceArtifactPanel } from './GovernanceArtifactPanel';
import { supabase } from '@/integrations/supabase/client';

export function ProjectPerformanceDetail() {
    const { workspaceId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const month = searchParams.get('month');
    const status = searchParams.get('status');

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(status || 'all');
    const [selectedProject, setSelectedProject] = useState<string | null>(null);

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['project-performance-detail', workspaceId, month, statusFilter],
        queryFn: async () => {
            let query = (supabase as any)
                .from('projects')
                .select('id, name, status, progress, budget, actual_cost, start_date, end_date, portfolio_id')
                .eq('workspace_id', workspaceId);

            // Apply status filter
            if (statusFilter === 'on-track') {
                query = query.eq('status', 'active').gte('progress', 50);
            } else if (statusFilter === 'at-risk') {
                query = query.eq('status', 'active').gte('progress', 20).lt('progress', 50);
            } else if (statusFilter === 'delayed') {
                query = query.eq('status', 'active').lt('progress', 20);
            }

            // Apply month filter if provided
            if (month) {
                const [year, monthNum] = month.split('-');
                const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
                const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
                query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
            }

            const { data, error } = await query.order('name');
            if (error) throw error;
            return data || [];
        },
        enabled: !!workspaceId,
    });

    const filteredProjects = projects.filter((p: any) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (project: any) => {
        if (project.progress >= 50) {
            return <Badge variant="default" className="bg-green-500">On Track</Badge>;
        } else if (project.progress >= 20) {
            return <Badge variant="default" className="bg-orange-500">At Risk</Badge>;
        } else {
            return <Badge variant="destructive">Delayed</Badge>;
        }
    };

    const breadcrumbs = [
        { label: 'Workspace Analytics', path: `/workspace/${workspaceId}/analytics`, icon: BarChart3 },
        { label: 'Project Performance', path: `/workspace/${workspaceId}/analytics/performance` },
        ...(status ? [{ label: status.replace('-', ' ').toUpperCase() }] : []),
    ];

    const exportCSV = () => {
        const headers = ['Project Name', 'Status', 'Progress', 'Budget', 'Actual Cost', 'Variance'];
        const rows = filteredProjects.map((p: any) => [
            p.name,
            p.status,
            `${p.progress}%`,
            p.budget || 0,
            p.actual_cost || 0,
            ((p.actual_cost || 0) - (p.budget || 0)),
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `project-performance-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <DrillDownLayout
            title="Project Performance Details"
            description={`Detailed view of ${statusFilter === 'all' ? 'all' : statusFilter} projects${month ? ` from ${month}` : ''}`}
            breadcrumbs={breadcrumbs}
            actions={
                <Button variant="outline" onClick={exportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </Button>
            }
            governancePanel={
                selectedProject ? (
                    <GovernanceArtifactPanel entityId={selectedProject} entityType="project" />
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Governance Artifacts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Select a project to view related governance documents</p>
                        </CardContent>
                    </Card>
                )
            }
        >
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                        <CardTitle>Projects ({filteredProjects.length})</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-64"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="on-track">On Track</SelectItem>
                                    <SelectItem value="at-risk">At Risk</SelectItem>
                                    <SelectItem value="delayed">Delayed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-center py-8 text-muted-foreground">Loading projects...</p>
                    ) : filteredProjects.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No projects found</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Project Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Progress</TableHead>
                                    <TableHead className="text-right">Budget</TableHead>
                                    <TableHead className="text-right">Actual Cost</TableHead>
                                    <TableHead className="text-right">Variance</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProjects.map((project: any) => {
                                    const variance = (project.actual_cost || 0) - (project.budget || 0);
                                    return (
                                        <TableRow
                                            key={project.id}
                                            className={selectedProject === project.id ? 'bg-accent' : ''}
                                        >
                                            <TableCell className="font-medium">{project.name}</TableCell>
                                            <TableCell>{getStatusBadge(project)}</TableCell>
                                            <TableCell className="text-right">{project.progress}%</TableCell>
                                            <TableCell className="text-right">${(project.budget || 0).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">${(project.actual_cost || 0).toLocaleString()}</TableCell>
                                            <TableCell className={`text-right ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                ${Math.abs(variance).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedProject(project.id)}
                                                    >
                                                        View Governance
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/project/${project.id}`)}
                                                    >
                                                        Details
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </DrillDownLayout>
    );
}
