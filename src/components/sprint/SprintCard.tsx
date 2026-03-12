import React from 'react';
import { motion, useDragControls } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GripVertical, MoreHorizontal, Flame, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BacklogItem, BacklogStatus } from '@/hooks/useBacklogItems';

interface SprintCardProps {
    item: BacklogItem;
    isSelected: boolean;
    onSelect: () => void;
    onStatusChange: (status: BacklogStatus) => void;
    columns: { id: string; label: string; dbStatus: BacklogStatus }[];
}

export function SprintCard({ item, isSelected, onSelect, onStatusChange, columns }: SprintCardProps) {
    const dragControls = useDragControls();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            onClick={onSelect}
            className={cn(
                'p-3 bg-card rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer group',
                isSelected && 'ring-2 ring-primary'
            )}
        >
            <div className="flex items-start gap-2">
                <div
                    className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity pt-1"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant={item.type as any} className="text-[10px]">
                            {item.type.replace('-', ' ')}
                        </Badge>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="iconXs" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Move to</DropdownMenuLabel>
                                {columns.map(col => (
                                    <DropdownMenuItem key={col.id} onClick={() => onStatusChange(col.dbStatus)}>
                                        {col.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <p className="text-sm font-medium mb-2 line-clamp-2">{item.title}</p>

                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-muted-foreground font-mono">{item.key || item.id.slice(0, 8)}</span>
                        {item.priority === 'critical' && (
                            <Flame className="h-3 w-3 text-destructive" />
                        )}
                    </div>

                    {item.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {item.labels.slice(0, 2).map((label) => (
                                <span
                                    key={label}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                                >
                                    {label}
                                </span>
                            ))}
                            {item.labels.length > 2 && (
                                <span className="text-[10px] text-muted-foreground">
                                    +{item.labels.length - 2}
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2">
                            {item.assignee_name ? (
                                <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                                        {item.assignee_name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')}
                                    </AvatarFallback>
                                </Avatar>
                            ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                                    <User className="h-3 w-3 text-muted-foreground/50" />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {item.story_points && (
                                <span className="text-xs font-medium bg-muted px-1.5 py-0.5 rounded">
                                    {item.story_points}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
