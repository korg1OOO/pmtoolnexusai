/**
 * Application Knowledge Base
 * 
 * Comprehensive catalog of every feature, page, and capability in the Kiroxys platform.
 * Used by the AI assistant to:
 * 1. Map user problems to solutions without requiring exact commands
 * 2. Guide new users through onboarding
 * 3. Explain what specific features do
 * 4. Suggest relevant features for user needs
 */

export interface FeatureEntry {
    path: string;
    name: string;
    description: string;
    capabilities: string[];
    relatedIntents: string[];
    tier: 'free' | 'pro' | 'business';
}

export interface FeatureCategory {
    name: string;
    description: string;
    features: FeatureEntry[];
}

export const APP_KNOWLEDGE: FeatureCategory[] = [
    {
        name: 'Dashboard & Overview',
        description: 'Get a bird\'s-eye view of your project health, KPIs, and AI-generated insights.',
        features: [
            {
                path: '/dashboard', name: 'Project Dashboard', tier: 'free',
                description: 'Central project overview with progress charts, KPIs, recent activity, and AI-powered health score.',
                capabilities: ['View project health score', 'See progress charts', 'Track recent activity', 'Get AI insights', 'View overdue tasks'],
                relatedIntents: ['query_dashboard', 'query_project_status'],
            },
            {
                path: '/morning-briefing', name: 'Morning Briefing', tier: 'free',
                description: 'Daily summary of what happened overnight, what\'s due today, and critical items needing attention.',
                capabilities: ['View daily summary', 'See today\'s tasks', 'Check overnight changes', 'Review critical alerts'],
                relatedIntents: ['query_dashboard'],
            },
            {
                path: '/executive-dashboard', name: 'Executive Dashboard', tier: 'business',
                description: 'High-level portfolio view designed for executives and stakeholders with strategic KPIs.',
                capabilities: ['Portfolio-level metrics', 'Strategic KPIs', 'Cross-project comparison', 'Executive reporting'],
                relatedIntents: ['query_dashboard'],
            },
            {
                path: '/strategic-dashboard', name: 'Strategic Dashboard', tier: 'business',
                description: 'Strategic analysis tools including value mapping, stakeholder power grids, and strategic alignment.',
                capabilities: ['Value engineering', 'Stakeholder power mapping', 'Strategic alignment assessment'],
                relatedIntents: ['query_dashboard'],
            },
        ],
    },
    {
        name: 'Planning & Scheduling',
        description: 'Plan your project using phases, tasks, Gantt charts, milestones, and timeline tools.',
        features: [
            {
                path: '/project-plan', name: 'Project Plan (WBS)', tier: 'free',
                description: 'Create and manage the Work Breakdown Structure: phases, activities/tasks, durations, and dependencies.',
                capabilities: ['Create phases', 'Add tasks/activities', 'Set durations and dates', 'Define dependencies', 'Set priorities'],
                relatedIntents: ['create_phase', 'create_activities', 'query_tasks', 'update_task'],
            },
            {
                path: '/gantt', name: 'Gantt Chart', tier: 'free',
                description: 'Interactive timeline visualization with drag-and-drop scheduling, dependency lines, and critical path.',
                capabilities: ['Visual timeline', 'Drag-and-drop scheduling', 'Dependency management', 'Critical path highlighting', 'Baseline comparison'],
                relatedIntents: ['query_timeline', 'reschedule_task', 'add_dependency', 'calculate_critical_path'],
            },
            {
                path: '/milestones', name: 'Milestones', tier: 'free',
                description: 'Track key project milestones, their status, and completion dates.',
                capabilities: ['Create milestones', 'Track completion', 'Set milestone dates', 'Link to deliverables'],
                relatedIntents: ['create_milestone', 'query_milestones'],
            },
            {
                path: '/timeline-planner', name: 'Timeline Planner', tier: 'free',
                description: 'Visual timeline planning tool for scheduling phases and activities on a calendar.',
                capabilities: ['Visual scheduling', 'Phase timeline', 'Calendar-based planning'],
                relatedIntents: ['query_timeline', 'reschedule_task'],
            },
            {
                path: '/scenarios', name: 'What-If Scenarios', tier: 'pro',
                description: 'Model different project scenarios by adjusting scope, schedule, and resources to see impact.',
                capabilities: ['Scenario modeling', 'Impact analysis', 'Trade-off comparison'],
                relatedIntents: [],
            },
            {
                path: '/project-charter', name: 'Project Charter', tier: 'free',
                description: 'Define project scope, objectives, stakeholders, and key success criteria.',
                capabilities: ['Create charter', 'Define scope', 'Set objectives', 'Identify stakeholders'],
                relatedIntents: ['create_charter'],
            },
        ],
    },
    {
        name: 'Agile & Sprints',
        description: 'Run agile workflows with sprints, backlogs, epics, stories, and velocity tracking.',
        features: [
            {
                path: '/sprints', name: 'Sprint Board', tier: 'free',
                description: 'Kanban-style sprint board with drag-and-drop story management across columns (To Do, In Progress, Done).',
                capabilities: ['Manage sprints', 'Drag stories between columns', 'Track sprint progress', 'Complete sprints'],
                relatedIntents: ['create_sprint', 'query_sprint', 'update_story_status', 'complete_sprint'],
            },
            {
                path: '/backlog', name: 'Product Backlog', tier: 'free',
                description: 'Manage epics, stories, and backlog items. Prioritize and groom work items for upcoming sprints.',
                capabilities: ['Create epics', 'Create stories', 'Prioritize backlog', 'Move items to sprints', 'Estimate story points'],
                relatedIntents: ['create_epic', 'create_story', 'query_backlog', 'move_story_to_sprint'],
            },
        ],
    },
    {
        name: 'Risk & Issue Management',
        description: 'Identify, assess, and track project risks and issues with mitigation strategies.',
        features: [
            {
                path: '/risks', name: 'Risk Register', tier: 'free',
                description: 'Log, assess (probability × impact), and track risks with mitigation strategies and risk owners.',
                capabilities: ['Log risks', 'Assess probability and impact', 'Define mitigation strategies', 'Assign risk owners', 'Track risk status'],
                relatedIntents: ['log_risk', 'query_risks_issues', 'update_risk_status'],
            },
            {
                path: '/issues', name: 'Issues Register', tier: 'free',
                description: 'Log and track project issues with priority levels, assignees, and resolution tracking.',
                capabilities: ['Log issues', 'Set priority', 'Assign owners', 'Track resolution', 'Escalate issues'],
                relatedIntents: ['log_issue', 'query_risks_issues', 'update_issue_status', 'resolve_issue'],
            },
            {
                path: '/decisions', name: 'Decision Log', tier: 'free',
                description: 'Record project decisions with context, rationale, and who made them for accountability.',
                capabilities: ['Log decisions', 'Record rationale', 'Track decision makers', 'Link to meetings'],
                relatedIntents: ['log_decision', 'query_decisions'],
            },
            {
                path: '/actions', name: 'Action Items', tier: 'free',
                description: 'Track action items from meetings, reviews, and discussions with deadlines and assignees.',
                capabilities: ['Create action items', 'Assign owners', 'Set deadlines', 'Track completion'],
                relatedIntents: ['query_action_items', 'update_action_item'],
            },
        ],
    },
    {
        name: 'Financial Management',
        description: 'Manage budgets, track expenses, and perform Earned Value Management (EVM) analysis.',
        features: [
            {
                path: '/financials', name: 'Financial Dashboard', tier: 'pro',
                description: 'Budget tracking, expense management, cost variance analysis, and financial forecasting.',
                capabilities: ['Set budgets', 'Track expenses', 'Cost variance analysis', 'Financial forecasting'],
                relatedIntents: ['set_budget', 'log_expense', 'query_budget', 'update_budget'],
            },
            {
                path: '/evm', name: 'Earned Value Management', tier: 'pro',
                description: 'EVM analysis with CPI, SPI, EAC, and other earned value metrics for project health tracking.',
                capabilities: ['Calculate CPI/SPI', 'Estimate at Completion (EAC)', 'Cost/Schedule performance', 'Variance analysis'],
                relatedIntents: ['query_evm'],
            },
        ],
    },
    {
        name: 'Collaboration & Communication',
        description: 'Schedule meetings, communicate with your team, and manage project communications.',
        features: [
            {
                path: '/meetings', name: 'Meetings', tier: 'free',
                description: 'Schedule meetings, record minutes, extract action items, and track follow-ups.',
                capabilities: ['Schedule meetings', 'Record minutes', 'Extract action items', 'Track follow-ups', 'Manage agendas'],
                relatedIntents: ['schedule_meeting', 'query_meetings', 'update_meeting', 'cancel_meeting'],
            },
            {
                path: '/calendar', name: 'Calendar', tier: 'free',
                description: 'Visual calendar showing meetings, milestones, deadlines, and sprints.',
                capabilities: ['View schedule', 'See deadlines', 'Track milestones', 'Meeting calendar'],
                relatedIntents: ['query_calendar'],
            },
            {
                path: '/team-chat', name: 'Team Chat', tier: 'free',
                description: 'Real-time team messaging within the project context.',
                capabilities: ['Send messages', 'Team communication', 'Project discussions'],
                relatedIntents: [],
            },
            {
                path: '/communications', name: 'Communications', tier: 'free',
                description: 'Communication management and stakeholder communication tracking.',
                capabilities: ['Track communications', 'Manage stakeholder outreach'],
                relatedIntents: [],
            },
        ],
    },
    {
        name: 'Documents & Knowledge',
        description: 'Manage project documents, notes, knowledge base, and presentations.',
        features: [
            {
                path: '/documents', name: 'Document Center', tier: 'free',
                description: 'Upload, organize, and manage project documents with version control and approval workflows.',
                capabilities: ['Upload documents', 'Version control', 'Approval workflows', 'Document categorization'],
                relatedIntents: ['query_documents', 'update_document_status'],
            },
            {
                path: '/notes', name: 'Notes', tier: 'free',
                description: 'Rich-text project notes with a built-in WYSIWYG editor.',
                capabilities: ['Create notes', 'Rich text editing', 'Organize by category'],
                relatedIntents: ['create_note', 'query_notes'],
            },
            {
                path: '/knowledge-base', name: 'Knowledge Base', tier: 'free',
                description: 'Centralized knowledge repository for project documentation and reference materials.',
                capabilities: ['Build knowledge base', 'Organize reference materials', 'Search documentation'],
                relatedIntents: [],
            },
            {
                path: '/presentations', name: 'Presentations', tier: 'free',
                description: 'AI-generated project presentations for stakeholder meetings and steering committees.',
                capabilities: ['Generate presentations', 'SteerCo reports', 'Stakeholder updates'],
                relatedIntents: ['generate_presentation'],
            },
        ],
    },
    {
        name: 'Governance & Compliance',
        description: 'Manage deliverables, change requests, approvals, stakeholders, requirements, and quality.',
        features: [
            {
                path: '/deliverables', name: 'Deliverables', tier: 'free',
                description: 'Track project deliverables, their status, acceptance criteria, and approval workflow.',
                capabilities: ['Create deliverables', 'Track status', 'Approval workflow', 'Acceptance criteria'],
                relatedIntents: ['create_deliverables', 'query_deliverables', 'update_deliverable'],
            },
            {
                path: '/change-requests', name: 'Change Requests', tier: 'free',
                description: 'Formal change management with impact analysis, approval workflows, and tracking.',
                capabilities: ['Submit change requests', 'Impact analysis', 'Approval workflow', 'Track changes'],
                relatedIntents: ['create_change_request', 'query_change_requests', 'update_change_request'],
            },
            {
                path: '/stakeholders', name: 'Stakeholder Register', tier: 'free',
                description: 'Identify and manage project stakeholders with influence/interest analysis.',
                capabilities: ['Register stakeholders', 'Power/interest mapping', 'Communication planning'],
                relatedIntents: ['create_stakeholder', 'query_stakeholders'],
            },
            {
                path: '/requirements', name: 'Requirements Matrix', tier: 'business',
                description: 'Requirements traceability matrix linking requirements to deliverables and test cases.',
                capabilities: ['Log requirements', 'RTM traceability', 'Link to deliverables', 'Validation tracking'],
                relatedIntents: ['log_requirement', 'query_requirements'],
            },
            {
                path: '/quality', name: 'Quality Register', tier: 'business',
                description: 'Quality management with defect tracking, quality metrics, and audit records.',
                capabilities: ['Log quality items', 'Track defects', 'Quality metrics', 'Audit records'],
                relatedIntents: ['create_quality_item', 'query_quality_items'],
            },
            {
                path: '/traceability', name: 'Traceability Matrix', tier: 'business',
                description: 'Map relationships between requirements, deliverables, tasks, and test cases.',
                capabilities: ['Map traceability', 'Link requirements to deliverables', 'Impact analysis'],
                relatedIntents: ['map_traceability'],
            },
        ],
    },
    {
        name: 'Team & Resources',
        description: 'Manage team members, resource allocation, and team capacity.',
        features: [
            {
                path: '/team-management', name: 'Team Management', tier: 'free',
                description: 'Add/remove team members, assign roles, manage leave, and view team capacity.',
                capabilities: ['Add members', 'Assign roles', 'Manage leave', 'View capacity', 'Workload analysis'],
                relatedIntents: ['assign_members', 'query_team', 'log_leave'],
            },
            {
                path: '/resources', name: 'Resources', tier: 'free',
                description: 'Resource planning and allocation across project phases and tasks.',
                capabilities: ['Resource planning', 'Allocation tracking', 'Capacity planning'],
                relatedIntents: ['query_resources'],
            },
        ],
    },
    {
        name: 'Reports & Closure',
        description: 'Generate reports, track lessons learned, and close out projects.',
        features: [
            {
                path: '/reports', name: 'Reports', tier: 'free',
                description: 'Generate project status reports, progress reports, and custom reports.',
                capabilities: ['Status reports', 'Progress reports', 'Custom report generation', 'Export to PDF'],
                relatedIntents: ['generate_presentation'],
            },
            {
                path: '/final-report', name: 'Final Report', tier: 'free',
                description: 'Comprehensive project closure report with outcomes, metrics, and recommendations.',
                capabilities: ['Generate closure report', 'Project outcomes', 'Performance metrics'],
                relatedIntents: ['generate_final_report'],
            },
            {
                path: '/lessons-learned', name: 'Lessons Learned', tier: 'free',
                description: 'Document and share project lessons learned for organizational knowledge.',
                capabilities: ['Log lessons', 'Categorize learnings', 'Share across projects'],
                relatedIntents: ['log_lesson_learned', 'query_lessons_learned'],
            },
        ],
    },
    {
        name: 'Portfolio & Program',
        description: 'Manage multiple projects as a portfolio or program with cross-project views.',
        features: [
            {
                path: '/portfolio', name: 'Portfolio View', tier: 'business',
                description: 'Cross-project portfolio view with aggregated health scores, budgets, and timelines.',
                capabilities: ['Portfolio dashboard', 'Cross-project comparison', 'Aggregated metrics'],
                relatedIntents: [],
            },
            {
                path: '/program', name: 'Program Management', tier: 'business',
                description: 'Manage related projects as a program with shared resources and dependencies.',
                capabilities: ['Program overview', 'Cross-project dependencies', 'Shared resource management'],
                relatedIntents: [],
            },
        ],
    },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Builds a compressed knowledge string for injection into AI system prompts.
 */
export function getKnowledgeForSystemPrompt(): string {
    const lines: string[] = [
        'APPLICATION CAPABILITIES:',
        'The Kiroxys platform provides the following features. Use this knowledge to help users find the right feature for their needs.',
        '',
    ];

    for (const category of APP_KNOWLEDGE) {
        lines.push(`## ${category.name}`);
        lines.push(category.description);
        for (const feature of category.features) {
            lines.push(`- **${feature.name}** (${feature.path}): ${feature.description}`);
            lines.push(`  Capabilities: ${feature.capabilities.join(', ')}`);
        }
        lines.push('');
    }

    lines.push('GUIDANCE:');
    lines.push('- When a user describes a problem, suggest the most relevant feature(s) with navigation links.');
    lines.push('- When a user asks "what can I do" or "help me", provide a categorized overview.');
    lines.push('- When a user mentions they are new, offer to walk them through project setup step by step.');
    lines.push('- Always reference specific page paths so the user can navigate directly.');

    return lines.join('\n');
}

/**
 * Finds features matching a user's described problem or need.
 */
export function findRelevantFeatures(userQuery: string): FeatureEntry[] {
    const lower = userQuery.toLowerCase();
    const results: FeatureEntry[] = [];

    for (const category of APP_KNOWLEDGE) {
        for (const feature of category.features) {
            const score = calculateRelevanceScore(lower, feature);
            if (score > 0) {
                results.push(feature);
            }
        }
    }

    return results.slice(0, 5); // Top 5 matches
}

function calculateRelevanceScore(query: string, feature: FeatureEntry): number {
    let score = 0;
    const words = feature.name.toLowerCase().split(' ');

    // Name match
    for (const word of words) {
        if (query.includes(word) && word.length > 2) score += 3;
    }

    // Description keyword match
    const descWords = feature.description.toLowerCase().split(' ');
    for (const word of descWords) {
        if (query.includes(word) && word.length > 3) score += 1;
    }

    // Capability match
    for (const cap of feature.capabilities) {
        const capWords = cap.toLowerCase().split(' ');
        for (const word of capWords) {
            if (query.includes(word) && word.length > 3) score += 2;
        }
    }

    return score;
}

/**
 * Generates a full onboarding guide for new users.
 */
export function getOnboardingGuide(): string {
    return `# 🚀 Welcome to Kiroxys!

Here's how to get started with your project management journey:

## Step 1: Create Your Project
Say **"Create a new project called [your project name]"** to get started.

## Step 2: Set Up Your Plan
- **Add Phases**: "Create phases for my project" — define your project phases (Initiation, Planning, Execution, etc.)
- **Add Tasks**: "Create 5 tasks for [phase name]" — break down phases into actionable tasks
- **Set Dates**: Use the **Gantt Chart** (/gantt) for visual timeline planning

## Step 3: Build Your Team
- **Add Members**: "Assign member [email] as [role]" — invite team members
- **View Team**: "Show my team" — see who's on the project

## Step 4: Track Progress
- **Update Tasks**: "Mark task [name] as complete" — track progress
- **View Dashboard**: "Show dashboard" — see your project health at a glance
- **Morning Briefing**: Visit /morning-briefing for daily updates

## Step 5: Manage Risks & Issues
- **Log Risks**: "Log a risk: [description]" — identify potential problems early
- **Track Issues**: "Log an issue: [description]" — record and manage issues

## Additional Features
- **📊 Financials** — Set budgets and track expenses (/financials)
- **📅 Meetings** — Schedule and manage meetings (/meetings)
- **📄 Documents** — Upload and manage project documents (/documents)
- **🏃 Sprints** — Run agile sprints with a Kanban board (/sprints)
- **📈 Reports** — Generate project reports and presentations (/reports)

💡 **Tip:** You can always ask me "What can I do?" or describe your problem and I'll suggest the right feature!`;
}
