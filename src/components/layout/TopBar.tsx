import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Search, Bell, MessageSquare, HelpCircle, ChevronDown, Command, Maximize2, LayoutGrid, FileText, CheckSquare, Users, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { PresenceIndicator } from '@/components/collaboration/PresenceIndicator';
import { usePresenceContext } from '@/contexts/PresenceContext';
import { ProjectSwitcher } from '@/components/layout/ProjectSwitcher';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';

interface TopBarProps {
  projectName?: string;
  projectCode?: string;
  className?: string;
  onCreateProject?: () => void;
  onOpenChat?: () => void;
}

interface SearchResult {
  id: string;
  type: 'task' | 'decision' | 'meeting' | 'document';
  title: string;
  subtitle?: string;
  projectId?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function TopBar({ projectName, projectCode, className, onCreateProject, onOpenChat }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { users } = usePresenceContext();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const userName = profile?.full_name || 'User';
  const userInitials = (userName).substring(0, 2).toUpperCase();
  const userEmail = profile?.email || '';

  // --- Global search state ---
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const searchRef = useRef<HTMLDivElement>(null);

  // Dismiss on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cmd+K hotkey for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Execute search when debounced query changes
  useEffect(() => {
    if (!debouncedSearch.trim() || debouncedSearch.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    const runSearch = async () => {
      setSearchLoading(true);
      setSearchOpen(true);
      const q = `%${debouncedSearch}%`;

      try {
        const [tasksRes, decisionsRes, meetingsRes] = await Promise.all([
          (supabase as any).from('tasks').select('id, title, project_id, status').ilike('title', q).limit(5),
          (supabase as any).from('decisions').select('id, title, project_id').ilike('title', q).limit(5),
          (supabase as any).from('meetings').select('id, title, project_id, date').ilike('title', q).limit(5),
        ]);

        const results: SearchResult[] = [
          ...(tasksRes.data || []).map((t: any) => ({ id: t.id, type: 'task' as const, title: t.title, subtitle: t.status, projectId: t.project_id })),
          ...(decisionsRes.data || []).map((d: any) => ({ id: d.id, type: 'decision' as const, title: d.title, projectId: d.project_id })),
          ...(meetingsRes.data || []).map((m: any) => ({ id: m.id, type: 'meeting' as const, title: m.title, subtitle: m.date ? new Date(m.date).toLocaleDateString() : undefined, projectId: m.project_id })),
        ];
        setSearchResults(results);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setSearchLoading(false);
      }
    };

    runSearch();
  }, [debouncedSearch]);

  const handleResultClick = useCallback((result: SearchResult) => {
    setSearch('');
    setSearchOpen(false);
    if (result.projectId) {
      navigate(`/project/${result.projectId}/${result.type}s`);
    }
  }, [navigate]);

  const resultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'task': return <CheckSquare className="h-3.5 w-3.5 text-blue-400" />;
      case 'decision': return <FileText className="h-3.5 w-3.5 text-amber-400" />;
      case 'meeting': return <Users className="h-3.5 w-3.5 text-green-400" />;
      default: return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <header className={cn('flex h-14 items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4', className)}>
      <div className="flex items-center gap-4">
        {projectName && (
          <div className="flex items-center gap-2">
            <ProjectSwitcher />
          </div>
        )}
      </div>
      <div className="flex-1 max-w-xl mx-auto relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="global-search"
            placeholder="Search tasks, decisions, meetings..."
            className="pl-10 pr-20 bg-muted/50 border-transparent focus:border-primary h-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => debouncedSearch.length >= 2 && setSearchOpen(true)}
            autoComplete="off"
          />
          {searchLoading ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          )}
        </div>
        {/* Search results dropdown */}
        {searchOpen && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border bg-popover shadow-lg overflow-hidden">
            {searchResults.length === 0 && !searchLoading && (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">No results for "{debouncedSearch}"</div>
            )}
            {searchResults.map(result => (
              <button
                key={`${result.type}-${result.id}`}
                className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-muted/60 text-left transition-colors"
                onClick={() => handleResultClick(result)}
              >
                <span className="mt-0.5">{resultIcon(result.type)}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{result.title}</div>
                  {result.subtitle && <div className="text-xs text-muted-foreground capitalize">{result.type} · {result.subtitle}</div>}
                  {!result.subtitle && <div className="text-xs text-muted-foreground capitalize">{result.type}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        {/* Presence Indicator */}
        <PresenceIndicator users={users} className="mr-2" />

        <Button variant="ghost" size="iconSm" onClick={() => navigate('/projects')} title="Projects & Apps"><LayoutGrid className="h-4 w-4" /></Button>
        <ThemeToggle />
        <NotificationCenter />
        <Button variant="ghost" size="iconSm" onClick={onOpenChat} title="Team Chat"><MessageSquare className="h-4 w-4" /></Button>
        <div className="w-px h-6 bg-border mx-2" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-1">
              <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary/20 text-primary text-xs">{userInitials}</AvatarFallback></Avatar>
              <span className="text-sm font-medium hidden md:inline">{userName}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel><div className="flex flex-col"><span>{userName}</span><span className="text-xs font-normal text-muted-foreground">{userEmail}</span></div></DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}><User className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={toggleFullscreen}><Maximize2 className="mr-2 h-4 w-4" />Fullscreen</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
