/**
 * Enhanced Notification Preferences
 * Expanded UI for managing all notification channels and preferences
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Bell, MessageSquare, Smartphone, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/useNotificationPreferences';

export function NotificationPreferences() {
    const { data: preferences, isLoading } = useNotificationPreferences() as any;
    const updatePreferences = useUpdateNotificationPreferences();
    const [hasChanges, setHasChanges] = useState(false);
    const [localPrefs, setLocalPrefs] = useState<any>(null);

    React.useEffect(() => {
        if (preferences && !localPrefs) {
            setLocalPrefs(preferences);
        }
    }, [preferences, localPrefs]);

    const handleToggle = (category: string, key: string, value: boolean) => {
        const updated = {
            ...localPrefs,
            [category]: {
                ...localPrefs?.[category],
                [key]: value,
            },
        };
        setLocalPrefs(updated);
        setHasChanges(true);
    };

    const handleSave = async () => {
        await updatePreferences.mutateAsync(localPrefs);
        setHasChanges(false);
    };

    if (isLoading || !localPrefs) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    Loading preferences...
                </CardContent>
            </Card>
        );
    }

    const emailPrefs = localPrefs.email || {};
    const inAppPrefs = localPrefs.in_app || {};
    const smsPrefs = localPrefs.sms || {};
    const pushPrefs = localPrefs.push || {};

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Notification Preferences</h2>
                    <p className="text-muted-foreground">Manage how you receive notifications</p>
                </div>
                {hasChanges && (
                    <Button onClick={handleSave} disabled={updatePreferences.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                    </Button>
                )}
            </div>

            <Tabs defaultValue="email">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="email">
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                    </TabsTrigger>
                    <TabsTrigger value="in_app">
                        <Bell className="h-4 w-4 mr-2" />
                        In-App
                    </TabsTrigger>
                    <TabsTrigger value="sms">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        SMS
                        <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="push">
                        <Smartphone className="h-4 w-4 mr-2" />
                        Push
                        <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge>
                    </TabsTrigger>
                </TabsList>

                {/* Email Preferences */}
                <TabsContent value="email">
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Notifications</CardTitle>
                            <CardDescription>Choose which emails you want to receive</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Billing & Payments */}
                            <div>
                                <h3 className="font-semibold mb-3">Billing & Payments</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Payment Confirmations</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receipts and payment successful notifications
                                            </p>
                                        </div>
                                        <Switch
                                            checked={emailPrefs.payment_success ?? true}
                                            onCheckedChange={(v) => handleToggle('email', 'payment_success', v)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Payment Failed</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Alerts when payments fail or need attention
                                            </p>
                                        </div>
                                        <Switch
                                            checked={emailPrefs.payment_failed ?? true}
                                            onCheckedChange={(v) => handleToggle('email', 'payment_failed', v)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Card Expiring</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Reminders when your payment method is about to expire
                                            </p>
                                        </div>
                                        <Switch
                                            checked={emailPrefs.card_expiring ?? true}
                                            onCheckedChange={(v) => handleToggle('email', 'card_expiring', v)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Invoice Generated</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Monthly invoices and billing statements
                                            </p>
                                        </div>
                                        <Switch
                                            checked={emailPrefs.invoice_generated ?? true}
                                            onCheckedChange={(v) => handleToggle('email', 'invoice_generated', v)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Subscription Updates */}
                            <div>
                                <h3 className="font-semibold mb-3">Subscription</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Trial Expiring</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Reminders when your trial is ending soon
                                            </p>
                                        </div>
                                        <Switch
                                            checked={emailPrefs.trial_expiring ?? true}
                                            onCheckedChange={(v) => handleToggle('email', 'trial_expiring', v)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Renewal Reminders</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Notifications before subscription renewal
                                            </p>
                                        </div>
                                        <Switch
                                            checked={emailPrefs.renewal_reminder ?? true}
                                            onCheckedChange={(v) => handleToggle('email', 'renewal_reminder', v)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Plan Changes</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Confirmations when you upgrade or downgrade
                                            </p>
                                        </div>
                                        <Switch
                                            checked={emailPrefs.plan_changed ?? true}
                                            onCheckedChange={(v) => handleToggle('email', 'plan_changed', v)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Engagement */}
                            <div>
                                <h3 className="font-semibold mb-3">Engagement & Updates</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Monthly Summary</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Your monthly usage and activity summary
                                            </p>
                                        </div>
                                        <Switch
                                            checked={emailPrefs.monthly_summary ?? true}
                                            onCheckedChange={(v) => handleToggle('email', 'monthly_summary', v)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Product Updates</Label>
                                            <p className="text-sm text-muted-foreground">
                                                New features and product announcements
                                            </p>
                                        </div>
                                        <Switch
                                            checked={emailPrefs.product_updates ?? true}
                                            onCheckedChange={(v) => handleToggle('email', 'product_updates', v)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Tips & Best Practices</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Helpful guides and productivity tips
                                            </p>
                                        </div>
                                        <Switch
                                            checked={emailPrefs.tips ?? false}
                                            onCheckedChange={(v) => handleToggle('email', 'tips', v)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Re-engagement</Label>
                                            <p className="text-sm text-muted-foreground">
                                                We'll check in if you haven't been active
                                            </p>
                                        </div>
                                        <Switch
                                            checked={emailPrefs.inactive_user ?? true}
                                            onCheckedChange={(v) => handleToggle('email', 'inactive_user', v)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* In-App Preferences */}
                <TabsContent value="in_app">
                    <Card>
                        <CardHeader>
                            <CardTitle>In-App Notifications</CardTitle>
                            <CardDescription>Manage notifications shown in the app</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>All In-App Notifications</Label>
                                <Switch
                                    checked={inAppPrefs.enabled ?? true}
                                    onCheckedChange={(v) => handleToggle('in_app', 'enabled', v)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <Label>Desktop Notifications</Label>
                                <Switch
                                    checked={inAppPrefs.desktop ?? true}
                                    onCheckedChange={(v) => handleToggle('in_app', 'desktop', v)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <Label>Sound Alerts</Label>
                                <Switch
                                    checked={inAppPrefs.sound ?? false}
                                    onCheckedChange={(v) => handleToggle('in_app', 'sound', v)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SMS Preferences */}
                <TabsContent value="sms">
                    <Card>
                        <CardHeader>
                            <CardTitle>SMS Notifications</CardTitle>
                            <CardDescription>
                                Text message notifications (Pro feature)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="bg-muted p-4 rounded-lg text-center">
                                <p className="text-sm text-muted-foreground">
                                    SMS notifications are available on Pro and higher plans
                                </p>
                                <Button variant="outline" className="mt-3" size="sm">
                                    Upgrade to Pro
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Push Preferences */}
                <TabsContent value="push">
                    <Card>
                        <CardHeader>
                            <CardTitle>Push Notifications</CardTitle>
                            <CardDescription>
                                Mobile push notifications (Pro feature)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="bg-muted p-4 rounded-lg text-center">
                                <p className="text-sm text-muted-foreground">
                                    Push notifications are available on Pro and higher plans
                                </p>
                                <Button variant="outline" className="mt-3" size="sm">
                                    Upgrade to Pro
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Save Banner */}
            {hasChanges && (
                <Card className="border-primary">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-medium">Unsaved Changes</p>
                                    <p className="text-sm text-muted-foreground">
                                        Don't forget to save your preferences
                                    </p>
                                </div>
                            </div>
                            <Button onClick={handleSave} disabled={updatePreferences.isPending}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Preferences
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
