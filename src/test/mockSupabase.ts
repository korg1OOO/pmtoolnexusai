/**
 * Shared Supabase mock for unit tests
 * Provides a chainable query builder mock that simulates Supabase client behavior.
 * 
 * Usage in tests:
 *   vi.mock('@/integrations/supabase/client', () => ({ supabase: createMockSupabase() }));
 *   // Then configure per-test:
 *   const mock = (await import('@/integrations/supabase/client')).supabase as any;
 *   mock.__setResult({ data: [...], error: null });
 */
import { vi } from 'vitest';

interface MockResult {
    data: any;
    error: any;
    count?: number;
}

/**
 * Creates a chainable mock that simulates Supabase's query builder.
 * Every method returns `this` so chains like `.from().select().eq().single()` work.
 * The final awaited result comes from __setResult().
 */
export function createMockSupabase() {
    let currentResult: MockResult = { data: null, error: null };
    let rpcResults: Record<string, MockResult> = {};
    let authUser: any = { user: { id: 'test-user-id', email: 'test@test.com' } };

    const chainable: any = {
        // Result setters
        __setResult(result: MockResult) {
            currentResult = result;
        },
        __setRpcResult(name: string, result: MockResult) {
            rpcResults[name] = result;
        },
        __setAuthUser(user: any) {
            authUser = user;
        },
        __reset() {
            currentResult = { data: null, error: null };
            rpcResults = {};
            authUser = { user: { id: 'test-user-id', email: 'test@test.com' } };
        },

        // Query builder methods - all return chainable for chaining
        from: vi.fn(() => chainable),
        select: vi.fn(() => chainable),
        insert: vi.fn(() => chainable),
        update: vi.fn(() => chainable),
        upsert: vi.fn(() => chainable),
        delete: vi.fn(() => chainable),
        eq: vi.fn(() => chainable),
        neq: vi.fn(() => chainable),
        gt: vi.fn(() => chainable),
        gte: vi.fn(() => chainable),
        lt: vi.fn(() => chainable),
        lte: vi.fn(() => chainable),
        like: vi.fn(() => chainable),
        ilike: vi.fn(() => chainable),
        is: vi.fn(() => chainable),
        in: vi.fn(() => chainable),
        contains: vi.fn(() => chainable),
        order: vi.fn(() => chainable),
        limit: vi.fn(() => chainable),
        range: vi.fn(() => chainable),
        single: vi.fn(() => chainable),
        maybeSingle: vi.fn(() => chainable),
        filter: vi.fn(() => chainable),
        match: vi.fn(() => chainable),
        not: vi.fn(() => chainable),
        or: vi.fn(() => chainable),
        textSearch: vi.fn(() => chainable),

        // Terminal methods that return results
        then: vi.fn((resolve: any) => resolve(currentResult)),

        // RPC
        rpc: vi.fn((name: string, params?: any) => {
            const result = rpcResults[name] || currentResult;
            return Promise.resolve(result);
        }),

        // Auth
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: authUser, error: null })),
            getSession: vi.fn(() => Promise.resolve({ data: { session: { user: authUser?.user } }, error: null })),
            signInWithPassword: vi.fn(() => Promise.resolve({ data: authUser, error: null })),
            signUp: vi.fn(() => Promise.resolve({ data: authUser, error: null })),
            signOut: vi.fn(() => Promise.resolve({ error: null })),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },

        // Realtime
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnThis(),
        })),
        removeChannel: vi.fn(),

        // Functions
        functions: {
            invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
        },

        // Storage
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn(() => Promise.resolve({ data: { path: 'test' }, error: null })),
                download: vi.fn(() => Promise.resolve({ data: new Blob(), error: null })),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://test.com/file' } })),
                remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
                list: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
        },
    };

    // Make the chainable object thenable (so `await supabase.from().select()` works)
    const handler: ProxyHandler<any> = {
        get(target, prop) {
            if (prop === 'then') {
                return (resolve: any, reject: any) => {
                    resolve(currentResult);
                };
            }
            return target[prop];
        },
    };

    return new Proxy(chainable, handler);
}

/**
 * Create a mock supabase module for vi.mock
 */
export function mockSupabaseModule() {
    const mock = createMockSupabase();
    return { supabase: mock };
}
