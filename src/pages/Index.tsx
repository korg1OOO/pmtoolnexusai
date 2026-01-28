import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardView } from '@/components/views/DashboardView';
import { ProjectPlanView } from '@/components/views/ProjectPlanView';
import { GanttView } from '@/components/views/GanttView';
import { SprintBoardView } from '@/components/views/SprintBoardView';
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
import { EnhancedMeetingsView } from '@/components/views/EnhancedMeetingsView';
import { StrategicDashboardView } from '@/components/views/StrategicDashboardView';
import { CommunicationIntelligenceView } from '@/components/views/CommunicationIntelligenceView';
import { IssuesRegisterView } from '@/components/views/IssuesRegisterView';
import { ActionsView } from '@/components/views/ActionsView';
import { TraceabilityMatrixView } from '@/components/views/TraceabilityMatrixView';
import { ChildPlansView } from '@/components/views/ChildPlansView';
import { ChildGanttView } from '@/components/views/ChildGanttView';
import { PlatformAdminView } from '@/components/views/PlatformAdminView';
import { UserSettingsView } from '@/components/views/UserSettingsView';
import { ProjectAdminView } from '@/components/views/ProjectAdminView';
import { PlanningView } from '@/components/views/PlanningView';
import { ProjectCreationView } from '@/components/views/ProjectCreationView';
import { TemplatesAdminView } from '@/components/views/TemplatesAdminView';
import { ProjectProvider } from '@/contexts/ProjectContext';

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
      case 'traceability':
        return <TraceabilityMatrixView />;
      case 'project-plan':
        return <PlanningView />;
      case 'child-plans':
        return <ChildPlansView />;
      case 'gantt':
        return <GanttView />;
      case 'child-gantt':
        return <ChildGanttView />;
      case 'milestones':
        return <MilestonesView />;
      case 'program-timeline':
        return <ProgramTimelineView />;
      case 'sprints':
        return <SprintBoardView />;
      case 'backlog':
        return <BacklogView />;
      case 'actions':
        return <ActionsView />;
      case 'issues':
        return <IssuesRegisterView />;
      case 'meetings':
        return <EnhancedMeetingsView />;
      case 'strategic':
        return <StrategicDashboardView />;
      case 'communications':
        return <CommunicationIntelligenceView />;
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
      case 'admin-platform':
        return <PlatformAdminView />;
      case 'admin-project':
        return <ProjectAdminView />;
      case 'admin-templates':
        return <TemplatesAdminView />;
      case 'settings':
        return <UserSettingsView />;
      case 'create-project':
        return <ProjectCreationView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <ProjectProvider>
      <AppShell activeView={activeView} onViewChange={setActiveView}>
        {renderView()}
      </AppShell>
    </ProjectProvider>
  );
};

export default Index;
