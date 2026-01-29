import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertTriangle, ArrowRight, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlippingTask {
  id: string;
  name: string;
  baselineEnd: string;
  currentEnd: string;
  slippageDays: number;
  isCritical: boolean;
  impact: string;
}

interface ScheduleSlippageData {
  totalSlippageDays: number;
  criticalPathChanged: boolean;
  slippingTasks: SlippingTask[];
  atRiskMilestones: {
    name: string;
    date: string;
    riskLevel: 'low' | 'medium' | 'high';
  }[];
  cascadingDelays: string[];
}

interface ScheduleSlippageSectionProps {
  data: ScheduleSlippageData;
}

export function ScheduleSlippageSection({ data }: ScheduleSlippageSectionProps) {
  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm">Total Schedule Slippage</span>
        </div>
        <Badge
          variant={data.totalSlippageDays > 0 ? 'destructive' : 'default'}
          className="text-sm"
        >
          {data.totalSlippageDays > 0 ? `+${data.totalSlippageDays} days` : 'On Track'}
        </Badge>
      </div>

      {data.criticalPathChanged && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10">
          <GitBranch className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
            Critical path has changed since last review
          </span>
        </div>
      )}

      {/* Slipping Tasks */}
      {data.slippingTasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Tasks Slipping from Baseline</h4>
          <div className="space-y-2">
            {data.slippingTasks.map(task => (
              <Card key={task.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{task.name}</span>
                      {task.isCritical && (
                        <Badge variant="destructive" className="text-xs">
                          Critical
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(task.baselineEnd).toLocaleDateString()}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="text-red-600 dark:text-red-400">
                        {new Date(task.currentEnd).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{task.impact}</p>
                  </div>
                  <Badge variant="outline" className="text-red-600 dark:text-red-400">
                    +{task.slippageDays}d
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* At-Risk Milestones */}
      {data.atRiskMilestones.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Milestones at Risk
          </h4>
          <div className="space-y-1">
            {data.atRiskMilestones.map((milestone, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded border"
              >
                <span className="text-sm">{milestone.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(milestone.date).toLocaleDateString()}
                  </span>
                  <Badge className={cn('text-xs', getRiskColor(milestone.riskLevel))}>
                    {milestone.riskLevel}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cascading Delays */}
      {data.cascadingDelays.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Dependencies Causing Delays</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {data.cascadingDelays.map((delay, index) => (
              <li key={index} className="flex items-start gap-2">
                <GitBranch className="h-4 w-4 shrink-0 mt-0.5" />
                {delay}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.slippingTasks.length === 0 && data.atRiskMilestones.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Schedule is on track</p>
        </div>
      )}
    </div>
  );
}
