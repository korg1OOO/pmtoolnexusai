import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Issue {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved';
  owner: string;
  createdDate: string;
  trending?: 'escalating' | 'stable' | 'improving';
}

interface IssuesSectionProps {
  issues: Issue[];
  summary?: {
    total: number;
    critical: number;
    new: number;
    resolved: number;
  };
}

export function IssuesSection({ issues, summary }: IssuesSectionProps) {
  const getSeverityColor = (severity: Issue['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  const getTrendIcon = (trend?: Issue['trending']) => {
    switch (trend) {
      case 'escalating':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'improving':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (issues.length === 0 && !summary) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No open issues</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-4 gap-2">
          <Card className="p-2 text-center">
            <p className="text-lg font-bold">{summary.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </Card>
          <Card className="p-2 text-center border-red-500/50">
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {summary.critical}
            </p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </Card>
          <Card className="p-2 text-center">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {summary.new}
            </p>
            <p className="text-xs text-muted-foreground">New</p>
          </Card>
          <Card className="p-2 text-center">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {summary.resolved}
            </p>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </Card>
        </div>
      )}

      {/* Issue List */}
      {issues.length > 0 && (
        <div className="space-y-2">
          {issues.map(issue => (
            <Card
              key={issue.id}
              className={cn(
                'p-3',
                issue.severity === 'critical' &&
                  'border-red-500/50 bg-red-50/50 dark:bg-red-900/10'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{issue.title}</span>
                    {getTrendIcon(issue.trending)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{issue.owner}</span>
                    <span>•</span>
                    <span>{new Date(issue.createdDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge className={cn('text-xs shrink-0', getSeverityColor(issue.severity))}>
                  {issue.severity}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
