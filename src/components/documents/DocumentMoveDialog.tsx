import React, { useState } from 'react';
import { Move, FolderOpen, ChevronRight, ChevronDown, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { type FolderTreeNode } from '@/hooks/useDocumentFolders';

interface DocumentMoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentNames: string[];
  folders: FolderTreeNode[];
  currentFolderId: string | null;
  onMove: (targetFolderId: string | null) => Promise<void>;
  onCopy: (targetFolderId: string | null) => Promise<void>;
}

function FolderTreeSelect({
  folder,
  level = 0,
  selectedId,
  onSelect,
  disabledId,
}: {
  folder: FolderTreeNode;
  level?: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabledId?: string;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = folder.children.length > 0;
  const isDisabled = folder.id === disabledId;

  return (
    <div>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            'flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer',
            selectedId === folder.id && 'bg-primary/10',
            isDisabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => !isDisabled && onSelect(folder.id)}
        >
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="iconXs"
                className="shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {isOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-6" />
          )}
          <Folder className="h-4 w-4" style={{ color: folder.color }} />
          <span className="text-sm flex-1">{folder.name}</span>
          {selectedId === folder.id && (
            <div className="w-2 h-2 rounded-full bg-primary" />
          )}
        </div>

        {hasChildren && (
          <CollapsibleContent>
            {folder.children.map((child) => (
              <FolderTreeSelect
                key={child.id}
                folder={child}
                level={level + 1}
                selectedId={selectedId}
                onSelect={onSelect}
                disabledId={disabledId}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

export function DocumentMoveDialog({
  open,
  onOpenChange,
  documentNames,
  folders,
  currentFolderId,
  onMove,
  onCopy,
}: DocumentMoveDialogProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [action, setAction] = useState<'move' | 'copy'>('move');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async () => {
    setIsProcessing(true);
    try {
      if (action === 'move') {
        await onMove(selectedFolder);
      } else {
        await onCopy(selectedFolder);
      }
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const itemCount = documentNames.length;
  const itemLabel = itemCount === 1 ? documentNames[0] : `${itemCount} items`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Move className="h-5 w-5" />
            {action === 'move' ? 'Move' : 'Copy'} {itemLabel}
          </DialogTitle>
          <DialogDescription>
            Select a destination folder
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action Toggle */}
          <RadioGroup
            value={action}
            onValueChange={(v) => setAction(v as 'move' | 'copy')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="move" id="move" />
              <Label htmlFor="move">Move</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="copy" id="copy" />
              <Label htmlFor="copy">Copy</Label>
            </div>
          </RadioGroup>

          {/* Folder Tree */}
          <ScrollArea className="h-64 border rounded-lg p-2">
            {/* Root option */}
            <div
              className={cn(
                'flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer',
                selectedFolder === null && 'bg-primary/10'
              )}
              onClick={() => setSelectedFolder(null)}
            >
              <div className="w-6" />
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm flex-1">Root (No folder)</span>
              {selectedFolder === null && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>

            {/* Folder tree */}
            {folders.map((folder) => (
              <FolderTreeSelect
                key={folder.id}
                folder={folder}
                selectedId={selectedFolder}
                onSelect={setSelectedFolder}
                disabledId={currentFolderId || undefined}
              />
            ))}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAction} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : action === 'move' ? 'Move' : 'Copy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
