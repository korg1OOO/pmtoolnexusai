import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Download,
  Filter,
  Calendar,
  FileText,
  TrendingUp,
  PieChart,
  Activity,
  Clock,
  RefreshCw,
  ChevronRight,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/enterprise/KPICard';
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
  Legend 
} from 'recharts';

interface Report {
  id: string;
  name: string;
  type: 'status' | 'financial' | 'resource' | 'risk' | 'custom';
  description: string;
  lastGenerated: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'on-demand';
  icon: React.ElementType;
}

const mockReports: Report[] = [
  { id: 'rpt-1', name: 'Portfolio Status Report', type: 'status', description: 'Executive summary of all active projects', lastGenerated: '2024-03-25', frequency: 'weekly', icon: BarChart3 },
  { id: 'rpt-2', name: 'Financial Summary', type: 'financial', description: 'Budget vs actuals across portfolios', lastGenerated: '2024-03-24', frequency: 'weekly', icon: TrendingUp },
  { id: 'rpt-3', name: 'Resource Utilization', type: 'resource', description: 'Team capacity and allocation analysis', lastGenerated: '2024-03-25', frequency: 'daily', icon: Activity },
  { id: 'rpt-4', name: 'Risk Register', type: 'risk', description: 'Active risks and mitigation status', lastGenerated: '2024-03-23', frequency: 'weekly', icon: FileText },
  { id: 'rpt-5', name: 'Sprint Velocity', type: 'custom', description: 'Sprint-over-sprint velocity trends', lastGenerated: '2024-03-22', frequency: 'monthly', icon: PieChart },
  { id: 'rpt-6', name: 'Milestone Tracker', type: 'status', description: 'Upcoming and overdue milestones', lastGenerated: '2024-03-25', frequency: 'daily', icon: Clock },
];

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

const getTypeColor = (type: Report['type']) => {
  switch (type) {
    case 'status': return 'bg-primary/10 text-primary';
    case 'financial': return 'bg-success/10 text-success';
    case 'resource': return 'bg-warning/10 text-warning';
    case 'risk': return 'bg-destructive/10 text-destructive';
    case 'custom': return 'bg-muted text-foreground';
  }
};

export function ReportsView() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate insights and track project performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <FileText className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard 
          title="Reports Generated" 
          value="24" 
          subtitle="This month" 
          icon={FileText} 
          status="neutral" 
        />
        <KPICard 
          title="Scheduled Reports" 
          value={mockReports.filter(r => r.frequency !== 'on-demand').length.toString()} 
          subtitle="Auto-generated" 
          icon={Clock} 
          status="neutral" 
        />
        <KPICard 
          title="Data Sources" 
          value="8" 
          subtitle="Connected integrations" 
          icon={Activity} 
          status="success" 
        />
        <KPICard 
          title="Last Updated" 
          value="2h ago" 
          subtitle="Data refresh" 
          icon={RefreshCw} 
          status="neutral" 
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Reports List */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Available Reports</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {mockReports.map((report) => {
                const Icon = report.icon;
                return (
                  <motion.button
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                      selectedReport?.id === report.id ? 'bg-muted/50' : ''
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(report.type)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{report.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{report.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">{report.frequency}</Badge>
                          <span className="text-xs text-muted-foreground">Last: {report.lastGenerated}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Preview */}
        <div className="col-span-2 space-y-6">
          {/* Project Status Pie Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Project Health Distribution</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
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
            </CardContent>
          </Card>

          {/* Budget Trend */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Budget vs Actuals</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={budgetTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => `$${value / 1000000}M`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                    formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, '']}
                  />
                  <Area type="monotone" dataKey="budget" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} name="Budget" />
                  <Area type="monotone" dataKey="actual" stackId="2" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.3} name="Actual" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sprint Velocity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sprint Velocity</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={velocityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="sprint" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="planned" fill="hsl(var(--muted-foreground))" name="Planned" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" name="Completed" radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
