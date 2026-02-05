import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Settings,
  Users,
  Shield,
  GitBranch,
  Tag,
  Plug,
  Layers,
  Search,
  Plus,
  MoreHorizontal,
  Check,
  Target,
  Kanban,
  LayoutGrid,
  ChevronRight,
  Save,
  RefreshCw,
  User,
  Copy,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePortfolios, useUpdatePortfolio } from '@/hooks/usePortfolios';
import { usePrograms, useUpdateProgram } from '@/hooks/usePrograms';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectContext, Methodology, ModuleVisibility } from '@/contexts/ProjectContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
  avatar?: string;
}

const methodologyInfo: Record<Methodology, { name: string; description: string; icon: React.ElementType }> = {
  waterfall: {
    name: 'Waterfall',
    description: 'Sequential phases with detailed upfront planning. Best for projects with fixed scope and requirements.',
    icon: LayoutGrid,
  },
  scrum: {
    name: 'Scrum',
    description: 'Iterative sprints with cross-functional teams. Best for complex products with evolving requirements.',
    icon: Layers,
  },
  kanban: {
    name: 'Kanban',
    description: 'Continuous flow with WIP limits. Best for maintenance, support, and steady-state work.',
    icon: Kanban,
  },
  hybrid: {
    name: 'Hybrid',
    description: 'Combines traditional and agile practices. Best for organizations transitioning or with diverse needs.',
    icon: GitBranch,
  },
};

const moduleGroups: { category: string; modules: { key: keyof ModuleVisibility; label: string }[] }[] = [
  {
    category: 'Planning',
    modules: [
      { key: 'projectPlan', label: 'Project Plan' },
      { key: 'childPlans', label: 'Child Plans' },
      { key: 'gantt', label: 'Gantt Chart' },
      { key: 'childGantt', label: 'Child Gantt' },
      { key: 'milestones', label: 'Milestones' },
      { key: 'programTimeline', label: 'Program Timeline' },
    ],
  },
  {
    category: 'Execution',
    modules: [
      { key: 'sprints', label: 'Sprint Board' },
      { key: 'backlog', label: 'Backlog' },
      { key: 'actions', label: 'Actions' },
      { key: 'issues', label: 'Issues' },
    ],
  },
  {
    category: 'Intelligence',
    modules: [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'executiveDashboard', label: 'Executive Dashboard' },
      { key: 'strategic', label: 'Strategic Dashboard' },
      { key: 'traceability', label: 'Traceability Matrix' },
      { key: 'communications', label: 'Communications' },
    ],
  },
  {
    category: 'Governance',
    modules: [
      { key: 'meetings', label: 'Meetings' },
      { key: 'risks', label: 'Risks' },
      { key: 'decisions', label: 'Decisions' },
    ],
  },
  {
    category: 'Resources',
    modules: [
      { key: 'resources', label: 'Resources' },
      { key: 'financials', label: 'Financials' },
    ],
  },
  {
    category: 'Documentation',
    modules: [
      { key: 'portfolio', label: 'Portfolio' },
      { key: 'notes', label: 'Notes' },
      { key: 'reports', label: 'Reports' },
      { key: 'presentations', label: 'Presentations' },
    ],
  },
];

const roleColors: Record<string, string> = {
  owner: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  admin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  manager: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  member: 'bg-green-500/20 text-green-400 border-green-500/30',
  viewer: 'bg-muted text-muted-foreground border-border',
};

export function ProjectAdminView() {
  const [activeTab, setActiveTab] = useState('settings');
  const { settings, updateMethodology, updateModuleVisibility, updateSettings, getDefaultModules } = useProjectContext();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const { data: members, isLoading: isLoadingTeam } = useTeamMembers(settings.id);


  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  const copyId = () => {
    navigator.clipboard.writeText(currentUserId);
    toast.success('User ID copied to clipboard');
  };

  const handleMethodologyChange = (methodology: Methodology) => {
    updateMethodology(methodology);
  };

  const handleModuleToggle = (module: keyof ModuleVisibility) => {
    updateModuleVisibility(module, !settings.modules[module]);
  };

  const resetToMethodologyDefaults = () => {
    const defaults = getDefaultModules(settings.methodology);
    Object.entries(defaults).forEach(([key, value]) => {
      updateModuleVisibility(key as keyof ModuleVisibility, value);
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-card">
        <div>
          <h1 className="text-2xl font-bold">Project Administration</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure project settings, team, and methodology
          </p>
        </div>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Shield className="h-4 w-4" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="methodology" className="gap-2">
              <Layers className="h-4 w-4" />
              Methodology
            </TabsTrigger>
            <TabsTrigger value="workflows" className="gap-2">
              <GitBranch className="h-4 w-4" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tag className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Plug className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Assignments
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>Basic project information and configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      value={settings.name}
                      onChange={(e) => updateSettings({ name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectCode">Project Code</Label>
                    <Input
                      id="projectCode"
                      value={settings.code}
                      onChange={(e) => updateSettings({ code: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your project..."
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select defaultValue="active">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default View</Label>
                    <Select
                      value={settings.defaultView}
                      onValueChange={(value) => updateSettings({ defaultView: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dashboard">Dashboard</SelectItem>
                        <SelectItem value="executive-dashboard">Executive Dashboard</SelectItem>
                        <SelectItem value="gantt">Gantt Chart</SelectItem>
                        <SelectItem value="sprints">Sprint Board</SelectItem>
                        <SelectItem value="project-plan">Project Plan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search team members..." className="pl-9" />
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingTeam ? (
                    <TableRow><TableCell colSpan={3} className="text-center p-4">Loading team...</TableCell></TableRow>
                  ) : (members?.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {(member.full_name || 'U').split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{member.full_name || 'Unknown User'}</div>
                            <div className="text-xs text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('capitalize', roleColors[member.role] || roleColors.viewer)}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="iconSm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )))}
                  {!isLoadingTeam && (!members || members.length === 0) && (
                    <TableRow><TableCell colSpan={3} className="text-center p-4">No team members found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Permission Matrix</CardTitle>
                <CardDescription>Define what each role can do in this project</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permission</TableHead>
                      <TableHead className="text-center">Owner</TableHead>
                      <TableHead className="text-center">Admin</TableHead>
                      <TableHead className="text-center">Manager</TableHead>
                      <TableHead className="text-center">Member</TableHead>
                      <TableHead className="text-center">Viewer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      'Manage Project Settings',
                      'Manage Team Members',
                      'Create/Edit Tasks',
                      'Create/Edit Sprints',
                      'Manage Risks & Decisions',
                      'View Financials',
                      'Edit Financials',
                      'Generate Reports',
                      'Export Data',
                    ].map((permission, idx) => (
                      <TableRow key={permission}>
                        <TableCell className="font-medium text-sm">{permission}</TableCell>
                        <TableCell className="text-center">
                          <Check className="h-4 w-4 mx-auto text-success" />
                        </TableCell>
                        <TableCell className="text-center">
                          {idx < 7 ? <Check className="h-4 w-4 mx-auto text-success" /> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {idx > 1 && idx < 6 ? <Check className="h-4 w-4 mx-auto text-success" /> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {idx > 1 && idx < 5 ? <Check className="h-4 w-4 mx-auto text-success" /> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-muted-foreground">—</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Methodology Tab */}
          <TabsContent value="methodology" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Methodology</CardTitle>
                <CardDescription>
                  Select a methodology to automatically configure module defaults
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {(Object.keys(methodologyInfo) as Methodology[]).map((method) => {
                    const info = methodologyInfo[method];
                    const Icon = info.icon;
                    const isSelected = settings.methodology === method;

                    return (
                      <button
                        key={method}
                        onClick={() => handleMethodologyChange(method)}
                        className={cn(
                          'flex flex-col items-start p-4 rounded-lg border-2 text-left transition-all',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div className={cn(
                          'h-10 w-10 rounded-lg flex items-center justify-center mb-3',
                          isSelected ? 'bg-primary/20' : 'bg-muted'
                        )}>
                          <Icon className={cn(
                            'h-5 w-5',
                            isSelected ? 'text-primary' : 'text-muted-foreground'
                          )} />
                        </div>
                        <div className="font-semibold text-sm mb-1">{info.name}</div>
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {info.description}
                        </p>
                        {isSelected && (
                          <Badge className="mt-3 bg-primary text-primary-foreground">
                            <Check className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Module Visibility</CardTitle>
                    <CardDescription>
                      Toggle modules on/off based on your project needs
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetToMethodologyDefaults}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {moduleGroups.map((group) => (
                  <div key={group.category}>
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                      {group.category}
                    </h4>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {group.modules.map((module) => (
                        <div
                          key={module.key}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg border transition-colors',
                            settings.modules[module.key]
                              ? 'bg-card border-border'
                              : 'bg-muted/30 border-transparent'
                          )}
                        >
                          <span className={cn(
                            'text-sm font-medium',
                            !settings.modules[module.key] && 'text-muted-foreground'
                          )}>
                            {module.label}
                          </span>
                          <Switch
                            checked={settings.modules[module.key]}
                            onCheckedChange={() => handleModuleToggle(module.key)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Workflows</CardTitle>
                <CardDescription>Define custom workflows for task progression</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Not Started</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">In Progress</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">Review</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="bg-success/20 text-success border-success/30">Completed</Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="ml-auto">
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Manage custom categories and labels for tasks, risks, and issues
              </p>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {['Task Types', 'Risk Categories', 'Issue Types'].map((category) => (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {['Category 1', 'Category 2', 'Category 3'].map((item, idx) => (
                      <div
                        key={item}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'h-2 w-2 rounded-full',
                            idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-warning' : 'bg-success'
                          )} />
                          <span className="text-sm">{item}</span>
                        </div>
                        <Button variant="ghost" size="iconXs">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect external tools and services to your project
            </p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { name: 'Jira', status: 'connected', description: 'Issue tracking sync' },
                { name: 'Slack', status: 'connected', description: 'Team notifications' },
                { name: 'GitHub', status: 'available', description: 'Code repository' },
                { name: 'Microsoft Teams', status: 'available', description: 'Team collaboration' },
                { name: 'Confluence', status: 'available', description: 'Documentation' },
                { name: 'Azure DevOps', status: 'available', description: 'CI/CD pipeline' },
              ].map((integration) => (
                <Card key={integration.name} className="hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Plug className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          integration.status === 'connected'
                            ? 'bg-success/20 text-success border-success/30'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {integration.status === 'connected' ? 'Connected' : 'Available'}
                      </Badge>
                    </div>
                    <h4 className="font-semibold">{integration.name}</h4>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                    <Button
                      variant={integration.status === 'connected' ? 'outline' : 'default'}
                      size="sm"
                      className="mt-4 w-full"
                    >
                      {integration.status === 'connected' ? 'Configure' : 'Connect'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="mb-6 p-4 rounded-lg bg-muted/50 border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Your User ID</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{currentUserId || 'Loading...'}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={copyId} disabled={!currentUserId}>
                <Copy className="h-4 w-4 mr-2" />
                Copy ID
              </Button>
            </div>

            <Tabs defaultValue="portfolios" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
                <TabsTrigger value="portfolios">Portfolios</TabsTrigger>
                <TabsTrigger value="programs">Programs</TabsTrigger>
              </TabsList>
              <TabsContent value="portfolios" className="space-y-4">
                <PortfolioAssignments currentUserId={currentUserId} members={members || []} />
              </TabsContent>
              <TabsContent value="programs" className="space-y-4">
                <ProgramAssignments currentUserId={currentUserId} members={members || []} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PortfolioAssignments({ currentUserId, members }: { currentUserId: string, members: any[] }) {
  const { data: portfolios } = usePortfolios();
  const updatePortfolio = useUpdatePortfolio();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAssign = async (id: string, newOwnerId: string) => {
    try {
      await updatePortfolio.mutateAsync({ id, owner_id: newOwnerId });
      toast.success('Portfolio owner updated');
      setEditingId(null);
    } catch (error) {
      toast.error('Failed to update owner');
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Portfolio Name</TableHead>
            <TableHead>Current Owner</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {portfolios?.map((p) => (
            <AssignmentRow
              key={p.id}
              item={p}
              currentUserId={currentUserId}
              members={members}
              onAssign={handleAssign}
              isEditing={editingId === p.id}
              setEditing={setEditingId}
            />
          ))}
          {(!portfolios || portfolios.length === 0) && (
            <TableRow><TableCell colSpan={3} className="p-8 text-center text-muted-foreground">No portfolios found.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ProgramAssignments({ currentUserId, members }: { currentUserId: string, members: any[] }) {
  const { data: programs } = usePrograms();
  const updateProgram = useUpdateProgram();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAssign = async (id: string, newOwnerId: string) => {
    try {
      await updateProgram.mutateAsync({ id, owner_id: newOwnerId });
      toast.success('Program owner updated');
      setEditingId(null);
    } catch (error) {
      toast.error('Failed to update owner');
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Program Name</TableHead>
            <TableHead>Current Owner</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {programs?.map((p) => (
            <AssignmentRow
              key={p.id}
              item={p}
              currentUserId={currentUserId}
              members={members}
              onAssign={handleAssign}
              isEditing={editingId === p.id}
              setEditing={setEditingId}
            />
          ))}
          {(!programs || programs.length === 0) && (
            <TableRow><TableCell colSpan={3} className="p-8 text-center text-muted-foreground">No programs found.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function AssignmentRow({ item, currentUserId, members, onAssign, isEditing, setEditing }: any) {
  const [selectedOwner, setSelectedOwner] = useState(item.owner_id || '');
  const [inputValue, setInputValue] = useState(item.owner_id || ''); // For "Assign to Me" fallback or manual

  const ownerName = members.find((m: any) => m.id === item.owner_id)?.full_name || item.owner_id || 'Unassigned';

  return (
    <TableRow>
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell className="font-mono text-sm">
        {isEditing ? (
          <Select value={selectedOwner} onValueChange={setSelectedOwner}>
            <SelectTrigger className="h-8 w-[250px]">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m: any) => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={m.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {(m.full_name || 'U').split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span>{m.full_name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={members.find((m: any) => m.id === item.owner_id)?.avatar_url || undefined} />
              <AvatarFallback className="text-[10px]">
                {(ownerName !== 'Unassigned' && ownerName !== item.owner_id) ? ownerName.split(' ').map((n: any) => n[0]).join('') : '?'}
              </AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[200px]">{ownerName}</span>
            {item.owner_id === currentUserId && <Badge variant="outline" className="text-[10px] h-5">You</Badge>}
          </div>
        )}
      </TableCell>
      <TableCell className="text-right">
        {isEditing ? (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
            <Button size="sm" onClick={() => onAssign(item.id, selectedOwner)}>Save</Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { onAssign(item.id, currentUserId); }}>
              Assign to Me
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedOwner(item.owner_id || ''); setEditing(item.id); }}>
              Edit
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
