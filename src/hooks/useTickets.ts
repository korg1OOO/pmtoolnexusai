import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ============================================
// Type Definitions
// ============================================

export interface SupportTicket {
    id: string;
    user_id: string;
    title: string;
    description: string;
    category: 'bug' | 'feature' | 'question' | 'other';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    assigned_to: string | null;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
}

export interface TicketReply {
    id: string;
    ticket_id: string;
    user_id: string;
    message: string;
    is_internal: boolean;
    created_at: string;
    // Joined fields
    user_email?: string;
    user_name?: string;
}

// ============================================
// Support Tickets Hooks
// ============================================

export const useSupportTickets = (status?: string, assignedTo?: string) => {
    return useQuery({
        queryKey: ["support-tickets", status, assignedTo],
        queryFn: async (): Promise<SupportTicket[]> => {
            try {
                let query = supabase
                    .from("support_tickets")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (status) {
                    query = query.eq("status", status);
                }

                if (assignedTo) {
                    query = query.eq("assigned_to", assignedTo);
                }

                const { data, error } = await query;
                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("support_tickets query failed", e);
                return [];
            }
        },
    });
};

export const useSupportTicket = (id: string | undefined) => {
    return useQuery({
        queryKey: ["support-ticket", id],
        queryFn: async (): Promise<SupportTicket | null> => {
            if (!id) return null;

            try {
                const { data, error } = await supabase
                    .from("support_tickets")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error) throw error;
                return data;
            } catch (e) {
                console.warn("support_ticket query failed", e);
                return null;
            }
        },
        enabled: !!id,
    });
};

// ============================================
// Ticket Replies Hooks
// ============================================

export const useTicketReplies = (ticketId: string | undefined) => {
    return useQuery({
        queryKey: ["ticket-replies", ticketId],
        queryFn: async (): Promise<TicketReply[]> => {
            if (!ticketId) return [];

            try {
                const { data, error } = await supabase
                    .from("ticket_replies")
                    .select(`
            *,
            user:auth.users!user_id(email)
          `)
                    .eq("ticket_id", ticketId)
                    .order("created_at", { ascending: true });

                if (error) throw error;

                return (data || []).map((reply: any) => ({
                    ...reply,
                    user_email: reply.user?.email,
                }));
            } catch (e) {
                console.warn("ticket_replies query failed", e);
                return [];
            }
        },
        enabled: !!ticketId,
        refetchInterval: 5000, // Poll every 5 seconds for real-time feel
    });
};

// ============================================
// Mutation Hooks
// ============================================

export const useCreateTicket = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ticket: Partial<SupportTicket>) => {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from("support_tickets")
                .insert({
                    ...ticket,
                    user_id: user?.id,
                    status: 'open',
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
            toast.success("Support ticket created successfully");
        },
        onError: (error: any) => {
            toast.error(`Failed to create ticket: ${error.message}`);
        },
    });
};

export const useUpdateTicket = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<SupportTicket> }) => {
            const { data, error } = await supabase
                .from("support_tickets")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
            queryClient.invalidateQueries({ queryKey: ["support-ticket", variables.id] });
            toast.success("Ticket updated successfully");
        },
        onError: (error: any) => {
            toast.error(`Failed to update ticket: ${error.message}`);
        },
    });
};

export const useAddTicketReply = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            ticketId,
            message,
            isInternal = false,
        }: {
            ticketId: string;
            message: string;
            isInternal?: boolean;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from("ticket_replies")
                .insert({
                    ticket_id: ticketId,
                    user_id: user?.id,
                    message,
                    is_internal: isInternal,
                })
                .select()
                .single();

            if (error) throw error;

            // Update ticket's updated_at
            await supabase
                .from("support_tickets")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", ticketId);

            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["ticket-replies", variables.ticketId] });
            queryClient.invalidateQueries({ queryKey: ["support-ticket", variables.ticketId] });
            queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
            toast.success("Reply posted successfully");
        },
        onError: (error: any) => {
            toast.error(`Failed to post reply: ${error.message}`);
        },
    });
};

export const useAssignTicket = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ticketId, assignedTo }: { ticketId: string; assignedTo: string | null }) => {
            const { data, error } = await supabase
                .from("support_tickets")
                .update({ assigned_to: assignedTo, status: assignedTo ? 'in_progress' : 'open' })
                .eq("id", ticketId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
            queryClient.invalidateQueries({ queryKey: ["support-ticket", variables.ticketId] });
            toast.success("Ticket assigned successfully");
        },
        onError: (error: any) => {
            toast.error(`Failed to assign ticket: ${error.message}`);
        },
    });
};

export const useResolveTicket = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ticketId: string) => {
            const { data, error } = await supabase
                .from("support_tickets")
                .update({
                    status: 'resolved',
                    resolved_at: new Date().toISOString(),
                })
                .eq("id", ticketId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, ticketId) => {
            queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
            queryClient.invalidateQueries({ queryKey: ["support-ticket", ticketId] });
            toast.success("Ticket marked as resolved");
        },
        onError: (error: any) => {
            toast.error(`Failed to resolve ticket: ${error.message}`);
        },
    });
};

export const useCloseTicket = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ticketId: string) => {
            const { data, error } = await supabase
                .from("support_tickets")
                .update({ status: 'closed' })
                .eq("id", ticketId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, ticketId) => {
            queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
            queryClient.invalidateQueries({ queryKey: ["support-ticket", ticketId] });
            toast.success("Ticket closed");
        },
        onError: (error: any) => {
            toast.error(`Failed to close ticket: ${error.message}`);
        },
    });
};
