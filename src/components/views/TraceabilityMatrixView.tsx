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
  Loader2,
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
import { useTraceability, TraceabilityItem } from '@/hooks/useTraceability';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
            {(Badge as any) && <Badge variant="outline" className="text-[10px]">{item.id}</Badge>}
            {(Badge as any) && <Badge variant="secondary" className="text-[10px]">{config.label}</Badge>}
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
  // For testing purposes, we use the fixed project ID or fetch the first one
  const { data: projects } = useQuery({
    queryKey: ['projects-traceability'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('id').limit(1);
      return data;
    }
  });

  const projectId = projects?.[0]?.id;
  const { data: traceabilityData, isLoading } = useTraceability(projectId);
  const [selectedItem, setSelectedItem] = useState<TraceabilityItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'graph' | 'matrix'>('graph');

  const types = ['sprint', 'task', 'issue', 'action', 'decision', 'risk', 'meeting'];

  const filteredItems = useMemo(() => {
    if (!traceabilityData) return [];
    return traceabilityData.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [traceabilityData, searchQuery, filterType]);

  const linkStats = useMemo(() => {
    const stats: Record<string, number> = {};
    if (!traceabilityData) return stats;
    types.forEach(type => {
      stats[type] = traceabilityData.filter(i => i.type === type).length;
    });
    return stats;
  }, [traceabilityData]);

  const totalLinks = traceabilityData?.reduce((sum, item) => sum + item.linkedTo.length, 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading traceability matrix...</span>
      </div>
    );
  }

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
              {traceabilityData?.length || 0} items • {totalLinks} relationships
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
              <Badge variant="secondary" className="text-xs">{linkStats[type] || 0}</Badge>
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
