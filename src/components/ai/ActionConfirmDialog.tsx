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
import { AlertTriangle, CheckCircle, Calendar, DollarSign, Users, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AIAction } from '@/types/ai-agents';

interface ActionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: AIAction | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  schedule: <Calendar className="h-5 w-5" />,
  budget: <DollarSign className="h-5 w-5" />,
  resource: <Users className="h-5 w-5" />,
  document: <FileText className="h-5 w-5" />,
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-500/10 text-green-600 border-green-500/20',
  update: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  delete: 'bg-destructive/10 text-destructive border-destructive/20',
  confirm: 'bg-primary/10 text-primary border-primary/20',
};

export function ActionConfirmDialog({
  open,
  onOpenChange,
  action,
  onConfirm,
  onCancel,
  isLoading = false,
}: ActionConfirmDialogProps) {
  if (!action) return null;

  const isDestructive = action.type === 'delete';
  const actionColor = ACTION_COLORS[action.type] || ACTION_COLORS.confirm;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${actionColor}`}>
              {isDestructive ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
            </div>
            <Badge variant="outline" className="capitalize">
              {action.type} Action
            </Badge>
          </div>
          <AlertDialogTitle>
            {isDestructive ? 'Confirm Destructive Action' : 'Confirm Action'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>{action.description}</p>
            
            {action.data && Object.keys(action.data).length > 0 && (
              <div className="bg-muted rounded-lg p-3 text-sm space-y-2">
                <p className="font-medium text-foreground">Details:</p>
                <ul className="space-y-1">
                  {Object.entries(action.data).map(([key, value]) => (
                    <li key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-medium text-foreground">
                        {String(value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isDestructive && (
              <p className="text-destructive font-medium text-sm">
                ⚠️ This action cannot be undone.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={isDestructive ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
