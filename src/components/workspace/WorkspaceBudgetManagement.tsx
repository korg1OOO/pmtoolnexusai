import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getWorkspaceBudget } from '@/services/workspaceService'; // Assuming this path

interface BudgetAllocation {
    portfolio_id: string;
    portfolio_name: string;
    allocated: number;
    spent: number;
    remaining: number;
    variance: number;
}

export function WorkspaceBudgetManagement() {
    const { workspaceId } = useParams();

    const { data: budgetData } = useQuery({
        queryKey: ['workspace-budget', workspaceId],
        queryFn: async () => {
            if (!workspaceId) {
                throw new Error('Workspace ID is required');
            }
            return getWorkspaceBudget(workspaceId);
        }
    });

    const spendRate = budgetData ? (budgetData.spent_budget / budgetData.total_budget) * 100 : 0;

    const trendData = [
        { month: 'Jan', budget: 1000000, actual: 950000 },
        { month: 'Feb', budget: 2000000, actual: 1900000 },
        { month: 'Mar', budget: 3000000, actual: 3100000 },
        { month: 'Apr', budget: 4000000, actual: 4200000 },
        { month: 'May', budget: 5000000, actual: 5300000 },
        { month: 'Jun', budget: 6000000, actual: 6200000 }
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Budget Management</h1>
                    <p className="text-muted-foreground">Track and manage workspace budget allocation</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Export Report</Button>
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
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="budget" stroke="#3b82f6" name="Budgeted" />
                        <Line type="monotone" dataKey="actual" stroke="#10b981" name="Actual" />
                    </LineChart>
                </ResponsiveContainer>
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
