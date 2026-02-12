/**
 * Ticket Detail View
 * View and reply to support tickets
 */

import React, { useState } from 'react';
import {
    ArrowLeft,
    Send,
    MessageSquare,
    Clock,
    User,
    Tag,
    AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
    useSupportTicket,
    useTicketReplies,
    useUpdateTicket,
    useAddTicketReply
} from '@/hooks/useSupportTickets';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export function TicketDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [replyMessage, setReplyMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);

    const { data: ticket, isLoading: ticketLoading } = useSupportTicket(id || '');
    const { data: replies = [] } = useTicketReplies(id || '');
    const updateTicket = useUpdateTicket();
    const addReply = useAddTicketReply();

    const handleStatusChange = async (status: string) => {
        if (!ticket) return;
        await updateTicket.mutateAsync({
            id: ticket.id,
            updates: { status: status as any }
        });
    };

    const handlePriorityChange = async (priority: string) => {
        if (!ticket) return;
        await updateTicket.mutateAsync({
            id: ticket.id,
            updates: { priority: priority as any }
        });
    };

    const handleAddReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticket || !replyMessage.trim()) return;

        try {
            await addReply.mutateAsync({
                ticketId: ticket.id,
                message: replyMessage,
                isInternal
            });
            setReplyMessage('');
            setIsInternal(false);
        } catch (error) {
            // Error handled by hook
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-600';
            case 'high': return 'bg-orange-600';
            case 'medium': return 'bg-yellow-600';
            case 'low': return 'bg-green-600';
            default: return 'bg-gray-600';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-600';
            case 'in_progress': return 'bg-purple-600';
            case 'waiting': return 'bg-yellow-600';
            case 'resolved': return 'bg-green-600';
            case 'closed': return 'bg-gray-600';
            default: return 'bg-gray-600';
        }
    };

    if (ticketLoading) {
        return (
            <div className="p-6 flex items-center justify-center">
                <div className="text-center">
                    <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading ticket...</p>
                </div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="p-12 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h2 className="text-2xl font-bold mb-2">Ticket Not Found</h2>
                        <p className="text-muted-foreground mb-6">
                            The ticket you're looking for doesn't exist or has been deleted.
                        </p>
                        <Button onClick={() => navigate('/admin/requests')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Tickets
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin/requests')}
                        className="mb-2"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Queue
                    </Button>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        {ticket.ticket_number}
                    </h1>
                    <p className="text-muted-foreground">{ticket.subject}</p>
                </div>
                <div className="flex gap-2">
                    <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                    </Badge>
                    <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Original Ticket */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Original Request
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                        <User className="h-4 w-4" />
                                        {ticket.user_email}
                                        <span>•</span>
                                        <Clock className="h-4 w-4" />
                                        {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
                                    </div>
                                    <p className="whitespace-pre-wrap">{ticket.description}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Replies */}
                    {replies.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5" />
                                    Replies ({replies.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {replies.map((reply) => (
                                    <div
                                        key={reply.id}
                                        className={`p-4 rounded-lg ${reply.is_internal
                                                ? 'bg-yellow-50 border border-yellow-200'
                                                : 'bg-muted'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                            <User className="h-4 w-4" />
                                            {reply.user_email}
                                            {reply.is_internal && (
                                                <Badge variant="outline" className="text-xs">
                                                    Internal Note
                                                </Badge>
                                            )}
                                            <span>•</span>
                                            <Clock className="h-4 w-4" />
                                            {format(new Date(reply.created_at), 'MMM d, h:mm a')}
                                        </div>
                                        <p className="whitespace-pre-wrap">{reply.message}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Reply Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Reply</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddReply} className="space-y-4">
                                <div>
                                    <Label htmlFor="reply">Message</Label>
                                    <Textarea
                                        id="reply"
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder="Type your reply..."
                                        rows={5}
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="internal"
                                        checked={isInternal}
                                        onCheckedChange={(checked) => setIsInternal(checked as boolean)}
                                    />
                                    <Label htmlFor="internal" className="text-sm">
                                        Internal note (not visible to customer)
                                    </Label>
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit">
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Reply
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Ticket Properties */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Ticket Properties</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-xs text-muted-foreground">Status</Label>
                                <Select
                                    value={ticket.status}
                                    onValueChange={handleStatusChange}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="waiting">Waiting</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground">Priority</Label>
                                <Select
                                    value={ticket.priority}
                                    onValueChange={handlePriorityChange}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            <div>
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    Category
                                </Label>
                                <p className="mt-1 text-sm">
                                    {ticket.category?.replace('_', ' ') || 'None'}
                                </p>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    Requester
                                </Label>
                                <p className="mt-1 text-sm">{ticket.user_email}</p>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Created
                                </Label>
                                <p className="mt-1 text-sm">
                                    {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
                                </p>
                            </div>

                            {ticket.resolved_at && (
                                <div>
                                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Resolved
                                    </Label>
                                    <p className="mt-1 text-sm">
                                        {format(new Date(ticket.resolved_at), 'MMM d, yyyy h:mm a')}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
