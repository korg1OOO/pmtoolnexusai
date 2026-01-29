import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type DocumentFolder } from '@/hooks/useDocumentFolders';

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: DocumentFolder[];
  currentFolderId: string | null;
  onUpload: (files: File[], folderId: string | null, description?: string) => Promise<void>;
  isNewVersion?: boolean;
  documentName?: string;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  folders,
  currentFolderId,
  onUpload,
  isNewVersion = false,
  documentName,
}: DocumentUploadDialogProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(currentFolderId);
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending',
    }));
    setFiles((prev) => [...prev, ...uploadFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      // Update all files to uploading status
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'uploading' as const }))
      );

      // Perform upload
      await onUpload(
        files.map((f) => f.file),
        selectedFolder,
        description || undefined
      );

      // Mark all as complete
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'complete' as const, progress: 100 }))
      );

      // Close dialog after short delay
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 1000);
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: 'error' as const,
          error: 'Upload failed',
        }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFiles([]);
    setDescription('');
    setSelectedFolder(currentFolderId);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const totalSize = files.reduce((acc, f) => acc + f.file.size, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isNewVersion ? `Upload New Version` : 'Upload Documents'}
          </DialogTitle>
          <DialogDescription>
            {isNewVersion
              ? `Upload a new version of "${documentName}"`
              : 'Drag and drop files or click to browse'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50',
              files.length > 0 && 'py-4'
            )}
          >
            {files.length === 0 ? (
              <>
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">
                  Drop files here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports PDF, Word, Excel, PowerPoint, and images
                </p>
              </>
            ) : (
              <div className="space-y-2">
                {files.map((uploadFile, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 bg-muted/30 rounded"
                  >
                    <File className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {uploadFile.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(uploadFile.file.size)}
                      </p>
                      {uploadFile.status === 'uploading' && (
                        <Progress value={50} className="h-1 mt-1" />
                      )}
                    </div>
                    {uploadFile.status === 'complete' && (
                      <CheckCircle className="h-5 w-5 text-success shrink-0" />
                    )}
                    {uploadFile.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                    )}
                    {uploadFile.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="iconXs"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <input
              type="file"
              multiple={!isNewVersion}
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
          </div>

          {files.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {files.length} file{files.length !== 1 ? 's' : ''} •{' '}
              {formatSize(totalSize)} total
            </p>
          )}

          {/* Folder Selection */}
          {!isNewVersion && (
            <div className="space-y-2">
              <Label>Destination Folder</Label>
              <Select
                value={selectedFolder || 'root'}
                onValueChange={(v) => setSelectedFolder(v === 'root' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Root (No folder)</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          {isNewVersion && (
            <div className="space-y-2">
              <Label>Change Notes (optional)</Label>
              <Textarea
                placeholder="Describe what changed in this version..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
