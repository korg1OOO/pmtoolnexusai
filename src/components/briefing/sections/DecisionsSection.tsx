import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Gavel, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

import { BriefingDecision } from '@/types/briefing';

// interface Decision removed in favor of BriefingDecision

interface DecisionsSectionProps {
  decisions: BriefingDecision[];
}

export function DecisionsSection({ decisions }: DecisionsSectionProps) {
  const pendingDecisions = decisions.filter(d => d.status === 'pending');
  const recentDecisions = decisions.filter(d => d.status !== 'pending');

  const getStatusIcon = (status: BriefingDecision['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getImpactColor = (impact: BriefingDecision['impact']) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  const renderDecisionCard = (decision: BriefingDecision) => (
    <Card key={decision.id} className="p-3">
      <div className="flex items-start gap-2">
        {getStatusIcon(decision.status)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{decision.title}</span>
            <Badge className={cn('text-xs', getImpactColor(decision.impact))}>
              {decision.impact} impact
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
            {decision.description}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{decision.owner}</span>
            <span>•</span>
            <span>{new Date(decision.date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Card>
  );

  if (decisions.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Gavel className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent decisions</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingDecisions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            Pending Approval ({pendingDecisions.length})
          </h4>
          <div className="space-y-2">
            {pendingDecisions.map(renderDecisionCard)}
          </div>
        </div>
      )}

      {recentDecisions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Recent Decisions
          </h4>
          <div className="space-y-2">
            {recentDecisions.slice(0, 3).map(renderDecisionCard)}
          </div>
        </div>
      )}
    </div>
  );
}
