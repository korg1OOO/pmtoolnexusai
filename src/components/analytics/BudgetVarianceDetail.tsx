import React, { useState, useEffect } from 'react';
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
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { AnalyticsBreadcrumb } from './AnalyticsBreadcrumb';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Filter,
    DollarSign,
} from 'lucide-react';
import type { BudgetVariance, LineItem, VarianceTrend } from '@/types/analytics';

interface BudgetVarianceDetailProps {
    workspaceId?: string;
    projectId?: string;
    portfolioId?: string;
}

export function BudgetVarianceDetail({
    workspaceId,
    projectId,
    portfolioId,
}: BudgetVarianceDetailProps) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [budgetData, setBudgetData] = useState<BudgetVariance | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
    const [categoryFilter, setCategoryFilter] = useState<string>(searchParams.get('category') || 'all');

    // Get filter params from URL
    const dateRange = searchParams.get('dateRange');
    const status = searchParams.get('status');

    useEffect(() => {
        loadBudgetVariance();
    }, [projectId, portfolioId, dateRange]);

    const loadBudgetVariance = async () => {
        setLoading(true);
        try {
            // Fetch project info
            let pid = projectId;
            let projectName = 'Project';
            let portfolioName: string | undefined;

            if (pid) {
                const { data: project } = await supabase
                    .from('projects')
                    .select('id, name, budget, spent')
                    .eq('id', pid)
                    .single();
                if (project) projectName = project.name;
            } else {
                const { data: firstProject } = await supabase
                    .from('projects')
                    .select('id, name, budget, spent')
                    .limit(1)
                    .single();
                if (firstProject) {
                    pid = firstProject.id;
                    projectName = firstProject.name;
                }
            }

            if (!pid) { setLoading(false); return; }

            if (portfolioId) {
                const { data: portfolio } = await supabase
                    .from('portfolios')
                    .select('name')
                    .eq('id', portfolioId)
                    .single();
                if (portfolio) portfolioName = portfolio.name;
            }

            // Fetch budget items grouped by category
            const { data: budgetItems } = await supabase
                .from('project_budget_items')
                .select('*')
                .eq('project_id', pid);

            // Build breakdown by category
            const categoryMap: Record<string, { planned: number; actual: number }> = {};
            (budgetItems || []).forEach(item => {
                const cat = item.category || 'Uncategorized';
                if (!categoryMap[cat]) categoryMap[cat] = { planned: 0, actual: 0 };
                categoryMap[cat].planned += item.budgeted_amount || 0;
                categoryMap[cat].actual += item.actual_amount || 0;
            });

            const breakdown: LineItem[] = Object.entries(categoryMap).map(([category, vals], idx) => ({
                id: String(idx + 1),
                category,
                planned: vals.planned,
                actual: vals.actual,
                variance: vals.actual - vals.planned,
                variancePercent: vals.planned > 0 ? ((vals.actual - vals.planned) / vals.planned) * 100 : 0,
            }));

            const totalPlanned = breakdown.reduce((s, b) => s + b.planned, 0);
            const totalActual = breakdown.reduce((s, b) => s + b.actual, 0);
            const totalVariance = totalActual - totalPlanned;
            const variancePercent = totalPlanned > 0 ? (totalVariance / totalPlanned) * 100 : 0;

            // Build trend from EVM snapshots
            const { data: evmSnapshots } = await supabase
                .from('project_evm_snapshots')
                .select('snapshot_date, pv, ac, ev')
                .eq('project_id', pid)
                .order('snapshot_date');

            const trend: VarianceTrend[] = (evmSnapshots || []).map(snap => {
                const d = new Date(snap.snapshot_date);
                const month = d.toLocaleDateString('en-US', { month: 'short' });
                return {
                    month,
                    planned: snap.pv || 0,
                    actual: snap.ac || 0,
                    variance: (snap.ac || 0) - (snap.pv || 0),
                };
            });

            const budgetStatus: BudgetVariance['status'] = 
                variancePercent > 5 ? 'over' : variancePercent < -5 ? 'under' : 'on-track';

            // Estimate forecast from trend
            const forecast = totalActual + (totalPlanned - totalActual) * (totalActual > 0 ? totalActual / Math.max(totalPlanned, 1) : 1);

            setBudgetData({
                projectId: pid,
                projectName,
                portfolioId,
                portfolioName,
                plannedBudget: totalPlanned,
                actualSpend: totalActual,
                forecast: Math.round(forecast),
                variance: totalVariance,
                variancePercent,
                status: budgetStatus,
                breakdown,
                trend,
            });
        } catch (error) {
            console.error('Failed to load budget variance:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const config = {
            under: { label: 'Under Budget', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
            'on-track': { label: 'On Track', variant: 'secondary' as const, icon: CheckCircle, color: 'text-blue-600' },
            over: { label: 'Over Budget', variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-600' },
        };
        return config[status as keyof typeof config] || config['on-track'];
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatPercent = (percent: number) => {
        return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">Loading budget variance data...</div>
            </div>
        );
    }

    if (!budgetData) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">No budget data available</div>
            </div>
        );
    }

    const statusConfig = getStatusBadge(budgetData.status);
    const StatusIcon = statusConfig.icon;

    const handleFilterChange = (type: 'status' | 'category', value: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (value === 'all') {
            newParams.delete(type);
        } else {
            newParams.set(type, value);
        }
        setSearchParams(newParams);

        if (type === 'status') setStatusFilter(value);
        if (type === 'category') setCategoryFilter(value);
    };

    // Filter breakdown data based on selected filters
    const filteredBreakdown = budgetData.breakdown.filter((item) => {
        if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
        if (statusFilter === 'over' && item.variance <= 0) return false;
        if (statusFilter === 'under' && item.variance >= 0) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Breadcrumb Navigation */}
            <AnalyticsBreadcrumb
                items={[
                    { label: 'Analytics', path: `/workspace/${workspaceId}/analytics` },
                    { label: 'Budget Variance' },
                ]}
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold">Budget Variance Analysis</h1>
                    <p className="text-muted-foreground">{budgetData.projectName}</p>
                </div>
                <Badge variant={statusConfig.variant} className="h-8 px-4">
                    <StatusIcon className="h-4 w-4 mr-2" />
                    {statusConfig.label}
                </Badge>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex items-center gap-4">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Status</label>
                            <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="over">Over Budget</SelectItem>
                                    <SelectItem value="under">Under Budget</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Category</label>
                            <Select value={categoryFilter} onValueChange={(value) => handleFilterChange('category', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {budgetData.breakdown.map((item) => (
                                        <SelectItem key={item.id} value={item.category}>
                                            {item.category}
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
                            <p className="text-sm font-medium text-muted-foreground">Planned Budget</p>
                            <p className="text-2xl font-bold">{formatCurrency(budgetData.plannedBudget)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-muted-foreground" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Actual Spend</p>
                            <p className="text-2xl font-bold">{formatCurrency(budgetData.actualSpend)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-blue-600" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Forecast</p>
                            <p className="text-2xl font-bold">{formatCurrency(budgetData.forecast)}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-orange-600" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Variance</p>
                            <p className={`text-2xl font-bold ${budgetData.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(Math.abs(budgetData.variance))}
                            </p>
                            <p className={`text-sm ${budgetData.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatPercent(budgetData.variancePercent)}
                            </p>
                        </div>
                        {budgetData.variance > 0 ? (
                            <TrendingUp className="h-8 w-8 text-red-600" />
                        ) : (
                            <TrendingDown className="h-8 w-8 text-green-600" />
                        )}
                    </div>
                </Card>
            </div>

            {/* Variance Trend Chart */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Variance Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={budgetData.trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            labelStyle={{ color: '#000' }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="planned"
                            stroke="#8884d8"
                            strokeWidth={2}
                            name="Planned"
                        />
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="#82ca9d"
                            strokeWidth={2}
                            name="Actual"
                        />
                        <Line
                            type="monotone"
                            dataKey="variance"
                            stroke="#ff7c7c"
                            strokeWidth={2}
                            name="Variance"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            {/* Budget Breakdown by Category */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Budget Breakdown by Category</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={budgetData.breakdown}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            labelStyle={{ color: '#000' }}
                        />
                        <Legend />
                        <Bar dataKey="planned" fill="#8884d8" name="Planned" />
                        <Bar dataKey="actual" fill="#82ca9d" name="Actual" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            {/* Detailed Breakdown Table */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Detailed Breakdown</h2>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Planned</TableHead>
                            <TableHead className="text-right">Actual</TableHead>
                            <TableHead className="text-right">Variance</TableHead>
                            <TableHead className="text-right">Variance %</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBreakdown.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.category}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.planned)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.actual)}</TableCell>
                                <TableCell className={`text-right ${item.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(Math.abs(item.variance))}
                                </TableCell>
                                <TableCell className={`text-right ${item.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatPercent(item.variancePercent)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {item.variance > 0 ? (
                                        <Badge variant="destructive">Over</Badge>
                                    ) : (
                                        <Badge variant="default">Under</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="font-bold bg-muted/50">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right">{formatCurrency(budgetData.plannedBudget)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(budgetData.actualSpend)}</TableCell>
                            <TableCell className={`text-right ${budgetData.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(Math.abs(budgetData.variance))}
                            </TableCell>
                            <TableCell className={`text-right ${budgetData.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatPercent(budgetData.variancePercent)}
                            </TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
