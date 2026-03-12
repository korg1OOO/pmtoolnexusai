/**
 * menubar Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { Menubar, MenubarTrigger, MenubarSubTrigger, MenubarSubContent, MenubarContent, MenubarItem, MenubarCheckboxItem, MenubarRadioItem, MenubarLabel, MenubarSeparator, MenubarMenu, MenubarRadioGroup, MenubarPortal, MenubarGroup, MenubarSub, MenubarShortcut } from '@/components/ui/menubar';

describe('menubar', () => {
    it('exports Menubar', () => {
        expect(Menubar).toBeDefined();
    });
    it('exports MenubarTrigger', () => {
        expect(MenubarTrigger).toBeDefined();
    });
    it('exports MenubarSubTrigger', () => {
        expect(MenubarSubTrigger).toBeDefined();
    });
    it('exports MenubarSubContent', () => {
        expect(MenubarSubContent).toBeDefined();
    });
    it('exports MenubarContent', () => {
        expect(MenubarContent).toBeDefined();
    });
    it('exports MenubarItem', () => {
        expect(MenubarItem).toBeDefined();
    });
    it('exports MenubarCheckboxItem', () => {
        expect(MenubarCheckboxItem).toBeDefined();
    });
    it('exports MenubarRadioItem', () => {
        expect(MenubarRadioItem).toBeDefined();
    });
    it('exports MenubarLabel', () => {
        expect(MenubarLabel).toBeDefined();
    });
    it('exports MenubarSeparator', () => {
        expect(MenubarSeparator).toBeDefined();
    });
    it('exports MenubarMenu', () => {
        expect(MenubarMenu).toBeDefined();
    });
    it('exports MenubarRadioGroup', () => {
        expect(MenubarRadioGroup).toBeDefined();
    });
    it('exports MenubarPortal', () => {
        expect(MenubarPortal).toBeDefined();
    });
    it('exports MenubarGroup', () => {
        expect(MenubarGroup).toBeDefined();
    });
    it('exports MenubarSub', () => {
        expect(MenubarSub).toBeDefined();
    });
    it('exports MenubarShortcut', () => {
        expect(MenubarShortcut).toBeDefined();
    });
});
