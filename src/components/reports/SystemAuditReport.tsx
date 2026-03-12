import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Layers,
  MousePointer,
  FileWarning
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AuditItem {
  name: string;
  path: string;
  status: 'wired' | 'mock' | 'partial';
  notes: string;
  nonFunctionalButtons?: string[];
}

const auditData: {
  wiredViews: AuditItem[];
  mockViews: AuditItem[];
  partialViews: AuditItem[];
  nonFunctionalButtons: { view: string; buttons: string[] }[];
} = {
  wiredViews: [
    { name: 'Actions', path: 'ActionsView.tsx', status: 'wired', notes: 'Uses useActions hook, full CRUD with SLA tracking' },
    { name: 'Backlog', path: 'BacklogView.tsx', status: 'wired', notes: 'Uses useBacklogItems hook, real-time sync' },
    { name: 'Risks', path: 'RisksView.tsx', status: 'wired', notes: 'Uses useRisks hook, full CRUD' },
    { name: 'Issues Register', path: 'IssuesRegisterView.tsx', status: 'wired', notes: 'Uses useIssues hook, full CRUD' },
    { name: 'Decisions', path: 'DecisionsView.tsx', status: 'wired', notes: 'Uses useDecisions hook, linked items support' },
    { name: 'Sprint Board', path: 'SprintBoardView.tsx', status: 'wired', notes: 'Uses useSprints & useBacklogItems hooks' },
    { name: 'Notes/Notebooks', path: 'NotesView.tsx', status: 'wired', notes: 'Uses useNotebooks hook, pages & spreadsheets' },
    { name: 'Presentations', path: 'PresentationsView.tsx', status: 'wired', notes: 'Uses usePresentations & useSlides hooks' },
    { name: 'Documents', path: 'DocumentCenterView.tsx', status: 'wired', notes: 'Uses useDocuments, useDocumentFolders, versioning' },
    { name: 'Team Chat', path: 'TeamChatView.tsx', status: 'wired', notes: 'Uses useChatEngine, real-time messaging' },
    { name: 'Enhanced Meetings', path: 'EnhancedMeetingsView.tsx', status: 'wired', notes: 'Uses useMeetings hook, AI extraction' },
    { name: 'Morning Briefing', path: 'MorningBriefingView.tsx', status: 'wired', notes: 'AI-generated via edge function, preferences saved' },
    { name: 'Calendar', path: 'CalendarView.tsx', status: 'wired', notes: 'Uses useCalendars, useMeetings hooks' },
    { name: 'Planning', path: 'PlanningView.tsx', status: 'wired', notes: 'Uses useTasks hook, interactive Gantt' },
    { name: 'Tracking', path: 'TrackingView.tsx', status: 'wired', notes: 'Uses useTasks, useBaselines hooks' },
    { name: 'Dashboard Hub', path: 'DashboardHub.tsx', status: 'wired', notes: 'Aggregates from multiple wired hooks' },
    { name: 'Project Creation', path: 'ProjectCreationView.tsx', status: 'wired', notes: 'Uses useProjects hook' },
    { name: 'User Settings', path: 'UserSettingsView.tsx', status: 'wired', notes: 'Auth integration' },
    { name: 'Lessons Learned', path: 'LessonsLearnedView.tsx', status: 'wired', notes: 'Fully wired with useLessonsLearned hooks' },
    { name: 'Change Requests', path: 'ChangeRequestsView.tsx', status: 'wired', notes: 'Fully wired with useChangeRequests hooks' },
    { name: 'Stakeholder Register', path: 'StakeholderRegisterView.tsx', status: 'wired', notes: 'Fully wired with useStakeholders hooks' },
    { name: 'Project Charter', path: 'ProjectCharterView.tsx', status: 'wired', notes: 'Fully wired with useProjectCharter' },
    { name: 'Final Report', path: 'FinalReportView.tsx', status: 'wired', notes: 'Fully wired with hooks' },
    { name: 'Financials View', path: 'FinancialsView.tsx', status: 'wired', notes: 'Wired with financials hooks' },
    { name: 'EVM View', path: 'EVMView.tsx', status: 'wired', notes: 'Wired with financials/EVM hooks' },
    { name: 'Portfolio View', path: 'PortfolioView.tsx', status: 'wired', notes: 'Wired with portfolio hooks' },
    { name: 'Traceability Matrix', path: 'TraceabilityMatrixView.tsx', status: 'wired', notes: 'Wired with traceability hooks' },
    { name: 'Scenarios', path: 'ScenariosView.tsx', status: 'wired', notes: 'Wired with scenario hooks' },
    { name: 'Strategic Dashboard', path: 'StrategicDashboardView.tsx', status: 'wired', notes: 'Wired with AI/strategic hooks' },
    { name: 'Dashboard', path: 'DashboardView.tsx', status: 'wired', notes: 'Fully integrated with live hooks' },
    { name: 'Executive Dashboard', path: 'ExecutiveDashboardView.tsx', status: 'wired', notes: 'Integrated with portfolio roll-ups' },
    { name: 'Project Plan', path: 'ProjectPlanView.tsx', status: 'wired', notes: 'Fully wired with useTasks' },
    { name: 'Gantt View', path: 'GanttView.tsx', status: 'wired', notes: 'Fully wired with useTasks' },
    { name: 'Resources', path: 'ResourcesView.tsx', status: 'wired', notes: 'Fully wired with useResources' },
    { name: 'Program Timeline', path: 'ProgramTimelineView.tsx', status: 'wired', notes: 'Wired with program/project hooks' },
    { name: 'Communication Intelligence', path: 'CommunicationIntelligenceView.tsx', status: 'wired', notes: 'Uses useEmails hook, mapped to live project state' },
    { name: 'PM Coach Sidebar', path: 'ai/PMCoachSidebar.tsx', status: 'wired', notes: 'Fully wired with critical path, leveling, and lessons learned' },
  ],
  mockViews: [],
  partialViews: [],
  nonFunctionalButtons: [],
};

export function SystemAuditReport() {
  const totalViews = auditData.wiredViews.length + auditData.mockViews.length + auditData.partialViews.length;
  const wiredPercentage = Math.round((auditData.wiredViews.length / totalViews) * 100);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/20">
          <FileWarning className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">System Audit Report</h1>
          <p className="text-muted-foreground">Frontend/Backend Integration Status</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span className="text-2xl font-bold text-success">{auditData.wiredViews.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Fully Wired</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <span className="text-2xl font-bold text-destructive">{auditData.mockViews.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Mock Data Only</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span className="text-2xl font-bold text-warning">{auditData.partialViews.length}</span>
            </div>
            <p className="text-sm text-muted-foreground">Partially Wired</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MousePointer className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{auditData.nonFunctionalButtons.reduce((sum, v) => sum + v.buttons.length, 0)}</span>
            </div>
            <p className="text-sm text-muted-foreground">Non-Functional Buttons</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="mock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="wired">✓ Wired ({auditData.wiredViews.length})</TabsTrigger>
          <TabsTrigger value="mock">✗ Mock Data ({auditData.mockViews.length})</TabsTrigger>
          <TabsTrigger value="partial">⚠ Partial ({auditData.partialViews.length})</TabsTrigger>
          <TabsTrigger value="buttons">🔘 Broken Buttons</TabsTrigger>
        </TabsList>

        <TabsContent value="wired">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-5 w-5 text-success" />
                Fully Wired Views
              </CardTitle>
              <CardDescription>These views are connected to the backend with real-time data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditData.wiredViews.map((view) => (
                  <div key={view.path} className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <div>
                        <span className="font-medium">{view.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{view.path}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{view.notes}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mock">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-5 w-5 text-destructive" />
                Views Using Mock Data
              </CardTitle>
              <CardDescription>These views need backend integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditData.mockViews.map((view) => (
                  <div key={view.path} className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <div>
                        <span className="font-medium">{view.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{view.path}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{view.notes}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partial">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Partially Wired Views
              </CardTitle>
              <CardDescription>These views have mixed real and mock data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditData.partialViews.map((view) => (
                  <div key={view.path} className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <div>
                        <span className="font-medium">{view.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{view.path}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{view.notes}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buttons">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MousePointer className="h-5 w-5" />
                Non-Functional Buttons
              </CardTitle>
              <CardDescription>Buttons that show UI but have no backend action</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditData.nonFunctionalButtons.map((item) => (
                  <div key={item.view} className="p-3 rounded-lg border">
                    <h4 className="font-medium mb-2">{item.view}</h4>
                    <div className="flex flex-wrap gap-2">
                      {item.buttons.map((btn, index) => (
                        <Badge
                          key={`${item.view}-${btn}-${index}`}
                          variant="outline"
                          className="text-[10px] h-4"
                        >
                          {btn}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SystemAuditReport;
