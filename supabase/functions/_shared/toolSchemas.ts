/**
 * _shared/toolSchemas.ts
 *
 * All OpenAI function-calling tool schemas for agent tools.
 * Imported by ai-orchestrator to populate the `tools` array.
 */

export interface ToolSchema {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
}

// ─── Project & HR Core Tools ────────────────────────────────────────────────

export const coreTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "create_project",
            description: "Create a new project in the system.",
            parameters: {
                type: "object",
                required: ["title", "type", "description"],
                properties: {
                    title: { type: "string", description: "Project title" },
                    type: { type: "string", description: "e.g. Enterprise, Internal" },
                    description: { type: "string" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "assign_team_members",
            description: "Assign multiple team members to a project.",
            parameters: {
                type: "object",
                required: ["project_id", "count"],
                properties: {
                    project_id: { type: "string" },
                    count: { type: "integer", description: "Number of random existing users to assign" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "log_leave_request",
            description: "Log leave requests for team members.",
            parameters: {
                type: "object",
                required: ["project_id", "count", "types"],
                properties: {
                    project_id: { type: "string" },
                    count: { type: "integer" },
                    types: { type: "array", items: { type: "string" } },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "create_phase",
            description: "Create a project delivery phase.",
            parameters: {
                type: "object",
                required: ["project_id", "name"],
                properties: {
                    project_id: { type: "string" },
                    name: { type: "string" },
                    description: { type: "string" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "set_project_budget",
            description: "Set or update the total project budget.",
            parameters: {
                type: "object",
                required: ["project_id", "amount"],
                properties: {
                    project_id: { type: "string" },
                    amount: { type: "number" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "log_expense",
            description: "Log an expense against a project budget.",
            parameters: {
                type: "object",
                required: ["project_id", "amount", "description"],
                properties: {
                    project_id: { type: "string" },
                    amount: { type: "number" },
                    description: { type: "string" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "create_milestone",
            description: "Create a project milestone.",
            parameters: {
                type: "object",
                required: ["project_id", "name"],
                properties: {
                    project_id: { type: "string" },
                    name: { type: "string" },
                    due_date: { type: "string" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "create_requirement",
            description: "Log a requirement in the traceability matrix.",
            parameters: {
                type: "object",
                required: ["project_id", "code", "description"],
                properties: {
                    project_id: { type: "string" },
                    code: { type: "string" },
                    description: { type: "string" },
                    status: { type: "string" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "validate_requirements",
            description: "Check for duplicate requirements.",
            parameters: {
                type: "object",
                required: ["project_id"],
                properties: {
                    project_id: { type: "string" },
                },
            },
        },
    },
];

// ─── P0.1 Task Orchestrator ──────────────────────────────────────────────────

export const taskTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "create_task",
            description:
                "Create a new task in the project. Use when the user asks to add, create or schedule a task.",
            parameters: {
                type: "object",
                required: ["title", "project_id"],
                properties: {
                    title: { type: "string", description: "Task title" },
                    project_id: { type: "string", description: "Project UUID" },
                    description: { type: "string" },
                    assignee_id: { type: "string", description: "User UUID of assignee" },
                    due_date: { type: "string", format: "date", description: "YYYY-MM-DD" },
                    sprint_id: { type: "string" },
                    priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                    status: { type: "string", enum: ["todo", "in_progress", "review", "done"] },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "update_task",
            description: "Update one or more fields of an existing task.",
            parameters: {
                type: "object",
                required: ["task_id"],
                properties: {
                    task_id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    assignee_id: { type: "string" },
                    due_date: { type: "string", format: "date" },
                    priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                    status: { type: "string", enum: ["todo", "in_progress", "review", "done"] },
                    sprint_id: { type: "string" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "move_task_to_sprint",
            description: "Move a task to a different sprint.",
            parameters: {
                type: "object",
                required: ["task_id", "target_sprint_id"],
                properties: {
                    task_id: { type: "string" },
                    target_sprint_id: { type: "string" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "bulk_create_tasks",
            description: "Create multiple tasks at once from a structured list.",
            parameters: {
                type: "object",
                required: ["project_id", "tasks"],
                properties: {
                    project_id: { type: "string" },
                    tasks: {
                        type: "array",
                        items: {
                            type: "object",
                            required: ["title"],
                            properties: {
                                title: { type: "string" },
                                description: { type: "string" },
                                assignee_id: { type: "string" },
                                due_date: { type: "string" },
                                priority: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    },
];

// ─── P0.2 PDF Report Generator ───────────────────────────────────────────────

export const reportTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "generate_pdf_report",
            description:
                "Generate a PDF status report for the project and return a signed download URL. Use when the user asks for a status report, executive summary, or PDF export.",
            parameters: {
                type: "object",
                required: ["project_id", "report_type"],
                properties: {
                    project_id: { type: "string" },
                    report_type: {
                        type: "string",
                        enum: ["status", "executive_summary", "risk_report", "budget_report", "milestone_report"],
                    },
                    include_sections: {
                        type: "array",
                        items: { type: "string", enum: ["summary", "tasks", "risks", "budget", "milestones", "team", "decisions"] },
                    },
                    period: { type: "string", description: "e.g. 'this_week', 'this_month', 'all_time'" },
                },
            },
        },
    },
];

// ─── P0.3 Auto-Scheduler ─────────────────────────────────────────────────────

export const schedulerTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "auto_schedule_project",
            description:
                "Automatically reschedule project tasks to optimise the timeline. Respects dependencies and resource availability.",
            parameters: {
                type: "object",
                required: ["project_id"],
                properties: {
                    project_id: { type: "string" },
                    strategy: { type: "string", enum: ["earliest_start", "resource_leveled", "critical_path"] },
                    respect_dependencies: { type: "boolean", default: true },
                    lock_milestones: { type: "boolean", default: true },
                },
            },
        },
    },
];

// ─── P0.4 Risk Mitigator ─────────────────────────────────────────────────────

export const riskTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "create_risk",
            description: "Create a new risk entry for the project.",
            parameters: {
                type: "object",
                required: ["project_id", "title", "probability", "impact"],
                properties: {
                    project_id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    probability: { type: "integer", minimum: 1, maximum: 5 },
                    impact: { type: "integer", minimum: 1, maximum: 5 },
                    owner_id: { type: "string" },
                    mitigation_plan: { type: "string" },
                    category: { type: "string", enum: ["schedule", "budget", "scope", "resource", "technical", "external"] },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "update_risk_status",
            description: "Update the status of an existing risk.",
            parameters: {
                type: "object",
                required: ["risk_id", "status"],
                properties: {
                    risk_id: { type: "string" },
                    status: { type: "string", enum: ["open", "mitigated", "accepted", "closed"] },
                    resolution_note: { type: "string" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "escalate_risk",
            description: "Escalate a risk to a senior stakeholder.",
            parameters: {
                type: "object",
                required: ["risk_id", "escalate_to_user_id", "message"],
                properties: {
                    risk_id: { type: "string" },
                    escalate_to_user_id: { type: "string" },
                    message: { type: "string" },
                },
            },
        },
    },
];

// ─── P0.5 Meeting MoM ────────────────────────────────────────────────────────

export const meetingTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "create_meeting",
            description: "Schedule a new project meeting or event.",
            parameters: {
                type: "object",
                required: ["project_id", "title", "start_time"],
                properties: {
                    project_id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    start_time: { type: "string", format: "date-time" },
                    end_time: { type: "string", format: "date-time" },
                    meeting_type: { type: "string", enum: ["standup", "planning", "review", "retrospective", "other"] },
                    attendee_ids: { type: "array", items: { type: "string" } },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "extract_action_items",
            description:
                "Extract action items, decisions, and owners from meeting notes.",
            parameters: {
                type: "object",
                required: ["meeting_id"],
                properties: {
                    meeting_id: { type: "string" },
                    raw_notes: { type: "string", description: "Meeting notes to parse (optional if stored in DB)" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "create_tasks_from_action_items",
            description: "Create project tasks from extracted meeting action items.",
            parameters: {
                type: "object",
                required: ["meeting_id", "action_items"],
                properties: {
                    meeting_id: { type: "string" },
                    action_items: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                assignee_name: { type: "string" },
                                due_date: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "send_mom_email",
            description: "Send the minutes of meeting (MoM) email to all attendees.",
            parameters: {
                type: "object",
                required: ["meeting_id"],
                properties: {
                    meeting_id: { type: "string" },
                    recipient_ids: { type: "array", items: { type: "string" } },
                },
            },
        },
    },
];

// ─── P0.6 Excel Importer ─────────────────────────────────────────────────────

export const importerTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "import_project_plan",
            description:
                "Import tasks and milestones from a previously uploaded spreadsheet file.",
            parameters: {
                type: "object",
                required: ["project_id", "file_path"],
                properties: {
                    project_id: { type: "string" },
                    file_path: { type: "string", description: "Supabase storage path to the uploaded file" },
                    sheet_name: { type: "string", description: "Worksheet name (defaults to first sheet)" },
                    column_mapping: {
                        type: "object",
                        description: "Maps spreadsheet columns to task fields",
                        properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            assignee: { type: "string" },
                            due_date: { type: "string" },
                            priority: { type: "string" },
                        },
                    },
                },
            },
        },
    },
];

// ─── P1.1 Resource Leveler ───────────────────────────────────────────────────

export const resourceTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "level_resources",
            description: "Automatically rebalance resource assignments across tasks to eliminate over-allocation.",
            parameters: {
                type: "object",
                required: ["project_id"],
                properties: {
                    project_id: { type: "string" },
                    max_hours_per_day: { type: "number", default: 8 },
                    preserve_critical_path: { type: "boolean", default: true },
                },
            },
        },
    },
];

// ─── P1.2 Budget Controller ──────────────────────────────────────────────────

export const budgetTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "create_change_request",
            description: "Create a formal budget change request for review and approval.",
            parameters: {
                type: "object",
                required: ["project_id", "type", "amount", "description"],
                properties: {
                    project_id: { type: "string" },
                    type: { type: "string", enum: ["budget_increase", "scope_change", "timeline_extension"] },
                    amount: { type: "number" },
                    description: { type: "string" },
                    justification: { type: "string" },
                },
            },
        },
    },
];

// ─── P1.3 Sprint Planner ─────────────────────────────────────────────────────

export const sprintTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "create_sprint",
            description: "Create a new sprint/iteration for the project.",
            parameters: {
                type: "object",
                required: ["project_id", "name", "start_date", "end_date"],
                properties: {
                    project_id: { type: "string" },
                    name: { type: "string" },
                    goal: { type: "string" },
                    start_date: { type: "string", format: "date" },
                    end_date: { type: "string", format: "date" },
                    status: { type: "string", enum: ["planning", "active", "completed"] },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "plan_sprint",
            description: "Move backlog items into a sprint based on capacity and priority.",
            parameters: {
                type: "object",
                required: ["project_id", "sprint_id"],
                properties: {
                    project_id: { type: "string" },
                    sprint_id: { type: "string" },
                    strategy: { type: "string", enum: ["priority_first", "effort_balanced", "dependency_ordered"] },
                    target_velocity: { type: "number", description: "Story points or hours" },
                },
            },
        },
    },
];

// ─── P1.5 Email Triage ───────────────────────────────────────────────────────

export const emailTriageTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "create_task_from_email",
            description: "Create a project task from the content of an email.",
            parameters: {
                type: "object",
                required: ["email_id", "project_id", "task_title"],
                properties: {
                    email_id: { type: "string" },
                    project_id: { type: "string" },
                    task_title: { type: "string" },
                    description: { type: "string" },
                    assignee_id: { type: "string" },
                    due_date: { type: "string" },
                    priority: { type: "string" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "create_issue_from_email",
            description: "Create a project issue or bug from the content of an email.",
            parameters: {
                type: "object",
                required: ["email_id", "project_id", "title"],
                properties: {
                    email_id: { type: "string" },
                    project_id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                },
            },
        },
    },
];

// ─── P1.6 Stakeholder Briefer ────────────────────────────────────────────────

export const briefingTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "send_stakeholder_briefing",
            description: "Compose and send a project briefing email to specified stakeholders.",
            parameters: {
                type: "object",
                required: ["project_id", "recipient_ids"],
                properties: {
                    project_id: { type: "string" },
                    recipient_ids: { type: "array", items: { type: "string" } },
                    audience_type: { type: "string", enum: ["executive", "team", "client", "all"] },
                    tone: { type: "string", enum: ["formal", "casual", "concise"] },
                    include_sections: {
                        type: "array",
                        items: { type: "string", enum: ["summary", "risks", "milestones", "budget", "decisions"] },
                    },
                },
            },
        },
    },
];

// ─── P1.7 Document Drafter ───────────────────────────────────────────────────

export const documentTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "save_document",
            description: "Save a drafted document to the project document center.",
            parameters: {
                type: "object",
                required: ["project_id", "title", "content", "document_type"],
                properties: {
                    project_id: { type: "string" },
                    title: { type: "string" },
                    content: { type: "string", description: "Markdown or HTML content" },
                    document_type: {
                        type: "string",
                        enum: ["charter", "raid_log", "kickoff_agenda", "sow", "status_report", "lessons_learned", "other"],
                    },
                    folder_id: { type: "string" },
                },
            },
        },
    },
];

// ─── P1.4 Approval Router ────────────────────────────────────────────────────

export const approvalTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "route_for_approval",
            description: "Route a document, change request, or task for formal approval by a set of approvers.",
            parameters: {
                type: "object",
                required: ["approval_type", "approver_ids"],
                properties: {
                    approval_type: { type: "string", enum: ["document", "change_request", "risk", "budget", "task"] },
                    document_id: { type: "string" },
                    approver_ids: { type: "array", items: { type: "string" }, description: "Ordered list of approver UUIDs" },
                    deadline: { type: "string", format: "date" },
                    instructions: { type: "string" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "escalate_approval",
            description: "Escalate a stalled or rejected approval to a higher authority.",
            parameters: {
                type: "object",
                required: ["approval_id", "reason"],
                properties: {
                    approval_id: { type: "string" },
                    reason: { type: "string" },
                    escalate_to_user_id: { type: "string" },
                },
            },
        },
    },
];

// ─── P1.8 ML Retrain Trigger ─────────────────────────────────────────────────

export const mlTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "trigger_model_retrain",
            description: "Trigger a retraining job for a specified ML model.",
            parameters: {
                type: "object",
                required: ["model_id"],
                properties: {
                    model_id: { type: "string" },
                    reason: { type: "string" },
                    priority: { type: "string", enum: ["low", "normal", "high"] },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "check_model_accuracy",
            description: "Fetch current accuracy metrics for a given ML model.",
            parameters: {
                type: "object",
                required: ["model_id"],
                properties: {
                    model_id: { type: "string" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "schedule_retrain",
            description: "Set up a recurring cron schedule for automatic model retraining.",
            parameters: {
                type: "object",
                required: ["model_id", "cron_expression"],
                properties: {
                    model_id: { type: "string" },
                    cron_expression: { type: "string", description: "Standard cron format e.g. '0 2 * * 0'" },
                },
            },
        },
    },
];

// ─── P2.1 Change Impact Analyzer ─────────────────────────────────────────────

export const changeImpactTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "analyze_change_impact",
            description: "Analyse the timeline, cost, and resource impact of a proposed scope or requirement change.",
            parameters: {
                type: "object",
                required: ["project_id", "change_description"],
                properties: {
                    project_id: { type: "string" },
                    change_description: { type: "string" },
                    affected_areas: {
                        type: "array",
                        items: { type: "string", enum: ["timeline", "budget", "resources", "scope", "risks"] },
                    },
                },
            },
        },
    },
];

// ─── P2.2 Scenario Write-Back ─────────────────────────────────────────────────

export const scenarioTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "write_back_scenario",
            description: "Persist forecast scenario data to the EPM planning tables.",
            parameters: {
                type: "object",
                required: ["scenario_id", "plan_data"],
                properties: {
                    scenario_id: { type: "string" },
                    plan_data: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                account_id: { type: "string" },
                                period: { type: "string" },
                                amount: { type: "number" },
                            },
                        },
                    },
                    lock_after_save: { type: "boolean", default: false },
                },
            },
        },
    },
];

// ─── P2.3 Presentation Builder ────────────────────────────────────────────────

export const presentationTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "build_presentation",
            description: "Generate a PowerPoint or slide deck from project data and AI-written content.",
            parameters: {
                type: "object",
                required: ["project_id", "template_type"],
                properties: {
                    project_id: { type: "string" },
                    template_type: {
                        type: "string",
                        enum: ["executive_update", "kickoff", "retrospective", "lessons_learned", "board_pack"],
                    },
                    audience: { type: "string", enum: ["executive", "team", "client", "board"] },
                    include_sections: {
                        type: "array",
                        items: { type: "string" },
                    },
                },
            },
        },
    },
];

// ─── P2.4 SoD Checker ────────────────────────────────────────────────────────

export const sodTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "check_sod_conflicts",
            description: "Check for Segregation of Duties conflicts given a role assignment.",
            parameters: {
                type: "object",
                required: ["user_id", "proposed_role"],
                properties: {
                    user_id: { type: "string" },
                    proposed_role: { type: "string" },
                    tenant_id: { type: "string" },
                },
            },
        },
    },
];

// ─── P2.5 Compliance Action ──────────────────────────────────────────────────

export const complianceTools: ToolSchema[] = [
    {
        type: "function",
        function: {
            name: "flag_compliance_violation",
            description: "Log a compliance violation with full audit details.",
            parameters: {
                type: "object",
                required: ["violation_type", "description", "severity"],
                properties: {
                    violation_type: { type: "string" },
                    description: { type: "string" },
                    severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                    resource_type: { type: "string" },
                    resource_id: { type: "string" },
                    remediation_steps: { type: "string" },
                },
            },
        },
    },
];

// ─── All tools combined (for orchestrator) ───────────────────────────────────

export const ALL_TOOLS: ToolSchema[] = [
    ...taskTools,
    ...reportTools,
    ...schedulerTools,
    ...riskTools,
    ...meetingTools,
    ...importerTools,
    ...resourceTools,
    ...budgetTools,
    ...sprintTools,
    ...emailTriageTools,
    ...briefingTools,
    ...documentTools,
    ...approvalTools,
    ...mlTools,
    ...changeImpactTools,
    ...scenarioTools,
    ...presentationTools,
    ...sodTools,
    ...complianceTools,
    ...coreTools,
];

