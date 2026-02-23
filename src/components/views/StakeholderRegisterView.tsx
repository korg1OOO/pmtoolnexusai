import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Users,
  Plus,
  Filter,
  Search,
  Mail,
  Phone,
  Building2,
  Star,
  MoreHorizontal,
  Grid3X3,
  List,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Pencil,
  Check,
  X,
  Share2,
  Loader2,
  Table as TableIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DynamicDataGrid, type DynamicColumnDef } from '@/components/ui/DynamicDataGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useStakeholders, useCreateStakeholder, useUpdateStakeholder, Stakeholder } from '@/hooks/useStakeholders';
import { useApprovals, useApproveApproval, useRejectApproval, useMarkApprovalDelegated } from '@/hooks/useApprovals';
import {
  useRACIAssignments,
  useUpsertRACIAssignment,
  pivotRACIData,
  RACIRole,
} from '@/hooks/useRACIAssignments';
import DelegationDialog from '@/components/governance/DelegationDialog';
import { ApprovalWorkflows } from '@/components/analytics/governance/ApprovalWorkflows';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';

const STANDARD_COLUMNS: DynamicColumnDef<Stakeholder>[] = [
  { key: 'name', label: 'Name', width: 200, type: 'text', sticky: true },
  { key: 'role', label: 'Role', width: 180, type: 'text' },
  { key: 'organization', label: 'Organization', width: 180, type: 'text' },
  { key: 'influence', label: 'Influence', width: 120, type: 'select', options: ['high', 'medium', 'low'] },
  { key: 'interest', label: 'Interest', width: 120, type: 'select', options: ['high', 'medium', 'low'] },
  { key: 'engagement', label: 'Engagement', width: 140, type: 'select', options: ['supportive', 'resistant', 'neutral'] },
];

// ─── RACI Badge ──────────────────────────────────────────────
const RACI_COLORS: Record<string, string> = {
  R: 'bg-blue-100 text-blue-700 border-blue-200',
  A: 'bg-red-100 text-red-700 border-red-200',
  C: 'bg-amber-100 text-amber-700 border-amber-200',
  I: 'bg-gray-100 text-gray-600 border-gray-200',
  'R/A': 'bg-purple-100 text-purple-700 border-purple-200',
};

function RACIBadge({ role }: { role?: string }) {
  if (!role) return <span className="text-muted-foreground text-xs">–</span>;
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-8 h-8 rounded font-bold text-xs border',
        RACI_COLORS[role] ?? 'bg-muted text-muted-foreground border-border',
      )}
    >
      {role}
    </span>
  );
}

// ─── RACI Editable Cell ───────────────────────────────────────
const RACI_OPTIONS: RACIRole[] = ['', 'R', 'A', 'C', 'I', 'R/A'];

function RACIEditCell({
  value,
  onChange,
}: {
  value: RACIRole;
  onChange: (role: RACIRole) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as RACIRole)}>
      <SelectTrigger className="h-8 w-20 text-xs">
        <SelectValue placeholder="–" />
      </SelectTrigger>
      <SelectContent>
        {RACI_OPTIONS.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt || '–'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function StakeholderRegisterView() {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const { user } = useAuth();

  const { data: stakeholders = [], isLoading: stakeholdersLoading } = useStakeholders(projectId);
  const { data: approvals = [], isLoading: approvalsLoading } = useApprovals(projectId);
  const { data: raciData = [], isLoading: raciLoading } = useRACIAssignments(projectId);
  const upsertRACI = useUpsertRACIAssignment();
  const approveApproval = useApproveApproval();
  const rejectApproval = useRejectApproval();
  const markDelegated = useMarkApprovalDelegated();

  // RBAC permission checks
  const { can } = usePermissions(projectId);

  const createStakeholder = useCreateStakeholder();
  const updateStakeholder = useUpdateStakeholder();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState<Partial<Stakeholder>>({
    name: '',
    role: '',
    organization: '',
    influence: 'low',
    interest: 'low',
    category: 'internal'
  });

  const handleCreateStakeholder = async () => {
    if (!projectId || !newStakeholder.name) return;
    try {
      await createStakeholder.mutateAsync({
        project_id: projectId,
        ...newStakeholder
      } as any);
      setIsCreateOpen(false);
      setNewStakeholder({ name: '', role: '', organization: '', influence: 'low', interest: 'low', category: 'internal' });
    } catch (e) { }
  };

  // Realtime subscription — invalidates stakeholders + approvals on any DB change
  useRealtimeTable({
    table: 'project_members',
    filter: projectId ? `project_id=eq.${projectId}` : undefined,
    queryKeys: [['stakeholders', projectId], ['approvals', projectId]],
    enabled: !!projectId,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'spreadsheet'>('grid');
  const [customColumns, setCustomColumns] = useState<DynamicColumnDef<Stakeholder>[]>([]);
  const [editingRACIActivity, setEditingRACIActivity] = useState<string | null>(null);
  const [newActivity, setNewActivity] = useState('');

  const handleCellSave = async (rowId: string, key: string, value: string) => {
    const isCustom = !STANDARD_COLUMNS.find(c => c.key === key);
    const item = stakeholders.find(i => i.id === rowId);
    if (!item) return;

    if (isCustom) {
      const cf = { ...(item.custom_fields ?? {}), [key]: value };
      await updateStakeholder.mutateAsync({ id: rowId, custom_fields: cf });
    } else {
      await updateStakeholder.mutateAsync({ id: rowId, [key]: value } as any);
    }
  };

  // Delegation dialog state
  const [delegationOpen, setDelegationOpen] = useState(false);
  const [delegationApprovalIds, setDelegationApprovalIds] = useState<string[]>([]);

  const filteredStakeholders = stakeholders.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.role?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (s.organization?.toLowerCase() || '').includes(searchQuery.toLowerCase()),
  );

  /* ── Power/Interest helpers ── */
  const getInfluenceInterestQuadrant = (influence: string, interest: string) => {
    if (influence === 'high' && interest === 'high') return 'Manage Closely';
    if (influence === 'high' && interest !== 'high') return 'Keep Satisfied';
    if (influence !== 'high' && interest === 'high') return 'Keep Informed';
    return 'Monitor';
  };

  const getQuadrantColor = (q: string) => {
    switch (q) {
      case 'Manage Closely': return 'bg-destructive/20 text-destructive';
      case 'Keep Satisfied': return 'bg-warning/20 text-warning';
      case 'Keep Informed': return 'bg-info/20 text-info';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  /* ── RACI pivot ── */
  const raciPivot = useMemo(() => pivotRACIData(raciData), [raciData]);

  // Unique stakeholders referenced in RACI (also include project stakeholders)
  const raciStakeholders = useMemo(() => {
    const idsInRaci = new Set(raciData.map((r) => r.stakeholder_id));
    return stakeholders.filter((s) => idsInRaci.has(s.id));
  }, [stakeholders, raciData]);

  const raciActivities = useMemo(() => {
    const acts = new Set(raciData.map((r) => r.activity));
    return Array.from(acts).sort();
  }, [raciData]);

  const handleRACIChange = async (
    stakeholderId: string,
    activity: string,
    role: RACIRole,
  ) => {
    if (!projectId) return;
    await upsertRACI.mutateAsync({
      project_id: projectId,
      stakeholder_id: stakeholderId,
      activity,
      raci_role: role,
    });
  };

  const handleAddActivity = async () => {
    const act = newActivity.trim();
    if (!act || !projectId) return;
    // Add a row for the first stakeholder so the activity appears in the table
    if (stakeholders.length > 0) {
      await upsertRACI.mutateAsync({
        project_id: projectId,
        stakeholder_id: stakeholders[0].id,
        activity: act,
        raci_role: '' as RACIRole,
      }).catch(() => { }); // empty role = shows activity row without role
    }
    setNewActivity('');
    toast.success('Activity added — assign roles for each stakeholder');
  };


  const openDelegationDialog = (approvalId: string) => {
    setDelegationApprovalIds([approvalId]);
    setDelegationOpen(true);
  };

  /* ── Loading ── */
  if (stakeholdersLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full overflow-auto">
        {/* Header */}
        <div className="p-6 border-b bg-card">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Stakeholder Register</h1>
                <p className="text-muted-foreground">Manage stakeholder engagement and communication</p>
              </div>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              {viewMode !== 'spreadsheet' && (
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stakeholder
                  </Button>
                </DialogTrigger>
              )}
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Stakeholder</DialogTitle>
                </DialogHeader>
                <div className="grid py-4 gap-4">
                  <div className="grid gap-2">
                    <Label>Name *</Label>
                    <Input
                      value={newStakeholder.name}
                      onChange={(e) => setNewStakeholder({ ...newStakeholder, name: e.target.value })}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Role</Label>
                      <Input
                        value={newStakeholder.role || ''}
                        onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })}
                        placeholder="Project Sponsor"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Organization</Label>
                      <Input
                        value={newStakeholder.organization || ''}
                        onChange={(e) => setNewStakeholder({ ...newStakeholder, organization: e.target.value })}
                        placeholder="Acme Corp"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Influence</Label>
                      <Select
                        value={newStakeholder.influence || 'low'}
                        onValueChange={(val) => setNewStakeholder({ ...newStakeholder, influence: val })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Interest</Label>
                      <Select
                        value={newStakeholder.interest || 'low'}
                        onValueChange={(val) => setNewStakeholder({ ...newStakeholder, interest: val })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateStakeholder} disabled={!newStakeholder.name || createStakeholder.isPending}>
                      {createStakeholder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex-1 p-6">
          <Tabs defaultValue="register" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="register">Register</TabsTrigger>
                <TabsTrigger value="matrix">Power/Interest Matrix</TabsTrigger>
                <TabsTrigger value="raci">RACI Matrix</TabsTrigger>
                <TabsTrigger value="approvals">
                  Approvals
                  {approvals.filter(a => a.status === 'pending').length > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                      {approvals.filter(a => a.status === 'pending').length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search stakeholders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={() => setViewMode('grid')}>
                  <Grid3X3 className={cn('h-4 w-4', viewMode === 'grid' && 'text-primary')} />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setViewMode('list')}>
                  <List className={cn('h-4 w-4', viewMode === 'list' && 'text-primary')} />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setViewMode('spreadsheet')}>
                  <TableIcon className={cn('h-4 w-4', viewMode === 'spreadsheet' && 'text-primary')} />
                </Button>
                {viewMode !== 'spreadsheet' && (
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                )}
              </div>
            </div>

            {/* ── Register Tab ── */}
            <TabsContent value="register">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStakeholders.map((stakeholder) => (
                    <StakeholderCard
                      key={stakeholder.id}
                      stakeholder={stakeholder}
                      getInfluenceInterestQuadrant={getInfluenceInterestQuadrant}
                      getQuadrantColor={getQuadrantColor}
                    />
                  ))}
                  {filteredStakeholders.length === 0 && (
                    <div className="col-span-3 py-12 text-center text-muted-foreground">
                      No stakeholders found
                    </div>
                  )}
                </div>
              ) : viewMode === 'spreadsheet' ? (
                <Card className="flex flex-col h-[600px]">
                  <div className="flex-1 bg-background border rounded-md shadow-sm overflow-hidden min-h-[500px]">
                    <DynamicDataGrid
                      data={filteredStakeholders}
                      baseColumns={STANDARD_COLUMNS}
                      customColumns={customColumns}
                      idExtractor={(item) => item.id}
                      customFieldExtractor={(item, key) => String(item.custom_fields?.[key] ?? '')}
                      onCellSave={handleCellSave}
                      onDeleteRows={() => { }}
                      onAddColumn={(col) => {
                        if (customColumns.find(c => c.key === col.key)) {
                          toast.error('Column already exists');
                          return;
                        }
                        setCustomColumns(prev => [...prev, col]);
                        toast.success(`Column "${col.label}" added`);
                      }}
                      onRemoveColumn={(key) => setCustomColumns(prev => prev.filter(c => c.key !== key))}
                      onAddRow={() => setIsCreateOpen(true)}
                      emptyStateMessage={filteredStakeholders.length === 0 ? 'No stakeholders found.' : 'No stakeholders match your filters.'}
                      containerStyles="h-full border-0"
                    />
                  </div>
                </Card>
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stakeholder</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Influence</TableHead>
                        <TableHead>Interest</TableHead>
                        <TableHead>Engagement</TableHead>
                        <TableHead>Strategy</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStakeholders.map((stakeholder) => (
                        <TableRow key={stakeholder.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {stakeholder.name.split(' ').map((n) => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{stakeholder.name}</span>
                                {stakeholder.is_key_stakeholder && (
                                  <Star className="h-3 w-3 text-warning fill-warning" />
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{stakeholder.role}</TableCell>
                          <TableCell>{stakeholder.organization}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                (stakeholder.influence || 'low') === 'high'
                                  ? 'destructive'
                                  : (stakeholder.influence || 'low') === 'medium'
                                    ? 'warning'
                                    : 'secondary'
                              }
                            >
                              {stakeholder.influence}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                (stakeholder.interest || 'low') === 'high'
                                  ? 'info'
                                  : (stakeholder.interest || 'low') === 'medium'
                                    ? 'warning'
                                    : 'secondary'
                              }
                            >
                              {stakeholder.interest}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                stakeholder.engagement === 'supportive'
                                  ? 'success'
                                  : stakeholder.engagement === 'resistant'
                                    ? 'destructive'
                                    : 'warning'
                              }
                            >
                              {stakeholder.engagement}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'text-xs px-2 py-1 rounded',
                                getQuadrantColor(
                                  getInfluenceInterestQuadrant(
                                    stakeholder.influence || 'low',
                                    stakeholder.interest || 'low',
                                  ),
                                ),
                              )}
                            >
                              {getInfluenceInterestQuadrant(
                                stakeholder.influence || 'low',
                                stakeholder.interest || 'low',
                              )}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>

            {/* ── Power/Interest Matrix Tab ── */}
            <TabsContent value="matrix">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Power/Interest Matrix</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto">
                    {[
                      { label: 'Keep Satisfied', influence: 'high', interest: 'not-high', direction: 'up', color: 'warning' },
                      { label: 'Manage Closely', influence: 'high', interest: 'high', direction: 'up', color: 'destructive' },
                      { label: 'Monitor', influence: 'not-high', interest: 'not-high', direction: 'down', color: 'muted' },
                      { label: 'Keep Informed', influence: 'not-high', interest: 'high', direction: 'right', color: 'info' },
                    ].map(({ label, influence, interest, direction, color }) => (
                      <div
                        key={label}
                        className={cn(
                          'p-4 rounded-lg border',
                          color === 'warning' && 'bg-warning/10 border-warning/30',
                          color === 'destructive' && 'bg-destructive/10 border-destructive/30',
                          color === 'info' && 'bg-info/10 border-info/30',
                          color === 'muted' && 'bg-muted/50 border',
                        )}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          {direction === 'up' && <ArrowUp className={`h-4 w-4 text-${color}`} />}
                          {direction === 'down' && <ArrowDown className="h-4 w-4 text-muted-foreground" />}
                          {direction === 'right' && <ArrowRight className={`h-4 w-4 text-${color}`} />}
                          <span className={cn('font-medium', color !== 'muted' && `text-${color}`)}>
                            {label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          {influence === 'high' ? 'High' : 'Low'} Influence,{' '}
                          {interest === 'high' ? 'High' : 'Low'} Interest
                        </p>
                        <div className="space-y-2">
                          {filteredStakeholders
                            .filter((s) => {
                              const inf = influence === 'high' ? s.influence === 'high' : s.influence !== 'high';
                              const int_ = interest === 'high' ? s.interest === 'high' : s.interest !== 'high';
                              return inf && int_;
                            })
                            .map((s) => (
                              <div key={s.id} className="flex items-center gap-2 p-2 rounded bg-background">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {s.name.split(' ').map((n) => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{s.name}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── RACI Tab ── */}
            <TabsContent value="raci">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">RACI Matrix</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        R=Responsible · A=Accountable · C=Consulted · I=Informed
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditingRACIActivity(editingRACIActivity ? null : '__editing__')
                      }
                    >
                      {editingRACIActivity ? (
                        <>
                          <Check className="h-4 w-4 mr-2" /> Done
                        </>
                      ) : (
                        <>
                          <Pencil className="h-4 w-4 mr-2" /> Edit RACI
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {raciLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[220px]">Activity</TableHead>
                              {raciStakeholders.map((s) => (
                                <TableHead key={s.id} className="text-center min-w-[100px]">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex flex-col items-center gap-1 cursor-default">
                                        <Avatar className="h-6 w-6">
                                          <AvatarFallback className="text-[10px]">
                                            {s.name.split(' ').map((n) => n[0]).join('')}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs truncate max-w-[90px]">{s.name.split(' ')[0]}</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="font-medium">{s.name}</p>
                                      <p className="text-xs text-muted-foreground">{s.role}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {raciActivities.map((activity) => (
                              <TableRow key={activity}>
                                <TableCell className="font-medium">{activity}</TableCell>
                                {raciStakeholders.map((s) => {
                                  const role = (raciPivot[activity]?.[s.id] ?? '') as RACIRole;
                                  return (
                                    <TableCell key={s.id} className="text-center">
                                      {editingRACIActivity ? (
                                        <RACIEditCell
                                          value={role}
                                          onChange={(newRole) =>
                                            handleRACIChange(s.id, activity, newRole)
                                          }
                                        />
                                      ) : (
                                        <RACIBadge role={role} />
                                      )}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}

                            {/* Add Activity Row */}
                            {editingRACIActivity && (
                              <TableRow>
                                <TableCell colSpan={raciStakeholders.length + 1}>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={newActivity}
                                      onChange={(e) => setNewActivity(e.target.value)}
                                      placeholder="New activity name…"
                                      className="h-8 text-sm"
                                      onKeyDown={(e) => e.key === 'Enter' && handleAddActivity()}
                                    />
                                    <Button size="sm" onClick={handleAddActivity}>
                                      <Plus className="h-3 w-3 mr-1" /> Add
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {raciActivities.length === 0 && !editingRACIActivity && (
                        <div className="py-12 text-center text-muted-foreground">
                          <p className="text-sm">No RACI assignments yet.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => setEditingRACIActivity('__editing__')}
                          >
                            <Pencil className="h-4 w-4 mr-2" /> Start Editing
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Approvals Tab ── */}
            <TabsContent value="approvals">
              {approvalsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <ApprovalWorkflows
                    approvals={approvals}
                    currentUserId={user?.id}
                    onApprove={(id) => approveApproval.mutate(id)}
                    onReject={(id) => rejectApproval.mutate({ approvalId: id })}
                    onAdminOverride={(id) => openDelegationDialog(id)}
                    loading={approveApproval.isPending || rejectApproval.isPending}
                  />
                  {approvals.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">
                      <Share2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No approvals for this project</p>
                    </div>
                  )}
                </>
              )}

              {/* Delegation Dialog */}
              <DelegationDialog
                open={delegationOpen}
                onOpenChange={setDelegationOpen}
                approvalIds={delegationApprovalIds}
                delegatorId={user?.id ?? ''}
                onSuccess={() => {
                  if (delegationApprovalIds.length > 0) {
                    markDelegated.mutate(delegationApprovalIds[0]);
                  }
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── Stakeholder Card ─────────────────────────────────────────
function StakeholderCard({
  stakeholder,
  getInfluenceInterestQuadrant,
  getQuadrantColor,
}: {
  stakeholder: Stakeholder;
  getInfluenceInterestQuadrant: (inf: string, int: string) => string;
  getQuadrantColor: (q: string) => string;
}) {
  const quadrant = getInfluenceInterestQuadrant(
    stakeholder.influence || 'low',
    stakeholder.interest || 'low',
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/20 text-primary">
                  {stakeholder.name.split(' ').map((n) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{stakeholder.name}</h3>
                  {stakeholder.is_key_stakeholder && (
                    <Star className="h-4 w-4 text-warning fill-warning" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{stakeholder.role}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="iconXs">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Mail className="h-4 w-4 mr-2" /> Send Email
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {stakeholder.organization && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <Building2 className="h-3 w-3" />
              {stakeholder.organization}
            </div>
          )}

          <div className="flex flex-wrap gap-1 mb-3">
            <Badge
              variant={
                stakeholder.category === 'internal'
                  ? 'secondary'
                  : stakeholder.category === 'partner'
                    ? 'info'
                    : 'outline'
              }
            >
              {stakeholder.category}
            </Badge>
            {stakeholder.engagement && (
              <Badge
                variant={
                  stakeholder.engagement === 'supportive'
                    ? 'success'
                    : stakeholder.engagement === 'resistant'
                      ? 'destructive'
                      : 'warning'
                }
              >
                {stakeholder.engagement}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Influence:</span>
              <Badge
                variant={
                  (stakeholder.influence || 'low') === 'high'
                    ? 'destructive'
                    : (stakeholder.influence || 'low') === 'medium'
                      ? 'warning'
                      : 'secondary'
                }
              >
                {stakeholder.influence || 'low'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Interest:</span>
              <Badge
                variant={
                  (stakeholder.interest || 'low') === 'high'
                    ? 'info'
                    : (stakeholder.interest || 'low') === 'medium'
                      ? 'warning'
                      : 'secondary'
                }
              >
                {stakeholder.interest || 'low'}
              </Badge>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t">
            <span className={cn('text-xs px-2 py-1 rounded', getQuadrantColor(quadrant))}>
              {quadrant}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}



