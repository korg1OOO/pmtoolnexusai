import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfitLossData {
  expectedProfit: number;
  expectedLoss: number;
  currentBurnRate: number;
  projectedCompletion: number;
  scenarios: {
    optimistic: number;
    likely: number;
    pessimistic: number;
  };
  riskFactors: string[];
  budgetUtilization: number;
}

interface ProfitLossSectionProps {
  data: ProfitLossData;
}

export function ProfitLossSection({ data }: ProfitLossSectionProps) {
  const netProjection = data.expectedProfit - data.expectedLoss;
  const isPositive = netProjection >= 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Main Projection */}
      <div
        className={cn(
          'flex items-center justify-between p-4 rounded-lg border',
          isPositive
            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
        )}
      >
        <div className="flex items-center gap-3">
          {isPositive ? (
            <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
          )}
          <div>
            <p className="text-sm text-muted-foreground">Expected Net Outcome</p>
            <p
              className={cn(
                'text-2xl font-bold',
                isPositive
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'
              )}
            >
              {isPositive ? '+' : ''}
              {formatCurrency(netProjection)}
            </p>
          </div>
        </div>
        <Badge variant={isPositive ? 'default' : 'destructive'}>
          {isPositive ? 'Profit' : 'Loss'}
        </Badge>
      </div>

      {/* Scenarios */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Optimistic</p>
          <p className="font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(data.scenarios.optimistic)}
          </p>
        </Card>
        <Card className="p-3 text-center border-primary">
          <p className="text-xs text-muted-foreground mb-1">Likely</p>
          <p className="font-semibold">{formatCurrency(data.scenarios.likely)}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pessimistic</p>
          <p className="font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(data.scenarios.pessimistic)}
          </p>
        </Card>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Current Burn Rate</span>
          </div>
          <span className="font-medium">{formatCurrency(data.currentBurnRate)}/week</span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm">Budget Utilization</span>
            <span className="text-sm font-medium">{data.budgetUtilization}%</span>
          </div>
          <Progress
            value={data.budgetUtilization}
            className={cn(
              data.budgetUtilization > 90 ? '[&>div]:bg-destructive' : ''
            )}
          />
        </div>
      </div>

      {/* Risk Factors */}
      {data.riskFactors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Risk Factors Affecting Projection
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {data.riskFactors.map((factor, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
