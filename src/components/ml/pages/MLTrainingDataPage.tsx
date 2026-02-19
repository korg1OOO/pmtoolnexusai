/**
 * ML Training Data Management Page
 * Fetches live data from ml_training_data and ml_model_metadata tables.
 */

import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ArrowLeft,
    Database,
    Upload,
    Download,
    CheckCircle,
    AlertCircle,
    Search,
    Filter,
    BarChart3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// ─── Data types ──────────────────────────────────────────────────────────────

interface TrainingSnapshot {
    id: string;
    project_id: string;
    project_name?: string;
    snapshot_date: string;
    total_tasks: number;
    completed_tasks: number;
    project_status: string;
    project_health: string;
    risk_count: number;
    budget: number;
    actual_spent: number;
}

interface ModelAccuracy {
    label: string;
    value: number;
    status: 'excellent' | 'good' | 'warning';
}

// ─── Quality metrics from ml_model_metadata ───────────────────────────────────

function useQualityMetrics(): { data: ModelAccuracy[]; isLoading: boolean } {
    return useQuery({
        queryKey: ['ml-model-accuracy'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('ml_model_metadata')
                .select('model_type, accuracy_metrics')
                .eq('is_active', true);
            if (error) throw error;

            const rows: ModelAccuracy[] = [];
            ((data ?? []) as any[]).forEach((m) => {
                const metrics = m.accuracy_metrics ?? {};
                if (metrics.precision != null)
                    rows.push({
                        label: `${m.model_type} Precision`,
                        value: parseFloat((metrics.precision * 100).toFixed(1)),
                        status: metrics.precision >= 0.9 ? 'excellent' : metrics.precision >= 0.75 ? 'good' : 'warning',
                    });
                if (metrics.recall != null)
                    rows.push({
                        label: `${m.model_type} Recall`,
                        value: parseFloat((metrics.recall * 100).toFixed(1)),
                        status: metrics.recall >= 0.9 ? 'excellent' : metrics.recall >= 0.75 ? 'good' : 'warning',
                    });
            });

            // Fallback placeholders when no model metadata exists yet
            if (rows.length === 0) {
                return [
                    { label: 'Completeness', value: 0, status: 'warning' as const },
                    { label: 'Accuracy', value: 0, status: 'warning' as const },
                ] satisfies ModelAccuracy[];
            }
            return rows.slice(0, 4);
        },
    });
}

// ─── Training snapshots from ml_training_data ────────────────────────────────

function useTrainingSnapshots(search: string) {
    return useQuery({
        queryKey: ['ml-training-snapshots', search],
        queryFn: async () => {
            let query = (supabase as any)
                .from('ml_training_data')
                .select('id, project_id, snapshot_date, total_tasks, completed_tasks, project_status, project_health, risk_count, budget, actual_spent, projects(name)')
                .order('snapshot_date', { ascending: false })
                .limit(50);

            if (search) {
                query = query.ilike('project_status', `%${search}%`);
            }

            const { data, error } = await query;
            if (error) throw error;

            return ((data ?? []) as any[]).map((r) => ({
                id: r.id,
                project_id: r.project_id,
                project_name: r.projects?.name ?? r.project_id.slice(0, 8),
                snapshot_date: r.snapshot_date,
                total_tasks: r.total_tasks ?? 0,
                completed_tasks: r.completed_tasks ?? 0,
                project_status: r.project_status ?? 'unknown',
                project_health: r.project_health ?? 'unknown',
                risk_count: r.risk_count ?? 0,
                budget: r.budget ?? 0,
                actual_spent: r.actual_spent ?? 0,
            })) as TrainingSnapshot[];
        },
    });
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MLTrainingDataPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: qualityMetrics = [], isLoading: qualityLoading } = useQualityMetrics();
    const { data: snapshots = [], isLoading: snapshotsLoading } = useTrainingSnapshots(searchQuery);

    const getQualityColor = (quality: number) => {
        if (quality >= 85) return 'text-green-600';
        if (quality >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            active: { variant: 'default', label: 'Active' },
            processing: { variant: 'secondary', label: 'Processing' },
            archived: { variant: 'outline', label: 'Archived' },
            completed: { variant: 'default', label: 'Completed' },
            'on-hold': { variant: 'secondary', label: 'On Hold' },
        };
        const config = variants[status] || { variant: 'outline', label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    /** Trigger hidden file input */
    const handleUploadClick = () => fileInputRef.current?.click();

    /** Accept a JSON/CSV file and insert rows into ml_training_data */
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            let rows: any[] = [];

            if (file.name.endsWith('.json')) {
                rows = JSON.parse(text);
            } else if (file.name.endsWith('.csv')) {
                const lines = text.trim().split('\n');
                const headers = lines[0].split(',').map((h) => h.trim());
                rows = lines.slice(1).map((line) => {
                    const vals = line.split(',');
                    return headers.reduce((obj: any, h, i) => {
                        obj[h] = vals[i]?.trim();
                        return obj;
                    }, {});
                });
            } else {
                toast.error('Only JSON or CSV files are supported');
                return;
            }

            if (!rows.length || !rows[0].project_id) {
                toast.error('File must contain rows with project_id column');
                return;
            }

            const { error } = await (supabase as any)
                .from('ml_training_data')
                .insert(rows);

            if (error) throw error;
            toast.success(`Uploaded ${rows.length} training snapshot(s)`);
        } catch (err: any) {
            toast.error(`Upload failed: ${err.message}`);
        } finally {
            // reset so the same file can be re-selected
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    /** Export current snapshots as CSV */
    const handleExport = () => {
        if (!snapshots.length) {
            toast.error('No data to export');
            return;
        }
        const headers = ['id', 'project_name', 'snapshot_date', 'project_status', 'project_health', 'total_tasks', 'completed_tasks', 'risk_count', 'budget', 'actual_spent'];
        const rows = snapshots.map((s) =>
            [s.id, s.project_name, s.snapshot_date, s.project_status, s.project_health, s.total_tasks, s.completed_tasks, s.risk_count, s.budget, s.actual_spent].join(',')
        );
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ml-training-data-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Export complete');
    };

    // Group snapshots by project for distribution view
    const statusGroups = snapshots.reduce<Record<string, number>>((acc, s) => {
        acc[s.project_status] = (acc[s.project_status] ?? 0) + 1;
        return acc;
    }, {});
    const totalCount = snapshots.length || 1;

    return (
        <div className="p-6 space-y-6">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                className="hidden"
                onChange={handleFileUpload}
            />

            {/* Header */}
            <div>
                <Button variant="ghost" onClick={() => navigate('/admin/ml')} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to ML Dashboard
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Training Data</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage training snapshots and monitor model quality
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleUploadClick}>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Dataset
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExport}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quality Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {qualityLoading
                    ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
                    : qualityMetrics.map((metric) => (
                        <Card key={metric.label}>
                            <CardHeader className="pb-3">
                                <CardDescription>{metric.label}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <div className={`text-3xl font-bold ${getQualityColor(metric.value)}`}>
                                            {metric.value > 0 ? `${metric.value}%` : '—'}
                                        </div>
                                        <div className="flex items-center gap-1 text-sm mt-1">
                                            {metric.status === 'excellent' || metric.status === 'good' ? (
                                                <CheckCircle className="h-3 w-3 text-green-600" />
                                            ) : (
                                                <AlertCircle className="h-3 w-3 text-yellow-600" />
                                            )}
                                            <span className="text-muted-foreground capitalize">
                                                {metric.status}
                                            </span>
                                        </div>
                                    </div>
                                    <BarChart3 className="h-8 w-8 text-muted-foreground opacity-20" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
            </div>

            {/* Search and Filter */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter by project status…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={() => setSearchQuery('')}>
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Snapshots List */}
            <Card>
                <CardHeader>
                    <CardTitle>Training Snapshots</CardTitle>
                    <CardDescription>
                        {snapshotsLoading
                            ? 'Loading…'
                            : `${snapshots.length} snapshots from live project data`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {snapshotsLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-20 rounded-lg" />
                            ))}
                        </div>
                    ) : snapshots.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Database className="h-10 w-10 mb-3 opacity-40" />
                            <p className="text-sm">No training snapshots yet</p>
                            <p className="text-xs mt-1">Upload a JSON/CSV file or snapshots will be created automatically by the ML engine</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {snapshots.map((snapshot) => (
                                <div
                                    key={snapshot.id}
                                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <Database className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold">{snapshot.project_name}</h3>
                                                {getStatusBadge(snapshot.project_status)}
                                                <Badge variant="outline" className="capitalize">
                                                    {snapshot.project_health}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>{snapshot.total_tasks} tasks</span>
                                                <span>•</span>
                                                <span>{snapshot.completed_tasks} completed</span>
                                                <span>•</span>
                                                <span>{snapshot.risk_count} risks</span>
                                                <span>•</span>
                                                <span>Snapped {new Date(snapshot.snapshot_date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-sm text-muted-foreground mb-1">Completion</div>
                                        <div className={`text-2xl font-bold ${getQualityColor(snapshot.total_tasks > 0 ? (snapshot.completed_tasks / snapshot.total_tasks) * 100 : 0)}`}>
                                            {snapshot.total_tasks > 0
                                                ? `${Math.round((snapshot.completed_tasks / snapshot.total_tasks) * 100)}%`
                                                : '—'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Data Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Status Distribution</CardTitle>
                    <CardDescription>Snapshot breakdown by project status</CardDescription>
                </CardHeader>
                <CardContent>
                    {snapshotsLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}
                        </div>
                    ) : Object.keys(statusGroups).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No data available</p>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(statusGroups).map(([status, count]) => {
                                const pct = (count / totalCount) * 100;
                                return (
                                    <div key={status} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium capitalize">{status}</span>
                                                <Badge variant="outline">{count} snapshots</Badge>
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                {pct.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className="bg-primary rounded-full h-2 transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
