import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Building, Plus, Edit, Trash2, Users, FolderKanban, Search } from 'lucide-react';
import { getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace, type WorkspaceListItem } from '@/services/tenantService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';

export function WorkspaceManagement() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { tenantId } = useTenant();
    const [searchQuery, setSearchQuery] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceListItem | null>(null);

    const { data: workspaces, isLoading } = useQuery({
        queryKey: ['tenant-workspaces', tenantId],
        queryFn: () => getWorkspaces(tenantId)
    });

    const createMutation = useMutation({
        mutationFn: (data: { name: string; slug: string; description?: string }) =>
            createWorkspace(tenantId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-workspaces'] });
            toast.success('Workspace created successfully');
            setCreateDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create workspace');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            updateWorkspace(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-workspaces'] });
            toast.success('Workspace updated successfully');
            setEditDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update workspace');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteWorkspace(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-workspaces'] });
            toast.success('Workspace deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete workspace');
        }
    });

    const filteredWorkspaces = workspaces?.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Workspace Management</h1>
                    <p className="text-muted-foreground">Manage divisions and departments</p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Workspace
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search workspaces..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Workspaces Grid */}
            {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading workspaces...</div>
            ) : filteredWorkspaces && filteredWorkspaces.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredWorkspaces.map((workspace) => (
                        <WorkspaceCard
                            key={workspace.id}
                            workspace={workspace}
                            onEdit={() => {
                                setSelectedWorkspace(workspace);
                                setEditDialogOpen(true);
                            }}
                            onDelete={() => {
                                if (confirm(`Are you sure you want to delete "${workspace.name}"?`)) {
                                    deleteMutation.mutate(workspace.id);
                                }
                            }}
                            onView={() => navigate(`/workspace/${workspace.id}`)}
                        />
                    ))}
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No workspaces found</h3>
                    <p className="text-muted-foreground mb-4">
                        {searchQuery ? 'Try adjusting your search' : 'Create your first workspace to get started'}
                    </p>
                    {!searchQuery && (
                        <Button onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Workspace
                        </Button>
                    )}
                </Card>
            )}

            {/* Create Dialog */}
            <CreateWorkspaceDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                onSubmit={(data) => createMutation.mutate(data)}
                isLoading={createMutation.isPending}
            />

            {/* Edit Dialog */}
            {selectedWorkspace && (
                <EditWorkspaceDialog
                    open={editDialogOpen}
                    workspace={selectedWorkspace}
                    onClose={() => {
                        setEditDialogOpen(false);
                        setSelectedWorkspace(null);
                    }}
                    onSubmit={(data) => updateMutation.mutate({ id: selectedWorkspace.id, data })}
                    isLoading={updateMutation.isPending}
                />
            )}
        </div>
    );
}

function WorkspaceCard({ workspace, onEdit, onDelete, onView }: {
    workspace: WorkspaceListItem;
    onEdit: () => void;
    onDelete: () => void;
    onView: () => void;
}) {
    return (
        <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold">{workspace.name}</h3>
                        <p className="text-sm text-muted-foreground">/{workspace.slug}</p>
                    </div>
                </div>
                {workspace.is_active ? (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Active</span>
                ) : (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">Inactive</span>
                )}
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{workspace.member_count} members</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FolderKanban className="w-4 h-4" />
                    <span>{workspace.project_count} projects</span>
                </div>
            </div>

            <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={onView}>
                    View
                </Button>
                <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={onDelete}>
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </Card>
    );
}

function CreateWorkspaceDialog({ open, onClose, onSubmit, isLoading }: {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; slug: string; description?: string }) => void;
    isLoading: boolean;
}) {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, slug, description });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Workspace</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                            }}
                            placeholder="Engineering Division"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Slug</label>
                        <Input
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="engineering-division"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Description (Optional)</label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Engineering and development teams"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Workspace'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditWorkspaceDialog({ open, workspace, onClose, onSubmit, isLoading }: {
    open: boolean;
    workspace: WorkspaceListItem;
    onClose: () => void;
    onSubmit: (data: any) => void;
    isLoading: boolean;
}) {
    const [name, setName] = useState(workspace.name);
    const [slug, setSlug] = useState(workspace.slug);
    const [isActive, setIsActive] = useState(workspace.is_active);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, slug, is_active: isActive });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Workspace</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Slug</label>
                        <Input
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            id="is-active"
                        />
                        <label htmlFor="is-active" className="text-sm font-medium">Active</label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
