import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LinkChildProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    taskId: string;
    currentChildProjectId?: string | null;
    onLinkSuccess?: () => void;
}

export function LinkChildProjectDialog({
    open,
    onOpenChange,
    taskId,
    currentChildProjectId,
    onLinkSuccess
}: LinkChildProjectDialogProps) {
    const [selectedProjectId, setSelectedProjectId] = useState<string>(currentChildProjectId || '');
    const queryClient = useQueryClient();

    // Fetch available projects
    const { data: projects = [], isLoading } = useQuery({
        queryKey: ['projects-list-simple'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('id, name, code')
                .order('name');

            if (error) throw error;
            return data;
        },
        enabled: open
    });

    // Mutation to update task
    const linkProject = useMutation({
        mutationFn: async (projectId: string | null) => {
            const { error } = await supabase
                .from('tasks')
                .update({ child_project_id: projectId })
                .eq('id', taskId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success('Child project updated successfully');
            queryClient.invalidateQueries({ queryKey: ['tasks'] }); // Refresh tasks
            onLinkSuccess?.();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error('Failed to update child project: ' + error.message);
        }
    });

    const handleSave = () => {
        linkProject.mutate(selectedProjectId || null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Link Child Project</DialogTitle>
                    <DialogDescription>
                        Select a project to link as a child plan for this task.
                        This allows you to verify detailed progress from the child project.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="project" className="text-right">
                            Project
                        </Label>
                        <div className="col-span-3">
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Select
                                    value={selectedProjectId}
                                    onValueChange={setSelectedProjectId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (Unlink)</SelectItem>
                                        {projects.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.code} - {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={linkProject.isPending}>
                        {linkProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Link
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
