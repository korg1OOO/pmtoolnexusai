/**
 * card Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

describe('card', () => {
    it('exports Card', () => {
        expect(Card).toBeDefined();
    });
    it('exports CardHeader', () => {
        expect(CardHeader).toBeDefined();
    });
    it('exports CardTitle', () => {
        expect(CardTitle).toBeDefined();
    });
    it('exports CardDescription', () => {
        expect(CardDescription).toBeDefined();
    });
    it('exports CardContent', () => {
        expect(CardContent).toBeDefined();
    });
    it('exports CardFooter', () => {
        expect(CardFooter).toBeDefined();
    });
});
