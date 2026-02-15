import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Save, TestTube } from 'lucide-react';
import {
    getUserPreferences,
    updateUserPreferences,
    type NotificationPreferences,
} from '@/services/governanceNotificationService';
import { sendTestEmail } from '@/services/emailService';
import { sendTestSlackMessage } from '@/services/slackService';
import { sendTestPushNotification } from '@/services/pushNotificationService';

interface NotificationPreferencesProps {
    userId: string;
}

export default function NotificationPreferencesComponent({
    userId,
}: NotificationPreferencesProps) {
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingEmail, setTestingEmail] = useState(false);
    const [testingSlack, setTestingSlack] = useState(false);
    const [testingPush, setTestingPush] = useState(false);

    useEffect(() => {
        loadPreferences();
    }, [userId]);

    const loadPreferences = async () => {
        try {
            setLoading(true);
            const prefs = await getUserPreferences(userId);
            setPreferences(prefs);
        } catch (error) {
            console.error('Error loading preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!preferences) return;

        try {
            setSaving(true);
            await updateUserPreferences(userId, preferences);
            alert('Preferences saved successfully!');
        } catch (error) {
            console.error('Error saving preferences:', error);
            alert('Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    const handleTestEmail = async () => {
        try {
            setTestingEmail(true);
            const result = await sendTestEmail('test@example.com');
            if (result.success) {
                alert('Test email sent! Check your inbox.');
            } else {
                alert(`Failed to send test email: ${result.error}`);
            }
        } catch (error) {
            console.error('Error testing email:', error);
            alert('Failed to send test email');
        } finally {
            setTestingEmail(false);
        }
    };

    const handleTestSlack = async () => {
        if (!preferences?.slackWebhookUrl) {
            alert('Please enter a Slack webhook URL first');
            return;
        }

        try {
            setTestingSlack(true);
            const result = await sendTestSlackMessage(preferences.slackWebhookUrl);
            if (result.success) {
                alert('Test message sent to Slack!');
            } else {
                alert(`Failed to send test message: ${result.error}`);
            }
        } catch (error) {
            console.error('Error testing Slack:', error);
            alert('Failed to send test message');
        } finally {
            setTestingSlack(false);
        }
    };

    const handleTestPush = async () => {
        try {
            setTestingPush(true);
            const result = await sendTestPushNotification();
            if (result.success) {
                alert('Test push notification sent!');
            } else {
                alert(`Failed to send test notification: ${result.error}`);
            }
        } catch (error) {
            console.error('Error testing push:', error);
            alert('Failed to send test notification');
        } finally {
            setTestingPush(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!preferences) {
        return (
            <div className="p-8 text-center text-gray-500">
                Failed to load notification preferences
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage how you receive governance notifications
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Email Channel */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                            <p className="text-sm text-gray-500">
                                Receive notifications via email
                            </p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={preferences.emailEnabled}
                            onChange={(e) =>
                                setPreferences({
                                    ...preferences,
                                    emailEnabled: e.target.checked,
                                })
                            }
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>
                <button
                    onClick={handleTestEmail}
                    disabled={testingEmail || !preferences.emailEnabled}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                    <TestTube className="w-4 h-4" />
                    {testingEmail ? 'Sending...' : 'Send Test Email'}
                </button>
            </div>

            {/* Slack Channel */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Slack Notifications</h3>
                            <p className="text-sm text-gray-500">
                                Receive notifications in Slack
                            </p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={preferences.slackEnabled}
                            onChange={(e) =>
                                setPreferences({
                                    ...preferences,
                                    slackEnabled: e.target.checked,
                                })
                            }
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Webhook URL
                        </label>
                        <input
                            type="url"
                            value={preferences.slackWebhookUrl || ''}
                            onChange={(e) =>
                                setPreferences({
                                    ...preferences,
                                    slackWebhookUrl: e.target.value,
                                })
                            }
                            placeholder="https://hooks.slack.com/services/..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Channel
                        </label>
                        <input
                            type="text"
                            value={preferences.slackChannel || ''}
                            onChange={(e) =>
                                setPreferences({
                                    ...preferences,
                                    slackChannel: e.target.value,
                                })
                            }
                            placeholder="#governance"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={handleTestSlack}
                        disabled={testingSlack || !preferences.slackEnabled}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                    >
                        <TestTube className="w-4 h-4" />
                        {testingSlack ? 'Sending...' : 'Send Test Message'}
                    </button>
                </div>
            </div>

            {/* Push Channel */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Smartphone className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Push Notifications</h3>
                            <p className="text-sm text-gray-500">
                                Receive browser push notifications
                            </p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={preferences.pushEnabled}
                            onChange={(e) =>
                                setPreferences({
                                    ...preferences,
                                    pushEnabled: e.target.checked,
                                })
                            }
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>
                <button
                    onClick={handleTestPush}
                    disabled={testingPush || !preferences.pushEnabled}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                    <TestTube className="w-4 h-4" />
                    {testingPush ? 'Sending...' : 'Send Test Notification'}
                </button>
            </div>

            {/* Event Subscriptions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <Bell className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Event Subscriptions</h3>
                        <p className="text-sm text-gray-500">
                            Choose which events trigger notifications
                        </p>
                    </div>
                </div>
                <div className="space-y-2">
                    {[
                        { key: 'approval_assigned', label: 'Approval Assigned' },
                        { key: 'approval_approved', label: 'Approval Approved' },
                        { key: 'approval_rejected', label: 'Approval Rejected' },
                        { key: 'delegation_received', label: 'Delegation Received' },
                        { key: 'admin_override', label: 'Admin Override' },
                    ].map((event) => (
                        <label key={event.key} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.eventSubscriptions?.includes(event.key)}
                                onChange={(e) => {
                                    const subscriptions = preferences.eventSubscriptions || [];
                                    const newSubscriptions = e.target.checked
                                        ? [...subscriptions, event.key]
                                        : subscriptions.filter((s) => s !== event.key);
                                    setPreferences({
                                        ...preferences,
                                        eventSubscriptions: newSubscriptions,
                                    });
                                }}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">{event.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
