import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Calendar,
  Users,
  Filter,
  Plus,
  ChevronRight,
  Flag,
  Shield,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  FileCheck,
  ArrowRight,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Edit2,
  Link2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { KPICard } from '@/components/enterprise/KPICard';
import { StatusIndicator } from '@/components/enterprise/StatusIndicator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface StageGate {
  id: string;
  name: string;
  description: string;
  phase: string;
  status: 'pending' | 'in-review' | 'approved' | 'rejected' | 'deferred';
  approvers: Approver[];
  criteria: GateCriteria[];
  scheduledDate: string;
  actualDate?: string;
  comments: GateComment[];
}

interface Approver {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  decision?: 'approved' | 'rejected' | 'pending';
  date?: string;
  comment?: string;
}

interface GateCriteria {
  id: string;
  description: string;
  status: 'met' | 'not-met' | 'partial' | 'na';
  evidence?: string;
}

interface GateComment {
  id: string;
  author: string;
  date: string;
  content: string;
}

interface Milestone {
  id: string;
  name: string;
  project: string;
  status: 'completed' | 'on-track' | 'at-risk' | 'overdue';
  dueDate: string;
  owner: string;
  progress: number;
  dependencies: number;
  deliverables: string[];
  stageGate?: StageGate;
}

const mockStageGates: StageGate[] = [
  {
    id: 'gate-1',
    name: 'Phase 1 Gate: Discovery Complete',
    description: 'Approval to proceed from Discovery to Architecture & Design phase',
    phase: 'Discovery',
    status: 'approved',
    scheduledDate: '2024-03-15',
    actualDate: '2024-03-15',
    approvers: [
      { id: 'a1', name: 'Sarah Mitchell', role: 'Project Sponsor', decision: 'approved', date: '2024-03-14', comment: 'Excellent discovery work' },
      { id: 'a2', name: 'James Wilson', role: 'Technical Director', decision: 'approved', date: '2024-03-15' },
      { id: 'a3', name: 'Lisa Chen', role: 'Business Owner', decision: 'approved', date: '2024-03-14' },
    ],
    criteria: [
      { id: 'c1', description: 'Current state analysis completed', status: 'met', evidence: 'Document: CSA-Report-v1.pdf' },
      { id: 'c2', description: 'Infrastructure inventory documented', status: 'met', evidence: 'Spreadsheet: Infra-Inventory.xlsx' },
      { id: 'c3', description: 'Risk assessment performed', status: 'met', evidence: 'Risk Register updated' },
      { id: 'c4', description: 'Stakeholder sign-off obtained', status: 'met', evidence: '3/3 stakeholders approved' },
    ],
    comments: [
      { id: 'cm1', author: 'Sarah Mitchell', date: '2024-03-14', content: 'Team did a thorough job on the discovery phase. Ready to proceed.' },
    ],
  },
  {
    id: 'gate-2',
    name: 'Phase 2 Gate: Architecture Approved',
    description: 'Approval of cloud architecture and security framework before implementation',
    phase: 'Architecture & Design',
    status: 'in-review',
    scheduledDate: '2024-05-31',
    approvers: [
      { id: 'a1', name: 'Sarah Mitchell', role: 'Project Sponsor', decision: 'pending' },
      { id: 'a2', name: 'James Wilson', role: 'Technical Director', decision: 'approved', date: '2024-05-28', comment: 'Architecture looks solid' },
      { id: 'a3', name: 'Lisa Chen', role: 'Business Owner', decision: 'pending' },
      { id: 'a4', name: 'Mike Security', role: 'Security Officer', decision: 'approved', date: '2024-05-29' },
    ],
    criteria: [
      { id: 'c1', description: 'Cloud architecture documented and reviewed', status: 'met', evidence: 'Architecture diagrams v2.0' },
      { id: 'c2', description: 'Security framework meets compliance requirements', status: 'met', evidence: 'Security Audit Report' },
      { id: 'c3', description: 'Cost estimates within approved budget', status: 'partial', evidence: '5% over initial estimate - pending approval' },
      { id: 'c4', description: 'Disaster recovery plan approved', status: 'met' },
      { id: 'c5', description: 'Performance requirements defined', status: 'not-met' },
    ],
    comments: [
      { id: 'cm1', author: 'James Wilson', date: '2024-05-28', content: 'Architecture is well-designed. Minor concerns about cost but acceptable.' },
      { id: 'cm2', author: 'Mike Security', date: '2024-05-29', content: 'Security requirements fully addressed. Approved from security perspective.' },
    ],
  },
  {
    id: 'gate-3',
    name: 'Phase 3 Gate: Implementation Complete',
    description: 'Verification that all implementation milestones are met before testing',
    phase: 'Implementation',
    status: 'pending',
    scheduledDate: '2024-10-31',
    approvers: [
      { id: 'a1', name: 'Sarah Mitchell', role: 'Project Sponsor', decision: 'pending' },
      { id: 'a2', name: 'James Wilson', role: 'Technical Director', decision: 'pending' },
      { id: 'a3', name: 'QA Lead', role: 'Quality Assurance', decision: 'pending' },
    ],
    criteria: [
      { id: 'c1', description: 'All Wave 1 migrations completed', status: 'not-met' },
      { id: 'c2', description: 'All Wave 2 migrations completed', status: 'not-met' },
      { id: 'c3', description: 'Data migration validated', status: 'not-met' },
      { id: 'c4', description: 'Integration testing passed', status: 'not-met' },
    ],
    comments: [],
  },
];

const mockMilestones: Milestone[] = [
  { id: 'ms-1', name: 'Phase 1 Complete', project: 'Enterprise Cloud Migration', status: 'completed', dueDate: '2024-03-15', owner: 'Emily Johnson', progress: 100, dependencies: 0, deliverables: ['UI Mockups', 'Technical Specs', 'Stakeholder Sign-off'], stageGate: mockStageGates[0] },
  { id: 'ms-2', name: 'Architecture Approved', project: 'Enterprise Cloud Migration', status: 'on-track', dueDate: '2024-05-31', owner: 'Robert Kim', progress: 75, dependencies: 2, deliverables: ['Architecture Docs', 'Security Framework', 'Cost Analysis'], stageGate: mockStageGates[1] },
  { id: 'ms-3', name: 'Wave 1 Migration Complete', project: 'Enterprise Cloud Migration', status: 'at-risk', dueDate: '2024-08-31', owner: 'Anna Martinez', progress: 45, dependencies: 3, deliverables: ['Migration Report', 'Data Validation', 'Rollback Plan'] },
  { id: 'ms-4', name: 'Implementation Complete', project: 'Enterprise Cloud Migration', status: 'on-track', dueDate: '2024-10-31', owner: 'Mark Thompson', progress: 20, dependencies: 1, deliverables: ['All Migrations', 'Integration Tests', 'Performance Baseline'], stageGate: mockStageGates[2] },
  { id: 'ms-5', name: 'Go-Live Ready', project: 'Enterprise Cloud Migration', status: 'on-track', dueDate: '2024-12-15', owner: 'Sophie Turner', progress: 0, dependencies: 2, deliverables: ['UAT Complete', 'Training', 'Cutover Plan'] },
];

const getStatusColor = (status: Milestone['status']) => {
  switch (status) {
    case 'completed': return 'green';
    case 'on-track': return 'green';
    case 'at-risk': return 'amber';
    case 'overdue': return 'red';
  }
};

const getStatusBadgeVariant = (status: Milestone['status']) => {
  switch (status) {
    case 'completed': return 'completed' as const;
    case 'on-track': return 'active' as const;
    case 'at-risk': return 'warning' as const;
    case 'overdue': return 'critical' as const;
  }
};

const getGateStatusBadge = (status: StageGate['status']) => {
  switch (status) {
    case 'approved': return { variant: 'completed' as const, label: 'Approved', icon: CheckCircle2 };
    case 'rejected': return { variant: 'critical' as const, label: 'Rejected', icon: XCircle };
    case 'in-review': return { variant: 'warning' as const, label: 'In Review', icon: Clock };
    case 'deferred': return { variant: 'secondary' as const, label: 'Deferred', icon: Pause };
    case 'pending': return { variant: 'outline' as const, label: 'Pending', icon: Clock };
  }
};

const getCriteriaIcon = (status: GateCriteria['status']) => {
  switch (status) {
    case 'met': return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'not-met': return <XCircle className="h-4 w-4 text-destructive" />;
    case 'partial': return <AlertTriangle className="h-4 w-4 text-warning" />;
    case 'na': return <span className="text-muted-foreground text-xs">N/A</span>;
  }
};

export function MilestonesView() {
  const [viewMode, setViewMode] = useState<'timeline' | 'list' | 'gates'>('timeline');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedGate, setSelectedGate] = useState<StageGate | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');

  const filteredMilestones = filterStatus 
    ? mockMilestones.filter(m => m.status === filterStatus)
    : mockMilestones;

  const statusCounts = {
    completed: mockMilestones.filter(m => m.status === 'completed').length,
    onTrack: mockMilestones.filter(m => m.status === 'on-track').length,
    atRisk: mockMilestones.filter(m => m.status === 'at-risk').length,
    overdue: mockMilestones.filter(m => m.status === 'overdue').length,
  };

  const handleApprove = (gate: StageGate) => {
    setSelectedGate(gate);
    setApprovalDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Milestones & Stage Gates</h1>
          <p className="text-sm text-muted-foreground mt-1">Track key deliverables and approval checkpoints</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Milestone
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard 
          title="Total Milestones" 
          value={mockMilestones.length.toString()} 
          subtitle="Across all projects" 
          icon={Target} 
          status="neutral" 
        />
        <KPICard 
          title="Completed" 
          value={statusCounts.completed.toString()} 
          subtitle={`${Math.round((statusCounts.completed / mockMilestones.length) * 100)}% completion rate`}
          icon={CheckCircle2} 
          status="success" 
        />
        <KPICard 
          title="Stage Gates" 
          value={mockStageGates.length.toString()} 
          subtitle={`${mockStageGates.filter(g => g.status === 'in-review').length} awaiting approval`}
          icon={Shield} 
          status="neutral" 
        />
        <KPICard 
          title="At Risk / Overdue" 
          value={(statusCounts.atRisk + statusCounts.overdue).toString()} 
          subtitle={`${statusCounts.overdue} overdue`}
          icon={AlertTriangle} 
          status={statusCounts.overdue > 0 ? 'error' : 'warning'} 
        />
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {(['timeline', 'list', 'gates'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
              viewMode === mode 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {mode === 'gates' ? 'Stage Gates' : mode}
          </button>
        ))}
      </div>

      {/* Status Filters */}
      {viewMode !== 'gates' && (
        <div className="flex gap-2">
          <Badge 
            variant={filterStatus === null ? 'default' : 'outline'} 
            className="cursor-pointer"
            onClick={() => setFilterStatus(null)}
          >
            All ({mockMilestones.length})
          </Badge>
          <Badge 
            variant={filterStatus === 'completed' ? 'completed' : 'outline'} 
            className="cursor-pointer"
            onClick={() => setFilterStatus('completed')}
          >
            Completed ({statusCounts.completed})
          </Badge>
          <Badge 
            variant={filterStatus === 'on-track' ? 'active' : 'outline'} 
            className="cursor-pointer"
            onClick={() => setFilterStatus('on-track')}
          >
            On Track ({statusCounts.onTrack})
          </Badge>
          <Badge 
            variant={filterStatus === 'at-risk' ? 'warning' : 'outline'} 
            className="cursor-pointer"
            onClick={() => setFilterStatus('at-risk')}
          >
            At Risk ({statusCounts.atRisk})
          </Badge>
          <Badge 
            variant={filterStatus === 'overdue' ? 'critical' : 'outline'} 
            className="cursor-pointer"
            onClick={() => setFilterStatus('overdue')}
          >
            Overdue ({statusCounts.overdue})
          </Badge>
        </div>
      )}

      {/* Stage Gates View */}
      {viewMode === 'gates' && (
        <div className="space-y-6">
          {mockStageGates.map((gate, index) => {
            const gateStatus = getGateStatusBadge(gate.status);
            const metCriteria = gate.criteria.filter(c => c.status === 'met').length;
            const approvedCount = gate.approvers.filter(a => a.decision === 'approved').length;
            
            return (
              <motion.div
                key={gate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn(
                  'border-l-4',
                  gate.status === 'approved' && 'border-l-success',
                  gate.status === 'rejected' && 'border-l-destructive',
                  gate.status === 'in-review' && 'border-l-warning',
                  gate.status === 'pending' && 'border-l-muted-foreground'
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">{gate.name}</CardTitle>
                          <Badge variant={gateStatus.variant}>
                            <gateStatus.icon className="h-3 w-3 mr-1" />
                            {gateStatus.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{gate.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedGate(gate)}>
                          <FileCheck className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        {gate.status === 'in-review' && (
                          <Button size="sm" onClick={() => handleApprove(gate)}>
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-6">
                      {/* Criteria Progress */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Gate Criteria</h4>
                        <div className="flex items-center gap-3 mb-2">
                          <Progress value={(metCriteria / gate.criteria.length) * 100} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{metCriteria}/{gate.criteria.length}</span>
                        </div>
                        <div className="space-y-1">
                          {gate.criteria.slice(0, 3).map(c => (
                            <div key={c.id} className="flex items-center gap-2 text-xs">
                              {getCriteriaIcon(c.status)}
                              <span className="truncate">{c.description}</span>
                            </div>
                          ))}
                          {gate.criteria.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{gate.criteria.length - 3} more</span>
                          )}
                        </div>
                      </div>

                      {/* Approvers */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Approvers</h4>
                        <div className="flex items-center gap-3 mb-2">
                          <Progress value={(approvedCount / gate.approvers.length) * 100} className="h-2 flex-1" />
                          <span className="text-sm font-medium">{approvedCount}/{gate.approvers.length}</span>
                        </div>
                        <div className="space-y-1">
                          {gate.approvers.map(a => (
                            <div key={a.id} className="flex items-center gap-2 text-xs">
                              {a.decision === 'approved' ? (
                                <ThumbsUp className="h-3 w-3 text-success" />
                              ) : a.decision === 'rejected' ? (
                                <ThumbsDown className="h-3 w-3 text-destructive" />
                              ) : (
                                <Clock className="h-3 w-3 text-muted-foreground" />
                              )}
                              <span>{a.name}</span>
                              <span className="text-muted-foreground">({a.role})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Schedule */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Schedule</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Scheduled: {gate.scheduledDate}</span>
                          </div>
                          {gate.actualDate && (
                            <div className="flex items-center gap-2 text-sm text-success">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Completed: {gate.actualDate}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span>{gate.comments.length} comments</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Milestones List */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr className="text-left text-xs text-muted-foreground uppercase">
                  <th className="p-4 font-medium">Milestone</th>
                  <th className="p-4 font-medium">Project</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Progress</th>
                  <th className="p-4 font-medium">Due Date</th>
                  <th className="p-4 font-medium">Owner</th>
                  <th className="p-4 font-medium">Gate</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredMilestones.map((milestone) => (
                  <motion.tr 
                    key={milestone.id} 
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    whileHover={{ backgroundColor: 'hsl(var(--muted) / 0.5)' }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Flag className="h-4 w-4 text-primary" />
                        <span className="font-medium">{milestone.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{milestone.project}</td>
                    <td className="p-4">
                      <Badge variant={getStatusBadgeVariant(milestone.status)}>
                        {milestone.status.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Progress value={milestone.progress} className="h-2 w-20" />
                        <span className="text-sm">{milestone.progress}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{milestone.dueDate}</td>
                    <td className="p-4 text-sm">{milestone.owner}</td>
                    <td className="p-4">
                      {milestone.stageGate ? (
                        <Badge variant={getGateStatusBadge(milestone.stageGate.status).variant} className="gap-1">
                          <Shield className="h-3 w-3" />
                          Gate
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link2 className="h-4 w-4 mr-2" />
                            Link Items
                          </DropdownMenuItem>
                          {milestone.stageGate && (
                            <DropdownMenuItem onClick={() => setSelectedGate(milestone.stageGate!)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Review Gate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          {filteredMilestones.map((milestone, index) => (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-8"
            >
              {/* Timeline line */}
              {index < filteredMilestones.length - 1 && (
                <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border" />
              )}
              
              {/* Timeline dot */}
              <div className="absolute left-0 top-4">
                <StatusIndicator status={getStatusColor(milestone.status)} pulse={milestone.status !== 'completed'} />
              </div>

              <Card variant="interactive" className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground">{milestone.name}</h3>
                        <Badge variant={getStatusBadgeVariant(milestone.status)}>
                          {milestone.status.replace('-', ' ')}
                        </Badge>
                        {milestone.stageGate && (
                          <Badge 
                            variant={getGateStatusBadge(milestone.stageGate.status).variant}
                            className="gap-1 cursor-pointer"
                            onClick={() => setSelectedGate(milestone.stageGate!)}
                          >
                            <Shield className="h-3 w-3" />
                            Stage Gate
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{milestone.project}</p>
                      
                      {/* Deliverables */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {milestone.deliverables.map((deliverable, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {deliverable}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{milestone.dueDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{milestone.owner}</span>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-end gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">Progress</span>
                          <span className="text-sm font-medium">{milestone.progress}%</span>
                        </div>
                        <Progress value={milestone.progress} className="h-2 w-32" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Gate Review Dialog */}
      <Dialog open={!!selectedGate && !approvalDialogOpen} onOpenChange={() => setSelectedGate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          {selectedGate && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  <div>
                    <DialogTitle>{selectedGate.name}</DialogTitle>
                    <DialogDescription>{selectedGate.description}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <Tabs defaultValue="criteria" className="mt-4">
                <TabsList>
                  <TabsTrigger value="criteria">Criteria</TabsTrigger>
                  <TabsTrigger value="approvers">Approvers</TabsTrigger>
                  <TabsTrigger value="comments">Comments</TabsTrigger>
                </TabsList>
                
                <TabsContent value="criteria" className="space-y-4">
                  {selectedGate.criteria.map(c => (
                    <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      {getCriteriaIcon(c.status)}
                      <div className="flex-1">
                        <p className="font-medium">{c.description}</p>
                        {c.evidence && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Evidence: {c.evidence}
                          </p>
                        )}
                      </div>
                      <Badge variant={
                        c.status === 'met' ? 'completed' :
                        c.status === 'not-met' ? 'critical' :
                        c.status === 'partial' ? 'warning' : 'secondary'
                      }>
                        {c.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="approvers" className="space-y-4">
                  {selectedGate.approvers.map(a => (
                    <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {a.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{a.name}</p>
                        <p className="text-sm text-muted-foreground">{a.role}</p>
                        {a.comment && (
                          <p className="text-sm mt-2 italic">"{a.comment}"</p>
                        )}
                      </div>
                      <div className="text-right">
                        {a.decision === 'approved' ? (
                          <Badge variant="completed">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        ) : a.decision === 'rejected' ? (
                          <Badge variant="critical">
                            <ThumbsDown className="h-3 w-3 mr-1" />
                            Rejected
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {a.date && (
                          <p className="text-xs text-muted-foreground mt-1">{a.date}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="comments" className="space-y-4">
                  {selectedGate.comments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No comments yet</p>
                  ) : (
                    selectedGate.comments.map(c => (
                      <div key={c.id} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{c.author}</span>
                          <span className="text-xs text-muted-foreground">{c.date}</span>
                        </div>
                        <p className="text-sm">{c.content}</p>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setSelectedGate(null)}>
                  Close
                </Button>
                {selectedGate.status === 'in-review' && (
                  <>
                    <Button variant="destructive" onClick={() => setApprovalDialogOpen(true)}>
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button onClick={() => setApprovalDialogOpen(true)}>
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Gate Decision</DialogTitle>
            <DialogDescription>
              Provide your decision and any comments for the stage gate review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Comment (optional)</label>
              <Textarea
                placeholder="Add any comments or conditions for your decision..."
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive">
              <ThumbsDown className="h-4 w-4 mr-1" />
              Reject Gate
            </Button>
            <Button>
              <ThumbsUp className="h-4 w-4 mr-1" />
              Approve Gate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
