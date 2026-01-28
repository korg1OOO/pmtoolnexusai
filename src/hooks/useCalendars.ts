import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface WorkingDays {
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
  sat: boolean;
  sun: boolean;
}

export interface WorkHours {
  start: string;
  end: string;
  hours_per_day: number;
}

export interface ProjectCalendar {
  id: string;
  project_id: string;
  name: string;
  is_default: boolean;
  working_days: WorkingDays;
  work_hours: WorkHours;
  created_at: string;
}

export interface CalendarException {
  id: string;
  calendar_id: string;
  name: string;
  exception_type: 'holiday' | 'working';
  start_date: string;
  end_date: string;
  work_hours: WorkHours | null;
  created_at: string;
}

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

function transformException(data: {
  id: string;
  calendar_id: string;
  name: string;
  exception_type: string;
  start_date: string;
  end_date: string;
  work_hours: Json;
  created_at: string;
}): CalendarException {
  return {
    ...data,
    exception_type: data.exception_type as 'holiday' | 'working',
    work_hours: data.work_hours ? parseWorkHours(data.work_hours) : null,
  };
}

export function useProjectCalendars(projectId: string | null) {
  return useQuery({
    queryKey: ['project-calendars', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_calendars')
        .select('*')
        .eq('project_id', projectId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return data.map(transformCalendar);
    },
    enabled: !!projectId,
  });
}

export function useDefaultCalendar(projectId: string | null) {
  return useQuery({
    queryKey: ['default-calendar', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from('project_calendars')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_default', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? transformCalendar(data) : null;
    },
    enabled: !!projectId,
  });
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

export function useUpdateCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectCalendar> & { id: string }) => {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.is_default !== undefined) dbUpdates.is_default = updates.is_default;
      if (updates.working_days !== undefined) dbUpdates.working_days = updates.working_days as unknown as Json;
      if (updates.work_hours !== undefined) dbUpdates.work_hours = updates.work_hours as unknown as Json;

      const { data, error } = await supabase
        .from('project_calendars')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformCalendar(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-calendars', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['default-calendar', data.project_id] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update calendar: ${error.message}`);
    },
  });
}

// Calendar Exceptions
export function useCalendarExceptions(calendarId: string | null) {
  return useQuery({
    queryKey: ['calendar-exceptions', calendarId],
    queryFn: async () => {
      if (!calendarId) return [];
      
      const { data, error } = await supabase
        .from('calendar_exceptions')
        .select('*')
        .eq('calendar_id', calendarId)
        .order('start_date');

      if (error) throw error;
      return data.map(transformException);
    },
    enabled: !!calendarId,
  });
}

export function useCreateCalendarException() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exception: Omit<CalendarException, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('calendar_exceptions')
        .insert({
          calendar_id: exception.calendar_id,
          name: exception.name,
          exception_type: exception.exception_type,
          start_date: exception.start_date,
          end_date: exception.end_date,
          work_hours: exception.work_hours as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return transformException(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-exceptions', data.calendar_id] });
      toast.success('Exception added');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add exception: ${error.message}`);
    },
  });
}

export function useDeleteCalendarException() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, calendarId }: { id: string; calendarId: string }) => {
      const { error } = await supabase
        .from('calendar_exceptions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, calendarId };
    },
    onSuccess: ({ calendarId }) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-exceptions', calendarId] });
      toast.success('Exception removed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove exception: ${error.message}`);
    },
  });
}

// Helper function to check if a date is a working day
export function isWorkingDay(
  date: Date,
  calendar: ProjectCalendar,
  exceptions: CalendarException[]
): boolean {
  const dateStr = date.toISOString().split('T')[0];
  
  // Check exceptions first
  const exception = exceptions.find(e => 
    dateStr >= e.start_date && dateStr <= e.end_date
  );
  
  if (exception) {
    return exception.exception_type === 'working';
  }
  
  // Check regular working days
  const dayNames: (keyof WorkingDays)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayOfWeek = dayNames[date.getDay()];
  
  return calendar.working_days[dayOfWeek];
}

// Calculate working days between two dates
export function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  calendar: ProjectCalendar,
  exceptions: CalendarException[]
): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (isWorkingDay(current, calendar, exceptions)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// Add working days to a date
export function addWorkingDays(
  startDate: Date,
  days: number,
  calendar: ProjectCalendar,
  exceptions: CalendarException[]
): Date {
  const result = new Date(startDate);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    if (isWorkingDay(result, calendar, exceptions)) {
      addedDays++;
    }
  }
  
  return result;
}
