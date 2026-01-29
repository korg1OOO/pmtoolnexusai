import React, { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MentionInput } from '@/components/chat/MentionInput';
import { ChatAttachmentButton, AttachmentPreview, type AttachmentData } from '@/components/chat/ChatAttachment';
import { ReplyPreview, type ThreadMessage } from '@/components/chat/MessageThread';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import type { ChatMessage, MentionUser } from '@/components/chat/ChatEngine';

export interface ComposeAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onTyping: () => void;
  variant: 'compact' | 'full';

  // Optional features
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
  pendingAttachment?: AttachmentData | null;
  onAttach?: (attachment: AttachmentData) => void;
  onRemoveAttachment?: () => void;

  mentionableUsers: MentionUser[];
  channelName?: string;
  typingUsers?: Array<{ id: string; email: string; displayName?: string }>;
  currentUserId?: string;
  isLoading: boolean;
  disabled: boolean;
}

// Helper to convert ChatMessage to ThreadMessage for ReplyPreview
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
 * Unified message composition component used by both chat variants
 */
export function ComposeArea({
  value,
  onChange,
  onSubmit,
  onTyping,
  variant,
  replyingTo,
  onCancelReply,
  pendingAttachment,
  onAttach,
  onRemoveAttachment,
  mentionableUsers,
  channelName,
  typingUsers = [],
  currentUserId,
  isLoading,
  disabled,
}: ComposeAreaProps) {
  const handleInputChange = (val: string) => {
    onChange(val);
    if (val.trim()) {
      onTyping();
    }
  };

  const placeholder = channelName
    ? `Message #${channelName}`
    : 'Type a message...';

  const filteredTypingUsers = typingUsers.filter((u) => u.id !== currentUserId);

  // Convert MentionUser to the format expected by MentionInput
  const mentionUsers = mentionableUsers.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    status: u.status,
  }));

  // Compact variant (ProjectChat)
  if (variant === 'compact') {
    return (
      <div className="border-t p-2 space-y-2">
        {/* Typing indicator */}
        {filteredTypingUsers.length > 0 && (
          <TypingIndicator typingUsers={filteredTypingUsers} currentUserId={currentUserId} />
        )}

        {/* Reply preview */}
        {replyingTo && onCancelReply && (
          <ReplyPreview
            replyingTo={toThreadMessage(replyingTo)}
            onCancel={onCancelReply}
          />
        )}

        {/* Attachment preview */}
        {pendingAttachment && onRemoveAttachment && (
          <AttachmentPreview
            attachment={pendingAttachment}
            onRemove={onRemoveAttachment}
          />
        )}

        {/* Input area */}
        <div className="flex items-end gap-1">
          {onAttach && (
            <ChatAttachmentButton onAttach={onAttach} disabled={disabled} />
          )}
          <div className="flex-1 border rounded-md px-2 py-1 bg-background">
            <MentionInput
              value={value}
              onChange={handleInputChange}
              onSubmit={onSubmit}
              placeholder={placeholder}
              users={mentionUsers}
              className="min-h-[36px] max-h-[100px] text-sm"
            />
          </div>
          <Button
            size="iconSm"
            onClick={onSubmit}
            disabled={(!value.trim() && !pendingAttachment) || isLoading || disabled}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Full variant (TeamChatView)
  return (
    <div className="border-t p-4 space-y-2">
      {/* Typing indicator */}
      {filteredTypingUsers.length > 0 && (
        <TypingIndicator typingUsers={filteredTypingUsers} currentUserId={currentUserId} />
      )}

      {/* Reply preview */}
      {replyingTo && onCancelReply && (
        <ReplyPreview
          replyingTo={toThreadMessage(replyingTo)}
          onCancel={onCancelReply}
        />
      )}

      {/* Attachment preview */}
      {pendingAttachment && onRemoveAttachment && (
        <AttachmentPreview
          attachment={pendingAttachment}
          onRemove={onRemoveAttachment}
        />
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        {onAttach && (
          <ChatAttachmentButton onAttach={onAttach} disabled={disabled} />
        )}
        <div className="flex-1 border rounded-md px-3 py-2 bg-background">
          <MentionInput
            value={value}
            onChange={handleInputChange}
            onSubmit={onSubmit}
            placeholder={placeholder}
            users={mentionUsers}
            className="min-h-[44px] max-h-[200px]"
          />
        </div>
        <Button
          onClick={onSubmit}
          disabled={(!value.trim() && !pendingAttachment) || isLoading || disabled}
          className="h-11"
        >
          <Send className="h-4 w-4 mr-2" />
          Send
        </Button>
      </div>
    </div>
  );
}
