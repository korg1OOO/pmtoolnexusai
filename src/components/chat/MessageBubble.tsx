import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  type ChatMessage,
  getInitials,
  getColorForUser,
  formatMessageTime,
  renderMentions,
} from '@/components/chat/ChatEngine';
import { MessageReactions, QuickReactionPicker } from '@/components/chat/MessageReactions';
import { ReadReceipts } from '@/components/chat/ReadReceipts';
import { ParentMessagePreview, ThreadIndicator, getReplyCount, getLastReplyTime, type ThreadMessage } from '@/components/chat/MessageThread';
import { MessageActionsMenu, InlineEditor, EditedIndicator } from '@/components/chat/MessageEditor';
import { AttachmentDisplay } from '@/components/chat/ChatAttachment';
import { PinMessageButton } from '@/components/chat/PinnedMessages';
import { ReplyButton } from '@/components/chat/MessageThread';
import { ForwardButton } from '@/components/chat/MessageForward';

export interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId?: string;
  variant: 'compact' | 'full';
  isEditing: boolean;
  parentMessage?: ChatMessage;
  allMessages: ChatMessage[];
  showAvatar?: boolean;
  showSender?: boolean;

  // Handlers
  onReply: () => void;
  onForward: () => void;
  onPin: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewHistory: () => void;
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  onJumpToMessage: (id: string) => void;
  onSaveEdit: (newContent: string) => void;
  onCancelEdit: () => void;
  /** Called when the user clicks the thread/replies count indicator */
  onOpenThread?: (messageId: string) => void;

  // Ref for scroll-to
  messageRef?: (el: HTMLDivElement | null) => void;
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

/**
 * Reusable message component with two display variants:
 * - compact: Bubble-style for ProjectChat overlay
 * - full: Row-based for TeamChatView full-page layout
 */
export function MessageBubble({
  message,
  currentUserId,
  variant,
  isEditing,
  parentMessage,
  allMessages,
  showAvatar = true,
  showSender = true,
  onReply,
  onForward,
  onPin,
  onEdit,
  onDelete,
  onViewHistory,
  onAddReaction,
  onRemoveReaction,
  onJumpToMessage,
  onSaveEdit,
  onCancelEdit,
  onOpenThread,
  messageRef,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const isOwnMessage = message.user_id === currentUserId;
  const isDeleted = message.is_deleted;

  // Convert to ThreadMessage array for reply count calculation
  const threadMessages = allMessages.map(toThreadMessage);
  const replyCount = getReplyCount(message.id, threadMessages);
  const lastReplyTime = getLastReplyTime(message.id, threadMessages);

  // Compact variant (ProjectChat)
  if (variant === 'compact') {
    return (
      <div
        ref={messageRef}
        className={cn(
          'group relative transition-colors rounded-lg',
          isOwnMessage ? 'ml-8' : 'mr-8'
        )}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Reply preview */}
        {parentMessage && (
          <ParentMessagePreview
            parentMessage={toThreadMessage(parentMessage)}
            onJumpToMessage={onJumpToMessage}
          />
        )}

        {/* Message content */}
        <div
          className={cn(
            'px-3 py-2 rounded-lg',
            isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted',
            isDeleted && 'opacity-60 italic'
          )}
        >
          {/* Sender name for first message in group */}
          {showSender && !isOwnMessage && (
            <div className="text-xs font-medium mb-1 opacity-80">
              {message.user_email.split('@')[0]}
            </div>
          )}

          {/* Edit mode */}
          {isEditing ? (
            <InlineEditor
              content={message.content}
              onSave={onSaveEdit}
              onCancel={onCancelEdit}
            />
          ) : (
            <>
              <div className="text-sm whitespace-pre-wrap break-words">
                {renderMentions(message.content)}
              </div>

              {/* Attachment */}
              {message.attachment_url && (
                <div className="mt-2">
                  <AttachmentDisplay
                    url={message.attachment_url}
                    name={message.attachment_name || 'File'}
                    type={message.attachment_type || 'application/octet-stream'}
                    size={message.attachment_size || 0}
                  />
                </div>
              )}
            </>
          )}

          {/* Time and edited indicator */}
          <div className="flex items-center gap-1 mt-1">
            <span className={cn('text-[10px]', isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
              {formatMessageTime(message.created_at)}
            </span>
            {message.edited_at && <EditedIndicator editedAt={message.edited_at} />}
            {message.is_pinned && (
              <span className="text-[10px] text-warning">📌</span>
            )}
          </div>
        </div>

        {/* Reactions */}
        {(message.reactions?.length ?? 0) > 0 && (
          <div className="mt-1">
            <MessageReactions
              reactions={message.reactions || []}
              currentUserId={currentUserId}
              onAddReaction={onAddReaction}
              onRemoveReaction={onRemoveReaction}
            />
          </div>
        )}

        {/* Thread indicator */}
        {replyCount > 0 && (
          <ThreadIndicator
            replyCount={replyCount}
            lastReplyTime={lastReplyTime}
            onClick={() => onOpenThread ? onOpenThread(message.id) : onReply()}
          />
        )}

        {/* Hover actions */}
        {showActions && !isDeleted && !isEditing && (
          <div
            className={cn(
              'absolute -top-3 flex items-center gap-0.5 bg-card border rounded-md shadow-sm p-0.5',
              isOwnMessage ? 'left-0' : 'right-0'
            )}
          >
            <QuickReactionPicker onSelect={onAddReaction} />
            <ReplyButton onReply={onReply} />
            <PinMessageButton isPinned={message.is_pinned || false} onTogglePin={onPin} />
            <ForwardButton onForward={onForward} />
            {isOwnMessage && (
              <MessageActionsMenu
                isOwnMessage={true}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewHistory={onViewHistory}
                hasEditHistory={(message.edit_history?.length ?? 0) > 0}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // Full variant (TeamChatView)
  return (
    <div
      ref={messageRef}
      className={cn(
        'group flex gap-3 px-4 py-2 hover:bg-muted/50 transition-colors relative',
        isDeleted && 'opacity-60'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {showAvatar ? (
        <Avatar className="h-9 w-9 mt-0.5 shrink-0">
          <AvatarFallback className={cn('text-xs text-white', getColorForUser(message.user_id))}>
            {getInitials(message.user_email)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-9 shrink-0" />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        {showSender && (
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-sm">
              {message.user_email.split('@')[0]}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatMessageTime(message.created_at)}
            </span>
            {message.edited_at && <EditedIndicator editedAt={message.edited_at} />}
            {message.is_pinned && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-xs text-warning">📌</span>
                  </TooltipTrigger>
                  <TooltipContent>Pinned message</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}

        {/* Reply preview */}
        {parentMessage && (
          <ParentMessagePreview
            parentMessage={toThreadMessage(parentMessage)}
            onJumpToMessage={onJumpToMessage}
          />
        )}

        {/* Message body */}
        {isEditing ? (
          <InlineEditor
            content={message.content}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
          />
        ) : (
          <div className={cn('text-sm whitespace-pre-wrap break-words', isDeleted && 'italic text-muted-foreground')}>
            {renderMentions(message.content)}
          </div>
        )}

        {/* Attachment */}
        {message.attachment_url && (
          <div className="mt-2 max-w-sm">
            <AttachmentDisplay
              url={message.attachment_url}
              name={message.attachment_name || 'File'}
              type={message.attachment_type || 'application/octet-stream'}
              size={message.attachment_size || 0}
            />
          </div>
        )}

        {/* Reactions */}
        {(message.reactions?.length ?? 0) > 0 && (
          <div className="mt-2">
            <MessageReactions
              reactions={message.reactions || []}
              currentUserId={currentUserId}
              onAddReaction={onAddReaction}
              onRemoveReaction={onRemoveReaction}
            />
          </div>
        )}

        {/* Thread indicator */}
        {replyCount > 0 && (
          <ThreadIndicator
            replyCount={replyCount}
            lastReplyTime={lastReplyTime}
            onClick={() => onOpenThread ? onOpenThread(message.id) : onReply()}
          />
        )}

        {/* Read receipts */}
        {isOwnMessage && (message.read_by?.length ?? 0) > 0 && (
          <div className="mt-1">
            <ReadReceipts receipts={message.read_by || []} isOwnMessage={true} />
          </div>
        )}
      </div>

      {/* Hover actions */}
      {showActions && !isDeleted && !isEditing && (
        <div className="absolute right-4 -mt-3 flex items-center gap-0.5 bg-card border rounded-md shadow-sm p-0.5">
          <QuickReactionPicker onSelect={onAddReaction} />
          <ReplyButton onReply={onReply} />
          <PinMessageButton isPinned={message.is_pinned || false} onTogglePin={onPin} />
          <ForwardButton onForward={onForward} />
          {isOwnMessage && (
            <MessageActionsMenu
              isOwnMessage={true}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewHistory={onViewHistory}
              hasEditHistory={(message.edit_history?.length ?? 0) > 0}
            />
          )}
        </div>
      )}
    </div>
  );
}
