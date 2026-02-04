import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Search, Bell, MessageSquare, HelpCircle, User, ChevronDown, Command, Maximize2, LayoutGrid, Plus } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { PresenceIndicator } from '@/components/collaboration/PresenceIndicator';
import { usePresenceContext } from '@/contexts/PresenceContext';
import { ProjectSwitcher } from '@/components/layout/ProjectSwitcher';

interface TopBarProps {
  projectName?: string;
  projectCode?: string;
  className?: string;
  onCreateProject?: () => void;
  onOpenChat?: () => void;
}

export function TopBar({ projectName, projectCode, className, onCreateProject, onOpenChat }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { users } = usePresenceContext();

  return (
    <header className={cn('flex h-14 items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4', className)}>
      <div className="flex items-center gap-4">
        {projectName && (
          <div className="flex items-center gap-2">
            <ProjectSwitcher />
          </div>
        )}
      </div>
      <div className="flex-1 max-w-xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tasks, decisions, meetings..." className="pl-10 pr-20 bg-muted/50 border-transparent focus:border-primary h-9" />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {/* Presence Indicator */}
        <PresenceIndicator users={users} className="mr-2" />

        <Button size="sm" onClick={onCreateProject} className="mr-2"><Plus className="h-4 w-4 mr-1" />New Project</Button>
        <Button variant="ghost" size="iconSm"><LayoutGrid className="h-4 w-4" /></Button>
        <ThemeToggle />
        <NotificationCenter />
        <Button variant="ghost" size="iconSm" onClick={onOpenChat} title="Team Chat"><MessageSquare className="h-4 w-4" /></Button>
        <Button variant="ghost" size="iconSm"><HelpCircle className="h-4 w-4" /></Button>
        <div className="w-px h-6 bg-border mx-2" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-1">
              <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary/20 text-primary text-xs">SM</AvatarFallback></Avatar>
              <span className="text-sm font-medium hidden md:inline">Sarah M.</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel><div className="flex flex-col"><span>Sarah Mitchell</span><span className="text-xs font-normal text-muted-foreground">sarah.mitchell@company.com</span></div></DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><User className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
            <DropdownMenuItem><Maximize2 className="mr-2 h-4 w-4" />Fullscreen</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}