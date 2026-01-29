import React, { useState, useEffect } from 'react';
import { Forward, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ForwardableMessage {
  id: string;
  content: string;
  user_email: string;
  created_at: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
}

interface Project {
  id: string;
  name: string;
  code: string;
}

interface ForwardMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  message: ForwardableMessage | null;
  currentProjectId: string;
  currentUserId: string;
  currentUserEmail: string;
  onForward: (targetProjectId: string, additionalMessage?: string) => Promise<void>;
}

function getInitials(text: string): string {
  const parts = text.split(/[\s._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return text.slice(0, 2).toUpperCase();
}

export function ForwardMessageDialog({
  isOpen,
  onClose,
  message,
  currentProjectId,
  currentUserId,
  currentUserEmail,
  onForward,
}: ForwardMessageDialogProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [additionalMessage, setAdditionalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Fetch available projects
  useEffect(() => {
    if (!isOpen) return;

    const fetchProjects = async () => {
      setIsFetching(true);
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, code')
        .neq('id', currentProjectId)
        .order('name');

      if (!error && data) {
        setProjects(data);
      }
      setIsFetching(false);
    };

    fetchProjects();
  }, [isOpen, currentProjectId]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedProjectId(null);
      setAdditionalMessage('');
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleForward = async () => {
    if (!selectedProjectId || !message) return;

    setIsLoading(true);
    try {
      await onForward(selectedProjectId, additionalMessage.trim() || undefined);
      onClose();
    } catch (error) {
      console.error('Error forwarding message:', error);
    }
    setIsLoading(false);
  };

  if (!message) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="h-4 w-4" />
            Forward Message
          </DialogTitle>
        </DialogHeader>

        {/* Original message preview */}
        <div className="p-3 rounded-md bg-muted/50 border-l-2 border-primary">
          <p className="text-xs text-muted-foreground mb-1">
            {message.user_email.split('@')[0]} • {format(new Date(message.created_at), 'MMM d, HH:mm')}
          </p>
          <p className="text-sm">{message.content}</p>
          {message.attachment_name && (
            <p className="text-xs text-muted-foreground mt-1">
              📎 {message.attachment_name}
            </p>
          )}
        </div>

        {/* Additional message input */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Add a message (optional)</label>
          <Textarea
            value={additionalMessage}
            onChange={(e) => setAdditionalMessage(e.target.value)}
            placeholder="Add a comment..."
            className="resize-none h-16"
          />
        </div>

        {/* Project selection */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Forward to</label>
          
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="pl-8 h-8"
            />
          </div>

          <ScrollArea className="h-[180px] border rounded-md">
            {isFetching ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Loading projects...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                {searchQuery ? 'No projects found' : 'No other projects available'}
              </div>
            ) : (
              <div className="p-1">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors',
                      selectedProjectId === project.id
                        ? 'bg-primary/10 border border-primary'
                        : 'hover:bg-muted'
                    )}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs bg-primary/20 text-primary">
                        {getInitials(project.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.code}</p>
                    </div>
                    {selectedProjectId === project.id && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleForward}
            disabled={!selectedProjectId || isLoading}
          >
            <Forward className="h-4 w-4 mr-1" />
            {isLoading ? 'Forwarding...' : 'Forward'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ForwardButtonProps {
  onForward: () => void;
  className?: string;
}

export function ForwardButton({ onForward, className }: ForwardButtonProps) {
  return (
    <Button
      variant="ghost"
      size="iconSm"
      onClick={onForward}
      className={cn("h-6 w-6", className)}
      title="Forward message"
    >
      <Forward className="h-3 w-3" />
    </Button>
  );
}
