import React, { useMemo } from 'react';
import { format, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface MeetingDate {
  date: Date;
  count: number;
}

interface MiniCalendarSidebarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  meetingDates: MeetingDate[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function MiniCalendarSidebar({
  selectedDate,
  onSelectDate,
  meetingDates,
  currentMonth,
  onMonthChange,
}: MiniCalendarSidebarProps) {
  // Generate calendar days for the current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Create a map for quick lookup of meeting counts by date
  const meetingCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    meetingDates.forEach((md) => {
      const key = format(md.date, 'yyyy-MM-dd');
      map.set(key, md.count);
    });
    return map;
  }, [meetingDates]);

  const getMeetingCount = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    return meetingCountByDate.get(key) || 0;
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Get upcoming meetings for the sidebar list
  const upcomingDates = useMemo(() => {
    const today = new Date();
    return meetingDates
      .filter((md) => md.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  }, [meetingDates]);

  return (
    <div className="w-64 border-l bg-muted/10 flex flex-col h-full">
      {/* Mini Calendar Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Quick Navigation
          </h3>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{format(currentMonth, 'MMMM yyyy')}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map((day, i) => (
            <div key={i} className="text-center text-xs text-muted-foreground font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date) => {
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isTodayDate = isToday(date);
            const meetingCount = getMeetingCount(date);

            return (
              <button
                key={date.toISOString()}
                onClick={() => onSelectDate(date)}
                className={cn(
                  'relative h-8 w-8 text-xs rounded-full transition-colors flex items-center justify-center',
                  !isCurrentMonth && 'text-muted-foreground/50',
                  isCurrentMonth && 'hover:bg-muted',
                  isTodayDate && 'bg-primary text-primary-foreground hover:bg-primary/90',
                  isSelected && !isTodayDate && 'bg-primary/20 ring-1 ring-primary',
                  meetingCount > 0 && !isTodayDate && !isSelected && 'font-semibold'
                )}
              >
                {format(date, 'd')}
                {meetingCount > 0 && (
                  <span
                    className={cn(
                      'absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full',
                      isTodayDate ? 'bg-primary-foreground' : 'bg-primary'
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b">
        <Button
          variant="outline"
          size="sm"
          className="w-full mb-2"
          onClick={() => onSelectDate(new Date())}
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => onSelectDate(null as any)} // Clear filter
        >
          Show All
        </Button>
      </div>

      {/* Upcoming Meetings */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 py-2 border-b">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            Upcoming Meetings
          </span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {upcomingDates.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No upcoming meetings
              </p>
            ) : (
              upcomingDates.map((md, i) => (
                <button
                  key={i}
                  onClick={() => onSelectDate(md.date)}
                  className={cn(
                    'w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors',
                    selectedDate && isSameDay(md.date, selectedDate) && 'bg-primary/10'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {isToday(md.date) ? 'Today' : format(md.date, 'EEE, MMM d')}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {md.count}
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
