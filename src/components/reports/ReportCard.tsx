import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Download, Eye, Clock, Calendar } from 'lucide-react';

export interface Report {
  id: string;
  name: string;
  type: 'status' | 'financial' | 'resource' | 'risk' | 'custom';
  category: string;
  description: string;
  lastGenerated: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'on-demand';
  icon: React.ElementType;
  isScheduled: boolean;
  nextRun?: string;
}

interface ReportCardProps {
  report: Report;
  isSelected: boolean;
  onSelect: () => void;
  onGenerate: () => void;
  onExport: () => void;
}

const typeColors: Record<Report['type'], string> = {
  status: 'bg-primary/10 text-primary',
  financial: 'bg-success/10 text-success',
  resource: 'bg-warning/10 text-warning',
  risk: 'bg-destructive/10 text-destructive',
  custom: 'bg-muted text-muted-foreground',
};

const frequencyLabels: Record<Report['frequency'], string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  'on-demand': 'On Demand',
};

export function ReportCard({
  report,
  isSelected,
  onSelect,
  onGenerate,
  onExport,
}: ReportCardProps) {
  const Icon = report.icon;

  return (
    <motion.div
      onClick={onSelect}
      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/50'
      }`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${typeColors[report.type]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground truncate">{report.name}</h4>
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {report.description}
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {report.category}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {frequencyLabels[report.frequency]}
            </Badge>
            {report.isScheduled && (
              <Badge variant="default" className="text-xs bg-primary/80">
                <Clock className="h-3 w-3 mr-1" />
                Scheduled
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Last: {report.lastGenerated}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerate();
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                Generate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onExport();
                }}
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
