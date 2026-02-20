/**
 * Credit Purchase Routes
 * Routes that require auth but have their own full-page layout (no AppShell).
 * Uses bare <ProtectedRoute> + manual providers.
 */

import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { PresenceProvider } from '@/contexts/PresenceContext';
import { PurchaseCreditsPage } from '@/components/credits/PurchaseCreditsPage';
import { UsageDashboard } from '@/components/credits/UsageDashboard';
import { AutoRechargeSettings } from '@/components/credits/AutoRechargeSettings';

function CreditsPage({ component: Component }: { component: React.ComponentType }) {
    return (
        <ProtectedRoute>
            <ProjectProvider>
                <PresenceProvider>
                    <Component />
                </PresenceProvider>
            </ProjectProvider>
        </ProtectedRoute>
    );
}

export function CreditsRoutes() {
    return (
        <>
            {/* Canonical routes */}
            <Route path="/purchase-credits" element={<CreditsPage component={PurchaseCreditsPage} />} />
            <Route path="/usage-dashboard" element={<CreditsPage component={UsageDashboard} />} />
            <Route path="/auto-recharge" element={<CreditsPage component={AutoRechargeSettings} />} />
            {/* Aliases used by CreditBalanceWidget and notificationService */}
            <Route path="/credits/purchase" element={<CreditsPage component={PurchaseCreditsPage} />} />
            <Route path="/credits/usage" element={<CreditsPage component={UsageDashboard} />} />
            <Route path="/credits/auto-recharge" element={<CreditsPage component={AutoRechargeSettings} />} />
        </>
    );
}
