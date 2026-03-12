import React, { useState, useMemo } from 'react';
import {
    usePlatformRoles,
    usePlatformUserRoles,
    useAssignPlatformRole,
    useRevokePlatformRole,
    useEffectivePermissions,
} from '@/hooks/usePlatformRoles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Plus, X, Users, Shield, CheckCircle2, XCircle, Search, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminUsers } from '@/hooks/useAdmin';

// ─── Effective Permissions Popover ────────────────────────────────────────────

function EffectivePermissionsPopover({ userId }: { userId: string }) {
    const { data: perms, isLoading } = useEffectivePermissions(userId);
    const entries = Object.entries(perms ?? {});
    const enabled = entries.filter(([, v]) => v);
    const disabled = entries.filter(([, v]) => !v);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="h-3.5 w-3.5" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" side="left">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Effective Permissions</p>
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : entries.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No permissions assigned.</p>
                ) : (
                    <div className="space-y-1 max-h-52 overflow-auto">
                        {enabled.map(([key]) => (
                            <div key={key} className="flex items-center gap-1.5 text-xs text-success">
                                <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                                <span>{key}</span>
                            </div>
                        ))}
                        {disabled.map(([key]) => (
                            <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <XCircle className="h-3 w-3 flex-shrink-0" />
                                <span>{key}</span>
                            </div>
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdminUserRolesPage() {
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('');

    const { data: users, isLoading: usersLoading } = useAdminUsers();
    const { data: roles, isLoading: rolesLoading } = usePlatformRoles();
    const { data: userRoles, isLoading: userRolesLoading } = usePlatformUserRoles();
    const assignRole = useAssignPlatformRole();
    const revokeRole = useRevokePlatformRole();

    // Group userRoles by user_id for easy lookup
    const userRoleMap = useMemo(() => {
        const map: Record<string, typeof userRoles> = {};
        (userRoles ?? []).forEach((ur: any) => {
            if (!map[ur.user_id]) map[ur.user_id] = [];
            map[ur.user_id]!.push(ur);
        });
        return map;
    }, [userRoles]);

    // Build user list from admin services data or userRoles unique users
    const userList = useMemo(() => {
        const seen = new Set<string>();
        const list: Array<{ id: string; email: string; name: string }> = [];

        // From users hook (if available)
        if (Array.isArray(users)) {
            (users as any[]).forEach((u: any) => {
                if (u.id && !seen.has(u.id)) {
                    seen.add(u.id);
                    list.push({ id: u.id, email: u.email ?? '', name: u.name ?? u.email ?? u.id });
                }
            });
        }

        // Fallback: build from userRoles data
        (userRoles ?? []).forEach((ur: any) => {
            if (!seen.has(ur.user_id)) {
                seen.add(ur.user_id);
                list.push({ id: ur.user_id, email: ur.user_email ?? ur.user_id, name: ur.user_name ?? ur.user_id });
            }
        });

        return list;
    }, [users, userRoles]);

    const filteredUsers = useMemo(() => {
        return userList.filter(u => {
            const matchSearch = !search || u.email.toLowerCase().includes(search.toLowerCase()) || u.name.toLowerCase().includes(search.toLowerCase());
            const matchRole = filterRole === 'all' || (userRoleMap[u.id] ?? []).some((ur: any) => ur.role_id === filterRole);
            return matchSearch && matchRole;
        });
    }, [userList, search, filterRole, userRoleMap]);

    const isLoading = usersLoading || rolesLoading || userRolesLoading;

    const handleAssign = async () => {
        if (!selectedUser || !selectedRole) return;
        await assignRole.mutateAsync({ userId: selectedUser, roleId: selectedRole });
        setIsAssignOpen(false);
        setSelectedUser(null);
        setSelectedRole('');
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col h-full bg-background">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6 text-primary" />
                            User Role Assignment
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Assign platform roles to users. Hover the <Info className="inline h-3 w-3" /> icon to see effective permissions.
                        </p>
                    </div>
                    <Button size="sm" onClick={() => setIsAssignOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Assign Role
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 px-6 py-3 border-b shrink-0">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            className="pl-9 h-8 text-sm"
                            placeholder="Search users by email or name..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger className="w-44 h-8 text-sm">
                            <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            {(roles ?? []).map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">{filteredUsers.length} users</span>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex items-center justify-center flex-1">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto px-6 py-4">
                        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Assigned Roles</TableHead>
                                        <TableHead className="w-36">Last Assigned</TableHead>
                                        <TableHead className="w-24 text-center">Permissions</TableHead>
                                        <TableHead className="w-24 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                                {search ? 'No users match your search.' : 'No users found.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map((user, idx) => {
                                            const assignedRoles = userRoleMap[user.id] ?? [];
                                            const lastAssigned = assignedRoles.reduce((latest: string, ur: any) => {
                                                return !latest || ur.assigned_at > latest ? ur.assigned_at : latest;
                                            }, '');

                                            return (
                                                <TableRow key={user.id} className="hover:bg-muted/10">
                                                    <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2.5">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                                    {(user.name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium text-sm">{user.name}</p>
                                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {(assignedRoles as any[]).map((ur: any) => (
                                                                <Badge
                                                                    key={ur.id}
                                                                    variant="secondary"
                                                                    className="gap-1 pl-2 pr-1 py-0.5 text-xs font-normal group"
                                                                >
                                                                    <Shield className="h-2.5 w-2.5 text-primary" />
                                                                    {ur.role?.name ?? 'Unknown'}
                                                                    {ur.role?.scope === 'tenant' && (
                                                                        <span className="text-[9px] text-muted-foreground/70">(tenant)</span>
                                                                    )}
                                                                    <button
                                                                        onClick={() =>
                                                                            revokeRole.mutate({
                                                                                assignmentId: ur.id,
                                                                                roleId: ur.role_id,
                                                                                userId: user.id,
                                                                            })
                                                                        }
                                                                        className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                </Badge>
                                                            ))}
                                                            {assignedRoles.length === 0 && (
                                                                <span className="text-xs text-muted-foreground italic">No roles assigned</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {lastAssigned
                                                            ? new Date(lastAssigned).toLocaleDateString()
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <EffectivePermissionsPopover userId={user.id} />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 px-2 text-xs"
                                                                    onClick={() => {
                                                                        setSelectedUser(user.id);
                                                                        setIsAssignOpen(true);
                                                                    }}
                                                                >
                                                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                                                    Assign
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Assign a role to this user</TooltipContent>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* Assign Role Dialog */}
                <Dialog open={isAssignOpen} onOpenChange={v => { setIsAssignOpen(v); if (!v) { setSelectedUser(null); setSelectedRole(''); } }}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Assign Role</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">User</label>
                                <Select value={selectedUser ?? ''} onValueChange={setSelectedUser}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a user..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {userList.map(u => (
                                            <SelectItem key={u.id} value={u.id}>
                                                <span>{u.name}</span>
                                                <span className="text-muted-foreground text-xs ml-2">{u.email}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Role</label>
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(roles ?? []).map(r => (
                                            <SelectItem key={r.id} value={r.id}>
                                                <div className="flex items-center gap-2">
                                                    <Shield className="h-3.5 w-3.5 text-primary" />
                                                    <span>{r.name}</span>
                                                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                                                        {r.scope}
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                                Tenant roles override platform roles for the selected tenant's context only.
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setIsAssignOpen(false); setSelectedUser(null); setSelectedRole(''); }}>
                                Cancel
                            </Button>
                            <Button onClick={handleAssign} disabled={!selectedUser || !selectedRole || assignRole.isPending}>
                                {assignRole.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Assign Role
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
