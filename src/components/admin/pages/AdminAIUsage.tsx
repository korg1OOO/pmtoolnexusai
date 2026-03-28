/**
 * Admin AI Usage & Costs Page
 * Monitor AI provider usage, costs, and budgets
 */

import React from 'react';
import {
    useAICostByProvider,
    useAIUsageByUser,
    useBudgetStatus,
    useProviderCosts,
    useAIUsageSummary,
} from '@/hooks/useAIUsage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Bot,
    DollarSign,
    TrendingUp,
    Users,
    AlertTriangle,
    CheckCircle2,
    Zap,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CostOptimizationPanel } from '@/components/admin/CostOptimizationPanel';

export function AdminAIUsage() {
    const { data: costByProvider, isLoading: costsLoading } = useAICostByProvider();
    const { data: usageByUser, isLoading: usersLoading } = useAIUsageByUser();
    const { data: budgetStatus, isLoading: budgetsLoading } = useBudgetStatus();
    const { data: providerCosts } = useProviderCosts();
    const { data: usageSummary } = useAIUsageSummary();

    const totalCost = costByProvider?.reduce((sum, p) => sum + p.total_cost_usd, 0) || 0;
    const totalRequests = costByProvider?.reduce((sum, p) => sum + p.request_count, 0) || 0;
    const totalUsers = costByProvider?.reduce((sum, p) => sum + p.unique_users, 0) || 0;

    const budgetWarnings = budgetStatus?.filter(b => b.status === 'warning').length || 0;
    const budgetExceeded = budgetStatus?.filter(b => b.status === 'exceeded').length || 0;

    const getBudgetStatusColor = (status: string) => {
        switch (status) {
            case 'normal':
                return 'text-green-500';
            case 'warning':
                return 'text-yellow-500';
            case 'exceeded':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    const getBudgetStatusBadge = (status: string) => {
        switch (status) {
            case 'normal':
                return <Badge variant="outline" className="border-green-500 text-green-500">On Track</Badge>;
            case 'warning':
                return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Warning</Badge>;
            case 'exceeded':
                return <Badge variant="destructive">Exceeded</Badge>;
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Bot className="h-8 w-8" />
                        AI Usage & Costs
                    </h1>
                    <p className="text-muted-foreground">
                        Monitor AI provider usage, token consumption, and costs
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Current month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Requests</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">AI API calls</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers}</div>
                        <p className="text-xs text-muted-foreground">Using AI features</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Budget Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            <span className="text-yellow-500">{budgetWarnings}</span>
                            {budgetExceeded > 0 && (
                                <span className="text-red-500"> / {budgetExceeded}</span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">Warning / Exceeded</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="providers">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="providers">By Provider</TabsTrigger>
                    <TabsTrigger value="users">By User</TabsTrigger>
                    <TabsTrigger value="budgets">Budgets</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    <TabsTrigger value="optimization">Optimization</TabsTrigger>
                </TabsList>

                {/* By Provider Tab */}
                <TabsContent value="providers" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cost by Provider</CardTitle>
                            <CardDescription>Current month breakdown</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {costsLoading ? (
                                <div className="text-center py-8 text-muted-foreground">Loading...</div>
                            ) : (
                                <div className="space-y-4">
                                    {costByProvider?.map((provider) => (
                                        <Card key={provider.provider}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <div className="font-semibold text-lg capitalize">{provider.provider}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {provider.request_count.toLocaleString()} requests • {provider.unique_users} users
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold">${provider.total_cost_usd.toFixed(2)}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            ${provider.avg_cost_per_request.toFixed(4)}/request
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Credits Used</span>
                                                        <span className="font-medium">{(provider.total_tokens * 2).toLocaleString()}</span>
                                                    </div>
                                                    <Progress
                                                        value={(provider.total_cost_usd / totalCost) * 100}
                                                        className="h-2"
                                                    />
                                                    <div className="text-xs text-muted-foreground text-right">
                                                        {((provider.total_cost_usd / totalCost) * 100).toFixed(1)}% of total
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* By User Tab */}
                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Usage by User</CardTitle>
                            <CardDescription>Current month activity</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {usersLoading ? (
                                <div className="text-center py-8 text-muted-foreground">Loading...</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Requests</TableHead>
                                            <TableHead>Credits Used</TableHead>
                                            <TableHead>Cost</TableHead>
                                            <TableHead>Providers</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {usageByUser?.map((user) => (
                                            <TableRow key={user.user_id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{user.full_name || 'Unknown'}</div>
                                                        <div className="text-sm text-muted-foreground">{user.email}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{user.request_count.toLocaleString()}</TableCell>
                                                <TableCell>{(user.total_tokens * 2).toLocaleString()}</TableCell>
                                                <TableCell className="font-medium">${user.total_cost_usd.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {user.providers_used?.map((provider) => (
                                                            <Badge key={provider} variant="outline" className="capitalize">
                                                                {provider}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Budgets Tab */}
                <TabsContent value="budgets" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Budget Status</CardTitle>
                            <CardDescription>Monitor spending limits and alerts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {budgetsLoading ? (
                                <div className="text-center py-8 text-muted-foreground">Loading...</div>
                            ) : (
                                <div className="space-y-4">
                                    {budgetStatus?.map((budget) => (
                                        <Card key={budget.id}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <div className="font-semibold text-lg">{budget.name}</div>
                                                        <div className="text-sm text-muted-foreground capitalize">
                                                            {budget.budget_type} • {budget.period}
                                                        </div>
                                                    </div>
                                                    {getBudgetStatusBadge(budget.status)}
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Spent</span>
                                                        <span className={cn('font-medium', getBudgetStatusColor(budget.status))}>
                                                            ${budget.spent_usd.toFixed(2)} / ${budget.limit_usd.toFixed(2)}
                                                        </span>
                                                    </div>

                                                    <Progress
                                                        value={budget.utilization * 100}
                                                        className={cn(
                                                            'h-2',
                                                            budget.status === 'exceeded' && 'bg-red-200',
                                                            budget.status === 'warning' && 'bg-yellow-200'
                                                        )}
                                                    />

                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>{(budget.utilization * 100).toFixed(1)}% used</span>
                                                        <span>${budget.remaining_usd.toFixed(2)} remaining</span>
                                                    </div>

                                                    {budget.status !== 'normal' && (
                                                        <div className={cn(
                                                            'text-sm p-2 rounded-md',
                                                            budget.status === 'exceeded' && 'bg-red-50 text-red-700',
                                                            budget.status === 'warning' && 'bg-yellow-50 text-yellow-700'
                                                        )}>
                                                            {budget.status === 'exceeded'
                                                                ? '⚠️ Budget exceeded! Review AI usage immediately.'
                                                                : `⚠️ Warning: ${(budget.alert_threshold * 100).toFixed(0)}% threshold reached.`}
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pricing Tab */}
                <TabsContent value="pricing" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Provider Pricing</CardTitle>
                            <CardDescription>Current token costs per provider</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Provider</TableHead>
                                        <TableHead>Model</TableHead>
                                        <TableHead>Prompt</TableHead>
                                        <TableHead>Completion</TableHead>
                                        <TableHead>Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {providerCosts?.map((cost) => (
                                        <TableRow key={cost.id}>
                                            <TableCell className="font-medium capitalize">{cost.provider}</TableCell>
                                            <TableCell>{cost.model}</TableCell>
                                            <TableCell className="font-mono text-sm">
                                                ${cost.prompt_token_cost.toFixed(8)}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                ${cost.completion_token_cost.toFixed(8)}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {cost.notes}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Optimization Tab */}
                <TabsContent value="optimization" className="space-y-4">
                    <CostOptimizationPanel />
                </TabsContent>
            </Tabs>
        </div>
    );
}
