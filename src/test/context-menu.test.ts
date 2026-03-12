/**
 * context-menu Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { ContextMenuSubTrigger, ContextMenuSubContent, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel, ContextMenuSeparator, ContextMenu, ContextMenuTrigger, ContextMenuShortcut, ContextMenuGroup, ContextMenuPortal, ContextMenuSub, ContextMenuRadioGroup } from '@/components/ui/context-menu';

describe('context-menu', () => {
    it('exports ContextMenuSubTrigger', () => {
        expect(ContextMenuSubTrigger).toBeDefined();
    });
    it('exports ContextMenuSubContent', () => {
        expect(ContextMenuSubContent).toBeDefined();
    });
    it('exports ContextMenuContent', () => {
        expect(ContextMenuContent).toBeDefined();
    });
    it('exports ContextMenuItem', () => {
        expect(ContextMenuItem).toBeDefined();
    });
    it('exports ContextMenuCheckboxItem', () => {
        expect(ContextMenuCheckboxItem).toBeDefined();
    });
    it('exports ContextMenuRadioItem', () => {
        expect(ContextMenuRadioItem).toBeDefined();
    });
    it('exports ContextMenuLabel', () => {
        expect(ContextMenuLabel).toBeDefined();
    });
    it('exports ContextMenuSeparator', () => {
        expect(ContextMenuSeparator).toBeDefined();
    });
    it('exports ContextMenu', () => {
        expect(ContextMenu).toBeDefined();
    });
    it('exports ContextMenuTrigger', () => {
        expect(ContextMenuTrigger).toBeDefined();
    });
    it('exports ContextMenuShortcut', () => {
        expect(ContextMenuShortcut).toBeDefined();
    });
    it('exports ContextMenuGroup', () => {
        expect(ContextMenuGroup).toBeDefined();
    });
    it('exports ContextMenuPortal', () => {
        expect(ContextMenuPortal).toBeDefined();
    });
    it('exports ContextMenuSub', () => {
        expect(ContextMenuSub).toBeDefined();
    });
    it('exports ContextMenuRadioGroup', () => {
        expect(ContextMenuRadioGroup).toBeDefined();
    });
});
