/**
 * useFeatureAccess — Deep Tests for pure logic
 * Tests isTierHigherOrEqual, TIER_ORDER, TIER_PRICING, TIER_LIMITS
 */
import { describe, it, expect } from 'vitest';
import {
    isTierHigherOrEqual,
    TIER_ORDER,
    TIER_PRICING,
    TIER_LIMITS,
} from '@/hooks/useFeatureAccess';
import type { SubscriptionTier } from '@/hooks/useFeatureAccess';

describe('useFeatureAccess — pure logic', () => {
    describe('TIER_ORDER', () => {
        it('has 4 tiers', () => {
            expect(TIER_ORDER).toHaveLength(4);
        });

        it('starts with free', () => {
            expect(TIER_ORDER[0]).toBe('free');
        });

        it('ends with agency', () => {
            expect(TIER_ORDER[TIER_ORDER.length - 1]).toBe('agency');
        });

        it('follows free → pro → business → agency order', () => {
            expect(TIER_ORDER).toEqual(['free', 'pro', 'business', 'agency']);
        });
    });

    describe('isTierHigherOrEqual', () => {
        // Same tier
        it('free >= free is true', () => {
            expect(isTierHigherOrEqual('free', 'free')).toBe(true);
        });

        it('pro >= pro is true', () => {
            expect(isTierHigherOrEqual('pro', 'pro')).toBe(true);
        });

        it('business >= business is true', () => {
            expect(isTierHigherOrEqual('business', 'business')).toBe(true);
        });

        it('agency >= agency is true', () => {
            expect(isTierHigherOrEqual('agency', 'agency')).toBe(true);
        });

        // Upgrading
        it('pro >= free is true', () => {
            expect(isTierHigherOrEqual('pro', 'free')).toBe(true);
        });

        it('business >= free is true', () => {
            expect(isTierHigherOrEqual('business', 'free')).toBe(true);
        });

        it('agency >= free is true', () => {
            expect(isTierHigherOrEqual('agency', 'free')).toBe(true);
        });

        it('business >= pro is true', () => {
            expect(isTierHigherOrEqual('business', 'pro')).toBe(true);
        });

        it('agency >= pro is true', () => {
            expect(isTierHigherOrEqual('agency', 'pro')).toBe(true);
        });

        it('agency >= business is true', () => {
            expect(isTierHigherOrEqual('agency', 'business')).toBe(true);
        });

        // Downgrading
        it('free >= pro is false', () => {
            expect(isTierHigherOrEqual('free', 'pro')).toBe(false);
        });

        it('free >= business is false', () => {
            expect(isTierHigherOrEqual('free', 'business')).toBe(false);
        });

        it('free >= agency is false', () => {
            expect(isTierHigherOrEqual('free', 'agency')).toBe(false);
        });

        it('pro >= business is false', () => {
            expect(isTierHigherOrEqual('pro', 'business')).toBe(false);
        });

        it('pro >= agency is false', () => {
            expect(isTierHigherOrEqual('pro', 'agency')).toBe(false);
        });

        it('business >= agency is false', () => {
            expect(isTierHigherOrEqual('business', 'agency')).toBe(false);
        });
    });

    describe('TIER_PRICING', () => {
        it('free is $0', () => {
            expect(TIER_PRICING.free.monthly).toBe(0);
            expect(TIER_PRICING.free.annual).toBe(0);
        });

        it('pro is $10/month', () => {
            expect(TIER_PRICING.pro.monthly).toBe(10);
        });

        it('business is $39/month', () => {
            expect(TIER_PRICING.business.monthly).toBe(39);
        });

        it('agency is $99/month', () => {
            expect(TIER_PRICING.agency.monthly).toBe(99);
        });

        it('annual pricing has discount', () => {
            expect(TIER_PRICING.pro.annual).toBeLessThan(TIER_PRICING.pro.monthly * 12);
            expect(TIER_PRICING.business.annual).toBeLessThan(TIER_PRICING.business.monthly * 12);
            expect(TIER_PRICING.agency.annual).toBeLessThan(TIER_PRICING.agency.monthly * 12);
        });

        it('each tier has monthly and annual', () => {
            (['free', 'pro', 'business', 'agency'] as const).forEach(tier => {
                expect(TIER_PRICING[tier]).toHaveProperty('monthly');
                expect(TIER_PRICING[tier]).toHaveProperty('annual');
            });
        });
    });

    describe('TIER_LIMITS', () => {
        it('free tier has limited projects', () => {
            expect(TIER_LIMITS.free.projects).toBeGreaterThan(0);
        });

        it('pro tier has unlimited projects (-1)', () => {
            expect(TIER_LIMITS.pro.projects).toBe(-1);
        });

        it('agency tier has unlimited team members (-1)', () => {
            expect(TIER_LIMITS.agency.teamMembers).toBe(-1);
        });

        it('tiers have increasing storage limits', () => {
            expect(TIER_LIMITS.pro.storage).toBeGreaterThan(TIER_LIMITS.free.storage);
            expect(TIER_LIMITS.business.storage).toBeGreaterThan(TIER_LIMITS.pro.storage);
            expect(TIER_LIMITS.agency.storage).toBeGreaterThan(TIER_LIMITS.business.storage);
        });

        it('tiers have increasing file size limits', () => {
            expect(TIER_LIMITS.pro.fileSize).toBeGreaterThan(TIER_LIMITS.free.fileSize);
            expect(TIER_LIMITS.business.fileSize).toBeGreaterThan(TIER_LIMITS.pro.fileSize);
        });

        it('free tier has 0 AI credits', () => {
            expect(TIER_LIMITS.free.aiCredits).toBe(0);
        });

        it('agency tier has unlimited AI credits (-1)', () => {
            expect(TIER_LIMITS.agency.aiCredits).toBe(-1);
        });

        it('each tier has all required limit keys', () => {
            const requiredKeys = ['projects', 'teamMembers', 'fileSize', 'storage', 'aiCredits'];
            (['free', 'pro', 'business', 'agency'] as const).forEach(tier => {
                requiredKeys.forEach(key => {
                    expect(TIER_LIMITS[tier]).toHaveProperty(key);
                });
            });
        });
    });
});
