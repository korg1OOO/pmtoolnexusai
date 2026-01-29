import { useState, useRef, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Target,
  ChevronDown,
  Check,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PDFExporter } from '@/components/common/PDFExporter';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load dashboard components
const DashboardView = lazy(() => import('./DashboardView').then(m => ({ default: m.DashboardView })));
const ExecutiveDashboardView = lazy(() => import('./ExecutiveDashboardView').then(m => ({ default: m.ExecutiveDashboardView })));
const StrategicDashboardView = lazy(() => import('./StrategicDashboardView').then(m => ({ default: m.StrategicDashboardView })));

export type DashboardType = 'project' | 'executive' | 'strategic';

interface DashboardOption {
  id: DashboardType;
  name: string;
  description: string;
  icon: React.ElementType;
}

const dashboardOptions: DashboardOption[] = [
  {
    id: 'project',
    name: 'Project Dashboard',
    description: 'Day-to-day project status and metrics',
    icon: LayoutDashboard,
  },
  {
    id: 'executive',
    name: 'Executive Dashboard',
    description: 'Portfolio-level KPIs and trends',
    icon: Building2,
  },
  {
    id: 'strategic',
    name: 'Strategic Dashboard',
    description: 'Business case and value analysis',
    icon: Target,
  },
];

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}

export function DashboardHub() {
  const [activeDashboard, setActiveDashboard] = useState<DashboardType>('project');
  const contentRef = useRef<HTMLDivElement>(null);

  const currentDashboard = dashboardOptions.find(d => d.id === activeDashboard)!;
  const CurrentIcon = currentDashboard.icon;

  const renderDashboard = () => {
    switch (activeDashboard) {
      case 'project':
        return <DashboardView />;
      case 'executive':
        return <ExecutiveDashboardView />;
      case 'strategic':
        return <StrategicDashboardView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Dashboard Switcher Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 h-auto py-2 px-3 hover:bg-muted">
              <div className="p-1.5 rounded-md bg-primary/10">
                <CurrentIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{currentDashboard.name}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">{currentDashboard.description}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72 bg-popover border border-border shadow-lg z-50">
            {dashboardOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = option.id === activeDashboard;

              return (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => setActiveDashboard(option.id)}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.name}</span>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <PDFExporter
          title={currentDashboard.name}
          filename={`${activeDashboard}-dashboard`}
          contentRef={contentRef}
          orientation="landscape"
          variant="dropdown"
        />
      </div>

      {/* Dashboard Content */}
      <div ref={contentRef} className="flex-1 overflow-auto">
        <Suspense fallback={<DashboardSkeleton />}>
          <motion.div
            key={activeDashboard}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderDashboard()}
          </motion.div>
        </Suspense>
      </div>
    </div>
  );
}
