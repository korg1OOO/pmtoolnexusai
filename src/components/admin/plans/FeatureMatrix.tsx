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
            { key: 'tube_map', name: 'Tube Map', category: 'CORE', min_plan_tier: 'free' },
            { key: 'process_mapper', name: 'Process Workbench', category: 'CORE', min_plan_tier: 'free' },
            { key: 'process_flows', name: 'Process Flows', category: 'CORE', min_plan_tier: 'free' },
            { key: 'impact_analysis', name: 'Impact Analysis', category: 'CORE', min_plan_tier: 'free' },
            { key: 'presentations', name: 'Presentations', category: 'CORE', min_plan_tier: 'starter' }, // Assuming 'starter' is > free
            { key: 'route_planner', name: 'Route Planner', category: 'ADVANCED', min_plan_tier: 'starter' },
            { key: 'design_studio', name: 'Design Studio', category: 'ADVANCED', min_plan_tier: 'pro' },
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
                            <TableHead className="text-center w-[150px]">Min Plan (DB)</TableHead>
                            <TableHead className="text-center w-[100px]">Enabled</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {FEATURE_CATEGORIES.map(category => {
                            const categoryFeatures = sortedFeatures.filter(f => f.category === category);
                            if (categoryFeatures.length === 0) return null;

                            return (
                                <>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableCell colSpan={plans.length + 3} className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-2">
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
                                                    // If min plan index is -1 (not found), default to disabled? or show error
                                                    // If current plan index >= feature min index, it's included.
                                                    const included = featureMinIndex !== -1 && pIndex >= featureMinIndex;

                                                    return (
                                                        <TableCell key={p.tier} className="text-center">
                                                            {feature.is_enabled ? (
                                                                included ?
                                                                    <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> :
                                                                    <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                                                            ) : (
                                                                <span className="text-muted-foreground/20">-</span>
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                                <TableCell>
                                                    <Select
                                                        value={feature.min_plan_tier}
                                                        onValueChange={(val) => handleMinPlanChange(feature.key, val)}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {plans.map(p => (
                                                                <SelectItem key={p.tier} value={p.tier}>
                                                                    {p.tier}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {feature.is_enabled ?
                                                        <span
                                                            className="text-xs text-green-600 cursor-pointer hover:underline"
                                                            onClick={() => handleToggleEnabled(feature.key, true)}
                                                        >
                                                            Active
                                                        </span> :
                                                        <span
                                                            className="text-xs text-muted-foreground cursor-pointer hover:underline italic"
                                                            onClick={() => handleToggleEnabled(feature.key, false)}
                                                        >
                                                            not seeded
                                                        </span>
                                                    }
                                                    {/* Using text for now as switch in table sometimes tricky with row clicks */}
                                                    <Switch
                                                        checked={feature.is_enabled}
                                                        onCheckedChange={() => handleToggleEnabled(feature.key, feature.is_enabled)}
                                                        className="ml-2 scale-75"
                                                    />
                                                </TableCell>
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
