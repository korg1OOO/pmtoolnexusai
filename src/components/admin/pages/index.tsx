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
export const AdminContentManagement = () => <PlaceholderPage title="Content Management" />;
export const AdminSecurityAudit = () => <PlaceholderPage title="Security & Audit" />;
export const AdminBilling = () => <PlaceholderPage title="Billing" />;
export { AdminManagement } from './AdminManagement';
export const AdminRequests = () => <PlaceholderPage title="Requests & Issues" />;
export { AdminAnalytics } from './AdminAnalytics';
export const AdminMarketing = () => <PlaceholderPage title="Marketing" />;
export const AdminEmailAutomation = () => <PlaceholderPage title="Email Automation" />;
export { AdminReferrals } from './AdminReferrals';
export const AdminAffiliates = () => <PlaceholderPage title="Affiliates" />;
export const AdminBackups = () => <PlaceholderPage title="Database Backups" />;
