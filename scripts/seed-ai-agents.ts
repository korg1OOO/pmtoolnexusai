/**
 * scripts/seed-ai-agents.ts
 * 
 * Seeds all 13 P0/P1/P2 agentic AI agents into the ai_agents table.
 * Uses the pg client with direct DB connection (bypasses PostgREST schema cache).
 * 
 * Run:
 *   npx tsx scripts/seed-ai-agents.ts
 */

import { Client } from "pg";

const DATABASE_URL =
    "postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

const AGENTS = [
    // ── P0 — High Value Agents ─────────────────────────────────────────────────
    {
        agent_type: "task-orchestrator",
        label: "Task Orchestrator",
        description: "Creates, updates, moves, and bulk-manages tasks across sprints and projects. Handles action items from meetings. P0 highest-value agent.",
        icon: "ClipboardList",
        color: "text-blue-500",
        model_provider: "openai",
        model_name: "gpt-4o",
        max_tokens: 4000,
        temperature: 0.3,
        priority_tier: "P0",
        tools: ["create_task", "update_task", "move_task_to_sprint", "bulk_create_tasks", "create_tasks_from_action_items"],
        system_prompt: `You are the Task Orchestrator agent for Kiroxys. You have the ability to create, update, move, and bulk-manage tasks. When a user asks you to create tasks, update statuses, move items to sprints, or generate tasks from meeting notes — use the appropriate tool. Always confirm before performing bulk operations. For every tool call that modifies data, use the confirmation gate.`,
    },
    {
        agent_type: "pdf-report-generator",
        label: "PDF Report Generator",
        description: "Generates professional PDF status reports and project summaries. Supports custom templates and branding. P0 agent.",
        icon: "FileText",
        color: "text-indigo-500",
        model_provider: "openai",
        model_name: "gpt-4o",
        max_tokens: 4000,
        temperature: 0.2,
        priority_tier: "P0",
        tools: ["generate_pdf_report"],
        system_prompt: `You are the PDF Report Generator agent. You create professional project status reports, executive summaries, and progress documents. When asked to generate reports, use the generate_pdf_report tool with appropriate parameters. Format output cleanly and professionally.`,
    },
    {
        agent_type: "auto-scheduler",
        label: "Auto Scheduler",
        description: "Automatically optimizes project schedules — rescheduling tasks, resolving conflicts, and balancing workloads. P0 agent.",
        icon: "Calendar",
        color: "text-cyan-500",
        model_provider: "openai",
        model_name: "gpt-4o",
        max_tokens: 4000,
        temperature: 0.2,
        priority_tier: "P0",
        tools: ["auto_schedule_project"],
        system_prompt: `You are the Auto Scheduler agent. You optimize project schedules by analyzing task dependencies, resource availability, and deadlines. Use auto_schedule_project to reschedule and optimize. Always show before/after comparison and confirm before applying changes.`,
    },
    {
        agent_type: "risk-mitigator",
        label: "Risk Mitigator",
        description: "Identifies, escalates, and mitigates project risks. Creates mitigation plans and tracks risk register. P0 agent.",
        icon: "AlertTriangle",
        color: "text-orange-500",
        model_provider: "openai",
        model_name: "gpt-4o",
        max_tokens: 4000,
        temperature: 0.3,
        priority_tier: "P0",
        tools: ["create_risk", "update_risk_status", "escalate_risk"],
        system_prompt: `You are the Risk Mitigator agent. You proactively identify risks, create risk register entries, escalate high-severity items, and generate mitigation plans. Use structured risk assessment (probability × impact). Always tag risks with category (technical, schedule, budget, resource).`,
    },
    {
        agent_type: "meeting-mom-generator",
        label: "Meeting MoM Generator",
        description: "Extracts action items from meeting notes and generates formatted Minutes of Meeting documents. P0 agent.",
        icon: "Video",
        color: "text-pink-500",
        model_provider: "openai",
        model_name: "gpt-4o",
        max_tokens: 4000,
        temperature: 0.3,
        priority_tier: "P0",
        tools: ["extract_action_items", "create_tasks_from_action_items", "send_mom_email"],
        system_prompt: `You are the Meeting MoM Generator agent. You analyze meeting transcripts and notes to extract action items, decisions, and follow-ups. Generate structured Minutes of Meeting documents, create tasks, and distribute via email. Format output with clear sections: Attendees, Agenda, Decisions, Action Items, Next Steps.`,
    },
    {
        agent_type: "excel-importer",
        label: "Excel / CSV Importer",
        description: "Imports project plans, resource schedules, and data from Excel/CSV files. Validates and maps to project structure. P0 agent.",
        icon: "FileSpreadsheet",
        color: "text-green-500",
        model_provider: "openai",
        model_name: "gpt-4o",
        max_tokens: 3000,
        temperature: 0.1,
        priority_tier: "P0",
        tools: ["import_project_plan"],
        system_prompt: `You are the Excel/CSV Importer agent. You help project managers import data from spreadsheets into the system. Validate data structure, map columns to project fields, detect conflicts with existing data, and confirm before committing imports.`,
    },
    // ── P1 — Significant Value Agents ─────────────────────────────────────────
    {
        agent_type: "resource-leveler",
        label: "Resource Leveler",
        description: "Automatically levels resource workloads across the project, resolving over-allocation and bottlenecks. P1 agent.",
        icon: "Users",
        color: "text-purple-500",
        model_provider: "openai",
        model_name: "gpt-4o",
        max_tokens: 4000,
        temperature: 0.2,
        priority_tier: "P1",
        tools: ["level_resources"],
        system_prompt: `You are the Resource Leveler agent. You analyze resource assignments and workloads across the project, identify over-allocations, and automatically rebalance task assignments to smooth out peaks. Use level_resources to trigger auto-scheduling with resource constraints.`,
    },
    {
        agent_type: "sprint-planner",
        label: "Sprint Planner",
        description: "Plans sprints intelligently using velocity, team capacity, and backlog priorities. P1 agent.",
        icon: "Zap",
        color: "text-amber-500",
        model_provider: "openai",
        model_name: "gpt-4o",
        max_tokens: 4000,
        temperature: 0.3,
        priority_tier: "P1",
        tools: ["plan_sprint"],
        system_prompt: `You are the Sprint Planner agent. You help teams plan sprints by analyzing team velocity, individual capacities, and backlog item priorities. Suggest optimal sprint composition, identify risks, and automatically assign tasks using plan_sprint.`,
    },
    {
        agent_type: "approval-router",
        label: "Approval Router",
        description: "Routes documents, change requests, and deliverables through formal approval workflows. Handles escalations. P1 agent.",
        icon: "GitBranch",
        color: "text-blue-500",
        model_provider: "openai",
        model_name: "gpt-4o",
        max_tokens: 3000,
        temperature: 0.2,
        priority_tier: "P1",
        tools: ["route_for_approval", "escalate_approval"],
        system_prompt: `You are the Approval Router agent. You manage formal approval workflows — routing change requests, documents, and deliverables to the right approvers. Handle multi-step approvals, escalate stalled items, and track approval status. Use maker-checker pattern for all approvals.`,
    },
    {
        agent_type: "ml-retrain-trigger",
        label: "ML Retrain Trigger",
        description: "Monitors ML model accuracy and triggers retraining when drift is detected. Manages model lifecycle. P1 agent.",
        icon: "Brain",
        color: "text-violet-500",
        model_provider: "openai",
        model_name: "gpt-4o",
        max_tokens: 3000,
        temperature: 0.1,
        priority_tier: "P1",
        tools: ["trigger_model_retrain", "check_model_accuracy", "schedule_retrain"],
        system_prompt: `You are the ML Retrain Trigger agent. You monitor machine learning model performance metrics, detect accuracy drift, and trigger retraining pipelines when needed. Report model health, schedule preventive retraining, and ensure models stay within accuracy thresholds.`,
    },
    // ── P2 — Strategic / Analytic Agents ──────────────────────────────────────
    {
        agent_type: "change-impact-analyzer",
        label: "Change Impact Analyzer",
        description: "Analyzes the full impact of proposed changes on timeline, budget, resources, and risks before approval. P2 agent.",
        icon: "BarChart3",
        color: "text-red-500",
        model_provider: "openai",
        model_name: "gpt-4o",
        max_tokens: 6000,
        temperature: 0.2,
        priority_tier: "P2",
        tools: ["analyze_change_impact"],
        system_prompt: `You are the Change Impact Analyzer agent. You perform comprehensive impact assessments for proposed project changes. Analyze effects on timeline (critical path), budget, resource allocation, open risks, and dependent deliverables. Provide structured reports with probability-weighted impact scores and go/no-go recommendations.`,
    },
    {
        agent_type: "scenario-write-back",
        label: "Scenario Write-Back",
        description: "Saves financial scenarios and budget models back to the planning database with version control. P2 agent.",
        icon: "Database",
        color: "text-teal-500",
        model_provider: "openai",
        model_name: "gpt-4o",
        max_tokens: 4000,
        temperature: 0.1,
        priority_tier: "P2",
        tools: ["write_back_scenario"],
        system_prompt: `You are the Scenario Write-Back agent. You manage financial planning scenarios — saving budget models, forecasts, and scenario comparisons to the planning database. Ensure version control, locking of approved scenarios, and audit trails for all write-back operations.`,
    },
    {
        agent_type: "presentation-builder",
        label: "Presentation Builder",
        description: "Builds executive and stakeholder presentations from project data — auto-generating slides, charts, and summaries. P2 agent.",
        icon: "Presentation",
        color: "text-rose-500",
        model_provider: "openai",
        model_name: "gpt-4o",
        max_tokens: 6000,
        temperature: 0.4,
        priority_tier: "P2",
        tools: ["build_presentation"],
        system_prompt: `You are the Presentation Builder agent. You create professional executive presentations from live project data. Generate slide decks with status summaries, milestone progress, risk heatmaps, financial overview, and action items. Target executive audiences with clear, visual-first storytelling.`,
    },
    {
        agent_type: "sod-checker",
        label: "SoD Checker",
        description: "Detects Segregation of Duties conflicts in role assignments, ensuring governance and compliance. P2 agent.",
        icon: "Shield",
        color: "text-emerald-500",
        model_provider: "openai",
        model_name: "gpt-4o",
        max_tokens: 3000,
        temperature: 0.1,
        priority_tier: "P2",
        tools: ["check_sod_conflicts"],
        system_prompt: `You are the SoD Checker agent. You enforce Segregation of Duties policies by detecting conflicting role assignments. Analyze user permissions against SoD rules, flag violations, generate compliance reports, and recommend remediation. Operate with zero tolerance for high-risk conflicts.`,
    },
    {
        agent_type: "compliance-action",
        label: "Compliance Action Agent",
        description: "Flags compliance violations, creates remediation tasks, and maintains the compliance violation register. P2 agent.",
        icon: "ClipboardCheck",
        color: "text-orange-500",
        model_provider: "openai",
        model_name: "gpt-4o",
        max_tokens: 3000,
        temperature: 0.1,
        priority_tier: "P2",
        tools: ["flag_compliance_violation"],
        system_prompt: `You are the Compliance Action agent. You identify, document, and remediate compliance violations. Flag violations with severity ratings, create structured violation records, generate remediation plans, assign corrective actions, and track resolution. Maintain immutable audit trails for all compliance events.`,
    },
];

async function seed() {
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    console.log("✅ Connected to Supabase DB\n");

    let inserted = 0;
    let skipped = 0;
    let updated = 0;

    for (const agent of AGENTS) {
        const { agent_type, label, description, icon, color, model_provider, model_name, max_tokens, temperature, system_prompt } = agent;

        // Check if agent already exists
        const existing = await client.query(
            "SELECT id, label FROM public.ai_agents WHERE agent_type = $1",
            [agent_type]
        );

        if (existing.rows.length > 0) {
            // Update existing
            await client.query(
                `UPDATE public.ai_agents SET
          label = $1, description = $2, icon = $3, color = $4,
          system_prompt = $5, model_provider = $6, model_name = $7,
          max_tokens = $8, temperature = $9, is_active = true,
          updated_at = NOW()
        WHERE agent_type = $10`,
                [label, description, icon, color, system_prompt, model_provider, model_name, max_tokens, temperature, agent_type]
            );
            console.log(`  ↻ Updated : [${(agent as any).priority_tier}] ${label}`);
            updated++;
        } else {
            // Insert new
            await client.query(
                `INSERT INTO public.ai_agents (agent_type, label, description, icon, color, system_prompt, model_provider, model_name, max_tokens, temperature, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)`,
                [agent_type, label, description, icon, color, system_prompt, model_provider, model_name, max_tokens, temperature]
            );
            console.log(`  ✚ Inserted: [${(agent as any).priority_tier}] ${label}`);
            inserted++;
        }
    }

    await client.end();

    console.log(`\n══════════════════════════════════════════`);
    console.log(`  Seeding complete:`);
    console.log(`    Inserted: ${inserted}`);
    console.log(`    Updated:  ${updated}`);
    console.log(`    Skipped:  ${skipped}`);
    console.log(`    Total:    ${AGENTS.length} agents`);
    console.log(`══════════════════════════════════════════\n`);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err.message);
    process.exitCode = 1;
});
