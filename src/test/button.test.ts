/**
 * button Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { Button, buttonVariants } from '@/components/ui/button';

describe('button', () => {
    it('exports Button', () => {
        expect(Button).toBeDefined();
    });
    it('exports buttonVariants', () => {
        expect(buttonVariants).toBeDefined();
    });
});
