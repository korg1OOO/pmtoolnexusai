import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceUser {
  id: string;
  email: string;
  displayName: string;
  initials: string;
  color: string;
  isEditing: boolean;
  editingTaskId?: string;
  lastSeen: string;
  cursorPosition?: { x: number; y: number };
}

interface PresenceState {
  [key: string]: PresenceUser[];
}

const AVATAR_COLORS = [
  'hsl(var(--primary))',
  'hsl(142 76% 36%)', // green
  'hsl(38 92% 50%)',  // amber
  'hsl(262 83% 58%)', // purple
  'hsl(199 89% 48%)', // cyan
  'hsl(346 77% 49%)', // rose
  'hsl(24 95% 53%)',  // orange
  'hsl(173 80% 40%)', // teal
];

function getColorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(email: string): string {
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getDisplayName(email: string): string {
  const name = email.split('@')[0];
  return name.split(/[._-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

export function usePresence(projectId: string | null) {
  const { user } = useAuth();
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | undefined>();

  useEffect(() => {
    if (!projectId || !user) {
      setUsers([]);
      return;
    }

    const channelName = `presence:project:${projectId}`;
    const presenceChannel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    const userPresence: PresenceUser = {
      id: user.id,
      email: user.email || 'Unknown',
      displayName: getDisplayName(user.email || 'Unknown'),
      initials: getInitials(user.email || 'Unknown'),
      color: getColorForUser(user.id),
      isEditing: false,
      lastSeen: new Date().toISOString(),
    };

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState<PresenceUser>();
        const activeUsers: PresenceUser[] = [];
        
        Object.keys(state).forEach((key) => {
          const presences = state[key];
          if (presences && presences.length > 0) {
            // Take the most recent presence for each user
            activeUsers.push(presences[presences.length - 1]);
          }
        });

        // Filter out current user and sort by last seen
        const otherUsers = activeUsers
          .filter(u => u.id !== user.id)
          .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

        setUsers(otherUsers);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track(userPresence);
        }
      });

    setChannel(presenceChannel);

    return () => {
      presenceChannel.unsubscribe();
      setChannel(null);
    };
  }, [projectId, user]);

  // Update presence when editing state changes
  useEffect(() => {
    if (!channel || !user) return;

    const updatePresence = async () => {
      await channel.track({
        id: user.id,
        email: user.email || 'Unknown',
        displayName: getDisplayName(user.email || 'Unknown'),
        initials: getInitials(user.email || 'Unknown'),
        color: getColorForUser(user.id),
        isEditing,
        editingTaskId,
        lastSeen: new Date().toISOString(),
      });
    };

    updatePresence();
  }, [channel, user, isEditing, editingTaskId]);

  const startEditing = useCallback((taskId?: string) => {
    setIsEditing(true);
    setEditingTaskId(taskId);
  }, []);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
    setEditingTaskId(undefined);
  }, []);

  const updateCursor = useCallback(async (position: { x: number; y: number }) => {
    if (!channel || !user) return;

    await channel.track({
      id: user.id,
      email: user.email || 'Unknown',
      displayName: getDisplayName(user.email || 'Unknown'),
      initials: getInitials(user.email || 'Unknown'),
      color: getColorForUser(user.id),
      isEditing,
      editingTaskId,
      cursorPosition: position,
      lastSeen: new Date().toISOString(),
    });
  }, [channel, user, isEditing, editingTaskId]);

  return {
    users,
    startEditing,
    stopEditing,
    updateCursor,
    isConnected: !!channel,
  };
}
