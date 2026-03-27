import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProjectContext } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Download, DollarSign, ShieldAlert } from 'lucide-react';
import { formatDate, formatCurrency, exportToCSV } from '@/lib/utils';

interface Milestone {
  id: string;
  title: string;
  due_date: string | null;
  actual_date?: string | null;
  status: string;
  milestone_value?: number | null;
  is_critical?: boolean;
}

interface ContractConfig {
  penalty_rate_pct: number;
  penalty_cap_pct: number;
  contract_value: number;
}

function calcDelayWeeks(planned: string | null, actual: string | null): number {
  if (!planned || !actual) return 0;
  const diff = new Date(actual).getTime() - new Date(planned).getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24 * 7)));
}

function capStatus(accrued: number, cap: number): { label: string; className: string } {
  const pct = cap > 0 ? accrued / cap : 0;
  if (pct >= 1) return { label: 'Cap Reached', className: 'bg-red-500/15 text-red-700 dark:text-red-400' };
  if (pct >= 0.8) return { label: 'Approaching Cap', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' };
  return { label: 'Within Cap', className: 'bg-green-500/15 text-green-700 dark:text-green-400' };
}

export default function PenaltyTrackerTab() {
  const { settings } = useProjectContext();
  const projectId = settings.id;

  const { data: milestones = [], isLoading: loadingMs } = useQuery({
    queryKey: ['milestones_penalty', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('id, title, due_date, actual_date, status, milestone_value, is_critical')
        .eq('project_id', projectId)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data as Milestone[];
    },
    enabled: !!projectId,
  });

  const { data: contractConfig } = useQuery<ContractConfig | null>({
    queryKey: ['contract_config', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_contract_config')
        .select('penalty_rate_pct, penalty_cap_pct, contract_value')
        .eq('project_id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data as ContractConfig | null;
    },
    enabled: !!projectId,
  });

  const penaltyRate = contractConfig?.penalty_rate_pct ?? 0.5;
  const capPct = contractConfig?.penalty_cap_pct ?? 10;

  const rows = milestones.map(m => {
    const delayWeeks = calcDelayWeeks(m.due_date, m.actual_date ?? null);
    const value = m.milestone_value ?? 0;
    const accrued = delayWeeks * (penaltyRate / 100) * value;
    const cap = (capPct / 100) * value;
    const status = capStatus(accrued, cap);
    return { ...m, delayWeeks, accrued, cap, status };
  });

  const totalExposure = rows.reduce((s, r) => s + r.accrued, 0);
  const totalCap = rows.reduce((s, r) => s + r.cap, 0);
  const headroom = totalCap - totalExposure;

  const handleExport = () => {
    exportToCSV(
      rows.map(r => ({
        Milestone: r.title,
        'Planned Date': r.due_date ? formatDate(r.due_date) : '',
        'Actual Date': r.actual_date ? formatDate(r.actual_date) : '',
        'Delay (weeks)': r.delayWeeks,
        'Milestone Value': formatCurrency(r.cap / (capPct / 100)),
        'Accrued Penalty': formatCurrency(r.accrued),
        'Cap Amount': formatCurrency(r.cap),
        Status: r.status.label,
      })),
      'penalty_tracker'
    );
  };

  if (loadingMs) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      {/* Warning if no contract config */}
      {!contractConfig && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>No contract configuration found. Penalty rates default to {penaltyRate}%/week, cap {capPct}%. Configure in Program Setup → Contract Terms.</span>
        </div>
      )}

      {/* Exposure Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-red-500" />
            <span className="text-xs text-muted-foreground">Total Exposure</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExposure)}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Cap</span>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalCap)}</div>
        </div>
        <div className={`rounded-lg border bg-card p-4 ${headroom < 0 ? 'border-red-500/40' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className={`h-4 w-4 ${headroom < 0 ? 'text-red-500' : 'text-green-500'}`} />
            <span className="text-xs text-muted-foreground">Remaining Headroom</span>
          </div>
          <div className={`text-2xl font-bold ${headroom < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(Math.abs(headroom))}
            {headroom < 0 && <span className="text-xs ml-1">EXCEEDED</span>}
          </div>
        </div>
      </div>

      {/* Contract terms badge */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">Penalty rate: {penaltyRate}%/week</Badge>
        <Badge variant="outline">Cap: {capPct}% per milestone</Badge>
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1.5" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      {milestones.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-medium">No milestones with delay data yet</p>
          <p className="text-xs mt-1">Add milestones with actual completion dates and milestone values to calculate penalties</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Milestone</th>
                <th className="text-left p-3 font-medium">Planned Date</th>
                <th className="text-left p-3 font-medium">Actual / Forecast</th>
                <th className="text-right p-3 font-medium">Delay (weeks)</th>
                <th className="text-right p-3 font-medium">Milestone Value</th>
                <th className="text-right p-3 font-medium">Accrued Penalty</th>
                <th className="text-right p-3 font-medium">Cap Amount</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="p-3">
                    <div className="font-medium">{r.title}</div>
                    {r.is_critical && <Badge className="text-xs bg-red-500/15 text-red-700 dark:text-red-400 mt-0.5">Critical</Badge>}
                  </td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{r.due_date ? formatDate(r.due_date) : '—'}</td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{r.actual_date ? formatDate(r.actual_date) : '—'}</td>
                  <td className="p-3 text-right">
                    {r.delayWeeks > 0 ? (
                      <span className="text-red-600 font-semibold">{r.delayWeeks}w</span>
                    ) : '—'}
                  </td>
                  <td className="p-3 text-right font-mono text-xs">{r.milestone_value ? formatCurrency(r.milestone_value) : '—'}</td>
                  <td className="p-3 text-right font-mono text-xs text-red-600">
                    {r.accrued > 0 ? formatCurrency(r.accrued) : '—'}
                  </td>
                  <td className="p-3 text-right font-mono text-xs">{r.cap > 0 ? formatCurrency(r.cap) : '—'}</td>
                  <td className="p-3">
                    {r.accrued > 0 ? (
                      <Badge className={`text-xs ${r.status.className}`}>{r.status.label}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">No delay</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Summary row */}
            <tfoot className="border-t bg-muted/30">
              <tr>
                <td colSpan={5} className="p-3 font-semibold text-sm">Total</td>
                <td className="p-3 text-right font-mono text-sm font-bold text-red-600">{formatCurrency(totalExposure)}</td>
                <td className="p-3 text-right font-mono text-sm font-semibold">{formatCurrency(totalCap)}</td>
                <td className="p-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
