import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, TrendingDown, Target, Loader2, RefreshCw } from 'lucide-react';
import {
    PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { usePortfolioBudget } from '@/hooks/usePortfolioBudget';
import { useRef } from 'react';
import { PDFExporter } from '@/components/common/PDFExporter';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const fmt = (n: number) =>
    n >= 1_000_000
        ? `$${(n / 1_000_000).toFixed(2)}M`
        : n >= 1_000
            ? `$${(n / 1_000).toFixed(0)}K`
            : `$${n.toLocaleString()}`;

export function PortfolioBudgetOverview() {
    const { portfolioId } = useParams();
    const contentRef = useRef<HTMLDivElement>(null);
    const { data, isLoading, refetch } = usePortfolioBudget(portfolioId);

    const spendRate = data && data.total_budget > 0
        ? (data.total_spent / data.total_budget) * 100
        : 0;

    const expectedROI = data && data.total_budget > 0
        ? ((data.expected_roi - data.total_budget) / data.total_budget) * 100
        : 0;

    const distributionData = data?.programs.map((p) => ({
        name: p.program_name,
        value: p.allocated,
    }));

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
                    <h1 className="text-3xl font-bold">Portfolio Budget</h1>
                    <p className="text-muted-foreground">Budget allocation and ROI analysis across all programs</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                    <PDFExporter title="Portfolio Budget" filename="portfolio-budget" contentRef={contentRef} variant="button" />
                </div>
            </div>

            {/* Budget Summary */}
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
                        <TrendingUp className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Remaining</p>
                            <p className="text-2xl font-bold">{fmt(data?.total_remaining || 0)}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Target className="w-8 h-8 text-purple-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Expected ROI</p>
                            <p className="text-2xl font-bold">{expectedROI.toFixed(0)}%</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Spend Trend */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Cumulative Spend Trend</h2>
                    {data?.spendTrend && data.spendTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={data.spendTrend}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v: number) => fmt(v)} />
                                <Legend />
                                <Line type="monotone" dataKey="budget" stroke="#3b82f6" name="Budgeted" strokeWidth={2} />
                                <Line type="monotone" dataKey="actual" stroke="#10b981" name="Actual" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No trend data</p>
                    )}
                </Card>

                {/* Budget Distribution Pie */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Budget Distribution by Program</h2>
                    {distributionData && distributionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={distributionData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    dataKey="value"
                                >
                                    {distributionData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: number) => fmt(v)} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No programs found</p>
                    )}
                </Card>
            </div>

            {/* Program Budget Rows */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Program Budget Allocations</h2>
                {data?.programs && data.programs.length > 0 ? (
                    <div className="space-y-4">
                        {data.programs.map((program, idx) => {
                            const spendPct = program.allocated > 0
                                ? Math.min(100, (program.spent / program.allocated) * 100)
                                : 0;
                            const roi = program.allocated > 0
                                ? ((program.roi - program.allocated) / program.allocated) * 100
                                : 0;
                            return (
                                <div key={program.program_id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-violet-500', 'bg-red-500'][idx % 5]}`} />
                                            <h3 className="font-semibold">{program.program_name}</h3>
                                        </div>
                                        <Badge variant="secondary">ROI: {roi.toFixed(0)}%</Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                                        <div><p className="text-muted-foreground text-xs">Allocated</p><p className="font-semibold">{fmt(program.allocated)}</p></div>
                                        <div><p className="text-muted-foreground text-xs">Spent</p><p className="font-semibold">{fmt(program.spent)}</p></div>
                                        <div><p className="text-muted-foreground text-xs">Est. Return</p><p className="font-semibold text-green-600">{fmt(program.roi)}</p></div>
                                    </div>
                                    <Progress value={spendPct} className="h-2" />
                                    <p className="text-xs text-muted-foreground mt-1">{spendPct.toFixed(0)}% spent</p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">No programs in this portfolio</p>
                )}
            </Card>

            {/* ROI Summary */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">ROI Analysis</h2>
                <div className="space-y-3">
                    <div className="flex justify-between p-3 border rounded-lg">
                        <div>
                            <p className="font-medium">Total Investment</p>
                            <p className="text-sm text-muted-foreground">Portfolio budget allocation</p>
                        </div>
                        <p className="text-lg font-semibold">{fmt(data?.total_budget || 0)}</p>
                    </div>
                    <div className="flex justify-between p-3 border rounded-lg">
                        <div>
                            <p className="font-medium">Expected Returns</p>
                            <p className="text-sm text-muted-foreground">Projected value creation (70% ROI assumption)</p>
                        </div>
                        <p className="text-lg font-semibold text-green-600">{fmt(data?.expected_roi || 0)}</p>
                    </div>
                    <div className="flex justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                        <div>
                            <p className="font-medium">Net Value</p>
                            <p className="text-sm text-muted-foreground">Expected profit</p>
                        </div>
                        <p className="text-lg font-semibold text-green-600">
                            {fmt((data?.expected_roi || 0) - (data?.total_budget || 0))}
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
