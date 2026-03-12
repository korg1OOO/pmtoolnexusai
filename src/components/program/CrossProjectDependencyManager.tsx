import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GitBranch,
    Plus,
    Trash2,
    AlertCircle,
    CheckCircle2,
    Clock,
    ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
    getCrossProjectDependencies,
    createCrossProjectDependency,
    deleteCrossProjectDependency,
    type CrossProjectDependency,
} from '@/services/programTimelineService';
import { getProgramProjects } from '@/services/programService';

interface CrossProjectDependencyManagerProps {
    programId: string;
    tenantId: string;
}

export function CrossProjectDependencyManager({ programId, tenantId }: CrossProjectDependencyManagerProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    // Fetch dependencies
    const { data: dependencies = [], isLoading } = useQuery({
        queryKey: ['cross-project-dependencies', programId],
        queryFn: () => getCrossProjectDependencies(programId),
    });

    // Fetch projects
    const { data: projects = [] } = useQuery({
        queryKey: ['program-projects', programId],
        queryFn: () => getProgramProjects(programId),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: deleteCrossProjectDependency,
        onSuccess: () => {
            toast.success('Dependency deleted');
            queryClient.invalidateQueries({ queryKey: ['cross-project-dependencies'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete dependency');
        },
    });

    const getDependencyTypeLabel = (type: string) => {
        switch (type) {
            case 'FS': return 'Finish-to-Start';
            case 'SS': return 'Start-to-Start';
            case 'FF': return 'Finish-to-Finish';
            case 'SF': return 'Start-to-Finish';
            default: return type;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-500';
            case 'resolved': return 'bg-gray-500/10 text-gray-500';
            case 'blocked': return 'bg-red-500/10 text-red-500';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading dependencies...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <GitBranch className="h-6 w-6" />
                        Cross-Project Dependencies
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        {dependencies.length} dependencies across {projects.length} projects
                    </p>
                </div>
                <CreateDependencyDialog
                    programId={programId}
                    tenantId={tenantId}
                    projects={projects}
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                />
            </div>

            {/* Dependency List */}
            {dependencies.length > 0 ? (
                <div className="grid gap-4">
                    <AnimatePresence mode="popLayout">
                        {dependencies.map(dependency => (
                            <DependencyCard
                                key={dependency.id}
                                dependency={dependency}
                                projects={projects}
                                onDelete={() => deleteMutation.mutate(dependency.id)}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Dependencies Yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Create dependencies to link tasks between different projects
                        </p>
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Dependency
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function DependencyCard({
    dependency,
    projects,
    onDelete,
}: {
    dependency: CrossProjectDependency;
    projects: any[];
    onDelete: () => void;
}) {
    const sourceProject = projects.find(p => p.id === dependency.source_project_id);
    const targetProject = projects.find(p => p.id === dependency.target_project_id);

    const getDependencyTypeLabel = (type: string) => {
        switch (type) {
            case 'FS': return 'Finish-to-Start';
            case 'SS': return 'Start-to-Start';
            case 'FF': return 'Finish-to-Finish';
            case 'SF': return 'Start-to-Finish';
            default: return type;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-500';
            case 'resolved': return 'bg-gray-500/10 text-gray-500';
            case 'blocked': return 'bg-red-500/10 text-red-500';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center gap-4">
                            {/* Source */}
                            <div className="flex-1">
                                <div className="text-sm font-medium">{sourceProject?.name || 'Unknown Project'}</div>
                                <div className="text-xs text-muted-foreground">Task: {dependency.source_task_id.substring(0, 8)}</div>
                            </div>

                            {/* Dependency Type */}
                            <div className="flex flex-col items-center gap-1">
                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                <Badge variant="outline" className="text-xs">
                                    {getDependencyTypeLabel(dependency.dependency_type)}
                                </Badge>
                                {dependency.lag > 0 && (
                                    <div className="text-xs text-muted-foreground">+{dependency.lag}d lag</div>
                                )}
                            </div>

                            {/* Target */}
                            <div className="flex-1">
                                <div className="text-sm font-medium">{targetProject?.name || 'Unknown Project'}</div>
                                <div className="text-xs text-muted-foreground">Task: {dependency.target_task_id.substring(0, 8)}</div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                            <Badge className={getStatusColor(dependency.status)}>
                                {dependency.status}
                            </Badge>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onDelete}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function CreateDependencyDialog({
    programId,
    tenantId,
    projects,
    open,
    onOpenChange,
}: {
    programId: string;
    tenantId: string;
    projects: any[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [formData, setFormData] = useState({
        source_project_id: '',
        source_task_id: '',
        target_project_id: '',
        target_task_id: '',
        dependency_type: 'FS',
        lag: '0',
    });

    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: createCrossProjectDependency,
        onSuccess: () => {
            toast.success('Dependency created successfully');
            queryClient.invalidateQueries({ queryKey: ['cross-project-dependencies'] });
            queryClient.invalidateQueries({ queryKey: ['program-timeline'] });
            onOpenChange(false);
            setFormData({
                source_project_id: '',
                source_task_id: '',
                target_project_id: '',
                target_task_id: '',
                dependency_type: 'FS',
                lag: '0',
            });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create dependency');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        createMutation.mutate({
            program_id: programId,
            tenant_id: tenantId,
            source_project_id: formData.source_project_id,
            source_task_id: formData.source_task_id,
            target_project_id: formData.target_project_id,
            target_task_id: formData.target_task_id,
            dependency_type: formData.dependency_type,
            lag: parseInt(formData.lag) || 0,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Dependency
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create Cross-Project Dependency</DialogTitle>
                    <DialogDescription>
                        Link tasks between different projects in this program
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Source */}
                        <div className="space-y-4">
                            <h3 className="font-semibold">Source (Predecessor)</h3>
                            <div className="space-y-2">
                                <Label>Project</Label>
                                <Select
                                    value={formData.source_project_id}
                                    onValueChange={(value) => setFormData({ ...formData, source_project_id: value })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map(project => (
                                            <SelectItem key={project.id} value={project.id}>
                                                {project.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Task ID</Label>
                                <Input
                                    value={formData.source_task_id}
                                    onChange={(e) => setFormData({ ...formData, source_task_id: e.target.value })}
                                    placeholder="Enter task ID"
                                    required
                                />
                            </div>
                        </div>

                        {/* Target */}
                        <div className="space-y-4">
                            <h3 className="font-semibold">Target (Successor)</h3>
                            <div className="space-y-2">
                                <Label>Project</Label>
                                <Select
                                    value={formData.target_project_id}
                                    onValueChange={(value) => setFormData({ ...formData, target_project_id: value })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map(project => (
                                            <SelectItem key={project.id} value={project.id}>
                                                {project.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Task ID</Label>
                                <Input
                                    value={formData.target_task_id}
                                    onChange={(e) => setFormData({ ...formData, target_task_id: e.target.value })}
                                    placeholder="Enter task ID"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Dependency Type</Label>
                            <Select
                                value={formData.dependency_type}
                                onValueChange={(value) => setFormData({ ...formData, dependency_type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FS">Finish-to-Start (FS)</SelectItem>
                                    <SelectItem value="SS">Start-to-Start (SS)</SelectItem>
                                    <SelectItem value="FF">Finish-to-Finish (FF)</SelectItem>
                                    <SelectItem value="SF">Start-to-Finish (SF)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Lag (days)</Label>
                            <Input
                                type="number"
                                value={formData.lag}
                                onChange={(e) => setFormData({ ...formData, lag: e.target.value })}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Creating...' : 'Create Dependency'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
