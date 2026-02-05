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
  Target,
  Loader2,
  Trash2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KPICard } from '@/components/enterprise/KPICard';
import { PDFExporter } from '@/components/common/PDFExporter';
import {
  ReportCard,
  ReportPreview,
  ReportCategories,
  ScheduleReportDialog,
} from '@/components/reports';
import { toast } from 'sonner';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useReports, Report, ReportCategory } from '@/hooks/useReports';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea';
import { useTeamMembers } from '@/hooks/useTeamMembers';


export function ReportsView() {
  const { settings } = useProjectContext();
  const { data: reports, isLoading, createReport, deleteReport } = useReports(settings.id);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const [newReport, setNewReport] = useState<Partial<Report>>({
    name: '',
    description: '',
    type: 'status',
    category: 'Status',
    frequency: 'weekly',
    is_scheduled: false
  });

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: reports?.length || 0,
      status: 0,
      financial: 0,
      resource: 0,
      risk: 0,
      custom: 0,
    };
    reports?.forEach((report) => {
      if (counts[report.type]) counts[report.type]++;
    });
    return counts;
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports?.filter((report) => {
      const matchesCategory = selectedCategory === 'all' || report.type === (selectedCategory as string).toLowerCase();
      const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (report.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }) || [];
  }, [reports, selectedCategory, searchQuery]);

  const scheduledCount = reports?.filter((r) => r.is_scheduled).length || 0;

  const handleGenerate = (report: Report) => {
    toast.success(`Generating "${report.name}"...`);
    // In a real app, this would trigger a backend generation process
    setSelectedReport(report);
  };

  const handleExport = (report: Report) => {
    toast.success(`Exporting "${report.name}" to PDF...`);
  };

  const handleCreate = async () => {
    try {
      await createReport.mutateAsync(newReport);
      setIsCreateOpen(false);
      setNewReport({
        name: '',
        description: '',
        type: 'status',
        category: 'Status',
        frequency: 'weekly',
        is_scheduled: false
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this report configuration?')) {
      await deleteReport.mutateAsync(id);
      if (selectedReport?.id === id) setSelectedReport(null);
    }
  }

  // Helper to map DB types to UI icons needed for ReportCard (which expects lucide-react icons)
  // We need to patch ReportCard to accept our Report type, or map it here.
  // Ideally ReportCard should just take the icon component or name.
  // For now let's map it dynamically in the render if possible, but ReportCard expects a Report type that acts like the mock one.
  // We might need to cast or adapt our DB Report to the UI Report interface if they differ significantly.
  // Looking at previous ReportsView, the mock type had 'icon'. Our DB Type doesn't.
  const getIconForType = (type: string) => {
    switch (type) {
      case 'status': return Activity;
      case 'financial': return DollarSign;
      case 'resource': return Users;
      case 'risk': return AlertTriangle;
      case 'custom': return FileText;
      default: return FileText;
    }
  };

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

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
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Report</DialogTitle>
                <DialogDescription>Configure a new report template.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newReport.name}
                    onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                    placeholder="e.g. Weekly Status"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newReport.type}
                    onValueChange={(v: any) => {
                      let category = 'Custom';
                      if (v === 'status') category = 'Status';
                      if (v === 'financial') category = 'Financial';
                      if (v === 'resource') category = 'Resource';
                      if (v === 'risk') category = 'Risk';
                      setNewReport({ ...newReport, type: v, category: category as any })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="resource">Resource</SelectItem>
                      <SelectItem value="risk">Risk</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={newReport.frequency || 'on-demand'}
                    onValueChange={(v: any) => setNewReport({ ...newReport, frequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="on-demand">On Demand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newReport.description || ''}
                    onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newReport.name || createReport.isPending}>
                  {createReport.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Total Reports"
          value={(reports?.length || 0).toString()}
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
          value="4"
          subtitle="Reports created"
          icon={Activity}
          status="neutral"
        />
        <KPICard
          title="Last Updated"
          value="Just now"
          subtitle="Data refresh"
          icon={RefreshCw}
          status="neutral"
        />
      </div>

      {/* Category Filter */}
      <div className="flex items-center justify-between">
        <ReportCategories
          selectedCategory={selectedCategory as any}
          onCategoryChange={(c) => setSelectedCategory(c)}
          counts={categoryCounts as any} // Cast if types slightly mismatch
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
              <div key={report.id} className="relative group">
                <ReportCard
                  report={{
                    ...report,
                    // Adapter for UI component requirements
                    icon: getIconForType(report.type),
                    lastGenerated: report.last_generated || 'Never',
                    frequency: report.frequency || 'on-demand',
                    isScheduled: report.is_scheduled,
                    nextRun: report.next_run || undefined
                  } as any}
                  isSelected={selectedReport?.id === report.id}
                  onSelect={() => setSelectedReport(report)}
                  onGenerate={() => handleGenerate(report)}
                  onExport={() => handleExport(report)}
                />
                <Button
                  variant="ghost"
                  size="iconSm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => handleDelete(report.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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
            report={selectedReport ? {
              ...selectedReport,
              icon: getIconForType(selectedReport.type),
              lastGenerated: selectedReport.last_generated || 'Never',
              frequency: selectedReport.frequency || 'on-demand',
              isScheduled: selectedReport.is_scheduled,
              nextRun: selectedReport.next_run || undefined
            } as any : null}
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
        report={selectedReport ? {
          ...selectedReport,
          icon: getIconForType(selectedReport.type),
          lastGenerated: selectedReport.last_generated || 'Never',
          frequency: selectedReport.frequency || 'on-demand',
          isScheduled: selectedReport.is_scheduled,
          nextRun: selectedReport.next_run || undefined
        } as any : null}
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
      />
    </div>
  );
}
