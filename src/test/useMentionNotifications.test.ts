/**
 * useMentionNotifications Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useMentionNotifications } from '@/hooks/useMentionNotifications';

describe('useMentionNotifications', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useMentionNotifications).toBeDefined();
        });
    });

    describe('useMentionNotifications', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useMentionNotifications());
            expect(result.current).toBeDefined();
        });
    });
});
