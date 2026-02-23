import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useRequirements, useCreateRequirement, useUpdateRequirement, useDeleteRequirement, useBulkUpsertRequirements, RequirementItem } from '@/hooks/useRequirements';
import { useProjectContext } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DynamicDataGrid, type DynamicColumnDef } from '@/components/ui/DynamicDataGrid';
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
    List,
    Table,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
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
    type: 'text' | 'select' | 'date' | 'custom';
    sticky?: boolean;
    options?: string[]; // Adding options for generic select
};

const STANDARD_COLUMNS: DynamicColumnDef<RequirementItem>[] = [
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
    { key: 'status', label: 'Status', width: 130, type: 'select', options: STATUS_OPTIONS },
];

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
    const [viewMode, setViewMode] = useState<'list' | 'spreadsheet'>('list');
    const [customColumns, setCustomColumns] = useState<DynamicColumnDef<RequirementItem>[]>([]);
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

    // ─── Excel Import ─────────────────────────────────────────────────────────

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
                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'spreadsheet')} className="w-auto">
                            <TabsList className="h-8">
                                <TabsTrigger value="list" className="h-6 px-2.5 text-xs"><List className="h-3.5 w-3.5 mr-1.5" /> List</TabsTrigger>
                                <TabsTrigger value="spreadsheet" className="h-6 px-2.5 text-xs"><Table className="h-3.5 w-3.5 mr-1.5" /> Spreadsheet</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} aria-label="Import requirements from file" title="Import requirements from file" />
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
                        {viewMode !== 'spreadsheet' && (
                            <Button size="sm" onClick={handleAddRow}>
                                <Plus className="h-4 w-4 mr-1.5" /> Add Requirement
                            </Button>
                        )}
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
                                aria-label={`Remove column ${col.label}`}
                                title={`Remove column ${col.label}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden p-6 pb-20 bg-muted/10">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : viewMode === 'spreadsheet' ? (
                        <div className="h-full bg-background border rounded-md shadow-sm overflow-hidden">
                            <DynamicDataGrid
                                data={filteredItems}
                                baseColumns={STANDARD_COLUMNS}
                                customColumns={customColumns}
                                idExtractor={(item) => item.id}
                                customFieldExtractor={(item, key) => String(item.custom_fields?.[key] ?? '')}
                                onCellSave={handleCellSave}
                                onDeleteRows={(ids) => {
                                    if (projectId) {
                                        ids.forEach(id => deleteReq.mutate({ id, project_id: projectId }));
                                    }
                                }}
                                onAddColumn={(col) => {
                                    if (customColumns.find(c => c.key === col.key)) {
                                        toast.error('Column already exists');
                                        return;
                                    }
                                    setCustomColumns(prev => [...prev, col]);
                                    toast.success(`Column "${col.label}" added`);
                                }}
                                onRemoveColumn={(key) => setCustomColumns(prev => prev.filter(c => c.key !== key))}
                                onAddRow={handleAddRow}
                                emptyStateMessage={searchTerm || filterStatus !== 'all' ? 'No requirements match your filters.' : 'No requirements added yet.'}
                                containerStyles="h-full border-0"
                            />
                        </div>
                    ) : (
                        <ScrollArea className="h-full pr-4">
                            {filteredItems.length === 0 ? (
                                <div className="text-center py-12 border border-dashed rounded-lg bg-background">
                                    <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                                    <h3 className="text-base font-medium">No requirements found</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Adjust your filters or add a new requirement.</p>
                                    <Button variant="outline" className="mt-4" onClick={handleAddRow}>
                                        <Plus className="h-4 w-4 mr-2" /> Add Requirement
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {filteredItems.map(req => (
                                        <Card key={req.id} className="group hover:border-primary/30 transition-colors shadow-sm">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{req.code}</span>
                                                            <Badge variant="outline" className={cn("text-[10px] h-5", STATUS_COLORS[req.status] || "bg-gray-100 text-gray-700")}>
                                                                {req.status}
                                                            </Badge>
                                                        </div>
                                                        <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">{req.requirement || 'Untitled Requirement'}</h3>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-1">
                                                                <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40">
                                                            <DropdownMenuItem onClick={() => {
                                                                if (projectId) deleteReq.mutate({ id: req.id, project_id: projectId });
                                                            }} className="text-destructive focus:text-destructive">
                                                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 h-8">
                                                    {req.description || 'No description provided.'}
                                                </p>
                                                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs bg-muted/30 p-2.5 rounded-md">
                                                    <div>
                                                        <span className="text-muted-foreground block mb-0.5">Module</span>
                                                        <span className="font-medium truncate block" title={req.module || '-'}>{req.module || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground block mb-0.5">Process</span>
                                                        <span className="font-medium truncate block" title={req.process || '-'}>{req.process || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground block mb-0.5">Owner</span>
                                                        <span className="font-medium truncate block" title={req.owner || '-'}>{req.owner || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground block mb-0.5">Date</span>
                                                        <span className="font-medium truncate block">
                                                            {req.date ? format(new Date(req.date), 'MMM d, yyyy') : '-'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Render custom fields safely */}
                                                {customColumns.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-dashed space-y-2">
                                                        <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Custom Fields</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {customColumns.map(c => {
                                                                const val = req.custom_fields?.[c.key];
                                                                if (!val) return null;
                                                                return (
                                                                    <div key={c.key} className="text-[10px] bg-muted px-2 py-1 rounded inline-flex items-center gap-1.5 border border-border/50">
                                                                        <span className="text-muted-foreground">{c.label}:</span>
                                                                        <span className="font-medium max-w-[120px] truncate">{String(val)}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    )}
                </div>

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
            </div>
        </TooltipProvider>
    );
}
