/**
 * Notification Banner Component
 * Shows critical notifications as banners at top of page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications, useMarkNotificationRead } from '@/hooks/useNotifications';

export function NotificationBanner() {
    const navigate = useNavigate();
    const { data: notifications = [] } = useNotifications('unread');
    const markRead = useMarkNotificationRead();

    // Show only critical priority notifications
    const criticalNotifications = notifications.filter((n: any) =>
        n.priority === 'critical' && !n.read
    );

    if (criticalNotifications.length === 0) return null;

    const notification = criticalNotifications[0] as any;

    const handleDismiss = () => {
        markRead.mutate(notification.id);
    };

    const handleAction = () => {
        if (notification.action_url) {
            const url: string = notification.action_url;
            if (url.startsWith('http://') || url.startsWith('https://')) {
                window.open(url, '_blank', 'noopener,noreferrer');
            } else {
                navigate(url);
            }
        }
        markRead.mutate(notification.id);
    };

    // Determine banner color based on type
    const getBannerClasses = () => {
        switch (notification.type) {
            case 'billing':
                return 'bg-red-500/10 border-red-500/20 text-red-900 dark:text-red-100';
            case 'usage':
                return 'bg-orange-500/10 border-orange-500/20 text-orange-900 dark:text-orange-100';
            default:
                return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-900 dark:text-yellow-100';
        }
    };

    return (
        <div className={`border-b ${getBannerClasses()}`}>
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-sm">{notification.title}</p>
                            <p className="text-sm opacity-90">{notification.message}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {notification.action_url && (
                            <Button
                                size="sm"
                                variant="default"
                                onClick={handleAction}
                            >
                                {notification.action_label || 'Take Action'}
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleDismiss}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
