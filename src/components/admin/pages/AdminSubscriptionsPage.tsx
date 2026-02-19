/**
 * Admin Subscriptions Page
 * Full subscription management: table, inline plan override, feature flags, plan config editor, pricing cache control.
 */

import React, { useState, useMemo } from 'react';
import {
    Search, RefreshCw, ExternalLink, Ban, CreditCard, DollarSign,
    TrendingDown, Users, Loader2, ChevronLeft, ChevronRight,
    Settings2, Zap, Edit2, Check, X, AlertTriangle, Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    useAdminSubscriptions,
    useSubscriptionRevenueSummary,
    useOverrideSubscriptionPlan,
    useAdminCancelSubscription,
    useApplyCreditAdjustment,
    useToggleFeatureFlag,
    useSubscriptionFeatureFlags,
    useRefreshPricingCache,
    type AdminSubscription,
    type SubTier,
    type SubStatus,
} from '@/hooks/useAdminSubscriptions';
import { usePlanConfigs, useUpdatePlanConfig, type Tier, type PlanConfig } from '@/hooks/usePlanConfigs';
import { RefundDialog } from '@/components/admin/billing/RefundDialog';

// ─── Status Badge ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    trialing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    trial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    past_due: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    canceled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    paused: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const TIER_STYLES: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    pro: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    business: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    agency: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const TIERS: SubTier[] = ['free', 'pro', 'business', 'agency'];
const STATUSES: SubStatus[] = ['active', 'trialing', 'past_due', 'canceled', 'paused'];
const PAGE_SIZE = 25;

// ─── Revenue Summary Cards ───────────────────────────────────────────────────

function RevenueSummaryCards() {
    const { data, isLoading } = useSubscriptionRevenueSummary();

    const cards = [
        {
            label: 'MRR',
            value: isLoading ? '—' : `$${(data?.mrr ?? 0).toLocaleString()}`,
            sub: `ARR $${(data ? data.arr : 0).toLocaleString()}`,
            icon: DollarSign,
            trend: null,
        },
        {
            label: 'Active Subscribers',
            value: isLoading ? '—' : (data?.activeCount ?? 0).toString(),
            sub: `${data?.trialCount ?? 0} in trial`,
            icon: Users,
            trend: null,
        },
        {
            label: 'Churn Rate (30d)',
            value: isLoading ? '—' : `${(data?.churnRate ?? 0).toFixed(1)}%`,
            sub: `${data?.churnedCount ?? 0} churned`,
            icon: TrendingDown,
            trend: 'down',
        },
        {
            label: 'Trials',
            value: isLoading ? '—' : (data?.trialCount ?? 0).toString(),
            sub: 'Converting soon',
            icon: Activity,
            trend: 'up',
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(c => (
                <Card key={c.label}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">{c.label}</span>
                            <c.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold">{c.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// ─── Inline Editable Cell ───────────────────────────────────────────────────

function InlineTierSelect({ sub, configs }: { sub: AdminSubscription; configs: PlanConfig[] }) {
    const override = useOverrideSubscriptionPlan();
    const [editing, setEditing] = useState(false);
    const [selected, setSelected] = useState<SubTier>(sub.tier);

    const handleSave = () => {
        const cfg = configs.find(c => c.tier === selected);
        const mrr = cfg?.price_monthly ?? 0;
        override.mutate({ id: sub.id, tier: selected, mrr });
        setEditing(false);
    };

    if (!editing) {
        return (
            <div className="flex items-center gap-1.5">
                <Badge className={TIER_STYLES[sub.tier]}>{sub.tier}</Badge>
                <button
                    onClick={() => setEditing(true)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Override plan"
                >
                    <Edit2 className="h-3 w-3" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <Select value={selected} onValueChange={(v) => setSelected(v as SubTier)}>
                <SelectTrigger className="h-7 text-xs w-28">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {TIERS.map(t => (
                        <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <button onClick={handleSave} disabled={override.isPending} title="Save plan override" className="text-green-600 hover:text-green-700">
                {override.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>
            <button onClick={() => setEditing(false)} title="Cancel edit" className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

// ─── Cancel Confirm Dialog ───────────────────────────────────────────────────

function CancelDialog({ sub, open, onClose }: { sub: AdminSubscription; open: boolean; onClose: () => void }) {
    const cancel = useAdminCancelSubscription();
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cancel Subscription</DialogTitle>
                    <DialogDescription>
                        This will immediately cancel <strong>{sub.email}</strong>'s subscription and set their MRR to $0. This cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Abort</Button>
                    <Button
                        variant="destructive"
                        disabled={cancel.isPending}
                        onClick={() => cancel.mutate(sub.id, { onSuccess: onClose })}
                    >
                        {cancel.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Confirm Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Subscriptions Table ─────────────────────────────────────────────────────

function SubscriptionsTable({ configs }: { configs: PlanConfig[] }) {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<SubStatus | 'all'>('all');
    const [tier, setTier] = useState<SubTier | 'all'>('all');
    const [page, setPage] = useState(0);
    const [cancelSub, setCancelSub] = useState<AdminSubscription | null>(null);
    const [refundSub, setRefundSub] = useState<AdminSubscription | null>(null);

    const { data, isLoading, refetch } = useAdminSubscriptions({ search, status, tier, page, pageSize: PAGE_SIZE });
    const rows = data?.rows ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const handleSearch = (v: string) => { setSearch(v); setPage(0); };

    const stripeCustomerUrl = (id: string | null) =>
        id ? `https://dashboard.stripe.com/customers/${id}` : null;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by email or name…"
                        className="pl-9"
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                    />
                </div>

                <Select value={status} onValueChange={v => { setStatus(v as any); setPage(0); }}>
                    <SelectTrigger className="w-36">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                </Select>

                <Select value={tier} onValueChange={v => { setTier(v as any); setPage(0); }}>
                    <SelectTrigger className="w-32">
                        <SelectValue placeholder="Tier" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All tiers</SelectItem>
                        {TIERS.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                    </SelectContent>
                </Select>

                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>

                <span className="ml-auto text-sm text-muted-foreground">
                    {total} subscription{total !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Table */}
            <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/40">
                            <th className="text-left px-4 py-3 font-medium">Workspace / Email</th>
                            <th className="text-left px-4 py-3 font-medium">Plan</th>
                            <th className="text-left px-4 py-3 font-medium">Status</th>
                            <th className="text-left px-4 py-3 font-medium">Cycle</th>
                            <th className="text-right px-4 py-3 font-medium">MRR</th>
                            <th className="text-left px-4 py-3 font-medium">Renewal</th>
                            <th className="text-left px-4 py-3 font-medium">Trial End</th>
                            <th className="text-left px-4 py-3 font-medium">Stripe IDs</th>
                            <th className="text-left px-4 py-3 font-medium">Created</th>
                            <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={10} className="text-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin inline-block text-muted-foreground" />
                            </td></tr>
                        ) : rows.length === 0 ? (
                            <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">No subscriptions found</td></tr>
                        ) : rows.map(sub => (
                            <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                {/* Workspace / Email */}
                                <td className="px-4 py-3">
                                    <div className="font-medium truncate max-w-[180px]">{sub.workspace_name ?? sub.full_name ?? '—'}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-[180px]">{sub.email}</div>
                                </td>

                                {/* Inline Tier Override */}
                                <td className="px-4 py-3">
                                    <InlineTierSelect sub={sub} configs={configs} />
                                </td>

                                {/* Status */}
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1">
                                        <Badge className={`${STATUS_STYLES[sub.status]} text-xs py-0`}>
                                            {sub.status.replace('_', ' ')}
                                        </Badge>
                                        {sub.cancelled_at && (
                                            <span className="text-xs text-red-500 flex items-center gap-0.5">
                                                <Ban className="h-3 w-3" />
                                                {new Date(sub.cancelled_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </td>

                                {/* Billing Cycle */}
                                <td className="px-4 py-3 capitalize text-muted-foreground">{sub.billing_cycle ?? '—'}</td>

                                {/* MRR */}
                                <td className="px-4 py-3 text-right font-mono font-semibold">
                                    ${(sub.mrr ?? 0).toLocaleString()}
                                </td>

                                {/* Renewal */}
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                    {sub.renewal_date ? new Date(sub.renewal_date).toLocaleDateString() : '—'}
                                </td>

                                {/* Trial End */}
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                    {sub.trial_ends_at ? (
                                        <span className={new Date(sub.trial_ends_at) < new Date() ? 'text-red-500' : ''}>
                                            {new Date(sub.trial_ends_at).toLocaleDateString()}
                                        </span>
                                    ) : '—'}
                                </td>

                                {/* Stripe IDs */}
                                <td className="px-4 py-3">
                                    <div className="space-y-1">
                                        {sub.stripe_customer_id ? (
                                            <a
                                                href={stripeCustomerUrl(sub.stripe_customer_id)!}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                            >
                                                <span className="truncate max-w-[100px]">{sub.stripe_customer_id}</span>
                                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                            </a>
                                        ) : <span className="text-xs text-muted-foreground">No Stripe customer</span>}
                                        {sub.stripe_subscription_id && (
                                            <div className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                                                {sub.stripe_subscription_id}
                                            </div>
                                        )}
                                    </div>
                                </td>

                                {/* Created */}
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                    {new Date(sub.created_at).toLocaleDateString()}
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1 justify-end">
                                        {sub.stripe_customer_id && (
                                            <Button variant="ghost" size="icon" className="h-7 w-7"
                                                title="Open Stripe portal"
                                                onClick={() => window.open(`https://dashboard.stripe.com/customers/${sub.stripe_customer_id}`, '_blank')}>
                                                <ExternalLink className="h-3 w-3" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600"
                                            title="Refund / credit adjustment"
                                            onClick={() => setRefundSub(sub)}>
                                            <CreditCard className="h-3 w-3" />
                                        </Button>
                                        {sub.status !== 'canceled' && sub.status !== 'cancelled' && (
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                                                title="Cancel subscription"
                                                onClick={() => setCancelSub(sub)}>
                                                <Ban className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Page {page + 1} of {totalPages} ({total} total)</span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Dialogs */}
            {cancelSub && (
                <CancelDialog sub={cancelSub} open={!!cancelSub} onClose={() => setCancelSub(null)} />
            )}
            {refundSub && (
                <RefundDialog open={!!refundSub} onOpenChange={() => setRefundSub(null)} />
            )}
        </div>
    );
}

// ─── Plan Config Editor ──────────────────────────────────────────────────────

function PlanConfigEditor() {
    const { data: configs = [], isLoading } = usePlanConfigs();
    const updateConfig = useUpdatePlanConfig();
    const refreshCache = useRefreshPricingCache();

    // Local edits buffer per tier
    const [edits, setEdits] = useState<Record<string, Partial<PlanConfig>>>({});

    const setField = (tier: string, field: keyof PlanConfig, value: any) => {
        setEdits(prev => ({
            ...prev,
            [tier]: { ...prev[tier], [field]: value === '' ? null : value },
        }));
    };

    const save = (tier: Tier) => {
        const patch = edits[tier] ?? {};
        if (Object.keys(patch).length === 0) return;
        updateConfig.mutate({ tier, ...patch });
        setEdits(prev => { const n = { ...prev }; delete n[tier]; return n; });
    };


    if (isLoading) return (
        <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold">Plan Configuration</h3>
                    <p className="text-sm text-muted-foreground">Edit pricing and limits inline. Changes don't affect the public pricing page until you click Refresh Pricing Cache.</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={refreshCache.isPending}
                    onClick={() => refreshCache.mutate()}
                >
                    {refreshCache.isPending
                        ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        : <RefreshCw className="h-4 w-4 mr-2" />}
                    Refresh Pricing Cache
                </Button>
            </div>

            <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/40">
                            <th className="text-left px-4 py-3 font-medium w-24">Tier</th>
                            <th className="text-left px-4 py-3 font-medium">Display Name</th>
                            <th className="text-right px-4 py-3 font-medium">$/mo</th>
                            <th className="text-right px-4 py-3 font-medium">$/yr</th>
                            <th className="text-right px-4 py-3 font-medium">Projects</th>
                            <th className="text-right px-4 py-3 font-medium">Members</th>
                            <th className="text-right px-4 py-3 font-medium">Storage (MB)</th>
                            <th className="text-right px-4 py-3 font-medium">AI Credits</th>
                            <th className="text-center px-4 py-3 font-medium">Popular</th>
                            <th className="px-4 py-3 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {configs.map(cfg => {
                            const e = edits[cfg.tier] ?? {};
                            const isDirty = Object.keys(e).length > 0;

                            return (
                                <tr key={cfg.tier} className={`border-b last:border-0 ${isDirty ? 'bg-amber-50 dark:bg-amber-900/10' : 'hover:bg-muted/20'}`}>
                                    <td className="px-4 py-2">
                                        <Badge className={TIER_STYLES[cfg.tier]}>{cfg.tier}</Badge>
                                    </td>
                                    <td className="px-4 py-2">
                                        <Input
                                            className="h-8 text-sm"
                                            defaultValue={cfg.display_name}
                                            onChange={e => setField(cfg.tier, 'display_name', e.target.value)}
                                        />
                                    </td>
                                    {(['price_monthly', 'price_annual'] as const).map(f => (
                                        <td key={f} className="px-4 py-2">
                                            <Input
                                                type="number"
                                                className="h-8 text-sm text-right w-24 ml-auto"
                                                defaultValue={cfg[f]}
                                                onChange={ev => setField(cfg.tier, f, parseFloat(ev.target.value))}
                                            />
                                        </td>
                                    ))}
                                    {(['max_projects', 'max_members', 'max_storage_mb', 'max_ai_credits'] as const).map(f => (
                                        <td key={f} className="px-4 py-2">
                                            <div className="flex justify-end items-center gap-1">
                                                <Input
                                                    type="number"
                                                    className="h-8 text-sm text-right w-24"
                                                    defaultValue={cfg[f]}
                                                    title="-1 = unlimited"
                                                    onChange={ev => setField(cfg.tier, f, parseInt(ev.target.value))}
                                                />
                                            </div>
                                        </td>
                                    ))}
                                    <td className="px-4 py-2 text-center">
                                        <Switch
                                            checked={e.is_popular !== undefined ? !!e.is_popular : cfg.is_popular}
                                            onCheckedChange={v => setField(cfg.tier, 'is_popular', v)}
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <Button
                                            size="sm"
                                            variant={isDirty ? 'default' : 'ghost'}
                                            disabled={!isDirty || updateConfig.isPending}
                                            onClick={() => save(cfg.tier as Tier)}
                                        >
                                            {updateConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Set any limit to <strong>-1</strong> for unlimited. Changes to pricing are saved to DB but require "Refresh Pricing Cache" to appear on the public pricing page.
            </p>
        </div>
    );
}

// ─── Feature Flag Panel ──────────────────────────────────────────────────────

function FeatureFlagPanel() {
    const { data: flags = [], isLoading } = useSubscriptionFeatureFlags();
    const toggle = useToggleFeatureFlag();

    // Group by tier
    const byTier = useMemo(() => {
        const map: Record<string, typeof flags> = {};
        (flags as any[]).forEach(f => {
            if (!map[f.tier]) map[f.tier] = [];
            map[f.tier].push(f);
        });
        return map;
    }, [flags]);

    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

    if (Object.keys(byTier).length === 0) return (
        <div className="text-center py-12 text-muted-foreground">
            No feature flags found. Run the subscription_features migration to populate.
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold">Feature Flag Toggles</h3>
                <p className="text-sm text-muted-foreground">Changes take immediate effect — users will see the updated access on their next request.</p>
            </div>
            {TIERS.filter(t => byTier[t]?.length).map(tier => (
                <Card key={tier}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Badge className={TIER_STYLES[tier]}>{tier}</Badge>
                            <span className="text-muted-foreground font-normal text-sm">({byTier[tier]?.length ?? 0} features)</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {(byTier[tier] as any[]).map(f => (
                                <div key={f.feature_key} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium truncate">{f.feature_name}</div>
                                        {f.description && (
                                            <div className="text-xs text-muted-foreground truncate">{f.description}</div>
                                        )}
                                    </div>
                                    <Switch
                                        checked={f.is_enabled}
                                        disabled={toggle.isPending}
                                        onCheckedChange={enabled => toggle.mutate({ tier, featureKey: f.feature_key, enabled })}
                                        className="ml-3 flex-shrink-0"
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function AdminSubscriptionsPage() {
    const { data: configs = [] } = usePlanConfigs();
    const refreshCache = useRefreshPricingCache();

    return (
        <div className="p-6 space-y-6 max-w-[1600px]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Subscriptions</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage workspaces, plans, limits, and feature access
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={refreshCache.isPending}
                    onClick={() => refreshCache.mutate()}
                >
                    {refreshCache.isPending
                        ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        : <RefreshCw className="h-4 w-4 mr-2" />}
                    Refresh Pricing Cache
                </Button>
            </div>

            {/* Revenue summary */}
            <RevenueSummaryCards />

            {/* Tabs */}
            <Tabs defaultValue="subscriptions">
                <TabsList>
                    <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Subscriptions
                    </TabsTrigger>
                    <TabsTrigger value="plans" className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        Plan Config
                    </TabsTrigger>
                    <TabsTrigger value="features" className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Feature Flags
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="subscriptions" className="mt-4">
                    <Card>
                        <CardContent className="p-4">
                            <SubscriptionsTable configs={configs} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="plans" className="mt-4">
                    <Card>
                        <CardContent className="p-6">
                            <PlanConfigEditor />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="features" className="mt-4">
                    <FeatureFlagPanel />
                </TabsContent>
            </Tabs>
        </div>
    );
}
