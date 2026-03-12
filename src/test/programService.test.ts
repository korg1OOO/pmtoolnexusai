/**
 * programService — Deep Tests
 * Tests interface shapes and function exports
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));

import * as progSvc from '@/services/programService';
import type { Program, ProgramSettings, ProgramMember, ProgramMilestone, ProgramStats } from '@/services/programService';

describe('programService', () => {
    describe('Program interface', () => {
        it('has required fields', () => {
            const program: Program = {
                id: '1', tenant_id: 't1', workspace_id: 'w1',
                portfolio_id: 'pf1', name: 'Test Program', code: 'TP-001',
                program_type: 'delivery', status: 'active', health: 'green',
                currency: 'USD', settings: {
                    auto_rollup_status: true, auto_rollup_budget: true,
                    auto_rollup_progress: true, allow_cross_project_dependencies: false,
                    require_project_approval: false,
                },
                created_at: '2024-01-01', updated_at: '2024-01-01', is_active: true,
            };
            expect(program.code).toBe('TP-001');
        });
    });

    describe('ProgramSettings interface', () => {
        it('has boolean flags', () => {
            const settings: ProgramSettings = {
                auto_rollup_status: true, auto_rollup_budget: false,
                auto_rollup_progress: true, allow_cross_project_dependencies: true,
                require_project_approval: false,
            };
            expect(settings.auto_rollup_status).toBe(true);
        });
    });

    describe('ProgramMember interface', () => {
        it('has permission fields', () => {
            const member: ProgramMember = {
                id: '1', program_id: 'p1', user_id: 'u1',
                tenant_id: 't1', role: 'lead', joined_at: '2024-01-01',
                is_active: true, permissions: {
                    can_create_projects: true, can_edit_program: true,
                    can_manage_members: false, can_view_financials: true,
                    can_approve_changes: false,
                },
            };
            expect(member.permissions.can_create_projects).toBe(true);
        });
    });

    describe('ProgramStats interface', () => {
        it('has health summary', () => {
            const stats: ProgramStats = {
                total_projects: 5, active_projects: 3,
                completed_projects: 1, on_hold_projects: 1,
                total_budget: 50000, spent_budget: 25000,
                overall_progress: 55,
                health_summary: { green: 3, amber: 1, red: 1 },
            };
            expect(stats.health_summary.green).toBe(3);
        });
    });

    describe('function exports', () => {
        const methods = [
            'getPrograms', 'getProgram', 'getProgramByCode',
            'createProgram', 'updateProgram', 'deleteProgram',
            'getProgramStats', 'getProgramProjects',
            'getProgramMembers', 'addProgramMember', 'removeProgramMember',
            'getProgramMilestones', 'createProgramMilestone',
            'getProgramHierarchy',
        ];

        methods.forEach(name => {
            it(`${name} is exported`, () => {
                expect(typeof (progSvc as any)[name]).toBe('function');
            });
        });
    });
});
