/**
 * alert Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

describe('alert', () => {
    it('exports Alert', () => {
        expect(Alert).toBeDefined();
    });
    it('exports AlertTitle', () => {
        expect(AlertTitle).toBeDefined();
    });
    it('exports AlertDescription', () => {
        expect(AlertDescription).toBeDefined();
    });
});
