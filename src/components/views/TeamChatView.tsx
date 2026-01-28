import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Hash,
  Lock,
  Plus,
  Search,
  Send,
  Paperclip,
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
  File,
  Mic,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Reply,
  ThumbsUp,
  Heart,
  Bookmark,
  Edit2,
  Trash2,
  Copy,
  Forward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// Mock data for channels and messages
const mockChannels = [
  { id: 'ch-1', name: 'general', type: 'public' as const, unread: 3, pinned: true },
  { id: 'ch-2', name: 'project-updates', type: 'public' as const, unread: 0, pinned: true },
  { id: 'ch-3', name: 'design-team', type: 'public' as const, unread: 12, pinned: false },
  { id: 'ch-4', name: 'engineering', type: 'public' as const, unread: 0, pinned: false },
  { id: 'ch-5', name: 'leadership', type: 'private' as const, unread: 1, pinned: false },
  { id: 'ch-6', name: 'random', type: 'public' as const, unread: 0, pinned: false },
];

const mockDirectMessages = [
  { id: 'dm-1', name: 'Sarah Mitchell', avatar: null, status: 'online' as const, unread: 2 },
  { id: 'dm-2', name: 'John Doe', avatar: null, status: 'away' as const, unread: 0 },
  { id: 'dm-3', name: 'Emily Brown', avatar: null, status: 'offline' as const, unread: 0 },
  { id: 'dm-4', name: 'Mike Johnson', avatar: null, status: 'online' as const, unread: 5 },
];

const mockMessages = [
  {
    id: 'm-1',
    author: 'Sarah Mitchell',
    avatar: null,
    content: 'Good morning team! 👋 Just wanted to share the updated project timeline. We\'re on track for the Q4 launch.',
    timestamp: '9:00 AM',
    reactions: [{ emoji: '👍', count: 4 }, { emoji: '🎉', count: 2 }],
    isPinned: true,
    replies: 3,
  },
  {
    id: 'm-2',
    author: 'John Doe',
    avatar: null,
    content: 'Great news! I\'ve completed the API integration for the payment module. Ready for review.',
    timestamp: '9:15 AM',
    reactions: [{ emoji: '🚀', count: 3 }],
    isPinned: false,
    replies: 0,
  },
  {
    id: 'm-3',
    author: 'Emily Brown',
    avatar: null,
    content: 'Quick update on the design system:\n\n• Updated color tokens\n• New button variants\n• Icon library expanded\n\nAll changes are now live in Figma.',
    timestamp: '9:32 AM',
    reactions: [{ emoji: '💜', count: 5 }, { emoji: '👀', count: 2 }],
    isPinned: false,
    replies: 7,
  },
  {
    id: 'm-4',
    author: 'Mike Johnson',
    avatar: null,
    content: '@channel Reminder: Sprint review meeting at 3 PM today. Please have your demos ready.',
    timestamp: '10:45 AM',
    reactions: [{ emoji: '✅', count: 8 }],
    isPinned: false,
    replies: 2,
    isMention: true,
  },
  {
    id: 'm-5',
    author: 'Sarah Mitchell',
    avatar: null,
    content: 'Here\'s the architecture diagram for the new microservices setup:',
    timestamp: '11:00 AM',
    reactions: [],
    isPinned: false,
    replies: 0,
    hasAttachment: {
      type: 'image',
      name: 'architecture-v2.png',
    },
  },
];

const mockMembers = [
  { id: 'u-1', name: 'Sarah Mitchell', role: 'Project Manager', status: 'online' as const },
  { id: 'u-2', name: 'John Doe', role: 'Tech Lead', status: 'online' as const },
  { id: 'u-3', name: 'Emily Brown', role: 'Designer', status: 'away' as const },
  { id: 'u-4', name: 'Mike Johnson', role: 'DevOps Engineer', status: 'online' as const },
  { id: 'u-5', name: 'Jane Smith', role: 'Developer', status: 'offline' as const },
  { id: 'u-6', name: 'David Wilson', role: 'Developer', status: 'online' as const },
];

interface MessageItemProps {
  message: typeof mockMessages[0];
}

function MessageItem({ message }: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group relative px-4 py-2 hover:bg-muted/30 transition-colors',
        message.isMention && 'bg-warning/5 border-l-2 border-warning'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Quick Actions Bar */}
      {showActions && (
        <div className="absolute -top-4 right-4 flex items-center gap-1 bg-card border rounded-lg shadow-lg p-1 z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="iconXs">
                  <Smile className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add reaction</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="iconXs">
                  <Reply className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reply in thread</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="iconXs">
                  <Bookmark className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save message</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="iconXs">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem><Edit2 className="h-3 w-3 mr-2" />Edit message</DropdownMenuItem>
              <DropdownMenuItem><Copy className="h-3 w-3 mr-2" />Copy text</DropdownMenuItem>
              <DropdownMenuItem><Forward className="h-3 w-3 mr-2" />Forward</DropdownMenuItem>
              <DropdownMenuItem><Pin className="h-3 w-3 mr-2" />Pin to channel</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive"><Trash2 className="h-3 w-3 mr-2" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="flex gap-3">
        <Avatar className="h-9 w-9 mt-1">
          <AvatarFallback className="bg-primary/20 text-primary text-sm">
            {message.author.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{message.author}</span>
            <span className="text-xs text-muted-foreground">{message.timestamp}</span>
            {message.isPinned && (
              <Badge variant="secondary" className="text-[10px] h-4">
                <Pin className="h-2 w-2 mr-1" />
                Pinned
              </Badge>
            )}
          </div>

          <div className="text-sm mt-1 whitespace-pre-wrap">{message.content}</div>

          {/* Attachment */}
          {message.hasAttachment && (
            <div className="mt-2 p-3 bg-muted/50 rounded-lg border inline-flex items-center gap-2 cursor-pointer hover:bg-muted transition-colors">
              {message.hasAttachment.type === 'image' ? (
                <Image className="h-4 w-4 text-muted-foreground" />
              ) : (
                <File className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">{message.hasAttachment.name}</span>
            </div>
          )}

          {/* Reactions */}
          {message.reactions.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              {message.reactions.map((reaction, i) => (
                <button
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm"
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-xs text-muted-foreground">{reaction.count}</span>
                </button>
              ))}
              <button className="inline-flex items-center justify-center h-6 w-6 rounded-full hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
                <Smile className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Thread Replies */}
          {message.replies > 0 && (
            <button className="flex items-center gap-2 mt-2 text-primary hover:underline text-sm">
              <MessageSquare className="h-3 w-3" />
              {message.replies} {message.replies === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

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

  const pinnedChannels = mockChannels.filter(c => c.pinned);
  const otherChannels = mockChannels.filter(c => !c.pinned);

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col h-full">
      {/* Team Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">ProjectOye Team</h2>
          <Button variant="ghost" size="iconSm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-8 h-8 text-sm bg-background"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 py-1">
          {/* Pinned Channels */}
          {pinnedChannels.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1 px-2 py-1">
                <Star className="h-3 w-3 text-warning" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Pinned</span>
              </div>
              {pinnedChannels.map(channel => (
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
                  {channel.type === 'private' ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : (
                    <Hash className="h-3.5 w-3.5" />
                  )}
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

          {/* Channels */}
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
                {otherChannels.map(channel => (
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
                    {channel.type === 'private' ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <Hash className="h-3.5 w-3.5" />
                    )}
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
          </div>

          {/* Direct Messages */}
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
                {mockDirectMessages.map(dm => (
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
                          {dm.name.split(' ').map(n => n[0]).join('')}
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

function MembersSidebar() {
  const onlineMembers = mockMembers.filter(m => m.status === 'online');
  const awayMembers = mockMembers.filter(m => m.status === 'away');
  const offlineMembers = mockMembers.filter(m => m.status === 'offline');

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
          {/* Online */}
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase px-2">
              Online — {onlineMembers.length}
            </span>
            <div className="mt-2 space-y-1">
              {onlineMembers.map(member => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Away */}
          {awayMembers.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase px-2">
                Away — {awayMembers.length}
              </span>
              <div className="mt-2 space-y-1">
                {awayMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-warning border-2 border-card" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offline */}
          {offlineMembers.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase px-2">
                Offline — {offlineMembers.length}
              </span>
              <div className="mt-2 space-y-1">
                {offlineMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors opacity-60"
                  >
                    <div className="relative">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function TeamChatView() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>('ch-1');
  const [selectedDM, setSelectedDM] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showMembers, setShowMembers] = useState(true);

  const currentChannel = selectedChannel
    ? mockChannels.find(c => c.id === selectedChannel)
    : null;

  const handleSend = () => {
    if (message.trim()) {
      // In a real app, send the message
      setMessage('');
    }
  };

  return (
    <div className="flex h-full">
      {/* Channel Sidebar */}
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

      {/* Main Chat Area */}
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
                <span className="text-sm text-muted-foreground">Project discussion channel</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
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
                  <Button variant="ghost" size="iconSm">
                    <Pin className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Pinned messages</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showMembers ? 'secondary' : 'ghost'}
                    size="iconSm"
                    onClick={() => setShowMembers(!showMembers)}
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle members</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="py-4">
            {/* Date Separator */}
            <div className="flex items-center gap-4 px-4 mb-4">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground font-medium">Today</span>
              <Separator className="flex-1" />
            </div>

            {mockMessages.map(msg => (
              <MessageItem key={msg.id} message={msg} />
            ))}
          </div>
        </ScrollArea>

        {/* Compose Area */}
        <div className="p-4 border-t">
          <div className="relative bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 p-2 border-b">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="iconXs">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attach file</TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="iconXs">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add emoji</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Message #${currentChannel?.name || 'channel'}`}
              className="min-h-[60px] border-0 bg-transparent resize-none focus-visible:ring-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-1">
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
              </div>
              <Button size="sm" onClick={handleSend} disabled={!message.trim()}>
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd> to send,{' '}
            <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">Shift + Enter</kbd> for new line
          </p>
        </div>
      </div>

      {/* Members Sidebar */}
      {showMembers && <MembersSidebar />}
    </div>
  );
}
