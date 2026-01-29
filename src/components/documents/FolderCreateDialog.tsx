import React, { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const FOLDER_COLORS = [
  { value: 'blue', label: 'Blue', color: 'hsl(var(--primary))' },
  { value: 'green', label: 'Green', color: 'hsl(var(--success))' },
  { value: 'yellow', label: 'Yellow', color: 'hsl(var(--warning))' },
  { value: 'red', label: 'Red', color: 'hsl(var(--destructive))' },
  { value: 'purple', label: 'Purple', color: '#8B5CF6' },
  { value: 'gray', label: 'Gray', color: 'hsl(var(--muted-foreground))' },
];

interface FolderCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: DocumentFolder[];
  parentFolderId: string | null;
  onCreateFolder: (name: string, parentId: string | null, color: string) => Promise<void>;
}

export function FolderCreateDialog({
  open,
  onOpenChange,
  folders,
  parentFolderId,
  onCreateFolder,
}: FolderCreateDialogProps) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(parentFolderId);
  const [color, setColor] = useState('blue');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      await onCreateFolder(name.trim(), parentId, color);
      onOpenChange(false);
      resetForm();
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setName('');
    setParentId(parentFolderId);
    setColor('blue');
  };

  // Update parent when prop changes
  React.useEffect(() => {
    setParentId(parentFolderId);
  }, [parentFolderId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Create New Folder
          </DialogTitle>
          <DialogDescription>
            Create a new folder to organize your documents
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Folder Name */}
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              placeholder="Enter folder name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Parent Folder */}
          <div className="space-y-2">
            <Label>Parent Folder</Label>
            <Select
              value={parentId || 'root'}
              onValueChange={(v) => setParentId(v === 'root' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root (No parent)</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Folder Color</Label>
            <div className="flex items-center gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c.value
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
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
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Folder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
