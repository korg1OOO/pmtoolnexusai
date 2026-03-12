/**
 * avatar Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

describe('avatar', () => {
    it('exports Avatar', () => {
        expect(Avatar).toBeDefined();
    });
    it('exports AvatarImage', () => {
        expect(AvatarImage).toBeDefined();
    });
    it('exports AvatarFallback', () => {
        expect(AvatarFallback).toBeDefined();
    });
});
