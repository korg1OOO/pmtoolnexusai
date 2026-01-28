import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  FileEdit,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  DollarSign,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  type: 'scope' | 'schedule' | 'cost' | 'resource';
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'implemented';
  priority: 'low' | 'medium' | 'high' | 'critical';
  requestedBy: string;
  requestDate: string;
  approver?: string;
  approvalDate?: string;
  impact: {
    schedule: number; // days
    cost: number;
    risk: 'low' | 'medium' | 'high';
    scope: string;
  };
  affectedTasks: string[];
  justification: string;
  alternatives?: string;
}

const mockChangeRequests: ChangeRequest[] = [
  {
    id: 'CR-001',
    title: 'Add Real-time Analytics Dashboard',
    description: 'Implement real-time analytics capabilities to the migration dashboard for monitoring migration progress',
    type: 'scope',
    status: 'pending',
    priority: 'high',
    requestedBy: 'Lisa Chen',
    requestDate: '2024-08-01',
    impact: {
      schedule: 14,
      cost: 85000,
      risk: 'medium',
      scope: 'Additional development sprint required',
    },
    affectedTasks: ['T-011', 'T-012'],
    justification: 'Business needs real-time visibility into migration progress for executive reporting',
    alternatives: 'Use existing monitoring tools with manual reporting',
  },
  {
    id: 'CR-002',
    title: 'Accelerate Wave 2 Timeline',
    description: 'Compress Wave 2 migration timeline by adding additional resources',
    type: 'schedule',
    status: 'approved',
    priority: 'critical',
    requestedBy: 'Sarah Mitchell',
    requestDate: '2024-07-15',
    approver: 'James Morrison',
    approvalDate: '2024-07-18',
    impact: {
      schedule: -21,
      cost: 120000,
      risk: 'high',
      scope: 'No scope change, resource increase only',
    },
    affectedTasks: ['T-012'],
    justification: 'Business deadline moved forward due to regulatory requirements',
  },
  {
    id: 'CR-003',
    title: 'Additional Cloud Security Tools',
    description: 'Implement advanced threat detection and security monitoring tools',
    type: 'cost',
    status: 'approved',
    priority: 'high',
    requestedBy: 'Robert Williams',
    requestDate: '2024-06-20',
    approver: 'Sarah Mitchell',
    approvalDate: '2024-06-25',
    impact: {
      schedule: 7,
      cost: 45000,
      risk: 'low',
      scope: 'Add security tools to infrastructure stack',
    },
    affectedTasks: ['T-010', 'T-015'],
    justification: 'Required for compliance with updated security policies',
  },
  {
    id: 'CR-004',
    title: 'Reduce Testing Scope for Non-Critical Apps',
    description: 'Exclude Tier-3 applications from full regression testing',
    type: 'scope',
    status: 'rejected',
    priority: 'medium',
    requestedBy: 'John Doe',
    requestDate: '2024-07-28',
    approver: 'Sarah Mitchell',
    approvalDate: '2024-07-30',
    impact: {
      schedule: -10,
      cost: -25000,
      risk: 'high',
      scope: 'Reduced testing coverage',
    },
    affectedTasks: ['T-015'],
    justification: 'Reduce timeline pressure on testing phase',
    alternatives: 'Rejected due to compliance requirements',
  },
  {
    id: 'CR-005',
    title: 'Add Disaster Recovery Environment',
    description: 'Provision a complete DR environment in secondary region',
    type: 'cost',
    status: 'draft',
    priority: 'high',
    requestedBy: 'Mike Johnson',
    requestDate: '2024-08-05',
    impact: {
      schedule: 21,
      cost: 200000,
      risk: 'low',
      scope: 'New DR infrastructure and testing',
    },
    affectedTasks: ['T-010', 'T-016'],
    justification: 'Enterprise requirement for business continuity',
  },
];

export function ChangeRequestsView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCR, setSelectedCR] = useState<ChangeRequest | null>(null);

  const filteredCRs = mockChangeRequests.filter(cr =>
    cr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cr.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: mockChangeRequests.length,
    pending: mockChangeRequests.filter(cr => cr.status === 'pending').length,
    approved: mockChangeRequests.filter(cr => cr.status === 'approved').length,
    totalCostImpact: mockChangeRequests
      .filter(cr => cr.status === 'approved')
      .reduce((sum, cr) => sum + cr.impact.cost, 0),
    totalScheduleImpact: mockChangeRequests
      .filter(cr => cr.status === 'approved')
      .reduce((sum, cr) => sum + cr.impact.schedule, 0),
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      case 'implemented': return <CheckCircle2 className="h-4 w-4 text-primary" />;
      default: return <FileEdit className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scope': return 'bg-purple-500/20 text-purple-600';
      case 'schedule': return 'bg-blue-500/20 text-blue-600';
      case 'cost': return 'bg-amber-500/20 text-amber-600';
      case 'resource': return 'bg-green-500/20 text-green-600';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b bg-card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <FileEdit className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Change Requests</h1>
              <p className="text-muted-foreground">Manage scope, schedule, and cost change requests</p>
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Change Request
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 border-b grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending Approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{stats.approved}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={cn(
              "text-2xl font-bold",
              stats.totalCostImpact > 0 ? 'text-destructive' : 'text-success'
            )}>
              {stats.totalCostImpact > 0 ? '+' : ''}${(stats.totalCostImpact / 1000).toFixed(0)}K
            </div>
            <p className="text-sm text-muted-foreground">Cost Impact</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={cn(
              "text-2xl font-bold",
              stats.totalScheduleImpact > 0 ? 'text-destructive' : 'text-success'
            )}>
              {stats.totalScheduleImpact > 0 ? '+' : ''}{stats.totalScheduleImpact} days
            </div>
            <p className="text-sm text-muted-foreground">Schedule Impact</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="p-4 border-b flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search change requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* List */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {filteredCRs.map((cr) => (
              <motion.div
                key={cr.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ x: 2 }}
                onClick={() => setSelectedCR(cr)}
                className={cn(
                  "p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer",
                  selectedCR?.id === cr.id && 'border-primary bg-primary/5'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(cr.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{cr.id}</span>
                        <h3 className="font-semibold">{cr.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{cr.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-1 rounded text-xs font-medium", getTypeColor(cr.type))}>
                      {cr.type}
                    </span>
                    <Badge variant={
                      cr.status === 'approved' ? 'success' :
                      cr.status === 'rejected' ? 'destructive' :
                      cr.status === 'pending' ? 'warning' : 'secondary'
                    }>
                      {cr.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    {cr.requestedBy}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(cr.requestDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cr.priority === 'critical' ? 'destructive' : cr.priority === 'high' ? 'warning' : 'secondary'}>
                      {cr.priority}
                    </Badge>
                  </div>
                </div>

                {/* Impact Preview */}
                <div className="mt-3 pt-3 border-t flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className={cn(
                      cr.impact.schedule > 0 ? 'text-destructive' : cr.impact.schedule < 0 ? 'text-success' : ''
                    )}>
                      {cr.impact.schedule > 0 ? '+' : ''}{cr.impact.schedule} days
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className={cn(
                      cr.impact.cost > 0 ? 'text-destructive' : cr.impact.cost < 0 ? 'text-success' : ''
                    )}>
                      {cr.impact.cost > 0 ? '+' : ''}${Math.abs(cr.impact.cost / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <Badge variant={
                    cr.impact.risk === 'high' ? 'destructive' :
                    cr.impact.risk === 'medium' ? 'warning' : 'success'
                  }>
                    {cr.impact.risk} risk
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedCR && (
          <div className="w-96 border-l p-6 overflow-auto bg-muted/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Change Request Details</h2>
              <Badge variant="outline">{selectedCR.id}</Badge>
            </div>

            <Tabs defaultValue="details" className="space-y-4">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="impact">Impact</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <p className="text-sm capitalize">{selectedCR.type}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Priority</label>
                  <Badge variant={selectedCR.priority === 'critical' ? 'destructive' : selectedCR.priority === 'high' ? 'warning' : 'secondary'} className="mt-1">
                    {selectedCR.priority}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Requested By</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {selectedCR.requestedBy.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{selectedCR.requestedBy}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Justification</label>
                  <p className="text-sm mt-1">{selectedCR.justification}</p>
                </div>
                {selectedCR.alternatives && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Alternatives Considered</label>
                    <p className="text-sm mt-1">{selectedCR.alternatives}</p>
                  </div>
                )}
                {selectedCR.approver && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Approver</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {selectedCR.approver.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{selectedCR.approver}</span>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="impact" className="space-y-4">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Schedule Impact</span>
                      <span className={cn(
                        "font-semibold",
                        selectedCR.impact.schedule > 0 ? 'text-destructive' : 'text-success'
                      )}>
                        {selectedCR.impact.schedule > 0 ? '+' : ''}{selectedCR.impact.schedule} days
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Cost Impact</span>
                      <span className={cn(
                        "font-semibold",
                        selectedCR.impact.cost > 0 ? 'text-destructive' : 'text-success'
                      )}>
                        {selectedCR.impact.cost > 0 ? '+' : ''}${(selectedCR.impact.cost / 1000).toFixed(0)}K
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Risk Level</span>
                      <Badge variant={
                        selectedCR.impact.risk === 'high' ? 'destructive' :
                        selectedCR.impact.risk === 'medium' ? 'warning' : 'success'
                      }>
                        {selectedCR.impact.risk}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Scope Impact</label>
                  <p className="text-sm mt-1">{selectedCR.impact.scope}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Affected Tasks</label>
                  <div className="mt-1 space-y-1">
                    {selectedCR.affectedTasks.map((taskId) => (
                      <Badge key={taskId} variant="outline" className="mr-1">
                        {taskId}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {selectedCR.status === 'pending' && (
              <div className="mt-6 pt-4 border-t flex gap-2">
                <Button variant="outline" className="flex-1">
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button className="flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
