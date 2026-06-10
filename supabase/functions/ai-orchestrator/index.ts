import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { loadAgentConfig, loadAgentCapabilities, getDefaultSystemPrompt, type AIAgentConfig } from "../_shared/agentLoader.ts";
import { deductCredits, getTenantId } from "../_shared/creditDeduction.ts";
import { ALL_TOOLS, type ToolSchema } from "../_shared/toolSchemas.ts";
import { dispatchTool, type ExecutorContext } from "../_shared/toolExecutor.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =============================================================================
// TYPES
// =============================================================================

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface IntentClassification {
  primary_intent: string;
  secondary_intents: string[];
  requires_modification: boolean;
  confidence: number;
}

interface AgentInput {
  query: string;
  projectId: string;
  userRole: string;
  conversationHistory: Message[];
  projectContext: Record<string, unknown>;
  // credit billing context (optional, passed through from main handler)
  supabase?: SupabaseClient;
  userId?: string | null;
  tenantId?: string | null;
  tools?: ToolSchema[];
  executorCtx?: ExecutorContext;
}

interface AgentOutput {
  response: string;
  agentType: string;
  actions?: Array<{ type: string; description: string; data?: unknown }>;
  confidence: number;
  metadata?: Record<string, unknown>;
  // Agentic tool-calling fields
  requiresConfirmation?: boolean;
  pendingActionId?: string;
  diff?: Record<string, unknown>;
  toolName?: string;
  toolResult?: unknown;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const INTENT_CATEGORIES = [
  "SCHEDULE_QUERY",
  "SCHEDULE_MODIFY",
  "BUDGET_QUERY",
  "BUDGET_ANALYSIS",
  "RISK_QUERY",
  "RISK_ANALYZE",
  "RESOURCE_QUERY",
  "RESOURCE_ASSIGN",
  "MEETING_QUERY",
  "MEETING_GENERATE",
  "REPORT_GENERATE",
  "INSIGHT_REQUEST",
  "STRATEGIC_ANALYSIS",
  "COMMUNICATION_SCAN",
  "GENERAL_CHAT",
] as const;

type IntentCategory = typeof INTENT_CATEGORIES[number];

// Permission requirements for each agent
const AGENT_PERMISSIONS: Record<string, string[]> = {
  scheduler: ["SCHEDULE_EDIT"],
  finance: ["FINANCE_VIEW"],
  risk: ["RISK_MANAGE", "VIEW_ALL"],
  assignment: ["TEAM_MANAGE"],
  meeting: ["MEETING_MANAGE"],
  document: ["DOC_GENERATE"],
  insight: ["VIEW_ALL"],
  strategic: ["VIEW_ALL"],
  communication: ["VIEW_ALL"],
};

// Role permission matrix
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["SCHEDULE_EDIT", "FINANCE_VIEW", "FINANCE_EDIT", "RISK_MANAGE", "TEAM_MANAGE", "MEETING_MANAGE", "DOC_GENERATE", "VIEW_ALL"],
  pm: ["SCHEDULE_EDIT", "FINANCE_VIEW", "FINANCE_EDIT", "RISK_MANAGE", "TEAM_MANAGE", "MEETING_MANAGE", "DOC_GENERATE", "VIEW_ALL"],
  lead: ["SCHEDULE_EDIT", "RISK_MANAGE", "TEAM_MANAGE", "MEETING_MANAGE", "DOC_GENERATE", "VIEW_ALL"],
  developer: ["MEETING_MANAGE", "DOC_GENERATE", "VIEW_ALL"],
  analyst: ["MEETING_MANAGE", "DOC_GENERATE", "VIEW_ALL"],
  viewer: ["VIEW_ALL"],
};

// Intent to agent mapping
const INTENT_TO_AGENT: Record<string, string> = {
  SCHEDULE_QUERY: "scheduler",
  SCHEDULE_MODIFY: "scheduler",
  BUDGET_QUERY: "finance",
  BUDGET_ANALYSIS: "finance",
  RISK_QUERY: "risk",
  RISK_ANALYZE: "risk",
  RESOURCE_QUERY: "assignment",
  RESOURCE_ASSIGN: "assignment",
  MEETING_QUERY: "meeting",
  MEETING_GENERATE: "meeting",
  REPORT_GENERATE: "document",
  INSIGHT_REQUEST: "insight",
  STRATEGIC_ANALYSIS: "strategic",
  COMMUNICATION_SCAN: "communication",
  GENERAL_CHAT: "insight",
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function hasPermission(userRole: string, requiredPermissions: string[]): boolean {
  const rolePerms = ROLE_PERMISSIONS[userRole] || [];
  return requiredPermissions.some(perm => rolePerms.includes(perm));
}

function getPermissionDenialResponse(userRole: string, action: string, requiredPermission: string): string {
  const alternatives = ROLE_PERMISSIONS[userRole] || [];
  const alternativeActions = [];

  if (alternatives.includes("VIEW_ALL")) {
    alternativeActions.push("View project status and timeline");
    alternativeActions.push("Get insights and recommendations");
  }
  if (alternatives.includes("MEETING_MANAGE")) {
    alternativeActions.push("Summarize meeting notes");
    alternativeActions.push("Track action items");
  }

  return `I understand you'd like to ${action}, but your current role (${userRole}) doesn't have the required ${requiredPermission} permission.

What I can help you with instead:
${alternativeActions.map(a => `• ${a}`).join("\n")}

Would you like me to help with one of these, or should I request elevated access on your behalf?`;
}

// =============================================================================
// CLARIFYING QUESTION TYPES
// =============================================================================

interface ClarifyingQuestion {
  id: string;
  question: string;
  options: Array<{ id: string; label: string; description?: string }>;
  multiSelect?: boolean;
  context?: string;
}

interface IntentClassificationWithClarification extends IntentClassification {
  needs_clarification?: boolean;
  clarifying_question?: ClarifyingQuestion;
}

// =============================================================================
// INTENT CLASSIFIER
// =============================================================================

async function classifyIntent(query: string, conversationHistory: Message[]): Promise<IntentClassificationWithClarification> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const classificationPrompt = `You are an intent classifier for a project management AI system.

Given a user message, classify it into ONE primary category from this list:
- SCHEDULE_QUERY: Questions about dates, timelines, milestones, deadlines
- SCHEDULE_MODIFY: Requests to change dates, move tasks, adjust dependencies
- BUDGET_QUERY: Questions about costs, budget, spending, expenses
- BUDGET_ANALYSIS: Requests for cost analysis, forecasting, variance analysis
- RISK_QUERY: Questions about risks, issues, blockers, problems
- RISK_ANALYZE: Requests for risk assessment, impact analysis, mitigation
- RESOURCE_QUERY: Questions about team, availability, workload, assignments
- RESOURCE_ASSIGN: Requests to assign tasks, allocate resources, balance workload
- MEETING_QUERY: Questions about meetings, decisions, action items
- MEETING_GENERATE: Requests to create MoM, summarize meetings, extract actions
- REPORT_GENERATE: Requests for reports, status updates, executive summaries
- INSIGHT_REQUEST: General project health, predictions, recommendations
- STRATEGIC_ANALYSIS: Trade-off analysis, value engineering, stakeholder insights
- COMMUNICATION_SCAN: Check communications for patterns, delay signals, sentiment
- GENERAL_CHAT: General conversation, greetings, unclear intent

IMPORTANT: If the user's request is AMBIGUOUS or lacks specific details needed to complete the task, set needs_clarification to true and provide a clarifying_question. Examples of ambiguous requests:
- "Generate the document" (which document? status report? executive summary?)
- "Update the task" (which task? what changes?)
- "Show me the budget" (which aspect? overall? by resource? by phase?)
- "Create a report" (what type? for whom? what period?)

Consider recent conversation context when classifying.

Output ONLY valid JSON in this exact format:
{
  "primary_intent": "CATEGORY_NAME",
  "secondary_intents": ["CATEGORY_NAME"],
  "requires_modification": true/false,
  "confidence": 0.0-1.0,
  "needs_clarification": true/false,
  "clarifying_question": {
    "id": "unique_id",
    "question": "What would you like to clarify?",
    "options": [
      {"id": "opt1", "label": "Option 1", "description": "Description"},
      {"id": "opt2", "label": "Option 2", "description": "Description"}
    ],
    "context": "I want to help you with the right information"
  }
}

Only include clarifying_question if needs_clarification is true.`;

  const recentContext = conversationHistory.slice(-4).map(m => `${m.role}: ${m.content}`).join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: classificationPrompt },
        { role: "user", content: `Recent conversation:\n${recentContext}\n\nUser message to classify: "${query}"` },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    console.error("Intent classification failed:", await response.text());
    return {
      primary_intent: "GENERAL_CHAT",
      secondary_intents: [],
      requires_modification: false,
      confidence: 0.5,
    };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse intent classification:", e);
  }

  return {
    primary_intent: "GENERAL_CHAT",
    secondary_intents: [],
    requires_modification: false,
    confidence: 0.5,
  };
}

// =============================================================================
// CONTEXT BUILDER
// =============================================================================

async function buildProjectContext(
  supabase: SupabaseClient,
  projectId: string,
  agentType: string
): Promise<Record<string, unknown>> {
  const context: Record<string, unknown> = {};

  try {
    // Always fetch basic project info
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    context.project = project;

    // Fetch agent-specific data
    switch (agentType) {
      case "scheduler":
      case "insight": {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("project_id", projectId)
          .order("start_date", { ascending: true });
        context.tasks = tasks;

        const { data: dependencies } = await supabase
          .from("task_dependencies")
          .select("*");
        context.dependencies = dependencies;
        break;
      }

      case "finance": {
        // Project already has budget/spent info
        const { data: resources } = await supabase
          .from("resources")
          .select("*")
          .eq("project_id", projectId);
        context.resources = resources;
        break;
      }

      case "risk": {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("project_id", projectId)
          .eq("is_critical", true);
        context.criticalTasks = tasks;
        break;
      }

      case "assignment": {
        const { data: resources } = await supabase
          .from("resources")
          .select("*")
          .eq("project_id", projectId);
        context.resources = resources;

        const { data: assignments } = await supabase
          .from("resource_assignments")
          .select("*");
        context.assignments = assignments;

        const { data: tasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("project_id", projectId)
          .is("assignee_id", null);
        context.unassignedTasks = tasks;
        break;
      }

      case "meeting": {
        const { data: meetings } = await supabase
          .from("meetings")
          .select("*, meeting_action_items(*), meeting_decisions(*)")
          .eq("project_id", projectId)
          .order("date", { ascending: false })
          .limit(10);
        context.meetings = meetings;
        break;
      }

      case "communication": {
        const { data: messages } = await supabase
          .from("project_messages")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(50);
        context.messages = messages;

        const { data: meetings } = await supabase
          .from("meetings")
          .select("*")
          .eq("project_id", projectId)
          .order("date", { ascending: false })
          .limit(5);
        context.recentMeetings = meetings;
        break;
      }

      case "strategic":
      case "document": {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("project_id", projectId);
        context.tasks = tasks;

        const { data: resources } = await supabase
          .from("resources")
          .select("*")
          .eq("project_id", projectId);
        context.resources = resources;
        break;
      }
    }
  } catch (error) {
    console.error("Error building context:", error);
  }

  return context;
}

// =============================================================================
// SPECIALIZED AGENTS
// =============================================================================

// --- Scheduler Agent ---
async function runSchedulerAgent(input: AgentInput): Promise<AgentOutput> {
  const systemPrompt = `You are SchedulerAgent, an expert in project scheduling and timeline management.

Your capabilities:
- Analyze project schedules and timelines
- Identify critical path dependencies
- Calculate impact of date changes
- Recommend schedule optimizations
- Detect scheduling conflicts

Project Context:
${JSON.stringify(input.projectContext, null, 2)}

User Role: ${input.userRole}

Provide specific, actionable insights about the schedule. Reference actual task names and dates from the context.
If the user wants to modify the schedule, explain the impact but note that changes require confirmation.`;

  return await callOpenAI(systemPrompt, input.query, input.conversationHistory, "scheduler", undefined, input.supabase, input.userId, input.tenantId, input.tools, input.executorCtx);
}

// --- Finance Agent ---
async function runFinanceAgent(input: AgentInput): Promise<AgentOutput> {
  const project = input.projectContext.project as Record<string, unknown> || {};

  const systemPrompt = `You are FinanceAgent, an expert in project financial management and EVM analysis.

Your capabilities:
- Budget status analysis
- Cost variance analysis
- Earned Value Management (EVM) calculations
- Financial forecasting
- Resource cost analysis

Project Financial Summary:
- Budget: $${project.budget || 0}
- Spent: $${project.spent || 0}
- Remaining: $${(project.budget as number || 0) - (project.spent as number || 0)}
- Progress: ${project.progress || 0}%

Full Context:
${JSON.stringify(input.projectContext, null, 2)}

User Role: ${input.userRole}

Provide detailed financial analysis with specific numbers. Calculate CPI, SPI, and EAC when relevant.`;

  return await callOpenAI(systemPrompt, input.query, input.conversationHistory, "finance", undefined, input.supabase, input.userId, input.tenantId, input.tools, input.executorCtx);
}

// --- Risk Agent ---
async function runRiskAgent(input: AgentInput): Promise<AgentOutput> {
  const systemPrompt = `You are RiskAgent, an expert in project risk management and mitigation.

Your capabilities:
- Risk identification and scoring
- Impact and probability assessment
- Mitigation strategy recommendations
- Critical path risk analysis
- Pattern recognition for common project risks

Project Context:
${JSON.stringify(input.projectContext, null, 2)}

User Role: ${input.userRole}

Identify specific risks based on the project data. Score risks using a 1-5 scale for impact and probability.
Provide actionable mitigation strategies.`;

  return await callOpenAI(systemPrompt, input.query, input.conversationHistory, "risk", undefined, input.supabase, input.userId, input.tenantId, input.tools, input.executorCtx);
}

// --- Assignment Agent ---
async function runAssignmentAgent(input: AgentInput): Promise<AgentOutput> {
  const systemPrompt = `You are AssignmentAgent, an expert in resource allocation and team optimization.

Your capabilities:
- Optimal task assignment recommendations
- Workload balancing analysis
- Skill matching for tasks
- Capacity planning
- Team utilization analysis

Project Context:
${JSON.stringify(input.projectContext, null, 2)}

User Role: ${input.userRole}

When recommending assignments, consider resource availability, skills, and current workload.
Provide specific recommendations with resource names and task names from the context.`;

  return await callOpenAI(systemPrompt, input.query, input.conversationHistory, "assignment", undefined, input.supabase, input.userId, input.tenantId, input.tools, input.executorCtx);
}

// --- Meeting Agent ---
async function runMeetingAgent(input: AgentInput): Promise<AgentOutput> {
  const systemPrompt = `You are MeetingAgent, an expert in meeting intelligence and action tracking.

Your capabilities:
- Meeting summary generation
- Action item extraction and tracking
- Decision documentation
- Follow-up monitoring
- Meeting effectiveness analysis

Meeting Context:
${JSON.stringify(input.projectContext, null, 2)}

User Role: ${input.userRole}

Reference specific meetings, decisions, and action items from the context.
Track overdue actions and highlight follow-up needs.`;

  return await callOpenAI(systemPrompt, input.query, input.conversationHistory, "meeting", undefined, input.supabase, input.userId, input.tenantId, input.tools, input.executorCtx);
}

// --- Document Agent ---
async function runDocumentAgent(input: AgentInput): Promise<AgentOutput> {
  const systemPrompt = `You are DocumentAgent, an expert in project documentation and report generation.

Your capabilities:
- Status report generation
- Executive summary creation
- Progress narrative writing
- Milestone documentation
- Stakeholder communication drafts

Project Context:
${JSON.stringify(input.projectContext, null, 2)}

User Role: ${input.userRole}

Generate professional, well-structured documents based on actual project data.
Use appropriate formatting for the document type requested.`;

  return await callOpenAI(systemPrompt, input.query, input.conversationHistory, "document", undefined, input.supabase, input.userId, input.tenantId, input.tools, input.executorCtx);
}

// --- Insight Agent ---
async function runInsightAgent(input: AgentInput): Promise<AgentOutput> {
  const systemPrompt = `You are InsightAgent, the primary project intelligence agent.

Your capabilities:
- Overall project health assessment
- Trend analysis and predictions
- Performance recommendations
- Cross-functional insights
- Proactive issue identification

Project Context:
${JSON.stringify(input.projectContext, null, 2)}

User Role: ${input.userRole}

Provide holistic project insights. Consider schedule, resources, and overall health.
Give specific recommendations based on the data. Be proactive in identifying potential issues.`;

  return await callOpenAI(systemPrompt, input.query, input.conversationHistory, "insight", undefined, input.supabase, input.userId, input.tenantId, input.tools, input.executorCtx);
}

// --- Strategic Agent ---
async function runStrategicAgent(input: AgentInput): Promise<AgentOutput> {
  const systemPrompt = `You are StrategicAgent, an expert in strategic project analysis.

Your capabilities:
- Value engineering and trade-off analysis
- Stakeholder power mapping
- Strategic alignment assessment
- Business case validation
- Long-term impact analysis

Project Context:
${JSON.stringify(input.projectContext, null, 2)}

User Role: ${input.userRole}

Provide high-level strategic insights. Consider business value, stakeholder interests, and long-term implications.`;

  return await callOpenAI(systemPrompt, input.query, input.conversationHistory, "strategic", undefined, input.supabase, input.userId, input.tenantId, input.tools, input.executorCtx);
}

// --- Communication Agent ---
async function runCommunicationAgent(input: AgentInput): Promise<AgentOutput> {
  const systemPrompt = `You are CommunicationAgent, an expert in project communication analysis.

Your capabilities:
- Communication pattern analysis
- Delay signal detection
- Sentiment analysis
- Stakeholder engagement assessment
- Scope creep indicators

Communication Context:
${JSON.stringify(input.projectContext, null, 2)}

User Role: ${input.userRole}

Analyze communication patterns and identify potential issues. Look for delay signals, escalation patterns, and team dynamics.`;

  return await callOpenAI(systemPrompt, input.query, input.conversationHistory, "communication", undefined, input.supabase, input.userId, input.tenantId, input.tools, input.executorCtx);
}

// =============================================================================
// AI CALL HELPER — Direct OpenAI
// =============================================================================

async function callOpenAI(
  systemPrompt: string,
  userQuery: string,
  conversationHistory: Message[],
  agentType: string,
  agentConfig?: AIAgentConfig | null,
  supabase?: SupabaseClient,
  userId?: string | null,
  tenantId?: string | null,
  tools?: ToolSchema[],
  executorCtx?: ExecutorContext
): Promise<AgentOutput> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  // Respect DB-configurable model if admin set it, otherwise default to gpt-4o
  const modelName = (agentConfig?.model_provider === "openai" && agentConfig?.model_name)
    ? agentConfig.model_name
    : "gpt-4o";
  const maxTokens = agentConfig?.max_tokens || 2000;
  const temperature = agentConfig?.temperature || 0.7;

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-6),
    { role: "user", content: userQuery },
  ];

  const requestBody: Record<string, unknown> = {
    model: modelName,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  // Inject tools when available (function calling)
  if (tools && tools.length > 0) {
    requestBody.tools = tools;
    requestBody.tool_choice = "auto";
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[ai-orchestrator] ${agentType} agent failed:`, errorText);

    if (response.status === 429) {
      return {
        response: "I'm currently experiencing high demand. Please try again in a moment.",
        agentType,
        confidence: 0,
      };
    }
    if (response.status === 402) {
      return {
        response: "AI credits have been exhausted. Please contact your administrator.",
        agentType,
        confidence: 0,
      };
    }

    throw new Error(`Agent ${agentType} failed: ${response.status}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  // Deduct AI credits — 2× billing multiplier applied inside helper
  if (supabase && userId) {
    const usage = data.usage ?? {};
    await deductCredits(supabase, userId, tenantId ?? null, {
      featureType: `ai_agent_${agentType}`,
      requestId: `agent-${agentType}-${Date.now()}`,
      modelName,
      promptTokens: usage.prompt_tokens ?? 0,
      completionTokens: usage.completion_tokens ?? 0,
    });
  }

  // ── Handle tool_calls (function calling) ──────────────────────────────────
  if (choice?.finish_reason === "tool_calls" && choice?.message?.tool_calls?.length > 0 && executorCtx) {
    const toolCall = choice.message.tool_calls[0]; // Handle first tool call
    const toolName = toolCall.function.name;
    let toolParams: Record<string, unknown> = {};
    try {
      toolParams = JSON.parse(toolCall.function.arguments ?? "{}");
    } catch {
      toolParams = {};
    }

    console.log(`[ai-orchestrator] Tool call detected: ${toolName}`, toolParams);

    const toolResult = await dispatchTool(toolName, toolParams, executorCtx);

    if (toolResult.requiresConfirmation) {
      // Return a structured confirmation response to the UI
      const diffSummary = toolResult.summary ?? `The AI wants to execute: ${toolName}`;
      return {
        response: `I can do that! Here's what I'll execute:\n\n**${toolName.replace(/_/g, " ").toUpperCase()}**\n\n${diffSummary}\n\nPlease review the details below and confirm to proceed.`,
        agentType,
        confidence: 0.95,
        requiresConfirmation: true,
        pendingActionId: toolResult.pendingActionId,
        diff: toolResult.diff,
        toolName,
      };
    } else if (toolResult.error) {
      return {
        response: `I tried to execute **${toolName}** but encountered an error: ${toolResult.error}`,
        agentType,
        confidence: 0.5,
      };
    } else {
      // Immediate result (e.g., PDF generation)
      return {
        response: `Done! The action **${toolName.replace(/_/g, " ")}** completed successfully.`,
        agentType,
        confidence: 0.95,
        toolResult: toolResult.result,
        toolName,
      };
    }
  }

  // ── Standard text response ─────────────────────────────────────────────────
  const content = choice?.message?.content || "I couldn't generate a response.";
  return {
    response: content,
    agentType,
    confidence: 0.85,
  };
}

// =============================================================================
// AGENT ROUTER
// =============================================================================

async function routeToAgent(
  agentType: string,
  input: AgentInput
): Promise<AgentOutput> {
  switch (agentType) {
    case "scheduler":
      return runSchedulerAgent(input);
    case "finance":
      return runFinanceAgent(input);
    case "risk":
      return runRiskAgent(input);
    case "assignment":
      return runAssignmentAgent(input);
    case "meeting":
      return runMeetingAgent(input);
    case "document":
      return runDocumentAgent(input);
    case "insight":
      return runInsightAgent(input);
    case "strategic":
      return runStrategicAgent(input);
    case "communication":
      return runCommunicationAgent(input);
    default:
      return runInsightAgent(input);
  }
}

// =============================================================================
// MAIN ORCHESTRATOR
// =============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const {
      message,
      projectId,
      conversationId,
      conversationHistory = [],
      agentType: requestedAgentType,  // explicit agent type from admin validation / direct call
      enableTools = true,             // set false to disable function calling
    } = await req.json();

    if (!message || !projectId) {
      return new Response(
        JSON.stringify({ error: "Message and projectId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header for user identification
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let userRole = "viewer"; // Default role

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;

      if (userId) {
        // Get user's role for this project
        const { data: roleData } = await supabase
          .rpc("get_user_role", { p_user_id: userId, p_project_id: projectId });

        if (roleData) {
          userRole = roleData;
        }
      }
    }

    // Step 1: Classify Intent
    console.log("Classifying intent for:", message);
    const intent = await classifyIntent(message, conversationHistory);
    console.log("Intent classified:", intent);

    // Step 1.5: Handle Clarification Needed
    if (intent.needs_clarification && intent.clarifying_question) {
      console.log("Clarification needed:", intent.clarifying_question);

      return new Response(
        JSON.stringify({
          response: intent.clarifying_question.context || "I need a bit more information to help you.",
          agentType: "system",
          intent,
          needsClarification: true,
          clarifyingQuestion: intent.clarifying_question,
          executionTime: Date.now() - startTime,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Determine Agent
    const agentType = INTENT_TO_AGENT[intent.primary_intent] || "insight";
    const requiredPermissions = AGENT_PERMISSIONS[agentType] || ["VIEW_ALL"];

    // Step 3: Check Permissions
    if (!hasPermission(userRole, requiredPermissions)) {
      const denialResponse = getPermissionDenialResponse(
        userRole,
        intent.primary_intent.toLowerCase().replace("_", " "),
        requiredPermissions[0]
      );

      // Log the denied attempt
      if (conversationId) {
        await supabase.from("ai_agent_logs").insert({
          conversation_id: conversationId,
          agent_type: agentType,
          input_data: { message, intent },
          output_data: { denied: true, reason: "permission_denied" },
          execution_time_ms: Date.now() - startTime,
          success: false,
          error_message: `User role ${userRole} lacks permission ${requiredPermissions[0]}`,
        });
      }

      return new Response(
        JSON.stringify({
          response: denialResponse,
          agentType: "system",
          intent,
          permissionDenied: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4: Build Context
    const projectContext = await buildProjectContext(supabase, projectId, agentType);

    // Resolve tenant for credit billing
    const tenantId = userId ? await getTenantId(supabase, userId) : null;

    // Build executor context for tool dispatch
    const executorCtx: ExecutorContext = {
      supabase,
      userId: userId ?? "",
      tenantId,
      projectId,
      supabaseUrl,
      serviceRoleKey: supabaseKey,
    };

    // Step 5: Route to Agent
    const agentInput: AgentInput = {
      query: message,
      projectId,
      userRole,
      conversationHistory,
      projectContext,
      supabase,
      userId,
      tenantId,
      tools: ALL_TOOLS,
      executorCtx,
    };

    // If caller specified an explicit agent type (e.g., admin validation page), skip intent classification
    const resolvedAgentType = requestedAgentType || agentType;

    const agentOutput = await routeToAgent(resolvedAgentType, agentInput);

    // Step 6: Handle Multi-Agent (if secondary intents)
    let synthesizedResponse = agentOutput.response;
    const agentsUsed = [agentType];

    if (intent.secondary_intents.length > 0) {
      for (const secondaryIntent of intent.secondary_intents.slice(0, 1)) {
        const secondaryAgent = INTENT_TO_AGENT[secondaryIntent];
        if (secondaryAgent && secondaryAgent !== agentType) {
          const secondaryPermissions = AGENT_PERMISSIONS[secondaryAgent] || ["VIEW_ALL"];

          if (hasPermission(userRole, secondaryPermissions)) {
            const secondaryContext = await buildProjectContext(supabase, projectId, secondaryAgent);
            const secondaryInput = { ...agentInput, projectContext: secondaryContext };
            const secondaryOutput = await routeToAgent(secondaryAgent, secondaryInput);

            synthesizedResponse += `\n\n---\n\n**Additional Analysis (${secondaryAgent}):**\n${secondaryOutput.response}`;
            agentsUsed.push(secondaryAgent);
          }
        }
      }
    }

    // Step 7: Log the interaction
    if (conversationId) {
      await supabase.from("ai_agent_logs").insert({
        conversation_id: conversationId,
        agent_type: agentsUsed.join(","),
        input_data: { message, intent, userRole },
        output_data: { response: synthesizedResponse.substring(0, 1000) },
        execution_time_ms: Date.now() - startTime,
        success: true,
      });
    }

    return new Response(
      JSON.stringify({
        response: synthesizedResponse,
        agentType: agentsUsed.length > 1 ? "multi-agent" : resolvedAgentType,
        agentsUsed,
        intent,
        confidence: agentOutput.confidence,
        actions: agentOutput.actions,
        // Agentic tool-calling fields
        requiresConfirmation: agentOutput.requiresConfirmation,
        pendingActionId: agentOutput.pendingActionId,
        diff: agentOutput.diff,
        toolName: agentOutput.toolName,
        toolResult: agentOutput.toolResult,
        executionTime: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Orchestrator error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        response: "I encountered an issue processing your request. Please try again.",
        agentType: "system",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
