// =============================================================================
// Agent Pipeline — Multi-Step Planner
// =============================================================================
//
// Detects compound requests (e.g. "create a project with 5 phases, 10 tasks,
// and set a budget") and breaks them into a sequential execution plan with
// cross-step dependency resolution using $ref: syntax.
//
// Design:
// - Pure functions: no Supabase or React dependencies
// - deterministic plan generation from the detected intents
// - $ref: syntax for referencing outputs from previous steps
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import type { ExecutionPlan, PlanStep } from './types';

// ─── Compound request patterns ───────────────────────────────────────────────

interface CompoundPattern {
    /** Keywords / phrases that trigger this compound pattern */
    triggers: RegExp[];
    /** The plan template to generate */
    template: (message: string) => PlanStep[];
    /** Plan title */
    title: string;
    /** Risk level */
    risk: 'low' | 'medium' | 'high';
}

const COMPOUND_PATTERNS: CompoundPattern[] = [
    {
        title: 'Full Project Setup',
        triggers: [
            /create\s+(?:a\s+)?(?:full|complete|entire)\s+project/i,
            /set\s*up\s+(?:a\s+)?(?:full|complete|new)\s+project/i,
            /build\s+(?:a\s+)?project\s+with\s+(?:phases|tasks|budget)/i,
        ],
        risk: 'medium',
        template: (message) => {
            const phaseCount = extractNumber(message, /(\d+)\s*phases?/i, 5);
            const taskCount = extractNumber(message, /(\d+)\s*(?:tasks?|activities)/i, 3);
            const projectName = extractQuotedName(message) || 'New Project';
            const budget = extractNumber(message, /budget\s*(?:of\s*)?\$?([\d,]+)/i, 0);

            const steps: PlanStep[] = [
                {
                    stepId: 1,
                    action: 'create_project',
                    description: `Create project "${projectName}"`,
                    params: { name: projectName, message },
                    requiresConfirmation: true,
                },
                {
                    stepId: 2,
                    action: 'create_phase',
                    description: `Create ${phaseCount} phases`,
                    params: { count: phaseCount, projectId: '$ref:step1.id' },
                    dependsOn: [1],
                },
                {
                    stepId: 3,
                    action: 'create_activities',
                    description: `Add ${taskCount} activities per phase`,
                    params: { count: taskCount, projectId: '$ref:step1.id' },
                    dependsOn: [1, 2],
                },
            ];

            if (budget > 0) {
                steps.push({
                    stepId: 4,
                    action: 'set_budget',
                    description: `Set budget to $${budget.toLocaleString()}`,
                    params: { budget, projectId: '$ref:step1.id' },
                    dependsOn: [1],
                });
            }

            return steps;
        },
    },
    {
        title: 'Phase with Activities',
        triggers: [
            /create\s+(?:a\s+)?phase\s+with\s+(?:\d+\s+)?(?:tasks|activities)/i,
            /build\s+(?:a\s+)?phase\s+.*(?:tasks|activities)/i,
        ],
        risk: 'low',
        template: (message) => {
            const taskCount = extractNumber(message, /(\d+)\s*(?:tasks?|activities)/i, 5);
            return [
                {
                    stepId: 1,
                    action: 'create_phase',
                    description: 'Create phase',
                    params: { count: 1, message },
                },
                {
                    stepId: 2,
                    action: 'create_activities',
                    description: `Add ${taskCount} activities`,
                    params: { count: taskCount },
                    dependsOn: [1],
                },
            ];
        },
    },
    {
        title: 'Agile Backlog Setup',
        triggers: [
            /set\s*up\s+(?:an?\s+)?agile\s+(?:backlog|sprint|board)/i,
            /create\s+(?:epics?|stories?)\s+(?:and|with)\s+(?:sprints?|stories?|epics?)/i,
        ],
        risk: 'medium',
        template: (message) => {
            const epicCount = extractNumber(message, /(\d+)\s*epics?/i, 3);
            const storyCount = extractNumber(message, /(\d+)\s*stories?/i, 5);
            return [
                {
                    stepId: 1,
                    action: 'create_epic',
                    description: `Create ${epicCount} epics`,
                    params: { count: epicCount, message },
                },
                {
                    stepId: 2,
                    action: 'create_story',
                    description: `Create ${storyCount} stories per epic`,
                    params: { count: storyCount },
                    dependsOn: [1],
                },
                {
                    stepId: 3,
                    action: 'create_sprint',
                    description: 'Create initial sprint',
                    params: { count: 1 },
                    dependsOn: [1, 2],
                },
            ];
        },
    },
    {
        title: 'Risk and Issue Logging',
        triggers: [
            /log\s+(?:both\s+)?(?:\d+\s+)?risks?\s+(?:and|&)\s+(?:\d+\s+)?issues?/i,
            /create\s+(?:\d+\s+)?(?:risks?\s+and\s+(?:\d+\s+)?issues?|issues?\s+and\s+(?:\d+\s+)?risks?)/i,
        ],
        risk: 'low',
        template: (message) => {
            const riskCount = extractNumber(message, /(\d+)\s*risks?/i, 5);
            const issueCount = extractNumber(message, /(\d+)\s*issues?/i, 5);
            return [
                {
                    stepId: 1,
                    action: 'log_risk',
                    description: `Log ${riskCount} risks`,
                    params: { count: riskCount, message },
                },
                {
                    stepId: 2,
                    action: 'log_issue',
                    description: `Log ${issueCount} issues`,
                    params: { count: issueCount, message },
                },
            ];
        },
    },
];

// ─── Main Entry Point ────────────────────────────────────────────────────────

/**
 * Detect if a message is a compound request and generate an execution plan.
 *
 * @param message - The raw user message
 * @returns An ExecutionPlan if compound, or null if it's a single action
 */
export function detectCompoundRequest(message: string): ExecutionPlan | null {
    const lower = message.toLowerCase();

    for (const pattern of COMPOUND_PATTERNS) {
        const matched = pattern.triggers.some(regex => regex.test(lower));
        if (matched) {
            const steps = pattern.template(message);
            return {
                planId: uuidv4(),
                title: pattern.title,
                originalRequest: message,
                steps,
                risk: pattern.risk,
                requiresApproval: steps.some(s => s.requiresConfirmation) || steps.length > 2,
                estimatedCredits: steps.length * 0.5, // rough estimate
            };
        }
    }

    return null;
}

/**
 * Resolve $ref: references in step params using outputs from previous steps.
 *
 * @param params  - The step's params (may contain $ref: values)
 * @param outputs - Map of stepId → output Record from completed steps
 * @returns Resolved params with $ref: values replaced
 *
 * @example
 * ```ts
 * const resolved = resolveRefs(
 *   { projectId: '$ref:step1.id' },
 *   { 1: { id: 'proj-abc', name: 'My Project' } }
 * );
 * // → { projectId: 'proj-abc' }
 * ```
 */
export function resolveRefs(
    params: Record<string, unknown>,
    outputs: Record<number, Record<string, unknown>>,
): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(params)) {
        if (typeof value === 'string' && value.startsWith('$ref:')) {
            // Parse: $ref:step1.id → stepId=1, field=id
            const refMatch = value.match(/^\$ref:step(\d+)\.(.+)$/);
            if (refMatch) {
                const stepId = parseInt(refMatch[1], 10);
                const field = refMatch[2];
                const stepOutput = outputs[stepId];
                resolved[key] = stepOutput?.[field] ?? value; // keep raw $ref if unresolved
            } else {
                resolved[key] = value;
            }
        } else {
            resolved[key] = value;
        }
    }

    return resolved;
}

/**
 * Format an execution plan as a user-friendly markdown summary.
 */
export function formatPlanSummary(plan: ExecutionPlan): string {
    const lines: string[] = [
        `📋 **${plan.title}**`,
        '',
    ];

    for (const step of plan.steps) {
        const deps = step.dependsOn?.length
            ? ` _(depends on step ${step.dependsOn.join(', ')})_`
            : '';
        const confirm = step.requiresConfirmation ? ' ⚠️' : '';
        lines.push(`${step.stepId}. ${step.description}${deps}${confirm}`);
    }

    lines.push('');
    lines.push(`Risk: **${plan.risk}** | Steps: **${plan.steps.length}** | Est. credits: **${plan.estimatedCredits?.toFixed(1) ?? '?'}**`);

    if (plan.requiresApproval) {
        lines.push('');
        lines.push('_This plan requires your approval before execution._');
    }

    return lines.join('\n');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractNumber(message: string, regex: RegExp, defaultVal: number): number {
    const match = message.match(regex);
    return match ? parseInt(match[1].replace(/,/g, ''), 10) : defaultVal;
}

function extractQuotedName(message: string): string | null {
    const match = message.match(/["'"]([^"'"]+)["'"]/);
    return match ? match[1] : null;
}
