/**
 * OfflineIndicator Component
 * Show offline status and pending sync queue
 */

import React from 'react';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface OfflineIndicatorProps {
    className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
    const { isOnline, queueSize, isSyncing, sync } = useOfflineSync();

    if (isOnline && queueSize === 0) {
        return null; // Don't show anything when online and queue is empty
    }

    return (
        <Alert className={cn('border-yellow-500 bg-yellow-50', className)}>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {!isOnline && (
                        <>
                            <WifiOff className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium">Offline</span>
                        </>
                    )}
                    {queueSize > 0 && (
                        <Badge variant="secondary" className="ml-2">
                            {queueSize} {queueSize === 1 ? 'change' : 'changes'} queued
                        </Badge>
                    )}
                </div>

                {isOnline && queueSize > 0 && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={sync}
                        disabled={isSyncing}
                        className="ml-4"
                    >
                        {isSyncing ? (
                            <>
                                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                                Syncing...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-3 w-3 mr-2" />
                                Retry Sync
                            </>
                        )}
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
}
