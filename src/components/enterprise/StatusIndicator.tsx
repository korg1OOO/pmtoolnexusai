import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type HealthStatus = 'green' | 'amber' | 'red';

export interface StatusIndicatorProps {
  status: HealthStatus;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

export const StatusIndicator = forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ status, label, size = 'md', pulse = false, className }, ref) => {
    const sizeClasses = {
      sm: 'h-2 w-2',
      md: 'h-3 w-3',
      lg: 'h-4 w-4',
    };

    const statusColors = {
      green: 'bg-success',
      amber: 'bg-warning',
      red: 'bg-destructive',
    };

    const statusLabels = {
      green: 'On Track',
      amber: 'At Risk',
      red: 'Critical',
    };

    return (
      <div ref={ref} className={cn('flex items-center gap-2', className)}>
        <span className="relative flex">
          <span
            className={cn(
              'rounded-full',
              sizeClasses[size],
              statusColors[status],
              pulse && 'animate-pulse'
            )}
          />
          {pulse && (
            <span
              className={cn(
                'absolute inset-0 rounded-full opacity-75 animate-ping',
                statusColors[status]
              )}
            />
          )}
        </span>
        {label !== undefined ? (
          <span className="text-sm font-medium">{label}</span>
        ) : (
          <span className="text-sm font-medium">{statusLabels[status]}</span>
        )}
      </div>
    );
  }
);

StatusIndicator.displayName = 'StatusIndicator';
