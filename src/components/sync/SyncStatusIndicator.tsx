import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  RefreshCw,
  Check,
  AlertTriangle,
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSyncHistory, useLatestSync, useTriggerSync, type SyncHistoryEntry } from '@/hooks/useSyncHistory';

// Mock data removed - now using live database via useSyncHistory hook

const statusConfig: Record<SyncStatus, { icon: React.ElementType; color: string; label: string }> = {
  synced: { icon: Check, color: 'text-success', label: 'Synced' },
  syncing: { icon: RefreshCw, color: 'text-primary', label: 'Syncing...' },
  partial: { icon: AlertTriangle, color: 'text-warning', label: 'Partial Sync' },
  failed: { icon: X, color: 'text-destructive', label: 'Failed' },
  pending: { icon: Clock, color: 'text-muted-foreground', label: 'Pending' },
};


interface SyncStatusIndicatorProps {
  projectId?: string;
  status?: SyncStatus;
  onSync?: () => void;
  showHistory?: boolean;
  compact?: boolean;
  className?: string;
}

export function SyncStatusIndicator({
  projectId,
  status: externalStatus,
  onSync,
  showHistory = true,
  compact = false,
  className,
}: SyncStatusIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch sync history and latest sync
  const { data: syncHistory = [], isLoading } = useSyncHistory(projectId);
  const { data: latestSync } = useLatestSync(projectId);
  const triggerSync = useTriggerSync(projectId);

  // Use external status or derive from latest sync
  const currentStatus = externalStatus || latestSync?.status || 'synced';
  const lastSynced = latestSync?.created_at || new Date().toISOString();
  const isSyncing = triggerSync.isPending || currentStatus === 'syncing';

  const config = statusConfig[isSyncing ? 'syncing' : currentStatus];
  const StatusIcon = config.icon;

  const handleSync = async () => {
    if (isSyncing) return;
    onSync?.();
    await triggerSync.mutateAsync();
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (compact) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-7 px-2 gap-1', className)}
          >
            <StatusIcon className={cn(
              'h-3.5 w-3.5',
              config.color,
              isSyncing && 'animate-spin'
            )} />
            <span className="text-xs">{formatRelativeTime(lastSynced)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80">
          <SyncHistoryPanel
            history={syncHistory}
            onSync={handleSync}
            isSyncing={isSyncing}
            isLoading={isLoading}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <StatusIcon className={cn(
              'h-4 w-4',
              config.color,
              isSyncing && 'animate-spin'
            )} />
            <span>{config.label}</span>
            <span className="text-muted-foreground text-xs">
              {formatRelativeTime(lastSynced)}
            </span>
            {showHistory && (
              isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </PopoverTrigger>
        {showHistory && (
          <PopoverContent align="end" className="w-96">
            <SyncHistoryPanel
              history={syncHistory}
              onSync={handleSync}
              isSyncing={isSyncing}
              isLoading={isLoading}
            />
          </PopoverContent>
        )}
      </Popover>

      <Button
        variant="ghost"
        size="iconSm"
        onClick={handleSync}
        disabled={isSyncing}
      >
        <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
      </Button>
    </div>
  );
}

interface SyncHistoryPanelProps {
  history: SyncHistoryEntry[];
  onSync: () => void;
  isSyncing: boolean;
  isLoading?: boolean;
}

function SyncHistoryPanel({ history, onSync, isSyncing, isLoading }: SyncHistoryPanelProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <History className="h-4 w-4" />
          Sync History
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={isSyncing}
        >
          <RefreshCw className={cn('h-3 w-3 mr-1', isSyncing && 'animate-spin')} />
          Sync Now
        </Button>
      </div>

      <ScrollArea className="h-64">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-4">
            <History className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No sync history yet</p>
            <p className="text-xs mt-1">Sync events will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => {
              const config = statusConfig[entry.status];
              const StatusIcon = config.icon;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                      entry.status === 'synced' ? 'bg-success/10' :
                        entry.status === 'partial' ? 'bg-warning/10' :
                          entry.status === 'failed' ? 'bg-destructive/10' : 'bg-muted'
                    )}>
                      <StatusIcon className={cn('h-4 w-4', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={
                          entry.status === 'synced' ? 'success' :
                            entry.status === 'partial' ? 'warning' :
                              entry.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{entry.message}</p>
                      {entry.items_total && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {entry.items_processed}/{entry.items_total} items processed
                        </p>
                      )}
                      {entry.errors && entry.errors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {entry.errors.map((error, i) => (
                            <p key={i} className="text-xs text-destructive flex items-center gap-1">
                              <X className="h-3 w-3" />
                              {error}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
