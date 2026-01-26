import React from 'react';
import { cn } from '@/lib/utils';
import { LayoutGrid, GitBranch, Kanban } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type PlanViewMode = 'grid' | 'gantt' | 'board';

interface ViewSwitcherProps {
  value: PlanViewMode;
  onChange: (value: PlanViewMode) => void;
  className?: string;
}

const views = [
  { value: 'grid' as const, label: 'Grid', icon: LayoutGrid },
  { value: 'gantt' as const, label: 'Gantt', icon: GitBranch },
  { value: 'board' as const, label: 'Board', icon: Kanban },
];

export function ViewSwitcher({ value, onChange, className }: ViewSwitcherProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as PlanViewMode)}
      className={cn('bg-muted/50 p-0.5 rounded-lg', className)}
    >
      {views.map((view) => (
        <Tooltip key={view.value} delayDuration={0}>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value={view.value}
              aria-label={view.label}
              className={cn(
                'h-8 px-3 gap-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm',
                'transition-all duration-150'
              )}
            >
              <view.icon className="h-4 w-4" />
              <span className="text-xs font-medium">{view.label}</span>
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {view.label} View
          </TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}
