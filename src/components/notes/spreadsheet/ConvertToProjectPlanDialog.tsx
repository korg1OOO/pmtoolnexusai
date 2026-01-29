import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table2, Link2, FileSpreadsheet, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PROJECT_PLAN_COLUMNS } from '@/hooks/useLinkedSpreadsheet';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  code: string;
}

interface ConvertToProjectPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spreadsheetName: string;
  sheetData: any[][];
  onConvert: (projectId: string) => Promise<boolean>;
}

export function ConvertToProjectPlanDialog({
  open,
  onOpenChange,
  spreadsheetName,
  sheetData,
  onConvert,
}: ConvertToProjectPlanDialogProps) {
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [newProjectName, setNewProjectName] = useState(spreadsheetName);
  const [newProjectCode, setNewProjectCode] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [step, setStep] = useState<'options' | 'preview' | 'complete'>('options');

  // Count rows with data
  const dataRowCount = sheetData.slice(1).filter(row => row?.[1] && String(row[1]).trim()).length;

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, name, code')
        .order('name', { ascending: true });
      setProjects(data || []);
    };
    
    if (open) {
      fetchProjects();
      setStep('options');
      setNewProjectName(spreadsheetName);
      setNewProjectCode(spreadsheetName.substring(0, 4).toUpperCase());
    }
  }, [open, spreadsheetName]);

  const handleConvert = async () => {
    setIsConverting(true);

    try {
      let projectId = selectedProjectId;

      if (mode === 'new') {
        // Create new project
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert({
            name: newProjectName,
            code: newProjectCode || newProjectName.substring(0, 4).toUpperCase(),
            methodology: 'hybrid',
            status: 'active',
            health: 'green',
          })
          .select()
          .single();

        if (error) throw error;
        projectId = newProject.id;
      }

      const success = await onConvert(projectId);
      if (success) {
        setStep('complete');
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      }
    } catch (error) {
      console.error('Error converting:', error);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Convert to Project Plan
          </DialogTitle>
          <DialogDescription>
            Link this spreadsheet to a project plan for bi-directional sync.
          </DialogDescription>
        </DialogHeader>

        {step === 'options' && (
          <div className="space-y-6 py-4">
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'new' | 'existing')}>
              <div className="grid grid-cols-2 gap-4">
                <Label
                  htmlFor="new"
                  className={cn(
                    'flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                    mode === 'new' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value="new" id="new" className="sr-only" />
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Create New Project</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create a new project from this spreadsheet
                    </p>
                  </div>
                </Label>

                <Label
                  htmlFor="existing"
                  className={cn(
                    'flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                    mode === 'existing' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value="existing" id="existing" className="sr-only" />
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Table2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Link to Existing</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Connect to an existing project plan
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {mode === 'new' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectCode">Project Code</Label>
                  <Input
                    id="projectCode"
                    value={newProjectCode}
                    onChange={(e) => setNewProjectCode(e.target.value.toUpperCase())}
                    placeholder="PROJ"
                    maxLength={10}
                  />
                </div>
              </div>
            )}

            {mode === 'existing' && (
              <div className="space-y-2">
                <Label>Select Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        [{project.code}] {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {projects.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No projects available. Create a new one instead.
                  </p>
                )}
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => setStep('preview')}
              disabled={(mode === 'new' && !newProjectName.trim()) || (mode === 'existing' && !selectedProjectId)}
            >
              Preview Column Mapping
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <h4 className="font-medium mb-3">Column Mapping</h4>
              <ScrollArea className="h-64">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Column</th>
                      <th className="text-left py-2 px-2">Header</th>
                      <th className="text-left py-2 px-2">Task Field</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PROJECT_PLAN_COLUMNS.map((col) => (
                      <tr key={col.col} className="border-b border-border/50">
                        <td className="py-2 px-2 font-mono text-muted-foreground">
                          {String.fromCharCode(65 + col.col)}
                        </td>
                        <td className="py-2 px-2 font-medium">{col.header}</td>
                        <td className="py-2 px-2 text-muted-foreground">{col.field}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <Table2 className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-300">
                  {dataRowCount} tasks will be created
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Grid cells will turn blue to indicate linked status
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="py-12 flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-lg">Successfully Linked!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your spreadsheet is now synced with the project plan.
              </p>
            </div>
          </div>
        )}

        {step !== 'complete' && (
          <DialogFooter>
            {step === 'preview' && (
              <Button variant="outline" onClick={() => setStep('options')}>
                Back
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step === 'preview' && (
              <Button onClick={handleConvert} disabled={isConverting}>
                {isConverting ? 'Converting...' : 'Convert & Link'}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
