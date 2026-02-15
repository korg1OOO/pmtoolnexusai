/**
 * FilterPresets Component
 * Manage saved filter presets (save, load, delete, set default)
 */

import React, { useState } from 'react';
import { Star, Trash2, Edit2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { FilterPreset, FilterState } from '@/types/analytics';

interface FilterPresetsProps {
    presets: FilterPreset[];
    currentFilters: FilterState;
    onLoad: (preset: FilterPreset) => void;
    onSave: (name: string, description?: string) => void;
    onDelete: (id: string) => void;
    onSetDefault: (id: string) => void;
    className?: string;
}

export function FilterPresets({
    presets,
    currentFilters,
    onLoad,
    onSave,
    onDelete,
    onSetDefault,
    className
}: FilterPresetsProps) {
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [presetDescription, setPresetDescription] = useState('');

    const handleSave = () => {
        if (presetName.trim()) {
            onSave(presetName.trim(), presetDescription.trim() || undefined);
            setPresetName('');
            setPresetDescription('');
            setShowSaveDialog(false);
        }
    };

    const getFilterCount = (filters: FilterState): number => {
        let count = 0;
        if (filters.dateRange?.start || filters.dateRange?.end) count++;
        if (filters.projects?.length) count++;
        if (filters.users?.length) count++;
        if (filters.statuses?.length) count++;
        if (filters.categories?.length) count++;
        if (filters.priorities?.length) count++;
        return count;
    };

    return (
        <div className={cn('space-y-4', className)}>
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Saved Presets</h3>
                <Button
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                    className="h-8"
                >
                    <Save className="h-3 w-3 mr-1" />
                    Save Current
                </Button>
            </div>

            {presets.length === 0 ? (
                <Card className="p-4 text-center text-sm text-muted-foreground">
                    No saved presets. Save your current filters to reuse them later.
                </Card>
            ) : (
                <div className="space-y-2">
                    {presets.map((preset) => (
                        <Card
                            key={preset.id}
                            className="p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                            onClick={() => onLoad(preset)}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {preset.isDefault && (
                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        )}
                                        <span className="font-medium text-sm truncate">
                                            {preset.name}
                                        </span>
                                    </div>
                                    {preset.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {preset.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                        <span>{getFilterCount(preset.filters)} filters</span>
                                        <span>•</span>
                                        <span>{format(preset.createdAt, 'MMM d, yyyy')}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {!preset.isDefault && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSetDefault(preset.id);
                                            }}
                                            title="Set as default"
                                        >
                                            <Star className="h-3 w-3" />
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 hover:text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(preset.id);
                                        }}
                                        title="Delete preset"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Save Preset Dialog */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Filter Preset</DialogTitle>
                        <DialogDescription>
                            Save your current filter configuration to reuse it later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Preset Name *</label>
                            <Input
                                placeholder="e.g., Q1 Review, Last Month Analysis"
                                value={presetName}
                                onChange={(e) => setPresetName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSave();
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description (Optional)</label>
                            <Input
                                placeholder="Brief description of this preset"
                                value={presetDescription}
                                onChange={(e) => setPresetDescription(e.target.value)}
                            />
                        </div>
                        <div className="text-sm text-muted-foreground">
                            This preset will save {getFilterCount(currentFilters)} filter(s).
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={!presetName.trim()}>
                            Save Preset
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
