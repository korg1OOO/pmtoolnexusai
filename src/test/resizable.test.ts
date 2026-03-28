/**
 * resizable Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

describe('resizable', () => {
    it('exports ResizablePanelGroup', () => {
        expect(ResizablePanelGroup).toBeDefined();
    });
    it('exports ResizablePanel', () => {
        expect(ResizablePanel).toBeDefined();
    });
    it('exports ResizableHandle', () => {
        expect(ResizableHandle).toBeDefined();
    });
});
