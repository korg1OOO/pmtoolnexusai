import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, AreaChart as AreaChartIcon, ScatterChart } from 'lucide-react';
import { ChartRenderer } from './ChartRenderer';
import { generateChartId, getChartTypeName, validateChartRange } from './utils';
import { DEFAULT_CHART_OPTIONS } from './types';
import type { ChartConfig, ChartType, ChartDataRange, ChartOptions } from './types';
import type { Selection } from '../types';

interface ChartDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selection: Selection | null;
    spreadsheetData: any[][];
    onCreateChart?: (config: ChartConfig) => void;
    onUpdateChart?: (updates: Partial<ChartConfig>) => void;
    editingChart?: ChartConfig;
}

const CHART_TYPES: Array<{ type: ChartType; label: string; icon: React.ReactNode }> = [
    { type: 'line', label: 'Line Chart', icon: <LineChartIcon className="h-5 w-5" /> },
    { type: 'bar', label: 'Bar Chart', icon: <BarChart3 className="h-5 w-5" /> },
    { type: 'pie', label: 'Pie Chart', icon: <PieChartIcon className="h-5 w-5" /> },
    { type: 'area', label: 'Area Chart', icon: <AreaChartIcon className="h-5 w-5" /> },
    { type: 'scatter', label: 'Scatter Plot', icon: <ScatterChart className="h-5 w-5" /> },
];

export function ChartDialog({ open, onOpenChange, selection, spreadsheetData, onCreateChart, onUpdateChart, editingChart }: ChartDialogProps) {
    const isEditing = !!editingChart;
    const [chartType, setChartType] = useState<ChartType>('line');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Data range
    const [dataRange, setDataRange] = useState<ChartDataRange>({
        startRow: selection?.start.row || 0,
        endRow: selection?.end.row || 0,
        startCol: selection?.start.col || 0,
        endCol: selection?.end.col || 0,
    });

    // Chart options
    const [options, setOptions] = useState<ChartOptions>({ ...DEFAULT_CHART_OPTIONS });

    // Load editing chart data
    useEffect(() => {
        if (editingChart) {
            setChartType(editingChart.type);
            setTitle(editingChart.title);
            setDescription(editingChart.description || '');
            setDataRange(editingChart.dataRange);
            setOptions(editingChart.options);
        } else {
            // Reset to defaults for new chart
            setChartType('line');
            setTitle('');
            setDescription('');
            setOptions({ ...DEFAULT_CHART_OPTIONS });
        }
    }, [editingChart, open]);

    // Update data range when selection changes  (only for new charts)
    useEffect(() => {
        if (selection && !isEditing) {
            setDataRange({
                startRow: Math.min(selection.start.row, selection.end.row),
                endRow: Math.max(selection.start.row, selection.end.row),
                startCol: Math.min(selection.start.col, selection.end.col),
                endCol: Math.max(selection.start.col, selection.end.col),
            });
        }
    }, [selection]);

    const handleSave = () => {
        const validation = validateChartRange(
            dataRange,
            spreadsheetData.length,
            spreadsheetData[0]?.length || 0
        );

        if (!validation.valid) {
            toast.error(validation.error);
            return;
        }

        if (isEditing && onUpdateChart) {
            // Update existing chart
            onUpdateChart({
                type: chartType,
                title: title || getChartTypeName(chartType),
                description,
                dataRange,
                options,
            });
        } else if (onCreateChart) {
            // Create new chart
            const config: ChartConfig = {
                id: generateChartId(),
                type: chartType,
                title: title || getChartTypeName(chartType),
                description,
                dataRange,
                options,
                position: { x: 50, y: 50 },
                size: { width: 500, height: 300 },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            onCreateChart(config);
        }

        onOpenChange(false);
    };

    const previewConfig: ChartConfig = {
        id: 'preview',
        type: chartType,
        title: title || getChartTypeName(chartType),
        description,
        dataRange,
        options,
        position: { x: 0, y: 0 },
        size: { width: 400, height: 250 },
        createdAt: '',
        updatedAt: '',
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Chart' : 'Create Chart'}</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6">
                    {/* Left side: Configuration */}
                    <div className="space-y-4">
                        {/* Chart Type Selection */}
                        <div className="space-y-2">
                            <Label>Chart Type</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {CHART_TYPES.map(({ type, label, icon }) => (
                                    <Button
                                        key={type}
                                        variant={chartType === type ? 'default' : 'outline'}
                                        className="justify-start gap-2"
                                        onClick={() => setChartType(type)}
                                    >
                                        {icon}
                                        {label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-2">
                            <Label htmlFor="chart-title">Chart Title</Label>
                            <Input
                                id="chart-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={getChartTypeName(chartType)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="chart-desc">Description (optional)</Label>
                            <Input
                                id="chart-desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Chart description"
                            />
                        </div>

                        {/* Data Range */}
                        <div className="space-y-2">
                            <Label>Data Range</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    type="number"
                                    value={dataRange.startRow}
                                    onChange={(e) => setDataRange({ ...dataRange, startRow: parseInt(e.target.value) || 0 })}
                                    placeholder="Start Row"
                                />
                                <Input
                                    type="number"
                                    value={dataRange.endRow}
                                    onChange={(e) => setDataRange({ ...dataRange, endRow: parseInt(e.target.value) || 0 })}
                                    placeholder="End Row"
                                />
                                <Input
                                    type="number"
                                    value={dataRange.startCol}
                                    onChange={(e) => setDataRange({ ...dataRange, startCol: parseInt(e.target.value) || 0 })}
                                    placeholder="Start Col"
                                />
                                <Input
                                    type="number"
                                    value={dataRange.endCol}
                                    onChange={(e) => setDataRange({ ...dataRange, endCol: parseInt(e.target.value) || 0 })}
                                    placeholder="End Col"
                                />
                            </div>
                        </div>

                        {/* Axis Labels */}
                        <div className="space-y-2">
                            <Label htmlFor="x-axis">X-Axis Label</Label>
                            <Input
                                id="x-axis"
                                value={options.xAxisLabel || ''}
                                onChange={(e) => setOptions({ ...options, xAxisLabel: e.target.value })}
                                placeholder="X-Axis"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="y-axis">Y-Axis Label</Label>
                            <Input
                                id="y-axis"
                                value={options.yAxisLabel || ''}
                                onChange={(e) => setOptions({ ...options, yAxisLabel: e.target.value })}
                                placeholder="Y-Axis"
                            />
                        </div>

                        {/* Legend */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="show-legend"
                                    checked={options.showLegend}
                                    onCheckedChange={(checked) => setOptions({ ...options, showLegend: checked as boolean })}
                                />
                                <Label htmlFor="show-legend">Show Legend</Label>
                            </div>

                            {options.showLegend && (
                                <Select
                                    value={options.legendPosition}
                                    onValueChange={(value) => setOptions({ ...options, legendPosition: value as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="top">Top</SelectItem>
                                        <SelectItem value="bottom">Bottom</SelectItem>
                                        <SelectItem value="left">Left</SelectItem>
                                        <SelectItem value="right">Right</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Chart-specific options */}
                        {(chartType === 'line' || chartType === 'area') && (
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="smooth"
                                    checked={options.smooth}
                                    onCheckedChange={(checked) => setOptions({ ...options, smooth: checked as boolean })}
                                />
                                <Label htmlFor="smooth">Smooth Curves</Label>
                            </div>
                        )}

                        {chartType === 'line' && (
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="show-dots"
                                    checked={options.showDataPoints}
                                    onCheckedChange={(checked) => setOptions({ ...options, showDataPoints: checked as boolean })}
                                />
                                <Label htmlFor="show-dots">Show Data Points</Label>
                            </div>
                        )}

                        {(chartType === 'bar' || chartType === 'area') && (
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="stacked"
                                    checked={options.stacked}
                                    onCheckedChange={(checked) => setOptions({ ...options, stacked: checked as boolean })}
                                />
                                <Label htmlFor="stacked">Stacked</Label>
                            </div>
                        )}

                        {chartType === 'pie' && (
                            <>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="donut"
                                        checked={options.donut}
                                        onCheckedChange={(checked) => setOptions({ ...options, donut: checked as boolean })}
                                    />
                                    <Label htmlFor="donut">Donut Chart</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="show-labels"
                                        checked={options.showLabels}
                                        onCheckedChange={(checked) => setOptions({ ...options, showLabels: checked as boolean })}
                                    />
                                    <Label htmlFor="show-labels">Show Labels</Label>
                                </div>
                            </>
                        )}

                        {/* Grid & Animation */}
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="show-grid"
                                checked={options.showGrid}
                                onCheckedChange={(checked) => setOptions({ ...options, showGrid: checked as boolean })}
                            />
                            <Label htmlFor="show-grid">Show Grid</Label>
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="animated"
                                checked={options.animated}
                                onCheckedChange={(checked) => setOptions({ ...options, animated: checked as boolean })}
                            />
                            <Label htmlFor="animated">Animated</Label>
                        </div>
                    </div>

                    {/* Right side: Preview */}
                    <div className="space-y-2">
                        <Label>Preview</Label>
                        <div className="border border-border rounded-lg p-4 bg-muted/20" style={{ height: '600px' }}>
                            <ChartRenderer config={previewConfig} data={spreadsheetData} />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>{isEditing ? 'Update Chart' : 'Create Chart'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
