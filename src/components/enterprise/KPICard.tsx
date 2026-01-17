import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  className?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  status = 'neutral',
  className,
}: KPICardProps) {
  const statusColors = {
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-destructive',
    info: 'text-info',
    neutral: 'text-foreground',
  };

  const statusBg = {
    success: 'bg-success/10',
    warning: 'bg-warning/10',
    error: 'bg-destructive/10',
    info: 'bg-info/10',
    neutral: 'bg-muted',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card p-5 transition-all duration-200 hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className={cn('text-2xl font-bold tracking-tight', statusColors[status])}>
              {value}
            </span>
            {trend && (
              <span
                className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  trend.isPositive !== false ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.isPositive !== false ? '↑' : '↓'} {Math.abs(trend.value)}%
                {trend.label && <span className="text-muted-foreground ml-1">{trend.label}</span>}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={cn('rounded-lg p-2.5', statusBg[status])}>
            <Icon className={cn('h-5 w-5', statusColors[status])} />
          </div>
        )}
      </div>
    </div>
  );
}
