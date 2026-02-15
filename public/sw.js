// Service Worker for Push Notifications
// This file handles background push notifications and notification clicks

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

// Install event
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(self.clients.claim());
});

// Push event - received when server sends a push notification
self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);

    if (!event.data) {
        return;
    }

    try {
        const data = event.data.json();
        const title = data.title || 'ProjectOye Notification';
        const options = {
            body: data.body || '',
            icon: data.icon || '/icon-192.png',
            badge: data.badge || '/badge-72.png',
            tag: data.tag || 'governance-notification',
            data: data.data || {},
            requireInteraction: data.requireInteraction || false,
            actions: data.actions || [
                {
                    action: 'view',
                    title: 'View',
                },
                {
                    action: 'close',
                    title: 'Dismiss',
                },
            ],
        };

        event.waitUntil(self.registration.showNotification(title, options));
    } catch (error) {
        console.error('Error handling push event:', error);
    }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // Get URL from notification data
    const urlToOpen = event.notification.data?.approvalUrl || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }

            // Open new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

// Background sync (future enhancement)
self.addEventListener('sync', (event) => {
    console.log('Background sync:', event);
    // Can be used for offline notification queueing
});

export { };
