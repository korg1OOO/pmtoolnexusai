

# Chat Components Consolidation Plan

## Overview

This plan consolidates **ProjectChat.tsx** (622 lines) and **TeamChatView.tsx** (933 lines) into a shared architecture, eliminating approximately **400+ lines of duplicated code** while preserving the distinct UI patterns for each use case.

---

## Problem Analysis

Both components contain nearly identical implementations for:

| Duplicated Logic | ProjectChat.tsx | TeamChatView.tsx |
|------------------|-----------------|------------------|
| Message fetching from Supabase | Lines 121-147 | Lines 364-391 |
| Realtime subscription setup | Lines 150-199 | Lines 394-424 |
| Send message handler | Lines 235-261 | Lines 434-459 |
| Toggle pin handler | Lines 268-285 | Lines 466-476 |
| Edit message handler | Lines 287-313 | Lines 478-493 |
| Delete message handler | Lines 315-331 | Lines 495-504 |
| Forward message handler | Lines 333-359 | Lines 506-527 |
| Add/remove reaction handlers | Lines 361-394 | Lines 529-560 |
| Jump to message | Lines 408-415 | Lines 562-569 |
| Toggle notifications | Lines 396-406 | Lines 571-578 |
| Parse reactions/read_by JSONB | Lines 137-143 | Lines 379-385 |
| Render @mentions | Lines 417-425 | Lines 593-601 |
| Get pinned messages | Lines 427-431 | Lines 581-584 |
| Filter visible messages | Line 432 | Line 586 |

**UI Differences (to be preserved):**
- **ProjectChat**: Floating overlay widget (320x500px), compact bubble-style messages, grouped by sender
- **TeamChatView**: Full-page layout with channel sidebar, member list, framer-motion animations, individual message rows

---

## Solution Architecture

```text
src/hooks/
  useChatEngine.ts          <- NEW: Core chat logic (fetch, send, CRUD, reactions)
  useChatPresence.ts        <- EXISTING: Typing indicators
  useMentionNotifications.ts <- EXISTING: Push notifications
  useProjectChat.ts         <- DELETE: Already replaced by inline logic

src/components/chat/
  ChatEngine/
    types.ts                <- NEW: Shared ChatMessage interface and types
    utils.ts                <- NEW: Shared utilities (getInitials, getColorForUser, formatMessageTime)
  MessageBubble.tsx         <- NEW: Reusable message with reactions, threading, edit state
  ComposeArea.tsx           <- NEW: Shared input area with mentions, attachments, reply preview

src/components/collaboration/
  ProjectChat.tsx           <- REFACTORED: Uses useChatEngine + compact UI wrapper

src/components/views/
  TeamChatView.tsx          <- REFACTORED: Uses useChatEngine + full-page UI wrapper
```

---

## Implementation Steps

### Phase 1: Create Shared Types and Utilities

**1.1 Create `src/components/chat/ChatEngine/types.ts`**

Define shared interfaces extracted from both components:
- `ChatMessage` - unified message structure with all JSONB fields
- `Reaction` - emoji reaction with user array
- `ReadReceipt` - read receipt with userId/timestamp
- `EditHistoryEntry` - edit history tracking
- `PinnedMessage` - pinned message display type

**1.2 Create `src/components/chat/ChatEngine/utils.ts`**

Extract shared utility functions:
- `getInitials(email: string): string` - avatar initials from email
- `getColorForUser(userId: string): string` - deterministic color from user ID
- `formatMessageTime(dateStr: string): string` - relative time formatting (Today, Yesterday, date)
- `renderMentions(content: string): ReactNode` - @mention highlighting
- `parseMessageJsonFields(msg: DbMessage): ChatMessage` - JSONB parsing for reactions/read_by/edit_history

---

### Phase 2: Create the useChatEngine Hook

**2.1 Create `src/hooks/useChatEngine.ts`**

A comprehensive hook that encapsulates all chat business logic:

```typescript
interface UseChatEngineOptions {
  projectId: string | null;
  onNewMessage?: (msg: ChatMessage) => void;
}

interface UseChatEngineReturn {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  
  // Derived data
  pinnedMessages: PinnedMessage[];
  visibleMessages: ChatMessage[];
  
  // Message CRUD
  sendMessage: (content: string, attachment?: AttachmentData, replyTo?: string) => Promise<boolean>;
  editMessage: (messageId: string, newContent: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  forwardMessage: (msg: ChatMessage, targetProjectId: string, additionalText?: string) => Promise<boolean>;
  
  // Features
  togglePin: (messageId: string, currentPinned: boolean) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  updateReadReceipts: (messageId: string) => Promise<void>;
  
  // Helpers
  getParentMessage: (replyToId: string | null) => ChatMessage | undefined;
  jumpToMessage: (messageId: string, refs: Map<string, HTMLDivElement>) => void;
}
```

**Implementation details:**
- Fetch messages from `project_messages` table on mount
- Subscribe to Supabase Realtime for INSERT/UPDATE/DELETE events
- Parse JSONB fields (reactions, read_by, edit_history) consistently
- Handle optimistic updates where appropriate
- Clean up subscription on unmount
- Integrate with `useChatPresence` and `useMentionNotifications` internally or allow external composition

---

### Phase 3: Create Reusable Message Components

**3.1 Create `src/components/chat/MessageBubble.tsx`**

A flexible message component that adapts to different layouts:

```typescript
interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId?: string;
  variant: 'compact' | 'full';  // compact = ProjectChat, full = TeamChatView
  isEditing: boolean;
  parentMessage?: ChatMessage;
  replyCount: number;
  lastReplyTime?: string;
  
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
  
  // Ref for scroll-to
  messageRef?: (el: HTMLDivElement | null) => void;
}
```

**Variants:**
- `compact`: Bubble-style with colored backgrounds, grouped sender display
- `full`: Row-based with avatar, timestamp inline, framer-motion animations

**3.2 Create `src/components/chat/ComposeArea.tsx`**

Unified message composition component:

```typescript
interface ComposeAreaProps {
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
  channelName?: string;  // For placeholder in TeamChatView
  isLoading: boolean;
  disabled: boolean;
}
```

---

### Phase 4: Refactor ProjectChat.tsx

**4.1 Update `src/components/collaboration/ProjectChat.tsx`**

Reduce from ~622 lines to ~200 lines:

1. Import and use `useChatEngine` for all data/logic
2. Import and use `MessageBubble` with `variant="compact"`
3. Import and use `ComposeArea` with `variant="compact"`
4. Keep only:
   - Floating overlay positioning/toggle logic
   - Message grouping by sender (UI-specific)
   - Unread count badge management
   - Compact layout styling

---

### Phase 5: Refactor TeamChatView.tsx

**5.1 Update `src/components/views/TeamChatView.tsx`**

Reduce from ~933 lines to ~450 lines:

1. Import and use `useChatEngine` for all data/logic
2. Import and use `MessageBubble` with `variant="full"`
3. Import and use `ComposeArea` with `variant="full"`
4. Keep only:
   - `ChannelSidebar` component (UI-specific, currently mock data)
   - `MembersSidebar` component (UI-specific, currently mock data)
   - Full-page layout with header toolbar
   - Framer-motion animation wrapper around message list
   - Date separator ("Today") rendering

---

### Phase 6: Cleanup

**6.1 Delete deprecated file**
- Remove `src/hooks/useProjectChat.ts` (no longer used, logic moved to useChatEngine)

**6.2 Update imports**
- Ensure all chat-related imports point to the new shared modules

---

## File Changes Summary

| Action | File | Est. Lines |
|--------|------|------------|
| CREATE | `src/components/chat/ChatEngine/types.ts` | ~60 |
| CREATE | `src/components/chat/ChatEngine/utils.ts` | ~80 |
| CREATE | `src/hooks/useChatEngine.ts` | ~250 |
| CREATE | `src/components/chat/MessageBubble.tsx` | ~200 |
| CREATE | `src/components/chat/ComposeArea.tsx` | ~120 |
| REFACTOR | `src/components/collaboration/ProjectChat.tsx` | 622 -> ~200 |
| REFACTOR | `src/components/views/TeamChatView.tsx` | 933 -> ~450 |
| DELETE | `src/hooks/useProjectChat.ts` | -102 |

**Net reduction: ~555 lines** (1,555 current -> ~1,000 after refactor)

---

## Technical Notes

1. **Supabase Realtime**: Both components subscribe to the same `project_messages` table. The hook will create one subscription per `projectId`, preventing duplicate listeners.

2. **Type Safety**: The shared types ensure consistent handling of JSONB fields (`reactions`, `read_by`, `edit_history`) across all consumers.

3. **Backward Compatibility**: Both UI components will behave identically to current implementations - this is purely an internal refactor.

4. **Future Extensions**: The `useChatEngine` hook can easily support:
   - Channel-based filtering (for real channel implementation)
   - Direct messages (by filtering on user pairs)
   - Message search at the engine level
   - Pagination/infinite scroll

