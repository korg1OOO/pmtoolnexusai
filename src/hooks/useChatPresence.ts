import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TypingUser {
  id: string;
  email: string;
  displayName?: string;
}

export function useChatPresence(projectId: string | null) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!projectId || !user) return;

    const channel = supabase.channel(`chat-typing:${projectId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: TypingUser[] = [];
        
        Object.entries(state).forEach(([userId, presences]) => {
          const presence = (presences as any[])[0];
          if (presence?.isTyping) {
            users.push({
              id: userId,
              email: presence.email || 'Unknown',
              displayName: presence.displayName,
            });
          }
        });
        
        setTypingUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            email: user.email,
            displayName: user.email?.split('@')[0],
            isTyping: false,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [projectId, user]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!channelRef.current || !user) return;
    
    // Avoid redundant updates
    if (isTypingRef.current === isTyping) return;
    isTypingRef.current = isTyping;

    await channelRef.current.track({
      email: user.email,
      displayName: user.email?.split('@')[0],
      isTyping,
    });
  }, [user]);

  const startTyping = useCallback(() => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    setTyping(true);
    
    // Auto-stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 3000);
  }, [setTyping]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTyping(false);
  }, [setTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers,
    startTyping,
    stopTyping,
  };
}
