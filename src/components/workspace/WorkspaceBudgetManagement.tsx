import { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getWorkspaceBudget } from '@/services/workspaceService';

interface BudgetAllocation {
    portfolio_id: string;
    portfolio_name: string;
    allocated: number;
    spent: number;
    remaining: number;
    variance: number;
}

/** Build monthly cumulative budget/spend from projects */
function useSpendTrend(workspaceId?: string) {
    return useQuery({
        queryKey: ['workspace-spend-trend', workspaceId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('budget, spent, start_date')
                .eq('workspace_id', workspaceId!);
            if (error) throw error;

            const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            // Aggregate per calendar-month
            const monthMap = new Map<string, { budget: number; actual: number }>();
            ((data ?? []) as any[]).forEach((p) => {
                if (!p.start_date) return;
                const monthKey = MONTHS[new Date(p.start_date).getMonth()];
                const cur = monthMap.get(monthKey) ?? { budget: 0, actual: 0 };
                monthMap.set(monthKey, {
                    budget: cur.budget + (p.budget ?? 0),
                    actual: cur.actual + (p.spent ?? 0),
                });
            });

            // Return ordered by calendar month
            return MONTHS
                .filter((m) => monthMap.has(m))
                .map((m) => ({ month: m, ...monthMap.get(m)! }));
        },
        enabled: !!workspaceId,
    });
}

export function WorkspaceBudgetManagement() {
    const { workspaceId } = useParams();
    const reportRef = useRef<HTMLDivElement>(null);

    const { data: budgetData } = useQuery({
        queryKey: ['workspace-budget', workspaceId],
        queryFn: async () => {
            if (!workspaceId) throw new Error('Workspace ID is required');
            return getWorkspaceBudget(workspaceId);
        },
        enabled: !!workspaceId,
    });

    const { data: trendData = [], isLoading: trendLoading } = useSpendTrend(workspaceId);

    const spendRate = budgetData
        ? (budgetData.spent_budget / budgetData.total_budget) * 100
        : 0;

    /** CSV export for the trend chart */
    const handleExport = () => {
        const rows = [
            'Month,Budgeted,Actual',
            ...trendData.map((r) => `${r.month},${r.budget},${r.actual}`),
        ];
        const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budget-trend-${workspaceId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 space-y-6" ref={reportRef}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Budget Management</h1>
                    <p className="text-muted-foreground">Track and manage workspace budget allocation</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                    </Button>
                    <Button>Reallocate Budget</Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Budget</p>
                            <p className="text-2xl font-bold">
                                ${((budgetData?.total_budget || 0) / 1000000).toFixed(1)}M
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <TrendingDown className="w-8 h-8 text-red-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Spent</p>
                            <p className="text-2xl font-bold">
                                ${((budgetData?.spent_budget || 0) / 1000000).toFixed(1)}M
                            </p>
                            <p className="text-xs text-muted-foreground">{spendRate.toFixed(0)}% of budget</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Remaining</p>
                            <p className="text-2xl font-bold">
                                ${(((budgetData?.total_budget || 0) - (budgetData?.spent_budget || 0)) / 1000000).toFixed(1)}M
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Spend Trend */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Spend Trend</h2>
                {trendLoading ? (
                    <Skeleton className="w-full h-[300px] rounded-xl" />
                ) : trendData.length === 0 ? (
                    <p className="text-sm text-center text-muted-foreground py-16">No spend data available</p>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                            <Tooltip formatter={(v: number) => `$${(v / 1000000).toFixed(2)}M`} />
                            <Legend />
                            <Line type="monotone" dataKey="budget" stroke="#3b82f6" name="Budgeted" />
                            <Line type="monotone" dataKey="actual" stroke="#10b981" name="Actual" />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </Card>

            {/* Portfolio Allocations */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Portfolio Budget Allocations</h2>
                <div className="space-y-4">
                    {(budgetData as any)?.allocations?.map((allocation: BudgetAllocation) => (
                        <div key={allocation.portfolio_id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">{allocation.portfolio_name}</h3>
                                <div className="flex items-center gap-2">
                                    {allocation.variance < 0 ? (
                                        <span className="text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            ${Math.abs(allocation.variance / 1000).toFixed(0)}K over
                                        </span>
                                    ) : (
                                        <span className="text-sm text-green-600 flex items-center gap-1">
                                            <TrendingUp className="w-4 h-4" />
                                            ${(allocation.variance / 1000).toFixed(0)}K under
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Allocated</p>
                                    <p className="font-semibold">${(allocation.allocated / 1000000).toFixed(1)}M</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Spent</p>
                                    <p className="font-semibold">${(allocation.spent / 1000000).toFixed(1)}M</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Remaining</p>
                                    <p className="font-semibold">${(allocation.remaining / 1000000).toFixed(1)}M</p>
                                </div>
                            </div>
                            <Progress value={(allocation.spent / allocation.allocated) * 100} className="h-2" />
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
