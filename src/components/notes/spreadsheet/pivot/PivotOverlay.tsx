import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { Button } from '@/components/ui/button';
import { X, GripVertical, Download, Edit2 } from 'lucide-react';
import type { PivotTableConfig, PivotTableData } from './types';
import { PivotTableRenderer } from './PivotTableRenderer';

interface PivotOverlayProps {
    config: PivotTableConfig;
    data: PivotTableData;
    onUpdate: (id: string, updates: Partial<PivotTableConfig>) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
}

export function PivotOverlay({
    config,
    data,
    onUpdate,
    onDelete,
    onEdit,
}: PivotOverlayProps) {
    const [isHovered, setIsHovered] = useState(false);

    const handleDragStop = (_e: any, d: any) => {
        onUpdate(config.id, {
            position: { x: d.x, y: d.y },
            updatedAt: new Date().toISOString(),
        });
    };

    const handleResizeStop = (
        _e: any,
        _direction: any,
        ref: any,
        _delta: any,
        position: any
    ) => {
        onUpdate(config.id, {
            size: {
                width: parseInt(ref.style.width),
                height: parseInt(ref.style.height),
            },
            position,
            updatedAt: new Date().toISOString(),
        });
    };

    return (
        <Rnd
            default={{
                x: config.position.x,
                y: config.position.y,
                width: config.size.width,
                height: config.size.height,
            }}
            minWidth={400}
            minHeight={300}
            bounds="parent"
            dragHandleClassName="pivot-drag-handle"
            onDragStop={handleDragStop}
            onResizeStop={handleResizeStop}
            className="pointer-events-auto"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="h-full w-full bg-background border-2 border-border rounded-lg shadow-lg overflow-hidden flex flex-col">
                {/* Header */}
                <div
                    className={`pivot-drag-handle flex items-center justify-between px-3 py-2 bg-muted border-b border-border cursor-move transition-opacity ${isHovered ? 'opacity-100' : 'opacity-60'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm truncate">{config.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onEdit(config.id)}
                            title="Edit Pivot Table"
                        >
                            <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => onDelete(config.id)}
                            title="Delete Pivot Table"
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Pivot content */}
                <div className="flex-1 overflow-auto">
                    <PivotTableRenderer config={config} data={data} />
                </div>
            </div>
        </Rnd>
    );
}
