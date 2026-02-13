import React, { useState } from 'react';
import { MessageSquare, MoreVertical, Check, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { SpreadsheetComment } from '@/services/commentsService';
import { formatDistanceToNow } from 'date-fns';

interface CommentThreadProps {
    cellRef: string;
    comments: SpreadsheetComment[];
    currentUserId: string;
    onAddComment: (content: string, parentId?: string) => void;
    onEditComment: (commentId: string, content: string) => void;
    onDeleteComment: (commentId: string) => void;
    onResolve: (commentId: string, resolved: boolean) => void;
    onClose: () => void;
}

export function CommentThread({
    cellRef,
    comments,
    currentUserId,
    onAddComment,
    onEditComment,
    onDeleteComment,
    onResolve,
    onClose,
}: CommentThreadProps) {
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        onAddComment(newComment);
        setNewComment('');
    };

    const handleReply = (parentId: string) => {
        if (!replyContent.trim()) return;
        onAddComment(replyContent, parentId);
        setReplyContent('');
        setReplyingTo(null);
    };

    const handleEdit = (commentId: string) => {
        if (!editContent.trim()) return;
        onEditComment(commentId, editContent);
        setEditingId(null);
        setEditContent('');
    };

    const renderComment = (comment: SpreadsheetComment, level = 0) => {
        const isEditing = editingId === comment.id;
        const isOwner = comment.user_id === currentUserId;

        return (
            <div key={comment.id} className={`${level > 0 ? 'ml-8 mt-2' : 'mt-3'}`}>
                <Card className={`p-3 ${comment.resolved ? 'opacity-60' : ''}`}>
                    <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                                {comment.user_name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{comment.user_name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                    {comment.resolved && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                            Resolved
                                        </span>
                                    )}
                                </div>

                                {isOwner && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                <MoreVertical className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setEditingId(comment.id);
                                                    setEditContent(comment.content);
                                                }}
                                            >
                                                <Edit2 className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => onDeleteComment(comment.id)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="space-y-2">
                                    <Textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="min-h-[60px]"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleEdit(comment.id)}>
                                            Save
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setEditingId(null);
                                                setEditContent('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

                                    <div className="flex items-center gap-2 mt-2">
                                        {level === 0 && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() => setReplyingTo(comment.id)}
                                                >
                                                    Reply
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() => onResolve(comment.id, !comment.resolved)}
                                                >
                                                    <Check className="h-3 w-3 mr-1" />
                                                    {comment.resolved ? 'Unresolve' : 'Resolve'}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Reply input */}
                    {replyingTo === comment.id && (
                        <div className="mt-3 ml-11 space-y-2">
                            <Textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                className="min-h-[60px]"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleReply(comment.id)}>
                                    Reply
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setReplyingTo(null);
                                        setReplyContent('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Nested replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-2">
                            {comment.replies.map((reply) => renderComment(reply, level + 1))}
                        </div>
                    )}
                </Card>
            </div>
        );
    };

    return (
        <div className="w-96 max-h-[600px] flex flex-col bg-background border-l border-border">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    <h3 className="font-semibold">Comments - {cellRef}</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    ×
                </Button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto p-4">
                {comments.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No comments yet</p>
                    </div>
                ) : (
                    comments.map((comment) => renderComment(comment))
                )}
            </div>

            {/* New comment input */}
            <div className="p-4 border-t border-border space-y-2">
                <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="min-h-[80px]"
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                    Add Comment
                </Button>
            </div>
        </div>
    );
}
