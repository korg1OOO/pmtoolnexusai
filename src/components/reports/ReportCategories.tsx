import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  DollarSign,
  Users,
  AlertTriangle,
  FileText,
  LayoutGrid,
} from 'lucide-react';

export type ReportCategory = 'all' | 'status' | 'financial' | 'resource' | 'risk' | 'custom';

interface ReportCategoriesProps {
  selectedCategory: ReportCategory;
  onCategoryChange: (category: ReportCategory) => void;
  counts: Record<ReportCategory, number>;
}

const categories: { id: ReportCategory; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All Reports', icon: LayoutGrid },
  { id: 'status', label: 'Status', icon: BarChart3 },
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'resource', label: 'Resource', icon: Users },
  { id: 'risk', label: 'Risk', icon: AlertTriangle },
  { id: 'custom', label: 'Custom', icon: FileText },
];

export function ReportCategories({
  selectedCategory,
  onCategoryChange,
  counts,
}: ReportCategoriesProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {categories.map((category) => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.id;
        const count = counts[category.id];

        return (
          <Button
            key={category.id}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'gap-2',
              isSelected && 'shadow-sm'
            )}
            onClick={() => onCategoryChange(category.id)}
          >
            <Icon className="h-4 w-4" />
            {category.label}
            {count > 0 && (
              <Badge
                variant={isSelected ? 'secondary' : 'outline'}
                className="ml-1 h-5 px-1.5 text-xs"
              >
                {count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}
