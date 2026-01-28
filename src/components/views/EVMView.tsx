import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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

const evmData = {
  asOfDate: '2024-08-10',
  bac: 2500000, // Budget at Completion
  pv: 1250000, // Planned Value
  ev: 1125000, // Earned Value
  ac: 1180000, // Actual Cost
  
  // Calculated metrics
  sv: -125000, // Schedule Variance (EV - PV)
  cv: -55000, // Cost Variance (EV - AC)
  spi: 0.90, // Schedule Performance Index (EV / PV)
  cpi: 0.95, // Cost Performance Index (EV / AC)
  
  // Forecasts
  eac: 2631579, // Estimate at Completion (BAC / CPI)
  etc: 1451579, // Estimate to Complete (EAC - AC)
  vac: -131579, // Variance at Completion (BAC - EAC)
  tcpi: 1.04, // To-Complete Performance Index
};

const trendData = [
  { month: 'Jan', pv: 200000, ev: 195000, ac: 190000 },
  { month: 'Feb', pv: 400000, ev: 380000, ac: 395000 },
  { month: 'Mar', pv: 600000, ev: 570000, ac: 610000 },
  { month: 'Apr', pv: 800000, ev: 760000, ac: 810000 },
  { month: 'May', pv: 950000, ev: 910000, ac: 960000 },
  { month: 'Jun', pv: 1100000, ev: 1020000, ac: 1080000 },
  { month: 'Jul', pv: 1180000, ev: 1080000, ac: 1140000 },
  { month: 'Aug', pv: 1250000, ev: 1125000, ac: 1180000 },
];

const spiCpiTrend = [
  { month: 'Jan', spi: 0.98, cpi: 1.03 },
  { month: 'Feb', spi: 0.95, cpi: 0.96 },
  { month: 'Mar', spi: 0.95, cpi: 0.93 },
  { month: 'Apr', spi: 0.95, cpi: 0.94 },
  { month: 'May', spi: 0.96, cpi: 0.95 },
  { month: 'Jun', spi: 0.93, cpi: 0.94 },
  { month: 'Jul', spi: 0.92, cpi: 0.95 },
  { month: 'Aug', spi: 0.90, cpi: 0.95 },
];

const wbsMetrics = [
  { wbs: '1.0', name: 'Discovery', pv: 300000, ev: 300000, ac: 290000, status: 'green' },
  { wbs: '2.0', name: 'Design', pv: 450000, ev: 450000, ac: 470000, status: 'green' },
  { wbs: '3.0', name: 'Implementation', pv: 500000, ev: 375000, ac: 420000, status: 'red' },
  { wbs: '4.0', name: 'Testing', pv: 0, ev: 0, ac: 0, status: 'gray' },
  { wbs: '5.0', name: 'Go-Live', pv: 0, ev: 0, ac: 0, status: 'gray' },
];

export function EVMView() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getVarianceStatus = (value: number, inverse = false) => {
    const isPositive = inverse ? value < 0 : value > 0;
    return isPositive ? 'success' : value === 0 ? 'secondary' : 'destructive';
  };

  const getIndexStatus = (value: number) => {
    if (value >= 1) return 'success';
    if (value >= 0.9) return 'warning';
    return 'destructive';
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
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
                Performance analysis as of {new Date(evmData.asOfDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button>
              Export Report
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
            <TabsTrigger value="wbs">WBS Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Planned Value (PV)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(evmData.pv)}</div>
                  <p className="text-xs text-muted-foreground">of {formatCurrency(evmData.bac)} BAC</p>
                  <Progress value={(evmData.pv / evmData.bac) * 100} className="h-2 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Earned Value (EV)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(evmData.ev)}</div>
                  <p className="text-xs text-muted-foreground">{((evmData.ev / evmData.bac) * 100).toFixed(1)}% complete</p>
                  <Progress value={(evmData.ev / evmData.bac) * 100} className="h-2 mt-2 [&>div]:bg-success" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Actual Cost (AC)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(evmData.ac)}</div>
                  <p className="text-xs text-muted-foreground">{((evmData.ac / evmData.bac) * 100).toFixed(1)}% of BAC spent</p>
                  <Progress value={(evmData.ac / evmData.bac) * 100} className="h-2 mt-2 [&>div]:bg-warning" />
                </CardContent>
              </Card>
              <Card className={cn(
                "border-2",
                evmData.cpi >= 1 && evmData.spi >= 1 ? 'border-success/50 bg-success/5' :
                evmData.cpi < 0.9 || evmData.spi < 0.9 ? 'border-destructive/50 bg-destructive/5' :
                'border-warning/50 bg-warning/5'
              )}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Project Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {evmData.cpi >= 1 && evmData.spi >= 1 ? (
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    ) : evmData.cpi < 0.9 || evmData.spi < 0.9 ? (
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-warning" />
                    )}
                    <span className="text-xl font-bold">
                      {evmData.cpi >= 1 && evmData.spi >= 1 ? 'On Track' :
                       evmData.cpi < 0.9 || evmData.spi < 0.9 ? 'At Risk' : 'Needs Attention'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Variances */}
            <div className="grid grid-cols-2 gap-4">
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
                      {evmData.sv < 0 ? <TrendingDown className="h-4 w-4 text-destructive" /> : <TrendingUp className="h-4 w-4 text-success" />}
                      <span className={cn("font-semibold", evmData.sv < 0 ? 'text-destructive' : 'text-success')}>
                        {formatCurrency(evmData.sv)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Schedule Performance Index (SPI)</span>
                    <Badge variant={getIndexStatus(evmData.spi)} className="text-sm">
                      {evmData.spi.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    <Info className="h-4 w-4 inline mr-2 text-muted-foreground" />
                    Project is {((1 - evmData.spi) * 100).toFixed(0)}% behind schedule
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
                      {evmData.cv < 0 ? <TrendingDown className="h-4 w-4 text-destructive" /> : <TrendingUp className="h-4 w-4 text-success" />}
                      <span className={cn("font-semibold", evmData.cv < 0 ? 'text-destructive' : 'text-success')}>
                        {formatCurrency(evmData.cv)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cost Performance Index (CPI)</span>
                    <Badge variant={getIndexStatus(evmData.cpi)} className="text-sm">
                      {evmData.cpi.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    <Info className="h-4 w-4 inline mr-2 text-muted-foreground" />
                    Project is {((1 - evmData.cpi) * 100).toFixed(0)}% over budget
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* S-Curve Chart */}
            <Card>
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
                      <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} className="text-xs" />
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

          <TabsContent value="trends" className="space-y-6">
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
                      <YAxis domain={[0.8, 1.1]} className="text-xs" />
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

          <TabsContent value="forecasts" className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Estimate at Completion (EAC)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "text-2xl font-bold",
                    evmData.eac > evmData.bac ? 'text-destructive' : 'text-success'
                  )}>
                    {formatCurrency(evmData.eac)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {evmData.eac > evmData.bac ? 'Over budget by ' : 'Under budget by '}
                    {formatCurrency(Math.abs(evmData.eac - evmData.bac))}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Estimate to Complete (ETC)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(evmData.etc)}</div>
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
                    evmData.tcpi > 1.1 ? 'text-destructive' : evmData.tcpi > 1 ? 'text-warning' : 'text-success'
                  )}>
                    {evmData.tcpi.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {evmData.tcpi > 1.1 ? 'Very difficult to achieve' : evmData.tcpi > 1 ? 'Challenging' : 'Achievable'}
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
                    evmData.vac < 0 ? 'text-destructive' : 'text-success'
                  )}>
                    {formatCurrency(evmData.vac)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Project is forecasted to be {evmData.vac < 0 ? 'over' : 'under'} budget by {((Math.abs(evmData.vac) / evmData.bac) * 100).toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wbs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">WBS Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {wbsMetrics.map((wbs) => (
                    <div key={wbs.wbs} className="p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-muted-foreground">{wbs.wbs}</span>
                          <span className="font-medium">{wbs.name}</span>
                        </div>
                        <Badge variant={
                          wbs.status === 'green' ? 'success' :
                          wbs.status === 'red' ? 'destructive' : 'secondary'
                        }>
                          {wbs.status === 'green' ? 'On Track' : wbs.status === 'red' ? 'Behind' : 'Not Started'}
                        </Badge>
                      </div>
                      {wbs.pv > 0 && (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">PV:</span>{' '}
                            <span className="font-medium">{formatCurrency(wbs.pv)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">EV:</span>{' '}
                            <span className={cn(
                              "font-medium",
                              wbs.ev < wbs.pv ? 'text-destructive' : 'text-success'
                            )}>{formatCurrency(wbs.ev)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">AC:</span>{' '}
                            <span className={cn(
                              "font-medium",
                              wbs.ac > wbs.ev ? 'text-destructive' : 'text-success'
                            )}>{formatCurrency(wbs.ac)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
