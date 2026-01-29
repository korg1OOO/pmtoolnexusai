import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { MessageCircle, Send, X, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, isToday, isYesterday } from 'date-fns';
import { toast } from 'sonner';
import { MentionInput } from '@/components/chat/MentionInput';
import { ChatAttachmentButton, AttachmentPreview, AttachmentDisplay, AttachmentData } from '@/components/chat/ChatAttachment';
import { MessageReactions, Reaction, QuickReactionPicker } from '@/components/chat/MessageReactions';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { useChatPresence } from '@/hooks/useChatPresence';
import { useMentionNotifications } from '@/hooks/useMentionNotifications';

interface ChatMessage {
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
  reactions?: Reaction[] | null;
}

interface ProjectChatProps {
  projectId: string;
  isOpen: boolean;
  onToggle: () => void;
}

function getInitials(email: string): string {
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getColorForUser(userId: string): string {
  const colors = [
    'bg-primary',
    'bg-green-500',
    'bg-amber-500',
    'bg-purple-500',
    'bg-cyan-500',
    'bg-rose-500',
    'bg-orange-500',
    'bg-teal-500',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return format(date, 'HH:mm');
  } else if (isYesterday(date)) {
    return 'Yesterday ' + format(date, 'HH:mm');
  }
  return format(date, 'MMM d, HH:mm');
}

// Mock users for @mention - in production, fetch from project members
const mockTeamMembers = [
  { id: '1', name: 'Sarah Chen', role: 'Project Manager', status: 'online' as const },
  { id: '2', name: 'Mike Johnson', role: 'Developer', status: 'online' as const },
  { id: '3', name: 'Emily Davis', role: 'Designer', status: 'away' as const },
  { id: '4', name: 'Alex Thompson', role: 'QA Lead', status: 'offline' as const },
  { id: '5', name: 'Jordan Lee', role: 'DevOps', status: 'online' as const },
];

export function ProjectChat({ projectId, isOpen, onToggle }: ProjectChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingAttachment, setPendingAttachment] = useState<AttachmentData | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Chat presence for typing indicators
  const { typingUsers, startTyping, stopTyping } = useChatPresence(projectId);
  
  // Mention notifications
  const { processMessage, requestPermission, hasPermission } = useMentionNotifications({
    enabled: notificationsEnabled,
  });

  // Fetch initial messages
  useEffect(() => {
    if (!projectId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('project_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Parse reactions from JSON
      const parsedMessages = (data || []).map(msg => ({
        ...msg,
        reactions: Array.isArray(msg.reactions) ? (msg.reactions as unknown as Reaction[]) : [],
      }));
      setMessages(parsedMessages);
    };

    fetchMessages();
  }, [projectId]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project_messages:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMsg]);
          
          // Check for @mentions and show notification
          processMessage(
            newMsg.content,
            newMsg.user_email.split('@')[0],
            newMsg.user_id,
            () => onToggle() // Open chat when notification clicked
          );
          
          // Increment unread if chat is closed
          if (!isOpen && newMsg.user_id !== user?.id) {
            setUnreadCount((prev) => prev + 1);
          }
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
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'project_messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as ChatMessage;
          setMessages((prev) => prev.map((m) => m.id === updatedMsg.id ? updatedMsg : m));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, isOpen, user?.id, processMessage, onToggle]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Clear unread when opening
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !pendingAttachment) || !user || !projectId) return;

    setIsLoading(true);
    const { error } = await supabase.from('project_messages').insert({
      project_id: projectId,
      user_id: user.id,
      user_email: user.email || 'Unknown',
      content: newMessage.trim(),
      attachment_url: pendingAttachment?.url || null,
      attachment_name: pendingAttachment?.name || null,
      attachment_type: pendingAttachment?.type || null,
      attachment_size: pendingAttachment?.size || null,
    });

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } else {
      setNewMessage('');
      setPendingAttachment(null);
    }
    setIsLoading(false);
    stopTyping();
  };

  const handleSubmit = () => {
    handleSendMessage();
  };

  // Handle input changes with typing indicator
  const handleInputChange = (value: string) => {
    setNewMessage(value);
    if (value.trim()) {
      startTyping();
    }
  };

  // Add reaction to message
  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    const currentReactions: Reaction[] = message.reactions || [];
    const existingReaction = currentReactions.find(r => r.emoji === emoji);
    
    let newReactions: Reaction[];
    if (existingReaction) {
      // Add user to existing reaction
      newReactions = currentReactions.map(r => 
        r.emoji === emoji
          ? { ...r, users: [...r.users, { id: user.id, email: user.email || '' }] }
          : r
      );
    } else {
      // Create new reaction
      newReactions = [...currentReactions, {
        emoji,
        users: [{ id: user.id, email: user.email || '' }]
      }];
    }
    
    const { error } = await supabase
      .from('project_messages')
      .update({ reactions: JSON.parse(JSON.stringify(newReactions)) })
      .eq('id', messageId);
    
    if (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  // Remove reaction from message
  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    const currentReactions: Reaction[] = message.reactions || [];
    const newReactions = currentReactions
      .map(r => {
        if (r.emoji === emoji) {
          return {
            ...r,
            users: r.users.filter(u => u.id !== user.id)
          };
        }
        return r;
      })
      .filter(r => r.users.length > 0);
    
    const { error } = await supabase
      .from('project_messages')
      .update({ reactions: JSON.parse(JSON.stringify(newReactions)) })
      .eq('id', messageId);
    
    if (error) {
      console.error('Error removing reaction:', error);
      toast.error('Failed to remove reaction');
    }
  };

  // Toggle notifications
  const handleToggleNotifications = async () => {
    if (!notificationsEnabled && !hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        toast.error('Notification permission denied');
        return;
      }
    }
    setNotificationsEnabled(!notificationsEnabled);
    toast.success(notificationsEnabled ? 'Notifications disabled' : 'Notifications enabled');
  };

  // Render message content with @mention highlighting
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(@\w+(?:\s\w+)?)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="bg-primary/20 text-primary rounded px-0.5 font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Group messages by sender for cleaner UI
  const groupedMessages = messages.reduce((acc, msg, index) => {
    const prevMsg = messages[index - 1];
    const isNewGroup = !prevMsg || prevMsg.user_id !== msg.user_id || 
      new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 300000; // 5 min gap
    
    if (isNewGroup) {
      acc.push([msg]);
    } else {
      acc[acc.length - 1].push(msg);
    }
    return acc;
  }, [] as ChatMessage[][]);

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        variant={isOpen ? 'secondary' : 'outline'}
        size="sm"
        className="relative"
        onClick={onToggle}
      >
        <MessageCircle className="h-4 w-4 mr-1" />
        Chat
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-80 h-[500px] bg-card border border-border rounded-lg shadow-lg flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Project Chat</span>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="iconSm" 
                    onClick={handleToggleNotifications}
                    className={notificationsEnabled ? '' : 'text-muted-foreground'}
                  >
                    {notificationsEnabled ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {notificationsEnabled ? 'Disable @mention notifications' : 'Enable @mention notifications'}
                </TooltipContent>
              </Tooltip>
              <Button variant="ghost" size="iconSm" onClick={onToggle}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
                <p>No messages yet</p>
                <p className="text-xs">Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedMessages.map((group, groupIndex) => {
                  const isOwnMessage = group[0].user_id === user?.id;
                  return (
                    <div
                      key={groupIndex}
                      className={cn('flex gap-2', isOwnMessage && 'flex-row-reverse')}
                    >
                      {!isOwnMessage && (
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback
                            className={cn(
                              'text-xs text-white',
                              getColorForUser(group[0].user_id)
                            )}
                          >
                            {getInitials(group[0].user_email)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn('flex flex-col gap-1', isOwnMessage && 'items-end')}>
                        {!isOwnMessage && (
                          <span className="text-xs text-muted-foreground ml-1">
                            {group[0].user_email.split('@')[0]}
                          </span>
                        )}
                        {group.map((msg) => (
                          <div key={msg.id} className="group relative">
                            <div
                              className={cn(
                                'px-3 py-2 rounded-lg text-sm max-w-[220px] break-words',
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              )}
                            >
                              {renderMessageContent(msg.content)}
                              {msg.attachment_url && msg.attachment_name && msg.attachment_type && (
                                <AttachmentDisplay
                                  url={msg.attachment_url}
                                  name={msg.attachment_name}
                                  type={msg.attachment_type}
                                  size={msg.attachment_size || 0}
                                />
                              )}
                            </div>
                            {/* Quick reaction picker on hover */}
                            <QuickReactionPicker
                              onSelect={(emoji) => handleAddReaction(msg.id, emoji)}
                              className={isOwnMessage ? 'left-0 right-auto' : 'right-0'}
                            />
                            {/* Reactions display */}
                            {msg.reactions && msg.reactions.length > 0 && (
                              <MessageReactions
                                reactions={msg.reactions}
                                currentUserId={user?.id}
                                onAddReaction={(emoji) => handleAddReaction(msg.id, emoji)}
                                onRemoveReaction={(emoji) => handleRemoveReaction(msg.id, emoji)}
                                isOwnMessage={isOwnMessage}
                              />
                            )}
                          </div>
                        ))}
                        <span className="text-[10px] text-muted-foreground ml-1">
                          {formatMessageTime(group[group.length - 1].created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Typing indicator */}
            <TypingIndicator
              typingUsers={typingUsers}
              currentUserId={user?.id}
            />
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t space-y-2">
            {/* Pending attachment preview */}
            {pendingAttachment && (
              <AttachmentPreview
                attachment={pendingAttachment}
                onRemove={() => setPendingAttachment(null)}
              />
            )}
            
            <div className="flex items-end gap-2">
              <ChatAttachmentButton
                onAttach={setPendingAttachment}
                disabled={isLoading || !user}
              />
              <div className="flex-1 border rounded-md bg-background">
                <MentionInput
                  value={newMessage}
                  onChange={handleInputChange}
                  onSubmit={handleSubmit}
                  placeholder="Type a message... Use @ to mention"
                  users={mockTeamMembers}
                  className="text-sm px-3 py-2"
                />
              </div>
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && !pendingAttachment) || isLoading || !user}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              @ to mention • Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
}
