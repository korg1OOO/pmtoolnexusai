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

export function CreditsRoutes() {
    return (
        <>
            <Route path="/purchase-credits" element={
                <ProtectedRoute>
                    <ProjectProvider>
                        <PresenceProvider>
                            <PurchaseCreditsPage />
                        </PresenceProvider>
                    </ProjectProvider>
                </ProtectedRoute>
            } />
            <Route path="/usage-dashboard" element={
                <ProtectedRoute>
                    <ProjectProvider>
                        <PresenceProvider>
                            <UsageDashboard />
                        </PresenceProvider>
                    </ProjectProvider>
                </ProtectedRoute>
            } />
            <Route path="/auto-recharge" element={
                <ProtectedRoute>
                    <ProjectProvider>
                        <PresenceProvider>
                            <AutoRechargeSettings />
                        </PresenceProvider>
                    </ProjectProvider>
                </ProtectedRoute>
            } />
        </>
    );
}
