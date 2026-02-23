import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Search, List, Table, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PDFExporter, type PDFExportSection } from '@/components/common/PDFExporter';
import { DynamicDataGrid, type DynamicColumnDef } from '@/components/ui/DynamicDataGrid';

interface DataRegisterPageProps<T> {
    // Header Props
    title: string;
    description: string;
    icon: LucideIcon;
    iconBgClass?: string;
    iconColorClass?: string;

    // Search & Filter Props
    searchQuery?: string;
    onSearchChange?: (val: string) => void;
    toolbarFilters?: React.ReactNode;
    listModeControls?: React.ReactNode;

    // Actions
    onAddRow?: () => void;
    addLabel?: string;

    // PDF Export
    pdfSections?: PDFExportSection[];
    pdfFilename?: string;

    // Data Grid Props
    data: T[];
    baseColumns: DynamicColumnDef<T>[];
    customColumns?: DynamicColumnDef<T>[];
    idExtractor: (item: T) => string;
    customFieldExtractor?: (item: T, key: string) => string;
    onCellSave: (rowId: string, key: string, value: string) => Promise<void>;
    onAddColumn?: (col: DynamicColumnDef<T>) => void;
    onRemoveColumn?: (key: string) => void;
    onDeleteRows?: (ids: Set<string>) => void;
    emptyStateMessage?: string;

    // List View Content
    kpiCards?: React.ReactNode;
    listContent: React.ReactNode;
}

export function DataRegisterPage<T>({
    title,
    description,
    icon: Icon,
    iconBgClass = "bg-primary/20",
    iconColorClass = "text-primary",
    searchQuery,
    onSearchChange,
    toolbarFilters,
    listModeControls,
    onAddRow,
    addLabel = "Add Item",
    pdfSections = [],
    pdfFilename = "export",
    data,
    baseColumns,
    customColumns = [],
    idExtractor,
    customFieldExtractor,
    onCellSave,
    onAddColumn,
    onRemoveColumn,
    onDeleteRows,
    emptyStateMessage,
    kpiCards,
    listContent
}: DataRegisterPageProps<T>) {
    const [viewMode, setViewMode] = useState<'list' | 'spreadsheet'>('list');
    const contentRef = useRef<HTMLDivElement>(null);

    // Default PDF sections if none provided, but we assume the page might want specific ones.
    const exportedSections = pdfSections.length > 0 ? pdfSections : [
        { id: 'list', name: 'List View', selector: '[data-section="list"]' }
    ];

    const showToolbar = searchQuery !== undefined || toolbarFilters || (viewMode === 'list' && listModeControls);

    return (
        <div className="flex flex-col h-full" ref={contentRef}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 px-6 pt-6 shrink-0">
                <div className="flex items-center gap-3">
                    <div className={cn("p-3 rounded-xl", iconBgClass)}>
                        <Icon className={cn("h-8 w-8", iconColorClass)} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{title}</h1>
                        <p className="text-muted-foreground mt-1">{description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'spreadsheet')} className="w-auto mr-2">
                        <TabsList className="h-8">
                            <TabsTrigger value="list" className="h-6 px-2.5 text-xs"><List className="h-3.5 w-3.5 mr-1.5" /> Dashboard & List</TabsTrigger>
                            <TabsTrigger value="spreadsheet" className="h-6 px-2.5 text-xs"><Table className="h-3.5 w-3.5 mr-1.5" /> Spreadsheet</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <PDFExporter
                        title={title}
                        filename={pdfFilename}
                        contentRef={contentRef}
                        sections={exportedSections}
                        showSectionPicker
                        variant="dropdown"
                    />

                    {viewMode !== 'spreadsheet' && onAddRow && (
                        <Button size="sm" onClick={onAddRow}>
                            <Plus className="h-4 w-4 mr-1" />
                            {addLabel}
                        </Button>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            {viewMode !== 'spreadsheet' && showToolbar && (
                <div className="flex items-center justify-between gap-3 px-6 py-2.5 border-b bg-muted/30 shrink-0 mb-6">
                    <div className="flex items-center gap-3 flex-1">
                        {searchQuery !== undefined && onSearchChange !== undefined && (
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    className="pl-8 h-8 text-xs w-56 border-border/60"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                />
                            </div>
                        )}
                        {toolbarFilters && (
                            <div className="flex items-center gap-2 h-8">
                                {toolbarFilters}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {listModeControls && (
                            <div className="flex gap-1 p-1 bg-muted rounded-lg h-8 items-center border">
                                {listModeControls}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className={cn("flex-1", viewMode === 'spreadsheet' ? 'overflow-hidden border-t-0 bg-muted/10' : 'overflow-auto flex flex-col px-6 pb-6 space-y-6')}>
                {viewMode === 'spreadsheet' ? (
                    <div className="h-full p-6">
                        <div className="h-full bg-background border rounded-md shadow-sm overflow-hidden">
                            <DynamicDataGrid
                                data={data}
                                baseColumns={baseColumns}
                                customColumns={customColumns}
                                idExtractor={idExtractor}
                                customFieldExtractor={customFieldExtractor}
                                onCellSave={onCellSave}
                                onDeleteRows={onDeleteRows}
                                onAddColumn={onAddColumn}
                                onRemoveColumn={onRemoveColumn}
                                onAddRow={onAddRow}
                                emptyStateMessage={emptyStateMessage || "No items found."}
                                containerStyles="h-full border-0"
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* List Mode View */}
                        {kpiCards && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 shrink-0">
                                {kpiCards}
                            </div>
                        )}

                        <div className="flex-1 space-y-4" data-section="list">
                            {listContent}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
