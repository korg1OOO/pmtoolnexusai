/**
 * command Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandSeparator, CommandItem, CommandDialog, CommandShortcut } from '@/components/ui/command';

describe('command', () => {
    it('exports Command', () => {
        expect(Command).toBeDefined();
    });
    it('exports CommandInput', () => {
        expect(CommandInput).toBeDefined();
    });
    it('exports CommandList', () => {
        expect(CommandList).toBeDefined();
    });
    it('exports CommandEmpty', () => {
        expect(CommandEmpty).toBeDefined();
    });
    it('exports CommandGroup', () => {
        expect(CommandGroup).toBeDefined();
    });
    it('exports CommandSeparator', () => {
        expect(CommandSeparator).toBeDefined();
    });
    it('exports CommandItem', () => {
        expect(CommandItem).toBeDefined();
    });
    it('exports CommandDialog', () => {
        expect(CommandDialog).toBeDefined();
    });
    it('exports CommandShortcut', () => {
        expect(CommandShortcut).toBeDefined();
    });
});
