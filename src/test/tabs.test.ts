/**
 * tabs Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { TabsList, TabsTrigger, TabsContent, Tabs } from '@/components/ui/tabs';

describe('tabs', () => {
    it('exports TabsList', () => {
        expect(TabsList).toBeDefined();
    });
    it('exports TabsTrigger', () => {
        expect(TabsTrigger).toBeDefined();
    });
    it('exports TabsContent', () => {
        expect(TabsContent).toBeDefined();
    });
    it('exports Tabs', () => {
        expect(Tabs).toBeDefined();
    });
});
