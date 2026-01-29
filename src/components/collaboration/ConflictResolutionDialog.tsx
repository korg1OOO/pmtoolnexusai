import React from 'react';
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
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, RefreshCw, Shield } from 'lucide-react';
import { PresenceUser } from '@/hooks/usePresence';

interface ConflictResolutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lockedBy: PresenceUser | null;
  taskName: string;
  onForceEdit: () => void;
  onWait: () => void;
  onRefresh: () => void;
}

export function ConflictResolutionDialog({
  isOpen,
  onClose,
  lockedBy,
  taskName,
  onForceEdit,
  onWait,
  onRefresh,
}: ConflictResolutionDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>Edit Conflict Detected</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-2">
              <p>
                <strong className="text-foreground">{lockedBy?.displayName || 'Another user'}</strong> is 
                currently editing the task:
              </p>
              <div className="bg-muted px-3 py-2 rounded-md font-medium text-foreground">
                {taskName}
              </div>
              <p className="text-sm">
                To avoid losing changes, you can wait for them to finish, 
                refresh to see their latest changes, or force your edit (may overwrite their work).
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-2 py-2">
          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={() => {
              onWait();
              onClose();
            }}
          >
            <Clock className="h-4 w-4 text-primary" />
            <div className="text-left">
              <div className="font-medium">Wait for them to finish</div>
              <div className="text-xs text-muted-foreground">
                You'll be notified when the task is available
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={() => {
              onRefresh();
              onClose();
            }}
          >
            <RefreshCw className="h-4 w-4 text-accent-foreground" />
            <div className="text-left">
              <div className="font-medium">Refresh and view changes</div>
              <div className="text-xs text-muted-foreground">
                See the latest version of this task
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-2 border-destructive/50 hover:bg-destructive/10"
            onClick={() => {
              onForceEdit();
              onClose();
            }}
          >
            <Shield className="h-4 w-4 text-destructive" />
            <div className="text-left">
              <div className="font-medium text-destructive">Force my edit</div>
              <div className="text-xs text-muted-foreground">
                May overwrite {lockedBy?.displayName}'s changes
              </div>
            </div>
          </Button>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
