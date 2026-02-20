/**
 * Core utility tests — tier comparison logic.
 *
 * These pure functions in useFeatureAccess.ts are the highest-value targets
 * for unit tests: they drive subscription gating throughout the app and have
 * no external dependencies.
 */

import { describe, it, expect } from 'vitest';
import {
    TIER_ORDER,
    isTierHigherOrEqual,
    type SubscriptionTier,
} from '@/hooks/useFeatureAccess';

describe('TIER_ORDER', () => {
    it('has exactly 4 tiers in ascending order of value', () => {
        expect(TIER_ORDER).toEqual(['free', 'pro', 'business', 'agency']);
    });

    it('agency has the highest index', () => {
        expect(TIER_ORDER.indexOf('agency')).toBe(TIER_ORDER.length - 1);
    });

    it('free has the lowest index', () => {
        expect(TIER_ORDER.indexOf('free')).toBe(0);
    });
});

describe('isTierHigherOrEqual', () => {
    const cases: Array<[SubscriptionTier, SubscriptionTier, boolean]> = [
        // Same tier
        ['free', 'free', true],
        ['pro', 'pro', true],
        ['business', 'business', true],
        ['agency', 'agency', true],
        // Higher user tier
        ['pro', 'free', true],
        ['business', 'free', true],
        ['business', 'pro', true],
        ['agency', 'free', true],
        ['agency', 'pro', true],
        ['agency', 'business', true],
        // Lower user tier
        ['free', 'pro', false],
        ['free', 'business', false],
        ['free', 'agency', false],
        ['pro', 'business', false],
        ['pro', 'agency', false],
        ['business', 'agency', false],
    ];

    it.each(cases)(
        'isTierHigherOrEqual(%s, %s) === %s',
        (userTier, requiredTier, expected) => {
            expect(isTierHigherOrEqual(userTier, requiredTier)).toBe(expected);
        },
    );
});
