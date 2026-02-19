/**
 * ThreadPanel — side-sheet that displays a message thread and lets users reply
 */
import React, { useState } from 'react';
import { X, Send, MessageSquare, CornerDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { ChatMessage } from '@/components/chat/ChatEngine';
import { getInitials, getColorForUser } from '@/components/chat/ChatEngine';

interface ThreadPanelProps {
    /** The parent message whose thread is displayed */
    parentMessage: ChatMessage | null;
    /** All messages in the channel — panel will filter to replies of parentMessage */
    allMessages: ChatMessage[];
    /** Currently authenticated user id */
    currentUserId: string;
    /** Whether sending is in progress */
    isSending: boolean;
    /** Called when the user submits a new reply */
    onSendReply: (content: string, replyToId: string) => void;
    /** Called to close the panel */
    onClose: () => void;
}

export function ThreadPanel({
    parentMessage,
    allMessages,
    currentUserId,
    isSending,
    onSendReply,
    onClose,
}: ThreadPanelProps) {
    const [replyContent, setReplyContent] = useState('');

    if (!parentMessage) return null;

    const replies = allMessages
        .filter((m) => m.reply_to === parentMessage.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const handleSend = () => {
        const text = replyContent.trim();
        if (!text) return;
        onSendReply(text, parentMessage.id);
        setReplyContent('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full border-l bg-background shadow-xl w-80 shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Thread</span>
                    {replies.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                        </span>
                    )}
                </div>
                <Button variant="ghost" size="iconSm" onClick={onClose} className="h-7 w-7">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1 px-4 py-3">
                {/* Parent message */}
                <ParentBubble message={parentMessage} currentUserId={currentUserId} />

                {/* Divider */}
                {replies.length > 0 && (
                    <div className="flex items-center gap-2 my-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                        </span>
                        <div className="h-px flex-1 bg-border" />
                    </div>
                )}

                {/* Replies */}
                <div className="space-y-3">
                    {replies.map((reply) => (
                        <ReplyBubble key={reply.id} message={reply} currentUserId={currentUserId} />
                    ))}
                    {replies.length === 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                            <CornerDownRight className="h-3 w-3 shrink-0" />
                            <span>No replies yet. Be the first!</span>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Reply compose */}
            <div className="px-4 py-3 border-t space-y-2">
                <Textarea
                    placeholder="Reply in thread…"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={3}
                    className="resize-none text-sm"
                    disabled={isSending}
                />
                <div className="flex justify-end">
                    <Button
                        size="sm"
                        onClick={handleSend}
                        disabled={!replyContent.trim() || isSending}
                    >
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        Reply
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface BubbleProps {
    message: ChatMessage;
    currentUserId: string;
}

function ParentBubble({ message, currentUserId }: BubbleProps) {
    const isOwn = message.user_id === currentUserId;
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                    <AvatarFallback
                        className={cn('text-[10px] text-white', getColorForUser(message.user_id))}
                    >
                        {getInitials(message.user_email)}
                    </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">
                    {isOwn ? 'You' : message.user_email.split('@')[0]}
                </span>
                <span className="text-[10px] text-muted-foreground">
                    {format(new Date(message.created_at), 'MMM d, HH:mm')}
                </span>
            </div>
            <div className="ml-8 text-sm bg-muted rounded-lg px-3 py-2 leading-relaxed">
                {message.content}
            </div>
        </div>
    );
}

function ReplyBubble({ message, currentUserId }: BubbleProps) {
    const isOwn = message.user_id === currentUserId;
    return (
        <div className={cn('flex gap-2', isOwn && 'flex-row-reverse')}>
            <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback
                    className={cn('text-[10px] text-white', getColorForUser(message.user_id))}
                >
                    {getInitials(message.user_email)}
                </AvatarFallback>
            </Avatar>
            <div className={cn('space-y-0.5', isOwn && 'items-end flex flex-col')}>
                <span className="text-[10px] text-muted-foreground">
                    {isOwn ? 'You' : message.user_email.split('@')[0]} ·{' '}
                    {format(new Date(message.created_at), 'HH:mm')}
                </span>
                <div
                    className={cn(
                        'text-sm rounded-lg px-3 py-2 max-w-[220px] leading-relaxed',
                        isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                >
                    {message.content}
                </div>
            </div>
        </div>
    );
}
