import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PDFExporter } from '@/components/common/PDFExporter';
import {
  Download,
  RefreshCw,
  Calendar,
  Clock,
  FileSpreadsheet,
  Presentation,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Report } from './ReportCard';

interface ReportPreviewProps {
  report: Report | null;
  onRefresh: () => void;
}

// Sample data for different report types
const projectStatusData = [
  { name: 'On Track', value: 5, color: 'hsl(var(--success))' },
  { name: 'At Risk', value: 2, color: 'hsl(var(--warning))' },
  { name: 'Critical', value: 1, color: 'hsl(var(--destructive))' },
];

const budgetTrendData = [
  { month: 'Jan', budget: 2500000, actual: 2350000 },
  { month: 'Feb', budget: 2700000, actual: 2680000 },
  { month: 'Mar', budget: 2900000, actual: 3100000 },
  { month: 'Apr', budget: 3100000, actual: 2950000 },
  { month: 'May', budget: 3300000, actual: 3250000 },
  { month: 'Jun', budget: 3500000, actual: 3400000 },
];

const velocityData = [
  { sprint: 'S7', planned: 32, completed: 28 },
  { sprint: 'S8', planned: 35, completed: 33 },
  { sprint: 'S9', planned: 38, completed: 36 },
  { sprint: 'S10', planned: 40, completed: 42 },
  { sprint: 'S11', planned: 42, completed: 40 },
  { sprint: 'S12', planned: 45, completed: 38 },
];

const resourceUtilizationData = [
  { name: 'Development', utilized: 85, available: 15 },
  { name: 'Design', utilized: 72, available: 28 },
  { name: 'QA', utilized: 90, available: 10 },
  { name: 'DevOps', utilized: 65, available: 35 },
  { name: 'PM', utilized: 78, available: 22 },
];

export function ReportPreview({ report, onRefresh }: ReportPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  if (!report) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <div className="text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Select a report to preview</p>
            <p className="text-sm mt-1">
              Choose a report from the list to view its contents
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const Icon = report.icon;

  const renderChart = () => {
    switch (report.type) {
      case 'status':
        return (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-4">Project Health Distribution</h4>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-4">Sprint Velocity Trend</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={velocityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="sprint" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="planned" fill="hsl(var(--muted-foreground))" name="Planned" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" name="Completed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'financial':
        return (
          <div>
            <h4 className="text-sm font-medium mb-4">Budget vs Actuals</h4>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={budgetTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => `$${value / 1000000}M`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, '']}
                />
                <Area type="monotone" dataKey="budget" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} name="Budget" />
                <Area type="monotone" dataKey="actual" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.3} name="Actual" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'resource':
        return (
          <div>
            <h4 className="text-sm font-medium mb-4">Resource Utilization by Team</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={resourceUtilizationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="utilized" stackId="a" fill="hsl(var(--primary))" name="Utilized %" radius={[0, 4, 4, 0]} />
                <Bar dataKey="available" stackId="a" fill="hsl(var(--muted))" name="Available %" radius={[0, 4, 4, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'risk':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Risk Summary</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="text-2xl font-bold text-destructive">3</div>
                <div className="text-xs text-muted-foreground">High Risks</div>
              </div>
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <div className="text-2xl font-bold text-warning">7</div>
                <div className="text-xs text-muted-foreground">Medium Risks</div>
              </div>
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <div className="text-2xl font-bold text-success">12</div>
                <div className="text-xs text-muted-foreground">Low Risks</div>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Risk</th>
                    <th className="text-left p-3 font-medium">Severity</th>
                    <th className="text-left p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3">Resource availability</td>
                    <td className="p-3"><Badge variant="destructive">High</Badge></td>
                    <td className="p-3"><Badge variant="outline">Monitoring</Badge></td>
                  </tr>
                  <tr>
                    <td className="p-3">Third-party dependency delay</td>
                    <td className="p-3"><Badge className="bg-warning/80">Medium</Badge></td>
                    <td className="p-3"><Badge variant="outline">Mitigating</Badge></td>
                  </tr>
                  <tr>
                    <td className="p-3">Scope creep</td>
                    <td className="p-3"><Badge className="bg-warning/80">Medium</Badge></td>
                    <td className="p-3"><Badge variant="outline">Active</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>Custom report preview</p>
          </div>
        );
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-primary/10`}>
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{report.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{report.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <PDFExporter
              title={report.name}
              filename={report.id}
              contentRef={contentRef}
              variant="dropdown"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
          <span className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Generated: {report.lastGenerated}
          </span>
          {report.nextRun && (
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Next run: {report.nextRun}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto" ref={contentRef}>
        {renderChart()}
      </CardContent>
    </Card>
  );
}
