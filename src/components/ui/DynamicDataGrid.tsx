import React, { useState, useRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { X, Settings2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export type DynamicColumnDef<T> = {
    key: Extract<keyof T, string> | string;
    label: string;
    width: number;
    type: 'text' | 'select' | 'date' | 'custom';
    options?: string[];
    sticky?: boolean;
};

interface EditableCellProps {
    value: string;
    columnKey: string;
    rowId: string;
    type: 'text' | 'select' | 'date' | 'custom';
    options?: string[];
    onSave?: (rowId: string, key: string, value: string) => void;
    isCustom?: boolean;
}

function EditableCell({ value, columnKey, rowId, type, options, onSave }: EditableCellProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleStart = () => {
        if (!onSave || type === 'select' || columnKey === 'id' || columnKey === 'key') return;
        setDraft(value);
        setEditing(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleCommit = () => {
        setEditing(false);
        if (draft !== value && onSave) onSave(rowId, columnKey, draft);
    };

    if (type === 'select') {
        if (!onSave) {
            // Read-only select: just render the text
            return (
                <div className="px-2 py-1.5 min-h-[28px] text-xs truncate w-full capitalize">
                    {value || <span className="text-muted-foreground/50 italic">—</span>}
                </div>
            );
        }
        return (
            <Select value={value || (options?.[0] ?? '')} onValueChange={v => onSave(rowId, columnKey, v)}>
                <SelectTrigger className="h-7 border-0 bg-transparent shadow-none text-xs focus:ring-0 px-2 w-full truncate flex justify-between group">
                    <span className="truncate pr-1 capitalize">{value || 'Select...'}</span>
                </SelectTrigger>
                <SelectContent>
                    {options?.map(s => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    }

    if (editing) {
        return (
            <Input
                ref={inputRef}
                type={type === 'date' ? 'date' : 'text'}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={handleCommit}
                onKeyDown={e => {
                    if (e.key === 'Enter') handleCommit();
                    if (e.key === 'Escape') setEditing(false);
                }}
                className="h-7 px-2 py-0 text-xs border-primary shadow-sm focus-visible:ring-1 w-full rounded-none"
            />
        );
    }

    return (
        <div
            onClick={handleStart}
            className={cn(
                "px-2 py-1.5 min-h-[28px] text-xs rounded truncate w-full",
                onSave && (columnKey !== 'id' && columnKey !== 'key') ? "cursor-text hover:bg-primary/5" : "cursor-default"
            )}
            title={value}
        >
            {type === 'date' && value ? new Date(value).toLocaleDateString() : (value || <span className="text-muted-foreground/50 italic">—</span>)}
        </div>
    );
}

interface DynamicDataGridProps<T> {
    data: T[];
    baseColumns: DynamicColumnDef<T>[];
    customColumns: DynamicColumnDef<T>[];
    idExtractor: (item: T) => string;
    customFieldExtractor?: (item: T, key: string) => string;
    onCellSave?: (rowId: string, key: string, value: string) => void;
    onDeleteRows?: (rowIds: Set<string>) => void;
    onAddColumn: (col: DynamicColumnDef<T>) => void;
    onRemoveColumn: (colKey: string) => void;
    onAddRow?: () => void;
    emptyStateMessage?: string;
    containerStyles?: string;
}

export function DynamicDataGrid<T>({
    data,
    baseColumns,
    customColumns,
    idExtractor,
    customFieldExtractor,
    onCellSave,
    onDeleteRows,
    onAddColumn,
    onRemoveColumn,
    onAddRow,
    emptyStateMessage = "No data available.",
    containerStyles = "min-h-[400px]"
}: DynamicDataGridProps<T>) {
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [isAddColOpen, setIsAddColOpen] = useState(false);
    const [newColName, setNewColName] = useState('');

    const allColumns = useMemo(() => [...baseColumns, ...customColumns], [baseColumns, customColumns]);

    const handleCreateColumn = () => {
        if (!newColName.trim()) return;
        const key = newColName.toLowerCase().replace(/\s+/g, '_');
        onAddColumn({ key, label: newColName.trim(), width: 160, type: 'custom' });
        setIsAddColOpen(false);
        setNewColName('');
    };

    return (
        <div className="flex flex-col space-y-4 w-full">
            {/* Configuration Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground mr-1">Custom Fields:</span>
                    {customColumns.length === 0 && (
                        <span className="text-xs text-muted-foreground/50 italic">None</span>
                    )}
                    {customColumns.map(col => (
                        <Badge key={col.key} variant="secondary" className="gap-1 pr-1 text-xs">
                            {col.label}
                            <button
                                onClick={() => onRemoveColumn(col.key)}
                                className="text-muted-foreground hover:text-destructive ml-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsAddColOpen(true)}>
                        <Settings2 className="h-4 w-4 mr-1" />
                        Add Column
                    </Button>
                    {onAddRow && (
                        <Button size="sm" onClick={onAddRow}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Row
                        </Button>
                    )}
                </div>
            </div>

            {/* Excel Table Matrix */}
            <div className={cn("bg-card rounded-lg border overflow-hidden overflow-x-auto", containerStyles)}>
                <table className="w-max min-w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/80 backdrop-blur sticky top-0 z-30 border-b-2 text-xs uppercase text-muted-foreground">
                        <tr>
                            <th className="sticky left-0 z-40 bg-muted/90 backdrop-blur w-8 px-2 border-r text-center">
                                {onDeleteRows && (
                                <input
                                    type="checkbox"
                                    className="accent-primary cursor-pointer"
                                    checked={selectedRows.size === data.length && data.length > 0}
                                    onChange={e => {
                                        if (e.target.checked) setSelectedRows(new Set(data.map(i => idExtractor(i))));
                                        else setSelectedRows(new Set());
                                    }}
                                />
                                )}
                            </th>
                            <th className="sticky left-8 z-40 bg-muted/90 backdrop-blur w-10 px-2 py-3 border-r text-center font-medium">#</th>
                            {allColumns.map((col, ci) => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        'px-4 py-3 font-medium border-r whitespace-nowrap',
                                        col.sticky && 'sticky left-[72px] z-40 bg-muted/90 backdrop-blur',
                                        !col.sticky && ci === 0 && 'sticky left-[72px] z-40 bg-muted/90'
                                    )}
                                    style={{ minWidth: col.width }}
                                >
                                    {col.label}
                                    {col.type === 'custom' && (
                                        <span className="ml-1 text-[9px] text-muted-foreground/60 uppercase">custom</span>
                                    )}
                                </th>
                            ))}
                            <th className="px-4 py-3 font-medium text-right bg-muted/90 z-20 sticky right-0">
                                {onDeleteRows && selectedRows.size > 0 && (
                                    <Button
                                        variant="destructive"
                                        size="iconXs"
                                        onClick={() => {
                                            onDeleteRows(selectedRows);
                                            setSelectedRows(new Set());
                                        }}
                                        title={`Delete ${selectedRows.size} row(s)`}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border relative z-0">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={allColumns.length + 3} className="px-4 py-8 text-center text-muted-foreground">
                                    {emptyStateMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((item, rowIdx) => {
                                const rowId = idExtractor(item);
                                return (
                                    <tr
                                        key={rowId}
                                        className={cn(
                                            'hover:bg-amber-50/30 transition-colors group',
                                            selectedRows.has(rowId) && 'bg-primary/5',
                                            rowIdx % 2 === 1 && 'bg-muted/10'
                                        )}
                                    >
                                        <td className="sticky left-0 z-10 bg-inherit border-r w-8 px-2 text-center">
                                            {onDeleteRows && (
                                            <input
                                                type="checkbox"
                                                className="accent-primary cursor-pointer"
                                                checked={selectedRows.has(rowId)}
                                                onChange={e => {
                                                    setSelectedRows(prev => {
                                                        const next = new Set(prev);
                                                        if (e.target.checked) next.add(rowId);
                                                        else next.delete(rowId);
                                                        return next;
                                                    });
                                                }}
                                            />
                                            )}
                                        </td>
                                        <td className="sticky left-8 z-10 bg-inherit border-r w-10 px-2 text-center text-xs text-muted-foreground">
                                            {rowIdx + 1}
                                        </td>
                                        {allColumns.map((col, ci) => {
                                            const cellVal = col.type === 'custom' && customFieldExtractor
                                                ? customFieldExtractor(item, col.key)
                                                : (String((item as any)[col.key] ?? ''));
                                            return (
                                                <td
                                                    key={col.key}
                                                    className={cn(
                                                        'border-r p-0',
                                                        col.sticky && 'sticky left-[72px] z-10 bg-inherit',
                                                    )}
                                                    style={{ minWidth: col.width }}
                                                >
                                                    <EditableCell
                                                        value={cellVal}
                                                        columnKey={col.key}
                                                        rowId={rowId}
                                                        type={col.type}
                                                        options={col.options}
                                                        onSave={onCellSave}
                                                        isCustom={col.type === 'custom'}
                                                    />
                                                </td>
                                            );
                                        })}
                                        {onDeleteRows && (
                                        <td className="px-2 py-0 text-right sticky right-0 bg-inherit border-l z-20">
                                            <Button
                                                size="iconXs"
                                                variant="ghost"
                                                onClick={() => onDeleteRows(new Set([rowId]))}
                                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <Dialog open={isAddColOpen} onOpenChange={setIsAddColOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Add Custom Column</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <Input
                            placeholder="Column name, e.g. Impact"
                            value={newColName}
                            onChange={e => setNewColName(e.target.value)}
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') handleCreateColumn(); }}
                        />
                        <p className="text-xs text-muted-foreground">
                            Custom columns are stored dynamically and persisted.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddColOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateColumn} disabled={!newColName.trim()}>Add Column</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
