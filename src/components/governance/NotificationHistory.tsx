import React, { useState, useEffect } from 'react';
import { Clock, Mail, MessageSquare, Smartphone, CheckCircle, XCircle, Eye } from 'lucide-react';
import {
    getNotificationHistory,
    markNotificationOpened,
    type NotificationLog,
    type NotificationFilters,
} from '@/services/governanceNotificationService';

interface NotificationHistoryProps {
    userId: string;
}

export default function NotificationHistory({ userId }: NotificationHistoryProps) {
    const [notifications, setNotifications] = useState<NotificationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<NotificationFilters>({
        userId,
        limit: 50,
    });

    useEffect(() => {
        loadHistory();
    }, [userId, filters]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const history = await getNotificationHistory(filters);
            setNotifications(history);
        } catch (error) {
            console.error('Error loading notification history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkOpened = async (notificationId: string) => {
        try {
            await markNotificationOpened(notificationId);
            loadHistory();
        } catch (error) {
            console.error('Error marking notification as opened:', error);
        }
    };

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'email':
                return <Mail className="w-4 h-4 text-blue-600" />;
            case 'slack':
                return <MessageSquare className="w-4 h-4 text-green-600" />;
            case 'push':
                return <Smartphone className="w-4 h-4 text-purple-600" />;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'sent':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        <CheckCircle className="w-3 h-3" />
                        Sent
                    </span>
                );
            case 'failed':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                        <XCircle className="w-3 h-3" />
                        Failed
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                        <Clock className="w-3 h-3" />
                        Pending
                    </span>
                );
            default:
                return null;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Notification History</h2>
                <p className="text-sm text-gray-500 mt-1">
                    View all your past governance notifications
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Channel
                        </label>
                        <select
                            value={filters.channel || ''}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    channel: e.target.value || undefined,
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="">All Channels</option>
                            <option value="email">Email</option>
                            <option value="slack">Slack</option>
                            <option value="push">Push</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={filters.status || ''}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    status: e.target.value || undefined,
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="">All Statuses</option>
                            <option value="sent">Sent</option>
                            <option value="failed">Failed</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Event Type
                        </label>
                        <select
                            value={filters.eventType || ''}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    eventType: e.target.value || undefined,
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="">All Events</option>
                            <option value="approval_assigned">Approval Assigned</option>
                            <option value="approval_approved">Approval Approved</option>
                            <option value="approval_rejected">Approval Rejected</option>
                            <option value="delegation_received">Delegation Received</option>
                            <option value="admin_override">Admin Override</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Notification List */}
            <div className="space-y-3">
                {notifications.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                        No notifications found
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${!notification.openedAt ? 'bg-purple-50' : ''
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {getChannelIcon(notification.channel)}
                                        <h3 className="font-semibold text-gray-900">
                                            {notification.subject}
                                        </h3>
                                        {getStatusBadge(notification.status)}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        {notification.body}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(notification.createdAt)}
                                        </span>
                                        {notification.sentAt && (
                                            <span>Sent: {formatDate(notification.sentAt)}</span>
                                        )}
                                        {notification.openedAt && (
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                Opened: {formatDate(notification.openedAt)}
                                            </span>
                                        )}
                                    </div>
                                    {notification.errorMessage && (
                                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                            Error: {notification.errorMessage}
                                        </div>
                                    )}
                                </div>
                                {!notification.openedAt && (
                                    <button
                                        onClick={() => handleMarkOpened(notification.id)}
                                        className="ml-4 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                    >
                                        Mark as Read
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
