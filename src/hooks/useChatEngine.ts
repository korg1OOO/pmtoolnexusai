import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import {
  type ChatMessage,
  type AttachmentData,
  parseMessageJsonFields,
  filterVisibleMessages,
  getPinnedMessages,
} from '@/components/chat/ChatEngine';

export interface UseChatEngineOptions {
  projectId: string | null;
  channelId?: string | null;
  onNewMessage?: (msg: ChatMessage) => void;
}

export interface UseChatEngineReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  pinnedMessages: ReturnType<typeof getPinnedMessages>;
  visibleMessages: ChatMessage[];
  sendMessage: (content: string, attachment?: AttachmentData | null, replyTo?: string | null) => Promise<boolean>;
  editMessage: (messageId: string, newContent: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  forwardMessage: (originalMessage: ChatMessage, targetProjectId: string, additionalText?: string) => Promise<boolean>;
  togglePin: (messageId: string, currentPinned: boolean) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  currentUserId: string | undefined;
  getParentMessage: (parentId: string | null | undefined) => ChatMessage | undefined;
  jumpToMessage: (messageId: string, refs?: Map<string, HTMLDivElement>) => void;
}

export function useChatEngine({ projectId, channelId, onNewMessage }: UseChatEngineOptions): UseChatEngineReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  // ── Fetch messages when channelId changes ─────────────────────────────────
  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('chat_messages')
          .select('*')
          .eq('channel_id', channelId)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) {
          console.error('Error fetching messages:', error);
          setMessages([]);
        } else {
          const parsedMessages = (data || []).map((msg: any) => parseMessageJsonFields(msg));
          setMessages(parsedMessages);
        }
      } catch (e) {
        console.warn('Chat messages table may not exist yet:', e);
        setMessages([]);
      }
      setIsLoading(false);
    };

    fetchMessages();
  }, [channelId]);

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!channelId) return;

    const channel = (supabase as any)
      .channel(`chat_messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload: any) => {
          const { eventType, new: newRow, old: oldRow } = payload;

          if (eventType === 'INSERT') {
            const parsed = parseMessageJsonFields(newRow);
            setMessages((prev) => {
              if (prev.some((m) => m.id === parsed.id)) return prev;
              onNewMessageRef.current?.(parsed);
              return [...prev, parsed];
            });
          } else if (eventType === 'UPDATE') {
            const parsed = parseMessageJsonFields(newRow);
            setMessages((prev) => prev.map((m) => (m.id === parsed.id ? parsed : m)));
          } else if (eventType === 'DELETE') {
            setMessages((prev) => prev.filter((m) => m.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string, attachment?: AttachmentData | null, replyTo?: string | null): Promise<boolean> => {
      if ((!content.trim() && !attachment) || !user || !channelId) return false;

      setIsSending(true);
      try {
        const { error } = await (supabase as any).from('chat_messages').insert({
          channel_id: channelId,
          user_id: user.id,
          user_email: user.email || 'Unknown',
          content: content.trim(),
          attachments: attachment ? [attachment] : [],
          reply_to_id: replyTo || null,
          // Also store in reply_to for the thread indicator logic
          reply_to: replyTo || null,
        });

        if (error) {
          toast.error('Failed to send message');
          return false;
        }
        return true;
      } catch (e) {
        toast.error('Failed to send message');
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [user, channelId]
  );

  // ── Edit ──────────────────────────────────────────────────────────────────
  const editMessage = useCallback(async (messageId: string, newContent: string): Promise<boolean> => {
    try {
      const { error } = await (supabase as any)
        .from('chat_messages')
        .update({ content: newContent, edited_at: new Date().toISOString() })
        .eq('id', messageId);
      if (error) throw error;
      toast.success('Message edited');
      return true;
    } catch {
      toast.error('Failed to edit message');
      return false;
    }
  }, []);

  // ── Delete (soft) ─────────────────────────────────────────────────────────
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const { error } = await (supabase as any)
        .from('chat_messages')
        .update({ is_deleted: true, content: '[This message has been deleted]' })
        .eq('id', messageId);
      if (error) throw error;
      toast.success('Message deleted');
      return true;
    } catch {
      toast.error('Failed to delete message');
      return false;
    }
  }, []);

  // ── Forward ───────────────────────────────────────────────────────────────
  const forwardMessage = useCallback(
    async (originalMessage: ChatMessage, targetChannelId: string, additionalText?: string): Promise<boolean> => {
      if (!user) return false;

      const forwardedContent = additionalText
        ? `${additionalText}\n\n> *Forwarded:* ${originalMessage.content}`
        : `> *Forwarded:* ${originalMessage.content}`;

      try {
        const { error } = await (supabase as any).from('chat_messages').insert({
          channel_id: targetChannelId,
          user_id: user.id,
          user_email: user.email || 'Unknown',
          content: forwardedContent,
          attachments: [],
        });

        if (error) throw error;
        toast.success('Message forwarded');
        return true;
      } catch {
        toast.error('Failed to forward message');
        return false;
      }
    },
    [user]
  );

  // ── Pin / Unpin ───────────────────────────────────────────────────────────
  const togglePin = useCallback(async (messageId: string, currentPinned: boolean): Promise<void> => {
    try {
      await (supabase as any).from('chat_messages').update({ is_pinned: !currentPinned }).eq('id', messageId);
    } catch (e) {
      console.error('Failed to toggle pin:', e);
    }
  }, []);

  // ── Reactions ─────────────────────────────────────────────────────────────
  const addReaction = useCallback(
    async (messageId: string, emoji: string): Promise<void> => {
      if (!user) return;
      const userId = user.id;

      // Fetch current reactions for this message
      try {
        const { data, error } = await (supabase as any)
          .from('chat_messages')
          .select('reactions')
          .eq('id', messageId)
          .single();
        if (error) throw error;

        const reactions: Array<{ emoji: string; users: string[] }> = data?.reactions || [];
        const existing = reactions.find((r) => r.emoji === emoji);

        let updatedReactions: Array<{ emoji: string; users: string[] }>;
        if (existing) {
          // Add user to existing reaction (avoid duplicates)
          if (existing.users.includes(userId)) return;
          updatedReactions = reactions.map((r) =>
            r.emoji === emoji ? { ...r, users: [...r.users, userId] } : r
          );
        } else {
          updatedReactions = [...reactions, { emoji, users: [userId] }];
        }

        await (supabase as any)
          .from('chat_messages')
          .update({ reactions: updatedReactions })
          .eq('id', messageId);
      } catch (e) {
        console.error('Failed to add reaction:', e);
      }
    },
    [user]
  );

  const removeReaction = useCallback(
    async (messageId: string, emoji: string): Promise<void> => {
      if (!user) return;
      const userId = user.id;

      try {
        const { data, error } = await (supabase as any)
          .from('chat_messages')
          .select('reactions')
          .eq('id', messageId)
          .single();
        if (error) throw error;

        const reactions: Array<{ emoji: string; users: string[] }> = data?.reactions || [];
        const updatedReactions = reactions
          .map((r) =>
            r.emoji === emoji ? { ...r, users: r.users.filter((u) => u !== userId) } : r
          )
          .filter((r) => r.users.length > 0); // Remove entry when no users remain

        await (supabase as any)
          .from('chat_messages')
          .update({ reactions: updatedReactions })
          .eq('id', messageId);
      } catch (e) {
        console.error('Failed to remove reaction:', e);
      }
    },
    [user]
  );

  // ── Read state (no-op — can be extended with a separate read_receipts table) ──
  const markAsRead = useCallback(async (): Promise<void> => { }, []);
  const markAllAsRead = useCallback(async (): Promise<void> => { }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getParentMessage = useCallback(
    (parentId: string | null | undefined) => {
      if (!parentId) return undefined;
      return messages.find((m) => m.id === parentId);
    },
    [messages]
  );

  const jumpToMessage = useCallback((messageId: string, refs?: Map<string, HTMLDivElement>) => {
    if (refs) {
      const el = refs.get(messageId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-primary/10');
        setTimeout(() => el.classList.remove('bg-primary/10'), 2000);
      }
    }
  }, []);

  return {
    messages,
    isLoading,
    isSending,
    pinnedMessages: getPinnedMessages(messages),
    visibleMessages: filterVisibleMessages(messages),
    sendMessage,
    editMessage,
    deleteMessage,
    forwardMessage,
    togglePin,
    addReaction,
    removeReaction,
    markAsRead,
    markAllAsRead,
    currentUserId: user?.id,
    getParentMessage,
    jumpToMessage,
  };
}
