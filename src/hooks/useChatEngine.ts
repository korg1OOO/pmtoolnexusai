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
  getParentMessage: (parentId: string) => ChatMessage | undefined;
  jumpToMessage: (messageId: string) => void;
}

export function useChatEngine({ projectId, channelId, onNewMessage }: UseChatEngineOptions): UseChatEngineReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages when channelId changes
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
        console.warn('Chat messages table may not exist:', e);
        setMessages([]);
      }
      setIsLoading(false);
    };

    fetchMessages();
  }, [channelId]);

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

  const forwardMessage = useCallback(async (): Promise<boolean> => {
    toast.info('Forward not implemented');
    return false;
  }, []);

  const togglePin = useCallback(async (messageId: string, currentPinned: boolean): Promise<void> => {
    try {
      await (supabase as any).from('chat_messages').update({ is_pinned: !currentPinned }).eq('id', messageId);
    } catch (e) {
      console.error('Failed to toggle pin:', e);
    }
  }, []);

  const addReaction = useCallback(async (): Promise<void> => {}, []);
  const removeReaction = useCallback(async (): Promise<void> => {}, []);
  const markAsRead = useCallback(async (): Promise<void> => {}, []);
  const markAllAsRead = useCallback(async (): Promise<void> => {}, []);

  const getParentMessage = useCallback((parentId: string) => messages.find(m => m.id === parentId), [messages]);
  const jumpToMessage = useCallback(() => {}, []);

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
