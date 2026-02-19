import { usePlanConfigs } from '@/hooks/usePlanConfigs';
import { usePricingCache } from '@/hooks/usePricingCache'; // To refresh
import { PlanCard } from '../plans/PlanCard';
import { FeatureMatrix } from '../plans/FeatureMatrix';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function AdminPlansPage() {
    const { data: plans, isLoading: plansLoading } = usePlanConfigs();
    const { refetch: refreshCache, isRefetching: isRefreshing } = usePricingCache({ enabled: false });

    const handleRefreshCache = async () => {
        try {
            // Call Edge Function to refresh cache
            await supabase.functions.invoke('get-pricing-cache', { body: { refresh: true } });
            await refreshCache();
            toast.success('Public Pricing Cache Refreshed!');
        } catch (e) {
            toast.error('Failed to refresh pricing cache');
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
                else window.location.reload();
            }}>
                Create First Plan
            </Button>
        </div>
    );

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Plans & Packages</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Click any value to edit inline. Changes save to DB instantly.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="default" onClick={async () => {
                        const tierName = prompt('Enter plan tier ID (e.g. enterprise):');
                        if (!tierName) return;
                        const { error } = await supabase.from('subscription_plans').insert({
                            tier: tierName.toLowerCase(),
                            name: tierName.charAt(0).toUpperCase() + tierName.slice(1),
                            price_monthly: 0,
                            active: false
                        });
                        if (error) toast.error('Failed: ' + error.message);
                        else {
                            toast.success('Plan created');
                            window.location.reload();
                        }
                    }}>
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
    );
}
