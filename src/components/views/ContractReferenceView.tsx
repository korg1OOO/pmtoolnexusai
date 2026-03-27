import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProjectContext } from '@/contexts/ProjectContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, ScrollText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ContractConfig {
  id: string;
  contract_value: number;
  currency: string;
  payment_terms_days: number;
  penalty_rate_pct: number;
  penalty_cap_pct: number;
  acceptance_period_days: number;
  key_personnel_review_days: number;
  subcontractor_review_days: number | null;
  training_hours_target: number | null;
  training_sessions_target: number | null;
  training_max_per_session: number | null;
  hypercare_weeks: number | null;
  governing_reference: string | null;
  notes: string | null;
}

interface DocLink {
  id: string;
  project_id: string;
  name: string;
  doc_type: string;
  phase: string | null;
  version: string | null;
  url: string | null;
  status: 'active' | 'superseded' | 'draft';
  created_at: string;
}

const FIELD_GROUPS = [
  {
    label: 'Financial',
    fields: [
      { key: 'contract_value' as const, label: 'Contract Value', format: (v: any, cfg: ContractConfig) => formatCurrency(v) },
      { key: 'payment_terms_days' as const, label: 'Payment Terms', format: (v: any) => `${v} days` },
    ],
  },
  {
    label: 'Penalties',
    fields: [
      { key: 'penalty_rate_pct' as const, label: 'Penalty Rate', format: (v: any) => `${v}% per week` },
      { key: 'penalty_cap_pct' as const, label: 'Penalty Cap', format: (v: any) => `${v}% of milestone value` },
    ],
  },
  {
    label: 'Acceptance & Governance',
    fields: [
      { key: 'acceptance_period_days' as const, label: 'Acceptance Period', format: (v: any) => `${v} days` },
      { key: 'key_personnel_review_days' as const, label: 'Key Personnel Review', format: (v: any) => `${v} days` },
      { key: 'subcontractor_review_days' as const, label: 'Subcontractor Review', format: (v: any) => v ? `${v} days` : '—' },
      { key: 'governing_reference' as const, label: 'Governing Reference', format: (v: any) => v || '—' },
    ],
  },
  {
    label: 'Training',
    fields: [
      { key: 'training_sessions_target' as const, label: 'Sessions Target', format: (v: any) => v != null ? `${v} sessions` : '—' },
      { key: 'training_hours_target' as const, label: 'Hours Target', format: (v: any) => v != null ? `${v} hours` : '—' },
      { key: 'training_max_per_session' as const, label: 'Max per Session', format: (v: any) => v != null ? `${v} attendees` : '—' },
      { key: 'hypercare_weeks' as const, label: 'Hypercare Period', format: (v: any) => v != null ? `${v} weeks` : '—' },
    ],
  },
];

const DOC_STATUS_COLORS = {
  active: 'bg-green-500/15 text-green-700 dark:text-green-400',
  draft: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  superseded: 'bg-slate-500/15 text-slate-600',
};

export default function ContractReferenceView() {
  const { settings } = useProjectContext();
  const projectId = settings.id;

  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ['contract_config_full', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_contract_config')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data as ContractConfig | null;
    },
    enabled: !!projectId,
  });

  const { data: docs = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['contract_doc_links', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_document_links')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DocLink[];
    },
    enabled: !!projectId,
  });

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            Contract Quick Reference
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Key contract terms and document register.
            {!config && ' Configure in Program Setup → Contract Terms.'}
          </p>
        </div>
        {config && (
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/program-setup'}>
            Edit in Program Setup
          </Button>
        )}
      </div>

      {/* Contract Terms Card */}
      {loadingConfig ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : !config ? (
        <div className="rounded-lg border border-dashed border-muted p-8 text-center">
          <ScrollText className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">No contract terms configured</p>
          <p className="text-xs text-muted-foreground mt-1">Run the Program Setup wizard to configure contract terms</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/program-setup'}>
            Open Program Setup
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {FIELD_GROUPS.map(group => (
            <div key={group.label} className="rounded-lg border bg-card overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/30 border-b">
                <h3 className="text-sm font-semibold">{group.label}</h3>
              </div>
              <div className="divide-y">
                {group.fields.map(field => (
                  <div key={field.key} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">{field.label}</span>
                    <span className="text-sm font-medium">{field.format((config as any)[field.key], config)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {config.notes && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground">{config.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Document Links */}
      <div className="rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Document Register
          </h3>
        </div>

        {loadingDocs ? (
          <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>
        ) : docs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No documents registered yet</p>
            <p className="text-xs mt-1">Add contract documents, SOW, annexures, and amendments</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Phase</th>
                <th className="text-left p-3 font-medium">Version</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Link</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => (
                <tr key={d.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="p-3 font-medium">{d.name}</td>
                  <td className="p-3 text-muted-foreground">{d.doc_type}</td>
                  <td className="p-3 text-muted-foreground">{d.phase || '—'}</td>
                  <td className="p-3 text-muted-foreground">{d.version || '—'}</td>
                  <td className="p-3">
                    <Badge className={`text-xs ${DOC_STATUS_COLORS[d.status]}`}>{d.status}</Badge>
                  </td>
                  <td className="p-3">
                    {d.url ? (
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline text-xs">
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
