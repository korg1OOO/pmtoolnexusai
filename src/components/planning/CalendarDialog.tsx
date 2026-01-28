import React, { useState } from 'react';
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
import { Calendar as CalendarIcon, Plus, Trash2, Loader2 } from 'lucide-react';
import type { ProjectCalendar, CalendarException, WorkingDays } from '@/hooks/useCalendars';

interface CalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendar: ProjectCalendar | null;
  exceptions: CalendarException[];
  onSave: (calendar: Partial<ProjectCalendar>) => Promise<void>;
  onAddException: (exception: Omit<CalendarException, 'id' | 'created_at'>) => Promise<void>;
  onRemoveException: (id: string) => Promise<void>;
  isSaving?: boolean;
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
  calendar,
  exceptions,
  onSave,
  onAddException,
  onRemoveException,
  isSaving = false,
}: CalendarDialogProps) {
  const [formData, setFormData] = useState<Partial<ProjectCalendar>>({});
  const [newException, setNewException] = useState({
    name: '',
    startDate: new Date(),
    endDate: new Date(),
    type: 'holiday' as 'holiday' | 'working',
  });

  const merged = calendar ? { ...calendar, ...formData } : null;

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
    }
    onOpenChange(false);
  };

  const handleAddException = async () => {
    if (!calendar || !newException.name) return;
    
    await onAddException({
      calendar_id: calendar.id,
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

  if (!merged) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Project Calendar</DialogTitle>
          <DialogDescription>
            Configure working days, hours, and exceptions for scheduling.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="schedule" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">Work Schedule</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
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
                  No exceptions defined
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
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Calendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
