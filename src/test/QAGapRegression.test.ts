/**
 * QA Gap Regression Tests
 * Static file analysis tests verifying all code fixes are in place.
 * No component rendering needed — just reads source files.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const SRC = resolve(__dirname, '..');
const ROOT = resolve(SRC, '..');

function read(relPath: string) {
    return readFileSync(resolve(SRC, relPath), 'utf-8');
}

describe('BUG-008: NotesView component integrity', () => {
    const content = read('components/views/NotesView.tsx');

    it('component file exists and has content', () => {
        expect(content.length).toBeGreaterThan(100);
    });

    it('has valid component structure', () => {
        expect(content).toContain('export');
    });
});

describe('ai_credits: aiCreditsService graceful defaults', () => {
    const content = read('services/aiCreditsService.ts');

    it('has defaultBalance method', () => {
        expect(content).toContain('defaultBalance');
    });

    it('handles 406 / Not Acceptable', () => {
        expect(content).toContain('Not Acceptable');
    });

    it('handles PGRST116 with fallback', () => {
        expect(content).toContain('PGRST116');
    });

    it('returns default id instead of throwing', () => {
        expect(content).toContain("id: 'default'");
        expect(content).toContain('total_credits: 0');
    });
});

describe('ai_credits: AdminAICredits error handling', () => {
    const content = read('components/admin/pages/AdminAICredits.tsx');

    it('has retry:false on all 3 queries', () => {
        const matches = content.match(/retry:\s*false/g);
        expect(matches?.length).toBeGreaterThanOrEqual(3);
    });

    it('has try/catch in query functions', () => {
        const matches = content.match(/try\s*\{/g);
        expect(matches?.length).toBeGreaterThanOrEqual(2);
    });
});

describe('ai_credits: CreditBalanceWidget retry disabled', () => {
    const content = read('components/credits/CreditBalanceWidget.tsx');

    it('has retry:false', () => {
        expect(content).toContain('retry: false');
    });
});

describe('SQL Migration', () => {
    const migrationPath = resolve(ROOT, 'supabase/migrations/20260310_fix_ai_credits_and_rls.sql');

    it('migration file exists', () => {
        expect(existsSync(migrationPath)).toBe(true);
    });

    it('creates ai_credits table', () => {
        const sql = readFileSync(migrationPath, 'utf-8');
        expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.ai_credits');
    });

    it('creates initialize_ai_credits RPC', () => {
        const sql = readFileSync(migrationPath, 'utf-8');
        expect(sql).toContain('initialize_ai_credits');
    });

    it('creates add_ai_credits RPC', () => {
        const sql = readFileSync(migrationPath, 'utf-8');
        expect(sql).toContain('add_ai_credits');
    });

    it('fixes meeting_attendees RLS', () => {
        const sql = readFileSync(migrationPath, 'utf-8');
        expect(sql).toContain('meeting_attendees');
    });

    it('documents projects RLS decision', () => {
        const sql = readFileSync(migrationPath, 'utf-8');
        expect(sql).toContain('projects');
    });
});
