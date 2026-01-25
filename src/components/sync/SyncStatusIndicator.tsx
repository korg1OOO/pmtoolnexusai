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

export type SyncStatus = 'synced' | 'syncing' | 'partial' | 'failed' | 'pending';

interface SyncHistoryEntry {
  id: string;
  timestamp: string;
  status: SyncStatus;
  message: string;
  itemsProcessed?: number;
  itemsTotal?: number;
  errors?: string[];
}

const mockSyncHistory: SyncHistoryEntry[] = [
  {
    id: 'sync-1',
    timestamp: '2024-01-20T14:30:00Z',
    status: 'synced',
    message: 'All items synchronized successfully',
    itemsProcessed: 12,
    itemsTotal: 12,
  },
  {
    id: 'sync-2',
    timestamp: '2024-01-20T10:15:00Z',
    status: 'synced',
    message: 'Sprint items linked to plan tasks',
    itemsProcessed: 8,
    itemsTotal: 8,
  },
  {
    id: 'sync-3',
    timestamp: '2024-01-19T16:45:00Z',
    status: 'partial',
    message: 'Some items could not be synced',
    itemsProcessed: 5,
    itemsTotal: 7,
    errors: ['ISS-003: Missing assignee', 'ACT-004: Invalid status'],
  },
  {
    id: 'sync-4',
    timestamp: '2024-01-19T09:00:00Z',
    status: 'failed',
    message: 'Sync failed due to connection timeout',
    itemsProcessed: 0,
    itemsTotal: 10,
    errors: ['Connection timeout after 30s'],
  },
  {
    id: 'sync-5',
    timestamp: '2024-01-18T14:00:00Z',
    status: 'synced',
    message: 'Initial synchronization complete',
    itemsProcessed: 15,
    itemsTotal: 15,
  },
];

const statusConfig: Record<SyncStatus, { icon: React.ElementType; color: string; label: string }> = {
  synced: { icon: Check, color: 'text-success', label: 'Synced' },
  syncing: { icon: RefreshCw, color: 'text-primary', label: 'Syncing...' },
  partial: { icon: AlertTriangle, color: 'text-warning', label: 'Partial Sync' },
  failed: { icon: X, color: 'text-destructive', label: 'Failed' },
  pending: { icon: Clock, color: 'text-muted-foreground', label: 'Pending' },
};

interface SyncStatusIndicatorProps {
  status?: SyncStatus;
  lastSynced?: string;
  onSync?: () => void;
  showHistory?: boolean;
  compact?: boolean;
  className?: string;
}

export function SyncStatusIndicator({
  status = 'synced',
  lastSynced = '2024-01-20T14:30:00Z',
  onSync,
  showHistory = true,
  compact = false,
  className,
}: SyncStatusIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const config = statusConfig[isSyncing ? 'syncing' : status];
  const StatusIcon = config.icon;

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    onSync?.();
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSyncing(false);
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
            history={mockSyncHistory}
            onSync={handleSync}
            isSyncing={isSyncing}
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
              history={mockSyncHistory}
              onSync={handleSync}
              isSyncing={isSyncing}
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
}

function SyncHistoryPanel({ history, onSync, isSyncing }: SyncHistoryPanelProps) {
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
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{entry.message}</p>
                    {entry.itemsTotal && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.itemsProcessed}/{entry.itemsTotal} items processed
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
      </ScrollArea>
    </div>
  );
}
