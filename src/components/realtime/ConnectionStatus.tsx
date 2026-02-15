/**
 * ConnectionStatus Component
 * Visual indicator for real-time connection status
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { realtimeService } from '@/services/realtimeService';
import type { ConnectionState } from '@/types/realtime';
import { formatDistanceToNow } from 'date-fns';

interface ConnectionStatusProps {
    className?: string;
    compact?: boolean;
}

export function ConnectionStatus({ className, compact = true }: ConnectionStatusProps) {
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeChannels, setActiveChannels] = useState(0);

    useEffect(() => {
        // Subscribe to connection state changes
        const unsubscribe = realtimeService.onConnectionStateChange((state) => {
            setConnectionState(state);
            if (state === 'connected') {
                setLastSync(new Date());
            }
            setActiveChannels(realtimeService.getActiveChannelCount());
        });

        // Initial state
        setConnectionState(realtimeService.getConnectionState());
        setActiveChannels(realtimeService.getActiveChannelCount());

        return unsubscribe;
    }, []);

    const getStatusConfig = () => {
        switch (connectionState) {
            case 'connected':
                return {
                    icon: Wifi,
                    color: 'text-green-500',
                    bgColor: 'bg-green-500/10',
                    label: 'Connected',
                    variant: 'default' as const
                };
            case 'connecting':
                return {
                    icon: RefreshCw,
                    color: 'text-yellow-500',
                    bgColor: 'bg-yellow-500/10',
                    label: 'Connecting...',
                    variant: 'secondary' as const
                };
            case 'error':
                return {
                    icon: WifiOff,
                    color: 'text-red-500',
                    bgColor: 'bg-red-500/10',
                    label: 'Error',
                    variant: 'destructive' as const
                };
            default:
                return {
                    icon: WifiOff,
                    color: 'text-gray-500',
                    bgColor: 'bg-gray-500/10',
                    label: 'Disconnected',
                    variant: 'outline' as const
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    const handleReconnect = async () => {
        await realtimeService.reconnect();
    };

    if (compact && !isExpanded) {
        return (
            <div className={cn('flex items-center gap-2', className)}>
                <Badge
                    variant={config.variant}
                    className={cn('flex items-center gap-1.5 cursor-pointer', config.bgColor)}
                    onClick={() => setIsExpanded(true)}
                >
                    <Icon className={cn('h-3 w-3', config.color, connectionState === 'connecting' && 'animate-spin')} />
                    <span>{config.label}</span>
                    {lastSync && connectionState === 'connected' && (
                        <span className="text-xs opacity-70">
                            • {formatDistanceToNow(lastSync, { addSuffix: true })}
                        </span>
                    )}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Badge>
            </div>
        );
    }

    return (
        <Card className={cn('p-4', className)}>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className={cn('h-5 w-5', config.color, connectionState === 'connecting' && 'animate-spin')} />
                        <span className="font-medium">Real-Time Connection</span>
                    </div>
                    {compact && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(false)}
                            className="h-6 w-6 p-0"
                        >
                            <ChevronUp className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Status Details */}
                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={config.variant} className={config.bgColor}>
                            {config.label}
                        </Badge>
                    </div>

                    {lastSync && (
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Last sync:</span>
                            <span>{formatDistanceToNow(lastSync, { addSuffix: true })}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Active channels:</span>
                        <span>{activeChannels}</span>
                    </div>
                </div>

                {/* Actions */}
                {(connectionState === 'disconnected' || connectionState === 'error') && (
                    <Button
                        onClick={handleReconnect}
                        size="sm"
                        className="w-full"
                        variant="outline"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reconnect
                    </Button>
                )}
            </div>
        </Card>
    );
}
