import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Shield, Plus, Search, Users, Calendar, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getUsers, getUserRoles, assignUserRole, revokeUserRole, User, UserRole } from '@/services/userService';
import { toast } from 'sonner';

export function UserRoleManagement() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    // TODO: Get tenantId from auth context
    const tenantId = 'default-tenant';

    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['users', tenantId],
        queryFn: () => getUsers(tenantId),
        enabled: !!tenantId
    });

    const { data: userRoles, isLoading: rolesLoading } = useQuery({
        queryKey: ['user-roles', selectedUser?.id],
        queryFn: () => getUserRoles(selectedUser!.id),
        enabled: !!selectedUser
    });

    const assignMutation = useMutation({
        mutationFn: assignUserRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-roles'] });
            setAssignDialogOpen(false);
            toast.success('Role assigned successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to assign role');
        }
    });

    const revokeMutation = useMutation({
        mutationFn: revokeUserRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-roles'] });
            toast.success('Role revoked successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to revoke role');
        }
    });

    const filteredUsers = users?.filter(u =>
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeRoles = userRoles?.filter(r => r.is_active) || [];
    const expiredRoles = userRoles?.filter(r => !r.is_active) || [];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">User Role Management</h1>
                    <p className="text-muted-foreground">Manage user roles and permissions</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Users List */}
                <Card className="lg:col-span-1 p-6">
                    <h2 className="text-lg font-semibold mb-4">Users</h2>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {usersLoading ? (
                            <p className="text-center text-muted-foreground py-4">Loading...</p>
                        ) : filteredUsers && filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedUser?.id === user.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Users className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{user.full_name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {user.role}
                                        </Badge>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-4">No users found</p>
                        )}
                    </div>
                </Card>

                {/* Roles Details */}
                <Card className="lg:col-span-2 p-6">
                    {selectedUser ? (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-semibold">{selectedUser.full_name}'s Roles</h2>
                                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                </div>
                                <Button onClick={() => setAssignDialogOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Assign Role
                                </Button>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <Card className="p-4">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Active Roles</p>
                                            <p className="text-xl font-bold">{activeRoles.length}</p>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="p-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Primary Role</p>
                                            <p className="text-lg font-semibold">{selectedUser.role}</p>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="p-4">
                                    <div className="flex items-center gap-2">
                                        <XCircle className="w-5 h-5 text-red-600" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Revoked</p>
                                            <p className="text-xl font-bold">{expiredRoles.length}</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Active Roles */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Active Roles</h3>
                                {rolesLoading ? (
                                    <p className="text-center text-muted-foreground py-4">Loading roles...</p>
                                ) : activeRoles.length > 0 ? (
                                    <div className="space-y-2">
                                        {activeRoles.map((role) => (
                                            <div key={role.id} className="p-4 border rounded-lg">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Shield className="w-4 h-4 text-primary" />
                                                            <h4 className="font-medium">{role.role_name}</h4>
                                                            <Badge variant="outline" className="bg-green-100 text-green-700">
                                                                Active
                                                            </Badge>
                                                        </div>
                                                        <div className="space-y-1 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-3 h-3" />
                                                                Assigned: {new Date(role.assigned_at).toLocaleDateString()}
                                                            </div>
                                                            {role.expires_at && (
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="w-3 h-3" />
                                                                    Expires: {new Date(role.expires_at).toLocaleDateString()}
                                                                </div>
                                                            )}
                                                            {role.permissions && role.permissions.length > 0 && (
                                                                <div className="mt-2">
                                                                    <p className="text-xs font-medium mb-1">Permissions:</p>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {role.permissions.map((perm, idx) => (
                                                                            <Badge key={idx} variant="outline" className="text-xs">
                                                                                {perm}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to revoke this role?')) {
                                                                revokeMutation.mutate(role.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Card className="p-8 text-center">
                                        <Shield className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-muted-foreground">No active roles assigned</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-4"
                                            onClick={() => setAssignDialogOpen(true)}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Assign First Role
                                        </Button>
                                    </Card>
                                )}

                                {/* Revoked Roles */}
                                {expiredRoles.length > 0 && (
                                    <>
                                        <h3 className="font-semibold mt-6">Revoked Roles</h3>
                                        <div className="space-y-2">
                                            {expiredRoles.map((role) => (
                                                <div key={role.id} className="p-4 border rounded-lg bg-muted/30">
                                                    <div className="flex items-center gap-2">
                                                        <Shield className="w-4 h-4 text-muted-foreground" />
                                                        <h4 className="font-medium text-muted-foreground">{role.role_name}</h4>
                                                        <Badge variant="outline" className="bg-red-100 text-red-700">
                                                            Revoked
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Users className="w-16 h-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Select a User</h3>
                            <p className="text-muted-foreground text-center">
                                Choose a user from the list to view and manage their roles
                            </p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Assign Role Dialog */}
            <AssignRoleDialog
                open={assignDialogOpen}
                onClose={() => setAssignDialogOpen(false)}
                user={selectedUser}
                onSubmit={(data) => {
                    if (selectedUser) {
                        assignMutation.mutate({
                            user_id: selectedUser.id,
                            ...data,
                            is_active: true,
                            assigned_at: new Date().toISOString(),
                        } as any);
                    }
                }}
            />
        </div>
    );
}

function AssignRoleDialog({ open, onClose, user, onSubmit }: {
    open: boolean;
    onClose: () => void;
    user: User | null;
    onSubmit: (data: Partial<UserRole>) => void;
}) {
    const [formData, setFormData] = useState({
        role_name: '',
        permissions: [] as string[],
        expires_at: '',
    });

    const [permissionInput, setPermissionInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            expires_at: formData.expires_at || undefined,
        });
        setFormData({ role_name: '', permissions: [], expires_at: '' });
    };

    const addPermission = () => {
        if (permissionInput && !formData.permissions.includes(permissionInput)) {
            setFormData({
                ...formData,
                permissions: [...formData.permissions, permissionInput]
            });
            setPermissionInput('');
        }
    };

    const removePermission = (perm: string) => {
        setFormData({
            ...formData,
            permissions: formData.permissions.filter(p => p !== perm)
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign Role to {user?.full_name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Role Name</label>
                        <Input
                            value={formData.role_name}
                            onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                            placeholder="e.g., Project Manager, Team Lead"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Permissions</label>
                        <div className="flex gap-2">
                            <Input
                                value={permissionInput}
                                onChange={(e) => setPermissionInput(e.target.value)}
                                placeholder="e.g., read:projects, write:tasks"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addPermission();
                                    }
                                }}
                            />
                            <Button type="button" onClick={addPermission}>Add</Button>
                        </div>
                        {formData.permissions.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.permissions.map((perm) => (
                                    <Badge key={perm} variant="outline" className="cursor-pointer" onClick={() => removePermission(perm)}>
                                        {perm} <XCircle className="w-3 h-3 ml-1" />
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Expiration Date (Optional)</label>
                        <Input
                            type="date"
                            value={formData.expires_at}
                            onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">Assign Role</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
