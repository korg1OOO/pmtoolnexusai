/**
 * Agent Pipeline — Auditor Unit Tests
 *
 * Tests the pre-execution auditor: role checks, project checks, and prerequisite checks.
 * Pure function tests — no mocking required.
 */
import { describe, it, expect } from 'vitest';
import { auditAction } from '@/lib/agent-pipeline/auditor';
import type { ActionContext } from '@/lib/agent-pipeline/types';

// ─── Helper: build context ──────────────────────────────────────────────────

function ctx(overrides: Partial<ActionContext> = {}): ActionContext {
    return {
        userRole: 'admin',
        projectId: 'proj-123',
        userId: 'user-1',
        projectData: {
            hasPhases: true,
            hasMembers: true,
            hasIssues: true,
            hasSprints: true,
            hasEpics: true,
        },
        ...overrides,
    };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('auditAction', () => {
    // ── Role Checks ────────────────────────────────────────────────────────

    describe('role checks', () => {
        it('allows admin to perform any action', () => {
            const result = auditAction('create_phase', ctx({ userRole: 'admin' }));
            expect(result.feasible).toBe(true);
        });

        it('allows pm to perform any action', () => {
            const result = auditAction('set_budget', ctx({ userRole: 'pm' }));
            expect(result.feasible).toBe(true);
        });

        it('blocks viewer from creating phases', () => {
            const result = auditAction('create_phase', ctx({ userRole: 'viewer' }));
            expect(result.feasible).toBe(false);
            expect(result.failedCheck).toBe('role');
            expect(result.reason).toContain('viewer');
            expect(result.reason).toContain('SCHEDULE_EDIT');
        });

        it('blocks viewer from logging issues', () => {
            const result = auditAction('log_issue', ctx({ userRole: 'viewer' }));
            expect(result.feasible).toBe(false);
            expect(result.failedCheck).toBe('role');
        });

        it('blocks developer from setting budget', () => {
            const result = auditAction('set_budget', ctx({ userRole: 'developer' }));
            expect(result.feasible).toBe(false);
            expect(result.failedCheck).toBe('role');
            expect(result.reason).toContain('FINANCE_EDIT');
        });

        it('allows developer to schedule meetings', () => {
            const result = auditAction('schedule_meeting', ctx({ userRole: 'developer' }));
            expect(result.feasible).toBe(true);
        });

        it('allows lead to manage risks', () => {
            const result = auditAction('log_risk', ctx({ userRole: 'lead' }));
            expect(result.feasible).toBe(true);
        });

        it('blocks analyst from creating sprints', () => {
            const result = auditAction('create_sprint', ctx({ userRole: 'analyst' }));
            expect(result.feasible).toBe(false);
            expect(result.failedCheck).toBe('role');
        });
    });

    // ── Project Checks ─────────────────────────────────────────────────────

    describe('project checks', () => {
        it('blocks action when no project is selected', () => {
            const result = auditAction('create_phase', ctx({ projectId: null }));
            expect(result.feasible).toBe(false);
            expect(result.failedCheck).toBe('project');
            expect(result.reason).toContain('No project selected');
        });

        it('allows create_project without a project selected', () => {
            const result = auditAction('create_project', ctx({ projectId: null }));
            expect(result.feasible).toBe(true);
        });

        it('allows actions when project is selected', () => {
            const result = auditAction('log_risk', ctx({ projectId: 'proj-abc' }));
            expect(result.feasible).toBe(true);
        });
    });

    // ── Prerequisite Checks ────────────────────────────────────────────────

    describe('prerequisite checks', () => {
        it('blocks create_activities when no phases exist', () => {
            const result = auditAction('create_activities', ctx({
                projectData: { hasPhases: false, hasMembers: true, hasIssues: true },
            }));
            expect(result.feasible).toBe(false);
            expect(result.failedCheck).toBe('prerequisite');
            expect(result.reason).toContain('phases');
        });

        it('allows create_activities when phases exist', () => {
            const result = auditAction('create_activities', ctx({
                projectData: { hasPhases: true, hasMembers: true, hasIssues: true },
            }));
            expect(result.feasible).toBe(true);
        });

        it('blocks log_leave when no team members exist', () => {
            const result = auditAction('log_leave', ctx({
                userRole: 'lead',
                projectData: { hasPhases: true, hasMembers: false, hasIssues: true },
            }));
            expect(result.feasible).toBe(false);
            expect(result.failedCheck).toBe('prerequisite');
            expect(result.reason).toContain('team members');
        });

        it('blocks resolve_issue when no issues exist', () => {
            const result = auditAction('resolve_issue', ctx({
                projectData: { hasPhases: true, hasMembers: true, hasIssues: false },
            }));
            expect(result.feasible).toBe(false);
            expect(result.failedCheck).toBe('prerequisite');
            expect(result.reason).toContain('issues');
        });

        it('skips prerequisite checks when projectData is not provided', () => {
            const result = auditAction('create_activities', ctx({
                projectData: undefined,
            }));
            expect(result.feasible).toBe(true);  // graceful degradation
        });
    });

    // ── Suggested Actions ──────────────────────────────────────────────────

    describe('suggested actions', () => {
        it('provides a suggested action on role failure', () => {
            const result = auditAction('set_budget', ctx({ userRole: 'viewer' }));
            expect(result.suggestedAction).toBeDefined();
            expect(result.suggestedAction!.length).toBeGreaterThan(0);
        });

        it('provides a suggested action on prerequisite failure', () => {
            const result = auditAction('create_activities', ctx({
                projectData: { hasPhases: false },
            }));
            expect(result.suggestedAction).toBeDefined();
            expect(result.suggestedAction).toContain('phases');
        });

        it('provides a suggested action on project failure', () => {
            const result = auditAction('log_risk', ctx({ projectId: null }));
            expect(result.suggestedAction).toBeDefined();
        });
    });

    // ── Edge Cases ─────────────────────────────────────────────────────────

    describe('edge cases', () => {
        it('allows unknown intents (no permission mapping)', () => {
            const result = auditAction('some_unknown_action', ctx());
            expect(result.feasible).toBe(true);
        });

        it('handles empty string role gracefully', () => {
            const result = auditAction('create_phase', ctx({ userRole: '' as any }));
            expect(result.feasible).toBe(false);
            expect(result.failedCheck).toBe('role');
        });
    });
});
