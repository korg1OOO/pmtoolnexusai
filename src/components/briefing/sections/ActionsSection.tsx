import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckSquare, Clock, AlertTriangle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Action {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: 'open' | 'in-progress' | 'overdue' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  source: string;
}

interface ActionsSectionProps {
  actions: Action[];
}

export function ActionsSection({ actions }: ActionsSectionProps) {
  const overdueActions = actions.filter(a => a.status === 'overdue');
  const dueTodayActions = actions.filter(
    a =>
      a.status !== 'overdue' &&
      a.status !== 'completed' &&
      new Date(a.dueDate).toDateString() === new Date().toDateString()
  );
  const upcomingActions = actions.filter(
    a =>
      a.status !== 'overdue' &&
      a.status !== 'completed' &&
      new Date(a.dueDate) > new Date() &&
      new Date(a.dueDate).toDateString() !== new Date().toDateString()
  );

  const getPriorityColor = (priority: Action['priority']) => {
    switch (priority) {
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

  const renderActionCard = (action: Action) => (
    <Card
      key={action.id}
      className={cn(
        'p-3',
        action.status === 'overdue' && 'border-red-500/50 bg-red-50/50 dark:bg-red-900/10'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{action.title}</span>
            {action.status === 'overdue' && (
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {action.assignee}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(action.dueDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        <Badge className={cn('text-xs shrink-0', getPriorityColor(action.priority))}>
          {action.priority}
        </Badge>
      </div>
    </Card>
  );

  if (actions.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No pending actions</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {overdueActions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h4 className="text-sm font-medium text-red-600 dark:text-red-400">
              Overdue ({overdueActions.length})
            </h4>
          </div>
          <div className="space-y-2">
            {overdueActions.map(renderActionCard)}
          </div>
        </div>
      )}

      {dueTodayActions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Due Today ({dueTodayActions.length})</h4>
          <div className="space-y-2">
            {dueTodayActions.map(renderActionCard)}
          </div>
        </div>
      )}

      {upcomingActions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Upcoming ({upcomingActions.length})
          </h4>
          <div className="space-y-2">
            {upcomingActions.slice(0, 3).map(renderActionCard)}
          </div>
        </div>
      )}
    </div>
  );
}
