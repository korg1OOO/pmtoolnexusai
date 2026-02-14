/**
 * Role Management Dialog
 * Allows Project Managers to create custom roles and modify standard roles
 */

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Crown,
    Briefcase,
    Star,
    UserCheck,
    Users,
    Plus,
    Edit2,
    Trash2,
    RotateCcw,
    Save,
    X,
} from 'lucide-react';
import {
    useProjectRoles,
    useCreateCustomRole,
    useUpdateProjectRole,
    useDeleteCustomRole,
    useResetStandardRole,
} from '@/hooks/useProjectRoles';
import { CustomRole, CustomRoleInput } from '@/services/projectRolesService';

interface RoleManagementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
    Crown,
    Briefcase,
    Star,
    UserCheck,
    Users,
};

export function RoleManagementDialog({ open, onOpenChange, projectId }: RoleManagementDialogProps) {
    const { data: roles = [], isLoading } = useProjectRoles(projectId);
    const createRole = useCreateCustomRole(projectId);
    const updateRole = useUpdateProjectRole(projectId);
    const deleteRole = useDeleteCustomRole(projectId);
    const resetRole = useResetStandardRole(projectId);

    const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<Partial<CustomRoleInput>>({
        role_name: '',
        role_description: '',
        color: '#3b82f6',
        icon: 'UserCheck',
        permissions: [],
    });

    const handleEdit = (role: CustomRole) => {
        setEditingRole(role);
        setFormData({
            role_name: role.role_name,
            role_description: role.role_description || '',
            color: role.color,
            icon: role.icon,
            permissions: role.permissions,
        });
    };

    const handleCreate = () => {
        setIsCreating(true);
        setEditingRole(null);
        setFormData({
            role_id: '',
            role_name: '',
            role_description: '',
            color: '#3b82f6',
            icon: 'UserCheck',
            permissions: [],
        });
    };

    const handleSave = async () => {
        if (isCreating) {
            if (!formData.role_id || !formData.role_name) return;
            await createRole.mutateAsync({
                role_id: formData.role_id,
                role_name: formData.role_name,
                role_description: formData.role_description,
                color: formData.color,
                icon: formData.icon,
                permissions: formData.permissions,
            });
            setIsCreating(false);
        } else if (editingRole) {
            await updateRole.mutateAsync({
                roleId: editingRole.role_id,
                updates: {
                    role_name: formData.role_name,
                    role_description: formData.role_description,
                    color: formData.color,
                    icon: formData.icon,
                    permissions: formData.permissions,
                },
            });
            setEditingRole(null);
        }
        setFormData({});
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingRole(null);
        setFormData({});
    };

    const handleDelete = async (roleId: string) => {
        if (confirm('Are you sure you want to delete this custom role?')) {
            await deleteRole.mutateAsync(roleId);
        }
    };

    const handleReset = async (roleId: string) => {
        if (confirm('Reset this role to default settings?')) {
            await resetRole.mutateAsync(roleId);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Manage Project Roles</DialogTitle>
                    <DialogDescription>
                        Create custom roles or modify standard roles for this project only
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-6">
                    {/* Roles List */}
                    <ScrollArea className="flex-1 h-[500px] pr-4">
                        <div className="space-y-2">
                            {isLoading ? (
                                <div className="text-center py-8 text-muted-foreground">Loading roles...</div>
                            ) : (
                                roles.map((role) => {
                                    const Icon = ICON_MAP[role.icon] || UserCheck;
                                    const isEditing = editingRole?.id === role.id;

                                    return (
                                        <div
                                            key={role.id}
                                            className={`p-4 border rounded-lg ${isEditing ? 'border-primary bg-primary/5' : 'border-border'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div
                                                        className="p-2 rounded-lg"
                                                        style={{ backgroundColor: `${role.color}20` }}
                                                    >
                                                        <Icon className="h-5 w-5" style={{ color: role.color }} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-semibold">{role.role_name}</h4>
                                                            {role.is_custom && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    Custom
                                                                </Badge>
                                                            )}
                                                            {role.based_on_role && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    Modified
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {role.role_description}
                                                        </p>
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {role.permissions.slice(0, 3).map((perm) => (
                                                                <Badge key={perm} variant="secondary" className="text-xs">
                                                                    {perm}
                                                                </Badge>
                                                            ))}
                                                            {role.permissions.length > 3 && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    +{role.permissions.length - 3} more
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(role)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    {role.is_custom && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(role.role_id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    )}
                                                    {role.based_on_role && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleReset(role.role_id)}
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleCreate}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Custom Role
                            </Button>
                        </div>
                    </ScrollArea>

                    {/* Edit Form */}
                    {(editingRole || isCreating) && (
                        <div className="w-96 border-l pl-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-4">
                                        {isCreating ? 'Create New Role' : 'Edit Role'}
                                    </h3>
                                </div>

                                {isCreating && (
                                    <div className="space-y-2">
                                        <Label htmlFor="role_id">Role ID</Label>
                                        <Input
                                            id="role_id"
                                            placeholder="e.g., architect"
                                            value={formData.role_id || ''}
                                            onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Unique identifier (lowercase, no spaces)
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="role_name">Role Name</Label>
                                    <Input
                                        id="role_name"
                                        placeholder="e.g., Solutions Architect"
                                        value={formData.role_name || ''}
                                        onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role_description">Description</Label>
                                    <Textarea
                                        id="role_description"
                                        placeholder="Describe the role responsibilities..."
                                        value={formData.role_description || ''}
                                        onChange={(e) =>
                                            setFormData({ ...formData, role_description: e.target.value })
                                        }
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="color">Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="color"
                                            type="color"
                                            value={formData.color || '#3b82f6'}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="w-20"
                                        />
                                        <Input
                                            value={formData.color || '#3b82f6'}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            placeholder="#3b82f6"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button onClick={handleSave} className="flex-1">
                                        <Save className="h-4 w-4 mr-2" />
                                        Save
                                    </Button>
                                    <Button variant="outline" onClick={handleCancel}>
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
