import { useState } from 'react';
import { usePlanConfigs } from '@/hooks/usePlanConfigs';
import { usePricingCache } from '@/hooks/usePricingCache';
import { PlanCard } from '../plans/PlanCard';
import { FeatureMatrix } from '../plans/FeatureMatrix';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminPlansPage() {
    const { data: plans, isLoading: plansLoading } = usePlanConfigs();
    const { refetch: refreshCache, isRefetching: isRefreshing } = usePricingCache({ enabled: false });
    const queryClient = useQueryClient();

    const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
    const [newTierName, setNewTierName] = useState('');
    const [isCreatingPlan, setIsCreatingPlan] = useState(false);

    const handleRefreshCache = async () => {
        try {
            await supabase.functions.invoke('get-pricing-cache', { body: { refresh: true } });
            await refreshCache();
            toast.success('Public Pricing Cache Refreshed!');
        } catch (e) {
            toast.error('Failed to refresh pricing cache');
        }
    };

    const handleCreatePlan = async () => {
        if (!newTierName.trim()) return;
        setIsCreatingPlan(true);
        try {
            const { error } = await supabase.from('subscription_plans').insert({
                tier: newTierName.toLowerCase().trim(),
                name: newTierName.trim().charAt(0).toUpperCase() + newTierName.trim().slice(1),
                price_monthly: 0,
                active: false
            });
            if (error) throw error;
            toast.success('Plan created');
            queryClient.invalidateQueries({ queryKey: ['plan-configs'] });
            setNewTierName('');
            setIsCreatePlanOpen(false);
        } catch (err: any) {
            toast.error('Failed: ' + err.message);
        } finally {
            setIsCreatingPlan(false);
        }
    };

    if (plansLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!plans || plans.length === 0) return (
        <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No Plans Found</h2>
            <p className="text-muted-foreground mb-4">Seeding default plans is recommended.</p>
            <Button onClick={async () => {
                const { error } = await supabase.from('subscription_plans').insert({
                    tier: 'free', name: 'Free', price_monthly: 0, active: true
                });
                if (error) toast.error(error.message);
                else {
                    toast.success('Plan created');
                    queryClient.invalidateQueries({ queryKey: ['plan-configs'] });
                }
            }}>
                Create First Plan
            </Button>
        </div>
    );

    return (
        <>
            <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Plans &amp; Packages</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Click any value to edit inline. Changes save to DB instantly.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="default" onClick={() => setIsCreatePlanOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Plan
                        </Button>
                        <Button variant="outline" onClick={handleRefreshCache} disabled={isRefreshing}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh Pricing Cache
                        </Button>
                    </div>
                </div>

                {/* Plans Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map(plan => (
                        <PlanCard key={plan.tier} plan={plan} />
                    ))}
                </div>

                {/* Feature Matrix */}
                <FeatureMatrix plans={plans} />
            </div>

            {/* Create Plan Dialog */}
            <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Plan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <Label htmlFor="plan-tier">Plan Tier ID</Label>
                        <Input
                            id="plan-tier"
                            placeholder="e.g. enterprise"
                            value={newTierName}
                            onChange={(e) => setNewTierName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCreatePlan(); }}
                        />
                        <p className="text-xs text-muted-foreground">Lowercase ID used internally (e.g. &quot;enterprise&quot; → display name &quot;Enterprise&quot;)</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreatePlanOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreatePlan} disabled={isCreatingPlan || !newTierName.trim()}>
                            {isCreatingPlan ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Create Plan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
