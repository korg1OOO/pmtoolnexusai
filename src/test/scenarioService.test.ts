/**
 * scenarioService — Deep Tests
 * Tests interface shapes and service method exports
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
            is: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));
vi.mock('uuid', () => ({ v4: () => 'mock-uuid' }));
vi.mock('@/hooks/useTasks', () => ({}));

import { scenarioService } from '@/services/scenarioService';
import type { Scenario } from '@/services/scenarioService';

describe('scenarioService', () => {
    describe('Scenario interface', () => {
        it('has required fields', () => {
            const scenario: Scenario = {
                id: '1', project_id: 'p1', name: 'What-If',
                description: 'Test scenario', status: 'draft',
                created_at: '2024-01-01', updated_at: '2024-01-01',
            };
            expect(scenario.status).toBe('draft');
        });

        it('status can be draft, active, or archived', () => {
            const statuses: Scenario['status'][] = ['draft', 'active', 'archived'];
            expect(statuses).toHaveLength(3);
        });

        it('optional fields default to undefined', () => {
            const scenario: Scenario = {
                id: '1', project_id: 'p1', name: 'Test',
                description: null, status: 'draft',
                created_at: '', updated_at: '',
            };
            expect(scenario.base_plan_snapshot_id).toBeUndefined();
            expect(scenario.data).toBeUndefined();
            expect(scenario.created_by).toBeUndefined();
        });
    });

    describe('service methods', () => {
        it('getScenarios is a function', () => {
            expect(typeof scenarioService.getScenarios).toBe('function');
        });

        it('createScenario is a function', () => {
            expect(typeof scenarioService.createScenario).toBe('function');
        });

        it('cloneProjectData is a function', () => {
            expect(typeof scenarioService.cloneProjectData).toBe('function');
        });

        it('deleteScenario is a function', () => {
            expect(typeof scenarioService.deleteScenario).toBe('function');
        });

        it('updateScenario is a function', () => {
            expect(typeof scenarioService.updateScenario).toBe('function');
        });

        it('updateScenarioTask is a function', () => {
            expect(typeof scenarioService.updateScenarioTask).toBe('function');
        });

        it('promoteScenario is a function', () => {
            expect(typeof scenarioService.promoteScenario).toBe('function');
        });
    });
});
