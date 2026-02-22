import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useRequirements, useCreateRequirement, useUpdateRequirement, useDeleteRequirement, useBulkUpsertRequirements, RequirementItem } from '@/hooks/useRequirements';
import { useProjectContext } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Download,
    Upload,
    Plus,
    Trash2,
    Settings2,
    ClipboardList,
    Loader2,
    Search,
    ChevronDown,
    GripVertical,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['Open', 'In Review', 'Approved', 'Rejected', 'Deferred', 'Implemented'];
const STATUS_COLORS: Record<string, string> = {
    Open: 'bg-blue-100 text-blue-700 border-blue-200',
    'In Review': 'bg-amber-100 text-amber-700 border-amber-200',
    Approved: 'bg-green-100 text-green-700 border-green-200',
    Rejected: 'bg-red-100 text-red-700 border-red-200',
    Deferred: 'bg-gray-100 text-gray-600 border-gray-200',
    Implemented: 'bg-purple-100 text-purple-700 border-purple-200',
};

type ColumnDef = {
    key: string;
    label: string;
    width: number;
    type: 'text' | 'status' | 'date' | 'custom';
    sticky?: boolean;
};

const STANDARD_COLUMNS: ColumnDef[] = [
    { key: 'code', label: 'Code', width: 100, type: 'text', sticky: true },
    { key: 'requirement', label: 'Requirement', width: 240, type: 'text' },
    { key: 'description', label: 'Description', width: 300, type: 'text' },
    { key: 'process', label: 'Process', width: 160, type: 'text' },
    { key: 'module', label: 'Module', width: 140, type: 'text' },
    { key: 'department', label: 'Department', width: 150, type: 'text' },
    { key: 'owner', label: 'Owner', width: 140, type: 'text' },
    { key: 'consultant', label: 'Consultant', width: 140, type: 'text' },
    { key: 'date', label: 'Date', width: 130, type: 'date' },
    { key: 'meeting_reference', label: 'Meeting Ref.', width: 160, type: 'text' },
    { key: 'status', label: 'Status', width: 130, type: 'status' },
];

// ─── Inline Cell ──────────────────────────────────────────────────────────────

interface CellProps {
    value: string;
    columnKey: string;
    rowId: string;
    type: 'text' | 'status' | 'date' | 'custom';
    onSave: (rowId: string, key: string, value: string) => void;
    isCustom?: boolean;
}

function EditableCell({ value, columnKey, rowId, type, onSave, isCustom }: CellProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleStart = () => {
        if (type === 'status') return;
        setDraft(value);
        setEditing(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleCommit = () => {
        setEditing(false);
        if (draft !== value) onSave(rowId, columnKey, draft);
    };

    if (type === 'status') {
        return (
            <Select value={value || 'Open'} onValueChange={v => onSave(rowId, columnKey, v)}>
                <SelectTrigger className="h-7 border-0 bg-transparent shadow-none text-xs focus:ring-0 px-2">
                    <span className={cn('px-1.5 py-0.5 rounded text-[11px] border', STATUS_COLORS[value] ?? STATUS_COLORS.Open)}>
                        {value || 'Open'}
                    </span>
                </SelectTrigger>
                <SelectContent>
                    {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s} value={s}>
                            <span className={cn('px-1.5 py-0.5 rounded text-[11px] border', STATUS_COLORS[s])}>{s}</span>
                        </SelectItem>
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
                className="h-7 px-2 py-0 text-xs border-primary shadow-sm focus-visible:ring-1 rounded-none"
            />
        );
    }

    return (
        <div
            onClick={handleStart}
            className="px-2 py-1.5 min-h-[28px] text-xs cursor-text hover:bg-primary/5 rounded truncate"
            title={value}
        >
            {type === 'date' && value ? new Date(value).toLocaleDateString() : (value || <span className="text-muted-foreground/50 italic">—</span>)}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RequirementsMatrixView() {
    const { settings: project } = useProjectContext();
    const projectId = project?.id ?? null;

    const { data: items = [], isLoading } = useRequirements(projectId);
    const createReq = useCreateRequirement();
    const updateReq = useUpdateRequirement();
    const deleteReq = useDeleteRequirement();
    const bulkUpsert = useBulkUpsertRequirements();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [customColumns, setCustomColumns] = useState<ColumnDef[]>([]);
    const [isAddColOpen, setIsAddColOpen] = useState(false);
    const [newColName, setNewColName] = useState('');
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const allColumns = useMemo(() => [...STANDARD_COLUMNS, ...customColumns], [customColumns]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchSearch = !searchTerm || Object.values(item).some(v =>
                typeof v === 'string' && v.toLowerCase().includes(searchTerm.toLowerCase())
            );
            const matchStatus = filterStatus === 'all' || item.status === filterStatus;
            return matchSearch && matchStatus;
        });
    }, [items, searchTerm, filterStatus]);

    // ─── Cell save handler ───

    const handleCellSave = useCallback((rowId: string, key: string, value: string) => {
        if (!projectId) return;
        const isCustom = !STANDARD_COLUMNS.find(c => c.key === key);
        const item = items.find(i => i.id === rowId);
        if (!item) return;

        if (isCustom) {
            const cf = { ...(item.custom_fields ?? {}), [key]: value };
            updateReq.mutate({ id: rowId, project_id: projectId, custom_fields: cf });
        } else {
            updateReq.mutate({ id: rowId, project_id: projectId, [key]: value } as any);
        }
    }, [items, projectId, updateReq]);

    // ─── Add Row ─────────────────────────────────────────────────────────────

    const handleAddRow = () => {
        if (!projectId) return;
        const code = `REQ-${String(items.length + 1).padStart(3, '0')}`;
        createReq.mutate({
            project_id: projectId,
            code,
            status: 'Open',
            sort_order: items.length,
        });
    };

    // ─── Delete selected rows ─────────────────────────────────────────────────

    const handleDeleteSelected = () => {
        if (!projectId) return;
        selectedRows.forEach(id => deleteReq.mutate({ id, project_id: projectId }));
        setSelectedRows(new Set());
    };

    // ─── Excel Export ─────────────────────────────────────────────────────────

    const handleExport = async () => {
        try {
            const XLSX = await import('xlsx');
            const headers = allColumns.map(c => c.label);
            const rows = filteredItems.map(item =>
                allColumns.map(col => {
                    if (col.type === 'custom') return item.custom_fields?.[col.key] ?? '';
                    return (item as any)[col.key] ?? '';
                })
            );
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            // Column widths
            ws['!cols'] = allColumns.map(c => ({ wch: Math.max(c.label.length, 16) }));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Requirements');
            XLSX.writeFile(wb, `RTM_${project?.name ?? 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Exported successfully');
        } catch (e: any) {
            toast.error('Export failed: ' + e.message);
        }
    };

    // ─── Excel Import ─────────────────────────────────────────────────────────

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !projectId) return;
        try {
            const XLSX = await import('xlsx');
            const buf = await file.arrayBuffer();
            const wb = XLSX.read(buf, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

            // Map header names to field keys (case insensitive)
            const colMap: Record<string, string> = {};
            allColumns.forEach(c => { colMap[c.label.toLowerCase()] = c.key; });

            const items: Partial<RequirementItem>[] = rows.map((row, i) => {
                const mapped: any = { sort_order: i, custom_fields: {} };
                Object.entries(row).forEach(([header, val]) => {
                    const key = colMap[header.toLowerCase().trim()];
                    if (key) {
                        mapped[key] = String(val);
                    } else {
                        // unmapped column → custom field
                        mapped.custom_fields[header] = String(val);
                    }
                });
                return mapped;
            });

            await bulkUpsert.mutateAsync({ projectId, items });
            e.target.value = '';
        } catch (err: any) {
            toast.error('Import failed: ' + err.message);
            e.target.value = '';
        }
    };

    // ─── Add Custom Column ────────────────────────────────────────────────────

    const handleAddColumn = () => {
        if (!newColName.trim()) return;
        const key = newColName.toLowerCase().replace(/\s+/g, '_');
        if (customColumns.find(c => c.key === key)) {
            toast.error('Column already exists');
            return;
        }
        setCustomColumns(prev => [
            ...prev,
            { key, label: newColName.trim(), width: 160, type: 'custom' },
        ]);
        setIsAddColOpen(false);
        setNewColName('');
        toast.success(`Column "${newColName}" added`);
    };

    if (!projectId) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
                <p className="text-muted-foreground">Select a project to view its requirements traceability matrix.</p>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="flex flex-col h-full bg-background">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-primary" />
                            Requirements Traceability Matrix
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {filteredItems.length} of {items.length} requirements · Click any cell to edit inline
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedRows.size > 0 && (
                            <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                                <Trash2 className="h-4 w-4 mr-1.5" />
                                Delete ({selectedRows.size})
                            </Button>
                        )}
                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={bulkUpsert.isPending}>
                                    {bulkUpsert.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Upload className="h-4 w-4 mr-1.5" />}
                                    Import
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Import from Excel (.xlsx / .xls / .csv)</TooltipContent>
                        </Tooltip>
                        <Button variant="outline" size="sm" onClick={handleExport}>
                            <Download className="h-4 w-4 mr-1.5" />
                            Export
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setIsAddColOpen(true)}>
                            <Settings2 className="h-4 w-4 mr-1.5" />
                            Add Column
                        </Button>
                        <Button size="sm" onClick={handleAddRow} disabled={createReq.isPending}>
                            {createReq.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                            Add Row
                        </Button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3 px-6 py-2.5 border-b bg-muted/30 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            className="pl-8 h-7 text-xs w-56 border-border/60"
                            placeholder="Search requirements..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-7 text-xs w-36 border-border/60">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {STATUS_OPTIONS.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {/* Custom column pills */}
                    {customColumns.map(col => (
                        <Badge key={col.key} variant="secondary" className="gap-1 pr-1 text-xs">
                            {col.label}
                            <button
                                onClick={() => setCustomColumns(prev => prev.filter(c => c.key !== col.key))}
                                className="text-muted-foreground hover:text-destructive ml-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>

                {/* Spreadsheet */}
                {isLoading ? (
                    <div className="flex items-center justify-center flex-1">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto">
                        <table className="text-sm border-collapse w-max min-w-full">
                            {/* Header */}
                            <thead className="sticky top-0 z-30">
                                <tr className="bg-muted/80 backdrop-blur border-b-2 border-border">
                                    {/* Checkbox col */}
                                    <th className="sticky left-0 z-40 bg-muted/90 backdrop-blur w-8 px-2 border-r text-center">
                                        <input
                                            type="checkbox"
                                            className="accent-primary"
                                            checked={selectedRows.size === filteredItems.length && filteredItems.length > 0}
                                            onChange={e => {
                                                if (e.target.checked) setSelectedRows(new Set(filteredItems.map(i => i.id)));
                                                else setSelectedRows(new Set());
                                            }}
                                        />
                                    </th>
                                    {/* Row # */}
                                    <th className="sticky left-8 z-40 bg-muted/90 backdrop-blur w-10 px-2 py-2 text-xs font-semibold text-muted-foreground border-r text-center">
                                        #
                                    </th>
                                    {allColumns.map((col, ci) => (
                                        <th
                                            key={col.key}
                                            className={cn(
                                                'px-3 py-2 text-left text-xs font-semibold whitespace-nowrap border-r',
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
                                    {/* Actions col */}
                                    <th className="px-2 py-2 text-xs font-semibold text-muted-foreground w-10 border-r" />
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={allColumns.length + 3} className="h-40 text-center text-muted-foreground text-sm">
                                            {searchTerm || filterStatus !== 'all'
                                                ? 'No requirements match your filters.'
                                                : 'No requirements yet. Click "Add Row" to start.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item, rowIdx) => (
                                        <tr
                                            key={item.id}
                                            className={cn(
                                                'border-b hover:bg-amber-50/30 transition-colors group',
                                                selectedRows.has(item.id) && 'bg-primary/5',
                                                rowIdx % 2 === 1 && 'bg-muted/10'
                                            )}
                                        >
                                            {/* Checkbox */}
                                            <td className="sticky left-0 z-10 bg-inherit border-r w-8 px-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="accent-primary"
                                                    checked={selectedRows.has(item.id)}
                                                    onChange={e => {
                                                        setSelectedRows(prev => {
                                                            const next = new Set(prev);
                                                            if (e.target.checked) next.add(item.id);
                                                            else next.delete(item.id);
                                                            return next;
                                                        });
                                                    }}
                                                />
                                            </td>
                                            {/* Row number */}
                                            <td className="sticky left-8 z-10 bg-inherit border-r w-10 px-2 text-center text-xs text-muted-foreground">
                                                {rowIdx + 1}
                                            </td>
                                            {/* Data cells */}
                                            {allColumns.map((col, ci) => {
                                                const cellVal = col.type === 'custom'
                                                    ? (item.custom_fields?.[col.key] ?? '')
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
                                                            rowId={item.id}
                                                            type={col.type}
                                                            onSave={handleCellSave}
                                                            isCustom={col.type === 'custom'}
                                                        />
                                                    </td>
                                                );
                                            })}
                                            {/* Delete row (visible on hover) */}
                                            <td className="w-10 px-1 text-center border-r">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => deleteReq.mutate({ id: item.id, project_id: projectId! })}
                                                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Delete row</TooltipContent>
                                                </Tooltip>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer bar */}
                <div className="flex items-center gap-4 px-6 py-2 border-t bg-muted/30 text-xs text-muted-foreground shrink-0">
                    <span>{items.length} total requirements</span>
                    <span>·</span>
                    <span>{items.filter(i => i.status === 'Approved').length} approved</span>
                    <span>·</span>
                    <span>{items.filter(i => i.status === 'Open').length} open</span>
                    <span>·</span>
                    <span>{items.filter(i => i.status === 'Implemented').length} implemented</span>
                </div>

                {/* Add Column Dialog */}
                <Dialog open={isAddColOpen} onOpenChange={setIsAddColOpen}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Add Custom Column</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            <Input
                                placeholder="Column name, e.g. Priority"
                                value={newColName}
                                onChange={e => setNewColName(e.target.value)}
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') handleAddColumn(); }}
                            />
                            <p className="text-xs text-muted-foreground">
                                Custom columns are stored in the database as JSON fields and exported to Excel.
                            </p>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddColOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddColumn} disabled={!newColName.trim()}>Add Column</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
