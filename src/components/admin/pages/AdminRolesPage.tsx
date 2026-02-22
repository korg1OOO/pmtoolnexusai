import React, { useState, useMemo } from 'react';
import {
    usePlatformRoles,
    usePlatformFeatures,
    useAllRolePermissions,
    useCreatePlatformRole,
    useDeletePlatformRole,
    useToggleRolePermission,
    PlatformRole,
    PlatformFeature,
} from '@/hooks/usePlatformRoles';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2, ShieldCheck, Lock, Building2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Seed Data for platform_features ─────────────────────────────────────────

const SEED_FEATURES: PlatformFeature[] = [
    // Project Management
    { key: 'projects.create', name: 'Create Projects', description: 'Create new projects', category: 'CORE', sort_order: 1 },
    { key: 'projects.edit', name: 'Edit Projects', description: 'Edit project settings', category: 'CORE', sort_order: 2 },
    { key: 'projects.delete', name: 'Delete Projects', description: 'Delete projects', category: 'CORE', sort_order: 3 },
    { key: 'projects.view', name: 'View Projects', description: 'View project list', category: 'CORE', sort_order: 4 },
    // Team
    { key: 'team.manage', name: 'Manage Team', description: 'Add/remove team members', category: 'CORE', sort_order: 10 },
    { key: 'team.invite', name: 'Invite Users', description: 'Send team invitations', category: 'CORE', sort_order: 11 },
    // Financials
    { key: 'financials.view', name: 'View Financials', description: 'Read cost & budget data', category: 'ADVANCED', sort_order: 20 },
    { key: 'financials.edit', name: 'Edit Financials', description: 'Modify budgets and costs', category: 'ADVANCED', sort_order: 21 },
    { key: 'financials.approve', name: 'Approve Budgets', description: 'Approve budget changes', category: 'ADVANCED', sort_order: 22 },
    // Risk
    { key: 'risks.view', name: 'View Risks', description: 'View risk register', category: 'CORE', sort_order: 30 },
    { key: 'risks.edit', name: 'Manage Risks', description: 'Create and edit risks', category: 'CORE', sort_order: 31 },
    // Reporting
    { key: 'reports.view', name: 'View Reports', description: 'Access all reports', category: 'CORE', sort_order: 40 },
    { key: 'reports.export', name: 'Export Reports', description: 'Export PDF / Excel', category: 'ADVANCED', sort_order: 41 },
    { key: 'reports.ai', name: 'AI Reports', description: 'AI-generated insights', category: 'ADVANCED', sort_order: 42 },
    // Governance
    { key: 'governance.charter', name: 'Project Charter', description: 'Create/edit charters', category: 'ADVANCED', sort_order: 50 },
    { key: 'governance.steerco', name: 'Steerco Presentations', description: 'Manage presentations', category: 'ADVANCED', sort_order: 51 },
    { key: 'governance.traceability', name: 'Traceability Matrix', description: 'Requirements traceability', category: 'ADVANCED', sort_order: 52 },
    // Admin
    { key: 'admin.roles', name: 'Manage Roles', description: 'Create and edit roles', category: 'EXPERIMENTAL', sort_order: 60 },
    { key: 'admin.users', name: 'Manage Users', description: 'User administration', category: 'EXPERIMENTAL', sort_order: 61 },
    { key: 'admin.audit', name: 'View Audit Logs', description: 'System audit log access', category: 'EXPERIMENTAL', sort_order: 62 },
    { key: 'admin.settings', name: 'System Settings', description: 'Platform configuration', category: 'EXPERIMENTAL', sort_order: 63 },
];

const CATEGORY_ORDER = ['CORE', 'ADVANCED', 'EXPERIMENTAL'];
const CATEGORY_COLORS: Record<string, string> = {
    CORE: 'bg-primary/10 text-primary border-primary/20',
    ADVANCED: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    EXPERIMENTAL: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

// Default permissions for system roles
const SYSTEM_ROLE_DEFAULTS: Record<string, string[]> = {
    'Super Admin': SEED_FEATURES.map(f => f.key),
    'Project Manager': ['projects.create', 'projects.edit', 'projects.view', 'team.manage', 'team.invite', 'risks.view', 'risks.edit', 'reports.view', 'reports.export', 'governance.charter', 'governance.traceability', 'financials.view'],
    'Team Member': ['projects.view', 'risks.view', 'reports.view'],
    'Viewer': ['projects.view'],
    'Finance Analyst': ['projects.view', 'financials.view', 'financials.edit', 'financials.approve', 'reports.view', 'reports.export'],
    'Risk Officer': ['projects.view', 'risks.view', 'risks.edit', 'reports.view', 'governance.traceability'],
};

export function AdminRolesPage() {
    const [activeScope, setActiveScope] = useState<'platform' | 'tenant'>('platform');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleDesc, setNewRoleDesc] = useState('');
    const [isSeeding, setIsSeeding] = useState(false);

    const { data: roles, isLoading: rolesLoading } = usePlatformRoles();
    const { data: features, isLoading: featuresLoading } = usePlatformFeatures();
    const createRole = useCreatePlatformRole();
    const deleteRole = useDeletePlatformRole();
    const togglePermission = useToggleRolePermission();

    const filteredRoles = useMemo(
        () => (roles ?? []).filter(r => r.scope === activeScope),
        [roles, activeScope]
    );

    const roleIds = useMemo(() => filteredRoles.map(r => r.id), [filteredRoles]);
    const { data: permissions } = useAllRolePermissions(roleIds);

    // Build a permission lookup: { roleId: { featureKey: bool } }
    const permMatrix = useMemo(() => {
        const matrix: Record<string, Record<string, boolean>> = {};
        roleIds.forEach(id => { matrix[id] = {}; });
        (permissions ?? []).forEach(p => {
            if (!matrix[p.role_id]) matrix[p.role_id] = {};
            matrix[p.role_id][p.feature_key] = p.is_enabled;
        });
        return matrix;
    }, [permissions, roleIds]);

    // Group features by category
    const groupedFeatures = useMemo(() => {
        const groups: Record<string, PlatformFeature[]> = {};
        (features ?? []).forEach(f => {
            if (!groups[f.category]) groups[f.category] = [];
            groups[f.category].push(f);
        });
        return groups;
    }, [features]);

    const handleSeedDefaults = async () => {
        setIsSeeding(true);
        try {
            // Create system roles then seed permissions
            for (const role of filteredRoles) {
                const enabledKeys = SYSTEM_ROLE_DEFAULTS[role.name] ?? [];
                for (const f of (features ?? [])) {
                    await togglePermission.mutateAsync({
                        roleId: role.id,
                        featureKey: f.key,
                        isEnabled: enabledKeys.includes(f.key),
                    });
                }
            }
            toast.success('Default permissions applied');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSeeding(false);
        }
    };

    const isLoading = rolesLoading || featuresLoading;

    const usedFeatures = features && features.length > 0 ? features : SEED_FEATURES;

    return (
        <TooltipProvider>
            <div className="flex flex-col h-full bg-background">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                            Platform Roles Management
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Configure which features each role can access. Toggle cells to grant or revoke permissions.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleSeedDefaults} disabled={isSeeding || filteredRoles.length === 0}>
                            {isSeeding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Apply Role Defaults
                        </Button>
                        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Role
                        </Button>
                    </div>
                </div>

                {/* Scope Tabs */}
                <div className="px-6 pt-4 shrink-0">
                    <Tabs value={activeScope} onValueChange={(v) => setActiveScope(v as 'platform' | 'tenant')}>
                        <TabsList>
                            <TabsTrigger value="platform" className="gap-2">
                                <Globe className="h-4 w-4" />
                                Platform Roles
                            </TabsTrigger>
                            <TabsTrigger value="tenant" className="gap-2">
                                <Building2 className="h-4 w-4" />
                                Tenant Roles
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Matrix */}
                {isLoading ? (
                    <div className="flex items-center justify-center flex-1">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredRoles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-center p-12">
                        <div className="p-4 rounded-full bg-muted mb-4">
                            <ShieldCheck className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No {activeScope} roles yet</h3>
                        <p className="text-muted-foreground mb-4">Create a role to start configuring permissions.</p>
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" /> Create First Role
                        </Button>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto p-6">
                        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-muted/40">
                                        {/* Feature column header */}
                                        <th className="sticky left-0 z-20 bg-muted/80 backdrop-blur px-4 py-3 text-left font-semibold min-w-[240px] border-b border-r w-60">
                                            Feature / Permission
                                        </th>
                                        {filteredRoles.map(role => (
                                            <th key={role.id} className="px-3 py-3 text-center border-b border-r min-w-[140px] font-medium">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <span className="font-semibold text-sm truncate max-w-[120px]" title={role.name}>{role.name}</span>
                                                    <div className="flex items-center gap-1">
                                                        {role.is_system_role ? (
                                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
                                                                <Lock className="h-2.5 w-2.5" /> System
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                                                Custom
                                                            </Badge>
                                                        )}
                                                        {!role.is_system_role && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={() => deleteRole.mutate(role.id)}
                                                                        className="text-destructive hover:text-destructive/80 transition-colors p-0.5 rounded"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Delete role</TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {CATEGORY_ORDER.map(category => {
                                        const catFeatures = (groupedFeatures[category] ?? []).length > 0
                                            ? groupedFeatures[category]
                                            : SEED_FEATURES.filter(f => f.category === category);
                                        if (catFeatures.length === 0) return null;
                                        return (
                                            <React.Fragment key={category}>
                                                {/* Category header row */}
                                                <tr>
                                                    <td
                                                        colSpan={filteredRoles.length + 1}
                                                        className="sticky left-0 bg-muted/60 px-4 py-2 font-semibold text-xs uppercase tracking-wider border-b"
                                                    >
                                                        <span className={cn('px-2 py-0.5 rounded-full text-[11px] border', CATEGORY_COLORS[category])}>
                                                            {category}
                                                        </span>
                                                    </td>
                                                </tr>
                                                {catFeatures.map((feature, fi) => (
                                                    <tr
                                                        key={feature.key}
                                                        className={cn(
                                                            'hover:bg-muted/20 transition-colors',
                                                            fi % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                                                        )}
                                                    >
                                                        {/* Feature name cell (sticky) */}
                                                        <td className="sticky left-0 z-10 bg-inherit px-4 py-2.5 border-b border-r font-medium text-sm">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span className="cursor-default">{feature.name}</span>
                                                                </TooltipTrigger>
                                                                {feature.description && (
                                                                    <TooltipContent>{feature.description}</TooltipContent>
                                                                )}
                                                            </Tooltip>
                                                        </td>
                                                        {/* Toggle cells */}
                                                        {filteredRoles.map(role => {
                                                            const isEnabled = permMatrix[role.id]?.[feature.key] ?? false;
                                                            return (
                                                                <td key={role.id} className="text-center border-b border-r px-3 py-2.5">
                                                                    <Switch
                                                                        checked={isEnabled}
                                                                        onCheckedChange={(val) =>
                                                                            togglePermission.mutate({
                                                                                roleId: role.id,
                                                                                featureKey: feature.key,
                                                                                isEnabled: val,
                                                                            })
                                                                        }
                                                                        disabled={togglePermission.isPending}
                                                                        className="scale-90"
                                                                    />
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Create Role Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create New Role</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="role-name">Role Name *</Label>
                                <Input
                                    id="role-name"
                                    placeholder="e.g. Operations Lead"
                                    value={newRoleName}
                                    onChange={e => setNewRoleName(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => { if (e.key === 'Enter' && newRoleName.trim()) handleCreateRole(); }}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="role-desc">Description (optional)</Label>
                                <Textarea
                                    id="role-desc"
                                    placeholder="What does this role do?"
                                    value={newRoleDesc}
                                    onChange={e => setNewRoleDesc(e.target.value)}
                                    rows={2}
                                />
                            </div>
                            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                                This creates a <strong>{activeScope}</strong>-level role.
                                {activeScope === 'tenant' && ' Tenant admins can only create tenant-scoped roles.'}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setNewRoleName(''); setNewRoleDesc(''); }}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateRole}
                                disabled={!newRoleName.trim() || createRole.isPending}
                            >
                                {createRole.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Create Role
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );

    function handleCreateRole() {
        if (!newRoleName.trim()) return;
        createRole.mutate(
            { name: newRoleName.trim(), description: newRoleDesc.trim() || undefined },
            {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    setNewRoleName('');
                    setNewRoleDesc('');
                },
            }
        );
    }
}
