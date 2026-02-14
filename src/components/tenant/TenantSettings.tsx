import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTenantSettings, updateTenantSettings } from '@/services/tenantService';
import { toast } from 'sonner';
import { Building, Palette, Settings as SettingsIcon, Mail, Bell } from 'lucide-react';

export function TenantSettings() {
    const [tenantId] = useState('default-tenant-id'); // TODO: Get from auth context
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ['tenant-settings', tenantId],
        queryFn: () => getTenantSettings(tenantId)
    });

    const updateMutation = useMutation({
        mutationFn: (newSettings: any) => updateTenantSettings(tenantId, newSettings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
            toast.success('Settings updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update settings');
        }
    });

    if (isLoading) {
        return <div className="p-6 text-center">Loading settings...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Company Settings</h1>
                <p className="text-muted-foreground">Manage your organization configuration</p>
            </div>

            <Tabs defaultValue="company" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="company">
                        <Building className="w-4 h-4 mr-2" />
                        Company Info
                    </TabsTrigger>
                    <TabsTrigger value="branding">
                        <Palette className="w-4 h-4 mr-2" />
                        Branding
                    </TabsTrigger>
                    <TabsTrigger value="defaults">
                        <SettingsIcon className="w-4 h-4 mr-2" />
                        Defaults
                    </TabsTrigger>
                    <TabsTrigger value="email">
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                        <Bell className="w-4 h-4 mr-2" />
                        Notifications
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="company">
                    <CompanyInfoSettings
                        settings={settings}
                        onSave={(data) => updateMutation.mutate({ ...settings, company: data })}
                        isLoading={updateMutation.isPending}
                    />
                </TabsContent>

                <TabsContent value="branding">
                    <BrandingSettings
                        settings={settings}
                        onSave={(data) => updateMutation.mutate({ ...settings, branding: data })}
                        isLoading={updateMutation.isPending}
                    />
                </TabsContent>

                <TabsContent value="defaults">
                    <DefaultsSettings
                        settings={settings}
                        onSave={(data) => updateMutation.mutate({ ...settings, defaults: data })}
                        isLoading={updateMutation.isPending}
                    />
                </TabsContent>

                <TabsContent value="email">
                    <EmailSettings
                        settings={settings}
                        onSave={(data) => updateMutation.mutate({ ...settings, email: data })}
                        isLoading={updateMutation.isPending}
                    />
                </TabsContent>

                <TabsContent value="notifications">
                    <NotificationSettings
                        settings={settings}
                        onSave={(data) => updateMutation.mutate({ ...settings, notifications: data })}
                        isLoading={updateMutation.isPending}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function CompanyInfoSettings({ settings, onSave, isLoading }: any) {
    const [companyName, setCompanyName] = useState(settings?.company?.name || '');
    const [website, setWebsite] = useState(settings?.company?.website || '');
    const [industry, setIndustry] = useState(settings?.company?.industry || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name: companyName, website, industry });
    };

    return (
        <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Company Name</label>
                    <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Acme Corporation"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Website</label>
                    <Input
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://acme.com"
                        type="url"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Industry</label>
                    <Input
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="Technology"
                    />
                </div>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
            </form>
        </Card>
    );
}

function BrandingSettings({ settings, onSave, isLoading }: any) {
    const [primaryColor, setPrimaryColor] = useState(settings?.branding?.primaryColor || '#3b82f6');
    const [logoUrl, setLogoUrl] = useState(settings?.branding?.logoUrl || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ primaryColor, logoUrl });
    };

    return (
        <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Primary Color</label>
                    <div className="flex gap-2">
                        <Input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-20"
                        />
                        <Input
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            placeholder="#3b82f6"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium">Logo URL</label>
                    <Input
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        type="url"
                    />
                </div>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
            </form>
        </Card>
    );
}

function DefaultsSettings({ settings, onSave, isLoading }: any) {
    const [defaultWorkspace, setDefaultWorkspace] = useState(settings?.defaults?.workspace || '');
    const [defaultRole, setDefaultRole] = useState(settings?.defaults?.role || 'member');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ workspace: defaultWorkspace, role: defaultRole });
    };

    return (
        <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Default Workspace</label>
                    <Input
                        value={defaultWorkspace}
                        onChange={(e) => setDefaultWorkspace(e.target.value)}
                        placeholder="main"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        New users will be added to this workspace by default
                    </p>
                </div>
                <div>
                    <label className="text-sm font-medium">Default Role</label>
                    <select
                        value={defaultRole}
                        onChange={(e) => setDefaultRole(e.target.value)}
                        className="w-full border rounded-md p-2"
                    >
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
            </form>
        </Card>
    );
}

function EmailSettings({ settings, onSave, isLoading }: any) {
    const [fromEmail, setFromEmail] = useState(settings?.email?.fromEmail || '');
    const [fromName, setFromName] = useState(settings?.email?.fromName || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ fromEmail, fromName });
    };

    return (
        <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium">From Email</label>
                    <Input
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        placeholder="noreply@acme.com"
                        type="email"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">From Name</label>
                    <Input
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        placeholder="Acme Team"
                    />
                </div>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
            </form>
        </Card>
    );
}

function NotificationSettings({ settings, onSave, isLoading }: any) {
    const [emailNotifications, setEmailNotifications] = useState(
        settings?.notifications?.email !== false
    );
    const [slackNotifications, setSlackNotifications] = useState(
        settings?.notifications?.slack || false
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ email: emailNotifications, slack: slackNotifications });
    };

    return (
        <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        id="email-notifications"
                    />
                    <label htmlFor="email-notifications" className="text-sm font-medium">
                        Enable Email Notifications
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={slackNotifications}
                        onChange={(e) => setSlackNotifications(e.target.checked)}
                        id="slack-notifications"
                    />
                    <label htmlFor="slack-notifications" className="text-sm font-medium">
                        Enable Slack Notifications
                    </label>
                </div>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
            </form>
        </Card>
    );
}
