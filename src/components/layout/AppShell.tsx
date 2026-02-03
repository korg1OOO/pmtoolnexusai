import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GlobalAISidebar } from '@/components/ai/GlobalAISidebar';
import { MiniChatWindow } from '@/components/chat/MiniChatWindow';
import { PresenceProvider } from '@/contexts/PresenceContext';
import { useProjectContext } from '@/contexts/ProjectContext';

interface AppShellProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
}

export function AppShell({ children, activeView, onViewChange }: AppShellProps) {
  const { settings, activeGlobalPanel, setActiveGlobalPanel } = useProjectContext();

  // Handle chat button click - toggle global panel instead of local state
  const handleOpenChat = () => {
    setActiveGlobalPanel(activeGlobalPanel === 'chat' ? null : 'chat');
  };

  // Expand mini chat to full view
  const handleExpandChat = () => {
    setActiveGlobalPanel(null);
    onViewChange('team-chat');
  };

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
            (activeGlobalPanel === 'ai' || activeGlobalPanel === 'settings') && "mr-96"
          )}>
            <TopBar
              projectName={settings.name}
              projectCode={settings.code}
              onCreateProject={() => onViewChange('create-project')}
              onOpenChat={handleOpenChat}
            />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
          <GlobalAISidebar
            isOpen={activeGlobalPanel === 'ai'}
            onToggle={() => setActiveGlobalPanel(activeGlobalPanel === 'ai' ? null : 'ai')}
            projectId={settings.id}
            projectName={settings.name}
            currentView={activeView}
          />
          {/* Mini Chat Window */}
          <MiniChatWindow
            isOpen={activeGlobalPanel === 'chat'}
            onClose={() => setActiveGlobalPanel(null)}
            onExpand={handleExpandChat}
          />
        </div>
      </TooltipProvider>
    </PresenceProvider>
  );
}
