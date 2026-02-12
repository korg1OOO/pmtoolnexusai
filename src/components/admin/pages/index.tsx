// Admin page exports
export { AdminDashboard } from './AdminDashboard';
export { AdminUsers } from './AdminUsers';
export { AdminProUsers } from './AdminProUsers';
export { AdminDiscountCodes } from './AdminDiscountCodes';
export { AdminLicenseKeys } from './AdminLicenseKeys';

// Placeholder components for remaining pages
import React from 'react';
import { Construction } from 'lucide-react';

const PlaceholderPage = ({ title }: { title: string }) => {
    return (
        <div className="p-6 flex flex-col items-center justify-center h-full text-center">
            <Construction className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">This page is under construction</p>
        </div>
    );
};

export { AdminHealthCheck } from './AdminHealthCheck';
export { AdminAIUsage } from './AdminAIUsage';
export { AdminFAQs } from './AdminFAQs';
export { AdminBlog } from './AdminBlog';
export { AdminDocs } from './AdminDocs';
export { AdminMedia } from './AdminMedia';
export { AdminBlogPostEditor } from './AdminBlogPostEditor';
export { AdminContentManagement } from './AdminContentManagement';
export const AdminSecurityAudit = () => <PlaceholderPage title="Security & Audit" />;
export const AdminBilling = () => <PlaceholderPage title="Billing" />;
export { AdminManagement } from './AdminManagement';
export { AdminRequests } from './AdminRequests';
export { AdminAnalytics } from './AdminAnalytics';
export { AdminMarketing } from './AdminMarketing';
export { AdminEmailAutomation } from './AdminEmailAutomation';
export { AdminReferrals } from './AdminReferrals';
export { AdminAffiliates } from './AdminAffiliates';
export { AdminBackups } from './AdminBackups';
export { AdminOrganizations } from './AdminOrganizations';
export { AdminSecurity } from './AdminSecurity';
export { AdminAPIKeys } from './AdminAPIKeys';
export { AdminAuditLogs } from './AdminAuditLogs';
export { TicketDetail } from './TicketDetail';
export { EmailTemplateEditor } from './EmailTemplateEditor';
export { EmailCampaignBuilder } from './EmailCampaignBuilder';
export { EmailCampaignDetail } from './EmailCampaignDetail';

// Email Template Management System
export { EmailTemplateManager } from '../settings/EmailTemplateManager';
export { IMAPConfigurationManager } from '../settings/IMAPConfigurationManager';
export { NotificationAnalyticsDashboard } from '../analytics/NotificationAnalyticsDashboard';

