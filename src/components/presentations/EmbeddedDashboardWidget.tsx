/**
 * EmbeddedDashboardWidget
 * Renders a live or snapshot mini-preview of an embeddable component inside
 * a presentation drag-and-drop canvas.
 *
 * WidgetPreview now renders real mini-charts / KPI cards / list views based on
 * the component's declared `type` and the `dataSnapshot` stored on the record,
 * falling back to the icon placeholder only when no data is available.
 */

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
import {
  BarChart as RechartsBarChart,
  Bar,
  AreaChart as RechartsAreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  RefreshCw,
  MoreVertical,
  Pin,
  PinOff,
  Trash2,
  Maximize2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { embeddableComponents, EmbeddableComponent } from '@/lib/embeddableComponents';

/** Chart colour palette */
const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

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
  width: number;
  height: number;
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
      {/* Header — visible on hover */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-muted/90 backdrop-blur-sm flex items-center justify-between px-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
          <span className="text-xs font-medium truncate">{componentDef?.name || 'Unknown'}</span>
          {data.isLive ? (
            <Badge variant="default" className="text-[10px] px-1 py-0 h-4">Live</Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Snapshot</Badge>
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
                    <><Pin className="h-4 w-4 mr-2" />Convert to Snapshot</>
                  ) : (
                    <><PinOff className="h-4 w-4 mr-2" />Enable Live Updates</>
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleRefresh} disabled={!componentDef?.refreshable}>
                <RefreshCw className="h-4 w-4 mr-2" />Refresh Now
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Maximize2 className="h-4 w-4 mr-2" />Resize
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onRemove(data.id)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />Remove
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

      {/* Footer — Snapshot timestamp */}
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

/**
 * WidgetPreview
 * Renders a real mini-chart or metric card when dataSnapshot contains data,
 * keyed to the component's declared `type` field.
 */
function WidgetPreview({ component, data }: WidgetPreviewProps) {
  const Icon = component.icon;
  const snapshot = data.dataSnapshot;

  // ── KPI / metric ──────────────────────────────────────────────────────
  if (component.type === 'kpi') {
    const key = component.dataKeys?.[0];
    const value = key && snapshot ? snapshot[key] : null;
    return (
      <div className="h-full flex flex-col items-center justify-center gap-1">
        <Icon className="h-8 w-8 text-primary/60 mb-1" />
        <p className="text-xs text-muted-foreground">{component.name}</p>
        {value != null ? (
          <p className="text-2xl font-bold text-primary">{String(value)}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No data yet</p>
        )}
        {data.isLive && <Badge variant="default" className="mt-1 text-[10px]">Live</Badge>}
      </div>
    );
  }

  // ── Bar / Area chart ──────────────────────────────────────────────────
  if (component.type === 'chart' || component.type === 'timeline') {
    const rows = snapshot?.rows as Array<Record<string, number | string>> | undefined;
    if (rows && rows.length > 0) {
      const nameKey = 'name' in rows[0] ? 'name' : Object.keys(rows[0])[0];
      const keys = Object.keys(rows[0]).filter(k => k !== nameKey).slice(0, 3);
      return (
        <div className="h-full w-full flex flex-col gap-1 py-1">
          <p className="text-[10px] text-muted-foreground px-1 truncate">{component.name}</p>
          <ResponsiveContainer width="100%" height="90%">
            {component.type === 'timeline' ? (
              <RechartsAreaChart data={rows} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey={nameKey} tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <RechartsTooltip contentStyle={{ fontSize: 10 }} />
                {keys.map((k, i) => (
                  <Area key={k} type="monotone" dataKey={k}
                    stroke={COLORS[i % COLORS.length]}
                    fill={COLORS[i % COLORS.length]}
                    fillOpacity={0.2} strokeWidth={1.5} />
                ))}
              </RechartsAreaChart>
            ) : (
              <RechartsBarChart data={rows} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey={nameKey} tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <RechartsTooltip contentStyle={{ fontSize: 10 }} />
                {keys.map((k, i) => (
                  <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[2, 2, 0, 0]} />
                ))}
              </RechartsBarChart>
            )}
          </ResponsiveContainer>
        </div>
      );
    }
  }

  // ── List / table ──────────────────────────────────────────────────────
  if (component.type === 'list' || component.type === 'table') {
    const rows = snapshot?.rows as Array<Record<string, string | number>> | undefined;
    if (rows && rows.length > 0) {
      return (
        <div className="h-full w-full flex flex-col gap-1 overflow-hidden py-1">
          <p className="text-[10px] text-muted-foreground px-1 truncate">{component.name}</p>
          <div className="flex-1 overflow-hidden divide-y divide-border">
            {rows.slice(0, 6).map((row, i) => {
              const vals = Object.values(row);
              return (
                <div key={i} className="flex justify-between items-center px-2 py-0.5 text-[10px]">
                  <span className="truncate">{String(vals[0])}</span>
                  {vals.length > 1 && (
                    <span className="text-muted-foreground ml-2 shrink-0">{String(vals[1])}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  }

  // ── Gauge / radial ────────────────────────────────────────────────────
  if (component.type === 'gauge') {
    const key = component.dataKeys?.[0];
    const raw = key && snapshot ? Number(snapshot[key]) : null;
    const pct = raw != null && !isNaN(raw) ? Math.min(100, Math.max(0, raw)) : null;
    if (pct != null) {
      const fill = pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#10b981';
      return (
        <div className="h-full flex flex-col items-center justify-center gap-1">
          <p className="text-[10px] text-muted-foreground truncate max-w-full px-2">{component.name}</p>
          <ResponsiveContainer width={120} height={80}>
            <RadialBarChart
              cx="50%" cy="70%"
              innerRadius="60%" outerRadius="100%"
              data={[{ value: pct }]}
              startAngle={180} endAngle={0}
            >
              <RadialBar
                dataKey="value"
                fill={fill}
                background={{ fill: 'hsl(var(--muted))' }}
                cornerRadius={4}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <p className="text-xl font-bold -mt-2">{pct.toFixed(0)}%</p>
          {data.isLive && <Badge variant="default" className="text-[10px]">Live</Badge>}
        </div>
      );
    }
  }

  // ── Fallback placeholder (no data available yet) ───────────────────────
  return (
    <div className="h-full flex flex-col items-center justify-center bg-muted/30 rounded-lg">
      <Icon className="h-12 w-12 text-primary/50 mb-3" />
      <p className="text-sm font-medium">{component.name}</p>
      <p className="text-xs text-muted-foreground mt-1">{component.type} • {component.sourceModule}</p>
      {data.isLive && (
        <Badge variant="default" className="mt-2 text-xs">Live Data</Badge>
      )}
      {!data.isLive && data.dataSnapshot && (
        <p className="text-[10px] text-muted-foreground mt-2">
          Snapshot from {data.snapshotAt ? format(new Date(data.snapshotAt), 'MMM d') : 'unknown'}
        </p>
      )}
    </div>
  );
}
