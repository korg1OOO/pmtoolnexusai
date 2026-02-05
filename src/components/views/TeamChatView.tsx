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
  Loader2,
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
import { useChatChannels, useCreateChannel, type ChatChannel } from '@/hooks/useChatChannels';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Mock data (Keep for Members sidebar until we wire user list from project members)
const mockMembers = [
  { id: 'u-1', name: 'Sarah Mitchell', role: 'Project Manager', status: 'online' as const },
  { id: 'u-2', name: 'John Doe', role: 'Tech Lead', status: 'online' as const },
  { id: 'u-3', name: 'Emily Brown', role: 'Designer', status: 'away' as const },
  { id: 'u-4', name: 'Mike Johnson', role: 'DevOps Engineer', status: 'online' as const },
  { id: 'u-5', name: 'Jane Smith', role: 'Developer', status: 'offline' as const },
];

// Create Channel Dialog
function CreateChannelDialog({ projectId, onOpenChange }: { projectId: string; onOpenChange: (open: boolean) => void }) {
  const createChannel = useCreateChannel();
  const [name, setName] = useState('');
  const [type, setType] = useState<'public' | 'private'>('public');

  const handleCreate = () => {
    if (!name) return;
    createChannel.mutate({ projectId, name, type }, {
      onSuccess: () => {
        onOpenChange(false);
        setName('');
      }
    });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Channel</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Channel Name</label>
          <Input placeholder="# e.g. marketing" value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Privacy</label>
          <div className="flex gap-4">
            <Button variant={type === 'public' ? 'secondary' : 'outline'} onClick={() => setType('public')} className="w-1/2">
              <Hash className="mr-2 h-4 w-4" /> Public
            </Button>
            <Button variant={type === 'private' ? 'secondary' : 'outline'} onClick={() => setType('private')} className="w-1/2">
              <Lock className="mr-2 h-4 w-4" /> Private
            </Button>
          </div>
        </div>
        <Button onClick={handleCreate} disabled={createChannel.isPending} className="w-full">
          {createChannel.isPending ? 'Creating...' : 'Create Channel'}
        </Button>
      </div>
    </DialogContent>
  )
}

// Channel Sidebar Component
function ChannelSidebar({
  projectId,
  selectedChannel,
  onSelectChannel,
}: {
  projectId: string;
  selectedChannel: string | null;
  onSelectChannel: (id: string | null) => void;
}) {
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const { data: channels, isLoading } = useChatChannels(projectId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Fallback if no channels exist at all - UI hint
  // Real implementation would handle empty state gracefully

  const publicChannels = channels?.filter(c => c.type === 'public') || [];
  const privateChannels = channels?.filter(c => c.type === 'private') || [];

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
          {isLoading ? (
            <div className="p-4 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="mb-4">
              <div className="flex items-center justify-between group px-2 py-1">
                <button
                  onClick={() => setChannelsExpanded(!channelsExpanded)}
                  className="flex items-center gap-1 hover:text-foreground text-muted-foreground transition-colors"
                >
                  {channelsExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <span className="text-xs font-medium uppercase">Channels</span>
                </button>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Plus className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer" />
                  </DialogTrigger>
                  <CreateChannelDialog projectId={projectId} onOpenChange={setIsCreateOpen} />
                </Dialog>
              </div>

              {channelsExpanded && (
                <div className="mt-1 space-y-0.5">
                  {publicChannels.length === 0 && <p className="px-4 py-2 text-xs text-muted-foreground">No channels yet.</p>}
                  {publicChannels.map((channel) => (
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
                      <Hash className="h-3.5 w-3.5" />
                      <span className="flex-1 text-left truncate">{channel.name}</span>
                    </button>
                  ))}
                  {privateChannels.map((channel) => (
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
                      <Lock className="h-3.5 w-3.5" />
                      <span className="flex-1 text-left truncate">{channel.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Members Sidebar Component (Mocked for now)
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
  const projectId = settings?.id;

  // UI State
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
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

  // Fetch channels to set default
  const { data: channels } = useChatChannels(projectId || '');

  useEffect(() => {
    if (!selectedChannelId && channels && channels.length > 0) {
      // Default to first public channel or first channel
      const general = channels.find(c => c.name === 'general') || channels[0];
      setSelectedChannelId(general.id);
    }
  }, [channels, selectedChannelId]);

  const currentChannel = channels?.find(c => c.id === selectedChannelId);

  // Hooks
  const { typingUsers, startTyping, stopTyping } = useChatPresence(projectId || '');
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
    projectId: projectId || null,
    channelId: selectedChannelId, // Pass selected channel ID
    onNewMessage: (msg) => {
      processMessage(msg.content, msg.user_email.split('@')[0], msg.user_id, () => { });
    },
  });

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedChannelId]); // Scroll on new messages OR channel switch

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

  // ... (Keep existing handlers for forward, notifications etc)
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

  // Thread conversion
  const threadMessages = visibleMessages.map(toThreadMessage);

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Please select a project to view chat.
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <ChannelSidebar
        projectId={projectId}
        selectedChannel={selectedChannelId}
        onSelectChannel={setSelectedChannelId}
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
                <span className="text-sm text-muted-foreground">
                  {currentChannel.type === 'private' ? 'Private Group' : 'Team discussion'}
                </span>
              </>
            )}
            {!currentChannel && <span className="font-semibold text-muted-foreground">Select a channel</span>}
          </div>
          {/* Header Actions */}
          <div className="flex items-center gap-1">
            {/* ... Keep existing helper buttons ... */}
            <SearchToggle onClick={() => setShowSearch(!showSearch)} className={showSearch ? 'bg-muted' : ''} />
            <Button variant={showMembers ? 'secondary' : 'ghost'} size="iconSm" onClick={() => setShowMembers(!showMembers)}>
              <Users className="h-4 w-4" />
            </Button>
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
            {isLoading ? (
              <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : visibleMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">Start the conversation in #{currentChannel?.name || 'this channel'}!</p>
              </div>
            ) : (
              <>
                {/* Divider */}
                <div className="flex items-center gap-4 px-4 mb-4">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground font-medium">Messages</span>
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
                      {/* Message Content Layout - Keeping same as original */}
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
                              {/* Assuming renderMentions uses @name logic which works without ID mapping if backend saves text, otherwise assumes names are correct */}
                              {renderMentions(msg.content)}
                            </div>
                          )}

                          {/* Attachment */}
                          {msg.attachment_url && msg.attachment_name && msg.attachment_type && !isDeleted && (
                            <div className="mt-2">
                              {/* Assuming AttachmentDisplay handles visual rendering */}
                              <div className="text-xs border p-2 rounded max-w-xs bg-muted">
                                {msg.attachment_name} ({Math.round((msg.attachment_size || 0) / 1024)}KB)
                              </div>
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

                          {/* Read receipts (Simplified logic in hook) */}
                        </div>

                        {/* Action Buttons Overlay */}
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

        {/* Compose Area - Wired Input */}
        <div className="p-4 border-t">
          {replyingTo && <ReplyPreview replyingTo={toThreadMessage(replyingTo)} onCancel={() => setReplyingTo(null)} />}
          {pendingAttachment && <AttachmentPreview attachment={pendingAttachment} onRemove={() => setPendingAttachment(null)} />}

          <div className="relative bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 p-2 border-b">
              {/* Attachment Button Logic */}
              <ChatAttachmentButton onAttach={setPendingAttachment} disabled={isLoading || !currentUserId} />
              <Separator orientation="vertical" className="h-4" />
              <Button variant="ghost" size="iconSm">
                <AtSign className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="iconSm">
                <Smile className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <div className="flex items-center gap-2 p-2">
              <Input
                value={message}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={currentChannel ? `Message #${currentChannel.name}` : "Select a channel"}
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
                disabled={!currentChannel}
              />
              <Button onClick={handleSend} disabled={!message.trim() && !pendingAttachment} size="icon" className="h-8 w-8 ml-auto">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showMembers && <MembersSidebar />}
    </div>
  );
}
