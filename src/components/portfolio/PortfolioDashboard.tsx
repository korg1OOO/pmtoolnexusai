import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertTriangle, CheckCircle, DollarSign, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getPortfolioOverview } from '@/services/portfolioService';

interface ProgramHealth {
    id: string;
    name: string;
    status: 'on-track' | 'at-risk' | 'critical';
    completion: number;
    budget_variance: number;
}

export function PortfolioDashboard() {
    const { portfolioId } = useParams();

    const { data: overview } = useQuery({
        queryKey: ['portfolio-overview', portfolioId],
        queryFn: () => getPortfolioOverview(portfolioId!),
        enabled: !!portfolioId
    });

    const budgetUtilization = overview ? (overview.spent / overview.total_budget) * 100 : 0;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{overview?.portfolio_name}</h1>
                    <p className="text-muted-foreground">Strategic portfolio overview</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">View Roadmap</Button>
                    <Button>Add Program</Button>
                </div>
            </div>

            {/* Strategic Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Target className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Programs</p>
                            <p className="text-2xl font-bold">{overview?.total_programs}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">On Track</p>
                            <p className="text-2xl font-bold">{overview?.on_track}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-8 h-8 text-orange-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">At Risk</p>
                            <p className="text-2xl font-bold">{overview?.at_risk}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-8 h-8 text-purple-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Budget</p>
                            <p className="text-2xl font-bold">
                                ${((overview?.total_budget || 0) / 1000000).toFixed(1)}M
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Budget Overview */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Budget vs Actual</h2>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Budget Utilization</span>
                        <span className="font-medium">{budgetUtilization.toFixed(0)}%</span>
                    </div>
                    <Progress value={budgetUtilization} className="h-3" />
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Allocated</p>
                            <p className="text-lg font-semibold">
                                ${((overview?.total_budget || 0) / 1000000).toFixed(2)}M
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Spent</p>
                            <p className="text-lg font-semibold">
                                ${((overview?.spent || 0) / 1000000).toFixed(2)}M
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Program Health Cards */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Program Health</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {overview?.programs.map((program) => (
                        <ProgramHealthCard key={program.id} program={program} />
                    ))}
                </div>
            </div>

            {/* Risk Overview */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Risk Overview</h2>
                <div className="space-y-3">
                    <RiskItem
                        title="Budget Overrun Risk"
                        severity="medium"
                        description="Cloud Migration program trending 5% over budget"
                    />
                    <RiskItem
                        title="Resource Constraint"
                        severity="high"
                        description="Mobile App team at 95% capacity"
                    />
                    <RiskItem
                        title="Schedule Delay"
                        severity="low"
                        description="API Platform milestone delayed by 1 week"
                    />
                </div>
            </Card>
        </div>
    );
}

function ProgramHealthCard({ program }: { program: ProgramHealth }) {
    const statusConfig = {
        'on-track': {
            icon: CheckCircle,
            color: 'text-green-600',
            bg: 'bg-green-100'
        },
        'at-risk': {
            icon: AlertTriangle,
            color: 'text-orange-600',
            bg: 'bg-orange-100'
        },
        'critical': {
            icon: AlertTriangle,
            color: 'text-red-600',
            bg: 'bg-red-100'
        }
    };

    const config = statusConfig[program.status];
    const Icon = config.icon;

    return (
        <Card className="p-6">
            <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold">{program.name}</h3>
                <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${config.bg} ${config.color}`}>
                    <Icon className="w-3 h-3" />
                    {program.status === 'on-track' ? 'On Track' : program.status === 'at-risk' ? 'At Risk' : 'Critical'}
                </span>
            </div>

            <div className="space-y-3">
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Completion</span>
                        <span className="font-medium">{program.completion}%</span>
                    </div>
                    <Progress value={program.completion} className="h-2" />
                </div>

                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Budget Variance</span>
                    <span className={`font-medium ${program.budget_variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {program.budget_variance < 0 ? '-' : '+'}${Math.abs(program.budget_variance / 1000).toFixed(0)}K
                    </span>
                </div>
            </div>
        </Card>
    );
}

function RiskItem({ title, severity, description }: {
    title: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
}) {
    const severityConfig = {
        low: 'bg-yellow-100 text-yellow-700',
        medium: 'bg-orange-100 text-orange-700',
        high: 'bg-red-100 text-red-700'
    };

    return (
        <div className="flex items-start gap-3 p-3 border rounded-lg">
            <AlertTriangle className={`w-5 h-5 mt-0.5 ${severity === 'high' ? 'text-red-600' : severity === 'medium' ? 'text-orange-600' : 'text-yellow-600'}`} />
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{title}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${severityConfig[severity]}`}>
                        {severity.toUpperCase()}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}
