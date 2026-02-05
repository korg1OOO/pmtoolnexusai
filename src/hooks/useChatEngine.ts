import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import {
  type ChatMessage,
  type DbMessage,
  type AttachmentData,
  type Reaction,
  type ReadReceipt,
  type EditHistoryEntry,
  parseMessageJsonFields,
  filterVisibleMessages,
  getPinnedMessages,
  scrollToMessage,
} from '@/components/chat/ChatEngine';

export interface UseChatEngineOptions {
  projectId: string | null;
  channelId?: string | null; // Added channelId
  onNewMessage?: (msg: ChatMessage) => void;
}

export interface UseChatEngineReturn {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;

  // Derived data
  pinnedMessages: ReturnType<typeof getPinnedMessages>;
  visibleMessages: ChatMessage[];

  // Message CRUD
  sendMessage: (
    content: string,
    attachment?: AttachmentData | null,
    replyTo?: string | null
  ) => Promise<boolean>;
  editMessage: (messageId: string, newContent: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  forwardMessage: (
    originalMessage: ChatMessage,
    targetProjectId: string, // Kept for logic, but might need channel target in future
    additionalText?: string
  ) => Promise<boolean>;

  // Features
  togglePin: (messageId: string, currentPinned: boolean) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  updateReadReceipts: (messageId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;

  // Helpers
  getParentMessage: (replyToId: string | null | undefined) => ChatMessage | undefined;
  jumpToMessage: (messageId: string, refs: Map<string, HTMLDivElement>) => void;

  // Current user
  currentUserId?: string;
}

/**
 * Core chat engine hook that encapsulates all chat business logic
 * Used by both ProjectChat (compact) and TeamChatView (full-page)
 */
export function useChatEngine({
  projectId,
  channelId,
  onNewMessage,
}: UseChatEngineOptions): UseChatEngineReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  // Fetch initial messages
  useEffect(() => {
    // If no channelId, we might want to wait or clear. 
    // If only projectId is provided, old logic fetched by project_id.
    // New logic: fetch by channel_id.
    if (!channelId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chat_messages') // Updated table name
        .select('*')
        .eq('channel_id', channelId) // Updated filter
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        const parsedMessages = (data || []).map((msg) =>
          parseMessageJsonFields(msg as any) // Type assertion might be needed if types aren't regenerated yet
        );
        setMessages(parsedMessages);
      }
      setIsLoading(false);
    };

    fetchMessages();
  }, [channelId]); // Depend on channelId

  // Subscribe to realtime messages
  useEffect(() => {
    if (!channelId) return;

    const channel = supabase
      .channel(`chat_engine:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const newMsg = parseMessageJsonFields(payload.new as any);
          setMessages((prev) => [...prev, newMsg]);
          onNewMessageRef.current?.(newMsg);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const updatedMsg = parseMessageJsonFields(payload.new as any);
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== (payload.old as any).id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  // Send a new message
  const sendMessage = useCallback(
    async (
      content: string,
      attachment?: AttachmentData | null,
      replyTo?: string | null
    ): Promise<boolean> => {
      if ((!content.trim() && !attachment) || !user || !channelId) return false;

      setIsSending(true);
      const { error } = await supabase.from('chat_messages').insert({
        channel_id: channelId, // Use channelId
        user_id: user.id,
        user_email: user.email || 'Unknown',
        content: content.trim(),
        attachment_url: attachment?.url || null,
        attachment_name: attachment?.name || null,
        attachment_type: attachment?.type || null,
        attachment_size: attachment?.size || null,
        reply_to: replyTo || null,
      });

      setIsSending(false);

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        return false;
      }

      return true;
    },
    [user, channelId]
  );

  // Edit an existing message
  const editMessage = useCallback(
    async (messageId: string, newContent: string): Promise<boolean> => {
      const message = messages.find((m) => m.id === messageId);
      if (!message || !user) return false;

      const newHistoryEntry: EditHistoryEntry = {
        content: message.content,
        editedAt: new Date().toISOString(),
      };

      const updatedHistory = [...(message.edit_history || []), newHistoryEntry];

      const { error } = await supabase
        .from('chat_messages')
        .update({
          content: newContent,
          edited_at: new Date().toISOString(),
          edit_history: JSON.parse(JSON.stringify(updatedHistory)),
        })
        .eq('id', messageId);

      if (error) {
        toast.error('Failed to edit message');
        return false;
      }

      toast.success('Message edited');
      return true;
    },
    [messages, user]
  );

  // Delete a message (soft delete)
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('chat_messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        content: '[This message has been deleted]',
      })
      .eq('id', messageId);

    if (error) {
      toast.error('Failed to delete message');
      return false;
    }

    toast.success('Message deleted');
    return true;
  }, []);

  // Forward a message to another project (Adaptation: targetProjectId logic needs review if we forward to channel)
  // For now we assume we forward to a 'general' channel in the target project or we need targetChannelId
  // I will keep it but warn it might fail if table expects channel_id. 
  // IMPORTANT: The table chat_messages needs channel_id. So forwarding to a project_id doesn't make sense unless we resolve a channel.
  // I will disable forwarding for now or simplistic implementation.
  const forwardMessage = useCallback(
    async (
      originalMessage: ChatMessage,
      targetProjectId: string,
      additionalText?: string
    ): Promise<boolean> => {
      // TODO: Forward needs target Channel ID, not Project ID. 
      // For now, flagging as not implemented to avoid SQL error
      toast.error("Forwarding not fully implemented for new channel architecture");
      return false;
    },
    [user]
  );

  // Toggle pin status
  const togglePin = useCallback(
    async (messageId: string, currentPinned: boolean): Promise<void> => {
      if (!user) return;

      const { error } = await supabase
        .from('chat_messages')
        .update({
          is_pinned: !currentPinned,
          pinned_at: !currentPinned ? new Date().toISOString() : null,
          pinned_by: !currentPinned ? user.id : null,
        })
        .eq('id', messageId);

      if (error) {
        toast.error('Failed to pin message');
      } else {
        toast.success(currentPinned ? 'Message unpinned' : 'Message pinned');
      }
    },
    [user]
  );

  // Add a reaction
  const addReaction = useCallback(
    async (messageId: string, emoji: string): Promise<void> => {
      if (!user) return;

      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      const currentReactions: Reaction[] = message.reactions || [];
      const existingReaction = currentReactions.find((r) => r.emoji === emoji);

      let newReactions: Reaction[];
      if (existingReaction) {
        const alreadyReacted = existingReaction.users.some((u) => u.id === user.id);
        if (alreadyReacted) return;

        newReactions = currentReactions.map((r) =>
          r.emoji === emoji
            ? { ...r, users: [...r.users, { id: user.id, email: user.email || '' }] }
            : r
        );
      } else {
        newReactions = [
          ...currentReactions,
          { emoji, users: [{ id: user.id, email: user.email || '' }] },
        ];
      }

      await supabase
        .from('chat_messages')
        .update({ reactions: JSON.parse(JSON.stringify(newReactions)) })
        .eq('id', messageId);
    },
    [messages, user]
  );

  // Remove a reaction
  const removeReaction = useCallback(
    async (messageId: string, emoji: string): Promise<void> => {
      if (!user) return;

      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      const currentReactions: Reaction[] = message.reactions || [];
      const newReactions = currentReactions
        .map((r) =>
          r.emoji === emoji ? { ...r, users: r.users.filter((u) => u.id !== user.id) } : r
        )
        .filter((r) => r.users.length > 0);

      await supabase
        .from('chat_messages')
        .update({ reactions: JSON.parse(JSON.stringify(newReactions)) })
        .eq('id', messageId);
    },
    [messages, user]
  );

  // Update read receipts for a single message
  const updateReadReceipts = useCallback(
    async (messageId: string): Promise<void> => {
      if (!user) return;

      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      const currentReceipts: ReadReceipt[] = message.read_by || [];
      if (currentReceipts.some((r) => r.userId === user.id)) return;

      const newReceipts = [
        ...currentReceipts,
        { userId: user.id, userEmail: user.email || '', readAt: new Date().toISOString() },
      ];

      await supabase
        .from('chat_messages')
        .update({ read_by: JSON.parse(JSON.stringify(newReceipts)) })
        .eq('id', messageId);
    },
    [messages, user]
  );

  // Mark all messages as read
  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!user) return;

    const unreadMessages = messages.filter(
      (m) =>
        m.user_id !== user.id && !(m.read_by || []).some((r) => r.userId === user.id)
    );

    for (const msg of unreadMessages) {
      await updateReadReceipts(msg.id);
    }
  }, [messages, user, updateReadReceipts]);

  // Get parent message for replies
  const getParentMessage = useCallback(
    (replyToId: string | null | undefined): ChatMessage | undefined => {
      if (!replyToId) return undefined;
      return messages.find((m) => m.id === replyToId);
    },
    [messages]
  );

  // Jump to a message
  const jumpToMessage = useCallback(
    (messageId: string, refs: Map<string, HTMLDivElement>): void => {
      scrollToMessage(messageId, refs);
    },
    []
  );

  // Derived data
  const visibleMessages = filterVisibleMessages(messages);
  const pinnedMessages = getPinnedMessages(messages);

  return {
    messages,
    isLoading,
    isSending,
    pinnedMessages,
    visibleMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    forwardMessage,
    togglePin,
    addReaction,
    removeReaction,
    updateReadReceipts,
    markAllAsRead,
    getParentMessage,
    jumpToMessage,
    currentUserId: user?.id,
  };
}
