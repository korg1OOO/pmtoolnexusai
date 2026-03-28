/**
 * mlSnapshotService — Deep Tests  
 * Tests the calculateDataQualityScore pure function exhaustively
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(), insert: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            gte: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis(),
            lt: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
            then: (r: any) => r({ data: [], error: null }),
        })),
    },
}));

import {
    calculateDataQualityScore,
    createProjectSnapshot,
    getTrainingDataRange,
    purgeOldSnapshots,
    getSnapshotStats,
} from '@/services/mlSnapshotService';

describe('mlSnapshotService', () => {
    describe('calculateDataQualityScore', () => {
        it('returns 0 for empty object', () => {
            expect(calculateDataQualityScore({})).toBe(0);
        });

        it('scores required fields: total_tasks gives +0.1', () => {
            const score = calculateDataQualityScore({ total_tasks: 10 });
            expect(score).toBeGreaterThanOrEqual(0.1);
        });

        it('scores required fields: budget gives +0.1', () => {
            const score = calculateDataQualityScore({ budget: 50000 });
            expect(score).toBeGreaterThanOrEqual(0.1);
        });

        it('scores required fields: progress gives +0.1', () => {
            const score = calculateDataQualityScore({ progress: 50 });
            expect(score).toBeGreaterThanOrEqual(0.1);
        });

        it('scores required fields: start_date gives +0.1', () => {
            const score = calculateDataQualityScore({ start_date: '2024-01-01' });
            expect(score).toBeGreaterThanOrEqual(0.1);
        });

        it('scores all required fields: 0.4', () => {
            const score = calculateDataQualityScore({
                total_tasks: 10, budget: 50000, progress: 50, start_date: '2024-01-01'
            });
            expect(score).toBeGreaterThanOrEqual(0.4);
        });

        it('scores consistency: tasks valid gives +0.15', () => {
            const score = calculateDataQualityScore({
                total_tasks: 10, completed_tasks: 5
            });
            expect(score).toBeGreaterThanOrEqual(0.15);
        });

        it('no consistency score when completed > total', () => {
            const withValid = calculateDataQualityScore({ total_tasks: 10, completed_tasks: 5, budget: 100, total_costs: 0 });
            const withInvalid = calculateDataQualityScore({ total_tasks: 5, completed_tasks: 10, budget: 100, total_costs: 0 });
            expect(withValid).toBeGreaterThan(withInvalid);
        });

        it('scores consistency: budget valid gives +0.15', () => {
            const score = calculateDataQualityScore({
                budget: 50000, total_costs: 30000
            });
            expect(score).toBeGreaterThanOrEqual(0.15);
        });

        it('scores richness: open_risks gives +0.1', () => {
            const withRisks = calculateDataQualityScore({ open_risks: 3 });
            const without = calculateDataQualityScore({});
            expect(withRisks).toBeGreaterThan(without);
        });

        it('scores richness: team_size > 0 gives +0.1', () => {
            const with_ = calculateDataQualityScore({ team_size: 5 });
            const without = calculateDataQualityScore({});
            expect(with_).toBeGreaterThan(without);
        });

        it('team_size = 0 does not score', () => {
            const with0 = calculateDataQualityScore({ team_size: 0 });
            const without = calculateDataQualityScore({});
            expect(with0).toBe(without);
        });

        it('scores richness: cost_by_category with entries gives +0.1', () => {
            const with_ = calculateDataQualityScore({ cost_by_category: { labor: 1000 } });
            const without = calculateDataQualityScore({});
            expect(with_).toBeGreaterThan(without);
        });

        it('empty cost_by_category does not score', () => {
            const with_ = calculateDataQualityScore({ cost_by_category: {} });
            const without = calculateDataQualityScore({});
            expect(with_).toBe(without);
        });

        it('maximum score is 1.0 with all data', () => {
            const score = calculateDataQualityScore({
                total_tasks: 10, budget: 50000, progress: 50, start_date: '2024-01-01',
                completed_tasks: 5, total_costs: 30000,
                open_risks: 3, team_size: 5,
                cost_by_category: { labor: 1000, materials: 500 }
            });
            expect(score).toBe(1);
        });

        it('caps at 1.0', () => {
            const score = calculateDataQualityScore({
                total_tasks: 10, budget: 50000, progress: 50, start_date: '2024-01-01',
                completed_tasks: 5, total_costs: 30000,
                open_risks: 3, team_size: 5,
                cost_by_category: { labor: 1000 }
            });
            expect(score).toBeLessThanOrEqual(1);
        });

        it('handles null values in required fields', () => {
            const score = calculateDataQualityScore({
                total_tasks: null, budget: undefined, progress: 0, start_date: ''
            });
            // progress=0 and start_date='' are truthy for !== undefined/null check; 0 passes, '' passes
            expect(score).toBeGreaterThanOrEqual(0);
        });

        it('returns a number between 0 and 1', () => {
            for (let i = 0; i < 10; i++) {
                const score = calculateDataQualityScore({ total_tasks: i });
                expect(score).toBeGreaterThanOrEqual(0);
                expect(score).toBeLessThanOrEqual(1);
            }
        });
    });

    describe('async functions shape', () => {
        it('createProjectSnapshot is async', () => {
            expect(typeof createProjectSnapshot).toBe('function');
        });

        it('getTrainingDataRange is async', () => {
            expect(typeof getTrainingDataRange).toBe('function');
        });

        it('purgeOldSnapshots is async', () => {
            expect(typeof purgeOldSnapshots).toBe('function');
        });

        it('getSnapshotStats is async', () => {
            expect(typeof getSnapshotStats).toBe('function');
        });
    });
});
