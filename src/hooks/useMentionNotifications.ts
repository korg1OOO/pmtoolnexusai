import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

interface MentionNotificationOptions {
  enabled: boolean;
}

export function useMentionNotifications(options: MentionNotificationOptions = { enabled: true }) {
  const { user } = useAuth();
  const permissionRef = useRef<NotificationPermission>('default');

  // Request notification permission
  useEffect(() => {
    if (!options.enabled || !('Notification' in window)) return;
    
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        permissionRef.current = permission;
      });
    } else {
      permissionRef.current = Notification.permission;
    }
  }, [options.enabled]);

  // Check if a message mentions the current user
  const checkMention = useCallback((content: string): boolean => {
    if (!user?.email) return false;
    
    const username = user.email.split('@')[0].toLowerCase();
    const mentionPatterns = [
      new RegExp(`@${username}\\b`, 'i'),
      new RegExp(`@${user.email.split('@')[0]}\\b`, 'i'),
    ];
    
    return mentionPatterns.some(pattern => pattern.test(content));
  }, [user?.email]);

  // Show notification
  const showNotification = useCallback((
    senderName: string,
    content: string,
    onClick?: () => void
  ) => {
    if (!options.enabled) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    
    // Don't show if document is focused
    if (document.hasFocus()) return;

    const truncatedContent = content.length > 100 
      ? content.substring(0, 100) + '...' 
      : content;

    const notification = new Notification(`${senderName} mentioned you`, {
      body: truncatedContent,
      icon: '/favicon.ico',
      tag: 'chat-mention', // Prevents duplicate notifications
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      onClick?.();
    };

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
  }, [options.enabled]);

  // Process incoming message for mentions
  const processMessage = useCallback((
    content: string,
    senderName: string,
    senderId: string,
    onClick?: () => void
  ) => {
    // Don't notify for own messages
    if (senderId === user?.id) return;
    
    if (checkMention(content)) {
      showNotification(senderName, content, onClick);
    }
  }, [user?.id, checkMention, showNotification]);

  return {
    processMessage,
    checkMention,
    hasPermission: permissionRef.current === 'granted',
    requestPermission: async () => {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        permissionRef.current = permission;
        return permission === 'granted';
      }
      return false;
    },
  };
}
