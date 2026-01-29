import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ChatMessage {
  id: string;
  project_id: string;
  user_id: string;
  user_email: string;
  content: string;
  created_at: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_size?: number | null;
}

export function useProjectChat(projectId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch initial messages
  useEffect(() => {
    if (!projectId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('project_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages((data as ChatMessage[]) || []);
      }
      setIsLoading(false);
    };

    fetchMessages();
  }, [projectId]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`chat:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'project_messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== (payload.old as any).id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const sendMessage = async (
    content: string,
    attachment?: {
      url: string;
      name: string;
      type: string;
      size: number;
    }
  ): Promise<boolean> => {
    if ((!content.trim() && !attachment) || !user || !projectId) return false;

    setIsSending(true);
    const { error } = await supabase.from('project_messages').insert({
      project_id: projectId,
      user_id: user.id,
      user_email: user.email || 'Unknown',
      content: content.trim(),
      attachment_url: attachment?.url || null,
      attachment_name: attachment?.name || null,
      attachment_type: attachment?.type || null,
      attachment_size: attachment?.size || null,
    });

    setIsSending(false);

    if (error) {
      console.error('Error sending message:', error);
      return false;
    }

    return true;
  };

  const deleteMessage = async (messageId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('project_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      return false;
    }

    return true;
  };

  return {
    messages,
    isLoading,
    isSending,
    sendMessage,
    deleteMessage,
    currentUserId: user?.id,
  };
}
