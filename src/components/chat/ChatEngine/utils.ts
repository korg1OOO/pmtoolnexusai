import React, { type ReactNode } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import type { ChatMessage, DbMessage, Reaction, ReadReceipt, EditHistoryEntry } from './types';

/**
 * Get initials from email address for avatar display
 */
export function getInitials(email: string): string {
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Get a deterministic color class for a user based on their ID
 */
export function getColorForUser(userId: string): string {
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

/**
 * Format a message timestamp with relative time (Today, Yesterday, or date)
 */
export function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return format(date, 'HH:mm');
  } else if (isYesterday(date)) {
    return 'Yesterday ' + format(date, 'HH:mm');
  }
  return format(date, 'MMM d, HH:mm');
}

/**
 * Render @mentions with highlighted styling
 * Returns an array of ReactNodes with mentions highlighted
 */
export function renderMentions(content: string): ReactNode[] {
  const parts = content.split(/(@\w+(?:\s\w+)?)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return React.createElement(
        'span',
        {
          key: i,
          className: 'bg-primary/20 text-primary rounded px-0.5 font-medium',
        },
        part
      );
    }
    return part;
  });
}

/**
 * Parse JSONB fields from database message into typed ChatMessage
 */
export function parseMessageJsonFields(msg: DbMessage): ChatMessage {
  return {
    ...msg,
    reactions: Array.isArray(msg.reactions) ? (msg.reactions as Reaction[]) : [],
    read_by: Array.isArray(msg.read_by) ? (msg.read_by as ReadReceipt[]) : [],
    edit_history: Array.isArray(msg.edit_history) ? (msg.edit_history as EditHistoryEntry[]) : [],
  };
}

/**
 * Group messages by sender for compact display
 * Messages from the same sender within 5 minutes are grouped together
 */
export function groupMessagesBySender(messages: ChatMessage[]): ChatMessage[][] {
  return messages.reduce((acc, msg, index) => {
    const prevMsg = messages[index - 1];
    const isNewGroup =
      !prevMsg ||
      prevMsg.user_id !== msg.user_id ||
      new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 300000; // 5 minutes

    if (isNewGroup) {
      acc.push([msg]);
    } else {
      acc[acc.length - 1].push(msg);
    }
    return acc;
  }, [] as ChatMessage[][]);
}

/**
 * Filter out deleted messages but keep tombstone messages
 */
export function filterVisibleMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(
    (m) => !m.is_deleted || m.content === '[This message has been deleted]'
  );
}

/**
 * Get pinned messages sorted by pin date (most recent first)
 */
export function getPinnedMessages(
  messages: ChatMessage[]
): Array<{ id: string; content: string; user_email: string; pinned_at: string; created_at: string }> {
  return messages
    .filter(
      (m): m is ChatMessage & { is_pinned: true; pinned_at: string } =>
        m.is_pinned === true && !!m.pinned_at
    )
    .sort((a, b) => new Date(b.pinned_at).getTime() - new Date(a.pinned_at).getTime())
    .map((m) => ({
      id: m.id,
      content: m.content,
      user_email: m.user_email,
      pinned_at: m.pinned_at,
      created_at: m.created_at,
    }));
}

/**
 * Scroll to a specific message and highlight it temporarily
 */
export function scrollToMessage(
  messageId: string,
  refs: Map<string, HTMLDivElement>,
  highlightDuration = 2000
): void {
  const messageEl = refs.get(messageId);
  if (messageEl) {
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    messageEl.classList.add('bg-primary/10');
    setTimeout(() => messageEl.classList.remove('bg-primary/10'), highlightDuration);
  }
}
