/**
 * Admin Panel Routes
 * All routes nested under /admin.
 * The parent route uses <ProtectedRoute> (AdminPanel has its own auth/role checks internally).
 */

import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { DatabaseMigrationPanel } from '@/components/admin/DatabaseMigrationPanel';
import { AIProviderAdminPage } from '@/components/admin/AIProviderAdminPage';
import { TicketDetail } from '@/components/admin/pages/TicketDetail';
import AIAgentDetailPage from '@/components/admin/ai-agents/AIAgentDetailPage';
import { EmailTemplateEditor } from '@/components/admin/pages/EmailTemplateEditor';
import { EmailCampaignBuilder } from '@/components/admin/pages/EmailCampaignBuilder';
import { EmailCampaignDetail } from '@/components/admin/pages/EmailCampaignDetail';
import MLDashboard from '@/components/ml/MLDashboard';
import {
    MLModelsPage,
    MLAlertsPage,
    MLPredictionsPage,
    MLRetrainingPage,
    MLAccuracyPage,
    MLTrainingDataPage,
} from '@/components/ml/MLPages';
import { MLAnalyticsPage } from '@/components/ml/pages/MLAnalyticsPage';
import {
    AdminDashboard,
    AdminUsers,
    AdminProUsers,
    AdminHealthCheck,
    AdminAIUsage,
    AdminAICredits,
    AdminContentManagement,
    AdminBlogPostEditor,
    AdminLicenseKeys,
    AdminSecurityAudit,
    AdminBilling,
    AdminDiscountCodes,
    AdminManagement,
    AdminRequests,
    AdminAnalytics,
    AdminMarketing,
    AdminEmailAutomation,
    AdminAffiliates,
    AdminBackups,
    AdminOrganizations,
    AdminSecurity,
    AdminAPIKeys,
    AdminAuditLogs,
    AdminSubscriptionsPage,
    AdminPlansPage,
    EmailTemplateManager,
    IMAPConfigurationManager,
    NotificationAnalyticsDashboard,
    AdminAIAgents,
} from '@/components/admin/pages';

export function AdminRoutes() {
    return (
        <Route path="/admin" element={
            <ProtectedRoute>
                <AdminPanel />
            </ProtectedRoute>
        }>
            <Route index element={<AdminDashboard />} />
            <Route path="health" element={<AdminHealthCheck />} />
            <Route path="ai-usage" element={<AdminAIUsage />} />
            <Route path="ai-credits" element={<AdminAICredits />} />
            <Route path="ai-agents" element={<AdminAIAgents />} />
            <Route path="ai-agents/:agentType" element={<AIAgentDetailPage />} />
            <Route path="ai-providers" element={<AIProviderAdminPage />} />
            <Route path="ml" element={<MLDashboard />} />
            <Route path="ml/models" element={<MLModelsPage />} />
            <Route path="ml/alerts" element={<MLAlertsPage />} />
            <Route path="ml/predictions" element={<MLPredictionsPage />} />
            <Route path="ml/retraining" element={<MLRetrainingPage />} />
            <Route path="ml/accuracy" element={<MLAccuracyPage />} />
            <Route path="ml/training-data" element={<MLTrainingDataPage />} />
            <Route path="ml/analytics" element={<MLAnalyticsPage />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="pro-users" element={<AdminProUsers />} />
            <Route path="content" element={<AdminContentManagement />} />
            <Route path="blog/new" element={<AdminBlogPostEditor />} />
            <Route path="blog/:id/edit" element={<AdminBlogPostEditor />} />
            <Route path="licenses" element={<AdminLicenseKeys />} />
            <Route path="security" element={<AdminSecurityAudit />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="plans" element={<AdminPlansPage />} />
            <Route path="discounts" element={<AdminDiscountCodes />} />
            <Route path="management" element={<AdminManagement />} />
            <Route path="migration" element={<DatabaseMigrationPanel />} />
            <Route path="requests" element={<AdminRequests />} />
            <Route path="tickets/:id" element={<TicketDetail />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="marketing" element={<AdminMarketing />} />
            <Route path="email" element={<AdminEmailAutomation />} />
            <Route path="email/templates/new" element={<EmailTemplateEditor />} />
            <Route path="email/templates/:id" element={<EmailTemplateEditor />} />
            <Route path="email/campaigns/new" element={<EmailCampaignBuilder />} />
            <Route path="email/campaigns/:id" element={<EmailCampaignDetail />} />
            <Route path="email-templates" element={<EmailTemplateManager />} />
            <Route path="imap-config" element={<IMAPConfigurationManager />} />
            <Route path="notification-analytics" element={<NotificationAnalyticsDashboard />} />
            <Route path="affiliates" element={<AdminAffiliates />} />
            <Route path="backups" element={<AdminBackups />} />
            <Route path="organizations" element={<AdminOrganizations />} />
            <Route path="api-keys" element={<AdminAPIKeys />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="security-settings" element={<AdminSecurity />} />
        </Route>
    );
}
