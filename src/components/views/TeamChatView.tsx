import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Hash,
  Lock,
  Plus,
  Search,
  Send,
  Smile,
  MoreHorizontal,
  Video,
  Phone,
  Users,
  Pin,
  Star,
  Bell,
  BellOff,
  Settings,
  AtSign,
  Image,
  Mic,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Bookmark,
  Edit2,
  Trash2,
  Copy,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

// Chat Engine
import { useChatEngine } from '@/hooks/useChatEngine';
import { useChatPresence } from '@/hooks/useChatPresence';
import { useMentionNotifications } from '@/hooks/useMentionNotifications';
import {
  type ChatMessage,
  type AttachmentData,
  getInitials,
  getColorForUser,
  formatMessageTime,
  renderMentions,
} from '@/components/chat/ChatEngine';

// Chat Components
import { MentionInput } from '@/components/chat/MentionInput';
import { EmojiPicker, QuickReactionPicker } from '@/components/chat/EmojiPicker';
import { PinnedMessages } from '@/components/chat/PinnedMessages';
import { ReadReceipts } from '@/components/chat/ReadReceipts';
import { ReplyPreview, ReplyButton, ParentMessagePreview, ThreadIndicator, getReplyCount, getLastReplyTime, type ThreadMessage } from '@/components/chat/MessageThread';
import { MessageSearch, SearchToggle } from '@/components/chat/MessageSearch';
import { InlineEditor, DeleteConfirmDialog, EditHistoryDialog, EditedIndicator } from '@/components/chat/MessageEditor';
import { ForwardMessageDialog, ForwardButton } from '@/components/chat/MessageForward';
import { MessageReactions } from '@/components/chat/MessageReactions';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { ChatAttachmentButton, AttachmentPreview, AttachmentDisplay } from '@/components/chat/ChatAttachment';
import { PinMessageButton } from '@/components/chat/PinnedMessages';
import { useProjectContext } from '@/contexts/ProjectContext';

// Mock data for channels
const mockChannels = [
  { id: 'general', name: 'general', type: 'public' as const, unread: 3, pinned: true },
  { id: 'project-updates', name: 'project-updates', type: 'public' as const, unread: 0, pinned: true },
  { id: 'design-team', name: 'design-team', type: 'public' as const, unread: 0, pinned: false },
  { id: 'engineering', name: 'engineering', type: 'public' as const, unread: 0, pinned: false },
  { id: 'leadership', name: 'leadership', type: 'private' as const, unread: 0, pinned: false },
];

const mockDirectMessages = [
  { id: 'dm-1', name: 'Sarah Mitchell', status: 'online' as const, unread: 2 },
  { id: 'dm-2', name: 'John Doe', status: 'away' as const, unread: 0 },
  { id: 'dm-3', name: 'Emily Brown', status: 'offline' as const, unread: 0 },
];

const mockMembers = [
  { id: 'u-1', name: 'Sarah Mitchell', role: 'Project Manager', status: 'online' as const },
  { id: 'u-2', name: 'John Doe', role: 'Tech Lead', status: 'online' as const },
  { id: 'u-3', name: 'Emily Brown', role: 'Designer', status: 'away' as const },
  { id: 'u-4', name: 'Mike Johnson', role: 'DevOps Engineer', status: 'online' as const },
  { id: 'u-5', name: 'Jane Smith', role: 'Developer', status: 'offline' as const },
];

// Channel Sidebar Component
function ChannelSidebar({
  selectedChannel,
  onSelectChannel,
  selectedDM,
  onSelectDM,
}: {
  selectedChannel: string | null;
  onSelectChannel: (id: string) => void;
  selectedDM: string | null;
  onSelectDM: (id: string) => void;
}) {
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [dmsExpanded, setDmsExpanded] = useState(true);

  const pinnedChannels = mockChannels.filter((c) => c.pinned);
  const otherChannels = mockChannels.filter((c) => !c.pinned);

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Team Chat</h2>
          <Button variant="ghost" size="iconSm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search channels..." className="pl-8 h-8 text-sm bg-background" />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 py-1">
          {pinnedChannels.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1 px-2 py-1">
                <Star className="h-3 w-3 text-warning" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Pinned</span>
              </div>
              {pinnedChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => onSelectChannel(channel.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                    selectedChannel === channel.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {channel.type === 'private' ? <Lock className="h-3.5 w-3.5" /> : <Hash className="h-3.5 w-3.5" />}
                  <span className="flex-1 text-left truncate">{channel.name}</span>
                  {channel.unread > 0 && (
                    <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px]">
                      {channel.unread}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="mb-4">
            <button
              onClick={() => setChannelsExpanded(!channelsExpanded)}
              className="w-full flex items-center gap-1 px-2 py-1 hover:bg-muted rounded transition-colors"
            >
              {channelsExpanded ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
              <span className="text-xs font-medium text-muted-foreground uppercase">Channels</span>
              <Plus className="h-3 w-3 ml-auto text-muted-foreground hover:text-foreground" />
            </button>
            {channelsExpanded && (
              <div className="mt-1">
                {otherChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => onSelectChannel(channel.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                      selectedChannel === channel.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {channel.type === 'private' ? <Lock className="h-3.5 w-3.5" /> : <Hash className="h-3.5 w-3.5" />}
                    <span className="flex-1 text-left truncate">{channel.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setDmsExpanded(!dmsExpanded)}
              className="w-full flex items-center gap-1 px-2 py-1 hover:bg-muted rounded transition-colors"
            >
              {dmsExpanded ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
              <span className="text-xs font-medium text-muted-foreground uppercase">Direct Messages</span>
              <Plus className="h-3 w-3 ml-auto text-muted-foreground hover:text-foreground" />
            </button>
            {dmsExpanded && (
              <div className="mt-1">
                {mockDirectMessages.map((dm) => (
                  <button
                    key={dm.id}
                    onClick={() => onSelectDM(dm.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                      selectedDM === dm.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px]">
                          {dm.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background',
                          dm.status === 'online' && 'bg-success',
                          dm.status === 'away' && 'bg-warning',
                          dm.status === 'offline' && 'bg-muted-foreground'
                        )}
                      />
                    </div>
                    <span className="flex-1 text-left truncate">{dm.name}</span>
                    {dm.unread > 0 && (
                      <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px]">
                        {dm.unread}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// Members Sidebar Component
function MembersSidebar() {
  const onlineMembers = mockMembers.filter((m) => m.status === 'online');
  const awayMembers = mockMembers.filter((m) => m.status === 'away');
  const offlineMembers = mockMembers.filter((m) => m.status === 'offline');

  const renderMemberList = (members: typeof mockMembers, status: 'online' | 'away' | 'offline') => (
    <div className="mt-2 space-y-1">
      {members.map((member) => (
        <div
          key={member.id}
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors',
            status === 'offline' && 'opacity-60'
          )}
        >
          <div className="relative">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">
                {member.name.split(' ').map((n) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {status !== 'offline' && (
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card',
                  status === 'online' ? 'bg-success' : 'bg-warning'
                )}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{member.name}</p>
            <p className="text-xs text-muted-foreground truncate">{member.role}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-60 border-l bg-card flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          Members ({mockMembers.length})
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase px-2">
              Online — {onlineMembers.length}
            </span>
            {renderMemberList(onlineMembers, 'online')}
          </div>
          {awayMembers.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase px-2">
                Away — {awayMembers.length}
              </span>
              {renderMemberList(awayMembers, 'away')}
            </div>
          )}
          {offlineMembers.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase px-2">
                Offline — {offlineMembers.length}
              </span>
              {renderMemberList(offlineMembers, 'offline')}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Helper to convert ChatMessage to ThreadMessage
function toThreadMessage(msg: ChatMessage): ThreadMessage {
  return {
    id: msg.id,
    content: msg.content,
    user_id: msg.user_id,
    user_email: msg.user_email,
    created_at: msg.created_at,
    reply_to: msg.reply_to,
  };
}

// Main TeamChatView component
export function TeamChatView() {
  const { settings } = useProjectContext();
  const projectId = settings?.id || 'default-project';

  // UI State
  const [selectedChannel, setSelectedChannel] = useState<string | null>('general');
  const [selectedDM, setSelectedDM] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(true);
  const [message, setMessage] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<AttachmentData | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [viewingHistoryMessage, setViewingHistoryMessage] = useState<ChatMessage | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessage | null>(null);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Hooks
  const { typingUsers, startTyping, stopTyping } = useChatPresence(projectId);
  const { processMessage, requestPermission, hasPermission } = useMentionNotifications({
    enabled: notificationsEnabled,
  });

  // Chat Engine
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
    getParentMessage,
    jumpToMessage,
    currentUserId,
  } = useChatEngine({
    projectId,
    onNewMessage: (msg) => {
      processMessage(msg.content, msg.user_email.split('@')[0], msg.user_id, () => {});
    },
  });

  const currentChannel = selectedChannel ? mockChannels.find((c) => c.id === selectedChannel) : null;

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handlers
  const handleSend = async () => {
    const success = await sendMessage(message, pendingAttachment, replyingTo?.id);
    if (success) {
      setMessage('');
      setPendingAttachment(null);
      setReplyingTo(null);
      stopTyping();
    }
  };

  const handleInputChange = (value: string) => {
    setMessage(value);
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
    jumpToMessage(messageId, messageRefs.current);
  };

  const mentionableUsers = mockMembers.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    status: m.status,
  }));

  // Convert visible messages to thread messages for helper functions
  const threadMessages = visibleMessages.map(toThreadMessage);

  return (
    <div className="flex h-full">
      <ChannelSidebar
        selectedChannel={selectedChannel}
        onSelectChannel={(id) => {
          setSelectedChannel(id);
          setSelectedDM(null);
        }}
        selectedDM={selectedDM}
        onSelectDM={(id) => {
          setSelectedDM(id);
          setSelectedChannel(null);
        }}
      />

      <div className="flex-1 flex flex-col bg-background">
        {/* Channel Header */}
        <div className="h-14 border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {currentChannel && (
              <>
                {currentChannel.type === 'private' ? (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Hash className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-semibold">{currentChannel.name}</span>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-sm text-muted-foreground">Team discussion channel</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <SearchToggle onClick={() => setShowSearch(!showSearch)} className={showSearch ? 'bg-muted' : ''} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="iconSm">
                    <Video className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Start video call</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="iconSm">
                    <Phone className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Start audio call</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Separator orientation="vertical" className="h-4 mx-2" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={pinnedMessages.length > 0 ? 'secondary' : 'ghost'}
                    size="iconSm"
                    onClick={() => setShowPinnedMessages(!showPinnedMessages)}
                  >
                    <Pin className="h-4 w-4" />
                    {pinnedMessages.length > 0 && (
                      <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">
                        {pinnedMessages.length}
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Pinned messages</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
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
                <TooltipContent>{notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={showMembers ? 'secondary' : 'ghost'} size="iconSm" onClick={() => setShowMembers(!showMembers)}>
                    <Users className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle members</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <MessageSearch messages={visibleMessages} onJumpToMessage={handleJumpToMessage} onClose={() => setShowSearch(false)} />
        )}

        {/* Pinned Messages */}
        {showPinnedMessages && pinnedMessages.length > 0 && (
          <PinnedMessages
            messages={pinnedMessages}
            onUnpin={(id) => togglePin(id, true)}
            onJumpToMessage={handleJumpToMessage}
            canManagePins={!!currentUserId}
          />
        )}

        {/* Messages */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="py-4">
            {visibleMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 px-4 mb-4">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground font-medium">Today</span>
                  <Separator className="flex-1" />
                </div>

                {visibleMessages.map((msg) => {
                  const isOwnMessage = msg.user_id === currentUserId;
                  const parentMessage = getParentMessage(msg.reply_to);
                  const replyCount = getReplyCount(msg.id, threadMessages);
                  const lastReplyTime = getLastReplyTime(msg.id, threadMessages);
                  const isEditing = editingMessageId === msg.id;
                  const isDeleted = msg.is_deleted;

                  return (
                    <motion.div
                      key={msg.id}
                      ref={(el) => {
                        if (el) messageRefs.current.set(msg.id, el);
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn('group relative px-4 py-2 hover:bg-muted/30 transition-colors')}
                    >
                      {/* Parent message reference */}
                      {msg.reply_to && parentMessage && (
                        <div className="ml-11 mb-1">
                          <ParentMessagePreview parentMessage={toThreadMessage(parentMessage)} onJumpToMessage={handleJumpToMessage} />
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Avatar className="h-9 w-9 mt-1">
                          <AvatarFallback className={cn('text-sm text-white', getColorForUser(msg.user_id))}>
                            {getInitials(msg.user_email)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{msg.user_email.split('@')[0]}</span>
                            <span className="text-xs text-muted-foreground">{formatMessageTime(msg.created_at)}</span>
                            {msg.is_pinned && (
                              <Badge variant="secondary" className="text-[10px] h-4">
                                <Pin className="h-2 w-2 mr-1" />
                                Pinned
                              </Badge>
                            )}
                            {msg.edited_at && !isDeleted && <EditedIndicator editedAt={msg.edited_at} />}
                          </div>

                          {isEditing ? (
                            <div className="mt-1">
                              <InlineEditor
                                content={msg.content}
                                onSave={(newContent) => handleEditMessage(msg.id, newContent)}
                                onCancel={() => setEditingMessageId(null)}
                              />
                            </div>
                          ) : (
                            <div className={cn('text-sm mt-1 whitespace-pre-wrap', isDeleted && 'opacity-50 italic')}>
                              {renderMentions(msg.content)}
                            </div>
                          )}

                          {/* Attachment */}
                          {msg.attachment_url && msg.attachment_name && msg.attachment_type && !isDeleted && (
                            <div className="mt-2">
                              <AttachmentDisplay
                                url={msg.attachment_url}
                                name={msg.attachment_name}
                                type={msg.attachment_type}
                                size={msg.attachment_size || 0}
                              />
                            </div>
                          )}

                          {/* Reactions */}
                          {msg.reactions && msg.reactions.length > 0 && !isDeleted && (
                            <div className="mt-2">
                              <MessageReactions
                                reactions={msg.reactions}
                                currentUserId={currentUserId}
                                onAddReaction={(emoji) => addReaction(msg.id, emoji)}
                                onRemoveReaction={(emoji) => removeReaction(msg.id, emoji)}
                              />
                            </div>
                          )}

                          {/* Thread indicator */}
                          {replyCount > 0 && (
                            <ThreadIndicator
                              replyCount={replyCount}
                              lastReplyTime={lastReplyTime}
                              onClick={() => {
                                const firstReply = visibleMessages.find((m) => m.reply_to === msg.id);
                                if (firstReply) handleJumpToMessage(firstReply.id);
                              }}
                            />
                          )}

                          {/* Read receipts */}
                          <ReadReceipts receipts={msg.read_by || []} isOwnMessage={isOwnMessage} />
                        </div>

                        {/* Quick Actions */}
                        <AnimatePresence>
                          {!isEditing && !isDeleted && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute -top-3 right-4 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-card border rounded-lg shadow-md p-1"
                            >
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="iconXs">
                                    <Smile className="h-3 w-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border-0 bg-transparent shadow-none" align="end">
                                  <QuickReactionPicker
                                    onSelect={(emoji) => addReaction(msg.id, emoji)}
                                    existingReactions={msg.reactions?.map((r) => r.emoji) || []}
                                  />
                                </PopoverContent>
                              </Popover>
                              <ReplyButton onReply={() => setReplyingTo(msg)} />
                              <ForwardButton onForward={() => setForwardingMessage(msg)} />
                              <PinMessageButton isPinned={msg.is_pinned || false} onTogglePin={() => togglePin(msg.id, msg.is_pinned || false)} />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="iconXs">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {isOwnMessage && (
                                    <DropdownMenuItem onClick={() => setEditingMessageId(msg.id)}>
                                      <Edit2 className="h-3 w-3 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(msg.content)}>
                                    <Copy className="h-3 w-3 mr-2" />
                                    Copy
                                  </DropdownMenuItem>
                                  {(msg.edit_history || []).length > 0 && (
                                    <DropdownMenuItem onClick={() => setViewingHistoryMessage(msg)}>
                                      <History className="h-3 w-3 mr-2" />
                                      View edits
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem>
                                    <Bookmark className="h-3 w-3 mr-2" />
                                    Save
                                  </DropdownMenuItem>
                                  {isOwnMessage && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive" onClick={() => setDeletingMessageId(msg.id)}>
                                        <Trash2 className="h-3 w-3 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </>
            )}
            <TypingIndicator typingUsers={typingUsers} currentUserId={currentUserId} />
          </div>
        </ScrollArea>

        {/* Compose Area */}
        <div className="p-4 border-t">
          {replyingTo && <ReplyPreview replyingTo={toThreadMessage(replyingTo)} onCancel={() => setReplyingTo(null)} />}
          {pendingAttachment && <AttachmentPreview attachment={pendingAttachment} onRemove={() => setPendingAttachment(null)} />}

          <div className="relative bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 p-2 border-b">
              <ChatAttachmentButton onAttach={setPendingAttachment} disabled={isLoading || !currentUserId} />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="iconXs">
                      <Image className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Upload image</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="iconXs">
                      <AtSign className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Mention someone</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="iconXs">
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-0" align="start">
                  <EmojiPicker onSelect={(emoji) => setMessage((prev) => prev + emoji)} onClose={() => {}} />
                </PopoverContent>
              </Popover>
            </div>
            <MentionInput
              value={message}
              onChange={handleInputChange}
              onSubmit={handleSend}
              placeholder={`Message #${currentChannel?.name || 'channel'}`}
              users={mentionableUsers}
              className="px-3 py-2"
            />
            <div className="flex items-center justify-between p-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="iconXs">
                      <Mic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Record audio</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button size="sm" onClick={handleSend} disabled={(!message.trim() && !pendingAttachment) || isSending || !currentUserId}>
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd> to send,{' '}
            <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">Shift + Enter</kbd> for new line •{' '}
            <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">@</kbd> to mention
          </p>
        </div>
      </div>

      {showMembers && <MembersSidebar />}

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
    </div>
  );
}
