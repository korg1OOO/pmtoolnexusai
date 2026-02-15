import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getNotificationHistory, type NotificationFilters } from '@/services/governanceNotificationService';

interface NotificationBadgeProps {
    userId: string;
    onClick?: () => void;
}

export default function NotificationBadge({ userId, onClick }: NotificationBadgeProps) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUnreadCount();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(loadUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    const loadUnreadCount = async () => {
        try {
            const filters: NotificationFilters = {
                userId,
                limit: 100,
            };
            const notifications = await getNotificationHistory(filters);
            const unread = notifications.filter((n) => !n.openedAt).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error loading unread count:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={onClick}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Notifications"
        >
            <Bell className="w-5 h-5" />
            {!loading && unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </button>
    );
}
