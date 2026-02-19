import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useProgramBudget } from '@/hooks/useProgramBudget';
import { PDFExporter } from '@/components/common/PDFExporter';
import { useRef } from 'react';

const fmt = (n: number) =>
    n >= 1_000_000
        ? `$${(n / 1_000_000).toFixed(2)}M`
        : n >= 1_000
            ? `$${(n / 1_000).toFixed(0)}K`
            : `$${n.toLocaleString()}`;

export function ProgramBudgetManagement() {
    const { programId } = useParams();
    const contentRef = useRef<HTMLDivElement>(null);
    const { data, isLoading, refetch } = useProgramBudget(programId);

    const spendRate = data && data.total_budget > 0
        ? (data.total_spent / data.total_budget) * 100
        : 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6" ref={contentRef}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Program Budget Management</h1>
                    <p className="text-muted-foreground">Track and manage program budget across all projects</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                    <PDFExporter title="Program Budget" filename="program-budget" contentRef={contentRef} variant="button" />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Budget</p>
                            <p className="text-2xl font-bold">{fmt(data?.total_budget || 0)}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <TrendingDown className="w-8 h-8 text-red-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Spent</p>
                            <p className="text-2xl font-bold">{fmt(data?.total_spent || 0)}</p>
                            <p className="text-xs text-muted-foreground">{spendRate.toFixed(0)}% of budget</p>
                            <Progress value={spendRate} className="mt-2 h-1" />
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Forecast at Completion</p>
                            <p className="text-2xl font-bold">{fmt(data?.total_forecast || 0)}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <AlertCircle className={`w-8 h-8 ${(data?.total_variance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                        <div>
                            <p className="text-sm text-muted-foreground">Variance</p>
                            <p className={`text-2xl font-bold ${(data?.total_variance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {(data?.total_variance || 0) >= 0 ? '+' : ''}{fmt(data?.total_variance || 0)}
                            </p>
                            <badge className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${(data?.total_variance || 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {(data?.total_variance || 0) >= 0 ? 'Under Budget' : 'Over Budget'}
                            </badge>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Spend Trend */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Spend Trend & Forecast</h2>
                {data?.spendTrend && data.spendTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.spendTrend}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                            <Tooltip formatter={(v: number) => fmt(v)} />
                            <Legend />
                            <Line type="monotone" dataKey="budget" stroke="#3b82f6" name="Budget" strokeWidth={2} />
                            <Line type="monotone" dataKey="actual" stroke="#10b981" name="Actual" strokeWidth={2} />
                            <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeDasharray="5 5" name="Forecast" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-muted-foreground text-center py-8">No spend data available</p>
                )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Breakdown by Category */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Cost Breakdown by Category</h2>
                    {data?.costBreakdown && data.costBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={data.costBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v: number) => fmt(v)} />
                                <Legend />
                                <Bar dataKey="amount" fill="#3b82f6" name="Budgeted" />
                                <Bar dataKey="actual" fill="#10b981" name="Actual" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No budget items configured</p>
                    )}
                </Card>

                {/* Variance Analysis */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Project Variance Analysis</h2>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                        {data?.projects && data.projects.length > 0 ? data.projects.map((project) => (
                            <div key={project.project_id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <h4 className="font-medium text-sm">{project.project_name}</h4>
                                    <p className="text-xs text-muted-foreground">
                                        {fmt(project.spent)} / {fmt(project.allocated)}
                                    </p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded font-medium ${project.variance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {project.variance >= 0 ? '+' : ''}{fmt(project.variance)}
                                </span>
                            </div>
                        )) : (
                            <p className="text-muted-foreground text-sm text-center py-6">
                                No projects found for this program
                            </p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Project Budget Details */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Project Budget Details</h2>
                {data?.projects && data.projects.length > 0 ? (
                    <div className="space-y-4">
                        {data.projects.map((project) => {
                            const spendPct = project.allocated > 0 ? Math.min(100, (project.spent / project.allocated) * 100) : 0;
                            const forecastPct = project.allocated > 0 ? Math.min(120, (project.forecast / project.allocated) * 100) : 0;
                            return (
                                <div key={project.project_id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold">{project.project_name}</h3>
                                        <Badge variant={project.variance >= 0 ? 'default' : 'destructive'}>
                                            {project.variance >= 0 ? '+' : ''}{fmt(project.variance)}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                                        <div><p className="text-muted-foreground text-xs">Allocated</p><p className="font-semibold">{fmt(project.allocated)}</p></div>
                                        <div><p className="text-muted-foreground text-xs">Spent</p><p className="font-semibold">{fmt(project.spent)}</p></div>
                                        <div><p className="text-muted-foreground text-xs">Forecast</p><p className="font-semibold">{fmt(project.forecast)}</p></div>
                                        <div><p className="text-muted-foreground text-xs">Remaining</p><p className="font-semibold">{fmt(Math.max(0, project.allocated - project.spent))}</p></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <div className="flex justify-between text-xs mb-1"><span>Spent</span><span>{spendPct.toFixed(0)}%</span></div>
                                            <Progress value={spendPct} className="h-2" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs mb-1"><span>Forecast</span><span>{forecastPct.toFixed(0)}%</span></div>
                                            <Progress value={Math.min(100, forecastPct)} className={`h-2 ${forecastPct > 100 ? '[&>div]:bg-destructive' : ''}`} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">No projects assigned to this program</p>
                )}
            </Card>
        </div>
    );
}
