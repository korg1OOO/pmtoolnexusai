import { useState } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { PlanConfig } from '@/hooks/usePlanConfigs';
import { useAdminFeatures, useUpdateFeature, useSeedFeatures, type FeatureFlag, FEATURE_CATEGORIES } from '@/hooks/useAdminFeatures';
import { toast } from 'sonner';

interface FeatureMatrixProps {
    plans: PlanConfig[];
}

export function FeatureMatrix({ plans }: FeatureMatrixProps) {
    const { data: features, isLoading } = useAdminFeatures();
    const updateFeature = useUpdateFeature();
    const seedFeatures = useSeedFeatures();

    const sortedFeatures = [...(features || [])].sort((a, b) => {
        // Sort by category first
        const catOrder = { CORE: 0, ADVANCED: 1, EXPERIMENTAL: 2 };
        if (catOrder[a.category] !== catOrder[b.category]) {
            return catOrder[a.category] - catOrder[b.category];
        }
        return a.sort_order - b.sort_order;
    });

    const isInternalPlan = (tier: string) => ['free', 'starter', 'pro', 'enterprise'].includes(tier.toLowerCase()) || true;
    // We assume tiers are ordered by value: free < starter < pro < enterprise (agency)
    // A simplified check: index in plans array
    const getPlanIndex = (tier: string) => plans.findIndex(p => p.tier === tier);

    const handleMinPlanChange = (featureKey: string, tier: string) => {
        updateFeature.mutate({ key: featureKey, min_plan_tier: tier });
    };

    const handleToggleEnabled = (featureKey: string, current: boolean) => {
        updateFeature.mutate({ key: featureKey, is_enabled: !current });
    };

    const handleSeed = () => {
        seedFeatures.mutate([
            // CORE
            { key: 'dashboard', name: 'Dashboard', category: 'CORE', min_plan_tier: 'free' },
            { key: 'projects', name: 'Projects & Tasks', category: 'CORE', min_plan_tier: 'free' },
            { key: 'documents', name: 'Document Center', category: 'CORE', min_plan_tier: 'free' },
            { key: 'notes', name: 'Notes & Wiki', category: 'CORE', min_plan_tier: 'free' },
            { key: 'team_chat', name: 'Team Chat', category: 'CORE', min_plan_tier: 'pro' },
            { key: 'calendar', name: 'Calendar', category: 'CORE', min_plan_tier: 'free' },

            // ADVANCED
            { key: 'gantt', name: 'Gantt Charts', category: 'ADVANCED', min_plan_tier: 'pro' },
            { key: 'portfolio', name: 'Portfolio Management', category: 'ADVANCED', min_plan_tier: 'business' },
            { key: 'financials', name: 'Budget & EVM', category: 'ADVANCED', min_plan_tier: 'business' },
            { key: 'risks', name: 'Risk Management', category: 'ADVANCED', min_plan_tier: 'pro' },
            { key: 'reporting', name: 'Advanced Reporting', category: 'ADVANCED', min_plan_tier: 'business' },
            { key: 'stakeholders', name: 'Stakeholder Register', category: 'ADVANCED', min_plan_tier: 'pro' },

            // EXPERIMENTAL
            { key: 'ai_meetings', name: 'AI Meeting Assistant', category: 'EXPERIMENTAL', min_plan_tier: 'business' },
            { key: 'scenarios', name: 'Scenario Planning', category: 'EXPERIMENTAL', min_plan_tier: 'agency' },
            { key: 'morning_briefing', name: 'Morning Briefing', category: 'EXPERIMENTAL', min_plan_tier: 'pro' },
            { key: 'communication_intelligence', name: 'Comm. Intelligence', category: 'EXPERIMENTAL', min_plan_tier: 'agency' },
            { key: 'ai_credits', name: 'AI Credits System', category: 'EXPERIMENTAL', min_plan_tier: 'free' }
        ]);
    };

    if (isLoading) return <div>Loading features...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg">
                <div>
                    <h3 className="text-lg font-semibold">Feature Availability Matrix</h3>
                    <p className="text-sm text-muted-foreground">Min Plan and Enabled toggle write directly to DB.</p>
                </div>
                <Button size="sm" variant="outline" onClick={handleSeed} disabled={seedFeatures.isPending}>
                    {seedFeatures.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Seed Missing Flags
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Feature</TableHead>
                            {plans.map(p => (
                                <TableHead key={p.tier} className="text-center capitalize flex-1">
                                    <Badge variant="outline">{p.display_name}</Badge>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {FEATURE_CATEGORIES.map(category => {
                            const categoryFeatures = sortedFeatures.filter(f => f.category === category);
                            if (categoryFeatures.length === 0) return null;

                            return (
                                <>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableCell colSpan={plans.length + 1} className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-2">
                                            {category}
                                        </TableCell>
                                    </TableRow>
                                    {categoryFeatures.map(feature => {
                                        const featureMinIndex = getPlanIndex(feature.min_plan_tier);

                                        return (
                                            <TableRow key={feature.key}>
                                                <TableCell className="font-medium">
                                                    <div>{feature.name}</div>
                                                    <div className="text-xs text-muted-foreground font-mono">{feature.key}</div>
                                                </TableCell>
                                                {plans.map((p, pIndex) => {
                                                    // Determine if checked based on min plan
                                                    // Hierarchical: included if current plan index >= feature min index
                                                    const included = featureMinIndex !== -1 && pIndex >= featureMinIndex;
                                                    const isChecked = feature.is_enabled && included;

                                                    const handleToggle = (checked: boolean) => {
                                                        if (checked) {
                                                            // Case 1: Enabling a plan (was unchecked)
                                                            // This plan becomes the new minimum. All higher plans also get enabled implicitly.
                                                            updateFeature.mutate({
                                                                key: feature.key,
                                                                min_plan_tier: p.tier,
                                                                is_enabled: true
                                                            });
                                                        } else {
                                                            // Case 2: Disabling a plan (was checked)
                                                            // Since it's hierarchical, disabling Plan X means the feature is no longer available on X.
                                                            // The new minimum must be the plan ABOVE X.
                                                            // If X was the highest plan, the feature is disabled entirely.

                                                            const nextPlan = plans[pIndex + 1];
                                                            if (nextPlan) {
                                                                // Move minimum to next plan
                                                                updateFeature.mutate({
                                                                    key: feature.key,
                                                                    min_plan_tier: nextPlan.tier,
                                                                    is_enabled: true
                                                                });
                                                            } else {
                                                                // No higher plan, disable feature globally
                                                                updateFeature.mutate({
                                                                    key: feature.key,
                                                                    is_enabled: false
                                                                });
                                                            }
                                                        }
                                                    };

                                                    return (
                                                        <TableCell key={p.tier} className="text-center p-2">
                                                            <div className="flex justify-center">
                                                                <Switch
                                                                    checked={isChecked}
                                                                    onCheckedChange={handleToggle}
                                                                    className="data-[state=checked]:bg-primary"
                                                                />
                                                            </div>
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        );
                                    })}
                                </>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
