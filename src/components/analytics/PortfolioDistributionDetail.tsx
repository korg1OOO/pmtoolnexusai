/**
 * Portfolio Distribution Detail View
 * Detailed drill-down view for portfolio distribution metrics
 */

import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Briefcase, Download, BarChart3 } from 'lucide-react';
import { DrillDownLayout } from './DrillDownLayout';
import { GovernanceArtifactPanel } from './GovernanceArtifactPanel';
import { supabase } from '@/integrations/supabase/client';

export function PortfolioDistributionDetail() {
    const { workspaceId, portfolioId } = useParams();
    const navigate = useNavigate();
    const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(portfolioId || null);

    const { data: portfolios = [], isLoading } = useQuery({
        queryKey: ['portfolio-distribution-detail', workspaceId],
        queryFn: async () => {
            const { data: portfolios, error: portfoliosError } = await (supabase as any)
                .from('portfolios')
                .select('id, name, description, total_budget, status')
                .eq('workspace_id', workspaceId);

            if (portfoliosError) throw portfoliosError;

            // Get project counts for each portfolio
            const portfolioData = await Promise.all(
                (portfolios || []).map(async (portfolio: any) => {
                    const { count: projectCount } = await (supabase as any)
                        .from('projects')
                        .select('*', { count: 'exact', head: true })
                        .eq('portfolio_id', portfolio.id);

                    const { count: programCount } = await (supabase as any)
                        .from('programs')
                        .select('*', { count: 'exact', head: true })
                        .eq('portfolio_id', portfolio.id);

                    const { data: projects } = await (supabase as any)
                        .from('projects')
                        .select('budget, actual_cost')
                        .eq('portfolio_id', portfolio.id);

                    const totalBudget = (projects || []).reduce((sum: number, p: any) => sum + (p.budget || 0), 0);
                    const totalSpent = (projects || []).reduce((sum: number, p: any) => sum + (p.actual_cost || 0), 0);

                    return {
                        ...portfolio,
                        project_count: projectCount || 0,
                        program_count: programCount || 0,
                        total_budget: totalBudget,
                        total_spent: totalSpent,
                        utilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
                    };
                })
            );

            return portfolioData;
        },
        enabled: !!workspaceId,
    });

    const breadcrumbs = [
        { label: 'Workspace Analytics', path: `/workspace/${workspaceId}/analytics`, icon: BarChart3 },
        { label: 'Portfolio Distribution', path: `/workspace/${workspaceId}/analytics/portfolio` },
        ...(portfolioId ? [{ label: portfolios.find((p: any) => p.id === portfolioId)?.name || 'Portfolio Details' }] : []),
    ];

    const exportCSV = () => {
        const headers = ['Portfolio Name', 'Programs', 'Projects', 'Budget', 'Spent', 'Utilization %', 'Status'];
        const rows = portfolios.map((p: any) => [
            p.name,
            p.program_count,
            p.project_count,
            p.total_budget,
            p.total_spent,
            p.utilization.toFixed(1),
            p.status,
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio-distribution-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <DrillDownLayout
            title="Portfolio Distribution Details"
            description="Detailed breakdown of projects and programs by portfolio"
            breadcrumbs={breadcrumbs}
            actions={
                <Button variant="outline" onClick={exportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </Button>
            }
            governancePanel={
                selectedPortfolio ? (
                    <GovernanceArtifactPanel entityId={selectedPortfolio} entityType="portfolio" />
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Governance Artifacts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Select a portfolio to view related governance documents</p>
                        </CardContent>
                    </Card>
                )
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Portfolios ({portfolios.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-center py-8 text-muted-foreground">Loading portfolios...</p>
                    ) : portfolios.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No portfolios found</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Portfolio Name</TableHead>
                                    <TableHead className="text-right">Programs</TableHead>
                                    <TableHead className="text-right">Projects</TableHead>
                                    <TableHead className="text-right">Budget</TableHead>
                                    <TableHead className="text-right">Spent</TableHead>
                                    <TableHead className="text-right">Utilization</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {portfolios.map((portfolio: any) => (
                                    <TableRow
                                        key={portfolio.id}
                                        className={selectedPortfolio === portfolio.id ? 'bg-accent' : ''}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                                {portfolio.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">{portfolio.program_count}</TableCell>
                                        <TableCell className="text-right">{portfolio.project_count}</TableCell>
                                        <TableCell className="text-right">${portfolio.total_budget.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">${portfolio.total_spent.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={portfolio.utilization > 90 ? 'destructive' : 'default'}>
                                                {portfolio.utilization.toFixed(1)}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{portfolio.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedPortfolio(portfolio.id)}
                                                >
                                                    View Governance
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/portfolio/${portfolio.id}`)}
                                                >
                                                    Details
                                                </Button>
                                            </div>
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
