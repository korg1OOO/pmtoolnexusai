import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileText,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useFinancials } from '@/hooks/useFinancials';
import { useResources } from '@/hooks/useResources';
import { AddBudgetItemDialog } from '@/components/financials/AddBudgetItemDialog';
import { AddInvoiceDialog } from '@/components/financials/AddInvoiceDialog';

const budgetColors = {
  Personnel: 'bg-blue-500',
  Contractors: 'bg-purple-500',
  Infrastructure: 'bg-cyan-500',
  Software: 'bg-green-500',
  Training: 'bg-orange-500',
  Contingency: 'bg-gray-500',
} as const;

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function FinancialsView() {
  const { settings } = useProjectContext();
  const { budget, invoices, isLoading: isFinancialsLoading } = useFinancials(settings.id);
  const { data: resources, isLoading: isResourcesLoading } = useResources(settings.id);

  const totalPlanned = budget.reduce((sum, item) => sum + (item.planned || 0), 0);
  const totalForecast = budget.reduce((sum, item) => sum + (item.forecast || 0), 0);
  const totalActual = budget.reduce((sum, item) => sum + (item.actual || 0), 0);
  const totalVariance = budget.reduce((sum, item) => sum + (item.variance || 0), 0);

  // Calculate project duration in months
  const projectDurationMonths = useMemo(() => {
    if (!settings.startDate || !settings.endDate) return 12; // Default to 12 if missing dates
    const start = new Date(settings.startDate);
    const end = new Date(settings.endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.max(1, months);
  }, [settings.startDate, settings.endDate]);

  // Calculate elapsed months
  const elapsedMonths = useMemo(() => {
    if (!settings.startDate) return 0;
    const start = new Date(settings.startDate);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return Math.max(0, months);
  }, [settings.startDate]);

  // Burn Rate Calculation
  // If we have elapsed time, burn rate = actual / elapsed
  // If not, simplified assumption 
  const burnRate = elapsedMonths > 0 ? totalActual / elapsedMonths : (totalActual > 0 ? totalActual : 0);
  const projectedTotal = totalActual + (burnRate * Math.max(0, projectDurationMonths - elapsedMonths));

  if (isFinancialsLoading || isResourcesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Overview</h1>
          <p className="text-muted-foreground">Budget tracking and billing management for {settings.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <AddInvoiceDialog />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total Budget</span>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalPlanned)}</div>
            <p className="text-xs text-muted-foreground mt-1">Approved amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Spent to Date</span>
              <TrendingDown className="h-5 w-5 text-primary" />
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalActual)}</div>
            <div className="flex items-center gap-1 mt-1">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Budget Variance</span>
              {totalVariance >= 0 ? (
                <ArrowDownRight className="h-5 w-5 text-success" />
              ) : (
                <ArrowUpRight className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div className={cn('text-2xl font-bold', totalVariance >= 0 ? 'text-success' : 'text-destructive')}>
              {totalVariance >= 0 ? '+' : ''}{formatCurrency(totalVariance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalVariance >= 0 ? 'Under budget' : 'Over budget'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Burn Rate</span>
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
            <div className="text-2xl font-bold">{formatCurrency(burnRate)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per month average</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="budget">
        <TabsList>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Budget Breakdown Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Budget Breakdown</CardTitle>
                <AddBudgetItemDialog />
              </CardHeader>
              <CardContent>
                {budget.length > 0 ? (
                  <div className="space-y-4">
                    {budget.map((item) => {
                      const spentPercent = item.planned > 0 ? (item.actual / item.planned) * 100 : 0;
                      const forecastPercent = item.planned > 0 ? (item.forecast / item.planned) * 100 : 0;
                      return (
                        <div key={item.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={cn('h-3 w-3 rounded-full', budgetColors[item.category as keyof typeof budgetColors] || 'bg-gray-400')} />
                              <span className="text-sm font-medium">{item.category}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">
                                {formatCurrency(item.actual)} / {formatCurrency(item.planned)}
                              </span>
                              <span className={cn(
                                'font-medium',
                                (item.variance || 0) >= 0 ? 'text-success' : 'text-destructive'
                              )}>
                                {(item.variance || 0) >= 0 ? '+' : ''}{formatCurrency(item.variance || 0)}
                              </span>
                            </div>
                          </div>
                          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="absolute h-full bg-muted-foreground/20 rounded-full"
                              style={{ width: `${Math.min(forecastPercent, 100)}%` }}
                            />
                            <div
                              className={cn(
                                'absolute h-full rounded-full',
                                budgetColors[item.category as keyof typeof budgetColors] || 'bg-gray-400'
                              )}
                              style={{ width: `${Math.min(spentPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                    No budget items configured
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Summary */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Budget Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-4">
                    <div className="relative">
                      <svg width="120" height="120" className="transform -rotate-90">
                        <circle
                          className="stroke-muted"
                          strokeWidth="12"
                          fill="transparent"
                          r="50"
                          cx="60"
                          cy="60"
                        />
                        <circle
                          className={cn(
                            "transition-all duration-500",
                            totalActual <= totalPlanned ? "stroke-success" : "stroke-destructive"
                          )}
                          strokeWidth="12"
                          strokeDasharray={2 * Math.PI * 50}
                          strokeDashoffset={2 * Math.PI * 50 * (1 - Math.min(totalActual / (totalPlanned || 1), 1))}
                          strokeLinecap="round"
                          fill="transparent"
                          r="50"
                          cx="60"
                          cy="60"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold">
                          {totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0}%
                        </span>
                        <span className="text-xs text-muted-foreground">Utilized</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {totalActual <= totalPlanned ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm">On Track</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-sm">Over Budget</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card variant="muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Projection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projected Total</span>
                    <span className="font-medium">{formatCurrency(projectedTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">vs. Budget</span>
                    <span className={cn(
                      'font-medium',
                      projectedTotal <= totalPlanned ? 'text-success' : 'text-destructive'
                    )}>
                      {projectedTotal <= totalPlanned ? 'Under' : 'Over'} by {formatCurrency(Math.abs(totalPlanned - projectedTotal))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Invoices</CardTitle>
              <AddInvoiceDialog />
            </CardHeader>
            <CardContent>
              {invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{invoice.invoice_number}</span>
                            <Badge variant={invoice.status === 'paid' ? 'success' : invoice.status === 'sent' ? 'default' : 'secondary'}>
                              {invoice.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{invoice.milestone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold font-mono">{formatCurrency(invoice.amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                  No invoices found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Forecast visualization based on real data</p>
                  <p className="text-sm">Based on burn rate of {formatCurrency(burnRate)}/month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resource Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resource Costs</CardTitle>
        </CardHeader>
        <CardContent>
          {resources && resources.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3 font-medium">Resource</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium text-right">Standard Rate</th>
                    <th className="pb-3 font-medium text-right">Cost Per Use</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource) => (
                    <tr key={resource.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                            {resource.name ? resource.name.split(' ').map(n => n[0]).join('') : '?'}
                          </div>
                          <span className="font-medium">{resource.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground capitalize">{resource.type}</td>
                      <td className="py-3 text-right font-mono">${resource.standard_rate}/hr</td>
                      <td className="py-3 text-right font-mono font-medium">${resource.cost_per_use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              No resources allocated
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
