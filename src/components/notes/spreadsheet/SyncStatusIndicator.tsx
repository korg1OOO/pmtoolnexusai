import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  RefreshCw,
  Check,
  AlertCircle,
  ChevronDown,
  ArrowLeftRight,
  ArrowRight,
  ArrowLeft,
  Unlink,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { LinkedSpreadsheetInfo } from '@/hooks/useLinkedSpreadsheet';
import { cn } from '@/lib/utils';

interface SyncStatusIndicatorProps {
  linkInfo: LinkedSpreadsheetInfo;
  isSyncing: boolean;
  onSyncToProject: () => void;
  onSyncToSpreadsheet: () => void;
  onUnlink: () => void;
}

export function SyncStatusIndicator({
  linkInfo,
  isSyncing,
  onSyncToProject,
  onSyncToSpreadsheet,
  onUnlink,
}: SyncStatusIndicatorProps) {
  const getStatusIcon = () => {
    if (isSyncing || linkInfo.sync_status === 'syncing') {
      return <RefreshCw className="h-3.5 w-3.5 animate-spin" />;
    }
    if (linkInfo.sync_status === 'error') {
      return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    }
    return <Check className="h-3.5 w-3.5 text-green-500" />;
  };

  const getStatusLabel = () => {
    if (isSyncing || linkInfo.sync_status === 'syncing') {
      return 'Syncing...';
    }
    if (linkInfo.sync_status === 'error') {
      return 'Sync Error';
    }
    return 'Synced';
  };

  const getLastSyncedLabel = () => {
    if (!linkInfo.last_synced_at) return 'Never synced';
    return `Last synced ${formatDistanceToNow(new Date(linkInfo.last_synced_at), { addSuffix: true })}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'gap-1.5 py-1 cursor-default',
              linkInfo.sync_status === 'error' && 'border-destructive text-destructive',
              linkInfo.sync_status === 'synced' && 'border-green-500/50 text-green-600 dark:text-green-400'
            )}
          >
            {getStatusIcon()}
            <span className="text-xs font-normal">{getStatusLabel()}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            {getLastSyncedLabel()}
          </div>
        </TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={isSyncing}>
            <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
            Sync
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onSyncToProject} disabled={isSyncing}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Push to Project Plan
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSyncToSpreadsheet} disabled={isSyncing}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Pull from Project Plan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onUnlink} className="text-destructive">
            <Unlink className="h-4 w-4 mr-2" />
            Unlink Spreadsheet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
