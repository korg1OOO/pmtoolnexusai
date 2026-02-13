import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, RotateCcw, Trash2 } from 'lucide-react';
import { VersionHistoryService, type SpreadsheetVersion } from '@/services/versionHistoryService';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface VersionHistoryPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sheetId: string;
    onRestore: (version: SpreadsheetVersion) => void;
}

export function VersionHistoryPanel({
    open,
    onOpenChange,
    sheetId,
    onRestore,
}: VersionHistoryPanelProps) {
    const [versions, setVersions] = useState<SpreadsheetVersion[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            loadVersions();
        }
    }, [open, sheetId]);

    const loadVersions = async () => {
        setLoading(true);
        const data = await VersionHistoryService.getVersions(sheetId);
        setVersions(data);
        setLoading(false);
    };

    const handleRestore = async (version: SpreadsheetVersion) => {
        if (confirm(`Restore version from ${new Date(version.created_at).toLocaleString()}?`)) {
            onRestore(version);
            onOpenChange(false);
        }
    };

    const handleDelete = async (versionId: string) => {
        if (confirm('Delete this version?')) {
            const success = await VersionHistoryService.deleteVersion(versionId);
            if (success) {
                setVersions(versions.filter(v => v.id !== versionId));
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Version History
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[500px] pr-4">
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Loading versions...
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p>No version history yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {versions.map((version, index) => (
                                <div
                                    key={version.id}
                                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {index === 0 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Current
                                                    </Badge>
                                                )}
                                                {version.label && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {version.label}
                                                    </Badge>
                                                )}
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                                                </span>
                                            </div>

                                            <p className="text-sm font-medium">
                                                {new Date(version.created_at).toLocaleString()}
                                            </p>

                                            {version.user_name && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    by {version.user_name}
                                                </p>
                                            )}

                                            {version.change_summary && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {version.change_summary}
                                                </p>
                                            )}

                                            <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                                                {version.charts && (
                                                    <span>{JSON.parse(JSON.stringify(version.charts)).length || 0} charts</span>
                                                )}
                                                {version.conditional_formats && (
                                                    <span>• {JSON.parse(JSON.stringify(version.conditional_formats)).length || 0} formats</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            {index !== 0 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRestore(version)}
                                                >
                                                    <RotateCcw className="h-4 w-4 mr-2" />
                                                    Restore
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(version.id)}
                                                disabled={index === 0}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
