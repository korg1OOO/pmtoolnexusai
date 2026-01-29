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
import { Calendar, Repeat } from 'lucide-react';

interface RecurringEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditSingle: () => void;
  onEditAll: () => void;
  meetingTitle: string;
}

export function RecurringEditDialog({
  open,
  onOpenChange,
  onEditSingle,
  onEditAll,
  meetingTitle,
}: RecurringEditDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            Edit Recurring Meeting
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            <span className="font-medium text-foreground">"{meetingTitle}"</span> is part of a recurring series. 
            How would you like to apply your changes?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="grid gap-3 py-4">
          <Button
            variant="outline"
            className="justify-start h-auto py-3 px-4"
            onClick={() => {
              onEditSingle();
              onOpenChange(false);
            }}
          >
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium">This meeting only</div>
                <div className="text-sm text-muted-foreground">
                  Changes will only apply to this specific occurrence
                </div>
              </div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="justify-start h-auto py-3 px-4"
            onClick={() => {
              onEditAll();
              onOpenChange(false);
            }}
          >
            <div className="flex items-start gap-3">
              <Repeat className="h-5 w-5 mt-0.5 text-primary" />
              <div className="text-left">
                <div className="font-medium">All meetings in series</div>
                <div className="text-sm text-muted-foreground">
                  Changes will apply to all future occurrences in this series
                </div>
              </div>
            </div>
          </Button>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
