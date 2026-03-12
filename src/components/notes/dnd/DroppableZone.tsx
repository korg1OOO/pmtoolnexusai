import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DroppableZoneProps {
    id: string;
    type: 'notebook' | 'section';
    children: React.ReactNode;
    className?: string;
}

export function DroppableZone({ id, type, children, className }: DroppableZoneProps) {
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'transition-all duration-200',
                isOver && type === 'section' && 'bg-accent/30 border-l-2 border-accent',
                isOver && type === 'notebook' && 'bg-primary/5 border-l-2 border-primary',
                className
            )}
        >
            {children}

            {/* Drop indicator */}
            {isOver && (
                <div className={cn(
                    'h-0.5 rounded-full mx-2 my-1 transition-all',
                    type === 'section' && 'bg-accent',
                    type === 'notebook' && 'bg-primary'
                )} />
            )}
        </div>
    );
}
