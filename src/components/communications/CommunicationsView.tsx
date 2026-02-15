import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Mail,
  Inbox,
  Send,
  FileText,
  Trash2,
  Star,
  Search,
  Filter,
  RefreshCw,
  Plus,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Tag,
  Paperclip,
  Clock,
  User,
  MessageSquare,
  Bell,
  List,
  Layers,
  Activity,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useEmailAccounts } from '@/hooks/useEmailAccounts';
import { useEmails, Email, EmailThread, EmailFolder } from '@/hooks/useEmails';
import { useProjectContext } from '@/contexts/ProjectContext';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { EmailComposeDialog } from './EmailComposeDialog';

type ViewMode = 'inbox' | 'threads' | 'unified';

function formatEmailDate(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) {
    return format(date, 'h:mm a');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMM d');
}

// Folder Icon Component
function FolderIcon({ type }: { type: string }) {
  const icons: Record<string, React.ElementType> = {
    inbox: Inbox,
    sent: Send,
    drafts: FileText,
    trash: Trash2,
    spam: Mail,
    archive: Archive,
    custom: Tag,
  };
  const Icon = icons[type] || Mail;
  return <Icon className="h-4 w-4" />;
}

// Email List Item Component
function EmailListItem({
  email,
  isSelected,
  onSelect,
  onClick,
  onToggleStar,
}: {
  email: Email;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onClick: () => void;
  onToggleStar: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 p-3 cursor-pointer border-b transition-colors',
        !email.is_read && 'bg-primary/5 font-medium',
        isSelected && 'bg-muted'
      )}
    >
      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar();
          }}
          className="text-muted-foreground hover:text-warning"
        >
          <Star
            className={cn('h-4 w-4', email.is_starred && 'fill-warning text-warning')}
          />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={cn('text-sm truncate', !email.is_read && 'font-semibold')}>
            {email.from_name || email.from_address}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatEmailDate(email.received_at)}
          </span>
        </div>
        <div className={cn('text-sm truncate', !email.is_read && 'text-foreground')}>
          {email.subject || '(No subject)'}
        </div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          {email.snippet || email.body_text?.slice(0, 100)}
        </div>
        {email.has_attachments && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Paperclip className="h-3 w-3" />
            Attachments
          </div>
        )}
      </div>
    </div>
  );
}

// Thread List Item Component
function ThreadListItem({
  thread,
  isSelected,
  onClick,
}: {
  thread: EmailThread;
  isSelected: boolean;
  onClick: () => void;
}) {
  const hasUnread = thread.unread_count > 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 p-3 cursor-pointer border-b transition-colors',
        hasUnread && 'bg-primary/5',
        isSelected && 'bg-muted'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn('text-sm truncate', hasUnread && 'font-semibold')}>
              {thread.participants.slice(0, 2).join(', ')}
              {thread.participants.length > 2 && ` +${thread.participants.length - 2}`}
            </span>
            {thread.emails.length > 1 && (
              <Badge variant="secondary" className="text-xs shrink-0">
                {thread.emails.length}
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatEmailDate(thread.last_email_at)}
          </span>
        </div>
        <div className={cn('text-sm truncate', hasUnread && 'font-medium')}>
          {thread.subject}
        </div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          {thread.emails[thread.emails.length - 1].snippet ||
            thread.emails[thread.emails.length - 1].body_text?.slice(0, 100)}
        </div>
        {hasUnread && (
          <Badge className="mt-1 text-xs">{thread.unread_count} new</Badge>
        )}
      </div>
    </div>
  );
}

// Email Detail View Component
function EmailDetailView({
  email,
  onClose,
  onReply,
  onForward,
  onDelete,
}: {
  email: Email | null;
  onClose: () => void;
  onReply: () => void;
  onForward: () => void;
  onDelete: () => void;
}) {
  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Select an email to read</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Email Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className="text-lg font-semibold">{email.subject || '(No subject)'}</h2>
          <div className="flex items-center gap-1 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onReply}>
                  <Reply className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reply</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <ReplyAll className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reply All</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onForward}>
                  <Forward className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Forward</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Tag className="h-4 w-4 mr-2" />
                  Add Label
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {(email.from_name || email.from_address).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{email.from_name || email.from_address}</span>
              <span className="text-sm text-muted-foreground">&lt;{email.from_address}&gt;</span>
            </div>
            <div className="text-sm text-muted-foreground">
              To: {email.to_addresses.map((t) => t.name || t.email).join(', ')}
              {email.cc_addresses.length > 0 && (
                <span> • CC: {email.cc_addresses.map((c) => c.name || c.email).join(', ')}</span>
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground shrink-0">
            {email.sent_at && format(new Date(email.sent_at), 'MMM d, yyyy h:mm a')}
          </div>
        </div>

        {email.has_attachments && email.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
            {email.attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm"
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span className="truncate max-w-[150px]">{att.name}</span>
                <span className="text-muted-foreground">
                  ({Math.round(att.size / 1024)}KB)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Email Body */}
      <ScrollArea className="flex-1 p-4">
        {email.body_html ? (
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: email.body_html }}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm">
            {email.body_text}
          </pre>
        )}
      </ScrollArea>
    </div>
  );
}

// Main Communications View
export default function CommunicationsView() {
  const navigate = useNavigate();
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const { accounts, isLoading: accountsLoading, syncAccount } = useEmailAccounts(projectId);
  const accountIds = useMemo(() => accounts.map((a) => a.id), [accounts]);
  const {
    emails,
    folders,
    threads,
    selectedFolderId,
    setSelectedFolderId,
    isLoading: emailsLoading,
    unreadCount,
    markAsRead,
    toggleStar,
    deleteEmail,
  } = useEmails(accountIds);

  const [viewMode, setViewMode] = useState<ViewMode>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [composeContext, setComposeContext] = useState<{
    mode: 'new' | 'reply' | 'forward';
    email?: Email;
  }>({ mode: 'new' });

  const selectedEmail = emails.find((e) => e.id === selectedEmailId) || null;
  const isLoading = accountsLoading || emailsLoading;

  // Filter emails by search
  const filteredEmails = useMemo(() => {
    if (!searchQuery) return emails;
    const query = searchQuery.toLowerCase();
    return emails.filter(
      (e) =>
        e.subject?.toLowerCase().includes(query) ||
        e.from_address.toLowerCase().includes(query) ||
        e.from_name?.toLowerCase().includes(query) ||
        e.body_text?.toLowerCase().includes(query)
    );
  }, [emails, searchQuery]);

  const handleEmailClick = async (email: Email) => {
    setSelectedEmailId(email.id);
    if (!email.is_read) {
      await markAsRead(email.id);
    }
  };

  const handleReply = () => {
    if (selectedEmail) {
      setComposeContext({ mode: 'reply', email: selectedEmail });
      setShowComposeDialog(true);
    }
  };

  const handleForward = () => {
    if (selectedEmail) {
      setComposeContext({ mode: 'forward', email: selectedEmail });
      setShowComposeDialog(true);
    }
  };

  const handleSyncAll = () => {
    accounts.forEach((a) => syncAccount(a.id));
  };

  if (accounts.length === 0 && !accountsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Mail className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Email Accounts Connected</h2>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          Connect your email accounts in Settings to start viewing and managing your communications.
        </p>
        <Button onClick={() => navigate('/settings')}>
          <Settings className="h-4 w-4 mr-2" />
          Go to Settings
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col shrink-0">
        <div className="p-4 border-b">
          <Button className="w-full" onClick={() => {
            setComposeContext({ mode: 'new' });
            setShowComposeDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Compose
          </Button>
        </div>

        {/* View Mode Tabs */}
        <div className="p-2 border-b">
          <div className="flex rounded-lg bg-muted p-1">
            <button
              onClick={() => setViewMode('inbox')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors',
                viewMode === 'inbox'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
            <button
              onClick={() => setViewMode('threads')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors',
                viewMode === 'threads'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              Threads
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors',
                viewMode === 'unified'
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Activity className="h-3.5 w-3.5" />
              Feed
            </button>
          </div>
        </div>

        {/* Folders */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                  selectedFolderId === folder.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                )}
              >
                <FolderIcon type={folder.folder_type} />
                <span className="flex-1 text-left">{folder.name}</span>
                {folder.unread_count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {folder.unread_count}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          <Separator className="my-2" />

          {/* Accounts List */}
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
              Accounts
            </div>
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-2 px-3 py-2 text-sm"
              >
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="truncate">{account.email_address}</span>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Sync Button */}
        <div className="p-2 border-t space-y-1">
          <Button variant="ghost" size="sm" className="w-full" onClick={handleSyncAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => navigate('/communication-intelligence')}
          >
            <Settings className="h-4 w-4 mr-2" />
            AI Intelligence
          </Button>
        </div>
      </div>

      {/* Email List */}
      <div className="w-96 border-r flex flex-col shrink-0">
        {/* Search & Actions */}
        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {selectedEmailIds.size > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{selectedEmailIds.size} selected</span>
              <Button variant="ghost" size="sm">
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Email List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : viewMode === 'threads' ? (
            threads.map((thread) => (
              <ThreadListItem
                key={thread.thread_id}
                thread={thread}
                isSelected={thread.emails.some((e) => e.id === selectedEmailId)}
                onClick={() => handleEmailClick(thread.emails[thread.emails.length - 1])}
              />
            ))
          ) : (
            filteredEmails.map((email) => (
              <EmailListItem
                key={email.id}
                email={email}
                isSelected={selectedEmailIds.has(email.id)}
                onSelect={(checked) => {
                  const newSelected = new Set(selectedEmailIds);
                  if (checked) {
                    newSelected.add(email.id);
                  } else {
                    newSelected.delete(email.id);
                  }
                  setSelectedEmailIds(newSelected);
                }}
                onClick={() => handleEmailClick(email)}
                onToggleStar={() => toggleStar(email.id)}
              />
            ))
          )}
        </ScrollArea>
      </div>

      {/* Email Detail */}
      <EmailDetailView
        email={selectedEmail}
        onClose={() => setSelectedEmailId(null)}
        onReply={handleReply}
        onForward={handleForward}
        onDelete={() => {
          if (selectedEmail) {
            deleteEmail(selectedEmail.id);
            setSelectedEmailId(null);
          }
        }}
      />

      {/* Compose Dialog */}
      <EmailComposeDialog
        open={showComposeDialog}
        onOpenChange={setShowComposeDialog}
        mode={composeContext.mode}
        replyToEmail={composeContext.email}
        accounts={accounts}
      />
    </div>
  );
}
