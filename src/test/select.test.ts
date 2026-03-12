/**
 * select Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { SelectTrigger, SelectScrollUpButton, SelectScrollDownButton, SelectContent, SelectLabel, SelectItem, SelectSeparator, Select, SelectGroup, SelectValue } from '@/components/ui/select';

describe('select', () => {
    it('exports SelectTrigger', () => {
        expect(SelectTrigger).toBeDefined();
    });
    it('exports SelectScrollUpButton', () => {
        expect(SelectScrollUpButton).toBeDefined();
    });
    it('exports SelectScrollDownButton', () => {
        expect(SelectScrollDownButton).toBeDefined();
    });
    it('exports SelectContent', () => {
        expect(SelectContent).toBeDefined();
    });
    it('exports SelectLabel', () => {
        expect(SelectLabel).toBeDefined();
    });
    it('exports SelectItem', () => {
        expect(SelectItem).toBeDefined();
    });
    it('exports SelectSeparator', () => {
        expect(SelectSeparator).toBeDefined();
    });
    it('exports Select', () => {
        expect(Select).toBeDefined();
    });
    it('exports SelectGroup', () => {
        expect(SelectGroup).toBeDefined();
    });
    it('exports SelectValue', () => {
        expect(SelectValue).toBeDefined();
    });
});
