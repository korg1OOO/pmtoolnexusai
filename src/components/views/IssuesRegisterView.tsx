import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  AlertTriangle,
  Bug,
  Clock,
  Filter,
  Plus,
  Search,
  X,
  User,
  Calendar,
  Link2,
  MoreHorizontal,
  ChevronRight,
  Timer,
  Zap,
  CheckCircle2,
  ArrowUpRight,
  History,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { KPICard } from '@/components/enterprise/KPICard';

export interface Issue {
  id: string;
  title: string;
  description: string;
  type: 'bug' | 'blocker' | 'impediment' | 'defect' | 'incident';
  severity: 'critical' | 'high' | 'medium' | 'low';
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  status: 'open' | 'investigating' | 'in-progress' | 'blocked' | 'resolved' | 'closed';
  reporter: string;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  sla: {
    targetResolution: string;
    hoursRemaining: number;
    breached: boolean;
  };
  linkedItems: {
    type: 'task' | 'risk' | 'decision' | 'action' | 'meeting';
    id: string;
    title: string;
  }[];
  history: {
    timestamp: string;
    user: string;
    action: string;
    details?: string;
  }[];
  comments: {
    id: string;
    user: string;
    text: string;
    timestamp: string;
  }[];
  tags: string[];
  affectedAreas: string[];
  rootCause?: string;
  resolution?: string;
}

const mockIssues: Issue[] = [
  {
    id: 'ISS-001',
    title: 'API Gateway timeout during peak load',
    description: 'The API gateway is experiencing intermittent timeouts when traffic exceeds 1000 requests/second, causing downstream service failures.',
    type: 'incident',
    severity: 'critical',
    priority: 'p1',
    status: 'investigating',
    reporter: 'DevOps Team',
    assignee: 'John Doe',
    createdAt: '2024-01-20T08:30:00Z',
    updatedAt: '2024-01-20T14:15:00Z',
    sla: {
      targetResolution: '2024-01-20T16:30:00Z',
      hoursRemaining: 2,
      breached: false,
    },
    linkedItems: [
      { type: 'risk', id: 'R-003', title: 'Infrastructure capacity risk' },
      { type: 'task', id: 'T-045', title: 'Load balancer configuration' },
    ],
    history: [
      { timestamp: '2024-01-20T08:30:00Z', user: 'DevOps Team', action: 'Created issue' },
      { timestamp: '2024-01-20T09:00:00Z', user: 'John Doe', action: 'Assigned to self' },
      { timestamp: '2024-01-20T10:30:00Z', user: 'John Doe', action: 'Status changed', details: 'Open → Investigating' },
      { timestamp: '2024-01-20T14:15:00Z', user: 'John Doe', action: 'Added root cause analysis' },
    ],
    comments: [
      { id: 'c1', user: 'Jane Smith', text: 'Seeing similar issues in the staging environment', timestamp: '2024-01-20T11:00:00Z' },
      { id: 'c2', user: 'John Doe', text: 'Identified memory leak in connection pooling', timestamp: '2024-01-20T14:00:00Z' },
    ],
    tags: ['infrastructure', 'performance', 'production'],
    affectedAreas: ['API Gateway', 'User Authentication', 'Payment Processing'],
    rootCause: 'Memory leak in connection pool management causing resource exhaustion',
  },
  {
    id: 'ISS-002',
    title: 'Database migration scripts failing on production',
    description: 'Schema migration scripts are failing due to foreign key constraints not being properly handled.',
    type: 'blocker',
    severity: 'high',
    priority: 'p1',
    status: 'in-progress',
    reporter: 'Mike Johnson',
    assignee: 'Emily Brown',
    createdAt: '2024-01-19T14:00:00Z',
    updatedAt: '2024-01-20T09:30:00Z',
    sla: {
      targetResolution: '2024-01-20T14:00:00Z',
      hoursRemaining: -4,
      breached: true,
    },
    linkedItems: [
      { type: 'task', id: 'T-032', title: 'Database schema updates' },
      { type: 'decision', id: 'DEC-005', title: 'Migration strategy decision' },
    ],
    history: [
      { timestamp: '2024-01-19T14:00:00Z', user: 'Mike Johnson', action: 'Created issue' },
      { timestamp: '2024-01-19T15:30:00Z', user: 'Emily Brown', action: 'Assigned' },
      { timestamp: '2024-01-19T16:00:00Z', user: 'Emily Brown', action: 'Status changed', details: 'Open → In Progress' },
    ],
    comments: [
      { id: 'c3', user: 'David Wilson', text: 'We need to rollback and try a different approach', timestamp: '2024-01-20T08:00:00Z' },
    ],
    tags: ['database', 'migration', 'production'],
    affectedAreas: ['User Management', 'Data Integrity'],
  },
  {
    id: 'ISS-003',
    title: 'Authentication token expiration not handled correctly',
    description: 'Users are being logged out unexpectedly when tokens expire, with no refresh mechanism working properly.',
    type: 'bug',
    severity: 'medium',
    priority: 'p2',
    status: 'open',
    reporter: 'QA Team',
    assignee: 'Sarah Mitchell',
    createdAt: '2024-01-18T10:00:00Z',
    updatedAt: '2024-01-19T16:00:00Z',
    sla: {
      targetResolution: '2024-01-22T10:00:00Z',
      hoursRemaining: 48,
      breached: false,
    },
    linkedItems: [
      { type: 'action', id: 'ACT-012', title: 'Implement token refresh logic' },
    ],
    history: [
      { timestamp: '2024-01-18T10:00:00Z', user: 'QA Team', action: 'Created issue' },
      { timestamp: '2024-01-18T11:00:00Z', user: 'Sarah Mitchell', action: 'Assigned' },
    ],
    comments: [],
    tags: ['authentication', 'security', 'ux'],
    affectedAreas: ['User Sessions', 'Mobile App'],
  },
  {
    id: 'ISS-004',
    title: 'CSS styling inconsistencies in dashboard components',
    description: 'Various styling issues in the dashboard causing visual inconsistencies across different browsers.',
    type: 'defect',
    severity: 'low',
    priority: 'p3',
    status: 'resolved',
    reporter: 'Design Team',
    assignee: 'Jane Smith',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-17T14:00:00Z',
    sla: {
      targetResolution: '2024-01-20T09:00:00Z',
      hoursRemaining: 72,
      breached: false,
    },
    linkedItems: [],
    history: [
      { timestamp: '2024-01-15T09:00:00Z', user: 'Design Team', action: 'Created issue' },
      { timestamp: '2024-01-15T10:00:00Z', user: 'Jane Smith', action: 'Assigned' },
      { timestamp: '2024-01-16T14:00:00Z', user: 'Jane Smith', action: 'Status changed', details: 'Open → In Progress' },
      { timestamp: '2024-01-17T14:00:00Z', user: 'Jane Smith', action: 'Status changed', details: 'In Progress → Resolved' },
    ],
    comments: [],
    tags: ['ui', 'css', 'browser-compatibility'],
    affectedAreas: ['Dashboard'],
    resolution: 'Fixed cross-browser CSS issues and added vendor prefixes',
  },
  {
    id: 'ISS-005',
    title: 'Third-party payment integration sporadic failures',
    description: 'Payment processing through Stripe integration is failing intermittently with unclear error messages.',
    type: 'impediment',
    severity: 'high',
    priority: 'p2',
    status: 'blocked',
    reporter: 'Finance Team',
    assignee: 'David Wilson',
    createdAt: '2024-01-19T11:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
    sla: {
      targetResolution: '2024-01-21T11:00:00Z',
      hoursRemaining: 25,
      breached: false,
    },
    linkedItems: [
      { type: 'meeting', id: 'MTG-008', title: 'Stripe integration review' },
      { type: 'risk', id: 'R-007', title: 'Payment processing reliability' },
    ],
    history: [
      { timestamp: '2024-01-19T11:00:00Z', user: 'Finance Team', action: 'Created issue' },
      { timestamp: '2024-01-19T12:00:00Z', user: 'David Wilson', action: 'Assigned' },
      { timestamp: '2024-01-20T10:00:00Z', user: 'David Wilson', action: 'Status changed', details: 'In Progress → Blocked' },
    ],
    comments: [
      { id: 'c4', user: 'David Wilson', text: 'Waiting on Stripe support to respond to our ticket', timestamp: '2024-01-20T10:00:00Z' },
    ],
    tags: ['payments', 'integration', 'third-party'],
    affectedAreas: ['Checkout', 'Billing', 'Subscriptions'],
  },
];

const getSeverityColor = (severity: Issue['severity']) => {
  switch (severity) {
    case 'critical': return 'destructive';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'secondary';
  }
};

const getPriorityColor = (priority: Issue['priority']) => {
  switch (priority) {
    case 'p1': return 'destructive';
    case 'p2': return 'warning';
    case 'p3': return 'info';
    case 'p4': return 'secondary';
  }
};

const getStatusColor = (status: Issue['status']): "secondary" | "info" | "warning" | "destructive" | "success" | "outline" => {
  switch (status) {
    case 'open': return 'secondary';
    case 'investigating': return 'info';
    case 'in-progress': return 'warning';
    case 'blocked': return 'destructive';
    case 'resolved': return 'success';
    case 'closed': return 'outline';
  }
};

const getTypeIcon = (type: Issue['type']) => {
  switch (type) {
    case 'bug': return Bug;
    case 'blocker': return AlertCircle;
    case 'impediment': return AlertTriangle;
    case 'defect': return AlertCircle;
    case 'incident': return Zap;
  }
};

interface IssueCardProps {
  issue: Issue;
  isSelected: boolean;
  onClick: () => void;
}

function IssueCard({ issue, isSelected, onClick }: IssueCardProps) {
  const TypeIcon = getTypeIcon(issue.type);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border cursor-pointer transition-all group',
        isSelected ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
          issue.severity === 'critical' ? 'bg-destructive/10' : 'bg-muted'
        )}>
          <TypeIcon className={cn(
            'h-5 w-5',
            issue.severity === 'critical' ? 'text-destructive' : 'text-muted-foreground'
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">{issue.id}</span>
            <Badge variant={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
            <Badge variant={getPriorityColor(issue.priority)}>{issue.priority.toUpperCase()}</Badge>
          </div>
          
          <h3 className="font-medium text-sm line-clamp-1 mb-1">{issue.title}</h3>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {issue.assignee}
            </span>
            <Badge variant={getStatusColor(issue.status)} className="text-xs">
              {issue.status}
            </Badge>
          </div>

          {/* SLA Timer */}
          <div className={cn(
            'flex items-center gap-2 mt-2 text-xs',
            issue.sla.breached ? 'text-destructive' : issue.sla.hoursRemaining < 4 ? 'text-warning' : 'text-muted-foreground'
          )}>
            <Timer className="h-3 w-3" />
            {issue.sla.breached ? (
              <span className="font-medium">SLA BREACHED ({Math.abs(issue.sla.hoursRemaining)}h over)</span>
            ) : (
              <span>{issue.sla.hoursRemaining}h remaining</span>
            )}
          </div>
        </div>

        <Button variant="ghost" size="iconXs" className="opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

interface IssueDetailPanelProps {
  issue: Issue;
  onClose: () => void;
  onCreateAction: (issue: Issue) => void;
}

function IssueDetailPanel({ issue, onClose, onCreateAction }: IssueDetailPanelProps) {
  const TypeIcon = getTypeIcon(issue.type);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-[480px] border-l bg-card flex flex-col h-full"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <TypeIcon className="h-5 w-5 text-muted-foreground" />
          <span className="font-mono text-sm">{issue.id}</span>
        </div>
        <Button variant="ghost" size="iconSm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
              <Badge variant={getPriorityColor(issue.priority)}>{issue.priority.toUpperCase()}</Badge>
              <Badge variant={getStatusColor(issue.status)}>{issue.status}</Badge>
            </div>
            <h2 className="text-xl font-semibold mb-2">{issue.title}</h2>
            <p className="text-sm text-muted-foreground">{issue.description}</p>
          </div>

          {/* SLA Status */}
          <Card className={cn(
            issue.sla.breached ? 'border-destructive/50 bg-destructive/5' : 
            issue.sla.hoursRemaining < 4 ? 'border-warning/50 bg-warning/5' : ''
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  SLA Status
                </span>
                {issue.sla.breached ? (
                  <Badge variant="destructive">BREACHED</Badge>
                ) : issue.sla.hoursRemaining < 4 ? (
                  <Badge variant="warning">AT RISK</Badge>
                ) : (
                  <Badge variant="success">ON TRACK</Badge>
                )}
              </div>
              <div className="text-2xl font-bold mb-1">
                {issue.sla.breached 
                  ? `${Math.abs(issue.sla.hoursRemaining)}h overdue`
                  : `${issue.sla.hoursRemaining}h remaining`
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Target: {new Date(issue.sla.targetResolution).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Reporter</span>
              <p className="text-sm">{issue.reporter}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Assignee</span>
              <p className="text-sm">{issue.assignee}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Created</span>
              <p className="text-sm">{new Date(issue.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Updated</span>
              <p className="text-sm">{new Date(issue.updatedAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Affected Areas */}
          {issue.affectedAreas.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-2 block">Affected Areas</span>
              <div className="flex flex-wrap gap-1">
                {issue.affectedAreas.map((area) => (
                  <Badge key={area} variant="outline">{area}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Root Cause */}
          {issue.rootCause && (
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-2 block">Root Cause</span>
              <p className="text-sm p-3 bg-warning/10 rounded-lg border border-warning/20">
                {issue.rootCause}
              </p>
            </div>
          )}

          {/* Resolution */}
          {issue.resolution && (
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-2 block">Resolution</span>
              <p className="text-sm p-3 bg-success/10 rounded-lg border border-success/20">
                {issue.resolution}
              </p>
            </div>
          )}

          {/* Linked Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                Linked Items
              </span>
              <Button variant="ghost" size="sm" onClick={() => onCreateAction(issue)}>
                <Plus className="h-3 w-3 mr-1" />
                Create Action
              </Button>
            </div>
            {issue.linkedItems.length > 0 ? (
              <div className="space-y-1">
                {issue.linkedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{item.type}</Badge>
                      <span className="text-sm">{item.title}</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No linked items</p>
            )}
          </div>

          {/* History */}
          <div>
            <span className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <History className="h-3 w-3" />
              History
            </span>
            <div className="space-y-2">
              {issue.history.map((entry, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="font-medium">{entry.user}</span>
                    <span className="text-muted-foreground"> {entry.action}</span>
                    {entry.details && (
                      <span className="text-muted-foreground"> - {entry.details}</span>
                    )}
                    <p className="text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <span className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Comments ({issue.comments.length})
            </span>
            <div className="space-y-3">
              {issue.comments.map((comment) => (
                <div key={comment.id} className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{comment.user}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex gap-2">
        <Button variant="outline" className="flex-1">
          <MessageSquare className="h-4 w-4 mr-2" />
          Add Comment
        </Button>
        <Button className="flex-1">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Update Status
        </Button>
      </div>
    </motion.div>
  );
}

export function IssuesRegisterView() {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredIssues = mockIssues.filter((issue) => {
    const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !activeFilter || issue.severity === activeFilter;
    const matchesStatus = !statusFilter || issue.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const criticalCount = mockIssues.filter(i => i.severity === 'critical').length;
  const breachedCount = mockIssues.filter(i => i.sla.breached).length;
  const openCount = mockIssues.filter(i => ['open', 'investigating', 'in-progress', 'blocked'].includes(i.status)).length;
  const resolvedCount = mockIssues.filter(i => ['resolved', 'closed'].includes(i.status)).length;

  const handleCreateAction = (issue: Issue) => {
    // This would trigger action creation workflow
    console.log('Create action from issue:', issue.id);
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Issues Register
              </h1>
              <p className="text-sm text-muted-foreground">Track and manage project issues, blockers, and incidents</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Advanced Filter
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Issue
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <KPICard
              title="Critical Issues"
              value={criticalCount}
              status={criticalCount > 0 ? 'error' : 'neutral'}
              icon={AlertCircle}
              className={criticalCount > 0 ? 'border-destructive/30' : ''}
            />
            <KPICard
              title="SLA Breached"
              value={breachedCount}
              status={breachedCount > 0 ? 'error' : 'success'}
              icon={Timer}
              className={breachedCount > 0 ? 'border-destructive/30' : ''}
            />
            <KPICard
              title="Open Issues"
              value={openCount}
              icon={Bug}
            />
            <KPICard
              title="Resolved"
              value={resolvedCount}
              status="success"
              icon={CheckCircle2}
            />
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues..."
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              {['critical', 'high', 'medium', 'low'].map((severity) => (
                <Badge
                  key={severity}
                  variant={activeFilter === severity ? getSeverityColor(severity as Issue['severity']) : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setActiveFilter(activeFilter === severity ? null : severity)}
                >
                  {severity}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {['open', 'investigating', 'in-progress', 'blocked', 'resolved'].map((status) => (
                <Badge
                  key={status}
                  variant={statusFilter === status ? getStatusColor(status as Issue['status']) : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                >
                  {status}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Issues List */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {filteredIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                isSelected={selectedIssue?.id === issue.id}
                onClick={() => setSelectedIssue(issue)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedIssue && (
          <IssueDetailPanel
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
            onCreateAction={handleCreateAction}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
