/**
 * Project-scoped Routes (ProtectedProjectRoute)
 *
 * Every route here renders inside the AppShell (sidebar + nav).
 * Use <ProtectedProjectRoute> for any view that needs the project context
 * and the main application navigation shell.
 *
 * See: src/routes/README.md for the full guard rule documentation.
 */

import { Route } from 'react-router-dom';
import { ProtectedProjectRoute } from '@/components/routing';
import { lazy } from 'react';

// ─── Lazy-loaded view components ──────────────────────────────────────────────
const DashboardHub = lazy(() => import('@/components/views/DashboardHub'));
const GanttView = lazy(() => import('@/components/views/GanttView'));
const SprintBoardView = lazy(() => import('@/components/views/SprintBoardView'));
const FinancialsView = lazy(() => import('@/components/views/FinancialsView'));
const NotesView = lazy(() => import('@/components/views/NotesView'));
const ResourcesView = lazy(() => import('@/components/views/ResourcesView'));
const PresentationsView = lazy(() => import('@/components/views/PresentationsView'));
const ProgramTimelineView = lazy(() => import('@/components/views/ProgramTimelineView'));
const ExecutiveDashboardView = lazy(() => import('@/components/views/ExecutiveDashboardView'));
const MilestonesView = lazy(() => import('@/components/views/MilestonesView'));
const BacklogView = lazy(() => import('@/components/views/BacklogView'));
const ReportsView = lazy(() => import('@/components/views/ReportsView'));
const EnhancedMeetingsView = lazy(() => import('@/components/views/EnhancedMeetingsView'));
const MeetingAnalyticsView = lazy(() => import('@/components/views/MeetingAnalyticsView'));
const CalendarView = lazy(() => import('@/components/views/CalendarView'));
const StrategicDashboardView = lazy(() => import('@/components/views/StrategicDashboardView'));
const CommunicationIntelligenceView = lazy(() => import('@/components/views/CommunicationIntelligenceView'));
const CommunicationsView = lazy(() => import('@/components/communications/CommunicationsView'));
const IssuesRegisterView = lazy(() => import('@/components/views/IssuesRegisterView'));
const ActionsView = lazy(() => import('@/components/views/ActionsView'));
const TraceabilityMatrixView = lazy(() => import('@/components/views/TraceabilityMatrixView'));
const ChildPlansView = lazy(() => import('@/components/views/ChildPlansView'));
const ChildGanttView = lazy(() => import('@/components/views/ChildGanttView'));
const UserSettingsView = lazy(() => import('@/components/views/UserSettingsView'));
const ProjectAdminView = lazy(() => import('@/components/views/ProjectAdminView'));
const PlatformAdminView = lazy(() => import('@/components/views/PlatformAdminView'));
const PlanningView = lazy(() => import('@/components/views/PlanningView'));
const ProjectCreationView = lazy(() => import('@/components/views/ProjectCreationView'));
const TemplatesAdminView = lazy(() => import('@/components/views/TemplatesAdminView'));
const MorningBriefingView = lazy(() => import('@/components/views/MorningBriefingView'));
const ProjectCharterView = lazy(() => import('@/components/views/ProjectCharterView'));
const StakeholderRegisterView = lazy(() => import('@/components/views/StakeholderRegisterView'));
const ScenariosView = lazy(() => import('@/components/views/ScenariosView'));
const DeliverablesView = lazy(() => import('@/components/views/DeliverablesView'));
const ChangeRequestsView = lazy(() => import('@/components/views/ChangeRequestsView'));
const EVMView = lazy(() => import('@/components/views/EVMView'));
const TimelineSlippageView = lazy(() => import('@/components/views/TimelineSlippageView'));
const DocumentCenterView = lazy(() => import('@/components/views/DocumentCenterView'));
const FinalReportView = lazy(() => import('@/components/views/FinalReportView'));
const LessonsLearnedView = lazy(() => import('@/components/views/LessonsLearnedView'));
const RisksView = lazy(() => import('@/components/views/RisksView'));
const DecisionsView = lazy(() => import('@/components/views/DecisionsView'));
const TeamChatView = lazy(() => import('@/components/views/TeamChatView'));
const TeamManagementView = lazy(() => import('@/components/views/TeamManagementView'));
const TrackingView = lazy(() => import('@/components/views/TrackingView'));
const TimelinePlannerTab = lazy(() => import('@/components/views/TimelinePlannerTab'));
const KnowledgeBaseView = lazy(() => import('@/components/views/KnowledgeBaseView'));
const ProgramDocumentsView = lazy(() => import('@/components/views/ProgramDocumentsView'));
const CollaborationSpacesView = lazy(() => import('@/components/views/CollaborationSpacesView'));
const CollaborationDashboardView = lazy(() => import('@/components/views/CollaborationDashboardView'));
const ProgramManagementView = lazy(() => import('@/components/views/ProgramManagementView'));

// ── Portfolio view (also used in ProtectedProjectRoute) ───────────────────────
import { PortfolioView } from '@/components/workspace';

export function ProjectRoutes() {
    return (
        <>
            {/* ── Dashboard & Overview ──────────────────────────────────────── */}
            <Route path="/dashboard" element={<ProtectedProjectRoute><DashboardHub /></ProtectedProjectRoute>} />
            <Route path="/morning-briefing" element={<ProtectedProjectRoute><MorningBriefingView /></ProtectedProjectRoute>} />
            <Route path="/executive-dashboard" element={<ProtectedProjectRoute><ExecutiveDashboardView /></ProtectedProjectRoute>} />
            <Route path="/strategic-dashboard" element={<ProtectedProjectRoute><StrategicDashboardView /></ProtectedProjectRoute>} />

            {/* ── Portfolio & Program ───────────────────────────────────────── */}
            <Route path="/portfolio" element={<ProtectedProjectRoute><PortfolioView /></ProtectedProjectRoute>} />
            <Route path="/program" element={<ProtectedProjectRoute><ProgramManagementView /></ProtectedProjectRoute>} />
            <Route path="/program-timeline" element={<ProtectedProjectRoute><ProgramTimelineView /></ProtectedProjectRoute>} />
            <Route path="/program-documents" element={<ProtectedProjectRoute><ProgramDocumentsView /></ProtectedProjectRoute>} />

            {/* ── Planning & Tracking ───────────────────────────────────────── */}
            <Route path="/project-plan" element={<ProtectedProjectRoute><PlanningView /></ProtectedProjectRoute>} />
            <Route path="/planning" element={<ProtectedProjectRoute><PlanningView /></ProtectedProjectRoute>} />
            <Route path="/child-plans" element={<ProtectedProjectRoute><ChildPlansView /></ProtectedProjectRoute>} />
            <Route path="/gantt" element={<ProtectedProjectRoute><GanttView /></ProtectedProjectRoute>} />
            <Route path="/child-gantt" element={<ProtectedProjectRoute><ChildGanttView /></ProtectedProjectRoute>} />
            <Route path="/timeline-planner" element={<ProtectedProjectRoute><TimelinePlannerTab /></ProtectedProjectRoute>} />
            <Route path="/milestones" element={<ProtectedProjectRoute><MilestonesView /></ProtectedProjectRoute>} />
            <Route path="/scenarios" element={<ProtectedProjectRoute><ScenariosView /></ProtectedProjectRoute>} />
            <Route path="/tracking" element={<ProtectedProjectRoute><TrackingView /></ProtectedProjectRoute>} />
            <Route path="/project-charter" element={<ProtectedProjectRoute><ProjectCharterView /></ProtectedProjectRoute>} />

            {/* ── Agile & Sprints ───────────────────────────────────────────── */}
            <Route path="/sprints" element={<ProtectedProjectRoute><SprintBoardView /></ProtectedProjectRoute>} />
            <Route path="/backlog" element={<ProtectedProjectRoute><BacklogView /></ProtectedProjectRoute>} />

            {/* ── Deliverables & Changes ────────────────────────────────────── */}
            <Route path="/deliverables" element={<ProtectedProjectRoute><DeliverablesView /></ProtectedProjectRoute>} />
            <Route path="/change-requests" element={<ProtectedProjectRoute><ChangeRequestsView /></ProtectedProjectRoute>} />

            {/* ── Governance & Compliance ───────────────────────────────────── */}
            <Route path="/stakeholders" element={<ProtectedProjectRoute><StakeholderRegisterView /></ProtectedProjectRoute>} />
            <Route path="/traceability" element={<ProtectedProjectRoute><TraceabilityMatrixView /></ProtectedProjectRoute>} />

            {/* ── Issues & Risks ────────────────────────────────────────────── */}
            <Route path="/actions" element={<ProtectedProjectRoute><ActionsView /></ProtectedProjectRoute>} />
            <Route path="/risks" element={<ProtectedProjectRoute><RisksView /></ProtectedProjectRoute>} />
            <Route path="/issues" element={<ProtectedProjectRoute><IssuesRegisterView /></ProtectedProjectRoute>} />
            <Route path="/decisions" element={<ProtectedProjectRoute><DecisionsView /></ProtectedProjectRoute>} />

            {/* ── Financial ────────────────────────────────────────────────── */}
            <Route path="/financials" element={<ProtectedProjectRoute><FinancialsView /></ProtectedProjectRoute>} />
            <Route path="/evm" element={<ProtectedProjectRoute><EVMView /></ProtectedProjectRoute>} />
            <Route path="/timeline-slippage" element={<ProtectedProjectRoute><TimelineSlippageView /></ProtectedProjectRoute>} />

            {/* ── Collaboration ─────────────────────────────────────────────── */}
            <Route path="/meetings" element={<ProtectedProjectRoute><EnhancedMeetingsView /></ProtectedProjectRoute>} />
            <Route path="/meeting-analytics" element={<ProtectedProjectRoute><MeetingAnalyticsView /></ProtectedProjectRoute>} />
            <Route path="/calendar" element={<ProtectedProjectRoute><CalendarView /></ProtectedProjectRoute>} />
            <Route path="/team-chat" element={<ProtectedProjectRoute><TeamChatView /></ProtectedProjectRoute>} />
            <Route path="/communications" element={<ProtectedProjectRoute><CommunicationsView /></ProtectedProjectRoute>} />
            <Route path="/communication-intelligence" element={<ProtectedProjectRoute><CommunicationIntelligenceView /></ProtectedProjectRoute>} />
            <Route path="/collaboration-spaces" element={<ProtectedProjectRoute><CollaborationSpacesView /></ProtectedProjectRoute>} />
            <Route path="/collaboration-dashboard" element={<ProtectedProjectRoute><CollaborationDashboardView /></ProtectedProjectRoute>} />

            {/* ── Documents & Knowledge ─────────────────────────────────────── */}
            <Route path="/notes" element={<ProtectedProjectRoute><NotesView /></ProtectedProjectRoute>} />
            <Route path="/documents" element={<ProtectedProjectRoute><DocumentCenterView /></ProtectedProjectRoute>} />
            <Route path="/knowledge-base" element={<ProtectedProjectRoute><KnowledgeBaseView /></ProtectedProjectRoute>} />
            <Route path="/presentations" element={<ProtectedProjectRoute><PresentationsView /></ProtectedProjectRoute>} />

            {/* ── Resources & Team ──────────────────────────────────────────── */}
            <Route path="/resources" element={<ProtectedProjectRoute><ResourcesView /></ProtectedProjectRoute>} />
            <Route path="/team-management" element={<ProtectedProjectRoute><TeamManagementView /></ProtectedProjectRoute>} />

            {/* ── Reports & Closure ─────────────────────────────────────────── */}
            <Route path="/reports" element={<ProtectedProjectRoute><ReportsView /></ProtectedProjectRoute>} />
            <Route path="/final-report" element={<ProtectedProjectRoute><FinalReportView /></ProtectedProjectRoute>} />
            <Route path="/lessons-learned" element={<ProtectedProjectRoute><LessonsLearnedView /></ProtectedProjectRoute>} />

            {/* ── Project-scoped Admin & Settings ───────────────────────────── */}
            <Route path="/admin/project" element={<ProtectedProjectRoute><ProjectAdminView /></ProtectedProjectRoute>} />
            <Route path="/admin/platform" element={<ProtectedProjectRoute><PlatformAdminView /></ProtectedProjectRoute>} />
            <Route path="/admin/templates" element={<ProtectedProjectRoute><TemplatesAdminView /></ProtectedProjectRoute>} />
            <Route path="/settings" element={<ProtectedProjectRoute><UserSettingsView /></ProtectedProjectRoute>} />
            <Route path="/create-project" element={<ProtectedProjectRoute><ProjectCreationView /></ProtectedProjectRoute>} />
        </>
    );
}
