import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Users, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  status: 'available' | 'busy' | 'away' | 'offline';
  workload: number; // 0-100 percentage
  tasksAssigned: number;
  hoursAllocated: number;
}

interface TeamAvailabilitySectionProps {
  members: TeamMember[];
  summary?: {
    totalMembers: number;
    available: number;
    overloaded: number;
    averageWorkload: number;
  };
}

export function TeamAvailabilitySection({ members, summary }: TeamAvailabilitySectionProps) {
  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'away':
        return 'bg-orange-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getWorkloadColor = (workload: number) => {
    if (workload > 100) return 'text-red-600 dark:text-red-400';
    if (workload > 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No team members assigned</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-4 gap-2">
          <Card className="p-2 text-center">
            <p className="text-lg font-bold">{summary.totalMembers}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </Card>
          <Card className="p-2 text-center">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {summary.available}
            </p>
            <p className="text-xs text-muted-foreground">Available</p>
          </Card>
          <Card className="p-2 text-center">
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {summary.overloaded}
            </p>
            <p className="text-xs text-muted-foreground">Overloaded</p>
          </Card>
          <Card className="p-2 text-center">
            <p className="text-lg font-bold">{summary.averageWorkload}%</p>
            <p className="text-xs text-muted-foreground">Avg Load</p>
          </Card>
        </div>
      )}

      {/* Team Members */}
      <div className="space-y-2">
        {members.map(member => (
          <Card
            key={member.id}
            className={cn(
              'p-3',
              member.workload > 100 && 'border-red-500/50 bg-red-50/50 dark:bg-red-900/10'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>
                    {member.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
                    getStatusColor(member.status)
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{member.name}</span>
                  {member.workload > 100 && (
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{member.role}</span>
                  <span>•</span>
                  <span>{member.tasksAssigned} tasks</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className={cn('text-sm font-medium', getWorkloadColor(member.workload))}>
                  {member.workload}%
                </p>
                <p className="text-xs text-muted-foreground">{member.hoursAllocated}h</p>
              </div>
            </div>

            <Progress
              value={Math.min(member.workload, 100)}
              className={cn(
                'h-1.5 mt-2',
                member.workload > 100
                  ? '[&>div]:bg-red-500'
                  : member.workload > 80
                  ? '[&>div]:bg-yellow-500'
                  : ''
              )}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
