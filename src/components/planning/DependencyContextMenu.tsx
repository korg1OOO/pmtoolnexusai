import React, { useState } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Edit, ArrowRight, ArrowDown, ArrowLeft, ArrowUp } from 'lucide-react';
import type { DbDependency } from '@/hooks/useTasks';

export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

const dependencyTypeLabels: Record<DependencyType, { label: string; description: string; icon: React.ReactNode }> = {
  FS: { 
    label: 'Finish-to-Start', 
    description: 'Successor starts after predecessor finishes',
    icon: <ArrowRight className="h-4 w-4" />,
  },
  SS: { 
    label: 'Start-to-Start', 
    description: 'Both start at the same time',
    icon: <ArrowDown className="h-4 w-4" />,
  },
  FF: { 
    label: 'Finish-to-Finish', 
    description: 'Both finish at the same time',
    icon: <ArrowUp className="h-4 w-4" />,
  },
  SF: { 
    label: 'Start-to-Finish', 
    description: 'Successor finishes when predecessor starts',
    icon: <ArrowLeft className="h-4 w-4" />,
  },
};

interface DependencyContextMenuProps {
  children: React.ReactNode;
  dependency: DbDependency;
  predecessorName: string;
  successorName: string;
  onUpdateType: (dependencyId: string, type: DependencyType) => void;
  onUpdateLag: (dependencyId: string, lag: number) => void;
  onDelete: (dependencyId: string) => void;
}

export function DependencyContextMenu({
  children,
  dependency,
  predecessorName,
  successorName,
  onUpdateType,
  onUpdateLag,
  onDelete,
}: DependencyContextMenuProps) {
  const [lagDialogOpen, setLagDialogOpen] = useState(false);
  const [lagValue, setLagValue] = useState(dependency.lag.toString());
  
  const handleLagSubmit = () => {
    const newLag = parseInt(lagValue, 10);
    if (!isNaN(newLag)) {
      onUpdateLag(dependency.id, newLag);
    }
    setLagDialogOpen(false);
  };
  
  const currentType = dependency.type as DependencyType;
  
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">{predecessorName}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-primary font-medium">{currentType}</span>
              <span>→</span>
              <span className="font-medium text-foreground">{successorName}</span>
              {dependency.lag !== 0 && (
                <span className="ml-1 text-muted-foreground">
                  ({dependency.lag > 0 ? '+' : ''}{dependency.lag}d)
                </span>
              )}
            </div>
          </div>
          
          <ContextMenuSeparator />
          
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Edit className="h-4 w-4 mr-2" />
              Change Type
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-56">
              {(Object.keys(dependencyTypeLabels) as DependencyType[]).map((type) => {
                const { label, description, icon } = dependencyTypeLabels[type];
                const isActive = currentType === type;
                
                return (
                  <ContextMenuItem
                    key={type}
                    className={isActive ? 'bg-accent' : ''}
                    onClick={() => onUpdateType(dependency.id, type)}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <div className="mt-0.5">{icon}</div>
                      <div className="flex-1">
                        <div className="font-medium">{label}</div>
                        <div className="text-xs text-muted-foreground">{description}</div>
                      </div>
                      {isActive && (
                        <span className="text-primary text-xs font-medium">Current</span>
                      )}
                    </div>
                  </ContextMenuItem>
                );
              })}
            </ContextMenuSubContent>
          </ContextMenuSub>
          
          <ContextMenuItem onClick={() => {
            setLagValue(dependency.lag.toString());
            setLagDialogOpen(true);
          }}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Adjust Lag
            <span className="ml-auto text-xs text-muted-foreground">
              {dependency.lag}d
            </span>
          </ContextMenuItem>
          
          <ContextMenuSeparator />
          
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(dependency.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Dependency
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      
      {/* Lag Dialog */}
      <Dialog open={lagDialogOpen} onOpenChange={setLagDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Adjust Dependency Lag</DialogTitle>
            <DialogDescription>
              Set the lag (delay) between {predecessorName} and {successorName}.
              Positive values add delay, negative values create overlap.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="lag">Lag (days)</Label>
              <Input
                id="lag"
                type="number"
                value={lagValue}
                onChange={(e) => setLagValue(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                • Positive: Successor starts N days after dependency condition
                <br />
                • Negative: Successor can start N days before (overlap)
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setLagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLagSubmit}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
