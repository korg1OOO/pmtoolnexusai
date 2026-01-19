import { useState } from 'react';
import { motion } from 'framer-motion';
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
  Flag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { KPICard } from '@/components/enterprise/KPICard';
import { StatusIndicator } from '@/components/enterprise/StatusIndicator';

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
}

const mockMilestones: Milestone[] = [
  { id: 'ms-1', name: 'Phase 1 Complete', project: 'Mobile App Redesign', status: 'completed', dueDate: '2024-03-15', owner: 'Emily Johnson', progress: 100, dependencies: 0, deliverables: ['UI Mockups', 'Technical Specs', 'Stakeholder Sign-off'] },
  { id: 'ms-2', name: 'Beta Release', project: 'Web Portal Enhancement', status: 'on-track', dueDate: '2024-06-30', owner: 'Robert Kim', progress: 75, dependencies: 2, deliverables: ['Feature Complete', 'QA Testing', 'Documentation'] },
  { id: 'ms-3', name: 'Data Migration Complete', project: 'CRM Integration', status: 'at-risk', dueDate: '2024-05-15', owner: 'Anna Martinez', progress: 45, dependencies: 3, deliverables: ['Schema Migration', 'Data Validation', 'Rollback Plan'] },
  { id: 'ms-4', name: 'Infrastructure Ready', project: 'Cloud Migration', status: 'overdue', dueDate: '2024-04-01', owner: 'Mark Thompson', progress: 60, dependencies: 1, deliverables: ['Environment Setup', 'Security Audit', 'Performance Baseline'] },
  { id: 'ms-5', name: 'Dashboard MVP', project: 'BI Dashboard Platform', status: 'on-track', dueDate: '2024-07-15', owner: 'Sophie Turner', progress: 55, dependencies: 2, deliverables: ['Core Dashboards', 'Data Connectors', 'User Training'] },
  { id: 'ms-6', name: 'Security Compliance', project: 'Network Infrastructure', status: 'on-track', dueDate: '2024-08-01', owner: 'Jennifer Brown', progress: 40, dependencies: 1, deliverables: ['Audit Report', 'Remediation Plan', 'Certification'] },
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

export function MilestonesView() {
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const filteredMilestones = filterStatus 
    ? mockMilestones.filter(m => m.status === filterStatus)
    : mockMilestones;

  const statusCounts = {
    completed: mockMilestones.filter(m => m.status === 'completed').length,
    onTrack: mockMilestones.filter(m => m.status === 'on-track').length,
    atRisk: mockMilestones.filter(m => m.status === 'at-risk').length,
    overdue: mockMilestones.filter(m => m.status === 'overdue').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Milestones</h1>
          <p className="text-sm text-muted-foreground mt-1">Track key deliverables and project checkpoints</p>
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
          title="On Track" 
          value={statusCounts.onTrack.toString()} 
          subtitle="Progressing as planned" 
          icon={Clock} 
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
        {(['timeline', 'list'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
              viewMode === mode 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Status Filters */}
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
                  <th className="p-4 font-medium">Dependencies</th>
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
                    <td className="p-4 text-sm text-center">{milestone.dependencies}</td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
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
    </div>
  );
}
