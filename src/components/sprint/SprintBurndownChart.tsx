import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingDown, Calendar, Target, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
  ReferenceLine,
} from 'recharts';

interface BurndownDataPoint {
  day: string;
  date: string;
  ideal: number;
  actual: number | null;
  remaining: number | null;
}

const generateBurndownData = (): BurndownDataPoint[] => {
  const totalPoints = 53;
  const sprintDays = 10;
  const idealDecrement = totalPoints / sprintDays;

  const data: BurndownDataPoint[] = [];
  const startDate = new Date('2024-08-05');

  // Simulated actual progress
  const actualProgress = [53, 50, 48, 42, 38, 35, 31, null, null, null];

  for (let i = 0; i <= sprintDays; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);

    data.push({
      day: `Day ${i}`,
      date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ideal: Math.max(0, totalPoints - idealDecrement * i),
      actual: actualProgress[i] !== undefined ? actualProgress[i] : null,
      remaining: actualProgress[i] !== undefined ? actualProgress[i] : null,
    });
  }

  return data;
};

interface SprintBurndownChartProps {
  sprintName?: string;
  totalPoints?: number;
  completedPoints?: number;
  daysRemaining?: number;
  className?: string;
}

export function SprintBurndownChart({
  sprintName = 'Sprint 12',
  totalPoints = 53,
  completedPoints = 22,
  daysRemaining = 4,
  className,
}: SprintBurndownChartProps) {
  const burndownData = useMemo(() => generateBurndownData(), []);

  const lastActualPoint = burndownData.filter(d => d.actual !== null).slice(-1)[0];
  const velocityStatus = lastActualPoint && lastActualPoint.actual! > lastActualPoint.ideal
    ? 'behind'
    : 'on-track';

  const projectedCompletion = useMemo(() => {
    const actualPoints = burndownData.filter(d => d.actual !== null);
    if (actualPoints.length < 2) return null;

    const lastTwo = actualPoints.slice(-2);
    const dailyBurn = (lastTwo[0].actual! - lastTwo[1].actual!);
    const remaining = lastTwo[1].actual!;
    const daysToComplete = dailyBurn > 0 ? Math.ceil(remaining / dailyBurn) : Infinity;

    return daysToComplete;
  }, [burndownData]);

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Sprint Burndown
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={velocityStatus === 'on-track' ? 'success' : 'warning'}>
              {velocityStatus === 'on-track' ? 'On Track' : 'Behind Schedule'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            <span>{completedPoints}/{totalPoints} pts</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{daysRemaining} days remaining</span>
          </div>
          {projectedCompletion && projectedCompletion !== Infinity && (
            <div className="flex items-center gap-1">
              {projectedCompletion > daysRemaining ? (
                <AlertTriangle className="h-4 w-4 text-warning" />
              ) : null}
              <span>Est. completion: {projectedCompletion} days</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={burndownData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--muted))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 'dataMax + 5']}
                className="text-muted-foreground"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload) return null;
                  return (
                    <div className="bg-popover border rounded-lg p-2 shadow-lg">
                      <p className="text-xs font-medium mb-1">{label}</p>
                      {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-xs" style={{ color: entry.color }}>
                          {entry.name}: {entry.value !== null ? `${entry.value} pts` : 'N/A'}
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                content={({ payload }) => (
                  <div className="flex items-center justify-center gap-4 text-xs">
                    {payload?.map((entry: any, index: number) => (
                      <div key={index} className="flex items-center gap-1">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
              <ReferenceLine
                y={0}
                stroke="hsl(var(--success))"
                strokeDasharray="5 5"
                label={{
                  value: 'Sprint Goal',
                  position: 'right',
                  fontSize: 10,
                  fill: 'hsl(var(--success))',
                }}
              />
              <Area
                type="monotone"
                dataKey="ideal"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#colorIdeal)"
                name="Ideal"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                fill="url(#colorActual)"
                name="Actual"
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{completedPoints}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{totalPoints - completedPoints}</p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success">
              {Math.round(completedPoints / (10 - daysRemaining) * 10) / 10}
            </p>
            <p className="text-xs text-muted-foreground">Avg Velocity/Day</p>
          </div>
          <div className="text-center">
            <p className={cn(
              'text-2xl font-bold',
              velocityStatus === 'on-track' ? 'text-success' : 'text-warning'
            )}>
              {Math.round((totalPoints - completedPoints) / daysRemaining * 10) / 10}
            </p>
            <p className="text-xs text-muted-foreground">Required/Day</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
