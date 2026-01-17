import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Video,
  Users,
  MapPin,
  Clock,
  Plus,
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
  Target,
  Sparkles,
  Mic,
  MicOff,
  VideoIcon,
  VideoOff,
  Monitor,
  PhoneOff,
  Hand,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { mockMeetings } from '@/data/mockData';
import type { Meeting, AgendaItem, ActionItem } from '@/types/project';

interface MeetingCardProps {
  meeting: Meeting;
  onClick: () => void;
  isActive?: boolean;
}

function MeetingCard({ meeting, onClick, isActive }: MeetingCardProps) {
  const typeIcons = {
    online: <Video className="h-4 w-4" />,
    'in-person': <MapPin className="h-4 w-4" />,
    hybrid: <Users className="h-4 w-4" />,
  };

  const statusColors = {
    scheduled: 'bg-primary',
    'in-progress': 'bg-success animate-pulse',
    completed: 'bg-muted',
    cancelled: 'bg-destructive',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border cursor-pointer transition-all',
        isActive ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center bg-muted rounded-lg p-2 min-w-[50px]">
          <span className="text-xs text-muted-foreground">
            {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className="text-xl font-bold">{new Date(meeting.date).getDate()}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn('h-2 w-2 rounded-full', statusColors[meeting.status])} />
            <h3 className="font-medium truncate">{meeting.title}</h3>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {meeting.startTime} - {meeting.endTime}
            </div>
            <Badge variant={meeting.type === 'online' ? 'info' : meeting.type === 'hybrid' ? 'warning' : 'secondary'}>
              {typeIcons[meeting.type]}
              <span className="ml-1">{meeting.type}</span>
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            {meeting.participants.slice(0, 4).map((p) => (
              <Avatar key={p.id} className="h-6 w-6 border-2 border-background -ml-1 first:ml-0">
                <AvatarFallback className="text-[10px]">
                  {p.name.split(' ').map((n) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            ))}
            {meeting.participants.length > 4 && (
              <span className="text-xs text-muted-foreground ml-1">
                +{meeting.participants.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MeetingRoom({ meeting }: { meeting: Meeting }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);

  return (
    <div className="flex flex-col h-full">
      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-2 gap-2 p-4 bg-black/95 rounded-lg">
        {meeting.participants.slice(0, 4).map((participant, i) => (
          <div
            key={participant.id}
            className={cn(
              'relative bg-muted/20 rounded-lg flex items-center justify-center',
              i === 0 && 'col-span-2 row-span-1'
            )}
          >
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                {participant.name.split(' ').map((n) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
              <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                {participant.name}
              </span>
              {participant.status === 'accepted' && (
                <Mic className="h-3 w-3 text-white" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 p-4 bg-muted/30 rounded-b-lg">
        <Button
          variant={isMuted ? 'destructive' : 'secondary'}
          size="icon"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button
          variant={isVideoOn ? 'secondary' : 'destructive'}
          size="icon"
          onClick={() => setIsVideoOn(!isVideoOn)}
        >
          {isVideoOn ? <VideoIcon className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>
        <Button variant="secondary" size="icon">
          <Monitor className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon">
          <Hand className="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="icon">
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function MeetingsView() {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(mockMeetings[0]);
  const [notes, setNotes] = useState('');

  return (
    <div className="flex h-full">
      {/* Meeting List */}
      <div className="w-80 border-r p-4 space-y-3 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Meetings</h2>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>

        {mockMeetings.map((meeting) => (
          <MeetingCard
            key={meeting.id}
            meeting={meeting}
            onClick={() => setSelectedMeeting(meeting)}
            isActive={selectedMeeting?.id === meeting.id}
          />
        ))}
      </div>

      {/* Meeting Details */}
      {selectedMeeting ? (
        <div className="flex-1 flex">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{selectedMeeting.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {selectedMeeting.startTime} - {selectedMeeting.endTime}
                    </div>
                    <Badge variant={selectedMeeting.type === 'online' ? 'info' : 'secondary'}>
                      {selectedMeeting.type}
                    </Badge>
                  </div>
                </div>
                <Button variant="glow">
                  <Video className="h-4 w-4 mr-2" />
                  Join Meeting
                </Button>
              </div>

              {/* Meeting Room Preview */}
              {selectedMeeting.status === 'scheduled' && (
                <Card className="mb-6" variant="muted">
                  <CardContent className="p-4">
                    <div className="h-48 bg-black/90 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Video className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Meeting starts in 2 hours</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Tabs defaultValue="agenda" className="mt-6">
                <TabsList>
                  <TabsTrigger value="agenda">Agenda</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                  <TabsTrigger value="decisions">Decisions</TabsTrigger>
                </TabsList>

                <TabsContent value="agenda" className="mt-4">
                  <div className="space-y-3">
                    {selectedMeeting.agenda.map((item, index) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border',
                          item.completed ? 'bg-muted/30' : 'bg-card'
                        )}
                      >
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className={cn('font-medium', item.completed && 'line-through text-muted-foreground')}>
                            {item.title}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span>{item.duration} min</span>
                            {item.presenter && <span>• {item.presenter}</span>}
                          </div>
                        </div>
                        {item.completed && (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-4">
                  <Card>
                    <CardContent className="p-4">
                      <Textarea
                        placeholder="Start taking notes..."
                        value={notes || selectedMeeting.notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[300px] resize-none"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="actions" className="mt-4">
                  <div className="space-y-3">
                    {selectedMeeting.actionItems.map((action) => (
                      <div key={action.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                        <CheckCircle2 className={cn(
                          'h-5 w-5',
                          action.status === 'completed' ? 'text-success' : 'text-muted-foreground'
                        )} />
                        <div className="flex-1">
                          <p className="font-medium">{action.title}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span>{action.assignee}</span>
                            <span>•</span>
                            <span>Due: {new Date(action.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Badge variant={action.priority as any}>{action.priority}</Badge>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Action Item
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="decisions" className="mt-4">
                  <div className="space-y-3">
                    {selectedMeeting.decisions.map((decision, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                        <Target className="h-5 w-5 text-primary mt-0.5" />
                        <p>{decision}</p>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Decision
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* AI Panel */}
          <div className="w-80 border-l p-4 bg-muted/20">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">AI Assistant</h3>
            </div>

            <Card className="mb-4" variant="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Meeting Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  AI-generated summary will appear here during and after the meeting.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-4" variant="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Detected Risks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedMeeting.risks.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedMeeting.risks.map((risk, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No risks detected yet.</p>
                )}
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedMeeting.participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {p.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.role}</p>
                      </div>
                      <div className={cn(
                        'h-2 w-2 rounded-full',
                        p.status === 'accepted' ? 'bg-success' :
                        p.status === 'tentative' ? 'bg-warning' :
                        p.status === 'declined' ? 'bg-destructive' : 'bg-muted'
                      )} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Select a meeting to view details</p>
        </div>
      )}
    </div>
  );
}
