import React, { useMemo } from 'react';
import {
  Calendar,
  DollarSign,
  AlertTriangle,
  Users,
  Video,
  FileText,
  Lightbulb,
  Target,
  MessageCircle,
  Bot,
  Network,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AgentType, AIMessageMetadata } from '@/types/ai-agents';
import { useAIAgents } from '@/hooks/useAIAgents';

interface AgentIndicatorProps {
  agentType: AgentType | null;
  isProcessing?: boolean;
  metadata?: AIMessageMetadata;
}

// Icon mapping for dynamic agent icons
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  DollarSign,
  AlertTriangle,
  Users,
  Video,
  FileText,
  Lightbulb,
  Target,
  MessageCircle,
  Bot,
  Network,
};

// Fallback config if database unavailable
const FALLBACK_AGENT_CONFIG: Record<AgentType, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}> = {
  scheduler: { label: 'Scheduler', icon: Calendar, colorClass: 'text-blue-500 bg-blue-500/10' },
  finance: { label: 'Finance', icon: DollarSign, colorClass: 'text-green-500 bg-green-500/10' },
  risk: { label: 'Risk', icon: AlertTriangle, colorClass: 'text-orange-500 bg-orange-500/10' },
  assignment: { label: 'Assignment', icon: Users, colorClass: 'text-purple-500 bg-purple-500/10' },
  meeting: { label: 'Meeting', icon: Video, colorClass: 'text-pink-500 bg-pink-500/10' },
  document: { label: 'Document', icon: FileText, colorClass: 'text-indigo-500 bg-indigo-500/10' },
  insight: { label: 'Insight', icon: Lightbulb, colorClass: 'text-yellow-500 bg-yellow-500/10' },
  strategic: { label: 'Strategic', icon: Target, colorClass: 'text-red-500 bg-red-500/10' },
  communication: { label: 'Communication', icon: MessageCircle, colorClass: 'text-cyan-500 bg-cyan-500/10' },
  system: { label: 'System', icon: Bot, colorClass: 'text-muted-foreground bg-muted' },
  'multi-agent': { label: 'Multi-Agent', icon: Network, colorClass: 'text-primary bg-primary/10' },
};


export function AgentIndicator({ agentType, isProcessing, metadata }: AgentIndicatorProps) {
  // Load agents from database
  const { data: agents } = useAIAgents();

  // Build dynamic agent config from database
  const AGENT_CONFIG = useMemo(() => {
    if (!agents || agents.length === 0) {
      return FALLBACK_AGENT_CONFIG;
    }

    const config: Record<AgentType, {
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      colorClass: string;
    }> = {} as any;

    agents.forEach((agent) => {
      const IconComponent = ICON_MAP[agent.icon] || Bot;
      config[agent.agent_type as AgentType] = {
        label: agent.label,
        icon: IconComponent,
        colorClass: `${agent.color} bg-${agent.color.replace('text-', '')}/10`,
      };
    });

    return config;
  }, [agents]);

  if (!agentType) {
    if (isProcessing) {
      return (
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Processing...</span>
        </div>
      );
    }
    return null;
  }

  const config = AGENT_CONFIG[agentType] || AGENT_CONFIG.system;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 mb-2 flex-wrap">
      <Badge
        variant="secondary"
        className={cn(
          "text-xs gap-1 px-2 py-0.5",
          config.colorClass
        )}
      >
        {isProcessing ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Icon className="h-3 w-3" />
        )}
        {config.label}
      </Badge>

      {/* Show multi-agent breakdown */}
      {metadata?.agentsUsed && metadata.agentsUsed.length > 1 && (
        <div className="flex items-center gap-1">
          {metadata.agentsUsed.map((agent) => {
            const agentConfig = AGENT_CONFIG[agent];
            if (!agentConfig) return null;
            const AgentIcon = agentConfig.icon;
            return (
              <div
                key={agent}
                className={cn(
                  "p-1 rounded",
                  agentConfig.colorClass
                )}
                title={agentConfig.label}
              >
                <AgentIcon className="h-3 w-3" />
              </div>
            );
          })}
        </div>
      )}

      {/* Confidence indicator */}
      {metadata?.confidence !== undefined && metadata.confidence > 0 && (
        <span className="text-xs text-muted-foreground">
          {Math.round(metadata.confidence * 100)}% confidence
        </span>
      )}

      {/* Execution time */}
      {metadata?.executionTime !== undefined && (
        <span className="text-xs text-muted-foreground">
          {(metadata.executionTime / 1000).toFixed(1)}s
        </span>
      )}
    </div>
  );
}
