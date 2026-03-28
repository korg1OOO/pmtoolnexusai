// =============================================================================
// Agent Pipeline — Structured Error Handler
// =============================================================================
//
// Converts raw errors from Supabase, network failures, and validation issues
// into structured, user-friendly error responses with recovery suggestions.
//
// Production-grade error handling:
// - Classifies errors by type (auth, permission, validation, network, etc.)
// - Provides actionable recovery suggestions
// - Sanitizes internal error details (no DB column names, RLS policy names, etc.)
// - Maps Supabase error codes to user-friendly messages
// =============================================================================

// ─── Error Types ─────────────────────────────────────────────────────────────

export type ErrorCategory =
    | 'auth'           // Authentication expired / missing
    | 'permission'     // RLS / role-based denial
    | 'validation'     // Bad input or missing required fields
    | 'not_found'      // Entity doesn't exist
    | 'conflict'       // Duplicate or constraint violation
    | 'rate_limit'     // Too many requests
    | 'quota'          // Credit / usage limit reached
    | 'network'        // Connection failed
    | 'timeout'        // Request timed out
    | 'server'         // 500-level or unexpected
    | 'unknown';       // Unclassifiable

export interface StructuredError {
    /** Error category for programmatic handling */
    category: ErrorCategory;
    /** User-facing message (safe to display in UI) */
    userMessage: string;
    /** Actionable recovery suggestion */
    recovery: string;
    /** Whether the action should be retried automatically */
    retryable: boolean;
    /** Original error message (for logging, NOT for UI display) */
    internalMessage: string;
    /** HTTP-equivalent status code */
    statusCode: number;
}

// ─── Supabase Error Patterns ─────────────────────────────────────────────────

const SUPABASE_ERROR_MAP: Array<{
    pattern: RegExp;
    category: ErrorCategory;
    userMessage: string;
    recovery: string;
    retryable: boolean;
    statusCode: number;
}> = [
        // Auth errors
        {
            pattern: /JWT expired|token.*expired|invalid.*token|not authenticated/i,
            category: 'auth',
            userMessage: 'Your session has expired.',
            recovery: 'Please refresh the page and log in again.',
            retryable: false,
            statusCode: 401,
        },
        // RLS / Permission errors
        {
            pattern: /row.*level.*security|RLS|policy.*violation|permission denied|insufficient.*privilege|authorization failed/i,
            category: 'permission',
            userMessage: 'You don\'t have permission to perform this action.',
            recovery: 'Contact your project administrator to check your role permissions.',
            retryable: false,
            statusCode: 403,
        },
        // Unique constraint violations
        {
            pattern: /duplicate key|unique.*constraint|already exists|conflict/i,
            category: 'conflict',
            userMessage: 'This item already exists or conflicts with an existing record.',
            recovery: 'Try using a different name or check if this item was already created.',
            retryable: false,
            statusCode: 409,
        },
        // Foreign key / not found
        {
            pattern: /foreign key|referenced.*does not exist|violates.*constraint.*fk/i,
            category: 'not_found',
            userMessage: 'A required related item was not found.',
            recovery: 'Make sure the parent item (project, phase, or sprint) exists before creating this.',
            retryable: false,
            statusCode: 404,
        },
        // Validation / check constraint
        {
            pattern: /check.*constraint|not-null.*constraint|null.*value.*column|value too long|invalid.*input/i,
            category: 'validation',
            userMessage: 'The input data is invalid or missing required fields.',
            recovery: 'Try rephrasing your request with more specific details.',
            retryable: false,
            statusCode: 400,
        },
        // Rate limiting
        {
            pattern: /rate.*limit|too many requests|429|throttl/i,
            category: 'rate_limit',
            userMessage: 'Too many requests. Please wait a moment.',
            recovery: 'Wait 30 seconds and try again.',
            retryable: true,
            statusCode: 429,
        },
        // Network / timeout
        {
            pattern: /network|fetch.*fail|fail.*fetch|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|abort|timed?\s*out/i,
            category: 'network',
            userMessage: 'Unable to connect to the server.',
            recovery: 'Check your internet connection and try again.',
            retryable: true,
            statusCode: 503,
        },
        // Credit / quota errors
        {
            pattern: /insufficient.*credits?|quota.*exceeded|limit.*reached|no.*credits/i,
            category: 'quota',
            userMessage: 'You\'ve run out of AI credits.',
            recovery: 'Upgrade your plan or wait for your credits to reset.',
            retryable: false,
            statusCode: 402,
        },
    ];

// ─── Main Handler ────────────────────────────────────────────────────────────

/**
 * Convert a raw error into a structured, user-safe error response.
 *
 * @param error    - The raw error (Error object, string, or Supabase error)
 * @param context  - Optional context about what action was being performed
 * @returns Structured error with user message, recovery, and retry guidance
 *
 * @example
 * ```ts
 * try {
 *     await supabase.from('tasks').insert(data);
 * } catch (err) {
 *     const structured = classifyError(err, 'create_phase');
 *     // → { category: 'permission', userMessage: "You don't have...", ... }
 * }
 * ```
 */
export function classifyError(
    error: unknown,
    context?: string,
): StructuredError {
    const rawMessage = extractErrorMessage(error);

    // Try to match against known Supabase patterns
    for (const mapping of SUPABASE_ERROR_MAP) {
        if (mapping.pattern.test(rawMessage)) {
            return {
                category: mapping.category,
                userMessage: mapping.userMessage,
                recovery: mapping.recovery,
                retryable: mapping.retryable,
                internalMessage: rawMessage,
                statusCode: mapping.statusCode,
            };
        }
    }

    // Fallback: unknown server error
    return {
        category: 'unknown',
        userMessage: context
            ? `Something went wrong while performing "${context.replace(/_/g, ' ')}".`
            : 'An unexpected error occurred.',
        recovery: 'Try again in a few moments. If the problem persists, contact support.',
        retryable: true,
        internalMessage: rawMessage,
        statusCode: 500,
    };
}

/**
 * Format a structured error for display in the AI chat.
 */
export function formatErrorForChat(error: StructuredError): string {
    const emoji = ERROR_EMOJIS[error.category] || '❌';
    const lines = [
        `${emoji} **${error.userMessage}**`,
        '',
        `💡 ${error.recovery}`,
    ];

    if (error.retryable) {
        lines.push('', '_This action can be retried._');
    }

    return lines.join('\n');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ERROR_EMOJIS: Record<ErrorCategory, string> = {
    auth: '🔒',
    permission: '🚫',
    validation: '⚠️',
    not_found: '🔍',
    conflict: '⚡',
    rate_limit: '⏳',
    quota: '💳',
    network: '🌐',
    timeout: '⏰',
    server: '🔧',
    unknown: '❌',
};

function extractErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object') {
        const obj = error as Record<string, unknown>;
        // Supabase error shape: { message: string, code: string }
        if (typeof obj.message === 'string') return obj.message;
        if (typeof obj.error === 'string') return obj.error;
        if (typeof obj.error_description === 'string') return obj.error_description;
    }
    return 'Unknown error';
}
