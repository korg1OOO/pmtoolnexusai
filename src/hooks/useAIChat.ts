import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type {
  AIMessage,
  AIConversation,
  AIOrchestratorResponse,
  AgentType,
} from '@/types/ai-agents';

interface UseAIChatOptions {
  projectId: string | null;
  onNewMessage?: (message: AIMessage) => void;
}

interface UseAIChatReturn {
  messages: AIMessage[];
  conversations: AIConversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  isSending: boolean;
  currentAgent: AgentType | null;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  createConversation: () => Promise<string | null>;
  selectConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  clearMessages: () => void;
}

export function useAIChat({ projectId, onNewMessage }: UseAIChatOptions): UseAIChatReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentType | null>(null);
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  // Fetch conversations for the project
  useEffect(() => {
    if (!projectId) {
      setConversations([]);
      return;
    }

    const fetchConversations = async () => {
      // Check if user is authenticated
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setConversations([]);
        return;
      }

      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', currentUser.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
      } else {
        setConversations((data || []) as AIConversation[]);
        
        // Auto-select most recent conversation or create new one
        if (data && data.length > 0 && !activeConversationId) {
          setActiveConversationId(data[0].id);
        }
      }
    };

    fetchConversations();
  }, [projectId, user?.id]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages((data || []) as AIMessage[]);
      }
      setIsLoading(false);
    };

    fetchMessages();
  }, [activeConversationId]);

  // Subscribe to realtime message updates
  useEffect(() => {
    if (!activeConversationId) return;

    const channel = supabase
      .channel(`ai_messages:${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as AIMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          onNewMessageRef.current?.(newMsg);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId]);

  // Create a new conversation
  const createConversation = useCallback(async (): Promise<string | null> => {
    if (!projectId) return null;

    // Get current user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      toast.error('Please sign in to use AI Assistant');
      return null;
    }

    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        project_id: projectId,
        user_id: currentUser.id,
        title: 'New Conversation',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
      return null;
    }

    const newConversation = data as AIConversation;
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setMessages([]);
    
    return newConversation.id;
  }, [projectId]);

  // Select a conversation
  const selectConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
      return;
    }

    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
    }
    
    toast.success('Conversation deleted');
  }, [activeConversationId]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !projectId) return;

    let conversationId = activeConversationId;

    // Create conversation if none exists
    if (!conversationId) {
      conversationId = await createConversation();
      if (!conversationId) return;
    }

    setIsSending(true);
    setCurrentAgent(null);

    // Optimistically add user message
    const tempUserMessage: AIMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      // Insert user message to DB
      const { data: userMsgData, error: userMsgError } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content,
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;

      // Replace temp message with real one
      setMessages((prev) => 
        prev.map((m) => m.id === tempUserMessage.id ? (userMsgData as AIMessage) : m)
      );

      // Build conversation history for context
      const conversationHistory = messages
        .filter((m) => m.role !== 'system')
        .slice(-10)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      // Call the orchestrator
      const response = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          message: content,
          projectId,
          conversationId,
          conversationHistory,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to get AI response');
      }

      const aiResponse = response.data as AIOrchestratorResponse;
      setCurrentAgent(aiResponse.agentType);

      // Insert assistant message
      const { error: assistantError } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant' as const,
          content: aiResponse.response,
          agent_type: aiResponse.agentType,
          metadata: {
            intent: aiResponse.intent,
            confidence: aiResponse.confidence,
            executionTime: aiResponse.executionTime,
            agentsUsed: aiResponse.agentsUsed,
            actions: aiResponse.actions,
            permissionDenied: aiResponse.permissionDenied,
          } as unknown as Record<string, unknown>,
        } as any);

      if (assistantError) {
        console.error('Error saving assistant message:', assistantError);
      }

      // Update conversation title based on first message
      if (messages.length === 0) {
        const title = content.length > 50 ? content.substring(0, 47) + '...' : content;
        await supabase
          .from('ai_conversations')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', conversationId);
        
        setConversations((prev) =>
          prev.map((c) => c.id === conversationId ? { ...c, title } : c)
        );
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get AI response');
      
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setIsSending(false);
    }
  }, [projectId, activeConversationId, messages, createConversation]);

  // Clear messages (for UI reset)
  const clearMessages = useCallback(() => {
    setMessages([]);
    setActiveConversationId(null);
  }, []);

  return {
    messages,
    conversations,
    activeConversationId,
    isLoading,
    isSending,
    currentAgent,
    sendMessage,
    createConversation,
    selectConversation,
    deleteConversation,
    clearMessages,
  };
}
