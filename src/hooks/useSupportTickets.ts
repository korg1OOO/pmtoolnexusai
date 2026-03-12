/**
 * Support Ticket Management Hooks
 * React Query hooks for support ticket CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;
import { toast } from 'sonner';

// Types
export interface SupportTicket {
    id: string;
    ticket_number: string;
    user_id: string;
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
    category: 'billing' | 'technical' | 'feature_request' | 'bug_report' | 'other';
    assigned_to?: string;
    resolved_at?: string;
    created_at: string;
    updated_at: string;
    // Joined fields
    user_email?: string;
    assigned_to_email?: string;
    reply_count?: number;
}

export interface TicketReply {
    id: string;
    ticket_id: string;
    user_id: string;
    message: string;
    is_internal: boolean;
    attachments: any[];
    created_at: string;
    // Joined fields
    user_email?: string;
}

export interface TicketAnalytics {
    status: string;
    priority: string;
    category: string;
    count: number;
    avg_resolution_hours: number;
    earliest_ticket: string;
    latest_ticket: string;
}

export interface CreateTicketData {
    subject: string;
    description: string;
    priority: SupportTicket['priority'];
    category: SupportTicket['category'];
    user_id?: string;
}

export interface UpdateTicketData {
    status?: SupportTicket['status'];
    priority?: SupportTicket['priority'];
    assigned_to?: string;
    category?: SupportTicket['category'];
}

// Fetch all tickets with filters
export function useSupportTickets(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    assigned_to?: string;
}) {
    return useQuery({
        queryKey: ['support-tickets', filters],
        queryFn: async () => {
            let query = supabase
                .from('support_tickets')
                .select(`
                    *,
                    user:auth.users!user_id(email),
                    assigned:auth.users!assigned_to(email)
                `)
                .order('created_at', { ascending: false });

            if (filters?.status) {
                query = query.eq('status', filters.status);
            }
            if (filters?.priority) {
                query = query.eq('priority', filters.priority);
            }
            if (filters?.category) {
                query = query.eq('category', filters.category);
            }
            if (filters?.assigned_to) {
                query = query.eq('assigned_to', filters.assigned_to);
            }

            const { data, error } = await query;

            if (error) throw error;

            return (data || []).map((ticket: any) => ({
                ...ticket,
                user_email: ticket.user?.email,
                assigned_to_email: ticket.assigned?.email
            })) as SupportTicket[];
        }
    });
}

// Fetch single ticket
export function useSupportTicket(ticketId: string) {
    return useQuery({
        queryKey: ['support-ticket', ticketId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('support_tickets')
                .select(`
                    *,
                    user:auth.users!user_id(email),
                    assigned:auth.users!assigned_to(email)
                `)
                .eq('id', ticketId)
                .single();

            if (error) throw error;

            return {
                ...data,
                user_email: data.user?.email,
                assigned_to_email: data.assigned?.email
            } as SupportTicket;
        },
        enabled: !!ticketId
    });
}

// Fetch ticket replies
export function useTicketReplies(ticketId: string) {
    return useQuery({
        queryKey: ['ticket-replies', ticketId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ticket_replies')
                .select(`
                    *,
                    user:auth.users(email)
                `)
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            return (data || []).map((reply: any) => ({
                ...reply,
                user_email: reply.user?.email
            })) as TicketReply[];
        },
        enabled: !!ticketId
    });
}

// Fetch ticket analytics
export function useTicketAnalytics() {
    return useQuery({
        queryKey: ['ticket-analytics'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ticket_analytics')
                .select('*');

            if (error) throw error;
            return data as TicketAnalytics[];
        }
    });
}

// Create ticket
export function useCreateTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ticketData: CreateTicketData) => {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('support_tickets')
                .insert({
                    ...ticketData,
                    user_id: ticketData.user_id || user?.id,
                    status: 'open'
                })
                .select()
                .single();

            if (error) throw error;
            return data as SupportTicket;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
            toast.success('Support ticket created successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to create ticket: ${error.message}`);
        }
    });
}

// Update ticket
export function useUpdateTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: UpdateTicketData }) => {
            const updateData: any = { ...updates };

            // Auto-set resolved_at when status changes to resolved
            if (updates.status === 'resolved') {
                updateData.resolved_at = new Date().toISOString();
            }

            const { data, error } = await supabase
                .from('support_tickets')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as SupportTicket;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['support-ticket', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['ticket-analytics'] });
            toast.success('Ticket updated successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to update ticket: ${error.message}`);
        }
    });
}

// Add reply to ticket
export function useAddTicketReply() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            ticketId,
            message,
            isInternal = false
        }: {
            ticketId: string;
            message: string;
            isInternal?: boolean;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('ticket_replies')
                .insert({
                    ticket_id: ticketId,
                    user_id: user?.id,
                    message,
                    is_internal: isInternal
                })
                .select()
                .single();

            if (error) throw error;
            return data as TicketReply;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ticket-replies', variables.ticketId] });
            queryClient.invalidateQueries({ queryKey: ['support-ticket', variables.ticketId] });
            toast.success('Reply added successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to add reply: ${error.message}`);
        }
    });
}

// Delete ticket (admin only)
export function useDeleteTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ticketId: string) => {
            const { error } = await supabase
                .from('support_tickets')
                .delete()
                .eq('id', ticketId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['ticket-analytics'] });
            toast.success('Ticket deleted successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to delete ticket: ${error.message}`);
        }
    });
}
