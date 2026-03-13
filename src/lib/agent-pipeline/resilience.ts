// =============================================================================
// Agent Pipeline — Resilience Module
// =============================================================================
//
// Production-grade reliability patterns for the AI action pipeline:
// - Retry with exponential backoff for transient failures
// - Action timeout protection
// - Circuit breaker to prevent cascading failures
//
// All patterns are designed to be composable and testable.
// =============================================================================

import { classifyError, type StructuredError } from './error-handler';

// ─── Retry Configuration ─────────────────────────────────────────────────────

export interface RetryConfig {
    /** Maximum number of retry attempts (default: 2) */
    maxRetries: number;
    /** Base delay in ms for exponential backoff (default: 500) */
    baseDelayMs: number;
    /** Maximum delay in ms (default: 5000) */
    maxDelayMs: number;
    /** Jitter factor (0-1) to randomize delays (default: 0.2) */
    jitter: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 2,
    baseDelayMs: 500,
    maxDelayMs: 5000,
    jitter: 0.2,
};

// ─── Timeout Configuration ───────────────────────────────────────────────────

/** Default timeout per action type (ms) */
const ACTION_TIMEOUTS: Record<string, number> = {
    // Fast actions (≤5s)
    log_issue: 5000,
    log_risk: 5000,
    log_expense: 5000,
    log_decision: 5000,
    log_leave: 5000,
    resolve_issue: 5000,
    log_requirement: 5000,
    log_lesson_learned: 5000,

    // Medium actions (≤10s)
    create_phase: 10000,
    create_milestone: 10000,
    create_epic: 10000,
    create_story: 10000,
    create_sprint: 10000,
    set_budget: 10000,
    schedule_meeting: 10000,
    create_stakeholder: 10000,
    create_change_request: 10000,
    assign_members: 10000,

    // Slow actions (≤20s)
    create_project: 20000,
    create_activities: 20000,
    create_phases_and_activities: 20000,
    build_phase_from_description: 20000,
    setup_financials: 20000,
    setup_agile_backlog: 20000,

    // Heavy actions (≤30s)
    generate_presentation: 30000,
    generate_final_report: 30000,
    generate_charter_and_deliverables: 30000,
    close_sprint_cycle: 30000,
    complete_sprint: 30000,
    validate_requirements: 30000,
    map_traceability: 30000,
    log_governance_meetings: 30000,
    log_project_controls: 30000,
};

const DEFAULT_TIMEOUT = 15000; // 15s default

// ─── Circuit Breaker ─────────────────────────────────────────────────────────

interface CircuitState {
    failures: number;
    lastFailure: number;
    state: 'closed' | 'open' | 'half-open';
}

const CIRCUIT_THRESHOLD = 5;          // Open after 5 consecutive failures
const CIRCUIT_RESET_MS = 60000;       // Try again after 1 minute

// Global circuit state (per-session, resets on page reload)
const circuitState: CircuitState = {
    failures: 0,
    lastFailure: 0,
    state: 'closed',
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Execute an action with retry, timeout, and circuit-breaker protection.
 *
 * @param actionType - The action intent (for timeout lookup)
 * @param fn         - The action function to execute
 * @param config     - Optional retry configuration
 * @returns The action result, or throws a StructuredError
 *
 * @example
 * ```ts
 * const result = await withResilience('create_project', async () => {
 *     return await supabase.from('projects').insert(data);
 * });
 * ```
 */
export async function withResilience<T>(
    actionType: string,
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {},
): Promise<T> {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

    // Check circuit breaker
    checkCircuit(actionType);

    let lastError: StructuredError | undefined;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
        try {
            // Apply timeout
            const timeoutMs = ACTION_TIMEOUTS[actionType] || DEFAULT_TIMEOUT;
            const result = await withTimeout(fn(), timeoutMs, actionType);

            // Success — reset circuit
            onSuccess();

            return result;
        } catch (err: unknown) {
            const structured = classifyError(err, actionType);
            lastError = structured;

            // Don't retry non-retryable errors
            if (!structured.retryable) {
                onFailure();
                throw structured;
            }

            // Don't retry on last attempt
            if (attempt < retryConfig.maxRetries) {
                const delay = calculateDelay(attempt, retryConfig);
                console.warn(
                    `[resilience] ${actionType} attempt ${attempt + 1}/${retryConfig.maxRetries + 1} failed, retrying in ${delay}ms:`,
                    structured.internalMessage,
                );
                await sleep(delay);
            }
        }
    }

    // All retries exhausted
    onFailure();
    throw lastError || classifyError(new Error('All retries exhausted'), actionType);
}

/**
 * Get the timeout for an action type (exported for testing).
 */
export function getActionTimeout(actionType: string): number {
    return ACTION_TIMEOUTS[actionType] || DEFAULT_TIMEOUT;
}

/**
 * Get current circuit state (exported for testing/monitoring).
 */
export function getCircuitState(): Readonly<CircuitState> {
    return { ...circuitState };
}

/**
 * Reset circuit breaker (exported for testing).
 */
export function resetCircuit(): void {
    circuitState.failures = 0;
    circuitState.lastFailure = 0;
    circuitState.state = 'closed';
}

// ─── Internals ───────────────────────────────────────────────────────────────

function checkCircuit(actionType: string): void {
    if (circuitState.state === 'open') {
        const elapsed = Date.now() - circuitState.lastFailure;
        if (elapsed > CIRCUIT_RESET_MS) {
            // Try half-open
            circuitState.state = 'half-open';
            console.log(`[resilience] Circuit half-open for ${actionType}, allowing probe request`);
        } else {
            throw {
                category: 'server' as const,
                userMessage: 'The system is experiencing issues. Please wait a minute and try again.',
                recovery: `The AI action system is temporarily paused after ${CIRCUIT_THRESHOLD} consecutive failures. It will automatically resume in ${Math.ceil((CIRCUIT_RESET_MS - elapsed) / 1000)} seconds.`,
                retryable: false,
                internalMessage: `Circuit breaker open: ${circuitState.failures} failures, last at ${new Date(circuitState.lastFailure).toISOString()}`,
                statusCode: 503,
            } as StructuredError;
        }
    }
}

function onSuccess(): void {
    if (circuitState.state === 'half-open') {
        console.log('[resilience] Circuit closed after successful probe');
    }
    circuitState.failures = 0;
    circuitState.state = 'closed';
}

function onFailure(): void {
    circuitState.failures++;
    circuitState.lastFailure = Date.now();
    if (circuitState.failures >= CIRCUIT_THRESHOLD) {
        circuitState.state = 'open';
        console.error(`[resilience] Circuit OPEN after ${circuitState.failures} consecutive failures`);
    }
}

function calculateDelay(attempt: number, config: RetryConfig): number {
    // Exponential backoff: baseDelay * 2^attempt
    const expDelay = config.baseDelayMs * Math.pow(2, attempt);
    const capped = Math.min(expDelay, config.maxDelayMs);
    // Add jitter: ±jitter%
    const jitterRange = capped * config.jitter;
    const jitter = (Math.random() * 2 - 1) * jitterRange;
    return Math.round(capped + jitter);
}

async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    actionType: string,
): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Action "${actionType}" timed out after ${timeoutMs}ms`));
            }, timeoutMs);
        }),
    ]);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
