import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { RefreshCw, MoreVertical, Pin, PinOff, Trash2, Maximize2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { embeddableComponents, EmbeddableComponent } from '@/lib/embeddableComponents';

export interface EmbeddedComponentData {
  id: string;
  componentId: string;
  componentType: string;
  sourceModule: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  dataSnapshot: Record<string, unknown> | null;
  snapshotAt: string | null;
  isLive: boolean;
}

interface EmbeddedDashboardWidgetProps {
  data: EmbeddedComponentData;
  isActive: boolean;
  isEditable: boolean;
  onRefresh: (componentId: string) => void;
  onToggleLive: (componentId: string, isLive: boolean) => void;
  onRemove: (componentId: string) => void;
  onResize?: (componentId: string, newSize: { width: number; height: number }) => void;
}

export function EmbeddedDashboardWidget({
  data,
  isActive,
  isEditable,
  onRefresh,
  onToggleLive,
  onRemove,
}: EmbeddedDashboardWidgetProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const componentDef = embeddableComponents.find((c) => c.id === data.componentId);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh(data.id);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const Icon = componentDef?.icon;

  return (
    <div
      className={cn(
        'relative group rounded-lg border bg-card overflow-hidden transition-all',
        isActive && data.isLive ? 'border-primary/50' : 'border-border',
        !isEditable && 'pointer-events-none'
      )}
      style={{
        width: data.position.width,
        height: data.position.height,
      }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-muted/90 backdrop-blur-sm flex items-center justify-between px-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
          <span className="text-xs font-medium truncate">{componentDef?.name || 'Unknown'}</span>
          {data.isLive ? (
            <Badge variant="default" className="text-[10px] px-1 py-0 h-4">
              Live
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
              Snapshot
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {data.isLive && isActive && componentDef?.refreshable && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {componentDef?.refreshable && (
                <DropdownMenuItem onClick={() => onToggleLive(data.id, !data.isLive)}>
                  {data.isLive ? (
                    <>
                      <Pin className="h-4 w-4 mr-2" />
                      Convert to Snapshot
                    </>
                  ) : (
                    <>
                      <PinOff className="h-4 w-4 mr-2" />
                      Enable Live Updates
                    </>
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleRefresh} disabled={!componentDef?.refreshable}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Now
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Maximize2 className="h-4 w-4 mr-2" />
                Resize
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onRemove(data.id)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="h-full p-4 pt-2">
        {componentDef ? (
          <WidgetPreview component={componentDef} data={data} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Component not found</p>
            <p className="text-xs">{data.componentId}</p>
          </div>
        )}
      </div>

      {/* Footer - Snapshot timestamp */}
      {data.snapshotAt && (
        <div className="absolute bottom-0 left-0 right-0 h-5 bg-muted/80 backdrop-blur-sm flex items-center justify-center gap-1 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          <Clock className="h-3 w-3" />
          {format(new Date(data.snapshotAt), 'MMM d, yyyy h:mm a')}
        </div>
      )}
    </div>
  );
}

interface WidgetPreviewProps {
  component: EmbeddableComponent;
  data: EmbeddedComponentData;
}

function WidgetPreview({ component, data }: WidgetPreviewProps) {
  const Icon = component.icon;

  // For now, render a placeholder preview
  // In a full implementation, this would render the actual component
  // using the dataSnapshot or fetch fresh data if isLive
  return (
    <div className="h-full flex flex-col items-center justify-center bg-muted/30 rounded-lg">
      <Icon className="h-12 w-12 text-primary/50 mb-3" />
      <p className="text-sm font-medium">{component.name}</p>
      <p className="text-xs text-muted-foreground mt-1">{component.type} • {component.sourceModule}</p>
      {data.isLive && (
        <Badge variant="default" className="mt-2 text-xs">
          Live Data
        </Badge>
      )}
      {!data.isLive && data.dataSnapshot && (
        <p className="text-[10px] text-muted-foreground mt-2">
          Snapshot from {data.snapshotAt ? format(new Date(data.snapshotAt), 'MMM d') : 'unknown'}
        </p>
      )}
    </div>
  );
}
