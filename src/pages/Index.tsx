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
import { MorningBriefingView } from '@/components/views/MorningBriefingView';
import { ProjectCharterView } from '@/components/views/ProjectCharterView';
import { StakeholderRegisterView } from '@/components/views/StakeholderRegisterView';
import { ScenariosView } from '@/components/views/ScenariosView';
import { DeliverablesView } from '@/components/views/DeliverablesView';
import { ChangeRequestsView } from '@/components/views/ChangeRequestsView';
import { EVMView } from '@/components/views/EVMView';
import { DocumentCenterView } from '@/components/views/DocumentCenterView';
import { FinalReportView } from '@/components/views/FinalReportView';
import { LessonsLearnedView } from '@/components/views/LessonsLearnedView';
import { RisksView } from '@/components/views/RisksView';
import { DecisionsView } from '@/components/views/DecisionsView';
import { TeamChatView } from '@/components/views/TeamChatView';
import { TeamManagementView } from '@/components/views/TeamManagementView';
import { ProjectProvider } from '@/contexts/ProjectContext';

const Index = () => {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'morning-briefing': return <MorningBriefingView />;
      case 'executive-dashboard': return <ExecutiveDashboardView />;
      case 'portfolio': return <PortfolioView />;
      case 'strategic': return <StrategicDashboardView />;
      case 'program-timeline': return <ProgramTimelineView />;
      case 'reports': return <ReportsView />;
      case 'project-charter': return <ProjectCharterView />;
      case 'stakeholders': return <StakeholderRegisterView />;
      case 'traceability': return <TraceabilityMatrixView />;
      case 'project-plan': return <PlanningView />;
      case 'child-plans': return <ChildPlansView />;
      case 'gantt': return <GanttView />;
      case 'child-gantt': return <ChildGanttView />;
      case 'milestones': return <MilestonesView />;
      case 'scenarios': return <ScenariosView />;
      case 'deliverables': return <DeliverablesView />;
      case 'sprints': return <SprintBoardView />;
      case 'backlog': return <BacklogView />;
      case 'actions': return <ActionsView />;
      case 'risks': return <RisksView />;
      case 'issues': return <IssuesRegisterView />;
      case 'decisions': return <DecisionsView />;
      case 'change-requests': return <ChangeRequestsView />;
      case 'financials': return <FinancialsView />;
      case 'evm': return <EVMView />;
      case 'meetings': return <EnhancedMeetingsView />;
      case 'team-chat': return <TeamChatView />;
      case 'communications': return <CommunicationIntelligenceView />;
      case 'notes': return <NotesView />;
      case 'documents': return <DocumentCenterView />;
      case 'resources': return <ResourcesView />;
      case 'team-management': return <TeamManagementView />;
      case 'presentations': return <PresentationsView />;
      case 'final-report': return <FinalReportView />;
      case 'lessons-learned': return <LessonsLearnedView />;
      case 'admin-platform': return <PlatformAdminView />;
      case 'admin-project': return <ProjectAdminView />;
      case 'admin-templates': return <TemplatesAdminView />;
      case 'settings': return <UserSettingsView />;
      case 'create-project': return <ProjectCreationView />;
      default: return <DashboardView />;
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
