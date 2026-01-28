import { useMemo, useCallback } from 'react';
import type { ProjectCalendar, CalendarException, WorkingDays } from './useCalendars';

/**
 * Hook for calculating durations based on project calendars
 * Handles working days, work hours, and calendar exceptions
 */
export function useDurationCalculator(
  calendar: ProjectCalendar | null,
  exceptions: CalendarException[] = []
) {
  const dayNames: (keyof WorkingDays)[] = useMemo(
    () => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    []
  );

  /**
   * Check if a specific date is a working day
   */
  const isWorkingDay = useCallback(
    (date: Date): boolean => {
      if (!calendar) {
        // Default: Mon-Fri are working days
        const day = date.getDay();
        return day >= 1 && day <= 5;
      }

      const dateStr = date.toISOString().split('T')[0];

      // Check exceptions first (holidays or special working days)
      const exception = exceptions.find(
        (e) => dateStr >= e.start_date && dateStr <= e.end_date
      );

      if (exception) {
        return exception.exception_type === 'working';
      }

      // Check regular working days
      const dayOfWeek = dayNames[date.getDay()];
      return calendar.working_days[dayOfWeek];
    },
    [calendar, exceptions, dayNames]
  );

  /**
   * Get work hours for a specific date
   */
  const getWorkHours = useCallback(
    (date: Date): { start: string; end: string; hours: number } => {
      if (!calendar) {
        return { start: '09:00', end: '17:00', hours: 8 };
      }

      const dateStr = date.toISOString().split('T')[0];

      // Check if there's a working exception with custom hours
      const exception = exceptions.find(
        (e) =>
          dateStr >= e.start_date &&
          dateStr <= e.end_date &&
          e.exception_type === 'working' &&
          e.work_hours
      );

      if (exception?.work_hours) {
        return {
          start: exception.work_hours.start,
          end: exception.work_hours.end,
          hours: exception.work_hours.hours_per_day,
        };
      }

      return {
        start: calendar.work_hours.start,
        end: calendar.work_hours.end,
        hours: calendar.work_hours.hours_per_day,
      };
    },
    [calendar, exceptions]
  );

  /**
   * Calculate working days between two dates (inclusive)
   */
  const calculateWorkingDays = useCallback(
    (startDate: Date, endDate: Date): number => {
      let count = 0;
      const current = new Date(startDate);
      current.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);

      while (current <= end) {
        if (isWorkingDay(current)) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }

      return count;
    },
    [isWorkingDay]
  );

  /**
   * Calculate total work hours between two dates
   */
  const calculateWorkHours = useCallback(
    (startDate: Date, endDate: Date): number => {
      let totalHours = 0;
      const current = new Date(startDate);
      current.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);

      while (current <= end) {
        if (isWorkingDay(current)) {
          const { hours } = getWorkHours(current);
          totalHours += hours;
        }
        current.setDate(current.getDate() + 1);
      }

      return totalHours;
    },
    [isWorkingDay, getWorkHours]
  );

  /**
   * Add working days to a date
   */
  const addWorkingDays = useCallback(
    (startDate: Date, days: number): Date => {
      const result = new Date(startDate);
      result.setHours(0, 0, 0, 0);
      let addedDays = 0;

      // If days is 0, return the start date
      if (days === 0) return result;

      while (addedDays < days) {
        result.setDate(result.getDate() + 1);
        if (isWorkingDay(result)) {
          addedDays++;
        }
      }

      return result;
    },
    [isWorkingDay]
  );

  /**
   * Subtract working days from a date
   */
  const subtractWorkingDays = useCallback(
    (endDate: Date, days: number): Date => {
      const result = new Date(endDate);
      result.setHours(0, 0, 0, 0);
      let subtractedDays = 0;

      if (days === 0) return result;

      while (subtractedDays < days) {
        result.setDate(result.getDate() - 1);
        if (isWorkingDay(result)) {
          subtractedDays++;
        }
      }

      return result;
    },
    [isWorkingDay]
  );

  /**
   * Convert work hours to duration (working days)
   */
  const workHoursToDuration = useCallback(
    (workHours: number): number => {
      const hoursPerDay = calendar?.work_hours.hours_per_day || 8;
      return Math.ceil(workHours / hoursPerDay);
    },
    [calendar]
  );

  /**
   * Convert duration (working days) to work hours
   */
  const durationToWorkHours = useCallback(
    (duration: number): number => {
      const hoursPerDay = calendar?.work_hours.hours_per_day || 8;
      return duration * hoursPerDay;
    },
    [calendar]
  );

  /**
   * Calculate end date given start date and duration
   */
  const calculateEndDate = useCallback(
    (startDate: Date, durationDays: number): Date => {
      if (durationDays <= 1) {
        return new Date(startDate);
      }
      return addWorkingDays(startDate, durationDays - 1);
    },
    [addWorkingDays]
  );

  /**
   * Calculate duration given start and end dates
   */
  const calculateDuration = useCallback(
    (startDate: Date, endDate: Date): number => {
      return Math.max(1, calculateWorkingDays(startDate, endDate));
    },
    [calculateWorkingDays]
  );

  /**
   * Get next working day (or same day if already working)
   */
  const getNextWorkingDay = useCallback(
    (date: Date): Date => {
      const result = new Date(date);
      result.setHours(0, 0, 0, 0);

      while (!isWorkingDay(result)) {
        result.setDate(result.getDate() + 1);
      }

      return result;
    },
    [isWorkingDay]
  );

  /**
   * Get previous working day (or same day if already working)
   */
  const getPreviousWorkingDay = useCallback(
    (date: Date): Date => {
      const result = new Date(date);
      result.setHours(0, 0, 0, 0);

      while (!isWorkingDay(result)) {
        result.setDate(result.getDate() - 1);
      }

      return result;
    },
    [isWorkingDay]
  );

  /**
   * Get all non-working days in a date range
   */
  const getNonWorkingDays = useCallback(
    (startDate: Date, endDate: Date): Date[] => {
      const nonWorkingDays: Date[] = [];
      const current = new Date(startDate);
      current.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);

      while (current <= end) {
        if (!isWorkingDay(current)) {
          nonWorkingDays.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
      }

      return nonWorkingDays;
    },
    [isWorkingDay]
  );

  return {
    isWorkingDay,
    getWorkHours,
    calculateWorkingDays,
    calculateWorkHours,
    addWorkingDays,
    subtractWorkingDays,
    workHoursToDuration,
    durationToWorkHours,
    calculateEndDate,
    calculateDuration,
    getNextWorkingDay,
    getPreviousWorkingDay,
    getNonWorkingDays,
    hoursPerDay: calendar?.work_hours.hours_per_day || 8,
  };
}
