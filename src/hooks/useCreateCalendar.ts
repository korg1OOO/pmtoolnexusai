import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import type { ProjectCalendar, WorkingDays, WorkHours } from './useCalendars';

// Type guard to convert Json to WorkingDays
function parseWorkingDays(json: Json): WorkingDays {
  const defaultDays: WorkingDays = { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false };
  if (typeof json !== 'object' || json === null || Array.isArray(json)) return defaultDays;
  return {
    mon: typeof (json as Record<string, unknown>).mon === 'boolean' ? (json as Record<string, unknown>).mon as boolean : true,
    tue: typeof (json as Record<string, unknown>).tue === 'boolean' ? (json as Record<string, unknown>).tue as boolean : true,
    wed: typeof (json as Record<string, unknown>).wed === 'boolean' ? (json as Record<string, unknown>).wed as boolean : true,
    thu: typeof (json as Record<string, unknown>).thu === 'boolean' ? (json as Record<string, unknown>).thu as boolean : true,
    fri: typeof (json as Record<string, unknown>).fri === 'boolean' ? (json as Record<string, unknown>).fri as boolean : true,
    sat: typeof (json as Record<string, unknown>).sat === 'boolean' ? (json as Record<string, unknown>).sat as boolean : false,
    sun: typeof (json as Record<string, unknown>).sun === 'boolean' ? (json as Record<string, unknown>).sun as boolean : false,
  };
}

// Type guard to convert Json to WorkHours
function parseWorkHours(json: Json): WorkHours {
  const defaultHours: WorkHours = { start: '09:00', end: '17:00', hours_per_day: 8 };
  if (typeof json !== 'object' || json === null || Array.isArray(json)) return defaultHours;
  return {
    start: typeof (json as Record<string, unknown>).start === 'string' ? (json as Record<string, unknown>).start as string : '09:00',
    end: typeof (json as Record<string, unknown>).end === 'string' ? (json as Record<string, unknown>).end as string : '17:00',
    hours_per_day: typeof (json as Record<string, unknown>).hours_per_day === 'number' ? (json as Record<string, unknown>).hours_per_day as number : 8,
  };
}

function transformCalendar(data: {
  id: string;
  project_id: string;
  name: string;
  is_default: boolean;
  working_days: Json;
  work_hours: Json;
  created_at: string;
}): ProjectCalendar {
  return {
    ...data,
    working_days: parseWorkingDays(data.working_days),
    work_hours: parseWorkHours(data.work_hours),
  };
}

export function useCreateCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (calendar: Omit<ProjectCalendar, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('project_calendars')
        .insert({
          project_id: calendar.project_id,
          name: calendar.name,
          is_default: calendar.is_default,
          working_days: calendar.working_days as unknown as Json,
          work_hours: calendar.work_hours as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return transformCalendar(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-calendars', data.project_id] });
      toast.success('Calendar created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create calendar: ${error.message}`);
    },
  });
}

export function useDeleteCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_calendars')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-calendars', projectId] });
      queryClient.invalidateQueries({ queryKey: ['default-calendar', projectId] });
      toast.success('Calendar deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete calendar: ${error.message}`);
    },
  });
}
