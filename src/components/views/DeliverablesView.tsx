import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Package,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Link2,
  Calendar,
  User,
  MoreHorizontal,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Deliverable {
  id: string;
  name: string;
  description: string;
  phase: string;
  type: 'document' | 'system' | 'process' | 'training' | 'other';
  status: 'not-started' | 'in-progress' | 'review' | 'approved' | 'rejected';
  owner: string;
  dueDate: string;
  completedDate?: string;
  progress: number;
  linkedTasks: string[];
  acceptanceCriteria: { text: string; met: boolean }[];
}

const mockDeliverables: Deliverable[] = [
  {
    id: 'DEL-001',
    name: 'Cloud Architecture Design Document',
    description: 'Comprehensive architecture design for the target cloud infrastructure',
    phase: 'Phase 2: Design',
    type: 'document',
    status: 'approved',
    owner: 'Mike Johnson',
    dueDate: '2024-04-30',
    completedDate: '2024-04-28',
    progress: 100,
    linkedTasks: ['T-006', 'T-007'],
    acceptanceCriteria: [
      { text: 'All components documented', met: true },
      { text: 'Security review passed', met: true },
      { text: 'Stakeholder sign-off', met: true },
    ],
  },
  {
    id: 'DEL-002',
    name: 'Data Migration Framework',
    description: 'Automated framework for migrating data from legacy to cloud systems',
    phase: 'Phase 3: Implementation',
    type: 'system',
    status: 'in-progress',
    owner: 'Emily Brown',
    dueDate: '2024-09-15',
    progress: 65,
    linkedTasks: ['T-013'],
    acceptanceCriteria: [
      { text: 'Handles all data types', met: true },
      { text: 'Rollback capability', met: true },
      { text: 'Performance benchmarks met', met: false },
      { text: 'Zero data loss verified', met: false },
    ],
  },
  {
    id: 'DEL-003',
    name: 'API Gateway Configuration',
    description: 'Production-ready API gateway with security and rate limiting',
    phase: 'Phase 3: Implementation',
    type: 'system',
    status: 'review',
    owner: 'Mike Johnson',
    dueDate: '2024-08-31',
    progress: 90,
    linkedTasks: ['T-011'],
    acceptanceCriteria: [
      { text: 'All endpoints configured', met: true },
      { text: 'Security policies applied', met: true },
      { text: 'Load testing passed', met: false },
    ],
  },
  {
    id: 'DEL-004',
    name: 'User Training Materials',
    description: 'Complete training documentation and videos for end users',
    phase: 'Phase 5: Go-Live',
    type: 'training',
    status: 'not-started',
    owner: 'Lisa Chen',
    dueDate: '2024-11-30',
    progress: 0,
    linkedTasks: ['T-016'],
    acceptanceCriteria: [
      { text: 'All user roles covered', met: false },
      { text: 'Video tutorials created', met: false },
      { text: 'Quick reference guides', met: false },
    ],
  },
  {
    id: 'DEL-005',
    name: 'Security Compliance Report',
    description: 'Documentation demonstrating compliance with security requirements',
    phase: 'Phase 4: Testing',
    type: 'document',
    status: 'in-progress',
    owner: 'Robert Williams',
    dueDate: '2024-10-31',
    progress: 40,
    linkedTasks: ['T-015'],
    acceptanceCriteria: [
      { text: 'All controls documented', met: true },
      { text: 'Audit evidence collected', met: false },
      { text: 'External audit passed', met: false },
    ],
  },
];

export function DeliverablesView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);

  const filteredDeliverables = mockDeliverables.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: mockDeliverables.length,
    approved: mockDeliverables.filter(d => d.status === 'approved').length,
    inProgress: mockDeliverables.filter(d => d.status === 'in-progress').length,
    review: mockDeliverables.filter(d => d.status === 'review').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-primary animate-pulse" />;
      case 'review': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'system': return <Package className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b bg-card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Deliverables</h1>
              <p className="text-muted-foreground">Track project outputs and acceptance criteria</p>
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Deliverable
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 border-b grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Deliverables</p>
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
            <div className="text-2xl font-bold text-primary">{stats.inProgress}</div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{stats.review}</div>
            <p className="text-sm text-muted-foreground">In Review</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="p-4 border-b flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deliverables..."
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
        {/* Deliverables List */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {filteredDeliverables.map((deliverable) => (
              <motion.div
                key={deliverable.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ x: 2 }}
                onClick={() => setSelectedDeliverable(deliverable)}
                className={cn(
                  "p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer",
                  selectedDeliverable?.id === deliverable.id && 'border-primary bg-primary/5'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      deliverable.status === 'approved' ? 'bg-success/20' :
                      deliverable.status === 'in-progress' ? 'bg-primary/20' :
                      deliverable.status === 'review' ? 'bg-warning/20' : 'bg-muted'
                    )}>
                      {getTypeIcon(deliverable.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{deliverable.name}</h3>
                        <Badge variant={
                          deliverable.status === 'approved' ? 'success' :
                          deliverable.status === 'in-progress' ? 'info' :
                          deliverable.status === 'review' ? 'warning' : 'secondary'
                        }>
                          {deliverable.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{deliverable.description}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="iconSm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    {deliverable.owner}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Due: {new Date(deliverable.dueDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Link2 className="h-4 w-4" />
                    {deliverable.linkedTasks.length} linked tasks
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <Progress value={deliverable.progress} className="flex-1 h-2" />
                  <span className="text-sm font-medium">{deliverable.progress}%</span>
                </div>

                {/* Acceptance Criteria Preview */}
                <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground">Acceptance Criteria:</span>
                  <span className="text-success">
                    {deliverable.acceptanceCriteria.filter(c => c.met).length} met
                  </span>
                  <span className="text-muted-foreground">
                    {deliverable.acceptanceCriteria.filter(c => !c.met).length} pending
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedDeliverable && (
          <div className="w-96 border-l p-6 overflow-auto bg-muted/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Details</h2>
              <Badge variant="outline">{selectedDeliverable.id}</Badge>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="criteria">Criteria</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Phase</label>
                  <p className="text-sm">{selectedDeliverable.phase}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <p className="text-sm capitalize">{selectedDeliverable.type}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Owner</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {selectedDeliverable.owner.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{selectedDeliverable.owner}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                  <p className="text-sm">{new Date(selectedDeliverable.dueDate).toLocaleDateString()}</p>
                </div>
                {selectedDeliverable.completedDate && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Completed</label>
                    <p className="text-sm">{new Date(selectedDeliverable.completedDate).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Linked Tasks</label>
                  <div className="mt-1 space-y-1">
                    {selectedDeliverable.linkedTasks.map((taskId) => (
                      <div key={taskId} className="flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline">
                        <Link2 className="h-3 w-3" />
                        {taskId}
                        <ArrowUpRight className="h-3 w-3" />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="criteria" className="space-y-3">
                {selectedDeliverable.acceptanceCriteria.map((criteria, i) => (
                  <div key={i} className={cn(
                    "p-3 rounded-lg border",
                    criteria.met ? 'bg-success/10 border-success/30' : 'bg-muted/50'
                  )}>
                    <div className="flex items-start gap-2">
                      {criteria.met ? (
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      )}
                      <span className="text-sm">{criteria.text}</span>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
