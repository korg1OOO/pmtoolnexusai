/**
 * RemoteCursor Component
 * Display other users' cursors
 */

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { CursorPosition } from '@/types/collaboration';

interface RemoteCursorProps {
    cursor: CursorPosition;
}

export function RemoteCursor({ cursor }: RemoteCursorProps) {
    return (
        <motion.div
            className="pointer-events-none fixed z-50"
            initial={{ x: cursor.x, y: cursor.y }}
            animate={{ x: cursor.x, y: cursor.y }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ left: 0, top: 0 }}
        >
            {/* Cursor SVG */}
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                    fill={cursor.color}
                    stroke="white"
                    strokeWidth="1"
                />
            </svg>

            {/* Username label */}
            <div
                className="ml-4 -mt-2 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap shadow-lg"
                style={{ backgroundColor: cursor.color }}
            >
                {cursor.username}
            </div>
        </motion.div>
    );
}

interface CursorOverlayProps {
    cursors: CursorPosition[];
}

export function CursorOverlay({ cursors }: CursorOverlayProps) {
    return (
        <>
            {cursors.map((cursor) => (
                <RemoteCursor key={cursor.userId} cursor={cursor} />
            ))}
        </>
    );
}
