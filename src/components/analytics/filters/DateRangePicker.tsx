/**
 * DateRangePicker Component
 * Provides date range selection with quick presets
 */

import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { DateRangePreset } from '@/types/analytics';

interface DateRangePickerProps {
    value?: { start: Date | null; end: Date | null };
    onChange: (range: { start: Date | null; end: Date | null }) => void;
    className?: string;
    placeholder?: string;
}

const DATE_PRESETS: DateRangePreset[] = [
    {
        label: 'Today',
        getValue: () => {
            const today = new Date();
            return { start: today, end: today };
        }
    },
    {
        label: 'Last 7 days',
        getValue: () => ({
            start: subDays(new Date(), 6),
            end: new Date()
        })
    },
    {
        label: 'Last 30 days',
        getValue: () => ({
            start: subDays(new Date(), 29),
            end: new Date()
        })
    },
    {
        label: 'Last 90 days',
        getValue: () => ({
            start: subDays(new Date(), 89),
            end: new Date()
        })
    },
    {
        label: 'This month',
        getValue: () => ({
            start: startOfMonth(new Date()),
            end: endOfMonth(new Date())
        })
    },
    {
        label: 'This year',
        getValue: () => ({
            start: startOfYear(new Date()),
            end: endOfYear(new Date())
        })
    }
];

export function DateRangePicker({ value, onChange, className, placeholder = 'Select date range' }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [tempRange, setTempRange] = useState(value);

    const handlePresetClick = (preset: DateRangePreset) => {
        const range = preset.getValue();
        onChange(range);
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange({ start: null, end: null });
        setTempRange({ start: null, end: null });
    };

    const formatDateRange = () => {
        if (!value?.start && !value?.end) return placeholder;
        if (value.start && value.end) {
            return `${format(value.start, 'MMM d, yyyy')} - ${format(value.end, 'MMM d, yyyy')}`;
        }
        if (value.start) {
            return `From ${format(value.start, 'MMM d, yyyy')}`;
        }
        if (value.end) {
            return `Until ${format(value.end, 'MMM d, yyyy')}`;
        }
        return placeholder;
    };

    return (
        <div className={cn('flex gap-2', className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            'w-full justify-start text-left font-normal',
                            !value?.start && !value?.end && 'text-muted-foreground'
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatDateRange()}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex">
                        {/* Quick Presets */}
                        <div className="border-r p-3 space-y-1">
                            <div className="text-sm font-medium mb-2">Quick Select</div>
                            {DATE_PRESETS.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-sm"
                                    onClick={() => handlePresetClick(preset)}
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>

                        {/* Calendar */}
                        <div className="p-3">
                            <Calendar
                                mode="range"
                                selected={{
                                    from: value?.start || undefined,
                                    to: value?.end || undefined
                                }}
                                onSelect={(range) => {
                                    if (range?.from && range?.to) {
                                        onChange({ start: range.from, end: range.to });
                                    } else if (range?.from) {
                                        onChange({ start: range.from, end: null });
                                    }
                                }}
                                numberOfMonths={2}
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {(value?.start || value?.end) && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="px-2"
                >
                    Clear
                </Button>
            )}
        </div>
    );
}
