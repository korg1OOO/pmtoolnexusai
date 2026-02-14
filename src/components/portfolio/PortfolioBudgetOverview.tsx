import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

interface ProgramBudget {
    program_id: string;
    program_name: string;
    allocated: number;
    spent: number;
    roi: number;
}

export function PortfolioBudgetOverview() {
    const { portfolioId } = useParams();

    const { data: budgetData } = useQuery({
        queryKey: ['portfolio-budget', portfolioId],
        queryFn: async () => {
            return {
                total_budget: 5000000,
                total_spent: 3200000,
                total_remaining: 1800000,
                expected_roi: 8500000,
                programs: [
                    {
                        program_id: '1',
                        program_name: 'Cloud Migration',
                        allocated: 2000000,
                        spent: 1300000,
                        roi: 3500000
                    },
                    {
                        program_id: '2',
                        program_name: 'Mobile App Redesign',
                        allocated: 1500000,
                        spent: 900000,
                        roi: 2500000
                    },
                    {
                        program_id: '3',
                        program_name: 'API Platform',
                        allocated: 1500000,
                        spent: 1000000,
                        roi: 2500000
                    }
                ] as ProgramBudget[],
                spendTrend: [
                    { month: 'Jan', budget: 800000, actual: 750000 },
                    { month: 'Feb', budget: 1600000, actual: 1550000 },
                    { month: 'Mar', budget: 2400000, actual: 2450000 },
                    { month: 'Apr', budget: 3200000, actual: 3200000 }
                ]
            };
        }
    });

    const spendRate = budgetData ? (budgetData.total_spent / budgetData.total_budget) * 100 : 0;
    const expectedROI = budgetData ? ((budgetData.expected_roi - budgetData.total_budget) / budgetData.total_budget) * 100 : 0;

    const distributionData = budgetData?.programs.map(p => ({
        name: p.program_name,
        value: p.allocated
    }));

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Portfolio Budget</h1>
                    <p className="text-muted-foreground">Budget allocation and ROI analysis</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Reallocate Budget</Button>
                    <Button>Export Report</Button>
                </div>
            </div>

            {/* Budget Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                            <p className="text-sm text-muted-foreground">Spent</p>
                            <p className="text-2xl font-bold">
                                ${((budgetData?.total_spent || 0) / 1000000).toFixed(1)}M
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
                                ${((budgetData?.total_remaining || 0) / 1000000).toFixed(1)}M
                            </p>
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
                    <h2 className="text-xl font-semibold mb-4">Spend Trend</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={budgetData?.spendTrend}>
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

                {/* Budget Distribution */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Budget Distribution</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={distributionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => `${entry.name}: $${(entry.value / 1000000).toFixed(1)}M`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {distributionData?.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Program Allocations */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Program Budget Allocations</h2>
                <div className="space-y-4">
                    {budgetData?.programs.map((program) => {
                        const spendPercent = (program.spent / program.allocated) * 100;
                        const roi = ((program.roi - program.allocated) / program.allocated) * 100;

                        return (
                            <div key={program.program_id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold">{program.program_name}</h3>
                                    <span className="text-sm px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                        ROI: {roi.toFixed(0)}%
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Allocated</p>
                                        <p className="font-semibold">${(program.allocated / 1000000).toFixed(2)}M</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Spent</p>
                                        <p className="font-semibold">${(program.spent / 1000000).toFixed(2)}M</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Expected Return</p>
                                        <p className="font-semibold">${(program.roi / 1000000).toFixed(2)}M</p>
                                    </div>
                                </div>

                                <Progress value={spendPercent} className="h-2" />
                                <p className="text-xs text-muted-foreground mt-1">{spendPercent.toFixed(0)}% spent</p>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* ROI Analysis */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">ROI Analysis</h2>
                <div className="space-y-3">
                    <div className="flex justify-between p-3 border rounded-lg">
                        <div>
                            <p className="font-medium">Total Investment</p>
                            <p className="text-sm text-muted-foreground">Portfolio budget allocation</p>
                        </div>
                        <p className="text-lg font-semibold">${((budgetData?.total_budget || 0) / 1000000).toFixed(2)}M</p>
                    </div>
                    <div className="flex justify-between p-3 border rounded-lg">
                        <div>
                            <p className="font-medium">Expected Returns</p>
                            <p className="text-sm text-muted-foreground">Projected value creation</p>
                        </div>
                        <p className="text-lg font-semibold text-green-600">
                            ${((budgetData?.expected_roi || 0) / 1000000).toFixed(2)}M
                        </p>
                    </div>
                    <div className="flex justify-between p-3 border rounded-lg bg-green-50">
                        <div>
                            <p className="font-medium">Net Value</p>
                            <p className="text-sm text-muted-foreground">Expected profit</p>
                        </div>
                        <p className="text-lg font-semibold text-green-600">
                            ${(((budgetData?.expected_roi || 0) - (budgetData?.total_budget || 0)) / 1000000).toFixed(2)}M
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
