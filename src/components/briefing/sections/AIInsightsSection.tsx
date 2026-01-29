import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Lightbulb, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Insight {
  id: string;
  category: 'prediction' | 'pattern' | 'recommendation' | 'warning';
  title: string;
  description: string;
  trend?: 'up' | 'down' | 'stable';
  confidence: number;
}

interface AIInsightsSectionProps {
  insights: Insight[];
  summary?: string;
}

export function AIInsightsSection({ insights, summary }: AIInsightsSectionProps) {
  const getCategoryColor = (category: Insight['category']) => {
    switch (category) {
      case 'prediction':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'pattern':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'recommendation':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'warning':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    }
  };

  const getTrendIcon = (trend?: Insight['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (insights.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Click refresh to generate AI insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {summary && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm">{summary}</p>
        </div>
      )}

      <div className="grid gap-3">
        {insights.map(insight => (
          <Card key={insight.id} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge className={cn('text-xs', getCategoryColor(insight.category))}>
                    {insight.category}
                  </Badge>
                  {insight.trend && getTrendIcon(insight.trend)}
                  <span className="text-xs text-muted-foreground">
                    {Math.round(insight.confidence * 100)}% confidence
                  </span>
                </div>
                <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
