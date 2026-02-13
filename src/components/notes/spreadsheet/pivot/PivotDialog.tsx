import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Table2 } from 'lucide-react';
import type { PivotTableConfig, ValueField } from './types';
import { PivotTableEngine } from './PivotTableEngine';

interface PivotDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sourceData: any[][];
    defaultRange?: PivotTableConfig['sourceRange'];
    onCreatePivot: (config: PivotTableConfig) => void;
}

export function PivotDialog({
    open,
    onOpenChange,
    sourceData,
    defaultRange,
    onCreatePivot,
}: PivotDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [headers, setHeaders] = useState<string[]>([]);
    const [rowFields, setRowFields] = useState<string[]>([]);
    const [columnFields, setColumnFields] = useState<string[]>([]);
    const [valueFields, setValueFields] = useState<ValueField[]>([]);
    const [showGrandTotals, setShowGrandTotals] = useState(true);
    const [showSubtotals, setShowSubtotals] = useState(true);

    // Extract headers from first row of source data
    useEffect(() => {
        if (open && sourceData.length > 0 && defaultRange) {
            const firstRow = sourceData[defaultRange.startRow] || [];
            const extractedHeaders: string[] = [];

            for (let col = defaultRange.startCol; col <= defaultRange.endCol; col++) {
                extractedHeaders.push(String(firstRow[col] || `Column ${col + 1}`));
            }

            setHeaders(extractedHeaders);
        }
    }, [open, sourceData, defaultRange]);

    const availableFields = headers.filter(
        (h) => !rowFields.includes(h) && !columnFields.includes(h) && !valueFields.some(v => v.column === h)
    );

    const handleAddRowField = (field: string) => {
        setRowFields([...rowFields, field]);
    };

    const handleAddColumnField = (field: string) => {
        setColumnFields([...columnFields, field]);
    };

    const handleAddValueField = (field: string) => {
        setValueFields([...valueFields, {
            column: field,
            aggregation: 'sum',
            label: field,
        }]);
    };

    const handleRemoveRowField = (field: string) => {
        setRowFields(rowFields.filter(f => f !== field));
    };

    const handleRemoveColumnField = (field: string) => {
        setColumnFields(columnFields.filter(f => f !== field));
    };

    const handleRemoveValueField = (index: number) => {
        setValueFields(valueFields.filter((_, i) => i !== index));
    };

    const handleValueAggregationChange = (index: number, aggregation: ValueField['aggregation']) => {
        const updated = [...valueFields];
        updated[index].aggregation = aggregation;
        setValueFields(updated);
    };

    const handleCreate = () => {
        if (!name.trim() || !defaultRange) return;
        if (valueFields.length === 0) return;
        if (rowFields.length === 0 && columnFields.length === 0) return;

        const config: PivotTableConfig = {
            id: `pivot-${Date.now()}`,
            name: name.trim(),
            description: description.trim(),
            sourceRange: defaultRange,
            rows: rowFields,
            columns: columnFields,
            values: valueFields,
            position: { x: 50, y: 50 },
            size: { width: 600, height: 400 },
            showGrandTotals,
            showSubtotals,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        onCreatePivot(config);
        handleClose();
    };

    const handleClose = () => {
        setName('');
        setDescription('');
        setRowFields([]);
        setColumnFields([]);
        setValueFields([]);
        onOpenChange(false);
    };

    const canCreate = name.trim() && valueFields.length > 0 && (rowFields.length > 0 || columnFields.length > 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Table2 className="h-5 w-5" />
                        Create Pivot Table
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Name & Description */}
                    <div className="space-y-4">
                        <div>
                            <Label>Name *</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Sales by Region"
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optional description"
                            />
                        </div>
                    </div>

                    {/* Available Fields */}
                    <div>
                        <Label>Available Fields</Label>
                        <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[60px] bg-muted/30">
                            {availableFields.map((field) => (
                                <Badge
                                    key={field}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-secondary/80"
                                >
                                    {field}
                                </Badge>
                            ))}
                            {availableFields.length === 0 && (
                                <p className="text-sm text-muted-foreground">All fields assigned</p>
                            )}
                        </div>
                    </div>

                    {/* Row Fields */}
                    <div>
                        <Label>Rows</Label>
                        <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[60px]">
                            {rowFields.map((field) => (
                                <Badge key={field} className="gap-1">
                                    {field}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => handleRemoveRowField(field)}
                                    />
                                </Badge>
                            ))}
                            {rowFields.length === 0 && (
                                <p className="text-xs text-muted-foreground">Drag fields here or select from available fields</p>
                            )}
                        </div>
                        <div className="flex gap-2 mt-2">
                            <Select onValueChange={handleAddRowField}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Add row field" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableFields.map((field) => (
                                        <SelectItem key={field} value={field}>
                                            {field}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Column Fields */}
                    <div>
                        <Label>Columns</Label>
                        <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[60px]">
                            {columnFields.map((field) => (
                                <Badge key={field} className="gap-1">
                                    {field}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => handleRemoveColumnField(field)}
                                    />
                                </Badge>
                            ))}
                            {columnFields.length === 0 && (
                                <p className="text-xs text-muted-foreground">Optional - leave empty for simple grouping</p>
                            )}
                        </div>
                        <div className="flex gap-2 mt-2">
                            <Select onValueChange={handleAddColumnField}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Add column field" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableFields.map((field) => (
                                        <SelectItem key={field} value={field}>
                                            {field}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Value Fields */}
                    <div>
                        <Label>Values *</Label>
                        <div className="space-y-2">
                            {valueFields.map((valueField, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                    <Badge variant="outline">{valueField.column}</Badge>
                                    <Select
                                        value={valueField.aggregation}
                                        onValueChange={(v) => handleValueAggregationChange(index, v as ValueField['aggregation'])}
                                    >
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sum">Sum</SelectItem>
                                            <SelectItem value="average">Average</SelectItem>
                                            <SelectItem value="count">Count</SelectItem>
                                            <SelectItem value="count-numbers">Count Numbers</SelectItem>
                                            <SelectItem value="min">Min</SelectItem>
                                            <SelectItem value="max">Max</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="ml-auto"
                                        onClick={() => handleRemoveValueField(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                            <Select onValueChange={handleAddValueField}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Add value field" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableFields.map((field) => (
                                        <SelectItem key={field} value={field}>
                                            {field}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={showGrandTotals}
                                onChange={(e) => setShowGrandTotals(e.target.checked)}
                            />
                            <span className="text-sm">Show Grand Totals</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={showSubtotals}
                                onChange={(e) => setShowSubtotals(e.target.checked)}
                            />
                            <span className="text-sm">Show Subtotals</span>
                        </label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!canCreate}>
                        Create Pivot Table
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
