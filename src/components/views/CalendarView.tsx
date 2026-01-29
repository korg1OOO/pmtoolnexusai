import React, { useState, useMemo, useCallback } from 'react';
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
  parseISO,
  isWithinInterval,
  addMinutes,
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
  GripVertical,
  AlertTriangle,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMeetings, MeetingWithRelations } from '@/hooks/useMeetings';
import { useProjectContext } from '@/contexts/ProjectContext';
import { MeetingCreationDialog } from '@/components/meetings/MeetingCreationDialog';
import { toast } from 'sonner';

// Helper function to check for time conflicts
function checkTimeConflict(
  meeting: CalendarMeeting,
  targetDate: Date,
  existingMeetings: CalendarMeeting[]
): CalendarMeeting[] {
  const meetingsOnTargetDate = existingMeetings.filter(
    (m) => isSameDay(m.date, targetDate) && m.id !== meeting.id
  );

  if (meetingsOnTargetDate.length === 0) return [];

  // Parse meeting times
  const [meetingStartHour, meetingStartMin] = meeting.startTime.split(':').map(Number);
  const meetingStart = addMinutes(startOfDay(targetDate), meetingStartHour * 60 + meetingStartMin);
  
  let meetingEnd: Date;
  if (meeting.endTime) {
    const [meetingEndHour, meetingEndMin] = meeting.endTime.split(':').map(Number);
    meetingEnd = addMinutes(startOfDay(targetDate), meetingEndHour * 60 + meetingEndMin);
  } else {
    // Default to 1 hour if no end time
    meetingEnd = addMinutes(meetingStart, 60);
  }

  // Check for overlaps
  const conflicts = meetingsOnTargetDate.filter((existing) => {
    const [existingStartHour, existingStartMin] = existing.startTime.split(':').map(Number);
    const existingStart = addMinutes(startOfDay(targetDate), existingStartHour * 60 + existingStartMin);
    
    let existingEnd: Date;
    if (existing.endTime) {
      const [existingEndHour, existingEndMin] = existing.endTime.split(':').map(Number);
      existingEnd = addMinutes(startOfDay(targetDate), existingEndHour * 60 + existingEndMin);
    } else {
      existingEnd = addMinutes(existingStart, 60);
    }

    // Check if times overlap
    return (
      (meetingStart >= existingStart && meetingStart < existingEnd) ||
      (meetingEnd > existingStart && meetingEnd <= existingEnd) ||
      (meetingStart <= existingStart && meetingEnd >= existingEnd)
    );
  });

  return conflicts;
}

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

// Meeting event component for calendar cells with drag support
function MeetingEvent({
  meeting,
  compact = false,
  onClick,
  onDragStart,
  isDragging = false,
}: {
  meeting: CalendarMeeting;
  compact?: boolean;
  onClick: (meeting: CalendarMeeting) => void;
  onDragStart?: (e: React.DragEvent, meeting: CalendarMeeting) => void;
  isDragging?: boolean;
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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('meetingId', meeting.id);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) {
      onDragStart(e, meeting);
    }
  };

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            draggable
            onDragStart={handleDragStart}
            onClick={(e) => {
              e.stopPropagation();
              onClick(meeting);
            }}
            className={cn(
              'text-xs px-1.5 py-0.5 rounded truncate cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02]',
              'border-l-2',
              statusColors[meeting.status] || 'border-l-primary',
              typeColors[meeting.type] || 'bg-primary/20 text-primary',
              isDragging && 'opacity-50 ring-2 ring-primary'
            )}
          >
            <span className="flex items-center gap-1">
              <GripVertical className="h-2.5 w-2.5 shrink-0 opacity-40" />
              {meeting.isRecurring && <Repeat className="h-2.5 w-2.5 shrink-0" />}
              <span className="truncate">{meeting.startTime.slice(0, 5)} {meeting.title}</span>
            </span>
          </div>
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
            <p className="text-xs text-primary mt-1">Drag to reschedule</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onClick(meeting)}
      className={cn(
        'p-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01]',
        'border-l-4',
        statusColors[meeting.status] || 'border-l-primary',
        'bg-card hover:bg-muted/50',
        isDragging && 'opacity-50 ring-2 ring-primary'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <GripVertical className="h-3 w-3 shrink-0 opacity-40" />
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
    </div>
  );
}

// Day cell for month view with drop support
function DayCell({
  date,
  meetings,
  currentMonth,
  selectedDate,
  onSelectDate,
  onSelectMeeting,
  onDragStart,
  onDrop,
  dragOverDate,
  onDragOver,
  onDragLeave,
  draggingMeetingId,
}: {
  date: Date;
  meetings: CalendarMeeting[];
  currentMonth: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onSelectMeeting: (meeting: CalendarMeeting) => void;
  onDragStart: (e: React.DragEvent, meeting: CalendarMeeting) => void;
  onDrop: (e: React.DragEvent, date: Date) => void;
  dragOverDate: Date | null;
  onDragOver: (e: React.DragEvent, date: Date) => void;
  onDragLeave: () => void;
  draggingMeetingId: string | null;
}) {
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isSelected = selectedDate && isSameDay(date, selectedDate);
  const isTodayDate = isToday(date);
  const isDragOver = dragOverDate && isSameDay(date, dragOverDate);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(e, date);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver(e, date);
  };

  return (
    <div
      onClick={() => onSelectDate(date)}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      className={cn(
        'min-h-[100px] p-1.5 border-r border-b cursor-pointer transition-all',
        !isCurrentMonth && 'bg-muted/20 text-muted-foreground',
        isSelected && 'bg-primary/5 ring-1 ring-primary/30',
        isDragOver && 'bg-primary/10 ring-2 ring-primary ring-dashed'
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
            onDragStart={onDragStart}
            isDragging={draggingMeetingId === meeting.id}
          />
        ))}
      </div>
    </div>
  );
}

// Week/Day view time grid with drag-and-drop support
function TimeGrid({
  dates,
  meetings,
  onSelectMeeting,
  onDragStart,
  onDrop,
  dragOverDate,
  dragOverHour,
  onDragOver,
  onDragLeave,
  draggingMeetingId,
}: {
  dates: Date[];
  meetings: CalendarMeeting[];
  onSelectMeeting: (meeting: CalendarMeeting) => void;
  onDragStart: (e: React.DragEvent, meeting: CalendarMeeting) => void;
  onDrop: (e: React.DragEvent, date: Date, hour?: number) => void;
  dragOverDate: Date | null;
  dragOverHour: number | null;
  onDragOver: (e: React.DragEvent, date: Date, hour?: number) => void;
  onDragLeave: () => void;
  draggingMeetingId: string | null;
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
              const isDragOver = dragOverDate && isSameDay(date, dragOverDate) && dragOverHour === hour;
              
              return (
                <div
                  key={hour}
                  onDrop={(e) => {
                    e.preventDefault();
                    onDrop(e, date, hour);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    onDragOver(e, date, hour);
                  }}
                  onDragLeave={onDragLeave}
                  className={cn(
                    'h-12 border-b px-1 py-0.5 transition-colors',
                    hour >= 9 && hour < 18 ? 'bg-background' : 'bg-muted/20',
                    isDragOver && 'bg-primary/10 ring-2 ring-primary ring-inset'
                  )}
                >
                  {hourMeetings.map((meeting) => (
                    <MeetingEvent
                      key={meeting.id}
                      meeting={meeting}
                      compact
                      onClick={onSelectMeeting}
                      onDragStart={onDragStart}
                      isDragging={draggingMeetingId === meeting.id}
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
  const { meetings, isLoading, createMeeting, addParticipant, addAgendaItem, updateMeeting } = useMeetings(projectId);

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<CalendarMeeting | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Drag-and-drop state
  const [draggingMeetingId, setDraggingMeetingId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  
  // Conflict detection state
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<{
    meetingId: string;
    targetDate: Date;
    targetHour?: number;
    conflicts: CalendarMeeting[];
  } | null>(null);

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

  // Drag-and-drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, meeting: CalendarMeeting) => {
    setDraggingMeetingId(meeting.id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, date: Date, hour?: number) => {
    setDragOverDate(date);
    setDragOverHour(hour ?? null);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverDate(null);
    setDragOverHour(null);
  }, []);

  // Execute the actual meeting move
  const executeMove = useCallback(async (
    meetingId: string,
    targetDate: Date,
    targetHour?: number
  ) => {
    const meeting = calendarMeetings.find((m) => m.id === meetingId);
    if (!meeting) return;

    try {
      const updates: Record<string, string> = {
        date: format(targetDate, 'yyyy-MM-dd'),
      };

      // If dropped on a specific hour (Week/Day view), update the time
      if (targetHour !== undefined) {
        const originalStartParts = meeting.startTime.split(':');
        const originalEndParts = meeting.endTime?.split(':');
        
        // Calculate duration to preserve it
        const originalStartMinutes = parseInt(originalStartParts[0]) * 60 + parseInt(originalStartParts[1] || '0');
        const duration = meeting.endTime 
          ? (parseInt(originalEndParts![0]) * 60 + parseInt(originalEndParts![1] || '0')) - originalStartMinutes
          : 60;

        const newStartTime = `${targetHour.toString().padStart(2, '0')}:00:00`;
        const newEndHour = targetHour + Math.floor(duration / 60);
        const newEndMin = duration % 60;
        const newEndTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMin.toString().padStart(2, '0')}:00`;

        updates.start_time = newStartTime;
        updates.end_time = newEndTime;
      }

      await updateMeeting(meetingId, updates);
      
      const timeChange = targetHour !== undefined 
        ? ` at ${format(new Date().setHours(targetHour, 0), 'h:mm a')}`
        : '';
      toast.success(`"${meeting.title}" moved to ${format(targetDate, 'MMM d, yyyy')}${timeChange}`);
    } catch (error) {
      toast.error('Failed to reschedule meeting');
    }
  }, [calendarMeetings, updateMeeting]);

  const handleDrop = useCallback(async (e: React.DragEvent, targetDate: Date, targetHour?: number) => {
    e.preventDefault();
    const meetingId = e.dataTransfer.getData('meetingId');
    
    if (meetingId && draggingMeetingId) {
      const meeting = calendarMeetings.find((m) => m.id === meetingId);
      if (meeting) {
        const isSameDateAndTime = isSameDay(meeting.date, targetDate) && 
          (targetHour === undefined || parseInt(meeting.startTime.split(':')[0]) === targetHour);
        
        if (!isSameDateAndTime) {
          // Check for conflicts
          const conflicts = checkTimeConflict(meeting, targetDate, calendarMeetings);
          
          if (conflicts.length > 0) {
            // Show conflict dialog
            setPendingDrop({
              meetingId,
              targetDate,
              targetHour,
              conflicts,
            });
            setConflictDialogOpen(true);
          } else {
            // No conflicts, proceed with move
            await executeMove(meetingId, targetDate, targetHour);
          }
        }
      }
    }
    
    setDraggingMeetingId(null);
    setDragOverDate(null);
    setDragOverHour(null);
  }, [draggingMeetingId, calendarMeetings, executeMove]);

  // Handle conflict dialog confirmation
  const handleConfirmConflictMove = useCallback(async () => {
    if (pendingDrop) {
      await executeMove(pendingDrop.meetingId, pendingDrop.targetDate, pendingDrop.targetHour);
    }
    setConflictDialogOpen(false);
    setPendingDrop(null);
  }, [pendingDrop, executeMove]);

  const handleCancelConflictMove = useCallback(() => {
    setConflictDialogOpen(false);
    setPendingDrop(null);
  }, []);

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
                  onDragStart={handleDragStart}
                  onDrop={handleDrop}
                  dragOverDate={dragOverDate}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  draggingMeetingId={draggingMeetingId}
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
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              dragOverDate={dragOverDate}
              dragOverHour={dragOverHour}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              draggingMeetingId={draggingMeetingId}
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

      {/* Conflict Warning Dialog */}
      <AlertDialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Meeting Conflict Detected
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Moving this meeting will create a time conflict with the following meeting(s):
                </p>
                <div className="space-y-2">
                  {pendingDrop?.conflicts.map((conflict) => (
                    <div
                      key={conflict.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">{conflict.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {conflict.startTime.slice(0, 5)} - {conflict.endTime?.slice(0, 5) || 'TBD'}
                        </p>
                      </div>
                      <Badge variant={conflict.type === 'online' ? 'info' : 'secondary'}>
                        {conflict.type}
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Do you want to proceed with rescheduling anyway?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConflictMove}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmConflictMove}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              Move Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
