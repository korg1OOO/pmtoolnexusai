import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  GitBranch,
  Link2,
  Search,
  Filter,
  X,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Target,
  Users,
  Clock,
  Bug,
  Calendar,
  Layers,
  ArrowUpRight,
  ExternalLink,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TraceabilityItem {
  id: string;
  type: 'sprint' | 'issue' | 'action' | 'decision' | 'risk' | 'meeting' | 'task';
  title: string;
  status: string;
  linkedTo: { type: string; id: string; title: string }[];
}

const mockTraceabilityData: TraceabilityItem[] = [
  {
    id: 'SP-012',
    type: 'sprint',
    title: 'Sprint 12 - API Gateway & Infrastructure',
    status: 'active',
    linkedTo: [
      { type: 'task', id: 'T-011', title: 'Application Migration - Wave 1' },
      { type: 'task', id: 'T-013', title: 'Data Migration' },
      { type: 'issue', id: 'ISS-001', title: 'API Gateway timeout during peak load' },
      { type: 'meeting', id: 'MTG-002', title: 'Sprint 12 Daily Standup' },
      { type: 'action', id: 'ACT-001', title: 'Configure load balancer auto-scaling rules' },
    ],
  },
  {
    id: 'ISS-001',
    type: 'issue',
    title: 'API Gateway timeout during peak load',
    status: 'investigating',
    linkedTo: [
      { type: 'risk', id: 'RSK-001', title: 'Vendor Lock-in with Cloud Provider' },
      { type: 'action', id: 'ACT-001', title: 'Configure load balancer auto-scaling rules' },
      { type: 'sprint', id: 'SP-012', title: 'Sprint 12' },
      { type: 'decision', id: 'DEC-002', title: 'Scale infrastructure horizontally' },
    ],
  },
  {
    id: 'ACT-001',
    type: 'action',
    title: 'Configure load balancer auto-scaling rules',
    status: 'in-progress',
    linkedTo: [
      { type: 'issue', id: 'ISS-001', title: 'API Gateway timeout' },
      { type: 'risk', id: 'RSK-001', title: 'Infrastructure capacity risk' },
      { type: 'task', id: 'T-045', title: 'Load balancer configuration' },
    ],
  },
  {
    id: 'DEC-001',
    type: 'decision',
    title: 'Use multi-cloud architecture',
    status: 'active',
    linkedTo: [
      { type: 'risk', id: 'RSK-001', title: 'Vendor Lock-in' },
      { type: 'task', id: 'T-006', title: 'Cloud Architecture Design' },
      { type: 'meeting', id: 'MTG-001', title: 'Steering Committee' },
    ],
  },
  {
    id: 'RSK-001',
    type: 'risk',
    title: 'Vendor Lock-in with Cloud Provider',
    status: 'mitigating',
    linkedTo: [
      { type: 'decision', id: 'DEC-001', title: 'Multi-cloud architecture' },
      { type: 'action', id: 'ACT-006', title: 'Finalize vendor contract' },
      { type: 'task', id: 'T-006', title: 'Cloud Architecture Design' },
    ],
  },
  {
    id: 'MTG-001',
    type: 'meeting',
    title: 'Weekly Steering Committee',
    status: 'scheduled',
    linkedTo: [
      { type: 'decision', id: 'DEC-001', title: 'Multi-cloud architecture' },
      { type: 'risk', id: 'RSK-002', title: 'Data Migration Complexity' },
      { type: 'action', id: 'ACT-002', title: 'Review rollback plan' },
    ],
  },
];

const typeConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  sprint: { color: 'bg-sprint-todo', icon: Clock, label: 'Sprint' },
  issue: { color: 'bg-destructive', icon: Bug, label: 'Issue' },
  action: { color: 'bg-primary', icon: CheckCircle2, label: 'Action' },
  decision: { color: 'bg-purple-500', icon: Target, label: 'Decision' },
  risk: { color: 'bg-warning', icon: AlertTriangle, label: 'Risk' },
  meeting: { color: 'bg-info', icon: Users, label: 'Meeting' },
  task: { color: 'bg-success', icon: Calendar, label: 'Task' },
};

interface MatrixCellProps {
  from: TraceabilityItem;
  to: string;
  hasLink: boolean;
}

function MatrixCell({ from, to, hasLink }: MatrixCellProps) {
  const linkedItem = from.linkedTo.find(l => l.type === to);
  
  return (
    <div className={cn(
      'h-10 flex items-center justify-center border-r border-b transition-colors',
      hasLink ? 'bg-primary/10 hover:bg-primary/20 cursor-pointer' : 'bg-muted/20'
    )}>
      {hasLink && (
        <motion.div
          whileHover={{ scale: 1.2 }}
          className="h-3 w-3 rounded-full bg-primary"
          title={linkedItem?.title}
        />
      )}
    </div>
  );
}

interface TraceabilityNodeProps {
  item: TraceabilityItem;
  isSelected: boolean;
  onClick: () => void;
}

function TraceabilityNode({ item, isSelected, onClick }: TraceabilityNodeProps) {
  const config = typeConfig[item.type];
  const Icon = config.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-all',
        isSelected ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('h-8 w-8 rounded flex items-center justify-center', config.color)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px]">{item.id}</Badge>
            <Badge variant="secondary" className="text-[10px]">{config.label}</Badge>
          </div>
          <p className="text-sm font-medium line-clamp-1">{item.title}</p>
          <div className="flex items-center gap-1 mt-1">
            <Link2 className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{item.linkedTo.length} links</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TraceabilityMatrixView() {
  const [selectedItem, setSelectedItem] = useState<TraceabilityItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'graph' | 'matrix'>('graph');

  const types = ['sprint', 'task', 'issue', 'action', 'decision', 'risk', 'meeting'];

  const filteredItems = useMemo(() => {
    return mockTraceabilityData.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, filterType]);

  const linkStats = useMemo(() => {
    const stats: Record<string, number> = {};
    types.forEach(type => {
      stats[type] = mockTraceabilityData.filter(i => i.type === type).length;
    });
    return stats;
  }, []);

  const totalLinks = mockTraceabilityData.reduce((sum, item) => sum + item.linkedTo.length, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <GitBranch className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Traceability Matrix</h1>
            <p className="text-sm text-muted-foreground">
              {mockTraceabilityData.length} items • {totalLinks} relationships
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="graph">Graph</TabsTrigger>
              <TabsTrigger value="matrix">Matrix</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 p-4 border-b bg-muted/30 overflow-x-auto">
        {types.map(type => {
          const config = typeConfig[type];
          const Icon = config.icon;
          return (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? 'all' : type)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors shrink-0',
                filterType === type ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{config.label}</span>
              <Badge variant="secondary" className="text-xs">{linkStats[type]}</Badge>
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'graph' ? (
          <>
            {/* Items List */}
            <div className="w-96 border-r p-4 overflow-y-auto">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="space-y-2">
                {filteredItems.map(item => (
                  <TraceabilityNode
                    key={item.id}
                    item={item}
                    isSelected={selectedItem?.id === item.id}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            </div>

            {/* Relationship View */}
            <div className="flex-1 p-6 overflow-auto">
              {selectedItem ? (
                <div className="max-w-2xl mx-auto">
                  <Card className="mb-6">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'h-12 w-12 rounded-lg flex items-center justify-center',
                          typeConfig[selectedItem.type].color
                        )}>
                          {React.createElement(typeConfig[selectedItem.type].icon, {
                            className: 'h-6 w-6 text-white'
                          })}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge>{selectedItem.id}</Badge>
                            <Badge variant="outline">{typeConfig[selectedItem.type].label}</Badge>
                            <Badge variant="secondary">{selectedItem.status}</Badge>
                          </div>
                          <h2 className="text-xl font-semibold">{selectedItem.title}</h2>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Linked Items ({selectedItem.linkedTo.length})
                  </h3>

                  <div className="space-y-3">
                    {selectedItem.linkedTo.map((linked, index) => {
                      const config = typeConfig[linked.type];
                      const Icon = config.icon;
                      return (
                        <motion.div
                          key={`${linked.type}-${linked.id}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer group"
                        >
                          <div className="h-2 w-8 bg-border rounded" />
                          <div className={cn('h-8 w-8 rounded flex items-center justify-center', config.color)}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{linked.id}</Badge>
                              <span className="text-xs text-muted-foreground">{config.label}</span>
                            </div>
                            <p className="text-sm font-medium truncate">{linked.title}</p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select an item to view its relationships</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Matrix View */
          <div className="flex-1 p-6 overflow-auto">
            <div className="inline-block min-w-full">
              {/* Matrix Header */}
              <div className="flex">
                <div className="w-48 shrink-0" />
                {types.map(type => {
                  const config = typeConfig[type];
                  const Icon = config.icon;
                  return (
                    <div key={type} className="w-24 flex flex-col items-center p-2 border-b">
                      <Icon className="h-4 w-4 mb-1" style={{ color: config.color.replace('bg-', '') }} />
                      <span className="text-xs font-medium">{config.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Matrix Rows */}
              {filteredItems.map(item => {
                const config = typeConfig[item.type];
                const Icon = config.icon;
                return (
                  <div key={item.id} className="flex">
                    <div className="w-48 shrink-0 flex items-center gap-2 p-2 border-b border-r bg-muted/30">
                      <Icon className="h-4 w-4" />
                      <div className="min-w-0">
                        <p className="text-xs font-mono">{item.id}</p>
                        <p className="text-xs truncate">{item.title}</p>
                      </div>
                    </div>
                    {types.map(type => (
                      <MatrixCell
                        key={type}
                        from={item}
                        to={type}
                        hasLink={item.linkedTo.some(l => l.type === type)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
