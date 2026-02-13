import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { ValidationRule } from './validation';
import { Selection } from './types';

interface DataValidationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selection: Selection | null;
    existingRules: ValidationRule[];
    onSaveRule: (rule: ValidationRule) => void;
    onDeleteRule: (ruleId: string) => void;
}

export function DataValidationDialog({
    open,
    onOpenChange,
    selection,
    existingRules,
    onSaveRule,
    onDeleteRule,
}: DataValidationDialogProps) {
    const [validationType, setValidationType] = useState<ValidationRule['type']>('number');
    const [criteria, setCriteria] = useState<ValidationRule['criteria']>({});
    const [errorMessage, setErrorMessage] = useState('');
    const [inputHelp, setInputHelp] = useState('');
    const [allowBlank, setAllowBlank] = useState(true);
    const [showDropdown, setShowDropdown] = useState(true);
    const [listItems, setListItems] = useState(''); // Comma-separated

    const handleSave = () => {
        if (!selection) return;

        const rule: ValidationRule = {
            id: Date.now().toString(),
            range: {
                startRow: Math.min(selection.start.row, selection.end.row),
                endRow: Math.max(selection.start.row, selection.end.row),
                startCol: Math.min(selection.start.col, selection.end.col),
                endCol: Math.max(selection.start.col, selection.end.col),
            },
            type: validationType,
            criteria: {
                ...criteria,
                list: validationType === 'list' ? listItems.split(',').map(s => s.trim()).filter(Boolean) : undefined,
            },
            errorMessage: errorMessage || undefined,
            inputHelp: inputHelp || undefined,
            allowBlank,
            showDropdown: validationType === 'list' ? showDropdown : undefined,
        };

        onSaveRule(rule);
        onOpenChange(false);
        resetForm();
    };

    const resetForm = () => {
        setValidationType('number');
        setCriteria({});
        setErrorMessage('');
        setInputHelp('');
        setAllowBlank(true);
        setShowDropdown(true);
        setListItems('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Data Validation</DialogTitle>
                    <DialogDescription>
                        Set validation rules for selected cells to control what data can be entered.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Validation Type */}
                    <div className="space-y-2">
                        <Label>Validation Type</Label>
                        <Select value={validationType} onValueChange={(v) => setValidationType(v as ValidationRule['type'])}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="list">List (Dropdown)</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="formula">Custom Formula</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    {/* Number Validation */}
                    {validationType === 'number' && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="min">Minimum Value</Label>
                                    <Input
                                        id="min"
                                        type="number"
                                        value={criteria.min ?? ''}
                                        onChange={(e) => setCriteria({ ...criteria, min: parseFloat(e.target.value) || undefined })}
                                        placeholder="No minimum"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max">Maximum Value</Label>
                                    <Input
                                        id="max"
                                        type="number"
                                        value={criteria.max ?? ''}
                                        onChange={(e) => setCriteria({ ...criteria, max: parseFloat(e.target.value) || undefined })}
                                        placeholder="No maximum"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* List Validation */}
                    {validationType === 'list' && (
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="list">List Items (comma-separated)</Label>
                                <Textarea
                                    id="list"
                                    value={listItems}
                                    onChange={(e) => setListItems(e.target.value)}
                                    placeholder="Option 1, Option 2, Option 3"
                                    rows={3}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {listItems && listItems.split(',').filter(s => s.trim()).length} items
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="show-dropdown"
                                    checked={showDropdown}
                                    onCheckedChange={setShowDropdown}
                                />
                                <Label htmlFor="show-dropdown">Show dropdown in cell</Label>
                            </div>
                        </div>
                    )}

                    {/* Date Validation */}
                    {validationType === 'date' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start-date">Start Date</Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={criteria.startDate ?? ''}
                                    onChange={(e) => setCriteria({ ...criteria, startDate: e.target.value || undefined })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end-date">End Date</Label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={criteria.endDate ?? ''}
                                    onChange={(e) => setCriteria({ ...criteria, endDate: e.target.value || undefined })}
                                />
                            </div>
                        </div>
                    )}

                    {/* Text Validation */}
                    {validationType === 'text' && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="min-length">Minimum Length</Label>
                                    <Input
                                        id="min-length"
                                        type="number"
                                        value={criteria.minLength ?? ''}
                                        onChange={(e) => setCriteria({ ...criteria, minLength: parseInt(e.target.value) || undefined })}
                                        placeholder="No minimum"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max-length">Maximum Length</Label>
                                    <Input
                                        id="max-length"
                                        type="number"
                                        value={criteria.maxLength ?? ''}
                                        onChange={(e) => setCriteria({ ...criteria, maxLength: parseInt(e.target.value) || undefined })}
                                        placeholder="No maximum"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pattern">Pattern (Regex)</Label>
                                <Input
                                    id="pattern"
                                    value={criteria.pattern ?? ''}
                                    onChange={(e) => setCriteria({ ...criteria, pattern: e.target.value || undefined })}
                                    placeholder="^[A-Z]{3}-\\d{4}$"
                                />
                            </div>
                        </div>
                    )}

                    {/* Formula Validation */}
                    {validationType === 'formula' && (
                        <div className="space-y-2">
                            <Label htmlFor="formula">Custom Formula</Label>
                            <Input
                                id="formula"
                                value={criteria.formula ?? ''}
                                onChange={(e) => setCriteria({ ...criteria, formula: e.target.value || undefined })}
                                placeholder="=A1>B1"
                            />
                            <p className="text-xs text-muted-foreground">
                                Formula must return TRUE or FALSE
                            </p>
                        </div>
                    )}

                    <Separator />

                    {/* Messages */}
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="input-help">Input Help Message (optional)</Label>
                            <Input
                                id="input-help"
                                value={inputHelp}
                                onChange={(e) => setInputHelp(e.target.value)}
                                placeholder="Enter a value between 1 and 100"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="error-message">Error Message (optional)</Label>
                            <Input
                                id="error-message"
                                value={errorMessage}
                                onChange={(e) => setErrorMessage(e.target.value)}
                                placeholder="Invalid value entered"
                            />
                        </div>
                    </div>

                    {/* Options */}
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="allow-blank"
                            checked={allowBlank}
                            onCheckedChange={setAllowBlank}
                        />
                        <Label htmlFor="allow-blank">Allow blank cells</Label>
                    </div>

                    {/* Existing Rules for Selection */}
                    {existingRules.length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <Label>Existing Rules in Selection</Label>
                                <div className="space-y-2">
                                    {existingRules.map(rule => (
                                        <div key={rule.id} className="flex items-center justify-between p-2 border rounded">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{rule.type}</Badge>
                                                <span className="text-sm">
                                                    R{rule.range.startRow + 1}C{rule.range.startCol + 1}:R{rule.range.endRow + 1}C{rule.range.endCol + 1}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDeleteRule(rule.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!selection}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Rule
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
