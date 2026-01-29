import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PresenceUser } from '@/hooks/usePresence';

interface CollaboratorCursorsProps {
  users: PresenceUser[];
  containerRef: React.RefObject<HTMLDivElement>;
}

export function CollaboratorCursors({ users, containerRef }: CollaboratorCursorsProps) {
  // Filter users that have cursor positions
  const usersWithCursors = users.filter((u) => u.cursorPosition);

  if (usersWithCursors.length === 0) return null;

  return (
    <AnimatePresence>
      {usersWithCursors.map((user) => (
        <motion.div
          key={user.id}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.15 }}
          className="fixed pointer-events-none z-50"
          style={{
            left: user.cursorPosition!.x,
            top: user.cursorPosition!.y,
          }}
        >
          {/* Cursor Arrow */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="drop-shadow-md"
            style={{
              transform: 'rotate(-12deg)',
            }}
          >
            <path
              d="M5.65376 12.4563L5.65376 12.4563L11.5306 21.5714L12.5 23.1428L12.5 21.2857L12.5 14.2857L19.5 14.2857L21.0714 14.2857L19.8571 13.0714L5.65376 12.4563Z"
              fill={user.color}
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>

          {/* User Label */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-4 top-4 px-2 py-1 rounded-md text-xs font-medium text-white whitespace-nowrap shadow-lg"
            style={{ backgroundColor: user.color }}
          >
            {user.displayName}
            {user.isEditing && (
              <span className="ml-1 text-[10px] opacity-80">• editing</span>
            )}
          </motion.div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
