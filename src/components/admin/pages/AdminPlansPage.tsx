import { usePlanConfigs } from '@/hooks/usePlanConfigs';
import { usePricingCache } from '@/hooks/usePricingCache'; // To refresh
import { PlanCard } from '../plans/PlanCard';
import { FeatureMatrix } from '../plans/FeatureMatrix';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function AdminPlansPage() {
    const { data: plans, isLoading: plansLoading } = usePlanConfigs();
    const { refetch: refreshCache, isRefetching: isRefreshing } = usePricingCache();

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

    if (!plans) return <div>No plans found.</div>;

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Plans & Packages</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Click any value to edit inline. Changes save to DB instantly.
                    </p>
                </div>
                <Button variant="outline" onClick={handleRefreshCache} disabled={isRefreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh Pricing Cache
                </Button>
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
