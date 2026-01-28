import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Search,
  X,
  User,
  Calendar,
  Link2,
  MoreHorizontal,
  AlertTriangle,
  Zap,
  Target,
  Users,
  ExternalLink,
  ArrowUpRight,
  History,
  MessageSquare,
  Flag,
  PlayCircle,
  PauseCircle,
  CircleDot,
  Timer,
  Bell,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { KPICard } from '@/components/enterprise/KPICard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface Action {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'not-started' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled';
  owner: string;
  createdBy: string;
  createdAt: string;
  dueDate: string;
  completedAt?: string;
  source: {
    type: 'meeting' | 'issue' | 'decision' | 'risk' | 'manual';
    id: string;
    title: string;
  };
  linkedItems: {
    type: 'task' | 'risk' | 'decision' | 'issue' | 'meeting';
    id: string;
    title: string;
  }[];
  progress: number;
  notes: string;
  history: {
    timestamp: string;
    user: string;
    action: string;
    details?: string;
  }[];
  tags: string[];
  dependencies: string[];
  blockedBy?: string;
  sla?: {
    targetHours: number;
    breached: boolean;
    remainingHours: number;
  };
}

const mockActions: Action[] = [
  {
    id: 'ACT-001',
    title: 'Configure load balancer auto-scaling rules',
    description: 'Set up automatic scaling policies for the API gateway load balancer to handle traffic spikes.',
    priority: 'critical',
    status: 'in-progress',
    owner: 'John Doe',
    createdBy: 'System',
    createdAt: '2024-01-20T08:30:00Z',
    dueDate: '2024-01-21T17:00:00Z',
    source: { type: 'issue', id: 'ISS-001', title: 'API Gateway timeout during peak load' },
    linkedItems: [
      { type: 'risk', id: 'R-003', title: 'Infrastructure capacity risk' },
      { type: 'task', id: 'T-045', title: 'Load balancer configuration' },
    ],
    progress: 60,
    notes: 'Testing configuration in staging environment',
    history: [
      { timestamp: '2024-01-20T08:30:00Z', user: 'System', action: 'Created from issue ISS-001' },
      { timestamp: '2024-01-20T09:00:00Z', user: 'John Doe', action: 'Assigned to self' },
      { timestamp: '2024-01-20T14:00:00Z', user: 'John Doe', action: 'Updated progress to 60%' },
    ],
    tags: ['infrastructure', 'performance'],
    dependencies: [],
    sla: { targetHours: 4, breached: true, remainingHours: -2 },
  },
  {
    id: 'ACT-002',
    title: 'Review and approve migration rollback plan',
    description: 'Review the proposed rollback strategy for database migration and approve for implementation.',
    priority: 'high',
    status: 'not-started',
    owner: 'Sarah Mitchell',
    createdBy: 'Emily Brown',
    createdAt: '2024-01-19T16:00:00Z',
    dueDate: '2024-01-20T12:00:00Z',
    source: { type: 'meeting', id: 'MTG-012', title: 'Sprint Planning Meeting' },
    linkedItems: [
      { type: 'decision', id: 'DEC-005', title: 'Migration strategy decision' },
      { type: 'issue', id: 'ISS-002', title: 'Database migration scripts failing' },
    ],
    progress: 0,
    notes: '',
    history: [
      { timestamp: '2024-01-19T16:00:00Z', user: 'Emily Brown', action: 'Created action' },
      { timestamp: '2024-01-19T16:05:00Z', user: 'Emily Brown', action: 'Assigned to Sarah Mitchell' },
    ],
    tags: ['database', 'migration', 'approval'],
    dependencies: ['ACT-003'],
    sla: { targetHours: 24, breached: true, remainingHours: -8 },
  },
  {
    id: 'ACT-003',
    title: 'Implement token refresh mechanism',
    description: 'Develop and deploy the authentication token refresh logic to prevent unexpected logouts.',
    priority: 'high',
    status: 'in-progress',
    owner: 'Jane Smith',
    createdBy: 'QA Team',
    createdAt: '2024-01-18T11:00:00Z',
    dueDate: '2024-01-22T17:00:00Z',
    source: { type: 'issue', id: 'ISS-003', title: 'Authentication token expiration not handled correctly' },
    linkedItems: [{ type: 'task', id: 'T-067', title: 'Auth module updates' }],
    progress: 75,
    notes: 'Implementation complete, pending code review',
    history: [
      { timestamp: '2024-01-18T11:00:00Z', user: 'QA Team', action: 'Created from issue ISS-003' },
      { timestamp: '2024-01-18T14:00:00Z', user: 'Jane Smith', action: 'Started implementation' },
      { timestamp: '2024-01-20T10:00:00Z', user: 'Jane Smith', action: 'Updated progress to 75%' },
    ],
    tags: ['authentication', 'security'],
    dependencies: [],
    sla: { targetHours: 48, breached: false, remainingHours: 24 },
  },
  {
    id: 'ACT-004',
    title: 'Schedule meeting with Stripe support',
    description: 'Arrange a technical call with Stripe support to resolve payment integration issues.',
    priority: 'medium',
    status: 'on-hold',
    owner: 'David Wilson',
    createdBy: 'David Wilson',
    createdAt: '2024-01-20T10:00:00Z',
    dueDate: '2024-01-23T17:00:00Z',
    source: { type: 'issue', id: 'ISS-005', title: 'Third-party payment integration sporadic failures' },
    linkedItems: [{ type: 'meeting', id: 'MTG-008', title: 'Stripe integration review' }],
    progress: 30,
    notes: 'Waiting for Stripe to confirm availability',
    history: [
      { timestamp: '2024-01-20T10:00:00Z', user: 'David Wilson', action: 'Created action' },
      { timestamp: '2024-01-20T10:30:00Z', user: 'David Wilson', action: 'Submitted support request' },
      { timestamp: '2024-01-20T15:00:00Z', user: 'David Wilson', action: 'Put on hold - waiting for response' },
    ],
    tags: ['integration', 'payments'],
    dependencies: [],
    blockedBy: 'Stripe support response',
    sla: { targetHours: 72, breached: false, remainingHours: 48 },
  },
  {
    id: 'ACT-005',
    title: 'Update API documentation for new endpoints',
    description: 'Document all new API endpoints added in the current sprint for the developer portal.',
    priority: 'medium',
    status: 'completed',
    owner: 'Mike Johnson',
    createdBy: 'Tech Lead',
    createdAt: '2024-01-15T09:00:00Z',
    dueDate: '2024-01-19T17:00:00Z',
    completedAt: '2024-01-18T16:00:00Z',
    source: { type: 'meeting', id: 'MTG-010', title: 'Weekly Team Sync' },
    linkedItems: [{ type: 'task', id: 'T-089', title: 'API documentation update' }],
    progress: 100,
    notes: 'Documentation published to developer portal',
    history: [
      { timestamp: '2024-01-15T09:00:00Z', user: 'Tech Lead', action: 'Created action' },
      { timestamp: '2024-01-15T10:00:00Z', user: 'Mike Johnson', action: 'Assigned to self' },
      { timestamp: '2024-01-18T16:00:00Z', user: 'Mike Johnson', action: 'Marked as completed' },
    ],
    tags: ['documentation', 'api'],
    dependencies: [],
  },
  {
    id: 'ACT-006',
    title: 'Finalize vendor contract for cloud services',
    description: 'Complete contract negotiations and get final sign-off for expanded cloud infrastructure.',
    priority: 'high',
    status: 'not-started',
    owner: 'Sarah Mitchell',
    createdBy: 'Executive Team',
    createdAt: '2024-01-19T11:00:00Z',
    dueDate: '2024-01-25T17:00:00Z',
    source: { type: 'decision', id: 'DEC-008', title: 'Cloud vendor selection' },
    linkedItems: [{ type: 'risk', id: 'R-012', title: 'Vendor dependency risk' }],
    progress: 0,
    notes: '',
    history: [{ timestamp: '2024-01-19T11:00:00Z', user: 'Executive Team', action: 'Created from decision DEC-008' }],
    tags: ['procurement', 'contracts'],
    dependencies: [],
    sla: { targetHours: 120, breached: false, remainingHours: 96 },
  },
];

const getPriorityColor = (priority: Action['priority']) => {
  switch (priority) {
    case 'critical': return 'destructive';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'secondary';
  }
};

const getStatusColor = (status: Action['status']): "secondary" | "info" | "warning" | "success" | "outline" => {
  switch (status) {
    case 'not-started': return 'secondary';
    case 'in-progress': return 'info';
    case 'on-hold': return 'warning';
    case 'completed': return 'success';
    case 'cancelled': return 'outline';
  }
};

const getStatusIcon = (status: Action['status']) => {
  switch (status) {
    case 'not-started': return CircleDot;
    case 'in-progress': return PlayCircle;
    case 'on-hold': return PauseCircle;
    case 'completed': return CheckCircle2;
    case 'cancelled': return X;
  }
};

const getSourceIcon = (type: Action['source']['type']) => {
  switch (type) {
    case 'meeting': return Users;
    case 'issue': return AlertTriangle;
    case 'decision': return Target;
    case 'risk': return Flag;
    case 'manual': return Plus;
  }
};

// SLA Timer Component
function SLATimer({ sla, status }: { sla?: Action['sla']; status: Action['status'] }) {
  const [timeRemaining, setTimeRemaining] = useState(sla?.remainingHours || 0);

  useEffect(() => {
    if (!sla || status === 'completed' || status === 'cancelled') return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - (1/3600)); // Decrease by 1 second in hours
    }, 1000);

    return () => clearInterval(timer);
  }, [sla, status]);

  if (!sla || status === 'completed' || status === 'cancelled') return null;

  const isBreached = sla.breached || timeRemaining <= 0;
  const isWarning = !isBreached && timeRemaining < sla.targetHours * 0.25;
  const hours = Math.abs(Math.floor(timeRemaining));
  const minutes = Math.abs(Math.floor((timeRemaining % 1) * 60));

  return (
    <div className={cn(
      'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
      isBreached ? 'bg-destructive/10 text-destructive' :
      isWarning ? 'bg-warning/10 text-warning' :
      'bg-muted text-muted-foreground'
    )}>
      <Timer className="h-3 w-3" />
      {isBreached ? (
        <span>SLA Breached ({hours}h {minutes}m over)</span>
      ) : (
        <span>{hours}h {minutes}m remaining</span>
      )}
    </div>
  );
}

interface ActionCardProps {
  action: Action;
  isSelected: boolean;
  onClick: () => void;
}

function ActionCard({ action, isSelected, onClick }: ActionCardProps) {
  const StatusIcon = getStatusIcon(action.status);
  const SourceIcon = getSourceIcon(action.source.type);
  const isOverdue = new Date(action.dueDate) < new Date() && action.status !== 'completed' && action.status !== 'cancelled';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border cursor-pointer transition-all group',
        isSelected ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50',
        isOverdue && 'border-destructive/50',
        action.sla?.breached && 'ring-1 ring-destructive/30'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
          action.status === 'completed' ? 'bg-success/10' : 
          action.status === 'on-hold' ? 'bg-warning/10' : 
          action.sla?.breached ? 'bg-destructive/10' : 'bg-muted'
        )}>
          <StatusIcon className={cn(
            'h-5 w-5',
            action.status === 'completed' ? 'text-success' :
            action.status === 'on-hold' ? 'text-warning' : 
            action.sla?.breached ? 'text-destructive' : 'text-muted-foreground'
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{action.id}</span>
            <Badge variant={getPriorityColor(action.priority)}>{action.priority}</Badge>
            <Badge variant={getStatusColor(action.status)}>{action.status}</Badge>
            {action.sla?.breached && (
              <Badge variant="destructive" className="gap-1">
                <Bell className="h-3 w-3" />
                SLA Breach
              </Badge>
            )}
          </div>
          
          <h3 className="font-medium text-sm line-clamp-1 mb-1">{action.title}</h3>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {action.owner}
            </span>
            <span className={cn(
              'flex items-center gap-1',
              isOverdue && 'text-destructive font-medium'
            )}>
              <Calendar className="h-3 w-3" />
              {isOverdue ? 'OVERDUE: ' : ''}
              {new Date(action.dueDate).toLocaleDateString()}
            </span>
          </div>

          {/* SLA Timer */}
          <SLATimer sla={action.sla} status={action.status} />

          {/* Source Reference */}
          <div className="flex items-center gap-2 text-xs mt-2">
            <SourceIcon className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">From:</span>
            <Badge variant="outline" className="text-xs">
              {action.source.type}
            </Badge>
            <span className="truncate">{action.source.title}</span>
          </div>

          {/* Progress Bar */}
          {action.status !== 'completed' && action.status !== 'cancelled' && (
            <div className="flex items-center gap-2 mt-2">
              <Progress value={action.progress} className="flex-1 h-1.5" />
              <span className="text-xs text-muted-foreground">{action.progress}%</span>
            </div>
          )}
        </div>

        <Button variant="ghost" size="iconXs" className="opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

interface ActionDetailPanelProps {
  action: Action;
  onClose: () => void;
}

function ActionDetailPanel({ action, onClose }: ActionDetailPanelProps) {
  const StatusIcon = getStatusIcon(action.status);
  const SourceIcon = getSourceIcon(action.source.type);
  const isOverdue = new Date(action.dueDate) < new Date() && action.status !== 'completed' && action.status !== 'cancelled';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-[480px] border-l bg-card flex flex-col h-full"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <span className="font-mono text-sm">{action.id}</span>
        </div>
        <Button variant="ghost" size="iconSm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant={getPriorityColor(action.priority)}>{action.priority}</Badge>
              <Badge variant={getStatusColor(action.status)}>{action.status}</Badge>
              {isOverdue && <Badge variant="destructive">OVERDUE</Badge>}
              {action.sla?.breached && (
                <Badge variant="destructive" className="gap-1">
                  <Bell className="h-3 w-3" />
                  SLA Breached
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-semibold mb-2">{action.title}</h2>
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </div>

          {/* SLA Card */}
          {action.sla && (
            <Card className={cn(
              'border-l-4',
              action.sla.breached ? 'border-l-destructive bg-destructive/5' : 
              action.sla.remainingHours < action.sla.targetHours * 0.25 ? 'border-l-warning bg-warning/5' :
              'border-l-success bg-success/5'
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    <span className="text-sm font-medium">SLA Target</span>
                  </div>
                  <span className="text-lg font-bold">{action.sla.targetHours}h</span>
                </div>
                <Progress 
                  value={action.sla.breached ? 100 : Math.max(0, 100 - (action.sla.remainingHours / action.sla.targetHours * 100))} 
                  className="h-2 mb-2" 
                />
                <div className="flex items-center justify-between text-xs">
                  <span className={action.sla.breached ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                    {action.sla.breached 
                      ? `Breached by ${Math.abs(action.sla.remainingHours)}h`
                      : `${action.sla.remainingHours}h remaining`
                    }
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round((1 - action.sla.remainingHours / action.sla.targetHours) * 100)}% elapsed
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-lg font-bold">{action.progress}%</span>
              </div>
              <Progress value={action.progress} className="h-2" />
              {action.notes && (
                <p className="text-xs text-muted-foreground mt-2">{action.notes}</p>
              )}
            </CardContent>
          </Card>

          {/* Source */}
          <Card className="border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <SourceIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Source</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{action.source.type}</Badge>
                  <span className="text-sm">{action.source.id}</span>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm mt-2">{action.source.title}</p>
            </CardContent>
          </Card>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Owner</span>
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">{action.owner.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{action.owner}</span>
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Created By</span>
              <p className="text-sm mt-1">{action.createdBy}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Due Date</span>
              <p className={cn('text-sm mt-1', isOverdue && 'text-destructive font-medium')}>
                {new Date(action.dueDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Created</span>
              <p className="text-sm mt-1">{new Date(action.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Blocked By */}
          {action.blockedBy && (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium">Blocked By</span>
                </div>
                <p className="text-sm mt-1">{action.blockedBy}</p>
              </CardContent>
            </Card>
          )}

          {/* Dependencies */}
          {action.dependencies.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-2 block">Dependencies</span>
              <div className="space-y-1">
                {action.dependencies.map((dep) => (
                  <Badge key={dep} variant="outline">{dep}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {action.tags.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-2 block">Tags</span>
              <div className="flex flex-wrap gap-1">
                {action.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Linked Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                Linked Items
              </span>
            </div>
            {action.linkedItems.length > 0 ? (
              <div className="space-y-1">
                {action.linkedItems.map((item) => (
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
              {action.history.map((entry, i) => (
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
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex gap-2">
        <Button variant="outline" className="flex-1">
          <MessageSquare className="h-4 w-4 mr-2" />
          Add Note
        </Button>
        <Button className="flex-1">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Update Status
        </Button>
      </div>
    </motion.div>
  );
}

export function ActionsView() {
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'sla-breached' | 'my-actions'>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');

  const filteredActions = useMemo(() => {
    return mockActions.filter((action) => {
      const matchesSearch = action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = !priorityFilter || action.priority === priorityFilter;
      const matchesStatus = !statusFilter || action.status === statusFilter;
      const matchesView = viewMode === 'all' || 
        (viewMode === 'sla-breached' && action.sla?.breached) ||
        (viewMode === 'my-actions' && action.owner === 'John Doe'); // Mock current user
      const matchesOwner = ownerFilter === 'all' || action.owner === ownerFilter;
      return matchesSearch && matchesPriority && matchesStatus && matchesView && matchesOwner;
    });
  }, [searchQuery, priorityFilter, statusFilter, viewMode, ownerFilter]);

  const totalActions = mockActions.length;
  const completedActions = mockActions.filter(a => a.status === 'completed').length;
  const inProgressActions = mockActions.filter(a => a.status === 'in-progress').length;
  const overdueActions = mockActions.filter(a => 
    new Date(a.dueDate) < new Date() && a.status !== 'completed' && a.status !== 'cancelled'
  ).length;
  const slaBreachedCount = mockActions.filter(a => a.sla?.breached).length;

  const uniqueOwners = [...new Set(mockActions.map(a => a.owner))];

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Actions Tracker
              </h1>
              <p className="text-sm text-muted-foreground">Track and manage action items with SLA monitoring</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-1" />
                SLA Report
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Action
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-5 gap-4 mb-4">
            <KPICard
              title="Total Actions"
              value={totalActions}
              icon={CheckCircle2}
            />
            <KPICard
              title="Completed"
              value={completedActions}
              subtitle={`${Math.round((completedActions / totalActions) * 100)}%`}
              status="success"
              icon={CheckCircle2}
            />
            <KPICard
              title="In Progress"
              value={inProgressActions}
              status="info"
              icon={PlayCircle}
            />
            <KPICard
              title="SLA Breached"
              value={slaBreachedCount}
              status={slaBreachedCount > 0 ? 'error' : 'success'}
              icon={Timer}
              className={slaBreachedCount > 0 ? 'border-destructive/30' : ''}
            />
            <KPICard
              title="Overdue"
              value={overdueActions}
              status={overdueActions > 0 ? 'error' : 'neutral'}
              icon={AlertTriangle}
              className={overdueActions > 0 ? 'border-destructive/30' : ''}
            />
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setViewMode('all')}
                className={cn(
                  'px-3 py-1 rounded text-sm font-medium transition-all',
                  viewMode === 'all' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                All Actions
              </button>
              <button
                onClick={() => setViewMode('sla-breached')}
                className={cn(
                  'px-3 py-1 rounded text-sm font-medium transition-all flex items-center gap-1',
                  viewMode === 'sla-breached' ? 'bg-destructive text-destructive-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Bell className="h-3 w-3" />
                SLA Breached
                {slaBreachedCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-destructive/20 text-[10px]">
                    {slaBreachedCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setViewMode('my-actions')}
                className={cn(
                  'px-3 py-1 rounded text-sm font-medium transition-all',
                  viewMode === 'my-actions' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                My Actions
              </button>
            </div>

            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                {uniqueOwners.map(owner => (
                  <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actions..."
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              {['critical', 'high', 'medium', 'low'].map((priority) => (
                <Badge
                  key={priority}
                  variant={priorityFilter === priority ? getPriorityColor(priority as Action['priority']) : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setPriorityFilter(priorityFilter === priority ? null : priority)}
                >
                  {priority}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {['not-started', 'in-progress', 'on-hold', 'completed'].map((status) => (
                <Badge
                  key={status}
                  variant={statusFilter === status ? getStatusColor(status as Action['status']) : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                >
                  {status}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Actions List */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {filteredActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                isSelected={selectedAction?.id === action.id}
                onClick={() => setSelectedAction(action)}
              />
            ))}
            {filteredActions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No actions match your filters</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedAction && (
          <ActionDetailPanel
            action={selectedAction}
            onClose={() => setSelectedAction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
