#!/bin/bash

# Script to convert named exports to default exports for view components
# This enables React.lazy() for code splitting

# List of all view components to convert
components=(
  "DashboardHub"
  "GanttView"
  "SprintBoardView"
  "FinancialsView"
  "NotesView"
  "ResourcesView"
  "PresentationsView"
  "ProgramTimelineView"
  "ExecutiveDashboardView"
  "MilestonesView"
  "BacklogView"
  "ReportsView"
  "EnhancedMeetingsView"
  "CalendarView"
  "StrategicDashboardView"
  "CommunicationIntelligenceView"
  "IssuesRegisterView"
  "ActionsView"
  "TraceabilityMatrixView"
  "ChildPlansView"
  "ChildGanttView"
  "UserSettingsView"
  "ProjectAdminView"
  "PlatformAdminView"
  "PlanningView"
  "ProjectCreationView"
  "TemplatesAdminView"
  "MorningBriefingView"
  "ProjectCharterView"
  "StakeholderRegisterView"
  "ScenariosView"
  "DeliverablesView"
  "ChangeRequestsView"
  "EVMView"
  "DocumentCenterView"
  "FinalReportView"
  "LessonsLearnedView"
  "RisksView"
  "DecisionsView"
  "TeamChatView"
  "TeamManagementView"
  "TrackingView"
  "TimelinePlannerTab"
  "KnowledgeBaseView"
  "ProgramDocumentsView"
  "CollaborationSpacesView"
  "ProjectPlanView"
  "DashboardView"
)

views_dir="src/components/views"
comms_dir="src/components/communications"

echo "Converting view components to default exports..."

for component in "${components[@]}"; do
  # Try views directory first
  file="$views_dir/$component.tsx"
  
  # Check if file exists in views
  if [ ! -f "$file" ]; then
    # Try communications directory
    file="$comms_dir/$component.tsx"
  fi
  
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Replace: export function ComponentName with export default function ComponentName
    # Replace: export const ComponentName with export default const ComponentName  
    sed -i '' "s/^export function $component/export default function $component/g" "$file"
    sed -i '' "s/^export const $component/export default const $component/g" "$file"
    
    echo "  ✓ Converted $component"
  else
    echo "  ⚠ File not found: $component"
  fi
done

echo ""
echo "✅ Conversion complete!"
echo "Next step: Update App.tsx to use lazy imports"
