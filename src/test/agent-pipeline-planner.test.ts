/**
 * Agent Pipeline — Planner Unit Tests
 *
 * Tests compound request detection, $ref: dependency resolution,
 * and plan summary formatting.
 */
import { describe, it, expect } from 'vitest';
import { detectCompoundRequest, resolveRefs, formatPlanSummary } from '@/lib/agent-pipeline/planner';

describe('detectCompoundRequest', () => {
    describe('full project setup', () => {
        it('detects "create a full project" pattern', () => {
            const plan = detectCompoundRequest('Create a full project called "ProjectX" with 5 phases');
            expect(plan).not.toBeNull();
            expect(plan!.title).toBe('Full Project Setup');
            expect(plan!.steps.length).toBeGreaterThanOrEqual(3);
            expect(plan!.steps[0].action).toBe('create_project');
            expect(plan!.steps[1].action).toBe('create_phase');
            expect(plan!.steps[2].action).toBe('create_activities');
        });

        it('extracts phase count from message', () => {
            const plan = detectCompoundRequest('Set up a complete project with 7 phases');
            expect(plan).not.toBeNull();
            const phaseStep = plan!.steps.find(s => s.action === 'create_phase');
            expect(phaseStep!.params.count).toBe(7);
        });

        it('adds budget step when budget is mentioned', () => {
            const plan = detectCompoundRequest('Build a project with phases and budget of $50000');
            expect(plan).not.toBeNull();
            const budgetStep = plan!.steps.find(s => s.action === 'set_budget');
            expect(budgetStep).toBeDefined();
            expect(budgetStep!.params.budget).toBe(50000);
        });

        it('sets requiresApproval for multi-step plans', () => {
            const plan = detectCompoundRequest('Create a full project with 5 phases');
            expect(plan!.requiresApproval).toBe(true);
        });
    });

    describe('agile backlog setup', () => {
        it('detects agile backlog pattern', () => {
            const plan = detectCompoundRequest('Set up an agile backlog with 3 epics and 5 stories');
            expect(plan).not.toBeNull();
            expect(plan!.title).toBe('Agile Backlog Setup');
            expect(plan!.steps.map(s => s.action)).toEqual(['create_epic', 'create_story', 'create_sprint']);
        });

        it('extracts epic and story counts', () => {
            const plan = detectCompoundRequest('Create epics and stories - 4 epics, 8 stories');
            expect(plan).not.toBeNull();
            expect(plan!.steps[0].params.count).toBe(4);
            expect(plan!.steps[1].params.count).toBe(8);
        });
    });

    describe('risk and issue logging', () => {
        it('detects risk+issue compound pattern', () => {
            const plan = detectCompoundRequest('Log 3 risks and 5 issues for the project');
            expect(plan).not.toBeNull();
            expect(plan!.title).toBe('Risk and Issue Logging');
            expect(plan!.steps[0].action).toBe('log_risk');
            expect(plan!.steps[0].params.count).toBe(3);
            expect(plan!.steps[1].action).toBe('log_issue');
            expect(plan!.steps[1].params.count).toBe(5);
        });
    });

    describe('single actions (not compound)', () => {
        it('returns null for simple requests', () => {
            expect(detectCompoundRequest('Create 5 phases')).toBeNull();
            expect(detectCompoundRequest('Log an issue')).toBeNull();
            expect(detectCompoundRequest('What is the project status?')).toBeNull();
        });
    });
});

describe('resolveRefs', () => {
    const outputs = {
        1: { id: 'proj-abc', name: 'My Project' },
        2: { id: 'phase-1', title: 'Phase 1' },
    };

    it('resolves $ref:step1.id to actual value', () => {
        const result = resolveRefs({ projectId: '$ref:step1.id' }, outputs);
        expect(result.projectId).toBe('proj-abc');
    });

    it('resolves multiple refs', () => {
        const result = resolveRefs({
            projectId: '$ref:step1.id',
            phaseId: '$ref:step2.id',
            name: 'My Task',
        }, outputs);
        expect(result.projectId).toBe('proj-abc');
        expect(result.phaseId).toBe('phase-1');
        expect(result.name).toBe('My Task');
    });

    it('keeps raw $ref if step not found', () => {
        const result = resolveRefs({ projectId: '$ref:step99.id' }, outputs);
        expect(result.projectId).toBe('$ref:step99.id');
    });

    it('passes through non-ref values unchanged', () => {
        const result = resolveRefs({ count: 5, message: 'hello' }, outputs);
        expect(result.count).toBe(5);
        expect(result.message).toBe('hello');
    });
});

describe('formatPlanSummary', () => {
    it('generates readable plan summary', () => {
        const plan = detectCompoundRequest('Create a full project with 3 phases');
        expect(plan).not.toBeNull();

        const summary = formatPlanSummary(plan!);
        expect(summary).toContain('Full Project Setup');
        expect(summary).toContain('1.');
        expect(summary).toContain('2.');
        expect(summary).toContain('3.');
        expect(summary).toContain('Risk:');
        expect(summary).toContain('Steps:');
    });

    it('marks steps requiring confirmation', () => {
        const plan = detectCompoundRequest('Set up a complete project with 5 phases');
        const summary = formatPlanSummary(plan!);
        expect(summary).toContain('⚠️');
    });

    it('shows approval requirement', () => {
        const plan = detectCompoundRequest('Create a full project called "Test"');
        const summary = formatPlanSummary(plan!);
        expect(summary).toContain('approval');
    });
});
