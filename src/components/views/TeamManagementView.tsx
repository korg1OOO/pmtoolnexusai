import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Mail,
  Shield,
  Trash2,
  UserCheck,
  Crown,
  Briefcase,
  Star,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useTeamMembers, useAddTeamMember, useRemoveTeamMember } from '@/hooks/useTeamMembers';
import { ProjectRole } from '@/types/ai-agents';

interface Team {
  id: string;
  name: string;
  description: string;
  lead: string;
  members: string[];
  color: string;
}

interface Role {
  id: ProjectRole;
  name: string;
  description: string;
  permissions: string[];
  color: string;
  icon: React.ElementType;
}

const roles: Role[] = [
  {
    id: 'admin',
    name: 'Project Administrator', // Mapped from 'owner' conceptually if needed, or 'admin'
    description: 'Full control over project settings and team',
    permissions: ['all'],
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: Crown,
  },
  {
    id: 'pm',
    name: 'Project Manager',
    description: 'Manage project plan, resources, and deliverables',
    permissions: ['manage_plan', 'manage_team', 'manage_risks', 'view_financials', 'manage_meetings'],
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: Briefcase,
  },
  {
    id: 'lead',
    name: 'Team Lead',
    description: 'Lead a functional team and manage assignments',
    permissions: ['manage_tasks', 'manage_sprints', 'view_reports', 'manage_team_members'],
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: Star,
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Work on assigned tasks and update progress',
    permissions: ['update_tasks', 'view_plan', 'log_time', 'view_docs'],
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: UserCheck,
  },
  {
    id: 'analyst',
    name: 'Business Analyst',
    description: 'Define requirements and manage documentation',
    permissions: ['manage_requirements', 'manage_docs', 'view_plan', 'create_reports'],
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    icon: UserCheck,
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to project information',
    permissions: ['view_plan', 'view_reports', 'view_docs'],
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    icon: Users,
  },
];

// Placeholder for Teams until schema exists
const teams: Team[] = [
  {
    id: 'core',
    name: 'Core Team',
    description: 'Primary project delivery team',
    lead: '1',
    members: [],
    color: 'bg-primary/20',
  },
];

export function TeamManagementView() {
  const { settings } = useProjectContext();
  const { data: members, isLoading } = useTeamMembers(settings.id);
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('members');

  // Add Member State
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<ProjectRole>('viewer');

  const getRoleInfo = (roleId: string) => roles.find((r) => r.id === roleId) || roles[5];

  const handleAddMember = async () => {
    try {
      await addMember.mutateAsync({
        projectId: settings.id,
        email: newMemberEmail,
        role: newMemberRole
      });
      setIsAddMemberOpen(false);
      setNewMemberEmail('');
    } catch (e) {
      // Toast handled by hook
    }
  };

  const handleRemoveMember = (userId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      removeMember.mutate({ projectId: settings.id, userId });
    }
  };

  const filteredMembers = members?.filter((member) => {
    const matchesSearch =
      (member.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  }) || [];

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground">Manage project team members, roles, and permissions</p>
        </div>
        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  placeholder="colleague@company.com"
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newMemberRole} onValueChange={(v) => setNewMemberRole(v as ProjectRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <role.icon className="h-4 w-4" />
                          {role.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMember} disabled={addMember.isPending}>
                {addMember.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Mail className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{members?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Placeholder stats */}
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Shield className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{roles.length}</p>
                <p className="text-sm text-muted-foreground">Roles Defined</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-fit">
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            Roles & Permissions
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="flex-1 mt-4">
          <Card className="h-full flex flex-col bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {filteredMembers.map((member) => {
                    const roleInfo = getRoleInfo(member.role);
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {(member.full_name || 'U')
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{member.full_name || 'Unknown User'}</span>
                            <Badge variant="outline" className={`text-xs ${roleInfo.color}`}>
                              <roleInfo.icon className="h-3 w-3 mr-1" />
                              {roleInfo.name}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive" onClick={() => handleRemoveMember(member.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                  {filteredMembers.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">
                      No team members found. Invite someone to collaborate!
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab - Static for now, reference */}
        <TabsContent value="roles" className="flex-1 mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map(role => (
              <Card key={role.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <role.icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map(p => (
                      <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
