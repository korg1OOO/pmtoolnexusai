import React from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, Filter, User, Calendar, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { mockDecisions } from '@/data/mockData';
import type { Decision } from '@/types/project';

function DecisionCard({ decision }: { decision: Decision }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <Badge variant={decision.status === 'active' ? 'success' : decision.status === 'pending' ? 'warning' : 'secondary'}>{decision.status}</Badge>
        <span className="text-xs text-muted-foreground font-mono">{decision.id}</span>
      </div>
      <h3 className="font-medium mb-2">{decision.title}</h3>
      <div className="p-3 bg-muted/50 rounded-lg mb-3"><p className="text-sm">{decision.decision}</p></div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-muted-foreground"><User className="h-3 w-3" />{decision.owner}</div>
          <div className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-3 w-3" />{new Date(decision.date).toLocaleDateString()}</div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground"><Link2 className="h-3 w-3" />{decision.linkedTasks.length + decision.linkedRisks.length}</div>
      </div>
    </motion.div>
  );
}

export function DecisionsView() {
  const activeDecisions = mockDecisions.filter(d => d.status === 'active');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold">Decision Register</h2>
          <Badge>{mockDecisions.length} Decisions</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" />Filter</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Decision</Button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card><CardContent className="p-4"><div className="text-3xl font-bold text-primary">{mockDecisions.length}</div><p className="text-sm text-muted-foreground">Total Decisions</p></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-3xl font-bold text-success">{activeDecisions.length}</div><p className="text-sm text-muted-foreground">Active</p></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-3xl font-bold text-warning">{mockDecisions.filter(d => d.status === 'pending').length}</div><p className="text-sm text-muted-foreground">Pending</p></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-3xl font-bold text-muted-foreground">{mockDecisions.filter(d => d.status === 'superseded').length}</div><p className="text-sm text-muted-foreground">Superseded</p></CardContent></Card>
        </div>

        <h3 className="text-lg font-semibold mb-4">All Decisions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockDecisions.map(decision => <DecisionCard key={decision.id} decision={decision} />)}
        </div>
      </div>
    </div>
  );
}
