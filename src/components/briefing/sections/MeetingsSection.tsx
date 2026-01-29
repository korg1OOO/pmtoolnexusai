import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, Users, Video, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: 'online' | 'in-person' | 'hybrid';
  location?: string;
  meetingLink?: string;
  participants: number;
  status: 'upcoming' | 'in-progress' | 'completed';
}

interface MeetingsSectionProps {
  meetings: Meeting[];
}

export function MeetingsSection({ meetings }: MeetingsSectionProps) {
  const getTypeIcon = (type: Meeting['type']) => {
    switch (type) {
      case 'online':
        return <Video className="h-4 w-4" />;
      case 'in-person':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Meeting['status']) => {
    switch (status) {
      case 'in-progress':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'upcoming':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400';
    }
  };

  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (meetings.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No meetings scheduled for today</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {meetings.map(meeting => (
        <Card
          key={meeting.id}
          className={cn(
            'p-3',
            meeting.status === 'in-progress' && 'border-green-500/50 bg-green-50/50 dark:bg-green-900/10'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm truncate">{meeting.title}</span>
                <Badge className={cn('text-xs', getStatusColor(meeting.status))}>
                  {meeting.status === 'in-progress' ? 'Now' : meeting.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                </span>
                <span className="flex items-center gap-1">
                  {getTypeIcon(meeting.type)}
                  {meeting.type}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {meeting.participants}
                </span>
              </div>
              {meeting.location && (
                <p className="text-xs text-muted-foreground mt-1">{meeting.location}</p>
              )}
            </div>
            {meeting.meetingLink && meeting.status !== 'completed' && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => window.open(meeting.meetingLink, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Join
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
