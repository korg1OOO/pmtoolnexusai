import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CommentIndicatorProps {
    cellRef: string;
    commentCount: number;
    hasUnresolved: boolean;
    onClick: () => void;
}

export function CommentIndicator({
    cellRef,
    commentCount,
    hasUnresolved,
    onClick,
}: CommentIndicatorProps) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className={`absolute top-0 right-0 h-5 w-5 rounded-none rounded-bl-sm pointer-events-auto ${hasUnresolved
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-700'
                    : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-700'
                }`}
            onClick={onClick}
            title={`${commentCount} comment${commentCount > 1 ? 's' : ''}`}
        >
            <MessageSquare className="h-3 w-3" />
            {commentCount > 1 && (
                <span className="absolute -top-1 -right-1 bg-current text-white text-[8px] rounded-full h-3 w-3 flex items-center justify-center">
                    {commentCount}
                </span>
            )}
        </Button>
    );
}
