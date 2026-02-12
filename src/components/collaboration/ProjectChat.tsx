import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MessageCircle, X, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

import { useChatEngine } from '@/hooks/useChatEngine';
import { useChatPresence } from '@/hooks/useChatPresence';
import { useMentionNotifications } from '@/hooks/useMentionNotifications';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import {
  type ChatMessage,
  type AttachmentData,
  getInitials,
  getColorForUser,
  formatMessageTime,
  groupMessagesBySender,
} from '@/components/chat/ChatEngine';

// Chat Components
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ComposeArea } from '@/components/chat/ComposeArea';
import { PinnedMessages } from '@/components/chat/PinnedMessages';
import { MessageSearch, SearchToggle } from '@/components/chat/MessageSearch';
import { DeleteConfirmDialog, EditHistoryDialog } from '@/components/chat/MessageEditor';
import { ForwardMessageDialog } from '@/components/chat/MessageForward';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

// Mock data removed - now using live team members from database

interface ProjectChatProps {
  projectId: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function ProjectChat({ projectId, isOpen, onToggle }: ProjectChatProps) {
  // Local UI state
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingAttachment, setPendingAttachment] = useState<AttachmentData | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [viewingHistoryMessage, setViewingHistoryMessage] = useState<ChatMessage | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessage | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Fetch live team members for mentions
  const { data: teamMembers = [], isLoading: loadingTeam } = useTeamMembers(projectId);

  // Map team members to mentionable format
  const mentionableUsers = teamMembers.map(member => ({
    id: member.id,
    name: member.full_name || member.email || 'Unknown',
    role: member.role || 'Team Member',
    status: 'online' as const, // Could be extended with real presence data
  }));

  // Chat presence (typing indicators)
  const { typingUsers, startTyping, stopTyping } = useChatPresence(projectId);

  // Mention notifications
  const { processMessage, requestPermission, hasPermission } = useMentionNotifications({
    enabled: notificationsEnabled,
  });

  // Core chat engine
  const {
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
    markAllAsRead,
    getParentMessage,
    jumpToMessage,
    currentUserId,
  } = useChatEngine({
    projectId,
    onNewMessage: (msg) => {
      processMessage(msg.content, msg.user_email.split('@')[0], msg.user_id, onToggle);
      if (!isOpen && msg.user_id !== currentUserId) {
        setUnreadCount((prev) => prev + 1);
      }
    },
  });

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when opening
  useEffect(() => {
    if (isOpen && currentUserId) {
      setUnreadCount(0);
      markAllAsRead();
    }
  }, [isOpen, currentUserId, markAllAsRead]);

  // Handlers
  const handleSendMessage = async () => {
    const success = await sendMessage(newMessage, pendingAttachment, replyingTo?.id);
    if (success) {
      setNewMessage('');
      setPendingAttachment(null);
      setReplyingTo(null);
      stopTyping();
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    if (value.trim()) startTyping();
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    const success = await editMessage(messageId, newContent);
    if (success) {
      setEditingMessageId(null);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const success = await deleteMessage(messageId);
    if (success) {
      setDeletingMessageId(null);
    }
  };

  const handleForwardMessage = async (targetProjectId: string, additionalText?: string) => {
    if (!forwardingMessage) return;
    const success = await forwardMessage(forwardingMessage, targetProjectId, additionalText);
    if (success) {
      setForwardingMessage(null);
    }
  };

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

  const handleJumpToMessage = (messageId: string) => {
    jumpToMessage(messageId);
  };

  // Group messages by sender for compact display
  const groupedMessages = groupMessagesBySender(visibleMessages);

  return (
    <>
      {/* Toggle Button */}
      <Button variant={isOpen ? 'secondary' : 'outline'} size="sm" className="relative" onClick={onToggle}>
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
              <SearchToggle onClick={() => setShowSearch(!showSearch)} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={handleToggleNotifications}
                    className={notificationsEnabled ? '' : 'text-muted-foreground'}
                  >
                    {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
                </TooltipContent>
              </Tooltip>
              <Button variant="ghost" size="iconSm" onClick={onToggle}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          {showSearch && (
            <MessageSearch
              messages={visibleMessages}
              onJumpToMessage={handleJumpToMessage}
              onClose={() => setShowSearch(false)}
            />
          )}

          {/* Pinned Messages */}
          <PinnedMessages
            messages={pinnedMessages}
            onUnpin={(id) => togglePin(id, true)}
            onJumpToMessage={handleJumpToMessage}
            canManagePins={!!currentUserId}
          />

          {/* Messages */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef}>
            {visibleMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
                <p>No messages yet</p>
                <p className="text-xs">Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedMessages.map((group, groupIndex) => {
                  const isOwnGroup = group[0].user_id === currentUserId;
                  return (
                    <div key={groupIndex} className={cn('flex gap-2', isOwnGroup && 'flex-row-reverse')}>
                      {!isOwnGroup && (
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className={cn('text-xs text-white', getColorForUser(group[0].user_id))}>
                            {getInitials(group[0].user_email)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn('flex flex-col gap-1 max-w-[220px]', isOwnGroup && 'items-end')}>
                        {!isOwnGroup && (
                          <span className="text-xs text-muted-foreground ml-1">
                            {group[0].user_email.split('@')[0]}
                          </span>
                        )}
                        {group.map((msg, msgIndex) => (
                          <MessageBubble
                            key={msg.id}
                            message={msg}
                            currentUserId={currentUserId}
                            variant="compact"
                            isEditing={editingMessageId === msg.id}
                            parentMessage={getParentMessage(msg.reply_to)}
                            allMessages={messages}
                            showAvatar={false}
                            showSender={false}
                            onReply={() => setReplyingTo(msg)}
                            onForward={() => setForwardingMessage(msg)}
                            onPin={() => togglePin(msg.id, msg.is_pinned || false)}
                            onEdit={() => setEditingMessageId(msg.id)}
                            onDelete={() => setDeletingMessageId(msg.id)}
                            onViewHistory={() => setViewingHistoryMessage(msg)}
                            onAddReaction={(emoji) => addReaction(msg.id, emoji)}
                            onRemoveReaction={(emoji) => removeReaction(msg.id, emoji)}
                            onJumpToMessage={handleJumpToMessage}
                            onSaveEdit={(content) => handleEditMessage(msg.id, content)}
                            onCancelEdit={() => setEditingMessageId(null)}
                            messageRef={(el) => {
                              if (el) messageRefs.current.set(msg.id, el);
                            }}
                          />
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
            <TypingIndicator typingUsers={typingUsers} currentUserId={currentUserId} />
          </ScrollArea>

          {/* Compose Area */}
          <ComposeArea
            value={newMessage}
            onChange={handleInputChange}
            onSubmit={handleSendMessage}
            onTyping={startTyping}
            variant="compact"
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            pendingAttachment={pendingAttachment}
            onAttach={setPendingAttachment}
            onRemoveAttachment={() => setPendingAttachment(null)}
            mentionableUsers={mentionableUsers}
            typingUsers={typingUsers}
            currentUserId={currentUserId}
            isLoading={isSending}
            disabled={!currentUserId}
          />
        </div>
      )}

      {/* Dialogs */}
      <DeleteConfirmDialog
        isOpen={!!deletingMessageId}
        onClose={() => setDeletingMessageId(null)}
        onConfirm={() => deletingMessageId && handleDeleteMessage(deletingMessageId)}
      />

      {viewingHistoryMessage && (
        <EditHistoryDialog
          isOpen={!!viewingHistoryMessage}
          onClose={() => setViewingHistoryMessage(null)}
          history={viewingHistoryMessage.edit_history || []}
          currentContent={viewingHistoryMessage.content}
        />
      )}

      <ForwardMessageDialog
        isOpen={!!forwardingMessage}
        onClose={() => setForwardingMessage(null)}
        message={forwardingMessage}
        currentProjectId={projectId}
        currentUserId={currentUserId || ''}
        currentUserEmail={''}
        onForward={handleForwardMessage}
      />
    </>
  );
}
