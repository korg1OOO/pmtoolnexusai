/**
 * Credit Purchase Routes
 * Routes that require auth but have their own full-page layout (no AppShell).
 * Uses bare <ProtectedRoute> + manual providers.
 */

import { Route } from 'react-router-dom';
import { ProtectedProjectRoute } from '@/components/routing';
import { PurchaseCreditsPage } from '@/components/credits/PurchaseCreditsPage';
import { UsageDashboard } from '@/components/credits/UsageDashboard';
import { AutoRechargeSettings } from '@/components/credits/AutoRechargeSettings';

export function CreditsRoutes() {
    return (
        <>
            {/* Canonical routes */}
            <Route path="/purchase-credits" element={<ProtectedProjectRoute><PurchaseCreditsPage /></ProtectedProjectRoute>} />
            <Route path="/usage-dashboard" element={<ProtectedProjectRoute><UsageDashboard /></ProtectedProjectRoute>} />
            <Route path="/auto-recharge" element={<ProtectedProjectRoute><AutoRechargeSettings /></ProtectedProjectRoute>} />
            {/* Aliases used by CreditBalanceWidget and notificationService */}
            <Route path="/credits/purchase" element={<ProtectedProjectRoute><PurchaseCreditsPage /></ProtectedProjectRoute>} />
            <Route path="/credits/usage" element={<ProtectedProjectRoute><UsageDashboard /></ProtectedProjectRoute>} />
            <Route path="/credits/auto-recharge" element={<ProtectedProjectRoute><AutoRechargeSettings /></ProtectedProjectRoute>} />
        </>
    );
}
