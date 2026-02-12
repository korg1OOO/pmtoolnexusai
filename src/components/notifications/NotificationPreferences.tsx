/**
 * Notification Preferences Component
 * User settings for email and in-app notifications
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { toast } from 'sonner';

export function NotificationPreferences() {
    const { data: preferences, isLoading } = useNotificationPreferences();
    const updatePreferences = useUpdateNotificationPreferences();

    const handleToggle = async (key: string, value: boolean) => {
        try {
            await updatePreferences.mutateAsync({ [key]: value });
            toast.success('Preferences updated');
        } catch (error) {
            toast.error('Failed to update preferences');
        }
    };

    const handleDigestChange = async (value: string) => {
        try {
            await updatePreferences.mutateAsync({ digest_frequency: value as any });
            toast.success('Digest frequency updated');
        } catch (error) {
            toast.error('Failed to update preferences');
        }
    };

    if (isLoading || !preferences) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>
                        Choose which emails you'd like to receive
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="billing">Billing & Payments</Label>
                            <p className="text-sm text-muted-foreground">
                                Critical billing updates, payment receipts, failed payments
                            </p>
                        </div>
                        <Switch
                            id="billing"
                            checked={preferences.billing_emails}
                            onCheckedChange={(checked) => handleToggle('billing_emails', checked)}
                            disabled={true} // Billing emails are mandatory
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="usage">Usage Alerts</Label>
                            <p className="text-sm text-muted-foreground">
                                Notifications when approaching plan limits
                            </p>
                        </div>
                        <Switch
                            id="usage"
                            checked={preferences.usage_emails}
                            onCheckedChange={(checked) => handleToggle('usage_emails', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="product">Product Updates</Label>
                            <p className="text-sm text-muted-foreground">
                                New features and product announcements
                            </p>
                        </div>
                        <Switch
                            id="product"
                            checked={preferences.product_updates}
                            onCheckedChange={(checked) => handleToggle('product_updates', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="marketing">Marketing</Label>
                            <p className="text-sm text-muted-foreground">
                                Tips, case studies, and special offers
                            </p>
                        </div>
                        <Switch
                            id="marketing"
                            checked={preferences.marketing_emails}
                            onCheckedChange={(checked) => handleToggle('marketing_emails', checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>In-App Notifications</CardTitle>
                    <CardDescription>
                        Manage how you receive notifications within the app
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="in-app">Enable In-App Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Show notification bell and toasts
                            </p>
                        </div>
                        <Switch
                            id="in-app"
                            checked={preferences.in_app_notifications}
                            onCheckedChange={(checked) => handleToggle('in_app_notifications', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="desktop">Desktop Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Browser push notifications
                            </p>
                        </div>
                        <Switch
                            id="desktop"
                            checked={preferences.desktop_notifications}
                            onCheckedChange={(checked) => handleToggle('desktop_notifications', checked)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="digest">Digest Frequency</Label>
                        <Select
                            value={preferences.digest_frequency}
                            onValueChange={handleDigestChange}
                        >
                            <SelectTrigger id="digest">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="realtime">Real-time</SelectItem>
                                <SelectItem value="daily">Daily Digest</SelectItem>
                                <SelectItem value="weekly">Weekly Digest</SelectItem>
                                <SelectItem value="monthly">Monthly Digest</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            How often to receive non-urgent notifications
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
