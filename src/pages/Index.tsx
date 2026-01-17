import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardView } from '@/components/views/DashboardView';
import { ProjectPlanView } from '@/components/views/ProjectPlanView';
import { GanttView } from '@/components/views/GanttView';
import { SprintBoardView } from '@/components/views/SprintBoardView';
import { MeetingsView } from '@/components/views/MeetingsView';
import { RisksDecisionsView } from '@/components/views/RisksDecisionsView';
import { FinancialsView } from '@/components/views/FinancialsView';

const Index = () => {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'project-plan':
        return <ProjectPlanView />;
      case 'gantt':
        return <GanttView />;
      case 'sprints':
      case 'backlog':
        return <SprintBoardView />;
      case 'meetings':
        return <MeetingsView />;
      case 'risks':
      case 'decisions':
        return <RisksDecisionsView />;
      case 'financials':
        return <FinancialsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <AppShell activeView={activeView} onViewChange={setActiveView}>
      {renderView()}
    </AppShell>
  );
};

export default Index;
