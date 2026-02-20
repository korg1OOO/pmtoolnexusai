/**
 * Admin Management Page
 * Manage admin roles, permissions, and activity logging
 */

import React, { useState, useMemo } from 'react';
import {
    useAdminRoles,
    useAdminUsers,
    useAdminActivityLog,
    useGrantAdminAccess,
    useRevokeAdminAccess,
    useUpdateAdminRole_User,
    useCreateAdminRole,
} from '@/hooks/useAdminManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Shield, UserPlus, Users, Activity, Key, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function AdminManagement() {
    const [searchQuery, setSearchQuery] = useState('');
    const [grantDialogOpen, setGrantDialogOpen] = useState(false);
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);

    const { data: roles, isLoading: rolesLoading } = useAdminRoles();
    const { data: adminUsers, isLoading: usersLoading } = useAdminUsers();
    const { data: activityLog, isLoading: activityLoading } = useAdminActivityLog({ limit: 50 });

    const grantAccess = useGrantAdminAccess();
    const revokeAccess = useRevokeAdminAccess();
    const updateRole = useUpdateAdminRole_User();
    const createRole = useCreateAdminRole();

    // Grant Admin Form State
    const [grantForm, setGrantForm] = useState({
        userId: '',
        roleId: '',
        notes: '',
    });

    // Create Role Form State
    const [roleForm, setRoleForm] = useState({
        name: '',
        description: '',
        permissions: {} as Record<string, string[]>,
    });

    const handleGrantAccess = async () => {
        if (!grantForm.userId || !grantForm.roleId) return;
        await grantAccess.mutateAsync({ user_id: grantForm.userId, role_id: grantForm.roleId, notes: grantForm.notes });
        setGrantDialogOpen(false);
        setGrantForm({ userId: '', roleId: '', notes: '' });
    };

    const handleRevokeAccess = async (userId: string) => {
        if (confirm('Are you sure you want to revoke admin access?')) {
            await revokeAccess.mutateAsync(userId);
        }
    };

    const handleUpdateRole = async (userId: string, roleId: string) => {
        await updateRole.mutateAsync({ userId, roleId });
    };

    // Compute how many unique resource types are defined across all role permission sets
    const uniqueResourceTypes = useMemo(() => {
        if (!roles) return 0;
        const keys = new Set<string>();
        roles.forEach(role => {
            Object.keys(role.permissions ?? {}).forEach(k => keys.add(k));
        });
        return keys.size;
    }, [roles]);

    const filteredAdmins = adminUsers?.filter((admin) =>
        admin.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Admin Management</h1>
                    <p className="text-muted-foreground">
                        Manage admin roles, permissions, and activity
                    </p>
                </div>
                <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Grant Admin Access
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Grant Admin Access</DialogTitle>
                            <DialogDescription>
                                Assign admin role to a user
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="userId">User ID</Label>
                                <Input
                                    id="userId"
                                    placeholder="User UUID"
                                    value={grantForm.userId}
                                    onChange={(e) => setGrantForm({ ...grantForm, userId: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={grantForm.roleId}
                                    onValueChange={(value) => setGrantForm({ ...grantForm, roleId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles?.map((role) => (
                                            <SelectItem key={role.id} value={role.id}>
                                                {role.name} - {role.description}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Input
                                    id="notes"
                                    placeholder="Reason for granting access"
                                    value={grantForm.notes}
                                    onChange={(e) => setGrantForm({ ...grantForm, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setGrantDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleGrantAccess} disabled={grantAccess.isPending}>
                                {grantAccess.isPending ? 'Granting...' : 'Grant Access'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{adminUsers?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Active admin users</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Roles</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{roles?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {roles?.filter(r => r.is_system_role).length} system roles
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activityLog?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Last 50 actions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Permissions</CardTitle>
                        <Key className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{uniqueResourceTypes}</div>
                        <p className="text-xs text-muted-foreground">Resource types</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="admins">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="admins">Admin Users</TabsTrigger>
                    <TabsTrigger value="roles">Roles</TabsTrigger>
                    <TabsTrigger value="activity">Activity Log</TabsTrigger>
                </TabsList>

                {/* Admin Users Tab */}
                <TabsContent value="admins" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Admin Users</CardTitle>
                            <CardDescription>Manage users with admin access</CardDescription>
                            <div className="mt-4">
                                <Input
                                    placeholder="Search admins..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {usersLoading ? (
                                <div className="text-center py-8 text-muted-foreground">Loading...</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Granted</TableHead>
                                            <TableHead>Granted By</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAdmins?.map((admin) => (
                                            <TableRow key={admin.user_id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{admin.full_name || 'Unknown'}</div>
                                                        <div className="text-sm text-muted-foreground">{admin.email}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={admin.role_id}
                                                        onValueChange={(value) => handleUpdateRole(admin.user_id, value)}
                                                    >
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {roles?.map((role) => (
                                                                <SelectItem key={role.id} value={role.id}>
                                                                    {role.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    {formatDistanceToNow(new Date(admin.granted_at), { addSuffix: true })}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-muted-foreground">
                                                        {admin.granted_by?.substring(0, 8)}...
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRevokeAccess(admin.user_id)}
                                                    >
                                                        Revoke
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Roles Tab */}
                <TabsContent value="roles" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Admin Roles</CardTitle>
                            <CardDescription>Manage role permissions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {rolesLoading ? (
                                <div className="text-center py-8 text-muted-foreground">Loading...</div>
                            ) : (
                                <div className="space-y-4">
                                    {roles?.map((role) => (
                                        <Card key={role.id}>
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <CardTitle className="text-lg flex items-center gap-2">
                                                            {role.name}
                                                            {role.is_system_role && (
                                                                <Badge variant="secondary">System</Badge>
                                                            )}
                                                        </CardTitle>
                                                        <CardDescription>{role.description}</CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {Object.entries(role.permissions).map(([resource, actions]) => (
                                                        <div key={resource} className="flex items-center gap-2">
                                                            <Badge variant="outline" className="capitalize">
                                                                {resource}
                                                            </Badge>
                                                            <span className="text-sm text-muted-foreground">
                                                                {(actions as string[]).join(', ')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Activity Log Tab */}
                <TabsContent value="activity" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Log</CardTitle>
                            <CardDescription>Recent admin actions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {activityLoading ? (
                                <div className="text-center py-8 text-muted-foreground">Loading...</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Admin</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Resource</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activityLog?.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell>
                                                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                                </TableCell>
                                                <TableCell className="text-sm">{log.admin_email}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{log.action}</Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {log.resource_type} {log.resource_id?.substring(0, 8)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
