import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateProject } from '@/hooks/useProjects';
import { useProjectContext } from '@/contexts/ProjectContext';

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
    const { mutateAsync: createProject, isPending } = useCreateProject();
    const { selectProject } = useProjectContext();

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        methodology: 'agile',
        status: 'active',
        health: 'green',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        budget: 0,
        spent: 0,
        progress: 0,
        owner_id: null,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload = {
                ...formData,
                end_date: formData.end_date || null
            };
            const project = await createProject(payload);
            selectProject(project.id); // Auto-select the newly created project
            onOpenChange(false);

            // Reset form
            setFormData({
                name: '',
                code: '',
                description: '',
                methodology: 'agile',
                status: 'active',
                health: 'green',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                budget: 0,
                spent: 0,
                progress: 0,
                owner_id: null,
            });
        } catch (error: any) {
            console.error("CreateProjectDialog submission caught error:", error);
            // Error handled by mutation
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Add a new project to your workspace. Fill in the required details below.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Project Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter project name"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="code">Project Code *</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="PROJ-001"
                                required
                                maxLength={20}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief project description"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="methodology">Methodology</Label>
                                <Select
                                    value={formData.methodology}
                                    onValueChange={(value) => setFormData({ ...formData, methodology: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="agile">Agile</SelectItem>
                                        <SelectItem value="waterfall">Waterfall</SelectItem>
                                        <SelectItem value="hybrid">Hybrid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="budget">Budget</Label>
                                <Input
                                    id="budget"
                                    type="number"
                                    value={formData.budget}
                                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="start_date">Start Date</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="end_date">End Date</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending || !formData.name || !formData.code}>
                            {isPending ? 'Creating...' : 'Create Project'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
