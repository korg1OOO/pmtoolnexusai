/**
 * Credit Purchase Routes
 * Routes that require auth but have their own full-page layout (no AppShell).
 * Uses bare <ProtectedRoute> + manual providers.
 * AI Credits require Pro+ subscription tier.
 */

import { Route } from 'react-router-dom';
import { ProtectedProjectRoute } from '@/components/routing';
import { RequireTier } from '@/components/subscription/RequireTier';
import { PurchaseCreditsPage } from '@/components/credits/PurchaseCreditsPage';
import { UsageDashboard } from '@/components/credits/UsageDashboard';
import { AutoRechargeSettings } from '@/components/credits/AutoRechargeSettings';

export function CreditsRoutes() {
    return (
        <>
            {/* Canonical routes — Pro+ tier required */}
            <Route path="/purchase-credits" element={<ProtectedProjectRoute><RequireTier minTier="pro"><PurchaseCreditsPage /></RequireTier></ProtectedProjectRoute>} />
            <Route path="/usage-dashboard" element={<ProtectedProjectRoute><RequireTier minTier="pro"><UsageDashboard /></RequireTier></ProtectedProjectRoute>} />
            <Route path="/auto-recharge" element={<ProtectedProjectRoute><RequireTier minTier="pro"><AutoRechargeSettings /></RequireTier></ProtectedProjectRoute>} />
            {/* Aliases used by CreditBalanceWidget and notificationService */}
            <Route path="/credits/purchase" element={<ProtectedProjectRoute><RequireTier minTier="pro"><PurchaseCreditsPage /></RequireTier></ProtectedProjectRoute>} />
            <Route path="/credits/usage" element={<ProtectedProjectRoute><RequireTier minTier="pro"><UsageDashboard /></RequireTier></ProtectedProjectRoute>} />
            <Route path="/credits/auto-recharge" element={<ProtectedProjectRoute><RequireTier minTier="pro"><AutoRechargeSettings /></RequireTier></ProtectedProjectRoute>} />
        </>
    );
}
