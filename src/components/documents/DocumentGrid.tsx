import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Star,
  StarOff,
  MoreHorizontal,
  Lock,
  Eye,
  Download,
  Share2,
  Trash2,
  Edit2,
  History,
  Copy,
  Move,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type Document } from '@/hooks/useDocuments';

interface DocumentGridProps {
  documents: Document[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onDocumentClick: (doc: Document) => void;
  onDocumentDoubleClick: (doc: Document) => void;
  onToggleStar: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (doc: Document) => void;
  onShare: (doc: Document) => void;
  onRename: (doc: Document) => void;
  onViewHistory: (doc: Document) => void;
  onCopy: (doc: Document) => void;
  onMove: (doc: Document) => void;
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <FileText className="h-8 w-8 text-destructive" />;
    case 'doc':
      return <FileText className="h-8 w-8 text-primary" />;
    case 'xls':
      return <FileSpreadsheet className="h-8 w-8 text-success" />;
    case 'ppt':
      return <FileText className="h-8 w-8 text-warning" />;
    case 'image':
      return <FileImage className="h-8 w-8 text-info" />;
    default:
      return <File className="h-8 w-8 text-muted-foreground" />;
  }
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getStatusVariant = (status: string) => {
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

export function DocumentGrid({
  documents,
  selectedIds,
  onSelectionChange,
  onDocumentClick,
  onDocumentDoubleClick,
  onToggleStar,
  onDelete,
  onDownload,
  onShare,
  onRename,
  onViewHistory,
  onCopy,
  onMove,
}: DocumentGridProps) {
  const toggleSelection = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const isSelected = (id: string) => selectedIds.includes(id);

  if (documents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <File className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium">No documents</h3>
          <p className="text-muted-foreground text-sm">
            Upload files or create a folder to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
      {documents.map((doc) => (
        <motion.div
          key={doc.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ y: -2 }}
        >
          <Card
            className={cn(
              'hover:shadow-md transition-all cursor-pointer relative group',
              isSelected(doc.id) && 'ring-2 ring-primary'
            )}
            onClick={() => onDocumentClick(doc)}
            onDoubleClick={() => onDocumentDoubleClick(doc)}
          >
            <CardContent className="p-4">
              {/* Selection checkbox */}
              <div
                className={cn(
                  'absolute top-2 left-2 z-10',
                  !isSelected(doc.id) && 'opacity-0 group-hover:opacity-100'
                )}
                onClick={(e) => toggleSelection(doc.id, e)}
              >
                <Checkbox checked={isSelected(doc.id)} />
              </div>

              {/* Actions */}
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="iconXs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStar(doc.id);
                  }}
                >
                  {doc.is_starred ? (
                    <Star className="h-4 w-4 text-warning fill-warning" />
                  ) : (
                    <StarOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="iconXs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDocumentClick(doc);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(doc);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewHistory(doc);
                      }}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Version History
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onRename(doc);
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopy(doc);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onMove(doc);
                      }}
                    >
                      <Move className="h-4 w-4 mr-2" />
                      Move
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onShare(doc);
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(doc.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* File Icon */}
              <div className="flex items-center justify-center py-4">
                <div className="p-4 rounded-lg bg-muted relative">
                  {getFileIcon(doc.file_type)}
                  {doc.is_locked && (
                    <Lock className="h-3 w-3 text-warning absolute -top-1 -right-1" />
                  )}
                </div>
              </div>

              {/* File Info */}
              <h3 className="font-medium text-sm truncate mb-1" title={doc.name}>
                {doc.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                {formatSize(doc.file_size)} • v{doc.version}
              </p>

              {/* Status & Version */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(doc.updated_at).toLocaleDateString()}
                </span>
                <Badge
                  variant={getStatusVariant(doc.status) as any}
                  className="text-[10px]"
                >
                  {doc.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
