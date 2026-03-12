/**
 * MultiSelectFilter Component
 * Searchable multi-select dropdown with select-all functionality
 */

import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FilterOption } from '@/types/analytics';

interface MultiSelectFilterProps {
    label: string;
    options: FilterOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    maxHeight?: number;
    className?: string;
}

export function MultiSelectFilter({
    label,
    options,
    selected,
    onChange,
    placeholder = 'Select options...',
    maxHeight = 300,
    className
}: MultiSelectFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredOptions = useMemo(() => {
        if (!searchQuery) return options;
        const query = searchQuery.toLowerCase();
        return options.filter(option =>
            option.label.toLowerCase().includes(query) ||
            option.value.toLowerCase().includes(query)
        );
    }, [options, searchQuery]);

    const handleToggle = (value: string) => {
        const newSelected = selected.includes(value)
            ? selected.filter(v => v !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    const handleSelectAll = () => {
        const allValues = filteredOptions
            .filter(opt => !opt.disabled)
            .map(opt => opt.value);
        onChange(allValues);
    };

    const handleDeselectAll = () => {
        onChange([]);
    };

    const getDisplayText = () => {
        if (selected.length === 0) return placeholder;
        if (selected.length === 1) {
            const option = options.find(opt => opt.value === selected[0]);
            return option?.label || selected[0];
        }
        return `${selected.length} selected`;
    };

    const selectedOptions = useMemo(() => {
        return selected
            .map(value => options.find(opt => opt.value === value))
            .filter(Boolean) as FilterOption[];
    }, [selected, options]);

    return (
        <div className={cn('space-y-2', className)}>
            <label className="text-sm font-medium">{label}</label>

            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isOpen}
                        className="w-full justify-between"
                    >
                        <span className="truncate">{getDisplayText()}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder={`Search ${label.toLowerCase()}...`}
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <div className="flex items-center justify-between px-3 py-2 border-b">
                            <span className="text-xs text-muted-foreground">
                                {selected.length} of {options.length} selected
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={handleSelectAll}
                                >
                                    Select All
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={handleDeselectAll}
                                    disabled={selected.length === 0}
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>
                        <CommandEmpty>No options found.</CommandEmpty>
                        <CommandGroup style={{ maxHeight: `${maxHeight}px`, overflow: 'auto' }}>
                            {filteredOptions.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => handleToggle(option.value)}
                                    disabled={option.disabled}
                                >
                                    <div className="flex items-center gap-2 flex-1">
                                        <div
                                            className={cn(
                                                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                                selected.includes(option.value)
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'opacity-50 [&_svg]:invisible'
                                            )}
                                        >
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <span className="flex-1">{option.label}</span>
                                        {option.count !== undefined && (
                                            <span className="text-xs text-muted-foreground">
                                                ({option.count})
                                            </span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Selected Items Display */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {selectedOptions.map((option) => (
                        <Badge
                            key={option.value}
                            variant="secondary"
                            className="text-xs"
                        >
                            {option.label}
                            <button
                                className="ml-1 hover:text-destructive"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleToggle(option.value);
                                }}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
