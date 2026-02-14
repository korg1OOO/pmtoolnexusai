import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProjectBudget {
    project_id: string;
    project_name: string;
    allocated: number;
    spent: number;
    forecast: number;
    variance: number;
}

export function ProgramBudgetManagement() {
    const { programId } = useParams();

    const { data: budgetData } = useQuery({
        queryKey: ['program-budget', programId],
        queryFn: async () => {
            return {
                total_budget: 3000000,
                total_spent: 1800000,
                total_forecast: 2900000,
                total_variance: -100000,
                projects: [
                    {
                        project_id: '1',
                        project_name: 'Backend API',
                        allocated: 1000000,
                        spent: 650000,
                        forecast: 980000,
                        variance: 20000
                    },
                    {
                        project_id: '2',
                        project_name: 'Mobile App',
                        allocated: 1200000,
                        spent: 750000,
                        forecast: 1220000,
                        variance: -20000
                    },
                    {
                        project_id: '3',
                        project_name: 'Web Dashboard',
                        allocated: 800000,
                        spent: 400000,
                        forecast: 700000,
                        variance: 100000
                    }
                ] as ProjectBudget[],
                spendTrend: [
                    { month: 'Jan', budget: 500000, actual: 480000, forecast: 490000 },
                    { month: 'Feb', budget: 1000000, actual: 950000, forecast: 980000 },
                    { month: 'Mar', budget: 1500000, actual: 1450000, forecast: 1470000 },
                    { month: 'Apr', budget: 2000000, actual: 1800000, forecast: 1960000 },
                    { month: 'May', budget: 2500000, actual: 2100000, forecast: 2450000 },
                    { month: 'Jun', budget: 3000000, actual: 2400000, forecast: 2900000 }
                ],
                costBreakdown: [
                    { category: 'Labor', amount: 1200000 },
                    { category: 'Infrastructure', amount: 300000 },
                    { category: 'Software', amount: 200000 },
                    { category: 'Other', amount: 100000 }
                ]
            };
        }
    });

    const spendRate = budgetData ? (budgetData.total_spent / budgetData.total_budget) * 100 : 0;
    const forecastVariance = budgetData ? budgetData.total_budget - budgetData.total_forecast : 0;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Program Budget Management</h1>
                    <p className="text-muted-foreground">Track and manage program budget across projects</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Reallocate</Button>
                    <Button>Export Report</Button>
                </div>
            </div>

            {/* Summary Cards */}
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
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Forecast</p>
                            <p className="text-2xl font-bold">
                                ${((budgetData?.total_forecast || 0) / 1000000).toFixed(1)}M
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <AlertCircle className={`w-8 h-8 ${forecastVariance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                        <div>
                            <p className="text-sm text-muted-foreground">Variance</p>
                            <p className={`text-2xl font-bold ${forecastVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {forecastVariance >= 0 ? '+' : ''}${(forecastVariance / 1000).toFixed(0)}K
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Spend Trend */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Spend Trend & Forecast</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={budgetData?.spendTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="budget" stroke="#3b82f6" name="Budget" />
                        <Line type="monotone" dataKey="actual" stroke="#10b981" name="Actual" />
                        <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeDasharray="5 5" name="Forecast" />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Breakdown */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Cost Breakdown</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={budgetData?.costBreakdown}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="amount" fill="#3b82f6" name="Amount ($)" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* Variance Analysis */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Variance Analysis</h2>
                    <div className="space-y-3">
                        {budgetData?.projects.map((project) => (
                            <div key={project.project_id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <h4 className="font-medium">{project.project_name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        ${(project.spent / 1000).toFixed(0)}K / ${(project.allocated / 1000).toFixed(0)}K
                                    </p>
                                </div>
                                <span className={`text-sm px-2 py-1 rounded ${project.variance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {project.variance >= 0 ? '+' : ''}${(project.variance / 1000).toFixed(0)}K
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Project Budget Details */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Project Budget Details</h2>
                <div className="space-y-4">
                    {budgetData?.projects.map((project) => {
                        const spendPercent = (project.spent / project.allocated) * 100;
                        const forecastPercent = (project.forecast / project.allocated) * 100;

                        return (
                            <div key={project.project_id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold">{project.project_name}</h3>
                                    <span className={`text-sm px-2 py-1 rounded ${project.variance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        Variance: {project.variance >= 0 ? '+' : ''}${(project.variance / 1000).toFixed(0)}K
                                    </span>
                                </div>

                                <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Allocated</p>
                                        <p className="font-semibold">${(project.allocated / 1000).toFixed(0)}K</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Spent</p>
                                        <p className="font-semibold">${(project.spent / 1000).toFixed(0)}K</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Forecast</p>
                                        <p className="font-semibold">${(project.forecast / 1000).toFixed(0)}K</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Remaining</p>
                                        <p className="font-semibold">${((project.allocated - project.spent) / 1000).toFixed(0)}K</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>Spent</span>
                                            <span>{spendPercent.toFixed(0)}%</span>
                                        </div>
                                        <Progress value={spendPercent} className="h-2" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>Forecast</span>
                                            <span>{forecastPercent.toFixed(0)}%</span>
                                        </div>
                                        <Progress value={forecastPercent} className="h-2" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}
