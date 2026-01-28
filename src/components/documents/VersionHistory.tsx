import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Clock,
  User,
  Download,
  Eye,
  RotateCcw,
  GitCompare,
  ChevronDown,
  ChevronRight,
  FileText,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export interface DocumentVersion {
  id: string;
  version: string;
  uploadedBy: string;
  uploadedDate: string;
  size: number;
  status: 'current' | 'approved' | 'superseded' | 'draft';
  changeNotes?: string;
  approvedBy?: string;
  approvedDate?: string;
}

interface VersionHistoryProps {
  documentName: string;
  versions: DocumentVersion[];
  onRestore?: (versionId: string) => void;
  onDownload?: (versionId: string) => void;
  onCompare?: (v1: string, v2: string) => void;
}

export function VersionHistory({
  documentName,
  versions,
  onRestore,
  onDownload,
  onCompare,
}: VersionHistoryProps) {
  const [expanded, setExpanded] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoreVersion, setRestoreVersion] = useState<DocumentVersion | null>(null);
  const [restoreReason, setRestoreReason] = useState('');

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const toggleVersionSelection = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(v => v !== versionId);
      }
      if (prev.length >= 2) {
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  };

  const handleRestore = (version: DocumentVersion) => {
    setRestoreVersion(version);
    setShowRestoreDialog(true);
  };

  const confirmRestore = () => {
    if (restoreVersion && onRestore) {
      onRestore(restoreVersion.id);
    }
    setShowRestoreDialog(false);
    setRestoreVersion(null);
    setRestoreReason('');
  };

  const getStatusBadge = (status: DocumentVersion['status']) => {
    switch (status) {
      case 'current':
        return <Badge variant="success" className="text-[10px]">Current</Badge>;
      case 'approved':
        return <Badge variant="info" className="text-[10px]">Approved</Badge>;
      case 'draft':
        return <Badge variant="warning" className="text-[10px]">Draft</Badge>;
      case 'superseded':
        return <Badge variant="secondary" className="text-[10px]">Superseded</Badge>;
    }
  };

  return (
    <div className="border rounded-lg bg-card">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-sm">Version History</h3>
            <p className="text-xs text-muted-foreground">{versions.length} versions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedVersions.length === 2 && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onCompare?.(selectedVersions[0], selectedVersions[1]);
              }}
            >
              <GitCompare className="h-3 w-3 mr-1" />
              Compare
            </Button>
          )}
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Version List */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t">
              <ScrollArea className="max-h-80">
                <div className="divide-y">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className={cn(
                        "p-4 hover:bg-muted/30 transition-colors",
                        selectedVersions.includes(version.id) && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {/* Version Indicator */}
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => toggleVersionSelection(version.id)}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors",
                              version.status === 'current'
                                ? "border-primary bg-primary/20 text-primary"
                                : selectedVersions.includes(version.id)
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary"
                            )}
                          >
                            {version.version}
                          </button>
                          {index < versions.length - 1 && (
                            <div className="w-0.5 h-full min-h-[20px] bg-border mt-2" />
                          )}
                        </div>

                        {/* Version Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">Version {version.version}</span>
                            {getStatusBadge(version.status)}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {version.uploadedBy}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(version.uploadedDate)}
                            </div>
                            <span>{formatSize(version.size)}</span>
                          </div>

                          {version.changeNotes && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {version.changeNotes}
                            </p>
                          )}

                          {version.approvedBy && (
                            <div className="flex items-center gap-1 text-xs text-success">
                              <CheckCircle2 className="h-3 w-3" />
                              Approved by {version.approvedBy} on {formatDate(version.approvedDate!)}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="iconXs"
                            onClick={() => onDownload?.(version.id)}
                            title="Download this version"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="iconXs"
                            title="Preview this version"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {version.status !== 'current' && (
                            <Button
                              variant="ghost"
                              size="iconXs"
                              onClick={() => handleRestore(version)}
                              title="Restore this version"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Compare Hint */}
            <div className="p-3 border-t bg-muted/30 text-xs text-muted-foreground text-center">
              {selectedVersions.length === 0 && "Click version numbers to select for comparison"}
              {selectedVersions.length === 1 && "Select one more version to compare"}
              {selectedVersions.length === 2 && "Click Compare to see differences"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-warning" />
              Restore Version {restoreVersion?.version}
            </DialogTitle>
            <DialogDescription>
              This will create a new version based on v{restoreVersion?.version}. 
              The current version will be preserved in history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">{documentName}</p>
                <p className="text-xs text-muted-foreground">
                  Restoring from v{restoreVersion?.version} uploaded {restoreVersion && formatDate(restoreVersion.uploadedDate)}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Reason for restore (optional)</label>
              <Textarea
                placeholder="Explain why you're restoring this version..."
                value={restoreReason}
                onChange={(e) => setRestoreReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <p className="text-xs text-warning">
                Anyone with access to this document will see the restored version. 
                Consider notifying collaborators about this change.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRestore}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Restore Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
