import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, Plus, Search, Mail, Phone, Briefcase, Shield, MoreVertical, Edit, Trash2, Ban, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getUsers, createUser, updateUser, deleteUser, updateUserStatus, User } from '@/services/userService';
import { toast } from 'sonner';

export function UserManagement() {
    const [searchQuery, setSearchQuery] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const queryClient = useQueryClient();

    // TODO: Get tenantId from auth context
    const tenantId = 'default-tenant';

    const { data: users, isLoading } = useQuery({
        queryKey: ['users', tenantId],
        queryFn: () => getUsers(tenantId),
        enabled: !!tenantId
    });

    const createMutation = useMutation({
        mutationFn: createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setCreateDialogOpen(false);
            toast.success('User created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create user');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<User> }) => updateUser(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setEditingUser(null);
            toast.success('User updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update user');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete user');
        }
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: User['status'] }) => updateUserStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User status updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update status');
        }
    });

    const filteredUsers = users?.filter(u =>
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.job_title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-700';
            case 'manager': return 'bg-blue-100 text-blue-700';
            case 'member': return 'bg-green-100 text-green-700';
            case 'viewer': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'inactive': return 'bg-gray-100 text-gray-700';
            case 'suspended': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-muted-foreground">Manage users and their access</p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search users by name, email, or job title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Users</p>
                            <p className="text-2xl font-bold">{users?.length || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Active</p>
                            <p className="text-2xl font-bold">
                                {users?.filter(u => u.status === 'active').length || 0}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-purple-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Admins</p>
                            <p className="text-2xl font-bold">
                                {users?.filter(u => u.role === 'admin').length || 0}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Ban className="w-8 h-8 text-red-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Suspended</p>
                            <p className="text-2xl font-bold">
                                {users?.filter(u => u.status === 'suspended').length || 0}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Users Table */}
            {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading users...</div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b">
                                <tr className="text-left text-sm text-muted-foreground">
                                    <th className="p-4 font-medium">User</th>
                                    <th className="p-4 font-medium">Role</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium">Department</th>
                                    <th className="p-4 font-medium">Contact</th>
                                    <th className="p-4 font-medium">Last Login</th>
                                    <th className="p-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-b hover:bg-muted/50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.full_name}</p>
                                                    <p className="text-sm text-muted-foreground">{user.job_title || 'No title'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge className={getRoleBadgeColor(user.role)}>
                                                {user.role}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <Badge className={getStatusBadgeColor(user.status)}>
                                                {user.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {user.department_id || 'Unassigned'}
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail className="w-3 h-3" />
                                                    {user.email}
                                                </div>
                                                {user.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Phone className="w-3 h-3" />
                                                        {user.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setEditingUser(user)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const newStatus = user.status === 'active' ? 'suspended' : 'active';
                                                        statusMutation.mutate({ id: user.id, status: newStatus });
                                                    }}
                                                >
                                                    {user.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this user?')) {
                                                            deleteMutation.mutate(user.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                <Card className="p-12 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No users found</h3>
                    <p className="text-muted-foreground mb-4">
                        {searchQuery ? 'Try adjusting your search' : 'Add your first user to get started'}
                    </p>
                    {!searchQuery && (
                        <Button onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add User
                        </Button>
                    )}
                </Card>
            )}

            {/* Create/Edit Dialog */}
            <UserDialog
                open={createDialogOpen || !!editingUser}
                onClose={() => {
                    setCreateDialogOpen(false);
                    setEditingUser(null);
                }}
                user={editingUser}
                tenantId={tenantId}
                onSubmit={(data) => {
                    if (editingUser) {
                        updateMutation.mutate({ id: editingUser.id, updates: data });
                    } else {
                        createMutation.mutate({ ...data, tenant_id: tenantId, status: 'active' } as any);
                    }
                }}
            />
        </div>
    );
}

function UserDialog({ open, onClose, user, tenantId, onSubmit }: {
    open: boolean;
    onClose: () => void;
    user: User | null;
    tenantId: string;
    onSubmit: (data: Partial<User>) => void;
}) {
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        role: user?.role || 'member',
        job_title: user?.job_title || '',
        phone: user?.phone || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{user ? 'Edit User' : 'Create New User'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Full Name</label>
                        <Input
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Role</label>
                        <select
                            className="w-full border rounded-md p-2"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                            aria-label="Select user role"
                        >
                            <option value="viewer">Viewer</option>
                            <option value="member">Member</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Job Title</label>
                        <Input
                            value={formData.job_title}
                            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                            placeholder="Software Engineer"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Phone</label>
                        <Input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 (555) 123-4567"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">{user ? 'Update' : 'Create'} User</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
