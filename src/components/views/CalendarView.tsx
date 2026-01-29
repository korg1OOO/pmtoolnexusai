import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfDay,
  endOfDay,
  addDays,
} from 'date-fns';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Video,
  MapPin,
  Users,
  Clock,
  Repeat,
  CalendarDays,
  List,
  Plus,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMeetings, MeetingWithRelations } from '@/hooks/useMeetings';
import { useProjectContext } from '@/contexts/ProjectContext';
import { MeetingCreationDialog } from '@/components/meetings/MeetingCreationDialog';

type ViewMode = 'month' | 'week' | 'day';

interface CalendarMeeting {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string | null;
  type: string;
  status: string;
  isRecurring: boolean;
  recurringParentId: string | null;
  participants: { id: string; name: string }[];
  location: string | null;
  meetingLink: string | null;
}

function mapToCalendarMeeting(meeting: MeetingWithRelations): CalendarMeeting {
  return {
    id: meeting.id,
    title: meeting.title,
    date: new Date(meeting.date),
    startTime: meeting.start_time,
    endTime: meeting.end_time,
    type: meeting.meeting_type,
    status: meeting.status,
    isRecurring: !!meeting.recurring_parent_id || !!meeting.recurring_schedule,
    recurringParentId: meeting.recurring_parent_id,
    participants: (meeting.meeting_participants || []).map((p) => ({
      id: p.id,
      name: p.name,
    })),
    location: meeting.location,
    meetingLink: meeting.meeting_link,
  };
}

// Meeting event component for calendar cells
function MeetingEvent({
  meeting,
  compact = false,
  onClick,
}: {
  meeting: CalendarMeeting;
  compact?: boolean;
  onClick: (meeting: CalendarMeeting) => void;
}) {
  const typeColors: Record<string, string> = {
    online: 'bg-info/20 text-info border-info/30',
    'in-person': 'bg-warning/20 text-warning border-warning/30',
    offline: 'bg-muted text-muted-foreground border-muted-foreground/30',
  };

  const statusColors: Record<string, string> = {
    scheduled: 'border-l-primary',
    'in-progress': 'border-l-success',
    completed: 'border-l-muted-foreground',
    cancelled: 'border-l-destructive',
  };

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={(e) => {
              e.stopPropagation();
              onClick(meeting);
            }}
            className={cn(
              'text-xs px-1.5 py-0.5 rounded truncate cursor-pointer transition-colors',
              'border-l-2',
              statusColors[meeting.status] || 'border-l-primary',
              typeColors[meeting.type] || 'bg-primary/20 text-primary'
            )}
          >
            <span className="flex items-center gap-1">
              {meeting.isRecurring && <Repeat className="h-2.5 w-2.5 shrink-0" />}
              <span className="truncate">{meeting.startTime.slice(0, 5)} {meeting.title}</span>
            </span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{meeting.title}</p>
            <p className="text-xs text-muted-foreground">
              {meeting.startTime} - {meeting.endTime || 'TBD'}
            </p>
            {meeting.participants.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {meeting.participants.length} participant(s)
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={() => onClick(meeting)}
      className={cn(
        'p-2 rounded-lg border cursor-pointer transition-all',
        'border-l-4',
        statusColors[meeting.status] || 'border-l-primary',
        'bg-card hover:bg-muted/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {meeting.isRecurring && (
              <Repeat className="h-3 w-3 text-primary shrink-0" />
            )}
            <span className="font-medium text-sm truncate">{meeting.title}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {meeting.startTime.slice(0, 5)} - {meeting.endTime?.slice(0, 5) || 'TBD'}
          </div>
          {meeting.participants.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              {meeting.participants.slice(0, 3).map((p) => (
                <Avatar key={p.id} className="h-5 w-5">
                  <AvatarFallback className="text-[8px]">
                    {p.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              ))}
              {meeting.participants.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{meeting.participants.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        <Badge variant={meeting.type === 'online' ? 'info' : 'secondary'} className="shrink-0 text-xs">
          {meeting.type === 'online' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
        </Badge>
      </div>
    </motion.div>
  );
}

// Day cell for month view
function DayCell({
  date,
  meetings,
  currentMonth,
  selectedDate,
  onSelectDate,
  onSelectMeeting,
}: {
  date: Date;
  meetings: CalendarMeeting[];
  currentMonth: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onSelectMeeting: (meeting: CalendarMeeting) => void;
}) {
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isSelected = selectedDate && isSameDay(date, selectedDate);
  const isTodayDate = isToday(date);

  return (
    <motion.div
      whileHover={{ backgroundColor: 'hsl(var(--muted) / 0.5)' }}
      onClick={() => onSelectDate(date)}
      className={cn(
        'min-h-[100px] p-1.5 border-r border-b cursor-pointer transition-colors',
        !isCurrentMonth && 'bg-muted/20 text-muted-foreground',
        isSelected && 'bg-primary/5 ring-1 ring-primary/30'
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full',
            isTodayDate && 'bg-primary text-primary-foreground',
            !isTodayDate && isSelected && 'bg-primary/20'
          )}
        >
          {format(date, 'd')}
        </span>
        {meetings.length > 3 && (
          <span className="text-xs text-muted-foreground">
            +{meetings.length - 3} more
          </span>
        )}
      </div>
      <div className="space-y-0.5">
        {meetings.slice(0, 3).map((meeting) => (
          <MeetingEvent
            key={meeting.id}
            meeting={meeting}
            compact
            onClick={onSelectMeeting}
          />
        ))}
      </div>
    </motion.div>
  );
}

// Week/Day view time grid
function TimeGrid({
  dates,
  meetings,
  onSelectMeeting,
}: {
  dates: Date[];
  meetings: CalendarMeeting[];
  onSelectMeeting: (meeting: CalendarMeeting) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getMeetingsForDateHour = (date: Date, hour: number) => {
    return meetings.filter((m) => {
      if (!isSameDay(m.date, date)) return false;
      const meetingHour = parseInt(m.startTime.split(':')[0], 10);
      return meetingHour === hour;
    });
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Time labels */}
      <div className="w-16 border-r shrink-0">
        {hours.map((hour) => (
          <div key={hour} className="h-12 px-2 py-1 text-xs text-muted-foreground border-b">
            {format(new Date().setHours(hour, 0), 'ha')}
          </div>
        ))}
      </div>

      {/* Day columns */}
      <div className="flex-1 flex overflow-x-auto">
        {dates.map((date) => (
          <div
            key={date.toISOString()}
            className={cn(
              'flex-1 min-w-[120px] border-r',
              dates.length === 1 && 'min-w-full'
            )}
          >
            {/* Day header */}
            <div
              className={cn(
                'sticky top-0 bg-background z-10 p-2 border-b text-center',
                isToday(date) && 'bg-primary/5'
              )}
            >
              <div className="text-xs text-muted-foreground">
                {format(date, 'EEE')}
              </div>
              <div
                className={cn(
                  'text-lg font-semibold',
                  isToday(date) &&
                    'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                )}
              >
                {format(date, 'd')}
              </div>
            </div>

            {/* Hour slots */}
            {hours.map((hour) => {
              const hourMeetings = getMeetingsForDateHour(date, hour);
              return (
                <div
                  key={hour}
                  className={cn(
                    'h-12 border-b px-1 py-0.5',
                    hour >= 9 && hour < 18 ? 'bg-background' : 'bg-muted/20'
                  )}
                >
                  {hourMeetings.map((meeting) => (
                    <MeetingEvent
                      key={meeting.id}
                      meeting={meeting}
                      compact
                      onClick={onSelectMeeting}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// Selected meeting details panel
function MeetingDetailsPanel({
  meeting,
  onClose,
}: {
  meeting: CalendarMeeting | null;
  onClose: () => void;
}) {
  if (!meeting) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-80 border-l bg-muted/20 p-4"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {meeting.isRecurring && (
              <Badge variant="outline" className="text-xs">
                <Repeat className="h-3 w-3 mr-1" />
                Recurring
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-lg truncate">{meeting.title}</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span>{format(meeting.date, 'EEEE, MMMM d, yyyy')}</span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            {meeting.startTime} - {meeting.endTime || 'TBD'}
          </span>
        </div>

        {meeting.location && (
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{meeting.location}</span>
          </div>
        )}

        {meeting.meetingLink && (
          <div className="flex items-center gap-3 text-sm">
            <Video className="h-4 w-4 text-muted-foreground" />
            <a
              href={meeting.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline truncate"
            >
              Join Meeting
            </a>
          </div>
        )}

        {meeting.participants.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{meeting.participants.length} Participants</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {meeting.participants.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">
                      {p.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t space-y-2">
          <Button className="w-full" variant="default">
            <Video className="h-4 w-4 mr-2" />
            Join Meeting
          </Button>
          <Button className="w-full" variant="outline">
            View Details
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function CalendarView() {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const { meetings, isLoading, createMeeting, addParticipant, addAgendaItem } = useMeetings(projectId);

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<CalendarMeeting | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Map meetings to calendar format
  const calendarMeetings = useMemo(
    () => meetings.map(mapToCalendarMeeting),
    [meetings]
  );

  // Get dates for current view
  const viewDates = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart);
      const calendarEnd = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
      return [startOfDay(currentDate)];
    }
  }, [currentDate, viewMode]);

  // Get meetings for a specific date
  const getMeetingsForDate = (date: Date) => {
    return calendarMeetings.filter((m) => isSameDay(m.date, date));
  };

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleCreateMeeting = async (
    meeting: Parameters<typeof createMeeting>[0],
    participants: Parameters<typeof addParticipant>[0][],
    agendaItems: Parameters<typeof addAgendaItem>[0][]
  ) => {
    const created = await createMeeting(meeting);
    if (created) {
      for (const p of participants) {
        await addParticipant({ ...p, meeting_id: created.id });
      }
      for (const a of agendaItems) {
        await addAgendaItem({ ...a, meeting_id: created.id });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full p-6 gap-4">
        <div className="flex-1">
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              {viewMode === 'month'
                ? format(currentDate, 'MMMM yyyy')
                : viewMode === 'week'
                ? `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`
                : format(currentDate, 'EEEE, MMMM d, yyyy')}
            </h1>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Day
              </Button>
              <Button
                variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Meeting
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        {viewMode === 'month' ? (
          <div className="flex-1 overflow-auto">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b sticky top-0 bg-background z-10">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-medium text-muted-foreground border-r"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {viewDates.map((date) => (
                <DayCell
                  key={date.toISOString()}
                  date={date}
                  meetings={getMeetingsForDate(date)}
                  currentMonth={currentDate}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  onSelectMeeting={setSelectedMeeting}
                />
              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <TimeGrid
              dates={viewDates}
              meetings={calendarMeetings}
              onSelectMeeting={setSelectedMeeting}
            />
          </ScrollArea>
        )}
      </div>

      {/* Meeting Details Panel */}
      <AnimatePresence>
        {selectedMeeting && (
          <MeetingDetailsPanel
            meeting={selectedMeeting}
            onClose={() => setSelectedMeeting(null)}
          />
        )}
      </AnimatePresence>

      {/* Create Meeting Dialog */}
      <MeetingCreationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateMeeting={handleCreateMeeting}
        projectId={projectId}
      />
    </div>
  );
}
