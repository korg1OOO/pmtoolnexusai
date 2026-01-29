import React from 'react';
import { Table2, Link } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface LinkedSpreadsheetIconProps {
  isLinked: boolean;
  className?: string;
}

export function LinkedSpreadsheetIcon({ isLinked, className }: LinkedSpreadsheetIconProps) {
  if (!isLinked) {
    return <Table2 className={cn('h-3.5 w-3.5 text-green-500', className)} />;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative inline-flex">
          <Table2 className={cn('h-3.5 w-3.5 text-blue-500', className)} />
          <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-500 flex items-center justify-center">
            <Link className="h-1.5 w-1.5 text-white" />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Linked to Project Plan</p>
      </TooltipContent>
    </Tooltip>
  );
}
