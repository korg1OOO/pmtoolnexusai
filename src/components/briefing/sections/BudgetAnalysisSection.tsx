import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetData {
  totalBudget: number;
  spent: number;
  committed: number;
  remaining: number;
  burnRate: number;
  costVariance: number; // CV - positive is good
  scheduleVariance: number; // SV - positive is good
  estimateAtCompletion: number;
  estimateToComplete: number;
  forecasts: {
    optimistic: number;
    likely: number;
    pessimistic: number;
  };
}

interface BudgetAnalysisSectionProps {
  data: BudgetData;
}

export function BudgetAnalysisSection({ data }: BudgetAnalysisSectionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const spentPercentage = Math.round((data.spent / data.totalBudget) * 100);
  const committedPercentage = Math.round(
    ((data.spent + data.committed) / data.totalBudget) * 100
  );

  const isOverBudget = data.estimateAtCompletion > data.totalBudget;
  const cvPositive = data.costVariance >= 0;
  const svPositive = data.scheduleVariance >= 0;

  return (
    <div className="space-y-4">
      {/* Budget Overview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Budget Utilization</span>
          <span className="text-sm font-medium">{spentPercentage}% spent</span>
        </div>
        <div className="relative">
          <Progress value={spentPercentage} className="h-3" />
          <div
            className="absolute top-0 left-0 h-3 bg-yellow-500/50 rounded-full"
            style={{ width: `${Math.min(committedPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Spent: {formatCurrency(data.spent)}</span>
          <span>Committed: {formatCurrency(data.committed)}</span>
          <span>Remaining: {formatCurrency(data.remaining)}</span>
        </div>
      </div>

      {/* Variance Indicators */}
      <div className="grid grid-cols-2 gap-2">
        <Card
          className={cn(
            'p-3',
            cvPositive
              ? 'bg-green-50 dark:bg-green-900/20'
              : 'bg-red-50 dark:bg-red-900/20'
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            {cvPositive ? (
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
            <span className="text-xs text-muted-foreground">Cost Variance</span>
          </div>
          <p
            className={cn(
              'text-lg font-bold',
              cvPositive
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
            )}
          >
            {cvPositive ? '+' : ''}
            {formatCurrency(data.costVariance)}
          </p>
        </Card>

        <Card
          className={cn(
            'p-3',
            svPositive
              ? 'bg-green-50 dark:bg-green-900/20'
              : 'bg-red-50 dark:bg-red-900/20'
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            {svPositive ? (
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
            <span className="text-xs text-muted-foreground">Schedule Variance</span>
          </div>
          <p
            className={cn(
              'text-lg font-bold',
              svPositive
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
            )}
          >
            {svPositive ? '+' : ''}
            {formatCurrency(data.scheduleVariance)}
          </p>
        </Card>
      </div>

      {/* Forecasts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Estimate at Completion</span>
          <div className="flex items-center gap-2">
            {isOverBudget && <AlertTriangle className="h-4 w-4 text-red-500" />}
            <span
              className={cn(
                'font-bold',
                isOverBudget ? 'text-red-600 dark:text-red-400' : ''
              )}
            >
              {formatCurrency(data.estimateAtCompletion)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Estimate to Complete</span>
          <span>{formatCurrency(data.estimateToComplete)}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Current Burn Rate</span>
          <span>{formatCurrency(data.burnRate)}/week</span>
        </div>
      </div>

      {/* Scenario Forecasts */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-2 text-center">
          <p className="text-xs text-muted-foreground mb-1">Optimistic</p>
          <p className="font-semibold text-sm text-green-600 dark:text-green-400">
            {formatCurrency(data.forecasts.optimistic)}
          </p>
        </Card>
        <Card className="p-2 text-center border-primary">
          <p className="text-xs text-muted-foreground mb-1">Likely</p>
          <p className="font-semibold text-sm">{formatCurrency(data.forecasts.likely)}</p>
        </Card>
        <Card className="p-2 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pessimistic</p>
          <p className="font-semibold text-sm text-red-600 dark:text-red-400">
            {formatCurrency(data.forecasts.pessimistic)}
          </p>
        </Card>
      </div>
    </div>
  );
}
