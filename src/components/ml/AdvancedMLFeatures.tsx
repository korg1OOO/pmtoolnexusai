/**
 * Advanced ML Features Component
 * Combines A/B testing, export/import, and versioning in one interface
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, Upload, GitBranch, History, Play, Pause, Trophy } from 'lucide-react';
import { getAllABTests, getABTestStats, calculateSignificance, selectWinner, pauseABTest, resumeABTest } from '@/services/abTestingService';
import { exportAllPatterns, downloadExportBundle, readImportFile, importPatterns } from '@/services/patternExportService';
import type { ABTest } from '@/services/abTestingService';

export function AdvancedMLFeatures() {
    const [activeTab, setActiveTab] = useState('ab-testing');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Advanced ML Features
                </CardTitle>
                <CardDescription>
                    A/B testing, pattern export/import, and version control
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
                        <TabsTrigger value="export-import">Export/Import</TabsTrigger>
                        <TabsTrigger value="versioning">Versioning</TabsTrigger>
                    </TabsList>

                    <TabsContent value="ab-testing" className="space-y-4">
                        <ABTestingTab />
                    </TabsContent>

                    <TabsContent value="export-import" className="space-y-4">
                        <ExportImportTab />
                    </TabsContent>

                    <TabsContent value="versioning" className="space-y-4">
                        <VersioningTab />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

function ABTestingTab() {
    const { data: tests, isLoading, refetch } = useQuery({
        queryKey: ['ab-tests'],
        queryFn: getAllABTests,
    });

    const handlePause = async (testId: string) => {
        try {
            await pauseABTest(testId);
            toast.success('Test paused');
            refetch();
        } catch (error) {
            toast.error('Failed to pause test');
        }
    };

    const handleResume = async (testId: string) => {
        try {
            await resumeABTest(testId);
            toast.success('Test resumed');
            refetch();
        } catch (error) {
            toast.error('Failed to resume test');
        }
    };

    const handleSelectWinner = async (testId: string) => {
        try {
            await selectWinner(testId);
            toast.success('Winner selected and test completed');
            refetch();
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    if (isLoading) {
        return <p className="text-sm text-muted-foreground">Loading tests...</p>;
    }

    if (!tests || tests.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">No A/B tests yet</p>
                <p className="text-xs text-muted-foreground">
                    Create tests from the Pattern Management page
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {tests.map((test) => (
                <ABTestCard
                    key={test.id}
                    test={test}
                    onPause={handlePause}
                    onResume={handleResume}
                    onSelectWinner={handleSelectWinner}
                />
            ))}
        </div>
    );
}

function ABTestCard({
    test,
    onPause,
    onResume,
    onSelectWinner,
}: {
    test: ABTest;
    onPause: (id: string) => void;
    onResume: (id: string) => void;
    onSelectWinner: (id: string) => void;
}) {
    const { data: stats } = useQuery({
        queryKey: ['ab-test-stats', test.id],
        queryFn: () => getABTestStats(test.id),
    });

    const { data: significance } = useQuery({
        queryKey: ['ab-test-significance', test.id],
        queryFn: () => calculateSignificance(test.id),
        enabled: test.status === 'running',
    });

    const statusColors = {
        running: 'bg-green-500',
        paused: 'bg-yellow-500',
        completed: 'bg-blue-500',
    };

    return (
        <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
                <div>
                    <h4 className="font-medium">{test.name}</h4>
                    {test.description && (
                        <p className="text-sm text-muted-foreground">{test.description}</p>
                    )}
                </div>
                <Badge className={statusColors[test.status]}>
                    {test.status}
                </Badge>
            </div>

            {stats && stats.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                    {stats.map((s) => (
                        <div key={s.variant} className="border rounded p-2">
                            <p className="text-xs font-medium">Variant {s.variant.toUpperCase()}</p>
                            <p className="text-lg font-bold">
                                {Math.round(s.success_rate * 100)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {s.total_predictions} predictions
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {significance && (
                <div className="text-sm">
                    {significance.is_significant ? (
                        <p className="text-green-600">
                            ✓ Significant result ({Math.round(significance.confidence_level * 100)}% confidence)
                            {significance.winner_variant && ` - Winner: Variant ${significance.winner_variant.toUpperCase()}`}
                        </p>
                    ) : (
                        <p className="text-muted-foreground">
                            Not yet significant (need more data)
                        </p>
                    )}
                </div>
            )}

            <div className="flex gap-2">
                {test.status === 'running' && (
                    <>
                        <Button size="sm" variant="outline" onClick={() => onPause(test.id)}>
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                        </Button>
                        {significance?.is_significant && (
                            <Button size="sm" onClick={() => onSelectWinner(test.id)}>
                                <Trophy className="h-3 w-3 mr-1" />
                                Select Winner
                            </Button>
                        )}
                    </>
                )}
                {test.status === 'paused' && (
                    <Button size="sm" variant="outline" onClick={() => onResume(test.id)}>
                        <Play className="h-3 w-3 mr-1" />
                        Resume
                    </Button>
                )}
            </div>
        </div>
    );
}

function ExportImportTab() {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const bundle = await exportAllPatterns();
            downloadExportBundle(bundle);
            toast.success(`Exported ${bundle.patterns.length} patterns`);
        } catch (error) {
            toast.error('Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const bundle = await readImportFile(file);
            const result = await importPatterns(bundle, {
                overwrite_existing: false,
                skip_duplicates: true,
                activate_imported: false,
            });

            toast.success(`Imported ${result.imported} patterns, skipped ${result.skipped}`);
            if (result.errors.length > 0) {
                console.error('Import errors:', result.errors);
            }
        } catch (error) {
            toast.error('Import failed: ' + (error as Error).message);
        } finally {
            setIsImporting(false);
            event.target.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full"
                >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Export All Patterns'}
                </Button>

                <label className="w-full">
                    <Button
                        disabled={isImporting}
                        className="w-full"
                        asChild
                    >
                        <span>
                            <Upload className="h-4 w-4 mr-2" />
                            {isImporting ? 'Importing...' : 'Import Patterns'}
                        </span>
                    </Button>
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                    />
                </label>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Export:</strong> Download all patterns as JSON file</p>
                <p><strong>Import:</strong> Upload JSON file to import patterns</p>
                <p className="text-xs">Note: Duplicate patterns will be skipped</p>
            </div>
        </div>
    );
}

function VersioningTab() {
    return (
        <div className="text-center py-8">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
                Pattern versioning is automatic
            </p>
            <p className="text-xs text-muted-foreground">
                View version history from the Pattern Management page
            </p>
        </div>
    );
}
