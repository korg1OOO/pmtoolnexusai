import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Shield,
  Target,
  Plus,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  MoreHorizontal,
  Link2,
  Calendar,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockRisks, mockDecisions } from '@/data/mockData';
import type { Risk, Decision, RiskLevel } from '@/types/project';

const riskColors: Record<RiskLevel, string> = {
  low: 'bg-success',
  medium: 'bg-warning',
  high: 'bg-orange-500',
  critical: 'bg-destructive',
};

const impactLabels: Record<RiskLevel, string> = {
  low: '1',
  medium: '2',
  high: '3',
  critical: '4',
};

function RiskMatrix({ risks }: { risks: Risk[] }) {
  const matrix: Record<string, Risk[]> = {};
  
  ['critical', 'high', 'medium', 'low'].forEach(prob => {
    ['low', 'medium', 'high', 'critical'].forEach(impact => {
      matrix[`${prob}-${impact}`] = risks.filter(
        r => r.probability === prob && r.impact === impact
      );
    });
  });

  const getCellColor = (prob: string, impact: string) => {
    const probLevel = ['low', 'medium', 'high', 'critical'].indexOf(prob);
    const impactLevel = ['low', 'medium', 'high', 'critical'].indexOf(impact);
    const score = probLevel + impactLevel;
    
    if (score >= 5) return 'bg-destructive/20 border-destructive/30';
    if (score >= 3) return 'bg-warning/20 border-warning/30';
    if (score >= 1) return 'bg-success/20 border-success/30';
    return 'bg-muted/50';
  };

  return (
    <div className="grid gap-1">
      <div className="grid grid-cols-5 gap-1 text-center">
        <div className="text-xs text-muted-foreground p-2">Probability ↓ / Impact →</div>
        {['Low', 'Medium', 'High', 'Critical'].map(label => (
          <div key={label} className="text-xs font-medium p-2">{label}</div>
        ))}
      </div>
      
      {['critical', 'high', 'medium', 'low'].map(prob => (
        <div key={prob} className="grid grid-cols-5 gap-1">
          <div className="text-xs font-medium p-2 capitalize flex items-center">{prob}</div>
          {['low', 'medium', 'high', 'critical'].map(impact => {
            const cellRisks = matrix[`${prob}-${impact}`];
            return (
              <div
                key={`${prob}-${impact}`}
                className={cn(
                  'p-2 rounded border min-h-[60px] flex flex-wrap gap-1 items-start content-start',
                  getCellColor(prob, impact)
                )}
              >
                {cellRisks.map(risk => (
                  <motion.div
                    key={risk.id}
                    whileHover={{ scale: 1.1 }}
                    className="h-6 w-6 rounded-full bg-foreground/80 flex items-center justify-center text-[10px] font-bold text-background cursor-pointer"
                    title={risk.title}
                  >
                    {risk.id.split('-')[1]}
                  </motion.div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function RiskCard({ risk }: { risk: Risk }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('h-3 w-3 rounded-full', riskColors[risk.impact])} />
          <Badge variant={risk.impact as any}>{risk.impact} impact</Badge>
        </div>
        <Button variant="ghost" size="iconXs" className="opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <h3 className="font-medium mb-2">{risk.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{risk.description}</p>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-muted-foreground">
          <User className="h-3 w-3" />
          {risk.owner}
        </div>
        <Badge variant={
          risk.status === 'mitigating' ? 'info' :
          risk.status === 'closed' ? 'success' :
          risk.status === 'analyzing' ? 'warning' : 'secondary'
        }>
          {risk.status}
        </Badge>
      </div>
    </motion.div>
  );
}

function DecisionCard({ decision }: { decision: Decision }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer group"
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
            <User className="h-3 w-3" />
            {decision.owner}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(decision.date).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Link2 className="h-3 w-3" />
          {decision.linkedTasks.length + decision.linkedRisks.length}
        </div>
      </div>
    </motion.div>
  );
}

export function RisksDecisionsView() {
  const [activeTab, setActiveTab] = useState('risks');

  const criticalRisks = mockRisks.filter(r => r.impact === 'critical' || r.probability === 'critical');
  const activeDecisions = mockDecisions.filter(d => d.status === 'active');

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <TabsList>
            <TabsTrigger value="risks" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risks ({mockRisks.length})
            </TabsTrigger>
            <TabsTrigger value="decisions" className="gap-2">
              <Target className="h-4 w-4" />
              Decisions ({mockDecisions.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {activeTab === 'risks' ? 'Add Risk' : 'Add Decision'}
            </Button>
          </div>
        </div>

        <TabsContent value="risks" className="flex-1 p-6 overflow-auto m-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Matrix */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Risk Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RiskMatrix risks={mockRisks} />
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Risk Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Risks</span>
                    <span className="font-semibold">{mockRisks.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Critical</span>
                    <Badge variant="critical">{criticalRisks.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Being Mitigated</span>
                    <span className="font-semibold">{mockRisks.filter(r => r.status === 'mitigating').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Closed</span>
                    <span className="font-semibold text-success">{mockRisks.filter(r => r.status === 'closed').length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card variant="muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Critical Risks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {criticalRisks.slice(0, 3).map(risk => (
                      <div key={risk.id} className="text-sm p-2 rounded bg-destructive/10 border border-destructive/20">
                        {risk.title}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Risk List */}
          <h3 className="text-lg font-semibold mt-8 mb-4">All Risks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockRisks.map(risk => (
              <RiskCard key={risk.id} risk={risk} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="decisions" className="flex-1 p-6 overflow-auto m-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Summary Cards */}
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

          {/* Decisions List */}
          <h3 className="text-lg font-semibold mt-8 mb-4">All Decisions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockDecisions.map(decision => (
              <DecisionCard key={decision.id} decision={decision} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
