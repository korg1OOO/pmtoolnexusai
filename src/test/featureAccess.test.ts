/**
 * Feature Access Tests
 *
 * Tests pure logic exported from useFeatureAccess:
 * - TIER_ORDER array
 * - isTierHigherOrEqual() — tier comparison
 * - TIER_PRICING — pricing constants
 * - TIER_LIMITS — limits constants
 * - SubscriptionTier type (implicitly via tests)
 */

import { describe, it, expect } from 'vitest';
import {
    TIER_ORDER,
    isTierHigherOrEqual,
    TIER_PRICING,
    TIER_LIMITS,
    type SubscriptionTier,
} from '@/hooks/useFeatureAccess';

describe('Feature Access — Pure Logic', () => {

    // ─── TIER_ORDER ──────────────────────────────────────────────────

    describe('TIER_ORDER', () => {
        it('has exactly 4 tiers', () => {
            expect(TIER_ORDER).toHaveLength(4);
        });

        it('is in ascending order: free < pro < business < agency', () => {
            expect(TIER_ORDER).toEqual(['free', 'pro', 'business', 'agency']);
        });

        it('free is first (lowest)', () => {
            expect(TIER_ORDER[0]).toBe('free');
        });

        it('agency is last (highest)', () => {
            expect(TIER_ORDER[3]).toBe('agency');
        });
    });

    // ─── isTierHigherOrEqual ─────────────────────────────────────────

    describe('isTierHigherOrEqual', () => {
        // Same tier — always true
        const allTiers: SubscriptionTier[] = ['free', 'pro', 'business', 'agency'];

        allTiers.forEach(tier => {
            it(`${tier} >= ${tier} (same tier)`, () => {
                expect(isTierHigherOrEqual(tier, tier)).toBe(true);
            });
        });

        // Higher tiers
        it('agency >= free', () => expect(isTierHigherOrEqual('agency', 'free')).toBe(true));
        it('agency >= pro', () => expect(isTierHigherOrEqual('agency', 'pro')).toBe(true));
        it('agency >= business', () => expect(isTierHigherOrEqual('agency', 'business')).toBe(true));
        it('business >= free', () => expect(isTierHigherOrEqual('business', 'free')).toBe(true));
        it('business >= pro', () => expect(isTierHigherOrEqual('business', 'pro')).toBe(true));
        it('pro >= free', () => expect(isTierHigherOrEqual('pro', 'free')).toBe(true));

        // Lower tiers — should be false
        it('free < pro', () => expect(isTierHigherOrEqual('free', 'pro')).toBe(false));
        it('free < business', () => expect(isTierHigherOrEqual('free', 'business')).toBe(false));
        it('free < agency', () => expect(isTierHigherOrEqual('free', 'agency')).toBe(false));
        it('pro < business', () => expect(isTierHigherOrEqual('pro', 'business')).toBe(false));
        it('pro < agency', () => expect(isTierHigherOrEqual('pro', 'agency')).toBe(false));
        it('business < agency', () => expect(isTierHigherOrEqual('business', 'agency')).toBe(false));
    });

    // ─── TIER_PRICING ────────────────────────────────────────────────

    describe('TIER_PRICING', () => {
        it('free tier costs $0', () => {
            expect(TIER_PRICING.free.monthly).toBe(0);
            expect(TIER_PRICING.free.annual).toBe(0);
        });

        it('pro costs $10/mo, $100/yr', () => {
            expect(TIER_PRICING.pro.monthly).toBe(10);
            expect(TIER_PRICING.pro.annual).toBe(100);
        });

        it('business costs $39/mo, $390/yr', () => {
            expect(TIER_PRICING.business.monthly).toBe(39);
            expect(TIER_PRICING.business.annual).toBe(390);
        });

        it('agency costs $99/mo, $990/yr', () => {
            expect(TIER_PRICING.agency.monthly).toBe(99);
            expect(TIER_PRICING.agency.annual).toBe(990);
        });

        it('annual pricing is always ~10x monthly (10 months for 12)', () => {
            (['pro', 'business', 'agency'] as const).forEach(tier => {
                expect(TIER_PRICING[tier].annual).toBe(TIER_PRICING[tier].monthly * 10);
            });
        });
    });

    // ─── TIER_LIMITS ─────────────────────────────────────────────────

    describe('TIER_LIMITS', () => {
        it('free has 3 projects, 1 team member, 0 AI credits', () => {
            expect(TIER_LIMITS.free.projects).toBe(3);
            expect(TIER_LIMITS.free.teamMembers).toBe(1);
            expect(TIER_LIMITS.free.aiCredits).toBe(0);
        });

        it('pro has unlimited projects (-1), 10 team members, 500 AI credits', () => {
            expect(TIER_LIMITS.pro.projects).toBe(-1);
            expect(TIER_LIMITS.pro.teamMembers).toBe(10);
            expect(TIER_LIMITS.pro.aiCredits).toBe(500);
        });

        it('agency has unlimited everything (-1)', () => {
            expect(TIER_LIMITS.agency.projects).toBe(-1);
            expect(TIER_LIMITS.agency.teamMembers).toBe(-1);
            expect(TIER_LIMITS.agency.aiCredits).toBe(-1);
        });

        it('storage increases with tier', () => {
            expect(TIER_LIMITS.free.storage).toBeLessThan(TIER_LIMITS.pro.storage);
            expect(TIER_LIMITS.pro.storage).toBeLessThan(TIER_LIMITS.business.storage);
            expect(TIER_LIMITS.business.storage).toBeLessThan(TIER_LIMITS.agency.storage);
        });

        it('file size increases with tier', () => {
            expect(TIER_LIMITS.free.fileSize).toBeLessThan(TIER_LIMITS.pro.fileSize);
            expect(TIER_LIMITS.pro.fileSize).toBeLessThan(TIER_LIMITS.business.fileSize);
            expect(TIER_LIMITS.business.fileSize).toBeLessThan(TIER_LIMITS.agency.fileSize);
        });
    });
});
