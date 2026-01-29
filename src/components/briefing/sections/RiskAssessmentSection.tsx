import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, TrendingUp, TrendingDown, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Risk {
  id: string;
  title: string;
  category: string;
  probability: 'low' | 'medium' | 'high' | 'critical';
  impact: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  trending: 'up' | 'down' | 'stable';
  suggestedMitigation?: string;
}

interface RiskAssessmentData {
  totalRisks: number;
  criticalRisks: number;
  newRisksIdentified: Risk[];
  escalatedRisks: Risk[];
  mitigationSuggestions: {
    riskId: string;
    riskTitle: string;
    suggestion: string;
  }[];
  riskScore: {
    current: number;
    previous: number;
    trend: 'improving' | 'worsening' | 'stable';
  };
}

interface RiskAssessmentSectionProps {
  data: RiskAssessmentData;
}

export function RiskAssessmentSection({ data }: RiskAssessmentSectionProps) {
  const getLevelColor = (level: 'low' | 'medium' | 'high' | 'critical') => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getScoreTrendColor = (trend: 'improving' | 'worsening' | 'stable') => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 dark:text-green-400';
      case 'worsening':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {/* Risk Score */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm">Project Risk Score</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{data.riskScore.current}</span>
          <span className={cn('text-sm', getScoreTrendColor(data.riskScore.trend))}>
            {data.riskScore.trend === 'improving' && '↓'}
            {data.riskScore.trend === 'worsening' && '↑'}
            {data.riskScore.current - data.riskScore.previous !== 0 && (
              <> from {data.riskScore.previous}</>
            )}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold">{data.totalRisks}</p>
          <p className="text-xs text-muted-foreground">Total Risks</p>
        </Card>
        <Card className="p-3 text-center border-red-500/50">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {data.criticalRisks}
          </p>
          <p className="text-xs text-muted-foreground">Critical/High</p>
        </Card>
      </div>

      {/* Newly Identified Risks */}
      {data.newRisksIdentified.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            AI-Identified Risks
          </h4>
          <div className="space-y-2">
            {data.newRisksIdentified.map(risk => (
              <Card key={risk.id} className="p-3 border-dashed">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="font-medium text-sm">{risk.title}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={cn('text-xs', getLevelColor(risk.impact))}>
                        {risk.impact} impact
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {risk.category}
                      </Badge>
                    </div>
                  </div>
                  {getTrendIcon(risk.trending)}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Escalated Risks */}
      {data.escalatedRisks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Risks Requiring Escalation</h4>
          <div className="space-y-2">
            {data.escalatedRisks.map(risk => (
              <Card key={risk.id} className="p-3 border-red-500/30 bg-red-50/50 dark:bg-red-900/10">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="font-medium text-sm">{risk.title}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={cn('text-xs', getLevelColor(risk.probability))}>
                        P: {risk.probability}
                      </Badge>
                      <Badge className={cn('text-xs', getLevelColor(risk.impact))}>
                        I: {risk.impact}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* AI Mitigation Suggestions */}
      {data.mitigationSuggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            AI-Suggested Mitigations
          </h4>
          <div className="space-y-2">
            {data.mitigationSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-primary/5 border border-primary/20"
              >
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  For: {suggestion.riskTitle}
                </p>
                <p className="text-sm">{suggestion.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.newRisksIdentified.length === 0 &&
        data.escalatedRisks.length === 0 &&
        data.mitigationSuggestions.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No new risk alerts</p>
          </div>
        )}
    </div>
  );
}
