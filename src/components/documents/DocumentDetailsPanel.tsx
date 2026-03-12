import React from 'react';
import { cn } from '@/lib/utils';
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  X,
  Star,
  Download,
  Share2,
  Lock,
  Unlock,
  Trash2,
  Edit2,
  Clock,
  User,
  Folder,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { type Document } from '@/hooks/useDocuments';
import { type DocumentVersion, useDocumentVersions } from '@/hooks/useDocumentVersions';
import { type DocumentShare, useDocumentSharing } from '@/hooks/useDocumentSharing';
import { DocumentApprovalWorkflow } from './DocumentApprovalWorkflow';

interface DocumentDetailsPanelProps {
  document: Document | null;
  folderPath: string[];
  onClose: () => void;
  onDownload: () => void;
  onShare: () => void;
  onDelete: () => void;
  onRename: () => void;
  onToggleLock: () => void;
  onUploadNewVersion: () => void;
}

const getFileIcon = (type: string) => {
  const className = 'h-12 w-12';
  switch (type) {
    case 'pdf':
      return <FileText className={cn(className, 'text-destructive')} />;
    case 'doc':
      return <FileText className={cn(className, 'text-primary')} />;
    case 'xls':
      return <FileSpreadsheet className={cn(className, 'text-success')} />;
    case 'ppt':
      return <FileText className={cn(className, 'text-warning')} />;
    case 'image':
      return <FileImage className={cn(className, 'text-info')} />;
    default:
      return <File className={cn(className, 'text-muted-foreground')} />;
  }
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusVariant = (status: string): 'success' | 'secondary' | 'warning' | 'outline' => {
  switch (status) {
    case 'approved':
      return 'success';
    case 'draft':
      return 'secondary';
    case 'review':
      return 'warning';
    case 'archived':
      return 'outline';
    default:
      return 'secondary';
  }
};

export function DocumentDetailsPanel({
  document,
  folderPath,
  onClose,
  onDownload,
  onShare,
  onDelete,
  onRename,
  onToggleLock,
  onUploadNewVersion,
}: DocumentDetailsPanelProps) {
  const { versions } = useDocumentVersions(document?.id);
  const { shares } = useDocumentSharing(document?.id);

  if (!document) {
    return (
      <div className="w-80 border-l bg-card flex flex-col items-center justify-center text-center p-6">
        <File className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Select a document to view details</p>
      </div>
    );
  }

  return (
    <div className="w-80 border-l bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate" title={document.name}>
            {document.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            v{document.version} • {formatSize(document.file_size)}
          </p>
        </div>
        <Button variant="ghost" size="iconSm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Preview */}
          <div className="flex flex-col items-center py-6 bg-muted/30 rounded-lg">
            {getFileIcon(document.file_type)}
            <Badge
              variant={getStatusVariant(document.status)}
              className="mt-3"
            >
              {document.status}
            </Badge>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>

          <Separator />

          {/* Properties */}
          <Accordion type="multiple" defaultValue={['info', 'versions']}>
            <AccordionItem value="info">
              <AccordionTrigger className="text-sm">
                Properties
              </AccordionTrigger>
              <AccordionContent>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="uppercase">{document.file_type}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Size</dt>
                    <dd>{formatSize(document.file_size)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Version</dt>
                    <dd>{document.version}</dd>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-start">
                    <dt className="text-muted-foreground">Location</dt>
                    <dd className="text-right flex items-center gap-1">
                      <Folder className="h-3 w-3" />
                      {folderPath.length > 0 ? folderPath.join(' / ') : 'Root'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Created</dt>
                    <dd>{formatDate(document.created_at)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Modified</dt>
                    <dd>{formatDate(document.updated_at)}</dd>
                  </div>
                  <div className="flex justify-between items-start">
                    <dt className="text-muted-foreground">Uploaded by</dt>
                    <dd className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {document.uploaded_by_name || 'Unknown'}
                    </dd>
                  </div>
                  {document.is_locked && (
                    <div className="flex justify-between items-center text-warning">
                      <dt className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Locked
                      </dt>
                      <dd>For editing</dd>
                    </div>
                  )}
                </dl>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="versions">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  Version History
                  <Badge variant="secondary" className="text-[10px]">
                    {versions.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {versions.slice(0, 5).map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm"
                    >
                      <div>
                        <span className="font-medium">v{version.version}</span>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(version.created_at)}
                        </p>
                      </div>
                      <Badge
                        variant={version.status === 'current' ? 'success' : 'secondary'}
                        className="text-[10px]"
                      >
                        {version.status}
                      </Badge>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={onUploadNewVersion}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload New Version
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sharing">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  Sharing
                  <Badge variant="secondary" className="text-[10px]">
                    {shares.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {shares.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Not shared with anyone
                    </p>
                  ) : (
                    shares.slice(0, 5).map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm"
                      >
                        <span>{share.shared_with_email || 'Link'}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {share.permission}
                        </Badge>
                      </div>
                    ))
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={onShare}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Manage Sharing
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="approvals">
              <AccordionTrigger className="text-sm">
                Approval Workflow
              </AccordionTrigger>
              <AccordionContent>
                <DocumentApprovalWorkflow
                  documentId={document.id}
                  documentName={document.name}
                  currentStatus={document.status === 'review' ? 'in-review' : document.status as any}
                  approvers={[]} // In a real app, this would come from a hook
                  currentUserCanApprove={true} // In a real app, check user permissions
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={onRename}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Rename
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={onToggleLock}
            >
              {document.is_locked ? (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Unlock for Editing
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Lock for Editing
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
