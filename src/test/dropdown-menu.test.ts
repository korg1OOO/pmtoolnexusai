/**
 * dropdown-menu Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenu, DropdownMenuTrigger, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuRadioGroup } from '@/components/ui/dropdown-menu';

describe('dropdown-menu', () => {
    it('exports DropdownMenuSubTrigger', () => {
        expect(DropdownMenuSubTrigger).toBeDefined();
    });
    it('exports DropdownMenuSubContent', () => {
        expect(DropdownMenuSubContent).toBeDefined();
    });
    it('exports DropdownMenuContent', () => {
        expect(DropdownMenuContent).toBeDefined();
    });
    it('exports DropdownMenuItem', () => {
        expect(DropdownMenuItem).toBeDefined();
    });
    it('exports DropdownMenuCheckboxItem', () => {
        expect(DropdownMenuCheckboxItem).toBeDefined();
    });
    it('exports DropdownMenuRadioItem', () => {
        expect(DropdownMenuRadioItem).toBeDefined();
    });
    it('exports DropdownMenuLabel', () => {
        expect(DropdownMenuLabel).toBeDefined();
    });
    it('exports DropdownMenuSeparator', () => {
        expect(DropdownMenuSeparator).toBeDefined();
    });
    it('exports DropdownMenu', () => {
        expect(DropdownMenu).toBeDefined();
    });
    it('exports DropdownMenuTrigger', () => {
        expect(DropdownMenuTrigger).toBeDefined();
    });
    it('exports DropdownMenuShortcut', () => {
        expect(DropdownMenuShortcut).toBeDefined();
    });
    it('exports DropdownMenuGroup', () => {
        expect(DropdownMenuGroup).toBeDefined();
    });
    it('exports DropdownMenuPortal', () => {
        expect(DropdownMenuPortal).toBeDefined();
    });
    it('exports DropdownMenuSub', () => {
        expect(DropdownMenuSub).toBeDefined();
    });
    it('exports DropdownMenuRadioGroup', () => {
        expect(DropdownMenuRadioGroup).toBeDefined();
    });
});
