// ============================================================================
// PUSH NOTIFICATION SERVICE
// Handles browser push notifications
// ============================================================================

/**
 * Push notification result
 */
export interface PushResult {
    success: boolean;
    error?: string;
}

/**
 * Push subscription data
 */
export interface PushSubscriptionData {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!isPushSupported()) {
        throw new Error('Push notifications not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscriptionData | null> {
    try {
        if (!isPushSupported()) {
            console.error('Push notifications not supported');
            return null;
        }

        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        const subscription = await (registration as any).pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(getVapidPublicKey()),
        });

        const subscriptionJson = subscription.toJSON();
        return {
            endpoint: subscriptionJson.endpoint || '',
            keys: {
                p256dh: subscriptionJson.keys?.p256dh || '',
                auth: subscriptionJson.keys?.auth || '',
            },
        };
    } catch (error) {
        console.error('Error subscribing to push:', error);
        return null;
    }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return false;

        const subscription = await (registration as any).pushManager.getSubscription();
        if (!subscription) return false;

        return await subscription.unsubscribe();
    } catch (error) {
        console.error('Error unsubscribing from push:', error);
        return false;
    }
}

/**
 * Send push notification via service worker
 */
export async function sendPushNotification(
    title: string,
    body: string,
    data?: Record<string, any>
): Promise<PushResult> {
    try {
        if (!isPushSupported()) {
            return { success: false, error: 'Push notifications not supported' };
        }

        if (Notification.permission !== 'granted') {
            return { success: false, error: 'Notification permission not granted' };
        }

        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
            return { success: false, error: 'Service worker not registered' };
        }

        const notifOptions: NotificationOptions = {
            body,
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            tag: data?.eventId || 'governance-notification',
            data: data,
            requireInteraction: false,
        };

        await registration.showNotification(title, notifOptions);
        return { success: true };
    } catch (error) {
        console.error('Error sending push notification:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Show local notification (doesn't require service worker)
 */
export async function showLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
): Promise<PushResult> {
    try {
        if (!('Notification' in window)) {
            return { success: false, error: 'Notifications not supported' };
        }

        if (Notification.permission === 'default') {
            const permission = await requestNotificationPermission();
            if (permission !== 'granted') {
                return { success: false, error: 'Notification permission denied' };
            }
        }

        if (Notification.permission !== 'granted') {
            return { success: false, error: 'Notification permission not granted' };
        }

        const notification = new Notification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            tag: data?.eventId || 'governance-notification',
            data: data,
        });

        notification.onclick = () => {
            if (data?.approvalUrl) {
                window.open(data.approvalUrl, '_blank');
            }
            notification.close();
        };

        return { success: true };
    } catch (error) {
        console.error('Error showing local notification:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

function getVapidPublicKey(): string {
    return import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Test push notification
 */
export async function sendTestPushNotification(): Promise<PushResult> {
    return sendPushNotification(
        'ProjectOye - Push Notification Test',
        'Your push notifications are configured correctly!',
        { eventType: 'test', eventId: 'test' }
    );
}

/**
 * Get current push subscription status
 */
export async function getPushSubscriptionStatus(): Promise<{
    supported: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
}> {
    const supported = isPushSupported();
    const permission = supported ? Notification.permission : 'denied';

    let subscribed = false;
    if (supported) {
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                const subscription = await (registration as any).pushManager.getSubscription();
                subscribed = subscription !== null;
            }
        } catch (error) {
            console.error('Error checking subscription status:', error);
        }
    }

    return { supported, permission, subscribed };
}
