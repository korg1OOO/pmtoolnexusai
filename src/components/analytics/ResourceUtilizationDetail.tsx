/**
 * Resource Utilization Detail View
 * Detailed drill-down view for resource utilization by role
 */

import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Users, Download, BarChart3 } from 'lucide-react';
import { DrillDownLayout } from './DrillDownLayout';
import { supabase } from '@/integrations/supabase/client';

export function ResourceUtilizationDetail() {
    const { workspaceId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const role = searchParams.get('role');

    const { data: resources = [], isLoading } = useQuery({
        queryKey: ['resource-utilization-detail', workspaceId, role],
        queryFn: async () => {
            let query = (supabase as any)
                .from('workspace_teams')
                .select('id, user_id, role, allocation_percentage, joined_at')
                .eq('workspace_id', workspaceId);

            if (role) {
                query = query.eq('role', role);
            }

            const { data, error } = await query.order('allocation_percentage', { ascending: false });
            if (error) throw error;

            // Get user details
            const resourcesWithUsers = await Promise.all(
                (data || []).map(async (resource: any) => {
                    const { data: profile } = await (supabase as any)
                        .from('profiles')
                        .select('full_name, email')
                        .eq('id', resource.user_id)
                        .single();

                    return {
                        ...resource,
                        user_name: profile?.full_name || 'Unknown',
                        user_email: profile?.email || 'unknown@example.com',
                    };
                })
            );

            return resourcesWithUsers;
        },
        enabled: !!workspaceId,
    });

    const breadcrumbs = [
        { label: 'Workspace Analytics', path: `/workspace/${workspaceId}/analytics`, icon: BarChart3 },
        { label: 'Resource Utilization', path: `/workspace/${workspaceId}/analytics/resources` },
        ...(role ? [{ label: role.toUpperCase() }] : []),
    ];

    const exportCSV = () => {
        const headers = ['Name', 'Email', 'Role', 'Allocation %', 'Joined Date'];
        const rows = resources.map((r: any) => [
            r.user_name,
            r.user_email,
            r.role,
            r.allocation_percentage,
            new Date(r.joined_at).toLocaleDateString(),
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resource-utilization-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getUtilizationColor = (utilization: number) => {
        if (utilization >= 90) return 'text-red-600';
        if (utilization >= 70) return 'text-orange-600';
        return 'text-green-600';
    };

    return (
        <DrillDownLayout
            title="Resource Utilization Details"
            description={`Team member allocation${role ? ` for ${role} role` : ' across all roles'}`}
            breadcrumbs={breadcrumbs}
            actions={
                <Button variant="outline" onClick={exportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </Button>
            }
        >
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Team Members ({resources.length})</CardTitle>
                        <div className="text-sm text-muted-foreground">
                            Avg Utilization: {resources.length > 0 ? (resources.reduce((sum: number, r: any) => sum + (r.allocation_percentage || 0), 0) / resources.length).toFixed(1) : 0}%
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-center py-8 text-muted-foreground">Loading resources...</p>
                    ) : resources.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No team members found</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Allocation</TableHead>
                                    <TableHead>Utilization</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {resources.map((resource: any) => (
                                    <TableRow key={resource.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                {resource.user_name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{resource.user_email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{resource.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className={getUtilizationColor(resource.allocation_percentage || 0)}>
                                                        {resource.allocation_percentage || 0}%
                                                    </span>
                                                </div>
                                                <Progress value={resource.allocation_percentage || 0} className="h-2" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    (resource.allocation_percentage || 0) >= 90
                                                        ? 'destructive'
                                                        : (resource.allocation_percentage || 0) >= 70
                                                            ? 'default'
                                                            : 'secondary'
                                                }
                                            >
                                                {(resource.allocation_percentage || 0) >= 90
                                                    ? 'Overallocated'
                                                    : (resource.allocation_percentage || 0) >= 70
                                                        ? 'High'
                                                        : 'Normal'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(resource.joined_at).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </DrillDownLayout>
    );
}
