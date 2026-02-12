/**
 * Notifications Hooks
 * React Query hooks for managing user notifications with real-time updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;
import { toast } from 'sonner';
import { useEffect } from 'react';

export type NotificationType = 'sla_breach' | 'sla_warning' | 'action_overdue' | 'sync_failed' | 'mention' | 'info';

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    action_url?: string;
    related_item_type?: string;
    related_item_id?: string;
    related_item_title?: string;
    is_read: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateNotificationData {
    type: NotificationType;
    title: string;
    message: string;
    action_url?: string;
    related_item_type?: string;
    related_item_id?: string;
    related_item_title?: string;
}

/**
 * Fetch all notifications for the current user
 */
export function useNotifications(filter?: 'all' | 'unread' | 'sla' | 'actions') {
    return useQuery({
        queryKey: ['notifications', filter],
        queryFn: async (): Promise<Notification[]> => {
            let query = supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            // Apply filters
            if (filter === 'unread') {
                query = query.eq('is_read', false);
            } else if (filter === 'sla') {
                query = query.in('type', ['sla_breach', 'sla_warning']);
            } else if (filter === 'actions') {
                query = query.eq('type', 'action_overdue');
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 30, // 30 seconds
    });
}

/**
 * Get unread notification count
 */
export function useUnreadCount() {
    return useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: async (): Promise<number> => {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('is_read', false);

            if (error) throw error;
            return count || 0;
        },
        staleTime: 1000 * 30, // 30 seconds
    });
}

/**
 * Mark a notification as read
 */
export function useMarkNotificationRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('is_read', false);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('All notifications marked as read');
        },
    });
}

/**
 * Delete a notification
 */
export function useDeleteNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

/**
 * Create a new notification (typically used server-side)
 */
export function useCreateNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notification: CreateNotificationData) => {
            const { data, error } = await supabase
                .from('notifications')
                .insert(notification)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

/**
 * Real-time notifications subscription hook
 * Subscribes to INSERT events and updates the query cache
 */
export function useNotificationsRealtime() {
    const queryClient = useQueryClient();

    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | null = null;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session?.user?.id) return;

            channel = supabase
                .channel('notifications-realtime')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${session.user.id}`,
                    },
                    (payload) => {
                        // Add new notification to cache
                        queryClient.setQueryData(['notifications', undefined], (old: Notification[] = []) => {
                            return [payload.new as Notification, ...old];
                        });

                        // Invalidate unread count
                        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });

                        // Show toast for new notification
                        const newNotif = payload.new as Notification;
                        toast.info(newNotif.title, {
                            description: newNotif.message,
                        });
                    }
                )
                .subscribe();
        });

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [queryClient]);
}
