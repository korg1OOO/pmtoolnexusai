import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import type { Report } from './ReportCard';

interface ScheduleReportDialogProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleReportDialog({
  report,
  open,
  onOpenChange,
}: ScheduleReportDialogProps) {
  const [frequency, setFrequency] = useState<string>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState<string>('monday');
  const [time, setTime] = useState<string>('09:00');
  const [recipients, setRecipients] = useState<string>('');
  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);

  const handleSchedule = () => {
    toast.success(`Report "${report?.name}" scheduled successfully`);
    onOpenChange(false);
  };

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Report</DialogTitle>
          <DialogDescription>
            Configure automatic generation and distribution for "{report.name}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {frequency === 'weekly' && (
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Time</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Email Recipients</Label>
            <Input
              placeholder="Enter email addresses separated by commas"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Report will be sent as PDF attachment
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Label>Include in Report</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="executive-summary"
                checked={includeExecutiveSummary}
                onCheckedChange={(checked) =>
                  setIncludeExecutiveSummary(checked as boolean)
                }
              />
              <Label htmlFor="executive-summary" className="font-normal">
                Executive Summary
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="charts"
                checked={includeCharts}
                onCheckedChange={(checked) =>
                  setIncludeCharts(checked as boolean)
                }
              />
              <Label htmlFor="charts" className="font-normal">
                Charts and Visualizations
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSchedule}>Schedule Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
