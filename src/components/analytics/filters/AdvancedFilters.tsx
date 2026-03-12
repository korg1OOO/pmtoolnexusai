/**
 * AdvancedFilters Component
 * Main container for all filter components with apply/reset functionality
 */

import React, { useState, useEffect } from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { DateRangePicker } from './DateRangePicker';
import { MultiSelectFilter } from './MultiSelectFilter';
import { FilterPresets } from './FilterPresets';
import type { FilterState, FilterConfig, FilterPreset } from '@/types/analytics';

interface AdvancedFiltersProps {
    onFilterChange: (filters: FilterState) => void;
    initialFilters?: FilterState;
    availableFilters?: FilterConfig[];
    presets?: FilterPreset[];
    onSavePreset?: (name: string, description?: string) => void;
    onDeletePreset?: (id: string) => void;
    onSetDefaultPreset?: (id: string) => void;
    showPresets?: boolean;
    className?: string;
}

export function AdvancedFilters({
    onFilterChange,
    initialFilters = {},
    availableFilters = [],
    presets = [],
    onSavePreset,
    onDeletePreset,
    onSetDefaultPreset,
    showPresets = true,
    className
}: AdvancedFiltersProps) {
    const [filters, setFilters] = useState<FilterState>(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilters);
    const [hasUnappliedChanges, setHasUnappliedChanges] = useState(false);

    // Check if filters have changed
    useEffect(() => {
        const changed = JSON.stringify(filters) !== JSON.stringify(appliedFilters);
        setHasUnappliedChanges(changed);
    }, [filters, appliedFilters]);

    const handleApplyFilters = () => {
        setAppliedFilters(filters);
        onFilterChange(filters);
        setHasUnappliedChanges(false);
    };

    const handleResetFilters = () => {
        const emptyFilters: FilterState = {
            dateRange: { start: null, end: null },
            projects: [],
            users: [],
            statuses: [],
            categories: [],
            priorities: []
        };
        setFilters(emptyFilters);
        setAppliedFilters(emptyFilters);
        onFilterChange(emptyFilters);
        setHasUnappliedChanges(false);
    };

    const handleLoadPreset = (preset: FilterPreset) => {
        setFilters(preset.filters);
        setAppliedFilters(preset.filters);
        onFilterChange(preset.filters);
        setHasUnappliedChanges(false);
    };

    const handleSavePreset = (name: string, description?: string) => {
        if (onSavePreset) {
            onSavePreset(name, description);
        }
    };

    const getActiveFilterCount = (): number => {
        let count = 0;
        if (appliedFilters.dateRange?.start || appliedFilters.dateRange?.end) count++;
        if (appliedFilters.projects?.length) count++;
        if (appliedFilters.users?.length) count++;
        if (appliedFilters.statuses?.length) count++;
        if (appliedFilters.categories?.length) count++;
        if (appliedFilters.priorities?.length) count++;
        return count;
    };

    const activeFilterCount = getActiveFilterCount();

    return (
        <Card className={cn('p-6', className)}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Filters</h3>
                        {activeFilterCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {activeFilterCount} active
                            </Badge>
                        )}
                        {hasUnappliedChanges && (
                            <Badge variant="outline" className="ml-1">
                                Unapplied changes
                            </Badge>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetFilters}
                        disabled={activeFilterCount === 0}
                    >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Clear All
                    </Button>
                </div>

                <Separator />

                {/* Date Range Filter */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Date Range</label>
                    <DateRangePicker
                        value={filters.dateRange}
                        onChange={(range) => setFilters({ ...filters, dateRange: range })}
                    />
                </div>

                {/* Multi-Select Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableFilters.map((config) => {
                        if (config.type === 'multi-select' && config.options) {
                            const key = config.key as keyof FilterState;
                            return (
                                <MultiSelectFilter
                                    key={config.key}
                                    label={config.label}
                                    options={config.options}
                                    selected={(filters[key] as string[]) || []}
                                    onChange={(selected) =>
                                        setFilters({ ...filters, [key]: selected })
                                    }
                                    placeholder={config.placeholder}
                                />
                            );
                        }
                        return null;
                    })}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-4">
                    <Button
                        onClick={handleApplyFilters}
                        disabled={!hasUnappliedChanges}
                        className="flex-1"
                    >
                        Apply Filters
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setFilters(appliedFilters)}
                        disabled={!hasUnappliedChanges}
                    >
                        Cancel
                    </Button>
                </div>

                {/* Filter Presets */}
                {showPresets && onSavePreset && (
                    <>
                        <Separator />
                        <FilterPresets
                            presets={presets}
                            currentFilters={filters}
                            onLoad={handleLoadPreset}
                            onSave={handleSavePreset}
                            onDelete={onDeletePreset || (() => { })}
                            onSetDefault={onSetDefaultPreset || (() => { })}
                        />
                    </>
                )}
            </div>
        </Card>
    );
}
