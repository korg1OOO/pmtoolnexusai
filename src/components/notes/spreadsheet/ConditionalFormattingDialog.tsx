import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import type { ConditionalFormat } from './formatting';
import type { Selection } from './types';

interface ConditionalFormattingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selection: Selection | null;
    existingFormats: ConditionalFormat[];
    onSaveFormat: (format: ConditionalFormat) => void;
    onDeleteFormat: (formatId: string) => void;
}

export function ConditionalFormattingDialog({
    open,
    onOpenChange,
    selection,
    existingFormats,
    onSaveFormat,
    onDeleteFormat,
}: ConditionalFormattingDialogProps) {
    const [ruleType, setRuleType] = useState<ConditionalFormat['type']>('value');
    const [operator, setOperator] = useState<string>('greaterThan');
    const [value1, setValue1] = useState('');
    const [value2, setValue2] = useState('');
    const [formula, setFormula] = useState('');

    // Style state
    const [backgroundColor, setBackgroundColor] = useState('#dcfce7'); // Light green
    const [textColor, setTextColor] = useState('#000000');
    const [bold, setBold] = useState(false);
    const [italic, setItalic] = useState(false);
    const [underline, setUnderline] = useState(false);

    // Get formats for current selection
    const selectionFormats = selection ? existingFormats.filter(format => {
        const { startRow, endRow, startCol, endCol } = format.range;
        return !(
            format.range.endRow < selection.start.row ||
            format.range.startRow > selection.end.row ||
            format.range.endCol < selection.start.col ||
            format.range.startCol > selection.end.col
        );
    }) : [];

    const resetForm = () => {
        setRuleType('value');
        setOperator('greaterThan');
        setValue1('');
        setValue2('');
        setFormula('');
        setBackgroundColor('#dcfce7');
        setTextColor('#000000');
        setBold(false);
        setItalic(false);
        setUnderline(false);
    };

    const handleSave = () => {
        if (!selection) return;

        const format: ConditionalFormat = {
            id: `cf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            range: {
                startRow: Math.min(selection.start.row, selection.end.row),
                endRow: Math.max(selection.start.row, selection.end.row),
                startCol: Math.min(selection.start.col, selection.end.col),
                endCol: Math.max(selection.start.col, selection.end.col),
            },
            type: ruleType,
            rule: ruleType === 'formula'
                ? { formula }
                : {
                    operator: operator as any,
                    value: value1,
                    value2: operator === 'between' ? value2 : undefined,
                },
            style: {
                backgroundColor,
                textColor,
                bold,
                italic,
                underline,
            },
            priority: existingFormats.length, // Lower number = higher priority
        };

        onSaveFormat(format);
        resetForm();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Conditional Formatting</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Rule Type Selection */}
                    <div className="space-y-2">
                        <Label>Rule Type</Label>
                        <Select value={ruleType} onValueChange={(v) => setRuleType(v as any)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="value">Value-Based Rule</SelectItem>
                                <SelectItem value="formula">Formula-Based Rule</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Value-Based Rules */}
                    {ruleType === 'value' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Condition</Label>
                                <Select value={operator} onValueChange={setOperator}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="greaterThan">Greater than</SelectItem>
                                        <SelectItem value="lessThan">Less than</SelectItem>
                                        <SelectItem value="between">Between</SelectItem>
                                        <SelectItem value="equal">Equal to</SelectItem>
                                        <SelectItem value="notEqual">Not equal to</SelectItem>
                                        <SelectItem value="contains">Contains text</SelectItem>
                                        <SelectItem value="startsWith">Starts with</SelectItem>
                                        <SelectItem value="endsWith">Ends with</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Value</Label>
                                <Input
                                    value={value1}
                                    onChange={(e) => setValue1(e.target.value)}
                                    placeholder="Enter value"
                                />
                            </div>

                            {operator === 'between' && (
                                <div className="space-y-2">
                                    <Label>And</Label>
                                    <Input
                                        value={value2}
                                        onChange={(e) => setValue2(e.target.value)}
                                        placeholder="Enter second value"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Formula-Based Rules */}
                    {ruleType === 'formula' && (
                        <div className="space-y-2">
                            <Label>Formula</Label>
                            <Input
                                value={formula}
                                onChange={(e) => setFormula(e.target.value)}
                                placeholder="=A1>100"
                            />
                            <p className="text-sm text-muted-foreground">
                                Formula must return TRUE or FALSE
                            </p>
                        </div>
                    )}

                    {/* Style Configuration */}
                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-medium">Formatting Style</h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Background Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={backgroundColor}
                                        onChange={(e) => setBackgroundColor(e.target.value)}
                                        className="w-16 h-10"
                                    />
                                    <Input
                                        value={backgroundColor}
                                        onChange={(e) => setBackgroundColor(e.target.value)}
                                        placeholder="#dcfce7"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Text Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={textColor}
                                        onChange={(e) => setTextColor(e.target.value)}
                                        className="w-16 h-10"
                                    />
                                    <Input
                                        value={textColor}
                                        onChange={(e) => setTextColor(e.target.value)}
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Text Formatting Toggles */}
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={bold}
                                    onChange={(e) => setBold(e.target.checked)}
                                    className="rounded"
                                />
                                <span className="font-bold">Bold</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={italic}
                                    onChange={(e) => setItalic(e.target.checked)}
                                    className="rounded"
                                />
                                <span className="italic">Italic</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={underline}
                                    onChange={(e) => setUnderline(e.target.checked)}
                                    className="rounded"
                                />
                                <span className="underline">Underline</span>
                            </label>
                        </div>

                        {/* Preview */}
                        <div className="space-y-2">
                            <Label>Preview</Label>
                            <div
                                className="p-4 border rounded text-center"
                                style={{
                                    backgroundColor,
                                    color: textColor,
                                    fontWeight: bold ? 'bold' : 'normal',
                                    fontStyle: italic ? 'italic' : 'normal',
                                    textDecoration: underline ? 'underline' : 'none',
                                }}
                            >
                                Sample Text
                            </div>
                        </div>
                    </div>

                    {/* Existing Rules for Selection */}
                    {selectionFormats.length > 0 && (
                        <div className="space-y-2 pt-4 border-t">
                            <Label>Existing Rules for Selection</Label>
                            <div className="space-y-2">
                                {selectionFormats.map((format) => (
                                    <div
                                        key={format.id}
                                        className="flex items-center justify-between p-3 border rounded"
                                    >
                                        <div className="flex-1">
                                            <div className="text-sm">
                                                {format.type === 'formula' ? (
                                                    <span>Formula: {format.rule.formula}</span>
                                                ) : (
                                                    <span>
                                                        {format.rule.operator} {format.rule.value}
                                                        {format.rule.value2 && ` and ${format.rule.value2}`}
                                                    </span>
                                                )}
                                            </div>
                                            <div
                                                className="text-xs mt-1 inline-block px-2 py-1 rounded"
                                                style={{
                                                    backgroundColor: format.style.backgroundColor,
                                                    color: format.style.textColor,
                                                }}
                                            >
                                                Preview
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDeleteFormat(format.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!selection}>
                        Add Rule
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
