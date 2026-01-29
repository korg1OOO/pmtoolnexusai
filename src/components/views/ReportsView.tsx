import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Filter,
  Calendar,
  FileText,
  TrendingUp,
  PieChart,
  Activity,
  Clock,
  RefreshCw,
  Plus,
  Search,
  Settings,
  Users,
  AlertTriangle,
  DollarSign,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KPICard } from '@/components/enterprise/KPICard';
import { PDFExporter } from '@/components/common/PDFExporter';
import {
  ReportCard,
  ReportPreview,
  ReportCategories,
  ScheduleReportDialog,
  type Report,
  type ReportCategory,
} from '@/components/reports';
import { toast } from 'sonner';

const mockReports: Report[] = [
  // Status Reports
  { 
    id: 'rpt-portfolio-status', 
    name: 'Portfolio Status Report', 
    type: 'status', 
    category: 'Status',
    description: 'Executive summary of all active projects with health indicators', 
    lastGenerated: '2026-01-29', 
    frequency: 'weekly', 
    icon: BarChart3,
    isScheduled: true,
    nextRun: '2026-02-03 09:00'
  },
  { 
    id: 'rpt-sprint-status', 
    name: 'Sprint Status Report', 
    type: 'status', 
    category: 'Status',
    description: 'Current sprint progress, velocity, and burndown analysis', 
    lastGenerated: '2026-01-29', 
    frequency: 'daily', 
    icon: Activity,
    isScheduled: true,
    nextRun: '2026-01-30 08:00'
  },
  { 
    id: 'rpt-milestone-tracker', 
    name: 'Milestone Tracker', 
    type: 'status', 
    category: 'Status',
    description: 'Upcoming and overdue milestones across all projects', 
    lastGenerated: '2026-01-28', 
    frequency: 'weekly', 
    icon: Target,
    isScheduled: false
  },

  // Financial Reports
  { 
    id: 'rpt-financial-summary', 
    name: 'Financial Summary', 
    type: 'financial', 
    category: 'Financial',
    description: 'Budget vs actuals, burn rate, and financial forecasts', 
    lastGenerated: '2026-01-28', 
    frequency: 'weekly', 
    icon: DollarSign,
    isScheduled: true,
    nextRun: '2026-02-04 09:00'
  },
  { 
    id: 'rpt-evm-analysis', 
    name: 'EVM Analysis Report', 
    type: 'financial', 
    category: 'Financial',
    description: 'Earned Value Management metrics: SPI, CPI, EAC projections', 
    lastGenerated: '2026-01-27', 
    frequency: 'monthly', 
    icon: TrendingUp,
    isScheduled: true,
    nextRun: '2026-02-01 09:00'
  },
  { 
    id: 'rpt-burn-rate', 
    name: 'Burn Rate Report', 
    type: 'financial', 
    category: 'Financial',
    description: 'Resource spending rate and budget runway analysis', 
    lastGenerated: '2026-01-29', 
    frequency: 'daily', 
    icon: Activity,
    isScheduled: false
  },

  // Resource Reports
  { 
    id: 'rpt-resource-utilization', 
    name: 'Resource Utilization', 
    type: 'resource', 
    category: 'Resource',
    description: 'Team capacity, allocation, and utilization metrics', 
    lastGenerated: '2026-01-29', 
    frequency: 'weekly', 
    icon: Users,
    isScheduled: true,
    nextRun: '2026-02-03 09:00'
  },
  { 
    id: 'rpt-capacity-planning', 
    name: 'Capacity Planning', 
    type: 'resource', 
    category: 'Resource',
    description: 'Future resource requirements and availability forecast', 
    lastGenerated: '2026-01-25', 
    frequency: 'monthly', 
    icon: Users,
    isScheduled: false
  },
  { 
    id: 'rpt-skills-matrix', 
    name: 'Skills Matrix', 
    type: 'resource', 
    category: 'Resource',
    description: 'Team skills inventory and gap analysis', 
    lastGenerated: '2026-01-20', 
    frequency: 'on-demand', 
    icon: Users,
    isScheduled: false
  },

  // Risk Reports
  { 
    id: 'rpt-risk-register', 
    name: 'Risk Register', 
    type: 'risk', 
    category: 'Risk',
    description: 'Comprehensive risk register with mitigation status', 
    lastGenerated: '2026-01-28', 
    frequency: 'weekly', 
    icon: AlertTriangle,
    isScheduled: true,
    nextRun: '2026-02-04 09:00'
  },
  { 
    id: 'rpt-risk-assessment', 
    name: 'Risk Assessment', 
    type: 'risk', 
    category: 'Risk',
    description: 'Detailed risk analysis with probability and impact scoring', 
    lastGenerated: '2026-01-26', 
    frequency: 'monthly', 
    icon: AlertTriangle,
    isScheduled: false
  },
  { 
    id: 'rpt-risk-trends', 
    name: 'Risk Trends', 
    type: 'risk', 
    category: 'Risk',
    description: 'Historical risk trends and pattern analysis', 
    lastGenerated: '2026-01-22', 
    frequency: 'monthly', 
    icon: TrendingUp,
    isScheduled: false
  },

  // Custom Reports
  { 
    id: 'rpt-velocity', 
    name: 'Sprint Velocity Analysis', 
    type: 'custom', 
    category: 'Custom',
    description: 'Sprint-over-sprint velocity trends and predictions', 
    lastGenerated: '2026-01-27', 
    frequency: 'monthly', 
    icon: PieChart,
    isScheduled: false
  },
  { 
    id: 'rpt-custom-dashboard', 
    name: 'Executive Dashboard Export', 
    type: 'custom', 
    category: 'Custom',
    description: 'Custom executive summary with selected KPIs', 
    lastGenerated: '2026-01-25', 
    frequency: 'on-demand', 
    icon: FileText,
    isScheduled: false
  },
];

export function ReportsView() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const categoryCounts = useMemo(() => {
    const counts: Record<ReportCategory, number> = {
      all: mockReports.length,
      status: 0,
      financial: 0,
      resource: 0,
      risk: 0,
      custom: 0,
    };
    mockReports.forEach((report) => {
      counts[report.type]++;
    });
    return counts;
  }, []);

  const filteredReports = useMemo(() => {
    return mockReports.filter((report) => {
      const matchesCategory = selectedCategory === 'all' || report.type === selectedCategory;
      const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const scheduledCount = mockReports.filter((r) => r.isScheduled).length;

  const handleGenerate = (report: Report) => {
    toast.success(`Generating "${report.name}"...`);
    setSelectedReport(report);
  };

  const handleExport = (report: Report) => {
    toast.success(`Exporting "${report.name}" to PDF...`);
  };

  return (
    <div className="space-y-6 p-6" ref={contentRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate insights and track project performance across your portfolio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PDFExporter
            title="Reports Overview"
            filename="reports-overview"
            contentRef={contentRef}
            orientation="landscape"
            variant="dropdown"
          />
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard 
          title="Total Reports" 
          value={mockReports.length.toString()} 
          subtitle="Available templates" 
          icon={FileText} 
          status="neutral" 
        />
        <KPICard 
          title="Scheduled Reports" 
          value={scheduledCount.toString()} 
          subtitle="Auto-generated" 
          icon={Clock} 
          status="success" 
        />
        <KPICard 
          title="Generated This Month" 
          value="47" 
          subtitle="Reports created" 
          icon={Activity} 
          status="neutral" 
        />
        <KPICard 
          title="Last Updated" 
          value="2h ago" 
          subtitle="Data refresh" 
          icon={RefreshCw} 
          status="neutral" 
        />
      </div>

      {/* Category Filter */}
      <div className="flex items-center justify-between">
        <ReportCategories
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          counts={categoryCounts}
        />
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-5 gap-6">
        {/* Reports List */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">
              {filteredReports.length} Reports
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedReport) {
                  setScheduleDialogOpen(true);
                } else {
                  toast.error('Select a report first');
                }
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                isSelected={selectedReport?.id === report.id}
                onSelect={() => setSelectedReport(report)}
                onGenerate={() => handleGenerate(report)}
                onExport={() => handleExport(report)}
              />
            ))}
            {filteredReports.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No reports found</p>
              </Card>
            )}
          </div>
        </div>

        {/* Report Preview */}
        <div className="col-span-3">
          <ReportPreview
            report={selectedReport}
            onRefresh={() => {
              if (selectedReport) {
                toast.success('Refreshing report data...');
              }
            }}
          />
        </div>
      </div>

      {/* Schedule Dialog */}
      <ScheduleReportDialog
        report={selectedReport}
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
      />
    </div>
  );
}
