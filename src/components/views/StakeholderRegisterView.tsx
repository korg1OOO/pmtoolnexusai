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
  TableIcon,
  Loader2
} from 'lucide-react';
import { DataRegisterPage } from '@/components/ui/DataRegisterPage';
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
  const [activeTab, setActiveTab] = useState('register');
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

  const toolbarFilters = (
    <TabsList className="h-8 bg-background border">
      <TabsTrigger value="register" className="h-6 px-2.5 text-xs">Register</TabsTrigger>
      <TabsTrigger value="matrix" className="h-6 px-2.5 text-xs">Power/Interest Matrix</TabsTrigger>
      <TabsTrigger value="raci" className="h-6 px-2.5 text-xs">RACI Matrix</TabsTrigger>
      <TabsTrigger value="approvals" className="h-6 px-2.5 text-xs">
        Approvals
        {approvals.filter(a => a.status === 'pending').length > 0 && (
          <Badge variant="destructive" className="ml-1.5 h-4 w-4 p-0 flex items-center justify-center text-[9px] rounded-full">
            {approvals.filter(a => a.status === 'pending').length}
          </Badge>
        )}
      </TabsTrigger>
    </TabsList>
  );

  const listContent = (
    <>
      <TabsContent value="register" className="m-0 border-0 p-0">
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
            <div className="col-span-3 py-12 text-center text-muted-foreground border rounded-lg border-dashed">
              No stakeholders found
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="matrix" className="m-0 border-0 p-0">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Influence / Interest Matrix</CardTitle>
            <p className="text-sm text-muted-foreground">Stakeholders plotted by influence (power) and interest level</p>
          </CardHeader>
          <CardContent>
            <div className="relative w-full" style={{ height: 480 }}>
              {/* Quadrant backgrounds */}
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 rounded-lg overflow-hidden border">
                <div className="bg-blue-500/5 border-r border-b flex items-start justify-start p-3">
                  <span className="text-[11px] font-semibold text-blue-600/70 uppercase tracking-wide">Keep Satisfied</span>
                </div>
                <div className="bg-destructive/5 border-b flex items-start justify-end p-3">
                  <span className="text-[11px] font-semibold text-destructive/70 uppercase tracking-wide">Manage Closely</span>
                </div>
                <div className="bg-muted/30 border-r flex items-end justify-start p-3">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Monitor</span>
                </div>
                <div className="bg-amber-500/5 flex items-end justify-end p-3">
                  <span className="text-[11px] font-semibold text-amber-600/70 uppercase tracking-wide">Keep Informed</span>
                </div>
              </div>

              {/* Axis dividers */}
              <div className="absolute inset-0 flex items-center pointer-events-none">
                <div className="w-full h-px bg-border" />
              </div>
              <div className="absolute inset-0 flex justify-center pointer-events-none">
                <div className="h-full w-px bg-border" />
              </div>

              {/* Axis labels */}
              <div className="absolute -left-8 inset-y-0 flex items-center">
                <span className="text-xs text-muted-foreground -rotate-90 whitespace-nowrap font-medium">↑ Influence</span>
              </div>
              <div className="absolute bottom-[-28px] inset-x-0 flex justify-center">
                <span className="text-xs text-muted-foreground font-medium">Interest →</span>
              </div>

              {/* Stakeholder dots */}
              {filteredStakeholders.map((s) => {
                // Map influence/interest to x/y positions (0-100%)
                const xMap: Record<string, number> = { low: 20, medium: 50, high: 80 };
                const yMap: Record<string, number> = { high: 15, medium: 50, low: 82 }; // y is inverted (top = high)
                const x = xMap[s.interest || 'low'] ?? 50;
                const y = yMap[s.influence || 'low'] ?? 50;
                const quadrantColor =
                  s.influence === 'high' && s.interest === 'high' ? 'bg-destructive text-white' :
                  s.influence === 'high' ? 'bg-blue-600 text-white' :
                  s.interest === 'high' ? 'bg-amber-500 text-white' :
                  'bg-muted-foreground text-white';
                const initials = s.name.split(' ').map((n) => n[0]).join('').slice(0, 2);
                return (
                  <TooltipProvider key={s.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={cn(
                            'absolute w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shadow-md border-2 border-white transition-transform hover:scale-110 hover:z-20 cursor-pointer z-10',
                            quadrantColor
                          )}
                          style={{ left: `calc(${x}% - 18px)`, top: `calc(${y}% - 18px)` }}
                        >
                          {initials}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px]">
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.role}</p>
                        <div className="flex gap-3 mt-1 text-xs">
                          <span>Influence: <strong className="capitalize">{s.influence}</strong></span>
                          <span>Interest: <strong className="capitalize">{s.interest}</strong></span>
                        </div>
                        <p className="text-xs mt-1 font-medium text-primary">{getInfluenceInterestQuadrant(s.influence || 'low', s.interest || 'low')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-10 text-xs">
              {[
                { color: 'bg-destructive', label: 'Manage Closely (High / High)' },
                { color: 'bg-blue-600', label: 'Keep Satisfied (High Influence)' },
                { color: 'bg-amber-500', label: 'Keep Informed (High Interest)' },
                { color: 'bg-muted-foreground', label: 'Monitor (Low / Low)' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={cn('w-3 h-3 rounded-full', color)} />
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="raci" className="m-0 border-0 p-0">
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
                          <div className="flex items-center gap-2 max-w-sm">
                            <Input
                              placeholder="New RACI activity..."
                              value={newActivity}
                              onChange={(e) => setNewActivity(e.target.value)}
                              className="h-8 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddActivity();
                              }}
                            />
                            <Button size="sm" className="h-8" onClick={handleAddActivity}>
                              Add
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="approvals" className="m-0 border-0 p-0">
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
      </TabsContent>
    </>
  );

  return (
    <TooltipProvider>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full overflow-hidden">
        <DataRegisterPage
          title="Stakeholder Register"
          description="Manage stakeholder engagement and communication"
          icon={Users}
          iconBgClass="bg-primary/20"
          iconColorClass="text-primary"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          toolbarFilters={toolbarFilters}
          onAddRow={() => setIsCreateOpen(true)}
          addLabel="Add Stakeholder"
          pdfFilename="stakeholders"
          data={filteredStakeholders}
          baseColumns={STANDARD_COLUMNS}
          customColumns={customColumns}
          idExtractor={(item) => item.id}
          customFieldExtractor={(item, key) => String(item.custom_fields?.[key] ?? '')}
          onCellSave={handleCellSave}
          onAddColumn={(col) => {
            if (customColumns.find(c => c.key === col.key)) {
              toast.error('Column already exists');
              return;
            }
            setCustomColumns(prev => [...prev, col]);
            toast.success(`Column "${col.label}" added`);
          }}
          onRemoveColumn={(key) => setCustomColumns(prev => prev.filter(c => c.key !== key))}
          onDeleteRows={() => { }}
          emptyStateMessage={filteredStakeholders.length === 0 ? 'No stakeholders found.' : 'No stakeholders match filters.'}
          listContent={listContent}
        />

        {/* Create Dialog handled manually since DataRegisterPage triggers `onAddRow` */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
      </Tabs>
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



