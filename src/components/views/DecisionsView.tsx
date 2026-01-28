import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, Filter, User, Calendar, Link2, X, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mockDecisions } from '@/data/mockData';
import { LinkDialog, LinkableItem } from '@/components/linking/LinkDialog';
import type { Decision } from '@/types/project';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface DecisionCardProps {
  decision: Decision;
  onSelect: () => void;
  isSelected: boolean;
}

function DecisionCard({ decision, onSelect, isSelected }: DecisionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onSelect}
      className={`p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer ${isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <Badge variant={decision.status === 'active' ? 'success' : decision.status === 'pending' ? 'warning' : 'secondary'}>
          {decision.status}
        </Badge>
        <span className="text-xs text-muted-foreground font-mono">{decision.id}</span>
      </div>
      <h3 className="font-medium mb-2">{decision.title}</h3>
      <div className="p-3 bg-muted/50 rounded-lg mb-3">
        <p className="text-sm">{decision.decision}</p>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="h-3 w-3" />{decision.owner}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />{new Date(decision.date).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Link2 className="h-3 w-3" />{decision.linkedTasks.length + decision.linkedRisks.length + decision.linkedMeetings.length}
        </div>
      </div>
    </motion.div>
  );
}

interface DecisionDetailPanelProps {
  decision: Decision;
  onClose: () => void;
  onOpenLinkDialog: () => void;
}

function DecisionDetailPanel({ decision, onClose, onOpenLinkDialog }: DecisionDetailPanelProps) {
  return (
    <Sheet open={true} onOpenChange={() => onClose()}>
      <SheetContent className="w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {decision.id}
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-4">
          <div className="space-y-6">
            {/* Status & Info */}
            <div>
              <Badge variant={decision.status === 'active' ? 'success' : decision.status === 'pending' ? 'warning' : 'secondary'} className="mb-2">
                {decision.status}
              </Badge>
              <h2 className="text-lg font-semibold mb-2">{decision.title}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><User className="h-3 w-3" />{decision.owner}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(decision.date).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="context">
              <TabsList className="w-full">
                <TabsTrigger value="context" className="flex-1">Context</TabsTrigger>
                <TabsTrigger value="alternatives" className="flex-1">Alternatives</TabsTrigger>
                <TabsTrigger value="links" className="flex-1">Links</TabsTrigger>
              </TabsList>

              <TabsContent value="context" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Decision Statement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{decision.decision}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Context</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{decision.context}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{decision.impact}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alternatives" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Alternatives Considered</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {decision.alternatives.map((alt, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          <span>{alt}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="links" className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Linked Items</h4>
                  <Button size="sm" variant="outline" onClick={onOpenLinkDialog}>
                    <Link2 className="h-3 w-3 mr-1" />
                    Manage Links
                  </Button>
                </div>

                {/* Linked Tasks */}
                {decision.linkedTasks.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase">Tasks ({decision.linkedTasks.length})</span>
                    <div className="mt-2 space-y-1">
                      {decision.linkedTasks.map((taskId) => (
                        <div key={taskId} className="p-2 rounded bg-muted/50 text-sm flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{taskId}</Badge>
                          <span className="text-muted-foreground">Linked task</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked Risks */}
                {decision.linkedRisks.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase">Risks ({decision.linkedRisks.length})</span>
                    <div className="mt-2 space-y-1">
                      {decision.linkedRisks.map((riskId) => (
                        <div key={riskId} className="p-2 rounded bg-muted/50 text-sm flex items-center gap-2">
                          <Badge variant="warning" className="text-xs">{riskId}</Badge>
                          <span className="text-muted-foreground">Linked risk</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked Meetings */}
                {decision.linkedMeetings.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase">Meetings ({decision.linkedMeetings.length})</span>
                    <div className="mt-2 space-y-1">
                      {decision.linkedMeetings.map((meetingId) => (
                        <div key={meetingId} className="p-2 rounded bg-muted/50 text-sm flex items-center gap-2">
                          <Badge variant="info" className="text-xs">{meetingId}</Badge>
                          <span className="text-muted-foreground">Linked meeting</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {decision.linkedTasks.length === 0 && decision.linkedRisks.length === 0 && decision.linkedMeetings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Link2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No linked items yet</p>
                    <Button size="sm" variant="outline" className="mt-2" onClick={onOpenLinkDialog}>
                      Add Links
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export function DecisionsView() {
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const activeDecisions = mockDecisions.filter(d => d.status === 'active');

  const filteredDecisions = mockDecisions.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (searchQuery && !d.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !d.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleLinkItems = (items: LinkableItem[]) => {
    console.log('Linked items to decision:', items);
    // In real app, save the links
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold">Decision Register</h2>
          <Badge>{mockDecisions.length} Decisions</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />Filter
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />Add Decision
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search decisions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'active', 'pending', 'superseded'].map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-3xl font-bold text-primary">{mockDecisions.length}</div>
              <p className="text-sm text-muted-foreground">Total Decisions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-3xl font-bold text-success">{activeDecisions.length}</div>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-3xl font-bold text-warning">{mockDecisions.filter(d => d.status === 'pending').length}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-3xl font-bold text-muted-foreground">{mockDecisions.filter(d => d.status === 'superseded').length}</div>
              <p className="text-sm text-muted-foreground">Superseded</p>
            </CardContent>
          </Card>
        </div>

        <h3 className="text-lg font-semibold mb-4">
          {statusFilter === 'all' ? 'All Decisions' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Decisions`}
          <span className="text-muted-foreground font-normal ml-2">({filteredDecisions.length})</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDecisions.map(decision => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              onSelect={() => setSelectedDecision(decision)}
              isSelected={selectedDecision?.id === decision.id}
            />
          ))}
        </div>

        {filteredDecisions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No decisions found</p>
          </div>
        )}
      </div>

      {/* Decision Detail Panel */}
      {selectedDecision && (
        <DecisionDetailPanel
          decision={selectedDecision}
          onClose={() => setSelectedDecision(null)}
          onOpenLinkDialog={() => setLinkDialogOpen(true)}
        />
      )}

      {/* Link Dialog */}
      {selectedDecision && (
        <LinkDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          sourceItem={{ id: selectedDecision.id, title: selectedDecision.title, type: 'decision' }}
          onLink={handleLinkItems}
          allowedTypes={['task', 'meeting', 'action', 'risk']}
          existingLinks={[
            ...selectedDecision.linkedTasks.map(id => ({ type: 'task' as const, id })),
            ...selectedDecision.linkedRisks.map(id => ({ type: 'risk' as const, id })),
            ...selectedDecision.linkedMeetings.map(id => ({ type: 'meeting' as const, id })),
          ]}
        />
      )}
    </div>
  );
}
