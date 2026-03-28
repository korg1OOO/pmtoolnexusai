import React, { useState, useMemo } from 'react';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useAuth } from '@/hooks/useAuth';
import { useQualityRegister, useCreateQualityItem, useUpdateQualityItem, useDeleteQualityItem, QualityItem } from '@/hooks/useQualityRegister';
import { DataRegisterPage } from '@/components/ui/DataRegisterPage';
import { EntityFormDialog } from '@/components/ui/EntityFormDialog';
import { type DynamicColumnDef } from '@/components/ui/DynamicDataGrid';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Loader2, MoreHorizontal, Calendar, User, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const STATUS_OPTIONS = ['pending', 'passed', 'failed', 'conditional'] as const;

const STANDARD_COLUMNS: DynamicColumnDef<QualityItem>[] = [
    { key: 'item_name', label: 'Item Name', width: 250, type: 'text', sticky: true },
    { key: 'standard_reference', label: 'Standard/Reference', width: 200, type: 'text' },
    { key: 'status', label: 'Status', width: 140, type: 'select', options: [...STATUS_OPTIONS] },
    { key: 'inspection_date', label: 'Inspection Date', width: 140, type: 'date' },
    { key: 'inspector_name', label: 'Inspector', width: 160, type: 'text' },
    { key: 'comments', label: 'Comments', width: 300, type: 'text' },
];

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700 border-gray-200',
    passed: 'bg-green-100 text-green-700 border-green-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
    conditional: 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function QualityRegisterView() {
    const { settings: project } = useProjectContext();
    const projectId = project?.id ?? null;
    const { user } = useAuth();

    // Data hooks
    const { data: items = [], isLoading } = useQualityRegister(projectId);
    const createItem = useCreateQualityItem();
    const updateItem = useUpdateQualityItem();
    const deleteItem = useDeleteQualityItem();

    // Local state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [customColumns, setCustomColumns] = useState<DynamicColumnDef<QualityItem>[]>([]);

    // Form state
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newItem, setNewItem] = useState({
        item_name: '',
        standard_reference: '',
        status: 'pending' as QualityItem['status'],
        inspection_date: new Date().toISOString().split('T')[0],
        comments: '',
    });

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchSearch = !searchQuery ||
                item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.comments && item.comments.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchStatus = filterStatus === 'all' || item.status === filterStatus;
            return matchSearch && matchStatus;
        });
    }, [items, searchQuery, filterStatus]);

    const stats = useMemo(() => ({
        total: items.length,
        passed: items.filter(i => i.status === 'passed').length,
        failed: items.filter(i => i.status === 'failed').length,
        pending: items.filter(i => i.status === 'pending').length,
    }), [items]);

    const handleCellSave = async (rowId: string, key: string, value: string) => {
        if (!projectId) return;
        const isCustom = !STANDARD_COLUMNS.find(c => c.key === key);
        const item = items.find(i => i.id === rowId);
        if (!item) return;

        if (isCustom) {
            const cf = { ...(item.custom_fields ?? {}), [key]: value };
            await updateItem.mutateAsync({ id: rowId, project_id: projectId, custom_fields: cf });
        } else {
            await updateItem.mutateAsync({ id: rowId, project_id: projectId, [key]: value } as any);
        }
    };

    const handleCreate = async () => {
        if (!projectId || !newItem.item_name) return;

        await createItem.mutateAsync({
            project_id: projectId,
            item_name: newItem.item_name,
            standard_reference: newItem.standard_reference,
            status: newItem.status,
            inspection_date: newItem.inspection_date,
            inspector_name: user?.user_metadata?.full_name || 'Inspector',
            comments: newItem.comments,
        });

        setIsAddOpen(false);
        setNewItem({
            item_name: '',
            standard_reference: '',
            status: 'pending',
            inspection_date: new Date().toISOString().split('T')[0],
            comments: '',
        });
        toast.success('Quality item added successfully');
    };

    const handleDelete = async (id: string) => {
        if (!projectId) return;
        await deleteItem.mutateAsync({ id, project_id: projectId });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!projectId) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-12">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
                <p className="text-muted-foreground">Select a project to view its quality register.</p>
            </div>
        );
    }

    const kpiCards = (
        <>
            <Card>
                <CardContent className="p-4">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-sm text-muted-foreground">Total Inspections</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <div className="text-2xl font-bold text-success">{stats.passed}</div>
                    <p className="text-sm text-muted-foreground">Passed</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4">
                    <div className="text-2xl font-bold text-muted-foreground">{stats.pending}</div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                </CardContent>
            </Card>
        </>
    );

    const toolbarFilters = (
        <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 text-xs w-36 border-border/60">
                <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    const listContent = (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 overflow-auto">
            {filteredItems.map(item => (
                <Card key={item.id} className="group hover:border-primary/30 transition-colors shadow-sm">
                    <CardContent className="p-4 flex flex-col h-full">
                        <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                                <h3 className="font-semibold text-sm leading-tight mb-1 group-hover:text-primary transition-colors">
                                    {item.item_name}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={cn("text-[10px] h-5 capitalize", STATUS_COLORS[item.status] || STATUS_COLORS.pending)}>
                                        {item.status}
                                    </Badge>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-1">
                                        <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive focus:text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 h-8 mb-4">
                            {item.comments || 'No comments provided.'}
                        </p>

                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs bg-muted/30 p-2.5 rounded-md mt-auto">
                            <div>
                                <span className="text-muted-foreground block mb-0.5">Reference</span>
                                <span className="font-medium truncate block" title={item.standard_reference || '-'}>
                                    {item.standard_reference || '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-0.5">Inspector</span>
                                <span className="font-medium truncate block flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {item.inspector_name || 'Unassigned'}
                                </span>
                            </div>
                            <div className="col-span-2 pt-1 border-t border-dashed mt-1">
                                <span className="text-muted-foreground block mb-0.5">Inspection Date</span>
                                <span className="font-medium flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {item.inspection_date ? format(new Date(item.inspection_date), 'MMM d, yyyy') : '-'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <>
            <DataRegisterPage
                title="Quality Register"
                description="Track and manage quality inspections, standards, and outcomes."
                icon={ClipboardCheck}
                iconBgClass="bg-primary/20"
                iconColorClass="text-primary"
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                toolbarFilters={toolbarFilters}
                onAddRow={() => setIsAddOpen(true)}
                addLabel="Add Record"
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
                    ids.forEach(id => handleDelete(id));
                }}
                emptyStateMessage={searchQuery || filterStatus !== 'all' ? 'No records match your filters.' : 'No quality records added yet.'}
                kpiCards={kpiCards}
                listContent={listContent}
                pdfFilename="quality_register"
            />

            <EntityFormDialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                title="Add Quality Record"
                description="Create a new quality inspection or assurance record."
                onSubmit={handleCreate}
                loading={createItem.isPending}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Item Name *</Label>
                        <Input
                            required
                            value={newItem.item_name}
                            onChange={e => setNewItem({ ...newItem, item_name: e.target.value })}
                            placeholder="e.g. Phase 1 Deliverables Review"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={newItem.status} onValueChange={(v: any) => setNewItem({ ...newItem, status: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="passed">Passed</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                    <SelectItem value="conditional">Conditional</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Inspection Date</Label>
                            <Input
                                type="date"
                                value={newItem.inspection_date}
                                onChange={e => setNewItem({ ...newItem, inspection_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Standard / Reference</Label>
                        <Input
                            value={newItem.standard_reference}
                            onChange={e => setNewItem({ ...newItem, standard_reference: e.target.value })}
                            placeholder="e.g. ISO 9001, PRD v2.1"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Comments</Label>
                        <Textarea
                            value={newItem.comments}
                            onChange={e => setNewItem({ ...newItem, comments: e.target.value })}
                            placeholder="Inspection notes or findings..."
                            className="h-24"
                        />
                    </div>
                </div>
            </EntityFormDialog>
        </>
    );
}
