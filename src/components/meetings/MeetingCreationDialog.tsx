import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus, X, Users, Clock, Video, MapPin, Repeat, Target, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { CreateMeetingInput, CreateAgendaItemInput, CreateParticipantInput } from '@/hooks/useMeetings';

const meetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  date: z.date({ required_error: 'Date is required' }),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().optional(),
  meetingType: z.enum(['online', 'in-person', 'offline']),
  sourceType: z.enum(['zoom', 'teams', 'meet', 'audio', 'manual']),
  meetingLink: z.string().optional(),
  location: z.string().optional(),
  purposeType: z.string().optional(),
  purposeDescription: z.string().optional(),
  recurringSchedule: z.enum(['none', 'daily', 'weekly', 'bi-weekly', 'monthly']).optional(),
  recurringEndDate: z.date().optional(),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

interface ParticipantInput {
  name: string;
  email: string;
  role: string;
}

interface AgendaItemInput {
  title: string;
  duration: number;
  presenterName: string;
}

interface MeetingCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string | null;
  onCreateMeeting: (
    meeting: CreateMeetingInput,
    participants: CreateParticipantInput[],
    agendaItems: CreateAgendaItemInput[]
  ) => Promise<void>;
}

export function MeetingCreationDialog({
  open,
  onOpenChange,
  projectId,
  onCreateMeeting,
}: MeetingCreationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participants, setParticipants] = useState<ParticipantInput[]>([]);
  const [agendaItems, setAgendaItems] = useState<AgendaItemInput[]>([]);
  const [expectedOutcomes, setExpectedOutcomes] = useState<string[]>([]);
  const [successCriteria, setSuccessCriteria] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState({ name: '', email: '', role: 'contributor' });
  const [newAgendaItem, setNewAgendaItem] = useState({ title: '', duration: 15, presenterName: '' });
  const [newOutcome, setNewOutcome] = useState('');
  const [newCriterion, setNewCriterion] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      meetingType: 'online',
      sourceType: 'teams',
      purposeType: 'status-update',
      recurringSchedule: 'none',
    },
  });

  const selectedDate = watch('date');
  const meetingType = watch('meetingType');
  const recurringSchedule = watch('recurringSchedule');
  const recurringEndDate = watch('recurringEndDate');

  const addParticipant = () => {
    if (newParticipant.name.trim()) {
      setParticipants([...participants, { ...newParticipant }]);
      setNewParticipant({ name: '', email: '', role: 'contributor' });
    }
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const addAgendaItem = () => {
    if (newAgendaItem.title.trim()) {
      setAgendaItems([...agendaItems, { ...newAgendaItem }]);
      setNewAgendaItem({ title: '', duration: 15, presenterName: '' });
    }
  };

  const removeAgendaItem = (index: number) => {
    setAgendaItems(agendaItems.filter((_, i) => i !== index));
  };

  const addOutcome = () => {
    if (newOutcome.trim()) {
      setExpectedOutcomes([...expectedOutcomes, newOutcome.trim()]);
      setNewOutcome('');
    }
  };

  const removeOutcome = (index: number) => {
    setExpectedOutcomes(expectedOutcomes.filter((_, i) => i !== index));
  };

  const addCriterion = () => {
    if (newCriterion.trim()) {
      setSuccessCriteria([...successCriteria, newCriterion.trim()]);
      setNewCriterion('');
    }
  };

  const removeCriterion = (index: number) => {
    setSuccessCriteria(successCriteria.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: MeetingFormData) => {
    setIsSubmitting(true);
    try {
      const meetingInput: CreateMeetingInput = {
        project_id: projectId || undefined,
        title: data.title,
        description: data.description,
        date: format(data.date, 'yyyy-MM-dd'),
        start_time: data.startTime,
        end_time: data.endTime,
        meeting_type: data.meetingType,
        source_type: data.sourceType,
        meeting_link: data.meetingLink,
        location: data.location,
        purpose_type: data.purposeType,
        purpose_description: data.purposeDescription,
        expected_outcomes: expectedOutcomes.length > 0 ? expectedOutcomes : undefined,
        success_criteria: successCriteria.length > 0 ? successCriteria : undefined,
        recurring_schedule: data.recurringSchedule || 'none',
        recurring_end_date: data.recurringEndDate ? format(data.recurringEndDate, 'yyyy-MM-dd') : undefined,
        status: 'scheduled',
      };

      const participantInputs: CreateParticipantInput[] = participants.map((p) => ({
        meeting_id: '', // Will be set after meeting creation
        name: p.name,
        email: p.email || undefined,
        role: p.role,
      }));

      const agendaInputs: CreateAgendaItemInput[] = agendaItems.map((a, index) => ({
        meeting_id: '', // Will be set after meeting creation
        title: a.title,
        duration_minutes: a.duration,
        presenter_name: a.presenterName || undefined,
        sort_order: index,
      }));

      await onCreateMeeting(meetingInput, participantInputs, agendaInputs);
      
      // Reset form
      reset();
      setParticipants([]);
      setAgendaItems([]);
      setExpectedOutcomes([]);
      setSuccessCriteria([]);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const purposeTypes = [
    { value: 'status-update', label: 'Status Update' },
    { value: 'decision', label: 'Decision Making' },
    { value: 'review', label: 'Review' },
    { value: 'planning', label: 'Planning' },
    { value: 'brainstorming', label: 'Brainstorming' },
    { value: 'kickoff', label: 'Kickoff' },
    { value: 'retrospective', label: 'Retrospective' },
    { value: 'other', label: 'Other' },
  ];

  const roleOptions = [
    { value: 'decision-maker', label: 'Decision Maker' },
    { value: 'contributor', label: 'Contributor' },
    { value: 'observer', label: 'Observer' },
    { value: 'approver', label: 'Approver' },
    { value: 'subject-matter-expert', label: 'Subject Matter Expert' },
  ];

  const recurringOptions = [
    { value: 'none', label: 'Does not repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Meeting</DialogTitle>
          <DialogDescription>
            Schedule a new meeting with participants and agenda items
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <form id="meeting-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Meeting Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="e.g., Sprint Planning Meeting"
                  className={cn(errors.title && 'border-destructive')}
                />
                {errors.title && (
                  <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Meeting purpose and context..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !selectedDate && 'text-muted-foreground',
                          errors.date && 'border-destructive'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setValue('date', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.date && (
                    <p className="text-xs text-destructive mt-1">{errors.date.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      {...register('startTime')}
                      className={cn(errors.startTime && 'border-destructive')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input id="endTime" type="time" {...register('endTime')} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Meeting Type</Label>
                  <Select
                    value={meetingType}
                    onValueChange={(value) => setValue('meetingType', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Online
                        </div>
                      </SelectItem>
                      <SelectItem value="in-person">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          In-Person
                        </div>
                      </SelectItem>
                      <SelectItem value="offline">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Offline/Async
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Platform</Label>
                  <Select
                    defaultValue="teams"
                    onValueChange={(value) => setValue('sourceType', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teams">Microsoft Teams</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="meet">Google Meet</SelectItem>
                      <SelectItem value="audio">Audio Only</SelectItem>
                      <SelectItem value="manual">Manual Entry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {meetingType === 'online' && (
                <div>
                  <Label htmlFor="meetingLink">Meeting Link</Label>
                  <Input
                    id="meetingLink"
                    {...register('meetingLink')}
                    placeholder="https://teams.microsoft.com/..."
                  />
                </div>
              )}

              {meetingType === 'in-person' && (
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    {...register('location')}
                    placeholder="Conference Room A, Building 1"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Purpose Type</Label>
                  <Select
                    defaultValue="status-update"
                    onValueChange={(value) => setValue('purposeType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {purposeTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="purposeDescription">Purpose Description</Label>
                  <Input
                    id="purposeDescription"
                    {...register('purposeDescription')}
                    placeholder="Brief purpose..."
                  />
                </div>
              </div>

              {/* Recurring Schedule */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-primary" />
                  <Label className="text-base font-semibold">Recurring Schedule</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Repeat</Label>
                    <Select
                      value={recurringSchedule || 'none'}
                      onValueChange={(value) => setValue('recurringSchedule', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {recurringOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {recurringSchedule && recurringSchedule !== 'none' && (
                    <div>
                      <Label>End Date (optional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !recurringEndDate && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {recurringEndDate ? format(recurringEndDate, 'PPP') : 'No end date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={recurringEndDate}
                            onSelect={(date) => setValue('recurringEndDate', date)}
                            disabled={(date) => selectedDate ? date < selectedDate : false}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              </div>

              {/* Expected Outcomes */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <Label className="text-base font-semibold">Expected Outcomes</Label>
                </div>

                {expectedOutcomes.length > 0 && (
                  <div className="space-y-2">
                    {expectedOutcomes.map((outcome, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded bg-muted/50"
                      >
                        <span className="text-sm">{outcome}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="iconXs"
                          onClick={() => removeOutcome(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Finalize Q1 budget allocation"
                    value={newOutcome}
                    onChange={(e) => setNewOutcome(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOutcome())}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addOutcome}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Success Criteria */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <Label className="text-base font-semibold">Success Criteria</Label>
                </div>

                {successCriteria.length > 0 && (
                  <div className="space-y-2">
                    {successCriteria.map((criterion, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded bg-muted/50"
                      >
                        <span className="text-sm">{criterion}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="iconXs"
                          onClick={() => removeCriterion(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., All stakeholders agree on timeline"
                    value={newCriterion}
                    onChange={(e) => setNewCriterion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCriterion())}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addCriterion}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Participants Section */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <Label className="text-base font-semibold">Participants</Label>
              </div>

              {participants.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {participants.map((p, index) => (
                    <Badge key={index} variant="secondary" className="gap-1 pr-1">
                      {p.name}
                      <span className="text-xs text-muted-foreground">({p.role})</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="iconXs"
                        onClick={() => removeParticipant(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Name"
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                  className="flex-1"
                />
                <Input
                  placeholder="Email (optional)"
                  value={newParticipant.email}
                  onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                  className="flex-1"
                />
                <Select
                  value={newParticipant.role}
                  onValueChange={(value) => setNewParticipant({ ...newParticipant, role: value })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={addParticipant}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Agenda Section */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <Label className="text-base font-semibold">Agenda Items</Label>
              </div>

              {agendaItems.length > 0 && (
                <div className="space-y-2">
                  {agendaItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                        <span className="font-medium text-sm">{item.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.duration} min
                        </Badge>
                        {item.presenterName && (
                          <span className="text-xs text-muted-foreground">
                            - {item.presenterName}
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="iconXs"
                        onClick={() => removeAgendaItem(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Agenda topic"
                  value={newAgendaItem.title}
                  onChange={(e) => setNewAgendaItem({ ...newAgendaItem, title: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Min"
                  value={newAgendaItem.duration}
                  onChange={(e) =>
                    setNewAgendaItem({ ...newAgendaItem, duration: parseInt(e.target.value) || 15 })
                  }
                  className="w-20"
                />
                <Input
                  placeholder="Presenter (optional)"
                  value={newAgendaItem.presenterName}
                  onChange={(e) =>
                    setNewAgendaItem({ ...newAgendaItem, presenterName: e.target.value })
                  }
                  className="w-40"
                />
                <Button type="button" variant="outline" size="icon" onClick={addAgendaItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="meeting-form" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Meeting'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
