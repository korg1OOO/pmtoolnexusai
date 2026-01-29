import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GlobalAISidebar } from '@/components/ai/GlobalAISidebar';
import { PresenceProvider } from '@/contexts/PresenceContext';
import { mockProject } from '@/data/mockData';

interface AppShellProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
}

export function AppShell({ children, activeView, onViewChange }: AppShellProps) {
  const [showAISidebar, setShowAISidebar] = useState(false);

  return (
    <PresenceProvider>
      <TooltipProvider delayDuration={0}>
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <Sidebar
            activeItem={activeView}
            onItemClick={onViewChange}
          />
          <div className={cn(
            "flex flex-1 flex-col min-w-0 transition-all duration-300",
            showAISidebar && "mr-96"
          )}>
            <TopBar
              projectName={mockProject.name}
              projectCode={mockProject.code}
              onCreateProject={() => onViewChange('create-project')}
              onOpenChat={() => onViewChange('team-chat')}
            />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
          <GlobalAISidebar 
            isOpen={showAISidebar} 
            onToggle={() => setShowAISidebar(!showAISidebar)}
            projectId={mockProject.id}
            projectName={mockProject.name}
          />
        </div>
      </TooltipProvider>
    </PresenceProvider>
  );
}
