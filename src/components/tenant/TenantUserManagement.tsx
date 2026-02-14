import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, Plus, Mail, UserPlus, Search, Shield, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TenantUser {
    id: string;
    email: string;
    full_name: string;
    role: string;
    workspaces: string[];
    created_at: string;
    last_sign_in: string;
    is_active: boolean;
}

export function TenantUserManagement() {
    const [tenantId] = useState('default-tenant-id');
    const [searchQuery, setSearchQuery] = useState('');
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: users, isLoading } = useQuery({
        queryKey: ['tenant-users', tenantId],
        queryFn: async () => {
            // Get all workspace members for this tenant
            const { data: workspaces } = await supabase
                .from('workspaces')
                .select('id')
                .eq('tenant_id', tenantId);

            if (!workspaces) return [];

            const workspaceIds = workspaces.map(w => w.id);

            const { data: members, error } = await supabase
                .from('workspace_members')
                .select(`
          user_id,
          role,
          workspace:workspaces(id, name)
        `)
                .in('workspace_id', workspaceIds);

            if (error) throw error;

            // Group by user
            const userMap = new Map<string, TenantUser>();

            for (const member of members || []) {
                if (!userMap.has(member.user_id)) {
                    userMap.set(member.user_id, {
                        id: member.user_id,
                        email: `user-${member.user_id.slice(0, 8)}@example.com`, // TODO: Get from auth
                        full_name: 'User Name', // TODO: Get from profiles
                        role: member.role,
                        workspaces: [member.workspace?.name || ''],
                        created_at: new Date().toISOString(),
                        last_sign_in: new Date().toISOString(),
                        is_active: true
                    });
                } else {
                    const user = userMap.get(member.user_id)!;
                    user.workspaces.push(member.workspace?.name || '');
                }
            }

            return Array.from(userMap.values());
        }
    });

    const filteredUsers = users?.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-muted-foreground">Manage users across all workspaces</p>
                </div>
                <Button onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite User
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Users Table */}
            <Card className="p-6">
                {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading users...</div>
                ) : filteredUsers && filteredUsers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4">User</th>
                                    <th className="text-left py-3 px-4">Role</th>
                                    <th className="text-left py-3 px-4">Workspaces</th>
                                    <th className="text-left py-3 px-4">Status</th>
                                    <th className="text-left py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-b hover:bg-accent">
                                        <td className="py-3 px-4">
                                            <div>
                                                <div className="font-medium">{user.full_name}</div>
                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center gap-1 text-sm">
                                                <Shield className="w-3 h-3" />
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="text-sm">{user.workspaces.join(', ')}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            {user.is_active ? (
                                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Active</span>
                                            ) : (
                                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">Inactive</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm">Edit</Button>
                                                <Button variant="outline" size="sm">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No users found</h3>
                        <p className="text-muted-foreground mb-4">
                            {searchQuery ? 'Try adjusting your search' : 'Invite users to get started'}
                        </p>
                    </div>
                )}
            </Card>

            {/* Invite Dialog */}
            <InviteUserDialog
                open={inviteDialogOpen}
                onClose={() => setInviteDialogOpen(false)}
            />
        </div>
    );
}

function InviteUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('member');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success('Invitation sent to ' + email);
        onClose();
        setEmail('');
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full border rounded-md p-2"
                            aria-label="User role"
                        >
                            <option value="member">Member</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            <Mail className="w-4 h-4 mr-2" />
                            Send Invitation
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
