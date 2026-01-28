import React, { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Flag,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  MoreHorizontal,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  useProjectBaselines, 
  useDeleteBaseline, 
  useUpdateBaseline,
  type ProjectBaseline 
} from '@/hooks/useBaselines';
import { useSaveProjectBaseline } from '@/hooks/useTasks';

interface BaselineManagerProps {
  projectId: string;
  selectedBaseline: string | null;
  onSelectBaseline: (name: string | null) => void;
}

export function BaselineManager({ 
  projectId, 
  selectedBaseline, 
  onSelectBaseline 
}: BaselineManagerProps) {
  const { data: baselines = [], isLoading } = useProjectBaselines(projectId);
  const saveBaseline = useSaveProjectBaseline();
  const deleteBaseline = useDeleteBaseline();
  const updateBaseline = useUpdateBaseline();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [baselineToDelete, setBaselineToDelete] = useState<ProjectBaseline | null>(null);
  const [newBaselineName, setNewBaselineName] = useState('');
  const [newBaselineDescription, setNewBaselineDescription] = useState('');

  const handleCreateBaseline = async () => {
    if (!newBaselineName.trim()) return;
    
    await saveBaseline.mutateAsync({
      projectId,
      name: newBaselineName.trim(),
      description: newBaselineDescription.trim() || undefined,
    });
    
    setCreateDialogOpen(false);
    setNewBaselineName('');
    setNewBaselineDescription('');
    onSelectBaseline(newBaselineName.trim());
  };

  const handleDeleteBaseline = async () => {
    if (!baselineToDelete) return;
    
    await deleteBaseline.mutateAsync({
      baselineId: baselineToDelete.id,
      projectId,
    });
    
    if (selectedBaseline === baselineToDelete.name) {
      onSelectBaseline(null);
    }
    
    setDeleteDialogOpen(false);
    setBaselineToDelete(null);
  };

  const handleUpdateBaseline = async (baseline: ProjectBaseline) => {
    await updateBaseline.mutateAsync({
      baselineId: baseline.id,
      projectId,
      name: baseline.name,
    });
  };

  const confirmDelete = (baseline: ProjectBaseline) => {
    setBaselineToDelete(baseline);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Project Baselines
              </CardTitle>
              <CardDescription>
                Compare current schedule against saved baselines
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Save Baseline
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading baselines...</div>
          ) : baselines.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Flag className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No baselines saved yet</p>
              <p className="text-xs mt-1">Save a baseline to track schedule variance</p>
            </div>
          ) : (
            <div className="space-y-2">
              {baselines.map((baseline) => (
                <div
                  key={baseline.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedBaseline === baseline.name
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => onSelectBaseline(
                    selectedBaseline === baseline.name ? null : baseline.name
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      selectedBaseline === baseline.name ? "bg-primary" : "bg-muted-foreground/30"
                    )} />
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {baseline.name}
                        {selectedBaseline === baseline.name && (
                          <Badge variant="secondary" className="text-xs">Active</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(baseline.baseline_date), 'MMM d, yyyy')}
                        {baseline.description && ` • ${baseline.description}`}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelectBaseline(baseline.name)}>
                        <Check className="h-4 w-4 mr-2" />
                        Compare
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateBaseline(baseline)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Update from Current
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => confirmDelete(baseline)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Baseline Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Project Baseline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="baseline-name">Baseline Name</Label>
              <Input
                id="baseline-name"
                value={newBaselineName}
                onChange={(e) => setNewBaselineName(e.target.value)}
                placeholder="e.g., Original Plan, Approved Schedule"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseline-description">Description (optional)</Label>
              <Textarea
                id="baseline-description"
                value={newBaselineDescription}
                onChange={(e) => setNewBaselineDescription(e.target.value)}
                placeholder="Notes about this baseline..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateBaseline}
              disabled={!newBaselineName.trim() || saveBaseline.isPending}
            >
              {saveBaseline.isPending ? 'Saving...' : 'Save Baseline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Baseline</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{baselineToDelete?.name}"? 
              This will permanently remove all baseline data for this snapshot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBaseline}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
