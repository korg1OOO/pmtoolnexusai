import React, { useState } from 'react';
import { Pencil, Trash2, X, Check, History, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

export interface EditHistoryEntry {
  content: string;
  editedAt: string;
}

interface MessageActionsMenuProps {
  isOwnMessage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onViewHistory: () => void;
  hasEditHistory: boolean;
  className?: string;
}

export function MessageActionsMenu({
  isOwnMessage,
  onEdit,
  onDelete,
  onViewHistory,
  hasEditHistory,
  className,
}: MessageActionsMenuProps) {
  if (!isOwnMessage && !hasEditHistory) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="iconSm"
          className={cn("h-6 w-6", className)}
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {isOwnMessage && (
          <>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
        {hasEditHistory && (
          <>
            {isOwnMessage && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={onViewHistory}>
              <History className="h-3.5 w-3.5 mr-2" />
              View History
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface InlineEditorProps {
  content: string;
  onSave: (newContent: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function InlineEditor({ content, onSave, onCancel, isLoading }: InlineEditorProps) {
  const [editedContent, setEditedContent] = useState(content);

  const handleSave = () => {
    if (editedContent.trim() && editedContent !== content) {
      onSave(editedContent.trim());
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={editedContent}
        onChange={(e) => setEditedContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[60px] text-sm resize-none"
        autoFocus
        disabled={isLoading}
      />
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
          className="h-7"
        >
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isLoading || !editedContent.trim()}
          className="h-7"
        >
          <Check className="h-3 w-3 mr-1" />
          Save
        </Button>
      </div>
    </div>
  );
}

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({ isOpen, onClose, onConfirm, isLoading }: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Message</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this message? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface EditHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  history: EditHistoryEntry[];
  currentContent: string;
}

export function EditHistoryDialog({ isOpen, onClose, history, currentContent }: EditHistoryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Edit History
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-3">
            {/* Current version */}
            <div className="p-3 rounded-md bg-muted/50 border-l-2 border-primary">
              <p className="text-xs text-muted-foreground mb-1 font-medium">
                Current version
              </p>
              <p className="text-sm">{currentContent}</p>
            </div>
            
            {/* Previous versions */}
            {history.map((entry, index) => (
              <div key={index} className="p-3 rounded-md bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">
                  {format(new Date(entry.editedAt), 'MMM d, yyyy HH:mm')}
                </p>
                <p className="text-sm text-muted-foreground">{entry.content}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface EditedIndicatorProps {
  editedAt: string;
  className?: string;
}

export function EditedIndicator({ editedAt, className }: EditedIndicatorProps) {
  return (
    <span className={cn("text-[10px] text-muted-foreground italic", className)}>
      (edited)
    </span>
  );
}
