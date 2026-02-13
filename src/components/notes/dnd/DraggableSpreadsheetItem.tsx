import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table2,
    MoreHorizontal,
    Pencil,
    Trash2,
    FolderOpen,
    GripVertical,
} from 'lucide-react';
import type { NotebookSpreadsheet } from '@/hooks/useSpreadsheets';
import type { NotebookSection } from '@/hooks/useNotebooks';

interface DraggableSpreadsheetItemProps {
    spreadsheet: NotebookSpreadsheet;
    isActive: boolean;
    sections: NotebookSection[];
    onClick: () => void;
    onRename: () => void;
    onDelete: () => void;
    onMove: (targetSectionId: string | null) => void;
}

export function DraggableSpreadsheetItem({
    spreadsheet,
    isActive,
    sections,
    onClick,
    onRename,
    onDelete,
    onMove,
}: DraggableSpreadsheetItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: spreadsheet.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'flex items-center gap-1 group px-2 py-1 rounded-md transition-colors',
                isDragging && 'z-50'
            )}
        >
            {/* Drag handle */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </div>

            {/* Spreadsheet button */}
            <Button
                variant={isActive ? 'secondary' : 'ghost'}
                size="sm"
                onClick={onClick}
                className="flex-1 justify-start text-xs h-7"
            >
                <Table2 className="h-3.5 w-3.5 mr-2" style={{ color: spreadsheet.color || undefined }} />
                <span className="truncate">{spreadsheet.name}</span>
            </Button>

            {/* Context menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="iconSm"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onRename}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Rename
                    </DropdownMenuItem>

                    {spreadsheet.section_id && (
                        <DropdownMenuItem onClick={() => onMove(null)}>
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Move to Notebook Level
                        </DropdownMenuItem>
                    )}

                    {!spreadsheet.section_id && sections.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            {sections.map(section => (
                                <DropdownMenuItem
                                    key={section.id}
                                    onClick={() => onMove(section.id)}
                                >
                                    <FolderOpen className="h-4 w-4 mr-2" />
                                    Move to {section.name}
                                </DropdownMenuItem>
                            ))}
                        </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
