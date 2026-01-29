import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Minimize2,
  Maximize2,
  Send,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useChatEngine } from '@/hooks/useChatEngine';
import { useProjectContext } from '@/contexts/ProjectContext';
import {
  formatMessageTime,
  getInitials,
  getColorForUser,
} from '@/components/chat/ChatEngine';

interface MiniChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onExpand: () => void;
}

export function MiniChatWindow({ isOpen, onClose, onExpand }: MiniChatWindowProps) {
  const { settings } = useProjectContext();
  const projectId = settings?.id || 'default-project';
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    isSending,
    sendMessage,
    visibleMessages,
    currentUserId,
  } = useChatEngine({
    projectId,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    const success = await sendMessage(message, null, null);
    if (success) {
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get last 20 messages for display
  const displayMessages = visibleMessages.slice(-20);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 right-4 w-80 h-[450px] bg-background border rounded-lg shadow-xl z-50 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Team Chat</span>
              {messages.length > 0 && (
                <Badge variant="secondary" className="text-xs h-5">
                  {messages.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onExpand}
                title="Expand to full view"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onClose}
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : displayMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground/70">
                  Start chatting with your team
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayMessages.map((msg) => {
                  const isOwn = msg.user_id === currentUserId;
                  const userColor = getColorForUser(msg.user_email);

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex gap-2',
                        isOwn ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      {!isOwn && (
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarFallback
                            className={cn('text-[10px] text-white', userColor)}
                          >
                            {getInitials(msg.user_email)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          'max-w-[80%] rounded-lg px-3 py-1.5 text-sm',
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        {!isOwn && (
                          <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
                            {msg.user_email.split('@')[0]}
                          </p>
                        )}
                        <p className="break-words">{msg.content}</p>
                        <p
                          className={cn(
                            'text-[9px] mt-0.5',
                            isOwn
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          )}
                        >
                          {formatMessageTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-2">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="text-sm h-9"
                disabled={isSending}
              />
              <Button
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={handleSend}
                disabled={!message.trim() || isSending}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
