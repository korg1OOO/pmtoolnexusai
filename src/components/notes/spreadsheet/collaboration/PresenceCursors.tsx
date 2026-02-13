import React from 'react';
import type { UserPresence } from '@/services/presenceService';

interface PresenceCursorsProps {
    users: UserPresence[];
    cellWidth: number;
    cellHeight: number;
    rowHeaderWidth: number;
    columnHeaderHeight: number;
}

export function PresenceCursors({
    users,
    cellWidth,
    cellHeight,
    rowHeaderWidth,
    columnHeaderHeight,
}: PresenceCursorsProps) {
    return (
        <div className="absolute inset-0 pointer-events-none z-20">
            {users.map((user) => {
                if (!user.cursor_position) return null;

                const x = rowHeaderWidth + user.cursor_position.col * cellWidth;
                const y = columnHeaderHeight + user.cursor_position.row * cellHeight;

                return (
                    <div
                        key={user.user_id}
                        className="absolute transition-all duration-150 ease-out"
                        style={{
                            left: `${x}px`,
                            top: `${y}px`,
                        }}
                    >
                        {/* Cursor pointer */}
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="drop-shadow-lg"
                            style={{ color: user.user_color }}
                        >
                            <path
                                d="M5.5 3L19.5 10L12 12.5L9.5 20L5.5 3Z"
                                fill="currentColor"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                            />
                        </svg>

                        {/* User label */}
                        <div
                            className="absolute top-6 left-2 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap shadow-lg"
                            style={{ backgroundColor: user.user_color }}
                        >
                            {user.user_name}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

interface PresenceSelectionsProps {
    users: UserPresence[];
    cellWidth: number;
    cellHeight: number;
    rowHeaderWidth: number;
    columnHeaderHeight: number;
}

export function PresenceSelections({
    users,
    cellWidth,
    cellHeight,
    rowHeaderWidth,
    columnHeaderHeight,
}: PresenceSelectionsProps) {
    return (
        <div className="absolute inset-0 pointer-events-none z-5">
            {users.map((user) => {
                if (!user.selection) return null;

                const startCol = Math.min(user.selection.start.col, user.selection.end.col);
                const endCol = Math.max(user.selection.start.col, user.selection.end.col);
                const startRow = Math.min(user.selection.start.row, user.selection.end.row);
                const endRow = Math.max(user.selection.start.row, user.selection.end.row);

                const x = rowHeaderWidth + startCol * cellWidth;
                const y = columnHeaderHeight + startRow * cellHeight;
                const width = (endCol - startCol + 1) * cellWidth;
                const height = (endRow - startRow + 1) * cellHeight;

                return (
                    <div
                        key={user.user_id}
                        className="absolute border-2 transition-all duration-150 ease-out"
                        style={{
                            left: `${x}px`,
                            top: `${y}px`,
                            width: `${width}px`,
                            height: `${height}px`,
                            borderColor: user.user_color,
                            backgroundColor: `${user.user_color}15`, // 15% opacity
                        }}
                    />
                );
            })}
        </div>
    );
}
