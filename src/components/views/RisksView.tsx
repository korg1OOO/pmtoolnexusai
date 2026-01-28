import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AlertTriangle, Shield, Plus, Filter, User, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockRisks } from '@/data/mockData';
import type { Risk, RiskLevel } from '@/types/project';

const riskColors: Record<RiskLevel, string> = {
  low: 'bg-success',
  medium: 'bg-warning',
  high: 'bg-orange-500',
  critical: 'bg-destructive',
};

function RiskMatrix({ risks }: { risks: Risk[] }) {
  const matrix: Record<string, Risk[]> = {};
  ['critical', 'high', 'medium', 'low'].forEach(prob => {
    ['low', 'medium', 'high', 'critical'].forEach(impact => {
      matrix[`${prob}-${impact}`] = risks.filter(r => r.probability === prob && r.impact === impact);
    });
  });

  const getCellColor = (prob: string, impact: string) => {
    const probLevel = ['low', 'medium', 'high', 'critical'].indexOf(prob);
    const impactLevel = ['low', 'medium', 'high', 'critical'].indexOf(impact);
    const score = probLevel + impactLevel;
    if (score >= 5) return 'bg-destructive/20 border-destructive/30';
    if (score >= 3) return 'bg-warning/20 border-warning/30';
    return 'bg-success/20 border-success/30';
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
          {['low', 'medium', 'high', 'critical'].map(impact => (
            <div key={`${prob}-${impact}`} className={cn('p-2 rounded border min-h-[60px] flex flex-wrap gap-1', getCellColor(prob, impact))}>
              {matrix[`${prob}-${impact}`].map(risk => (
                <motion.div key={risk.id} whileHover={{ scale: 1.1 }} className="h-6 w-6 rounded-full bg-foreground/80 flex items-center justify-center text-[10px] font-bold text-background cursor-pointer" title={risk.title}>
                  {risk.id.split('-')[1]}
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function RisksView() {
  const criticalRisks = mockRisks.filter(r => r.impact === 'critical' || r.probability === 'critical');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <h2 className="text-lg font-semibold">Risk Register</h2>
          <Badge variant="destructive">{mockRisks.length} Risks</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" />Filter</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Risk</Button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Risk Matrix</CardTitle></CardHeader>
              <CardContent><RiskMatrix risks={mockRisks} /></CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Risk Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Total Risks</span><span className="font-semibold">{mockRisks.length}</span></div>
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Critical</span><Badge variant="critical">{criticalRisks.length}</Badge></div>
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Being Mitigated</span><span className="font-semibold">{mockRisks.filter(r => r.status === 'mitigating').length}</span></div>
              </CardContent>
            </Card>
          </div>
        </div>

        <h3 className="text-lg font-semibold mt-8 mb-4">All Risks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockRisks.map(risk => (
            <motion.div key={risk.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2"><div className={cn('h-3 w-3 rounded-full', riskColors[risk.impact])} /><Badge variant={risk.impact as any}>{risk.impact} impact</Badge></div>
                <Button variant="ghost" size="iconXs"><MoreHorizontal className="h-4 w-4" /></Button>
              </div>
              <h3 className="font-medium mb-2">{risk.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{risk.description}</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground"><User className="h-3 w-3" />{risk.owner}</div>
                <Badge variant={risk.status === 'mitigating' ? 'info' : risk.status === 'closed' ? 'success' : 'secondary'}>{risk.status}</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
