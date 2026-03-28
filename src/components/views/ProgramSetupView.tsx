import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  ScrollText, Users, Palette, GraduationCap, Bot,
  ChevronRight, ChevronLeft, Check, Plus, Trash2,
  Sparkles, Building2, AlertCircle, FileText, Upload,
  Loader2, ChevronDown, ChevronUp, ShieldCheck,
} from 'lucide-react';
import { useProgramSetup } from '@/hooks/useProgramSetup';
import { useContractExtractor, type ExtractedContractData } from '@/hooks/useContractExtractor';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 0, label: 'Import Contract', icon: FileText, description: 'AI-parse a contract document to auto-populate all fields' },
  { id: 1, label: 'Contract Terms', icon: ScrollText, description: 'Financial, penalty and governance parameters' },
  { id: 2, label: 'Key Personnel', icon: Users, description: 'Register contractual key personnel obligations' },
  { id: 3, label: 'Training', icon: GraduationCap, description: 'Training targets and stream configuration' },
  { id: 4, label: 'Branding', icon: Palette, description: 'Customise colours and logo for white-labelling' },
  { id: 5, label: 'AI Advisor', icon: Bot, description: 'Select your preferred AI provider and model' },
];

// ─── Preset brand palettes ─────────────────────────────────────────────────────
const PALETTES = [
  { label: 'Electric Blue (default)', primary: '217 91% 60%', accent: '280 87% 65%', sidebar: '222 47% 5%' },
  { label: 'Emerald', primary: '151 55% 42%', accent: '38 92% 50%', sidebar: '160 30% 8%' },
  { label: 'Violet', primary: '262 83% 65%', accent: '322 80% 60%', sidebar: '262 30% 7%' },
  { label: 'Slate', primary: '210 40% 55%', accent: '199 89% 48%', sidebar: '215 28% 6%' },
  { label: 'Rose', primary: '355 80% 60%', accent: '38 92% 50%', sidebar: '355 20% 6%' },
  { label: 'Amber', primary: '38 92% 52%', accent: '25 95% 53%', sidebar: '38 20% 6%' },
];

const AI_PROVIDERS = [
  {
    id: 'lovable', label: 'Lovable AI (Gemini)', models: [
      { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    ]
  },
  {
    id: 'anthropic', label: 'Anthropic Claude', models: [
      { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (recommended)' },
      { id: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet' },
      { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    ]
  },
  {
    id: 'openai', label: 'OpenAI GPT', models: [
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    ]
  },
];

// ─── Default form state ────────────────────────────────────────────────────────
const CONTRACT_DEFAULTS = {
  contract_value: 0,
  currency: 'USD',
  payment_terms_days: 30,
  penalty_rate_pct: 0.5,
  penalty_cap_pct: 10,
  acceptance_period_days: 30,
  key_personnel_review_days: 30,
  subcontractor_review_days: 30,
  training_sessions_target: 0,
  training_hours_target: 0,
  training_max_per_session: 20,
  hypercare_weeks: 4,
  governing_reference: '',
  notes: '',
};

const BRAND_DEFAULTS = {
  primaryColor: '217 91% 60%',
  accentColor: '280 87% 65%',
  sidebarColor: '222 47% 5%',
  appName: 'Kiroxys',
  logoUrl: '',
  borderRadius: '0.5rem',
};

const AI_DEFAULTS = {
  provider: 'lovable',
  model: 'google/gemini-2.5-pro',
};

export default function ProgramSetupView() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [contractForm, setContractForm] = useState(CONTRACT_DEFAULTS);
  const [brandForm, setBrandForm] = useState(BRAND_DEFAULTS);
  const [aiConfig, setAiConfig] = useState(AI_DEFAULTS);
  const [newPerson, setNewPerson] = useState({ name: '', role: '', organisation: 'client', contract_start_date: '' });

  // ── Contract Import state ──────────────────────────────────────────────────
  const [contractText, setContractText] = useState('');
  const [importResult, setImportResult] = useState<ExtractedContractData | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { extract, isExtracting, error: extractError } = useContractExtractor();

  const {
    contractConfig, keyPersonnel, loadingContract, loadingKP,
    upsertContractConfig, addKeyPerson, removeKeyPerson, applyBranding, loadSavedBranding,
    bulkImportFromContract,
  } = useProgramSetup();

  // Pre-fill from DB / localStorage on mount
  useEffect(() => {
    if (contractConfig) {
      setContractForm({ ...CONTRACT_DEFAULTS, ...contractConfig });
    }
    const brand = loadSavedBranding();
    if (brand) setBrandForm(brand);
    const savedAI = localStorage.getItem('ai_provider_config');
    if (savedAI) setAiConfig(JSON.parse(savedAI));
  }, [contractConfig]);

  const markComplete = (s: number) => setCompleted(prev => new Set([...prev, s]));

  const handleSaveContract = async () => {
    try {
      await upsertContractConfig.mutateAsync(contractForm);
      toast.success('Contract terms saved');
      markComplete(1);
      setStep(2);
    } catch {
      toast.error('Failed to save contract terms');
    }
  };

  const handleSaveTraining = async () => {
    try {
      await upsertContractConfig.mutateAsync({
        training_sessions_target: contractForm.training_sessions_target,
        training_hours_target: contractForm.training_hours_target,
        training_max_per_session: contractForm.training_max_per_session,
        hypercare_weeks: contractForm.hypercare_weeks,
      });
      toast.success('Training targets saved');
      markComplete(3);
      setStep(4);
    } catch {
      toast.error('Failed to save training targets');
    }
  };

  const handleAddPerson = async () => {
    if (!newPerson.name.trim() || !newPerson.role.trim()) {
      toast.error('Name and role are required');
      return;
    }
    try {
      await addKeyPerson.mutateAsync(newPerson);
      setNewPerson({ name: '', role: '', organisation: 'client', contract_start_date: '' });
      toast.success('Key person added');
    } catch {
      toast.error('Failed to add key person');
    }
  };

  const handleApplyBranding = () => {
    applyBranding(brandForm);
    toast.success('Branding applied');
    markComplete(4);
    setStep(5);
  };

  const handleSaveAI = () => {
    localStorage.setItem('ai_provider_config', JSON.stringify(aiConfig));
    toast.success(`AI provider set to ${aiConfig.provider}`);
    markComplete(5);
  };

  const selectedProvider = AI_PROVIDERS.find(p => p.id === aiConfig.provider);
  const contractValue = Number(contractForm.contract_value) || 0;

  const stepVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* ── Step Sidebar ─────────────────────────────────────────────── */}
      <div className="w-64 shrink-0 border-r bg-muted/20 p-6 flex flex-col gap-1">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold">Program Setup</div>
            <div className="text-xs text-muted-foreground">PMCC Configuration</div>
          </div>
        </div>

        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isDone = completed.has(s.id);
          const isActive = step === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
                isActive ? 'bg-primary/15 text-primary font-semibold' :
                isDone ? 'text-green-500 hover:bg-muted/50' :
                'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <div className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                isDone ? 'bg-green-500/20' :
                isActive ? 'bg-primary/20' :
                'bg-muted'
              }`}>
                {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <div>
                <div>{s.label}</div>
                {isActive && <div className="text-xs font-normal opacity-70">{s.description}</div>}
              </div>
            </button>
          );
        })}

        <div className="mt-auto pt-4 border-t">
          <div className="text-xs text-muted-foreground text-center">
            {completed.size}/{STEPS.length} steps complete
          </div>
          <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(completed.size / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Step Content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="max-w-2xl space-y-6"
          >
            {/* ── STEP 0: Import Contract ───────────────────────────── */}
            {step === 0 && (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Import Contract</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Paste your contract text and let AI extract all project data automatically.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs gap-1.5 shrink-0">
                    <Sparkles className="h-3 w-3" />
                    AI-Powered
                  </Badge>
                </div>

                {/* Input area */}
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contract Text</Label>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <Upload className="h-3 w-3" /> Upload .txt file
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.text"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => setContractText((ev.target?.result as string) || '');
                        reader.readAsText(file);
                      }}
                    />
                  </div>
                  <Textarea
                    value={contractText}
                    onChange={e => setContractText(e.target.value)}
                    rows={10}
                    placeholder="Paste your contract, Statement of Work, or ordering document here...

The AI will extract:
  • Contract terms (payment, penalties, hypercare)
  • Key personnel (SI + client teams)
  • Milestones & critical dates
  • Assumptions, dependencies & risks"
                    className="font-mono text-xs resize-none"
                  />
                  {extractError && (
                    <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {extractError}
                    </div>
                  )}
                  <Button
                    className="w-full"
                    disabled={isExtracting || !contractText.trim()}
                    onClick={async () => {
                      const result = await extract(contractText);
                      if (result) {
                        setImportResult(result);
                        setReviewOpen(true);
                        toast.success('Contract extracted! Review the data below before loading.');
                      }
                    }}
                  >
                    {isExtracting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Extracting with AI...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" />Extract with AI</>
                    )}
                  </Button>
                </div>

                {/* Review panel */}
                {importResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-primary/30 bg-primary/5 overflow-hidden"
                  >
                    {/* Header */}
                    <button
                      onClick={() => setReviewOpen(r => !r)}
                      className="w-full flex items-center justify-between p-4 hover:bg-primary/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">Review Extracted Data</span>
                        <Badge className="text-xs" variant="secondary">
                          {importResult.si_name} → {importResult.client_name}
                        </Badge>
                      </div>
                      {reviewOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {reviewOpen && (
                      <div className="px-4 pb-4 space-y-4">
                        {/* Summary */}
                        <p className="text-xs text-muted-foreground italic">{importResult.summary}</p>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {[
                            { label: 'Personnel', value: importResult.key_personnel.length },
                            { label: 'Milestones', value: importResult.milestones.length },
                            { label: 'Assumptions', value: importResult.assumptions.length },
                            { label: 'Dependencies', value: importResult.dependencies.length },
                            { label: 'Risks', value: importResult.risks.length },
                            { label: 'Critical', value: importResult.milestones.filter(m => m.is_critical).length },
                          ].map(s => (
                            <div key={s.label} className="rounded-lg bg-background border p-2">
                              <div className="text-lg font-bold text-primary">{s.value}</div>
                              <div className="text-xs text-muted-foreground">{s.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Contract Terms preview */}
                        <div className="rounded-lg bg-background border p-3 space-y-1.5">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Contract Terms</div>
                          {[
                            { label: 'Governing Ref', value: importResult.contract_terms.governing_reference || '—' },
                            { label: 'Currency', value: importResult.contract_terms.currency },
                            { label: 'Payment Terms', value: `${importResult.contract_terms.payment_terms_days} days` },
                            { label: 'Penalty Rate', value: `${importResult.contract_terms.penalty_rate_pct}% / week` },
                            { label: 'Penalty Cap', value: `${importResult.contract_terms.penalty_cap_pct}% of milestone` },
                            { label: 'Hypercare', value: `${importResult.contract_terms.hypercare_weeks} weeks` },
                            { label: 'Training Sessions', value: `${importResult.contract_terms.training_sessions_target}` },
                          ].map(t => (
                            <div key={t.label} className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{t.label}</span>
                              <span className="font-medium">{t.value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Personnel preview */}
                        {importResult.key_personnel.length > 0 && (
                          <div className="rounded-lg bg-background border overflow-hidden">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide p-3 pb-2">Key Personnel</div>
                            <table className="w-full text-xs">
                              <tbody>
                                {importResult.key_personnel.slice(0, 6).map((p, i) => (
                                  <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                    <td className="px-3 py-1.5 font-medium">{p.name}</td>
                                    <td className="px-3 py-1.5 text-muted-foreground">{p.role}</td>
                                    <td className="px-3 py-1.5">
                                      <Badge variant="outline" className="text-xs capitalize">{p.organisation}</Badge>
                                    </td>
                                  </tr>
                                ))}
                                {importResult.key_personnel.length > 6 && (
                                  <tr><td colSpan={3} className="px-3 py-1.5 text-muted-foreground text-center">+ {importResult.key_personnel.length - 6} more</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Milestones preview */}
                        {importResult.milestones.length > 0 && (
                          <div className="rounded-lg bg-background border p-3 space-y-1">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Milestones</div>
                            {importResult.milestones.slice(0, 5).map((m, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                {m.is_critical
                                  ? <span className="text-amber-500 font-bold">⭐</span>
                                  : <span className="text-muted-foreground">·</span>
                                }
                                <span className="flex-1 truncate">{m.name}</span>
                                {m.due_date && <span className="text-muted-foreground shrink-0">{m.due_date}</span>}
                              </div>
                            ))}
                            {importResult.milestones.length > 5 && (
                              <div className="text-xs text-muted-foreground">+ {importResult.milestones.length - 5} more milestones</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Load button */}
                    <div className="border-t px-4 py-3 flex items-center justify-between bg-background">
                      <p className="text-xs text-muted-foreground">Ready to load {[
                        importResult.key_personnel.length && `${importResult.key_personnel.length} personnel`,
                        importResult.milestones.length && `${importResult.milestones.length} milestones`,
                        importResult.risks.length && `${importResult.risks.length} risks`,
                      ].filter(Boolean).join(', ')} into this project.</p>
                      <Button
                        size="sm"
                        disabled={bulkImportFromContract.isPending}
                        onClick={async () => {
                          const result = await bulkImportFromContract.mutateAsync(importResult);
                          const errCount = result.errors.filter(Boolean).length;
                          if (errCount === 0) {
                            toast.success('All contract data loaded successfully!');
                            // Pre-fill contract form from extracted terms
                            setContractForm(f => ({ ...f, ...importResult.contract_terms }));
                            markComplete(0);
                            setStep(1);
                          } else {
                            toast.warning(`Loaded with ${errCount} partial error(s). Some data may not have saved.`);
                            setContractForm(f => ({ ...f, ...importResult.contract_terms }));
                            markComplete(0);
                            setStep(1);
                          }
                        }}
                      >
                        {bulkImportFromContract.isPending ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Loading...</>
                        ) : (
                          <><Check className="h-3.5 w-3.5 mr-1.5" />Load into Project</>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-between">
                  <div />
                  <Button variant="ghost" onClick={() => { markComplete(0); setStep(1); }}>
                    Skip — enter manually <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </>
            )}

            {/* ── STEP 1: Contract Terms ─────────────────────────────── */}
            {step === 1 && (
              <>
                <div>
                  <h2 className="text-xl font-bold">Contract Terms</h2>
                  <p className="text-sm text-muted-foreground mt-1">Set the financial and governance parameters for this program.</p>
                </div>

                <div className="rounded-lg border p-4 space-y-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Financial</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5 col-span-2">
                      <Label>Contract Value</Label>
                      <Input type="number" value={contractForm.contract_value} onChange={e => setContractForm(f => ({ ...f, contract_value: parseFloat(e.target.value) || 0 }))} />
                      {contractValue > 0 && <div className="text-xs text-muted-foreground">{formatCurrency(contractValue)}</div>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Currency</Label>
                      <Select value={contractForm.currency} onValueChange={v => setContractForm(f => ({ ...f, currency: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['USD','EUR','GBP','AED','SAR','INR','SGD','AUD'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Payment Terms</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[contractForm.payment_terms_days]}
                        onValueChange={([v]) => setContractForm(f => ({ ...f, payment_terms_days: v }))}
                        min={7} max={90} step={1}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-16 text-right">{contractForm.payment_terms_days} days</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Penalty Clauses</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Penalty Rate (% per week of delay)</Label>
                      <div className="flex items-center gap-3">
                        <Slider value={[contractForm.penalty_rate_pct]} onValueChange={([v]) => setContractForm(f => ({ ...f, penalty_rate_pct: v }))} min={0} max={5} step={0.1} className="flex-1" />
                        <span className="text-sm font-medium w-12 text-right">{contractForm.penalty_rate_pct}%</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Penalty Cap (% of milestone value)</Label>
                      <div className="flex items-center gap-3">
                        <Slider value={[contractForm.penalty_cap_pct]} onValueChange={([v]) => setContractForm(f => ({ ...f, penalty_cap_pct: v }))} min={0} max={50} step={1} className="flex-1" />
                        <span className="text-sm font-medium w-12 text-right">{contractForm.penalty_cap_pct}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    Penalty exposure = delay weeks × penalty rate × milestone value, capped at {contractForm.penalty_cap_pct}% of milestone value.
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Governance</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Acceptance Period</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" value={contractForm.acceptance_period_days} onChange={e => setContractForm(f => ({ ...f, acceptance_period_days: parseInt(e.target.value) || 0 }))} className="w-20" />
                        <span className="text-sm text-muted-foreground">days</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Key Personnel Review</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" value={contractForm.key_personnel_review_days} onChange={e => setContractForm(f => ({ ...f, key_personnel_review_days: parseInt(e.target.value) || 0 }))} className="w-20" />
                        <span className="text-sm text-muted-foreground">days</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Hypercare Period</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" value={contractForm.hypercare_weeks} onChange={e => setContractForm(f => ({ ...f, hypercare_weeks: parseInt(e.target.value) || 0 }))} className="w-20" />
                        <span className="text-sm text-muted-foreground">weeks</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Governing Reference</Label>
                      <Input value={contractForm.governing_reference} onChange={e => setContractForm(f => ({ ...f, governing_reference: e.target.value }))} placeholder="e.g. Contract v3.2 §12.1" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Notes</Label>
                    <Textarea value={contractForm.notes} onChange={e => setContractForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Additional contract notes..." />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button onClick={handleSaveContract} disabled={upsertContractConfig.isPending}>
                    {upsertContractConfig.isPending ? 'Saving...' : 'Save & Continue'}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </>
            )}

            {/* ── STEP 2: Key Personnel ──────────────────────────────── */}
            {step === 2 && (
              <>
                <div>
                  <h2 className="text-xl font-bold">Key Personnel</h2>
                  <p className="text-sm text-muted-foreground mt-1">Register individuals whose replacement requires contractual review.</p>
                </div>

                {/* Add person form */}
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add Key Person</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Name *</Label>
                      <Input value={newPerson.name} onChange={e => setNewPerson(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Role *</Label>
                      <Input value={newPerson.role} onChange={e => setNewPerson(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Program Manager" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Organisation</Label>
                      <Select value={newPerson.organisation} onValueChange={v => setNewPerson(f => ({ ...f, organisation: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="si">System Integrator</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Contract Start Date</Label>
                      <Input type="date" value={newPerson.contract_start_date} onChange={e => setNewPerson(f => ({ ...f, contract_start_date: e.target.value }))} />
                    </div>
                  </div>
                  <Button size="sm" onClick={handleAddPerson} disabled={addKeyPerson.isPending}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Person
                  </Button>
                </div>

                {/* Current list */}
                {loadingKP ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
                ) : keyPersonnel.length > 0 ? (
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="text-left p-3 font-medium">Name</th>
                          <th className="text-left p-3 font-medium">Role</th>
                          <th className="text-left p-3 font-medium">Org</th>
                          <th className="w-10 p-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {keyPersonnel.map((p, i) => (
                          <tr key={p.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                            <td className="p-3 font-medium">{p.name}</td>
                            <td className="p-3 text-muted-foreground">{p.role}</td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-xs capitalize">{p.organisation}</Badge>
                            </td>
                            <td className="p-3">
                              <Button variant="ghost" size="iconSm" className="text-destructive hover:text-destructive" onClick={() => removeKeyPerson.mutate(p.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
                  <Button onClick={() => { markComplete(2); setStep(3); }}>
                    Continue <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </>
            )}

            {/* ── STEP 3: Training Targets ───────────────────────────── */}
            {step === 3 && (
              <>
                <div>
                  <h2 className="text-xl font-bold">Training Targets</h2>
                  <p className="text-sm text-muted-foreground mt-1">Set contractual training obligations for the Training Tracker.</p>
                </div>

                <div className="rounded-lg border p-4 space-y-5">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Sessions Target</Label>
                      <Input type="number" value={contractForm.training_sessions_target} onChange={e => setContractForm(f => ({ ...f, training_sessions_target: parseInt(e.target.value) || 0 }))} placeholder="0" />
                      <div className="text-xs text-muted-foreground">Total sessions to deliver</div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Hours Target</Label>
                      <Input type="number" value={contractForm.training_hours_target} onChange={e => setContractForm(f => ({ ...f, training_hours_target: parseInt(e.target.value) || 0 }))} placeholder="0" />
                      <div className="text-xs text-muted-foreground">Total training hours</div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Max per Session</Label>
                      <Input type="number" value={contractForm.training_max_per_session} onChange={e => setContractForm(f => ({ ...f, training_max_per_session: parseInt(e.target.value) || 0 }))} placeholder="20" />
                      <div className="text-xs text-muted-foreground">Max attendees per session</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Hypercare Period: <span className="font-bold">{contractForm.hypercare_weeks} weeks</span></Label>
                    <Slider
                      value={[contractForm.hypercare_weeks]}
                      onValueChange={([v]) => setContractForm(f => ({ ...f, hypercare_weeks: v }))}
                      min={0} max={26} step={1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0 weeks</span>
                      <span>26 weeks (6 months)</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
                  <Button onClick={handleSaveTraining} disabled={upsertContractConfig.isPending}>
                    {upsertContractConfig.isPending ? 'Saving...' : 'Save & Continue'}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </>
            )}

            {/* ── STEP 4: Branding ──────────────────────────────────── */}
            {step === 4 && (
              <>
                <div>
                  <h2 className="text-xl font-bold">Branding</h2>
                  <p className="text-sm text-muted-foreground mt-1">Customise the application palette for your organisation. Changes apply instantly.</p>
                </div>

                {/* Palette presets */}
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preset Palettes</div>
                  <div className="grid grid-cols-3 gap-2">
                    {PALETTES.map(p => (
                      <button
                        key={p.label}
                        onClick={() => {
                          const next = { ...brandForm, primaryColor: p.primary, accentColor: p.accent, sidebarColor: p.sidebar };
                          setBrandForm(next);
                          applyBranding(next);
                        }}
                        className="flex items-center gap-2 rounded-lg border p-2.5 text-left hover:border-primary transition-all"
                      >
                        <div className="flex gap-1">
                          <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: `hsl(${p.primary})` }} />
                          <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: `hsl(${p.accent})` }} />
                          <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: `hsl(${p.sidebar})` }} />
                        </div>
                        <span className="text-xs font-medium truncate">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom fields */}
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Custom Values (HSL format)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Primary Colour</Label>
                      <div className="flex items-center gap-2">
                        <Input value={brandForm.primaryColor} onChange={e => setBrandForm(f => ({ ...f, primaryColor: e.target.value }))} placeholder="217 91% 60%" />
                        <div className="h-8 w-8 rounded shrink-0 border" style={{ backgroundColor: `hsl(${brandForm.primaryColor})` }} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Accent Colour</Label>
                      <div className="flex items-center gap-2">
                        <Input value={brandForm.accentColor} onChange={e => setBrandForm(f => ({ ...f, accentColor: e.target.value }))} placeholder="280 87% 65%" />
                        <div className="h-8 w-8 rounded shrink-0 border" style={{ backgroundColor: `hsl(${brandForm.accentColor})` }} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Application Name</Label>
                      <Input value={brandForm.appName} onChange={e => setBrandForm(f => ({ ...f, appName: e.target.value }))} placeholder="Kiroxys" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Border Radius</Label>
                      <Select value={brandForm.borderRadius} onValueChange={v => setBrandForm(f => ({ ...f, borderRadius: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0rem">Sharp (0rem)</SelectItem>
                          <SelectItem value="0.25rem">Subtle (0.25rem)</SelectItem>
                          <SelectItem value="0.5rem">Default (0.5rem)</SelectItem>
                          <SelectItem value="0.75rem">Rounded (0.75rem)</SelectItem>
                          <SelectItem value="1rem">Very Rounded (1rem)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Logo URL</Label>
                    <Input value={brandForm.logoUrl} onChange={e => setBrandForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://..." />
                    <div className="text-xs text-muted-foreground">URL to your logo image (PNG/SVG). Displayed in the sidebar header.</div>
                  </div>
                </div>

                {/* Live preview */}
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Live Preview</div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `hsl(${brandForm.primaryColor})` }}>
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold" style={{ color: `hsl(${brandForm.primaryColor})` }}>{brandForm.appName || 'Kiroxys'}</div>
                      <div className="text-xs text-muted-foreground">Program Management Command Centre</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 rounded text-xs font-medium text-white" style={{ backgroundColor: `hsl(${brandForm.primaryColor})` }}>Primary Action</span>
                    <span className="px-3 py-1 rounded text-xs font-medium text-white" style={{ backgroundColor: `hsl(${brandForm.accentColor})` }}>Accent</span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(3)}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
                  <Button onClick={handleApplyBranding}>
                    Apply Branding <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </>
            )}

            {/* ── STEP 5: AI Provider ────────────────────────────────── */}
            {step === 5 && (
              <>
                <div>
                  <h2 className="text-xl font-bold">AI Advisor Configuration</h2>
                  <p className="text-sm text-muted-foreground mt-1">Choose the AI provider and model for this program workspace.</p>
                </div>

                <div className="space-y-3">
                  {AI_PROVIDERS.map(provider => (
                    <button
                      key={provider.id}
                      onClick={() => setAiConfig(f => ({ ...f, provider: provider.id, model: provider.models[0].id }))}
                      className={`w-full text-left rounded-lg border p-4 transition-all ${
                        aiConfig.provider === provider.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Bot className={`h-5 w-5 ${aiConfig.provider === provider.id ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className="font-medium">{provider.label}</span>
                        </div>
                        {aiConfig.provider === provider.id && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      {aiConfig.provider === provider.id && (
                        <div className="mt-3 pl-8">
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Model</Label>
                          <Select value={aiConfig.model} onValueChange={v => setAiConfig(f => ({ ...f, model: v }))}>
                            <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {provider.models.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          {(provider.id === 'anthropic' || provider.id === 'openai') && (
                            <div className="mt-2 text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                              <AlertCircle className="h-3.5 w-3.5" />
                              API key required — configure in Platform Admin → AI Settings
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(4)}><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
                  <Button onClick={handleSaveAI}>
                    <Check className="h-4 w-4 mr-1.5" />
                    Complete Setup
                  </Button>
                </div>

                {completed.size === STEPS.length && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-center"
                  >
                    <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="font-semibold text-green-600 dark:text-green-400">Setup Complete!</div>
                    <div className="text-sm text-muted-foreground mt-1">Your PMCC is fully configured. All modules are ready to use.</div>
                    <Button className="mt-3" size="sm" onClick={() => window.location.href = '/dashboard'}>
                      Go to Dashboard →
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
