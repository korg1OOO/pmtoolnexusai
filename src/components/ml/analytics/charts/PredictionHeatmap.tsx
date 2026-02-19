/**
 * PredictionHeatmap
 * Visualises ML prediction activity as a day-of-week × hour-of-day heat grid.
 * Queries ml_predictions grouped by weekday and hour, then shades each cell
 * proportional to its count relative to the busiest cell.
 */
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';
import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// isodow: 1=Mon … 7=Sun (PostgreSQL)
function usePredictionHeatmap() {
    return useQuery({
        queryKey: ['ml-prediction-heatmap'],
        queryFn: async () => {
            // Aggregate predictions by day-of-week (isodow 1-7) and hour
            const { data, error } = await supabase
                .from('ml_predictions')
                .select('created_at')
                .order('created_at', { ascending: false })
                .limit(5000);

            if (error) throw error;

            // Build a 7×24 count matrix (indexed [dayIndex][hour])
            const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

            (data ?? []).forEach((row: { created_at: string }) => {
                const d = new Date(row.created_at);
                // getDay() returns 0=Sun…6=Sat; we want Mon=0…Sun=6
                const dayIndex = (d.getDay() + 6) % 7;
                const hour = d.getHours();
                matrix[dayIndex][hour]++;
            });

            return matrix;
        },
        staleTime: 60_000, // refresh every 60s
    });
}

export function PredictionHeatmap() {
    const { data: matrix, isLoading } = usePredictionHeatmap();

    const maxCount = useMemo(() => {
        if (!matrix) return 1;
        return Math.max(1, ...matrix.flatMap((row) => row));
    }, [matrix]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-44 mb-1" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-40 w-full rounded-md" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Prediction Volume Heatmap
                </CardTitle>
                <CardDescription className="text-xs">
                    Activity density by day of week and hour (last 5 000 predictions)
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                {/* Hour labels */}
                <div className="flex gap-0.5 mb-1 ml-9">
                    {[0, 4, 8, 12, 16, 20].map((h) => (
                        <span
                            key={h}
                            className="text-[9px] text-muted-foreground"
                            style={{ width: `${(100 / 6).toFixed(2)}%` }}
                        >
                            {String(h).padStart(2, '0')}:00
                        </span>
                    ))}
                </div>

                {/* Grid */}
                <div className="space-y-0.5">
                    {DAYS.map((day, dayIndex) => (
                        <div key={day} className="flex items-center gap-0.5">
                            <span className="text-[9px] text-muted-foreground w-8 shrink-0 text-right pr-1">
                                {day}
                            </span>
                            {HOURS.map((hour) => {
                                const count = matrix?.[dayIndex][hour] ?? 0;
                                const intensity = count / maxCount;
                                return (
                                    <div
                                        key={hour}
                                        title={`${day} ${String(hour).padStart(2, '0')}:00 — ${count} predictions`}
                                        className="flex-1 rounded-[2px] cursor-default transition-opacity hover:opacity-80"
                                        style={{
                                            height: '14px',
                                            backgroundColor: `hsl(var(--primary) / ${Math.max(0.05, intensity).toFixed(2)})`,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-1.5 mt-2">
                    <span className="text-[9px] text-muted-foreground">Less</span>
                    {[0.05, 0.25, 0.5, 0.75, 1].map((v) => (
                        <div
                            key={v}
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: `hsl(var(--primary) / ${v})` }}
                        />
                    ))}
                    <span className="text-[9px] text-muted-foreground">More</span>
                </div>
            </CardContent>
        </Card>
    );
}
