import React from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch,
  RefreshCw,
  Columns,
  Layers,
  Building,
  Settings,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { methodologyOptions } from '@/data/templateData';
import type { Methodology } from '@/types/templates';

const iconMap: Record<string, React.ElementType> = {
  GitBranch,
  RefreshCw,
  Columns,
  Layers,
  Building,
  Settings,
};

const methodologyDetails: Record<string, {
  strengths: string[];
  bestFor: string[];
  artifacts: string[];
  cadence: string;
}> = {
  waterfall: {
    strengths: ['Clear milestones', 'Predictable timelines', 'Formal documentation'],
    bestFor: ['Compliance projects', 'Infrastructure', 'Fixed-scope contracts'],
    artifacts: ['Project Plan', 'Gantt Chart', 'Stage Gates', 'Change Requests'],
    cadence: 'Phase-based with formal reviews',
  },
  'agile-scrum': {
    strengths: ['Fast feedback', 'Adaptive to change', 'Team empowerment'],
    bestFor: ['Software development', 'Product innovation', 'Evolving requirements'],
    artifacts: ['Product Backlog', 'Sprint Backlog', 'Burndown Charts', 'Velocity Metrics'],
    cadence: '2-week sprints with daily standups',
  },
  'agile-kanban': {
    strengths: ['Continuous flow', 'Visual management', 'Reduced bottlenecks'],
    bestFor: ['Support teams', 'Operations', 'Continuous improvement'],
    artifacts: ['Kanban Board', 'WIP Limits', 'Lead Time Metrics', 'Cumulative Flow'],
    cadence: 'Continuous with on-demand planning',
  },
  hybrid: {
    strengths: ['Structured planning', 'Agile execution', 'Enterprise compatibility'],
    bestFor: ['Enterprise projects', 'Large transformations', 'Mixed stakeholders'],
    artifacts: ['Project Plan', 'Sprint Board', 'Milestones', 'Release Plan'],
    cadence: 'Quarterly planning, sprint delivery',
  },
  safe: {
    strengths: ['Enterprise scale', 'Portfolio alignment', 'Cross-team coordination'],
    bestFor: ['Large organizations', 'Multiple teams', 'Complex products'],
    artifacts: ['Program Increment', 'ART Sync', 'Epic Kanban', 'Value Streams'],
    cadence: '10-week PIs with 2-week sprints',
  },
  custom: {
    strengths: ['Full flexibility', 'Tailored governance', 'Organization-specific'],
    bestFor: ['Unique requirements', 'Mixed methodologies', 'Custom workflows'],
    artifacts: ['User-defined', 'Configurable views', 'Custom fields'],
    cadence: 'User-defined cadence',
  },
};

interface MethodologySelectorProps {
  selected: Methodology;
  onSelect: (methodology: Methodology) => void;
}

export function MethodologySelector({ selected, onSelect }: MethodologySelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {methodologyOptions.map((methodology) => {
        const Icon = iconMap[methodology.icon] || Layers;
        const isSelected = selected === methodology.id;
        const details = methodologyDetails[methodology.id];

        return (
          <motion.div
            key={methodology.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={`cursor-pointer transition-all h-full ${
                isSelected
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => onSelect(methodology.id as Methodology)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-secondary'}`}>
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : ''}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{methodology.name}</h3>
                      <p className="text-xs text-muted-foreground">{methodology.description}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {details && (
                  <div className="space-y-3 mt-4 pt-3 border-t">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Strengths</div>
                      <div className="flex flex-wrap gap-1">
                        {details.strengths.map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs px-1.5 py-0">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Best For</div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {details.bestFor.slice(0, 2).map((b) => (
                          <li key={b} className="flex items-center gap-1">
                            <ArrowRight className="h-3 w-3" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Cadence</div>
                      <p className="text-xs text-muted-foreground">{details.cadence}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
