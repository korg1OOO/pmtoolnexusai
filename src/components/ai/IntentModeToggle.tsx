import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Zap, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type IntentMode = 'plan' | 'action';

interface IntentModeToggleProps {
  mode: IntentMode;
  onChange: (mode: IntentMode) => void;
  disabled?: boolean;
}

export function IntentModeToggle({ mode, onChange, disabled }: IntentModeToggleProps) {
  return (
    <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/50 border">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onChange('plan')}
            disabled={disabled}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              mode === 'plan'
                ? 'bg-background shadow-sm text-primary'
                : 'text-muted-foreground hover:text-foreground',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Plan
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <p className="text-xs">
            <strong>Plan Mode:</strong> AI will analyze, suggest, and explain without making changes. Good for exploration and understanding options.
          </p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onChange('action')}
            disabled={disabled}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              mode === 'action'
                ? 'bg-background shadow-sm text-primary'
                : 'text-muted-foreground hover:text-foreground',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            Action
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <p className="text-xs">
            <strong>Action Mode:</strong> AI will propose and execute changes after confirmation. Use when you're ready to make modifications.
          </p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button className="p-1 text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[250px]">
          <div className="text-xs space-y-2">
            <p>
              <strong>Plan Mode</strong> is for exploration - asking questions, getting insights, and understanding your options.
            </p>
            <p>
              <strong>Action Mode</strong> is for execution - making changes to schedules, assignments, budgets, etc. Actions require confirmation.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
