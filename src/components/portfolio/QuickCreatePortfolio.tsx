import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Briefcase, FolderKanban, Zap, CheckCircle } from 'lucide-react';
import { useCreatePortfolio } from '@/hooks/usePortfolios';
import { useCreateProgram } from '@/hooks/usePrograms';
import { usePortfolios } from '@/hooks/usePortfolios';
import { toast } from 'sonner';

interface QuickCreatePortfolioProps {
  onCreated?: () => void;
}

export function QuickCreatePortfolio({ onCreated }: QuickCreatePortfolioProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'type' | 'details' | 'success'>('type');
  const [createType, setCreateType] = useState<'portfolio' | 'program'>('portfolio');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');

  const createPortfolio = useCreatePortfolio();
  const createProgram = useCreateProgram();
  const { data: portfolios } = usePortfolios();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      if (createType === 'portfolio') {
        await createPortfolio.mutateAsync({ name, description, status: 'active' });
        toast.success(`Portfolio "${name}" created`);
      } else {
        if (!selectedPortfolioId) {
          toast.error('Select a portfolio');
          return;
        }
        await createProgram.mutateAsync({
          name,
          description,
          portfolio_id: selectedPortfolioId,
          status: 'active',
        });
        toast.success(`Program "${name}" created`);
      }
      setStep('success');
      onCreated?.();
    } catch (err) {
      toast.error(`Failed to create ${createType}`);
    }
  };

  const reset = () => {
    setStep('type');
    setCreateType('portfolio');
    setName('');
    setDescription('');
    setSelectedPortfolioId('');
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Zap className="h-4 w-4" />
          Quick Create
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        {step === 'type' && (
          <>
            <DialogHeader>
              <DialogTitle>Quick Create</DialogTitle>
              <DialogDescription>What would you like to create?</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <button
                onClick={() => { setCreateType('portfolio'); setStep('details'); }}
                className="flex flex-col items-center gap-3 p-6 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
              >
                <div className="p-3 rounded-full bg-primary/10">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <span className="font-semibold">Portfolio</span>
                <span className="text-xs text-muted-foreground text-center">Group related programs together</span>
              </button>
              <button
                onClick={() => { setCreateType('program'); setStep('details'); }}
                className="flex flex-col items-center gap-3 p-6 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
              >
                <div className="p-3 rounded-full bg-blue-500/10">
                  <FolderKanban className="h-6 w-6 text-blue-500" />
                </div>
                <span className="font-semibold">Program</span>
                <span className="text-xs text-muted-foreground text-center">Organize projects under a portfolio</span>
              </button>
            </div>
          </>
        )}

        {step === 'details' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {createType === 'portfolio' ? <Briefcase className="h-5 w-5 text-primary" /> : <FolderKanban className="h-5 w-5 text-blue-500" />}
                New {createType === 'portfolio' ? 'Portfolio' : 'Program'}
              </DialogTitle>
              <DialogDescription>Fill in the details below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {createType === 'program' && (
                <div className="space-y-2">
                  <Label>Parent Portfolio</Label>
                  <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a portfolio" />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolios?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder={`Enter ${createType} name`} autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." rows={3} />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('type')}>Back</Button>
              <Button onClick={handleCreate} disabled={createPortfolio.isPending || createProgram.isPending}>
                {(createPortfolio.isPending || createProgram.isPending) ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">{createType === 'portfolio' ? 'Portfolio' : 'Program'} Created!</h3>
            <p className="text-sm text-muted-foreground text-center">
              <span className="font-medium">{name}</span> has been created successfully.
            </p>
            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={() => { reset(); }}>Create Another</Button>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
