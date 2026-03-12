import React from 'react';
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
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type Document } from '@/hooks/useDocuments';
import { type SortField } from './DocumentToolbar';

interface DocumentListProps {
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
  sortBy: SortField;
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: SortField) => void;
  showDetails?: boolean;
}

const getFileIcon = (type: string) => {
  const className = 'h-5 w-5';
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

export function DocumentList({
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
  sortBy,
  sortDirection,
  onSortChange,
  showDetails = false,
}: DocumentListProps) {
  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === documents.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(documents.map((d) => d.id));
    }
  };

  const isSelected = (id: string) => selectedIds.includes(id);
  const isAllSelected = documents.length > 0 && selectedIds.length === documents.length;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 ml-1" />
    );
  };

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
    <div className="flex-1 overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-card z-10">
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead className="w-10"></TableHead>
            <TableHead>
              <button
                className="flex items-center hover:text-foreground"
                onClick={() => onSortChange('name')}
              >
                Name
                <SortIcon field="name" />
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center hover:text-foreground"
                onClick={() => onSortChange('date')}
              >
                Modified
                <SortIcon field="date" />
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center hover:text-foreground"
                onClick={() => onSortChange('size')}
              >
                Size
                <SortIcon field="size" />
              </button>
            </TableHead>
            <TableHead>
              <button
                className="flex items-center hover:text-foreground"
                onClick={() => onSortChange('type')}
              >
                Type
                <SortIcon field="type" />
              </button>
            </TableHead>
            {showDetails && (
              <>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded By</TableHead>
              </>
            )}
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow
              key={doc.id}
              className={cn(
                'cursor-pointer',
                isSelected(doc.id) && 'bg-primary/5'
              )}
              onClick={() => onDocumentClick(doc)}
              onDoubleClick={() => onDocumentDoubleClick(doc)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected(doc.id)}
                  onCheckedChange={() => toggleSelection(doc.id)}
                />
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="iconXs"
                  onClick={() => onToggleStar(doc.id)}
                >
                  {doc.is_starred ? (
                    <Star className="h-4 w-4 text-warning fill-warning" />
                  ) : (
                    <StarOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getFileIcon(doc.file_type)}
                  <span className="font-medium truncate max-w-[200px]">
                    {doc.name}
                  </span>
                  {doc.is_locked && (
                    <Lock className="h-3 w-3 text-warning" />
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(doc.updated_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatSize(doc.file_size)}
              </TableCell>
              <TableCell className="text-muted-foreground uppercase text-xs">
                {doc.file_type}
              </TableCell>
              {showDetails && (
                <>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(doc.status)}
                      className="text-[10px]"
                    >
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {doc.uploaded_by_name || 'Unknown'}
                  </TableCell>
                </>
              )}
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="iconSm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onDocumentClick(doc)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDownload(doc)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewHistory(doc)}>
                      <History className="h-4 w-4 mr-2" />
                      Version History
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onRename(doc)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCopy(doc)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMove(doc)}>
                      <Move className="h-4 w-4 mr-2" />
                      Move
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onShare(doc)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(doc.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
