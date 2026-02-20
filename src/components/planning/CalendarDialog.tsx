import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, Plus, Trash2, Loader2, Clock, Sun } from 'lucide-react';
import type { ProjectCalendar, CalendarException, WorkingDays, WorkHours } from '@/hooks/useCalendars';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

interface CalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendars: ProjectCalendar[];
  selectedCalendar: ProjectCalendar | null;
  exceptions: CalendarException[];
  onSelectCalendar: (calendarId: string) => void;
  onSave: (calendar: Partial<ProjectCalendar>) => Promise<void>;
  onCreateCalendar: (calendar: Omit<ProjectCalendar, 'id' | 'created_at'>) => Promise<void>;
  onDeleteCalendar: (id: string) => Promise<void>;
  onAddException: (exception: Omit<CalendarException, 'id' | 'created_at'>) => Promise<void>;
  onRemoveException: (id: string) => Promise<void>;
  isSaving?: boolean;
  projectId: string;
}

const dayLabels: { key: keyof WorkingDays; label: string; short: string }[] = [
  { key: 'mon', label: 'Monday', short: 'Mon' },
  { key: 'tue', label: 'Tuesday', short: 'Tue' },
  { key: 'wed', label: 'Wednesday', short: 'Wed' },
  { key: 'thu', label: 'Thursday', short: 'Thu' },
  { key: 'fri', label: 'Friday', short: 'Fri' },
  { key: 'sat', label: 'Saturday', short: 'Sat' },
  { key: 'sun', label: 'Sunday', short: 'Sun' },
];

export function CalendarDialog({
  open,
  onOpenChange,
  calendars,
  selectedCalendar,
  exceptions,
  onSelectCalendar,
  onSave,
  onCreateCalendar,
  onDeleteCalendar,
  onAddException,
  onRemoveException,
  isSaving = false,
  projectId,
}: CalendarDialogProps) {
  const [formData, setFormData] = useState<Partial<ProjectCalendar>>({});
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [newException, setNewException] = useState({
    name: '',
    startDate: new Date(),
    endDate: new Date(),
    type: 'holiday' as 'holiday' | 'working',
  });
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Reset form when calendar changes
  useEffect(() => {
    setFormData({});
  }, [selectedCalendar?.id]);

  const merged = selectedCalendar ? { ...selectedCalendar, ...formData } : null;

  const handleDayToggle = (day: keyof WorkingDays) => {
    if (!merged) return;
    const currentDays = formData.working_days || merged.working_days;
    setFormData(prev => ({
      ...prev,
      working_days: { ...currentDays, [day]: !currentDays[day] },
    }));
  };

  const handleWorkHoursChange = (field: 'start' | 'end' | 'hours_per_day', value: string | number) => {
    if (!merged) return;
    const currentHours = formData.work_hours || merged.work_hours;
    setFormData(prev => ({
      ...prev,
      work_hours: { ...currentHours, [field]: value },
    }));
  };

  const handleSave = async () => {
    if (Object.keys(formData).length > 0) {
      await onSave(formData);
      setFormData({});
    }
    onOpenChange(false);
  };

  const handleCreateCalendar = async () => {
    if (!newCalendarName.trim()) return;

    const defaultWorkingDays: WorkingDays = {
      mon: true,
      tue: true,
      wed: true,
      thu: true,
      fri: true,
      sat: false,
      sun: false,
    };

    const defaultWorkHours: WorkHours = {
      start: '09:00',
      end: '17:00',
      hours_per_day: 8,
    };

    await onCreateCalendar({
      project_id: projectId,
      name: newCalendarName,
      is_default: calendars.length === 0,
      working_days: defaultWorkingDays,
      work_hours: defaultWorkHours,
    });

    setNewCalendarName('');
    setIsCreatingNew(false);
  };

  const handleDeleteCalendar = async () => {
    if (!selectedCalendar || selectedCalendar.is_default) return;
    if (await confirm(`Delete calendar "${selectedCalendar.name}"?`, { confirmLabel: 'Delete', variant: 'destructive' })) {
      await onDeleteCalendar(selectedCalendar.id);
    }
  };

  const handleAddException = async () => {
    if (!selectedCalendar || !newException.name) return;

    await onAddException({
      calendar_id: selectedCalendar.id,
      name: newException.name,
      exception_type: newException.type,
      start_date: newException.startDate.toISOString().split('T')[0],
      end_date: newException.endDate.toISOString().split('T')[0],
      work_hours: null,
    });

    setNewException({
      name: '',
      startDate: new Date(),
      endDate: new Date(),
      type: 'holiday',
    });
  };

  const countWorkingDays = (days: WorkingDays) => {
    return Object.values(days).filter(Boolean).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Project Calendars
          </DialogTitle>
          <DialogDescription>
            Manage working days, hours, and exceptions for scheduling calculations.
          </DialogDescription>
        </DialogHeader>

        {/* Calendar Selector */}
        <div className="flex items-center gap-2 py-2 border-b">
          <Label className="text-sm font-medium">Calendar:</Label>
          {isCreatingNew ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="New calendar name"
                value={newCalendarName}
                onChange={(e) => setNewCalendarName(e.target.value)}
                className="h-8"
                autoFocus
              />
              <Button size="sm" onClick={handleCreateCalendar} disabled={!newCalendarName.trim()}>
                Create
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsCreatingNew(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <Select
                value={selectedCalendar?.id || ''}
                onValueChange={onSelectCalendar}
              >
                <SelectTrigger className="w-48 h-8">
                  <SelectValue placeholder="Select calendar" />
                </SelectTrigger>
                <SelectContent>
                  {calendars.map((cal) => (
                    <SelectItem key={cal.id} value={cal.id}>
                      <div className="flex items-center gap-2">
                        {cal.name}
                        {cal.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => setIsCreatingNew(true)}>
                <Plus className="h-4 w-4" />
              </Button>
              {selectedCalendar && !selectedCalendar.is_default && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-destructive"
                  onClick={handleDeleteCalendar}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>

        {merged ? (
          <Tabs defaultValue="schedule" className="mt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="schedule" className="gap-1">
                <Clock className="h-3.5 w-3.5" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="exceptions" className="gap-1">
                <Sun className="h-3.5 w-3.5" />
                Exceptions
              </TabsTrigger>
              <TabsTrigger value="summary" className="gap-1">
                Summary
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-4 mt-4">
              <div>
                <Label>Calendar Name</Label>
                <Input
                  value={merged.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label className="mb-2 block">Working Days</Label>
                <div className="flex gap-2">
                  {dayLabels.map(({ key, short }) => (
                    <button
                      key={key}
                      onClick={() => handleDayToggle(key)}
                      className={cn(
                        'h-10 w-10 rounded-full text-xs font-medium transition-colors',
                        merged.working_days[key]
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {short}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {countWorkingDays(merged.working_days)} working days per week
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={merged.work_hours.start}
                    onChange={(e) => handleWorkHoursChange('start', e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={merged.work_hours.end}
                    onChange={(e) => handleWorkHoursChange('end', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Hours/Day</Label>
                  <Input
                    type="number"
                    value={merged.work_hours.hours_per_day}
                    onChange={(e) => handleWorkHoursChange('hours_per_day', parseFloat(e.target.value) || 8)}
                    min={1}
                    max={24}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={merged.is_default}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_default: v }))}
                />
                <Label>Set as default calendar</Label>
              </div>
            </TabsContent>

            <TabsContent value="exceptions" className="space-y-4 mt-4">
              <div className="space-y-2">
                {exceptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No exceptions defined. Add holidays or special working days.
                  </p>
                ) : (
                  exceptions.map(ex => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={ex.exception_type === 'holiday' ? 'destructive' : 'default'}>
                          {ex.exception_type === 'holiday' ? 'Non-working' : 'Working'}
                        </Badge>
                        <span className="text-sm font-medium">{ex.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(ex.start_date), 'MMM d')}
                          {ex.start_date !== ex.end_date && ` - ${format(new Date(ex.end_date), 'MMM d')}`}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="iconXs"
                        onClick={() => onRemoveException(ex.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                <Label>Add Exception</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Exception name (e.g., Christmas)"
                    value={newException.name}
                    onChange={(e) => setNewException(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newException.type === 'working'}
                      onCheckedChange={(v) => setNewException(prev => ({ ...prev, type: v ? 'working' : 'holiday' }))}
                    />
                    <Label className="text-xs">Working day</Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {format(newException.startDate, 'PP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newException.startDate}
                        onSelect={(date) => date && setNewException(prev => ({ ...prev, startDate: date }))}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {format(newException.endDate, 'PP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newException.endDate}
                        onSelect={(date) => date && setNewException(prev => ({ ...prev, endDate: date }))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button
                  onClick={handleAddException}
                  disabled={!newException.name}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exception
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="summary" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Working Days/Week</div>
                  <div className="text-2xl font-bold">{countWorkingDays(merged.working_days)}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Hours/Day</div>
                  <div className="text-2xl font-bold">{merged.work_hours.hours_per_day}h</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Hours/Week</div>
                  <div className="text-2xl font-bold">
                    {countWorkingDays(merged.working_days) * merged.work_hours.hours_per_day}h
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Exceptions</div>
                  <div className="text-2xl font-bold">{exceptions.length}</div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium mb-2">Work Schedule</div>
                <div className="text-sm text-muted-foreground">
                  {merged.work_hours.start} – {merged.work_hours.end}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {dayLabels
                    .filter(d => merged.working_days[d.key])
                    .map(d => d.label)
                    .join(', ')}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto opacity-50 mb-4" />
            <p>No calendars found. Create one to get started.</p>
            <Button className="mt-4" onClick={() => setIsCreatingNew(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Calendar
            </Button>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !merged}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ConfirmDialog />
  );
}
