/**
 * Enhanced Admin Users Page
 * Replaces old PlatformAdminView users tab
 */

import React, { useState, useMemo } from 'react';
import { useAdminUsers } from '@/hooks/useAdmin';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, Filter, Download, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { supabase as _supabase } from '@/integrations/supabase/client';

const supabase = _supabase as any;

const roleColors: Record<string, string> = {
    admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    manager: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    member: 'bg-green-500/20 text-green-400 border-green-500/30',
    viewer: 'bg-muted text-muted-foreground border-border',
};

const statusColors: Record<string, string> = {
    active: 'bg-success/20 text-success border-success/30',
    inactive: 'bg-muted text-muted-foreground border-border',
    suspended: 'bg-destructive/20 text-destructive border-destructive/30',
};

function exportUsersToCSV(users: any[]) {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Last Active'];
    const rows = users.map(u => [
        u.full_name ?? 'Unknown',
        u.email ?? '',
        u.role ?? 'member',
        u.status ?? 'active',
        u.last_active_at ? new Date(u.last_active_at).toLocaleString() : 'Never',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export function AdminUsers() {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [filterOpen, setFilterOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const { data: users, isLoading } = useAdminUsers();

    const filteredUsers = useMemo(() =>
        users?.filter(user => {
            const matchesSearch =
                user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'all' || (user as any).role === roleFilter;
            const matchesStatus = statusFilter === 'all' || (user as any).status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        }),
        [users, searchQuery, roleFilter, statusFilter]
    );

    const activeFiltersCount = (roleFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        setIsInviting(true);
        try {
            const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail.trim());
            if (error) throw error;
            toast.success(`Invitation sent to ${inviteEmail}`);
            setInviteOpen(false);
            setInviteEmail('');
        } catch (err: any) {
            toast.error('Failed to invite user: ' + (err?.message ?? 'Unknown error'));
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">All Users</h1>
                    <p className="text-muted-foreground mt-1">Manage all registered users</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => filteredUsers && exportUsersToCSV(filteredUsers)}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button size="sm" onClick={() => setInviteOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="relative">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                            {activeFiltersCount > 0 && (
                                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 space-y-4 p-4">
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {activeFiltersCount > 0 && (
                            <Button variant="ghost" size="sm" className="w-full" onClick={() => { setRoleFilter('all'); setStatusFilter('all'); }}>
                                <X className="h-3 w-3 mr-2" />
                                Clear filters
                            </Button>
                        )}
                    </PopoverContent>
                </Popover>
            </div>

            <Card>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Active</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers?.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatar_url || ''} />
                                                <AvatarFallback className="text-xs">
                                                    {(user.full_name || user.email || '?').substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium text-sm">{user.full_name || 'Unknown'}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn('capitalize', roleColors[(user as any).role || 'member'])}
                                        >
                                            {(user as any).role || 'member'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn('capitalize', statusColors[(user as any).status || 'active'])}
                                        >
                                            {(user as any).status || 'active'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {(user as any).last_active_at
                                            ? new Date((user as any).last_active_at).toLocaleString()
                                            : 'Never'}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredUsers?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* Invite User Dialog */}
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Invite User</DialogTitle>
                        <DialogDescription>
                            Send an email invitation to add a new user to the platform.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="invite-email">Email Address</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                placeholder="user@example.com"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                        <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
                            {isInviting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Send Invite
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* User Detail Side Sheet */}
            <Sheet open={!!selectedUser} onOpenChange={v => { if (!v) setSelectedUser(null); }}>
                <SheetContent className="w-[400px]">
                    <SheetHeader>
                        <SheetTitle>User Details</SheetTitle>
                        <SheetDescription>Profile and account information</SheetDescription>
                    </SheetHeader>
                    {selectedUser && (
                        <div className="mt-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={selectedUser.avatar_url || ''} />
                                    <AvatarFallback className="text-lg">
                                        {(selectedUser.full_name || selectedUser.email || '?').substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-lg font-bold">{selectedUser.full_name || 'Unknown'}</div>
                                    <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Role</div>
                                    <Badge variant="outline" className={cn('capitalize', roleColors[(selectedUser as any).role || 'member'])}>
                                        {(selectedUser as any).role || 'member'}
                                    </Badge>
                                </div>
                                <div>
                                    <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Status</div>
                                    <Badge variant="outline" className={cn('capitalize', statusColors[(selectedUser as any).status || 'active'])}>
                                        {(selectedUser as any).status || 'active'}
                                    </Badge>
                                </div>
                                <div className="col-span-2">
                                    <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">User ID</div>
                                    <div className="font-mono text-xs text-muted-foreground">{selectedUser.id}</div>
                                </div>
                                <div className="col-span-2">
                                    <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Last Active</div>
                                    <div>{selectedUser.last_active_at ? new Date(selectedUser.last_active_at).toLocaleString() : 'Never'}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
