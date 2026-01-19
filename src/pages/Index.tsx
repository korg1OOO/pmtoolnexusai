import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardView } from '@/components/views/DashboardView';
import { ProjectPlanView } from '@/components/views/ProjectPlanView';
import { GanttView } from '@/components/views/GanttView';
import { SprintBoardView } from '@/components/views/SprintBoardView';
import { MeetingsView } from '@/components/views/MeetingsView';
import { RisksDecisionsView } from '@/components/views/RisksDecisionsView';
import { FinancialsView } from '@/components/views/FinancialsView';
import { NotesView } from '@/components/views/NotesView';
import { ResourcesView } from '@/components/views/ResourcesView';
import { PresentationsView } from '@/components/views/PresentationsView';
import { PortfolioView } from '@/components/views/PortfolioView';
import { ProgramTimelineView } from '@/components/views/ProgramTimelineView';
import { ExecutiveDashboardView } from '@/components/views/ExecutiveDashboardView';
import { MilestonesView } from '@/components/views/MilestonesView';
import { BacklogView } from '@/components/views/BacklogView';
import { ReportsView } from '@/components/views/ReportsView';

const Index = () => {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'executive-dashboard':
        return <ExecutiveDashboardView />;
      case 'portfolio':
        return <PortfolioView />;
      case 'project-plan':
        return <ProjectPlanView />;
      case 'gantt':
        return <GanttView />;
      case 'milestones':
        return <MilestonesView />;
      case 'program-timeline':
        return <ProgramTimelineView />;
      case 'sprints':
        return <SprintBoardView />;
      case 'backlog':
        return <BacklogView />;
      case 'meetings':
        return <MeetingsView />;
      case 'risks':
      case 'decisions':
        return <RisksDecisionsView />;
      case 'financials':
        return <FinancialsView />;
      case 'notes':
        return <NotesView />;
      case 'resources':
        return <ResourcesView />;
      case 'presentations':
        return <PresentationsView />;
      case 'reports':
        return <ReportsView />;
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
