import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Brain,
  TrendingUp,
  Clock,
  DollarSign,
  Shield,
  CheckSquare,
  AlertCircle,
  Calendar,
  Gavel,
  Users,
  MessageSquare,
  Flag,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BriefingSection } from './types';

const iconMap: Record<string, React.ElementType> = {
  AlertTriangle,
  Brain,
  TrendingUp,
  Clock,
  DollarSign,
  Shield,
  CheckSquare,
  AlertCircle,
  Calendar,
  Gavel,
  Users,
  MessageSquare,
  Flag,
  BarChart3,
};

interface BriefingSectionCardProps {
  section: BriefingSection;
  loading?: boolean;
  error?: string;
  aiConfidence?: number;
  generatedAt?: string;
  onRefresh?: () => void;
  onViewDetails?: () => void;
  children: React.ReactNode;
}

export function BriefingSectionCard({
  section,
  loading = false,
  error,
  aiConfidence,
  generatedAt,
  onRefresh,
  onViewDetails,
  children,
}: BriefingSectionCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const Icon = iconMap[section.icon] || AlertCircle;

  const confidenceColor =
    aiConfidence && aiConfidence >= 0.8
      ? 'text-green-600 dark:text-green-400'
      : aiConfidence && aiConfidence >= 0.6
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-orange-600 dark:text-orange-400';

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base font-medium">
                {section.title}
              </CardTitle>
              {section.isAIPowered && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge
                        variant="secondary"
                        className="gap-1 text-xs bg-primary/10 text-primary"
                      >
                        <Sparkles className="h-3 w-3" />
                        AI
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>AI-powered analysis</p>
                      {aiConfidence && (
                        <p className={cn('text-xs', confidenceColor)}>
                          Confidence: {Math.round(aiConfidence * 100)}%
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center gap-1">
              {onRefresh && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onRefresh}
                        disabled={loading}
                      >
                        <RefreshCw
                          className={cn('h-4 w-4', loading && 'animate-spin')}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh section</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {section.detailsRoute && onViewDetails && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onViewDetails}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View details</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          {generatedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Updated {new Date(generatedAt).toLocaleTimeString()}
            </p>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-2">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            ) : (
              children
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
