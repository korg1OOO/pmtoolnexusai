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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Building2,
  Shield,
  Settings,
  Trash2,
  Edit,
  Crown,
  Star,
  UserCheck,
  Clock,
  Calendar,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  department: string;
  status: 'active' | 'away' | 'offline';
  joinedDate: string;
  allocation: number;
  skills: string[];
  teams: string[];
}

interface Team {
  id: string;
  name: string;
  description: string;
  lead: string;
  members: string[];
  color: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  color: string;
  icon: React.ElementType;
}

const roles: Role[] = [
  {
    id: 'owner',
    name: 'Project Owner',
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

const teams: Team[] = [
  {
    id: 'core',
    name: 'Core Team',
    description: 'Primary project delivery team',
    lead: '1',
    members: ['1', '2', '3', '4'],
    color: 'bg-primary/20',
  },
  {
    id: 'dev',
    name: 'Development Team',
    description: 'Software development and engineering',
    lead: '3',
    members: ['3', '5', '6'],
    color: 'bg-blue-500/20',
  },
  {
    id: 'qa',
    name: 'QA Team',
    description: 'Quality assurance and testing',
    lead: '7',
    members: ['7', '8'],
    color: 'bg-green-500/20',
  },
  {
    id: 'stakeholders',
    name: 'Stakeholders',
    description: 'External stakeholders and sponsors',
    lead: '9',
    members: ['9', '10'],
    color: 'bg-amber-500/20',
  },
];

const mockMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah.chen@acme.com',
    phone: '+1 555-0101',
    role: 'pm',
    department: 'Project Management',
    status: 'active',
    joinedDate: '2024-01-15',
    allocation: 100,
    skills: ['Project Management', 'Agile', 'Stakeholder Management'],
    teams: ['core'],
  },
  {
    id: '2',
    name: 'Michael Torres',
    email: 'michael.torres@acme.com',
    phone: '+1 555-0102',
    role: 'lead',
    department: 'Engineering',
    status: 'active',
    joinedDate: '2024-01-20',
    allocation: 80,
    skills: ['Architecture', 'Java', 'Cloud'],
    teams: ['core', 'dev'],
  },
  {
    id: '3',
    name: 'Emily Watson',
    email: 'emily.watson@acme.com',
    role: 'developer',
    department: 'Engineering',
    status: 'active',
    joinedDate: '2024-02-01',
    allocation: 100,
    skills: ['React', 'TypeScript', 'Node.js'],
    teams: ['dev'],
  },
  {
    id: '4',
    name: 'James Liu',
    email: 'james.liu@acme.com',
    role: 'analyst',
    department: 'Business Analysis',
    status: 'away',
    joinedDate: '2024-02-05',
    allocation: 60,
    skills: ['Requirements', 'Process Mapping', 'SQL'],
    teams: ['core'],
  },
  {
    id: '5',
    name: 'Anna Schmidt',
    email: 'anna.schmidt@acme.com',
    role: 'developer',
    department: 'Engineering',
    status: 'active',
    joinedDate: '2024-02-10',
    allocation: 100,
    skills: ['Python', 'Data Engineering', 'AWS'],
    teams: ['dev'],
  },
  {
    id: '6',
    name: 'David Park',
    email: 'david.park@acme.com',
    role: 'developer',
    department: 'Engineering',
    status: 'offline',
    joinedDate: '2024-02-15',
    allocation: 50,
    skills: ['Mobile', 'iOS', 'Swift'],
    teams: ['dev'],
  },
  {
    id: '7',
    name: 'Lisa Johnson',
    email: 'lisa.johnson@acme.com',
    role: 'lead',
    department: 'Quality Assurance',
    status: 'active',
    joinedDate: '2024-02-20',
    allocation: 80,
    skills: ['Test Automation', 'Selenium', 'Performance Testing'],
    teams: ['qa'],
  },
  {
    id: '8',
    name: 'Robert Kim',
    email: 'robert.kim@acme.com',
    role: 'developer',
    department: 'Quality Assurance',
    status: 'active',
    joinedDate: '2024-03-01',
    allocation: 100,
    skills: ['Manual Testing', 'API Testing', 'Cypress'],
    teams: ['qa'],
  },
  {
    id: '9',
    name: 'Jennifer Adams',
    email: 'jennifer.adams@acme.com',
    role: 'owner',
    department: 'Executive',
    status: 'active',
    joinedDate: '2024-01-01',
    allocation: 20,
    skills: ['Executive Sponsorship', 'Strategy'],
    teams: ['stakeholders'],
  },
  {
    id: '10',
    name: 'Thomas Brown',
    email: 'thomas.brown@client.com',
    role: 'viewer',
    department: 'Client',
    status: 'active',
    joinedDate: '2024-01-10',
    allocation: 10,
    skills: ['Business Review', 'Acceptance'],
    teams: ['stakeholders'],
  },
];

const permissionCategories = [
  {
    name: 'Project Plan',
    permissions: [
      { id: 'view_plan', label: 'View Plan' },
      { id: 'manage_plan', label: 'Edit Plan' },
      { id: 'manage_tasks', label: 'Manage Tasks' },
    ],
  },
  {
    name: 'Team',
    permissions: [
      { id: 'view_team', label: 'View Team' },
      { id: 'manage_team', label: 'Manage Team' },
      { id: 'manage_team_members', label: 'Assign Members' },
    ],
  },
  {
    name: 'Sprints',
    permissions: [
      { id: 'view_sprints', label: 'View Sprints' },
      { id: 'manage_sprints', label: 'Manage Sprints' },
      { id: 'update_tasks', label: 'Update Tasks' },
    ],
  },
  {
    name: 'Risks & Issues',
    permissions: [
      { id: 'view_risks', label: 'View Risks' },
      { id: 'manage_risks', label: 'Manage Risks' },
    ],
  },
  {
    name: 'Financials',
    permissions: [
      { id: 'view_financials', label: 'View Financials' },
      { id: 'manage_financials', label: 'Manage Budget' },
    ],
  },
  {
    name: 'Documents',
    permissions: [
      { id: 'view_docs', label: 'View Documents' },
      { id: 'manage_docs', label: 'Manage Documents' },
      { id: 'manage_requirements', label: 'Manage Requirements' },
    ],
  },
  {
    name: 'Meetings',
    permissions: [
      { id: 'view_meetings', label: 'View Meetings' },
      { id: 'manage_meetings', label: 'Manage Meetings' },
    ],
  },
  {
    name: 'Reports',
    permissions: [
      { id: 'view_reports', label: 'View Reports' },
      { id: 'create_reports', label: 'Create Reports' },
    ],
  },
  {
    name: 'Time',
    permissions: [
      { id: 'log_time', label: 'Log Time' },
      { id: 'approve_time', label: 'Approve Time' },
    ],
  },
];

export function TeamManagementView() {
  const [members, setMembers] = useState<TeamMember[]>(mockMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState<string[]>(['core', 'dev']);
  const [activeTab, setActiveTab] = useState('members');

  const getRoleInfo = (roleId: string) => roles.find((r) => r.id === roleId) || roles[5];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'away':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesTeam = teamFilter === 'all' || member.teams.includes(teamFilter);
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesRole && matchesTeam && matchesStatus;
  });

  const toggleTeamExpand = (teamId: string) => {
    setExpandedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((t) => t !== teamId) : [...prev, teamId]
    );
  };

  const getTeamMembers = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return [];
    return members.filter((m) => team.members.includes(m.id));
  };

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
                <Input placeholder="colleague@company.com" type="email" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select defaultValue="developer">
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
              <div className="space-y-2">
                <Label>Assign to Teams</Label>
                <div className="space-y-2">
                  {teams.map((team) => (
                    <div key={team.id} className="flex items-center gap-2">
                      <Checkbox id={`team-${team.id}`} />
                      <Label htmlFor={`team-${team.id}`} className="font-normal">
                        {team.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Allocation %</Label>
                <Input type="number" defaultValue={100} min={0} max={100} />
              </div>
              <div className="space-y-2">
                <Label>Message (Optional)</Label>
                <Input placeholder="Welcome to the project!" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddMemberOpen(false)}>
                <Mail className="h-4 w-4 mr-2" />
                Send Invite
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
                <p className="text-2xl font-bold text-foreground">{members.length}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <UserCheck className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {members.filter((m) => m.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">Active Now</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Building2 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{teams.length}</p>
                <p className="text-sm text-muted-foreground">Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
          <TabsTrigger value="teams" className="gap-2">
            <Building2 className="h-4 w-4" />
            Teams
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
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="away">Away</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
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
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedMember(member)}
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {member.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{member.name}</span>
                            <Badge variant="outline" className={`text-xs ${roleInfo.color}`}>
                              <roleInfo.icon className="h-3 w-3 mr-1" />
                              {roleInfo.name}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-foreground">{member.department}</p>
                          <p className="text-xs text-muted-foreground">{member.allocation}% allocated</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {member.teams.map((teamId) => {
                            const team = teams.find((t) => t.id === teamId);
                            return team ? (
                              <Tooltip key={teamId}>
                                <TooltipTrigger>
                                  <div className={`h-2 w-2 rounded-full ${team.color.replace('/20', '')}`} />
                                </TooltipTrigger>
                                <TooltipContent>{team.name}</TooltipContent>
                              </Tooltip>
                            ) : null;
                          })}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Member
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsEditRoleOpen(true)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="flex-1 mt-4">
          <div className="grid grid-cols-2 gap-6 h-full">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">Project Teams</CardTitle>
                <Button size="sm" variant="outline" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create Team
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {teams.map((team) => {
                      const teamMembers = getTeamMembers(team.id);
                      const isExpanded = expandedTeams.includes(team.id);
                      const lead = members.find((m) => m.id === team.lead);

                      return (
                        <div
                          key={team.id}
                          className="rounded-lg border border-border/50 overflow-hidden"
                        >
                          <div
                            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 ${team.color}`}
                            onClick={() => toggleTeamExpand(team.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{team.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {teamMembers.length} members
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{team.description}</p>
                            </div>
                            {lead && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Crown className="h-4 w-4 text-amber-400" />
                                {lead.name}
                              </div>
                            )}
                          </div>
                          {isExpanded && (
                            <div className="border-t border-border/50 bg-background/50 p-3 space-y-2">
                              {teamMembers.map((member) => {
                                const roleInfo = getRoleInfo(member.role);
                                return (
                                  <div
                                    key={member.id}
                                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30"
                                  >
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                        {member.name
                                          .split(' ')
                                          .map((n) => n[0])
                                          .join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-foreground">
                                          {member.name}
                                        </span>
                                        {member.id === team.lead && (
                                          <Crown className="h-3 w-3 text-amber-400" />
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground">{roleInfo.name}</p>
                                    </div>
                                    <span
                                      className={`h-2 w-2 rounded-full ${getStatusColor(member.status)}`}
                                    />
                                  </div>
                                );
                              })}
                              <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add to Team
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Team Stats */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Team Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {teams.map((team) => {
                    const teamMembers = getTeamMembers(team.id);
                    const totalAllocation = teamMembers.reduce((sum, m) => sum + m.allocation, 0);
                    const avgAllocation = teamMembers.length > 0 ? Math.round(totalAllocation / teamMembers.length) : 0;
                    const activeCount = teamMembers.filter((m) => m.status === 'active').length;

                    return (
                      <div key={team.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${team.color.replace('/20', '')}`} />
                            <span className="font-medium text-foreground">{team.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {activeCount}/{teamMembers.length} active
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="text-lg font-semibold text-foreground">{teamMembers.length}</p>
                            <p className="text-xs text-muted-foreground">Members</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="text-lg font-semibold text-foreground">{avgAllocation}%</p>
                            <p className="text-xs text-muted-foreground">Avg Allocation</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30">
                            <p className="text-lg font-semibold text-foreground">
                              {new Set(teamMembers.flatMap((m) => m.skills)).size}
                            </p>
                            <p className="text-xs text-muted-foreground">Skills</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="flex-1 mt-4">
          <div className="grid grid-cols-3 gap-6">
            {/* Roles List */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Defined Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {roles.map((role) => {
                      const memberCount = members.filter((m) => m.role === role.id).length;
                      return (
                        <div
                          key={role.id}
                          className="p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${role.color.split(' ')[0]}`}>
                              <role.icon className={`h-4 w-4 ${role.color.split(' ')[1]}`} />
                            </div>
                            <div className="flex-1">
                              <span className="font-medium text-foreground">{role.name}</span>
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {memberCount} members
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Permissions Matrix */}
            <Card className="col-span-2 bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Permissions Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Permission</th>
                          {roles.map((role) => (
                            <th key={role.id} className="text-center py-3 px-2 font-medium">
                              <div className="flex flex-col items-center gap-1">
                                <role.icon className={`h-4 w-4 ${role.color.split(' ')[1]}`} />
                                <span className="text-xs text-muted-foreground">{role.name}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {permissionCategories.map((category) => (
                          <React.Fragment key={category.name}>
                            <tr className="bg-muted/20">
                              <td colSpan={roles.length + 1} className="py-2 px-4 font-medium text-foreground">
                                {category.name}
                              </td>
                            </tr>
                            {category.permissions.map((permission) => (
                              <tr key={permission.id} className="border-b border-border/30 hover:bg-muted/10">
                                <td className="py-2 px-4 text-muted-foreground">{permission.label}</td>
                                {roles.map((role) => {
                                  const hasPermission =
                                    role.permissions.includes('all') ||
                                    role.permissions.includes(permission.id);
                                  return (
                                    <td key={role.id} className="text-center py-2">
                                      {hasPermission ? (
                                        <Check className="h-4 w-4 text-green-400 mx-auto" />
                                      ) : (
                                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select New Role</Label>
              <Select defaultValue="developer">
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
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400">
                Changing roles will affect the user's permissions immediately.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsEditRoleOpen(false)}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Detail Sheet */}
      {selectedMember && (
        <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Team Member Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedMember.avatar} />
                  <AvatarFallback className="text-lg bg-primary/20 text-primary">
                    {selectedMember.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{selectedMember.name}</h3>
                  <p className="text-muted-foreground">{selectedMember.department}</p>
                  <Badge variant="outline" className={`mt-1 ${getRoleInfo(selectedMember.role).color}`}>
                    {getRoleInfo(selectedMember.role).name}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{selectedMember.email}</span>
                </div>
                {selectedMember.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{selectedMember.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">Joined {selectedMember.joinedDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{selectedMember.allocation}% Allocation</span>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Skills</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedMember.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Teams</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedMember.teams.map((teamId) => {
                    const team = teams.find((t) => t.id === teamId);
                    return team ? (
                      <Badge key={teamId} variant="outline" className={team.color}>
                        {team.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedMember(null)}>
                Close
              </Button>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
