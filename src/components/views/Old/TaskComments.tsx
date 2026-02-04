
import React, { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button"; // shadcn
import { Input } from "@/components/ui/input"; // shadcn 
import { ScrollArea } from "@/components/ui/scroll-area"; // shadcn
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // shadcn
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { Send, User as UserIcon } from "lucide-react";
import { useRealtime, RealtimeMessage } from "@/hooks/useRealtime";
import { useAuth } from "@/hooks/useAuth";

interface TaskCommentsProps {
    taskId: string;
    projectId: string;
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        username: string;
        avatarUrl?: string; // Optional
    };
}

export function TaskComments({ taskId, projectId }: TaskCommentsProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Listen for realtime updates
    useRealtime(projectId, (message: RealtimeMessage) => {
        if (message.type === "chat_message") {
            const data = message.data;
            if (data.taskId === taskId) {
                // Optimistically update or invalidate
                queryClient.setQueryData(["task-comments", taskId], (old: Comment[] = []) => {
                    // Avoid duplicates
                    if (old.find(c => c.id === data.id)) return old;
                    return [...old, data];
                });

                // Scroll to bottom
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }
        }
    });

    const { data: comments = [], isLoading } = useQuery<Comment[]>({
        queryKey: ["task-comments", taskId],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/tasks/${taskId}/comments`);
            return res.json();
        }
    });

    const mutation = useMutation({
        mutationFn: async (content: string) => {
            const res = await apiRequest("POST", `/api/tasks/${taskId}/comments`, { content });
            return res.json();
        },
        onSuccess: (newComment) => {
            setNewMessage("");
            queryClient.setQueryData(["task-comments", taskId], (old: Comment[] = []) => {
                if (old.find(c => c.id === newComment.id)) return old;
                return [...old, newComment];
            });
        },
        onError: () => {
            toast({
                title: "Failed to send message",
                variant: "destructive",
            });
        }
    });

    const handleSend = () => {
        if (!newMessage.trim()) return;
        mutation.mutate(newMessage);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    // Auto-scroll on load
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    if (isLoading) return <div className="p-4 text-center text-muted-foreground">Loading comments...</div>;

    return (
        <div className="flex flex-col h-full bg-background border-l">
            <div className="p-3 border-b font-medium flex items-center gap-2">
                Task Comments
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {comments.length === 0 && (
                        <div className="text-center text-muted-foreground text-sm py-8">
                            No comments yet. Start the conversation!
                        </div>
                    )}

                    {comments.map((comment) => {
                        const isMe = comment.user.id === user?.id;
                        return (
                            <div key={comment.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={comment.user.avatarUrl} />
                                    <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                                </Avatar>
                                <div className={`flex flex-col max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                        <span className="font-medium text-foreground">{comment.user.username}</span>
                                        <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                                    </div>
                                    <div className={`p-3 rounded-lg text-sm ${isMe
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                        }`}>
                                        {comment.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

            <div className="p-3 border-t bg-background mt-auto">
                <div className="flex gap-2">
                    <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={mutation.isPending}
                        className="flex-1"
                    />
                    <Button size="icon" onClick={handleSend} disabled={mutation.isPending || !newMessage.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
