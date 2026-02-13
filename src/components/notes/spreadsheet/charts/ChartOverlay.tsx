import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { X, Edit2, Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartRenderer } from './ChartRenderer';
import type { ChartConfig } from './types';

interface ChartOverlayProps {
    config: ChartConfig;
    data: any[][];
    onUpdate: (chartId: string, updates: Partial<ChartConfig>) => void;
    onDelete: (chartId: string) => void;
    onEdit: (chartId: string) => void;
    onExport: (chartId: string, format: 'png' | 'svg') => void;
}

export function ChartOverlay({
    config,
    data,
    onUpdate,
    onDelete,
    onEdit,
    onExport,
}: ChartOverlayProps) {
    const [isHovered, setIsHovered] = useState(false);

    const handleDragStop = (_e: any, d: { x: number; y: number }) => {
        onUpdate(config.id, {
            position: { x: d.x, y: d.y },
            updatedAt: new Date().toISOString(),
        });
    };

    const handleResizeStop = (
        _e: any,
        _direction: any,
        ref: HTMLElement,
        _delta: any,
        position: { x: number; y: number }
    ) => {
        onUpdate(config.id, {
            position,
            size: {
                width: parseInt(ref.style.width),
                height: parseInt(ref.style.height),
            },
            updatedAt: new Date().toISOString(),
        });
    };

    return (
        <Rnd
            position={config.position}
            size={config.size}
            onDragStop={handleDragStop}
            onResizeStop={handleResizeStop}
            bounds="parent"
            minWidth={200}
            minHeight={150}
            enableResizing={{
                top: true,
                right: true,
                bottom: true,
                left: true,
                topRight: true,
                bottomRight: true,
                bottomLeft: true,
                topLeft: true,
            }}
            dragHandleClassName="chart-drag-handle"
            className="pointer-events-auto"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="h-full w-full bg-background border-2 border-border rounded-lg shadow-lg overflow-hidden flex flex-col">
                {/* Header with controls */}
                <div
                    className={`chart-drag-handle flex items-center justify-between px-3 py-2 bg-muted border-b border-border cursor-move transition-opacity ${isHovered ? 'opacity-100' : 'opacity-60'
                        }`}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Maximize2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{config.title}</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onEdit(config.id)}
                            title="Edit Chart"
                        >
                            <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onExport(config.id, 'png')}
                            title="Export as PNG"
                        >
                            <Download className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => onDelete(config.id)}
                            title="Delete Chart"
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Chart content */}
                <div id={`chart-${config.id}`} className="flex-1 p-4 bg-background">
                    <ChartRenderer config={config} data={data} />
                </div>
            </div>
        </Rnd>
    );
}
