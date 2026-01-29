import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TypingUser {
  id: string;
  email: string;
  displayName?: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  currentUserId?: string;
  className?: string;
}

export function TypingIndicator({ typingUsers, currentUserId, className }: TypingIndicatorProps) {
  // Filter out current user
  const othersTyping = typingUsers.filter(u => u.id !== currentUserId);
  
  if (othersTyping.length === 0) return null;
  
  const getDisplayText = () => {
    const names = othersTyping.map(u => u.displayName || u.email.split('@')[0]);
    
    if (names.length === 1) {
      return `${names[0]} is typing`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing`;
    } else {
      return `${names[0]} and ${names.length - 1} others are typing`;
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        className={cn('flex items-center gap-2 text-xs text-muted-foreground px-3 py-1', className)}
      >
        <div className="flex gap-0.5">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
            className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
          />
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
            className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
          />
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
            className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
          />
        </div>
        <span>{getDisplayText()}</span>
      </motion.div>
    </AnimatePresence>
  );
}
