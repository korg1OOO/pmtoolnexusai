import type { ReactNode } from 'react';

// Re-export existing types for convenience
export type { Reaction } from '@/components/chat/MessageReactions';
export type { ReadReceipt } from '@/components/chat/ReadReceipts';
export type { EditHistoryEntry } from '@/components/chat/MessageEditor';

/**
 * Unified chat message structure with all JSONB fields parsed
 */
export interface ChatMessage {
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
  is_pinned?: boolean;
  pinned_at?: string | null;
  pinned_by?: string | null;
  read_by?: ReadReceipt[] | null;
  reply_to?: string | null;
  edited_at?: string | null;
  edit_history?: EditHistoryEntry[] | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
}

/**
 * Pinned message display type
 */
export interface PinnedMessage {
  id: string;
  content: string;
  user_email: string;
  pinned_at: string;
  created_at: string;
}

/**
 * Attachment data structure
 */
export interface AttachmentData {
  url: string;
  name: string;
  type: string;
  size: number;
}

/**
 * User that can be mentioned in messages
 */
export interface MentionUser {
  id: string;
  name: string;
  role?: string;
  status?: 'online' | 'away' | 'offline';
}

/**
 * Raw database message type before parsing JSONB fields
 */
export interface DbMessage {
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
  reactions?: unknown;
  is_pinned?: boolean;
  pinned_at?: string | null;
  pinned_by?: string | null;
  read_by?: unknown;
  reply_to?: string | null;
  edited_at?: string | null;
  edit_history?: unknown;
  is_deleted?: boolean;
  deleted_at?: string | null;
}

// Import types for re-export
import type { Reaction } from '@/components/chat/MessageReactions';
import type { ReadReceipt } from '@/components/chat/ReadReceipts';
import type { EditHistoryEntry } from '@/components/chat/MessageEditor';
