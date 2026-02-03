import React, { useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Info,
  Filter,
  Loader2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { PDFExporter, PDFExportSection } from '@/components/common/PDFExporter';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useEVM } from '@/hooks/useEVM';

export function EVMView() {
  const { settings } = useProjectContext();
  const { data: snapshots, isLoading } = useEVM(settings.id);
  const contentRef = useRef<HTMLDivElement>(null);

  const pdfSections: PDFExportSection[] = [
    { id: 'overview', name: 'Key Metrics Overview', selector: '[data-section="overview"]' },
    { id: 'variances', name: 'Variances', selector: '[data-section="variances"]' },
    { id: 'scurve', name: 'S-Curve Chart', selector: '[data-section="scurve"]' },
    { id: 'trends', name: 'Performance Trends', selector: '[data-section="trends"]' },
    { id: 'forecasts', name: 'Forecasts', selector: '[data-section="forecasts"]' },
    { id: 'wbs', name: 'WBS Analysis', selector: '[data-section="wbs"]' },
  ];

  const latestSnapshot = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return null;
    return snapshots[snapshots.length - 1];
  }, [snapshots]);

  const trendData = useMemo(() => {
    if (!snapshots) return [];
    return snapshots.map(s => ({
      month: new Date(s.as_of_date).toLocaleDateString('default', { month: 'short' }),
      pv: s.pv,
      ev: s.ev,
      ac: s.ac,
      date: s.as_of_date
    }));
  }, [snapshots]);

  const spiCpiTrend = useMemo(() => {
    if (!snapshots) return [];
    return snapshots.map(s => ({
      month: new Date(s.as_of_date).toLocaleDateString('default', { month: 'short' }),
      spi: s.spi,
      cpi: s.cpi,
      date: s.as_of_date
    }));
  }, [snapshots]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getIndexStatus = (value: number) => {
    if (value >= 1) return 'success';
    if (value >= 0.9) return 'warning';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!latestSnapshot) {
    return (
      <div className="flex flex-col h-full overflow-auto text-center items-center justify-center p-12">
        <div className="p-6 rounded-2xl bg-muted/20 border-2 border-dashed max-w-md">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">No Performance Data</h2>
          <p className="text-muted-foreground mb-6">
            There are no EVM snapshots available for this project. Start by capturing a baseline or regular performance status to see analytics.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create First Snapshot
          </Button>
        </div>
      </div>
    );
  }

  // Calculated forecast metrics
  const bac = latestSnapshot.bac;
  const ev = latestSnapshot.ev;
  const ac = latestSnapshot.ac;
  const cpi = latestSnapshot.cpi;
  const spi = latestSnapshot.spi;

  const sv = ev - latestSnapshot.pv;
  const cv = ev - ac;
  const eac = cpi > 0 ? bac / cpi : bac;
  const etc = eac - ac;
  const vac = bac - eac;
  const tcpi = (bac - ev) / (bac - ac || 1);

  return (
    <div className="flex flex-col h-full overflow-auto" ref={contentRef}>
      {/* Header */}
      <div className="p-6 border-b bg-card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Earned Value Management</h1>
              <p className="text-muted-foreground">
                Performance analysis for {settings.name} as of {new Date(latestSnapshot.as_of_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <PDFExporter
              title="EVM Analysis Report"
              filename="evm-report"
              contentRef={contentRef}
              sections={pdfSections}
              showSectionPicker
              orientation="landscape"
              variant="dropdown"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4" data-section="overview">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Planned Value (PV)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(latestSnapshot.pv)}</div>
                  <p className="text-xs text-muted-foreground">of {formatCurrency(latestSnapshot.bac)} BAC</p>
                  <Progress value={(latestSnapshot.pv / latestSnapshot.bac) * 100} className="h-2 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Earned Value (EV)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(latestSnapshot.ev)}</div>
                  <p className="text-xs text-muted-foreground">{((latestSnapshot.ev / latestSnapshot.bac) * 100).toFixed(1)}% complete</p>
                  <Progress value={(latestSnapshot.ev / latestSnapshot.bac) * 100} className="h-2 mt-2 [&>div]:bg-success" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Actual Cost (AC)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(latestSnapshot.ac)}</div>
                  <p className="text-xs text-muted-foreground">{((latestSnapshot.ac / latestSnapshot.bac) * 100).toFixed(1)}% of BAC spent</p>
                  <Progress value={(latestSnapshot.ac / latestSnapshot.bac) * 100} className="h-2 mt-2 [&>div]:bg-warning" />
                </CardContent>
              </Card>
              <Card className={cn(
                "border-2",
                latestSnapshot.cpi >= 1 && latestSnapshot.spi >= 1 ? 'border-success/50 bg-success/5' :
                  latestSnapshot.cpi < 0.9 || latestSnapshot.spi < 0.9 ? 'border-destructive/50 bg-destructive/5' :
                    'border-warning/50 bg-warning/5'
              )}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Project Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {latestSnapshot.cpi >= 1 && latestSnapshot.spi >= 1 ? (
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    ) : latestSnapshot.cpi < 0.9 || latestSnapshot.spi < 0.9 ? (
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-warning" />
                    )}
                    <span className="text-xl font-bold">
                      {latestSnapshot.cpi >= 1 && latestSnapshot.spi >= 1 ? 'On Track' :
                        latestSnapshot.cpi < 0.9 || latestSnapshot.spi < 0.9 ? 'At Risk' : 'Needs Attention'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Variances */}
            <div className="grid grid-cols-2 gap-4" data-section="variances">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Schedule Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Schedule Variance (SV)</span>
                    <div className="flex items-center gap-2">
                      {sv < 0 ? <TrendingDown className="h-4 w-4 text-destructive" /> : <TrendingUp className="h-4 w-4 text-success" />}
                      <span className={cn("font-semibold", sv < 0 ? 'text-destructive' : 'text-success')}>
                        {formatCurrency(sv)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Schedule Performance Index (SPI)</span>
                    <Badge variant={getIndexStatus(latestSnapshot.spi)} className="text-sm">
                      {latestSnapshot.spi.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    <Info className="h-4 w-4 inline mr-2 text-muted-foreground" />
                    {latestSnapshot.spi >= 1
                      ? "Project is on or ahead of schedule"
                      : `Project is ${((1 - latestSnapshot.spi) * 100).toFixed(0)}% behind schedule`}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Cost Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cost Variance (CV)</span>
                    <div className="flex items-center gap-2">
                      {cv < 0 ? <TrendingDown className="h-4 w-4 text-destructive" /> : <TrendingUp className="h-4 w-4 text-success" />}
                      <span className={cn("font-semibold", cv < 0 ? 'text-destructive' : 'text-success')}>
                        {formatCurrency(cv)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cost Performance Index (CPI)</span>
                    <Badge variant={getIndexStatus(latestSnapshot.cpi)} className="text-sm">
                      {latestSnapshot.cpi.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    <Info className="h-4 w-4 inline mr-2 text-muted-foreground" />
                    {latestSnapshot.cpi >= 1
                      ? "Project is performing within budget"
                      : `Project is ${((1 - latestSnapshot.cpi) * 100).toFixed(0)}% over budget`}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* S-Curve Chart */}
            <Card data-section="scurve">
              <CardHeader>
                <CardTitle className="text-base">Earned Value S-Curve</CardTitle>
                <CardDescription>PV, EV, and AC trend over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} className="text-xs" />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="pv" name="Planned Value" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground)/0.2)" />
                      <Area type="monotone" dataKey="ev" name="Earned Value" stroke="hsl(var(--success))" fill="hsl(var(--success)/0.2)" />
                      <Area type="monotone" dataKey="ac" name="Actual Cost" stroke="hsl(var(--warning))" fill="hsl(var(--warning)/0.2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6" data-section="trends">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Index Trends</CardTitle>
                <CardDescription>SPI and CPI over time (1.0 = on track)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spiCpiTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis domain={[0.5, 1.5]} className="text-xs" />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Legend />
                      <ReferenceLine y={1} stroke="hsl(var(--success))" strokeDasharray="5 5" />
                      <ReferenceLine y={0.9} stroke="hsl(var(--warning))" strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="spi" name="SPI" stroke="hsl(var(--primary))" strokeWidth={2} dot />
                      <Line type="monotone" dataKey="cpi" name="CPI" stroke="hsl(var(--info))" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecasts" className="space-y-6" data-section="forecasts">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Estimate at Completion (EAC)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "text-2xl font-bold",
                    eac > bac ? 'text-destructive' : 'text-success'
                  )}>
                    {formatCurrency(eac)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {eac > bac ? 'Over budget by ' : 'Under budget by '}
                    {formatCurrency(Math.abs(eac - bac))}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Estimate to Complete (ETC)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(etc)}</div>
                  <p className="text-xs text-muted-foreground">Remaining work cost</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">To-Complete Performance Index</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "text-2xl font-bold",
                    tcpi > 1.1 ? 'text-destructive' : tcpi > 1 ? 'text-warning' : 'text-success'
                  )}>
                    {tcpi.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tcpi > 1.1 ? 'Very difficult to achieve' : tcpi > 1 ? 'Challenging' : 'Achievable'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Forecast Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border bg-muted/20">
                  <h4 className="font-medium mb-2">Variance at Completion (VAC)</h4>
                  <div className={cn(
                    "text-xl font-bold",
                    vac < 0 ? 'text-destructive' : 'text-success'
                  )}>
                    {formatCurrency(vac)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Project is forecasted to be {vac < 0 ? 'over' : 'under'} budget by {((Math.abs(vac) / bac) * 100).toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
