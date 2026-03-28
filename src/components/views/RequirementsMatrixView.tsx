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
import { DataRegisterPage } from '@/components/ui/DataRegisterPage';
import { type DynamicColumnDef } from '@/components/ui/DynamicDataGrid';
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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EntityFormDialog } from '@/components/ui/EntityFormDialog';
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
    const [customColumns, setCustomColumns] = useState<DynamicColumnDef<RequirementItem>[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newRequirement, setNewRequirement] = useState({
        requirement: '',
        description: '',
        process: '',
        module: '',
        owner: '',
    });

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

    const handleCellSave = useCallback(async (rowId: string, key: string, value: string) => {
        if (!projectId) return;
        const isCustom = !STANDARD_COLUMNS.find(c => c.key === key);
        const item = items.find(i => i.id === rowId);
        if (!item) return;

        if (isCustom) {
            const cf = { ...(item.custom_fields ?? {}), [key]: value };
            await updateReq.mutateAsync({ id: rowId, project_id: projectId, custom_fields: cf });
        } else {
            await updateReq.mutateAsync({ id: rowId, project_id: projectId, [key]: value } as any);
        }
    }, [items, projectId, updateReq]);

    // ─── Add Row ─────────────────────────────────────────────────────────────

    const handleAddRow = async () => {
        if (!projectId) return;
        const code = `REQ-${String(items.length + 1).padStart(3, '0')}`;
        await createReq.mutateAsync({
            project_id: projectId,
            code,
            requirement: newRequirement.requirement,
            description: newRequirement.description,
            process: newRequirement.process,
            module: newRequirement.module,
            owner: newRequirement.owner,
            status: 'Open',
            sort_order: items.length,
        });

        setIsAddOpen(false);
        setNewRequirement({ requirement: '', description: '', process: '', module: '', owner: '' });
        toast.success('Requirement added');
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

            const itemsPayload: Partial<RequirementItem>[] = rows.map((row, i) => {
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

            await bulkUpsert.mutateAsync({ projectId, items: itemsPayload });
            e.target.value = '';
        } catch (err: any) {
            toast.error('Import failed: ' + err.message);
            e.target.value = '';
        }
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const toolbarFilters = (
        <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 text-xs w-36 border-border/60">
                <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    const listModeControls = (
        <div className="flex items-center gap-2">
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
        </div>
    );

    const listContent = (
        <ScrollArea className="flex-1 pr-4 bg-background border rounded-md shadow-sm p-4">
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
        </ScrollArea>
    );

    return (
        <TooltipProvider>
            <div className="flex flex-col h-full bg-background overflow-hidden">
                <DataRegisterPage
                    title="Requirements Matrix"
                    description="Traceability matrix for project requirements"
                    icon={ClipboardList}
                    iconBgClass="bg-primary/20"
                    iconColorClass="text-primary"
                    searchQuery={searchTerm}
                    onSearchChange={setSearchTerm}
                    toolbarFilters={toolbarFilters}
                    listModeControls={listModeControls}
                    onAddRow={() => setIsAddOpen(true)}
                    addLabel="Add Requirement"
                    data={filteredItems}
                    baseColumns={STANDARD_COLUMNS}
                    customColumns={customColumns}
                    idExtractor={(item) => item.id}
                    customFieldExtractor={(item, key) => String(item.custom_fields?.[key] ?? '')}
                    onCellSave={handleCellSave}
                    onAddColumn={(col) => {
                        if (customColumns.find(c => c.key === col.key)) {
                            toast.error('Column already exists');
                            return;
                        }
                        setCustomColumns(prev => [...prev, col]);
                        toast.success(`Column "${col.label}" added`);
                    }}
                    onRemoveColumn={(key) => setCustomColumns(prev => prev.filter(c => c.key !== key))}
                    onDeleteRows={(ids) => {
                        if (projectId) {
                            ids.forEach(id => deleteReq.mutate({ id, project_id: projectId }));
                        }
                    }}
                    emptyStateMessage={searchTerm || filterStatus !== 'all' ? 'No requirements match your filters.' : 'No requirements added yet.'}
                    listContent={listContent}
                />

                {/* Footer bar */}
                <div className="flex items-center gap-4 px-6 py-2 border-t bg-muted/30 text-xs text-muted-foreground shrink-0 mt-auto">
                    <span>{items.length} total requirements</span>
                    <span>·</span>
                    <span>{items.filter(i => i.status === 'Approved').length} approved</span>
                    <span>·</span>
                    <span>{items.filter(i => i.status === 'Open').length} open</span>
                    <span>·</span>
                    <span>{items.filter(i => i.status === 'Implemented').length} implemented</span>
                </div>

                <EntityFormDialog
                    open={isAddOpen}
                    onOpenChange={setIsAddOpen}
                    title="Add Requirement"
                    description="Create a new system requirement."
                    onSubmit={handleAddRow}
                    loading={createReq.isPending}
                >
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Requirement Title *</Label>
                            <Input
                                required
                                value={newRequirement.requirement}
                                onChange={e => setNewRequirement({ ...newRequirement, requirement: e.target.value })}
                                placeholder="e.g. Single Sign-On Authentication"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={newRequirement.description}
                                onChange={e => setNewRequirement({ ...newRequirement, description: e.target.value })}
                                placeholder="Detailed description of the requirement"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Module</Label>
                                <Input
                                    value={newRequirement.module}
                                    onChange={e => setNewRequirement({ ...newRequirement, module: e.target.value })}
                                    placeholder="e.g. Security"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Process</Label>
                                <Input
                                    value={newRequirement.process}
                                    onChange={e => setNewRequirement({ ...newRequirement, process: e.target.value })}
                                    placeholder="e.g. User Login"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Owner</Label>
                            <Input
                                value={newRequirement.owner}
                                onChange={e => setNewRequirement({ ...newRequirement, owner: e.target.value })}
                                placeholder="e.g. John Doe"
                            />
                        </div>
                    </div>
                </EntityFormDialog>
            </div>
        </TooltipProvider>
    );
}
