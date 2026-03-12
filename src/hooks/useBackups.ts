/**
 * Database Backup Hooks
 * React Query hooks for backup job management and scheduling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;
import { toast } from 'sonner';

// Types
export interface BackupJob {
    id: string;
    backup_type: 'full' | 'incremental';
    status: 'pending' | 'running' | 'completed' | 'failed';
    file_size?: number;
    storage_location?: string;
    started_at?: string;
    completed_at?: string;
    error_message?: string;
    created_by: string;
    created_at: string;
    // Joined fields
    created_by_email?: string;
    duration_seconds?: number;
}

export interface BackupSchedule {
    id: string;
    name: string;
    cron_expression: string;
    backup_type: 'full' | 'incremental';
    retention_days: number;
    is_active: boolean;
    last_run_at?: string;
    next_run_at?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateBackupJobData {
    backup_type: BackupJob['backup_type'];
}

export interface CreateBackupScheduleData {
    name: string;
    cron_expression: string;
    backup_type: BackupSchedule['backup_type'];
    retention_days?: number;
}

// ============ BACKUP JOBS ============

export function useBackupJobs(status?: string) {
    return useQuery({
        queryKey: ['backup-jobs', status],
        queryFn: async () => {
            let query = supabase
                .from('backup_history')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as BackupJob[];
        }
    });
}

export function useBackupJob(id: string) {
    return useQuery({
        queryKey: ['backup-job', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('backup_jobs')
                .select(`
                    *,
                    creator:auth.users!created_by(email)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            return {
                ...data,
                created_by_email: data.creator?.email
            } as BackupJob;
        },
        enabled: !!id
    });
}

export function useTriggerBackup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (backupData: CreateBackupJobData) => {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('backup_jobs')
                .insert({
                    ...backupData,
                    created_by: user?.id,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            // Trigger the backup Edge Function
            const { error: functionError } = await supabase.functions.invoke('database-backup', {
                body: { backup_job_id: data.id }
            });

            if (functionError) {
                console.error('Backup function error:', functionError);
                // Update job status to failed
                await supabase
                    .from('backup_jobs')
                    .update({ status: 'failed' })
                    .eq('id', data.id);
                throw functionError;
            }

            return data as BackupJob;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backup-jobs'] });
            toast.success('Backup job triggered successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to trigger backup: ${error.message}`);
        }
    });
}

export function useUpdateBackupJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            status,
            fileSize,
            storageLocation,
            errorMessage
        }: {
            id: string;
            status: BackupJob['status'];
            fileSize?: number;
            storageLocation?: string;
            errorMessage?: string;
        }) => {
            const updates: any = { status };

            if (status === 'running' && !updates.started_at) {
                updates.started_at = new Date().toISOString();
            }

            if (status === 'completed' || status === 'failed') {
                updates.completed_at = new Date().toISOString();
            }

            if (fileSize) updates.file_size = fileSize;
            if (storageLocation) updates.storage_location = storageLocation;
            if (errorMessage) updates.error_message = errorMessage;

            const { data, error } = await supabase
                .from('backup_jobs')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as BackupJob;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['backup-jobs'] });
            queryClient.invalidateQueries({ queryKey: ['backup-job', variables.id] });
        },
        onError: (error: any) => {
            toast.error(`Failed to update backup job: ${error.message}`);
        }
    });
}

export function useDeleteBackupJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('backup_jobs')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backup-jobs'] });
            toast.success('Backup job deleted successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to delete backup job: ${error.message}`);
        }
    });
}

// ============ BACKUP SCHEDULES ============

export function useBackupSchedules() {
    return useQuery({
        queryKey: ['backup-schedules'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('backup_schedules')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return data as BackupSchedule[];
        }
    });
}

export function useBackupSchedule(id: string) {
    return useQuery({
        queryKey: ['backup-schedule', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('backup_schedules')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as BackupSchedule;
        },
        enabled: !!id
    });
}

export function useCreateBackupSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (scheduleData: CreateBackupScheduleData) => {
            const { data, error } = await supabase
                .from('backup_schedules')
                .insert({
                    ...scheduleData,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;
            return data as BackupSchedule;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backup-schedules'] });
            toast.success('Backup schedule created successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to create schedule: ${error.message}`);
        }
    });
}

export function useUpdateBackupSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            updates
        }: {
            id: string;
            updates: Partial<CreateBackupScheduleData>
        }) => {
            const { data, error } = await supabase
                .from('backup_schedules')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as BackupSchedule;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['backup-schedules'] });
            queryClient.invalidateQueries({ queryKey: ['backup-schedule', variables.id] });
            toast.success('Schedule updated successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to update schedule: ${error.message}`);
        }
    });
}

export function useToggleBackupSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            const { data, error } = await supabase
                .from('backup_schedules')
                .update({ is_active: isActive })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as BackupSchedule;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backup-schedules'] });
            toast.success('Schedule status updated');
        },
        onError: (error: any) => {
            toast.error(`Failed to toggle schedule: ${error.message}`);
        }
    });
}

export function useDeleteBackupSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('backup_schedules')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backup-schedules'] });
            toast.success('Schedule deleted successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to delete schedule: ${error.message}`);
        }
    });
}

// ============ STATISTICS ============

export function useBackupStatistics() {
    return useQuery({
        queryKey: ['backup-statistics'],
        queryFn: async () => {
            const { data: jobs, error } = await supabase
                .from('backup_jobs')
                .select('status, file_size');

            if (error) throw error;

            const total = jobs?.length || 0;
            const completed = jobs?.filter(j => j.status === 'completed').length || 0;
            const failed = jobs?.filter(j => j.status === 'failed').length || 0;
            const totalSize = jobs?.reduce((sum, j) => sum + (j.file_size || 0), 0) || 0;
            const successRate = total > 0 ? (completed / total) * 100 : 0;

            return {
                total,
                completed,
                failed,
                totalSize,
                successRate: successRate.toFixed(1)
            };
        }
    });
}
